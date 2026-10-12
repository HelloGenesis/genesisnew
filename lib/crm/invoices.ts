import "server-only";

import { randomBytes } from "node:crypto";

import { getPrisma } from "@/lib/db";
import { notes, razorpay, razorpayKeys } from "@/lib/razorpay";

import { date, money } from "./catalog";
import { appUrl, queueEmail, queueStaffEmail } from "./notify";

/**
 * GST TAX INVOICES (Genesis, 12 Oct 2026: "add a create an invoice").
 *
 * Numbered per financial year — GM/2026-27/0001 — with CGST + SGST at 9% each
 * inside Maharashtra and IGST at 18% outside it. Sent by email with a Razorpay
 * pay link; the webhook marks it paid (lib/crm/orders). The client opens it at
 * /invoice/<token>, printable to a PDF named by its number.
 */

export const INVOICE_STATUS = {
  DRAFT: { label: "Draft", tone: "muted" },
  SENT: { label: "Sent", tone: "warn" },
  PAID: { label: "Paid", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "bad" },
} as const;

export const GST_RATE = 18;
export const HOME_STATE = "Maharashtra";

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry", "Other state (IGST)", "Outside India",
];

/** The two-digit state code a GSTIN starts with → the state, for the place of supply. */
const GST_STATE: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
};
export const stateFromGstin = (gstin?: string | null) => (gstin && /^\d{2}/.test(gstin) ? GST_STATE[gstin.slice(0, 2)] : undefined);

/** April to March: "2026-27". */
export function financialYear(d: Date) {
  const y = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

export function invoiceTotals(lines: { qty: number; unitPaise: number }[], discountPaise: number, igst: boolean) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPaise, 0);
  const discount = Math.min(Math.max(0, discountPaise), subtotal);
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * GST_RATE) / 100);
  const cgst = igst ? 0 : Math.round(tax / 2);
  const sgst = igst ? 0 : tax - cgst;
  return { subtotal, discount, taxable, cgst, sgst, igst: igst ? tax : 0, total: taxable + tax };
}

/** The next number in this financial year's series. Retried if two are made at the same moment. */
export async function nextNumber(issueDate: Date) {
  const fy = financialYear(issueDate);
  const last = await getPrisma().invoice.findFirst({ where: { fy }, orderBy: { seq: "desc" }, select: { seq: true } });
  const seq = (last?.seq ?? 0) + 1;
  return { fy, seq, number: `GM/${fy}/${String(seq).padStart(4, "0")}` };
}

export const newInvoiceToken = () => randomBytes(18).toString("base64url");

/** Recomputes the stored totals after an edit. */
export async function refreshInvoice(id: string) {
  const prisma = getPrisma();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id }, include: { lines: true } });
  const t = invoiceTotals(inv.lines, inv.discountPaise, inv.igst);
  return prisma.invoice.update({ where: { id }, data: { subtotalPaise: t.subtotal, discountPaise: t.discount, cgstPaise: t.cgst, sgstPaise: t.sgst, igstPaise: t.igst, totalPaise: t.total } });
}

/** Emails the invoice, with a fresh Razorpay pay link when asked. */
export async function sendInvoice(id: string, message: string | null, withPayment: boolean) {
  const prisma = getPrisma();
  const inv = await refreshInvoice(id);
  let paymentUrl = inv.paymentUrl;
  if (withPayment && inv.totalPaise > 0 && razorpayKeys() && inv.status !== "PAID") {
    if (inv.razorpayLinkId) await razorpay(`payment_links/${inv.razorpayLinkId}/cancel`, {}).catch(() => undefined);
    const link = await razorpay<{ id: string; short_url: string }>("payment_links", {
      amount: inv.totalPaise,
      currency: "INR",
      reference_id: `${inv.number.replace(/\//g, "-")}-${randomBytes(2).toString("hex")}`.toUpperCase(),
      description: `Genesis Media invoice ${inv.number}`,
      customer: { name: inv.billToName, ...(inv.billToEmail ? { email: inv.billToEmail } : {}) },
      notify: { sms: false, email: false },
      reminder_enable: true,
      notes: notes({ invoice: inv.number }),
      callback_url: appUrl(`/invoice/${inv.token}?paid=1`),
      callback_method: "get",
    });
    paymentUrl = link.short_url;
    await prisma.invoice.update({ where: { id }, data: { razorpayLinkId: link.id, paymentUrl } });
  }
  await prisma.invoice.update({ where: { id }, data: { status: inv.status === "PAID" ? "PAID" : "SENT", sentAt: new Date() } });
  if (inv.billToEmail) {
    await queueEmail({
      kind: "invoice_sent",
      to: [inv.billToEmail],
      subject: `Tax invoice ${inv.number} · Genesis Media`,
      text: [
        `Hello ${inv.billToName},`,
        "",
        message ?? "Please find our tax invoice below.",
        "",
        `Invoice ${inv.number}, dated ${date(inv.issueDate)}${inv.dueDate ? `, due ${date(inv.dueDate)}` : ""}`,
        `Taxable value: ${money(inv.subtotalPaise - inv.discountPaise)}`,
        inv.igst ? `IGST 18%: ${money(inv.igstPaise)}` : `CGST 9%: ${money(inv.cgstPaise)}\nSGST 9%: ${money(inv.sgstPaise)}`,
        `Total: ${money(inv.totalPaise)}`,
        "",
        `View or download the invoice: ${appUrl(`/invoice/${inv.token}`)}`,
        paymentUrl && inv.status !== "PAID" ? `Pay securely (card, UPI, net banking): ${paymentUrl}` : "",
      ]
        .filter((l, i, all) => l !== "" || all[i - 1] !== "")
        .join("\n"),
    });
  }
  return { paymentUrl };
}

/** Paid (by Razorpay's webhook, or marked by hand). Once only. */
export async function markInvoicePaid(id: string, razorpayPaymentId?: string | null, method?: string | null) {
  const prisma = getPrisma();
  const claimed = await prisma.invoice.updateMany({ where: { id, status: { not: "PAID" } }, data: { status: "PAID", paidAt: new Date() } });
  if (claimed.count === 0) return false;
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  if (razorpayPaymentId) {
    await prisma.payment.upsert({
      where: { razorpayId: razorpayPaymentId },
      create: { razorpayId: razorpayPaymentId, amountPaise: inv.totalPaise, method: method ?? null, accountId: inv.accountId, invoiceId: inv.number, invoiceUrl: appUrl(`/invoice/${inv.token}`) },
      update: {},
    });
  }
  await queueStaffEmail({ kind: "invoice_paid", scope: "finance", subject: `Paid: invoice ${inv.number} · ${inv.billToName} · ${money(inv.totalPaise)}`, text: appUrl(`/admin/invoices/${inv.id}`), dedupeKey: `invoice-paid:${inv.id}` });
  return true;
}
