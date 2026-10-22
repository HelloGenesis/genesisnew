"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { type ActionState, fail, ok, text } from "@/lib/crm/form-state";
import { assignSignatory, HOME_STATE, markInvoicePaid, newInvoiceToken, nextNumber, refreshInvoice, sendInvoice, stateFromGstin } from "@/lib/crm/invoices";
import { invoiceScope, quoteScope } from "@/lib/crm/scope";
import { can, requireStaff, type Viewer } from "@/lib/crm/session";
import { RazorpayError, razorpay } from "@/lib/razorpay";

/** Invoices: made by sales or finance; each person their own, super admins all (lib/crm/scope). */

const done = () => revalidatePath("/admin", "layout");
const day = (v?: string | null) => (v ? new Date(`${v}T00:00:00Z`) : null);

async function staff(): Promise<Viewer> {
  const viewer = await requireStaff();
  if (!can(viewer, "sales") && !can(viewer, "finance")) redirect("/admin/forbidden");
  return viewer;
}
const mine = async (viewer: Viewer, id: string | null) => (id ? getPrisma().invoice.findFirst({ where: { id, ...invoiceScope(viewer) } }) : null);

const rupees = z.coerce.number().min(0).max(100_000_000);
const payload = z.object({
  id: z.string().optional(),
  accountId: z.string().nullable().optional(),
  quoteId: z.string().nullable().optional(),
  billToName: z.string().trim().min(1).max(200),
  billToEmail: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
  billToGstin: z.string().trim().max(15).nullable().optional(),
  billToAddress: z.string().trim().max(600).nullable().optional(),
  placeOfSupply: z.string().trim().min(2).max(60),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal("")),
  discount: rupees,
  notes: z.string().max(4000).nullable().optional(),
  terms: z.string().max(6000).nullable().optional(),
  quotationRef: z.string().max(60).nullable().optional(),
  quotationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal("")),
  poNumber: z.string().max(60).nullable().optional(),
  poDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal("")),
  executionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal("")),
  paymentTermDays: z.coerce.number().int().min(0).max(365).optional(),
  reference: z.string().max(200).nullable().optional(),
  billToPan: z.string().trim().max(10).nullable().optional(),
  lines: z.array(z.object({ description: z.string().trim().min(1).max(500), sac: z.string().trim().max(10).default("996211"), qty: z.coerce.number().int().min(1).max(100000), uom: z.string().max(10).optional(), unit: rupees })).min(1).max(60),
});

export async function saveInvoice(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await staff();
  const parsed = payload.safeParse(JSON.parse(String(form.get("payload") ?? "{}")));
  if (!parsed.success) return fail(`Check the invoice: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
  const v = parsed.data;
  const prisma = getPrisma();
  const gstin = v.billToGstin?.toUpperCase() || null;
  if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(gstin)) return fail("The client's GSTIN doesn't look right (15 characters).");
  const place = stateFromGstin(gstin) ?? v.placeOfSupply;
  const data = {
    accountId: v.accountId || null,
    quoteId: v.quoteId || null,
    billToName: v.billToName,
    billToEmail: v.billToEmail ? v.billToEmail.toLowerCase() : null,
    billToGstin: gstin,
    billToAddress: v.billToAddress || null,
    placeOfSupply: place,
    igst: place !== HOME_STATE,
    issueDate: new Date(`${v.issueDate}T00:00:00Z`),
    dueDate: v.dueDate ? new Date(`${v.dueDate}T00:00:00Z`) : null,
    discountPaise: Math.round(v.discount * 100),
    notes: v.notes || null,
    terms: v.terms || null,
    quotationRef: v.quotationRef || null,
    quotationDate: day(v.quotationDate),
    poNumber: v.poNumber || null,
    poDate: day(v.poDate),
    executionDate: day(v.executionDate),
    paymentTermDays: v.paymentTermDays ?? 15,
    reference: v.reference || null,
    billToPan: v.billToPan?.toUpperCase() || (gstin ? gstin.slice(2, 12) : null),
  };
  const lines = v.lines.map((l, i) => ({ position: i, description: l.description, sac: l.sac || "996211", qty: l.qty, unit: l.uom || "NOS", unitPaise: Math.round(l.unit * 100) }));
  let id = v.id;
  if (id) {
    const before = await mine(viewer, id);
    if (!before) return fail("That invoice isn't yours, or no longer exists.");
    if (before.status === "PAID" || before.status === "CANCELLED") return fail("A paid or cancelled invoice can't change. Make a new one.");
    await prisma.$transaction([prisma.invoiceLine.deleteMany({ where: { invoiceId: id } }), prisma.invoice.update({ where: { id }, data: { ...data, lines: { create: lines } } })]);
  } else {
    /* The number is taken at creation; a clash (two at once) takes the next. */
    for (let attempt = 0; attempt < 3 && !id; attempt += 1) {
      const n = await nextNumber(data.issueDate);
      try {
        id = (await prisma.invoice.create({ data: { ...data, ...n, token: newInvoiceToken(), createdById: viewer.id, lines: { create: lines } } })).id;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  }
  await refreshInvoice(id!);
  if (!v.id) await assignSignatory(id!);
  /* The client's billing details, kept on the client the first time they're typed, so the next invoice and quote fill them in. */
  if (data.accountId) {
    const account = await prisma.account.findUnique({ where: { id: data.accountId }, select: { legalName: true, gstin: true, billingAddress: true, email: true } });
    if (account) {
      const fill = {
        ...(!account.legalName && data.billToName ? { legalName: data.billToName } : {}),
        ...(!account.gstin && data.billToGstin ? { gstin: data.billToGstin } : {}),
        ...(!account.billingAddress && data.billToAddress ? { billingAddress: data.billToAddress } : {}),
        ...(!account.email && data.billToEmail ? { email: data.billToEmail } : {}),
      };
      if (Object.keys(fill).length) await prisma.account.update({ where: { id: data.accountId }, data: fill });
    }
  }
  done();
  if (!v.id) redirect(`/admin/invoices/${id}?saved=1`);
  return ok("Saved.");
}

export async function sendInvoiceAction(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await staff();
  const inv = await mine(viewer, text(form, "id"));
  if (!inv) return fail("That invoice isn't yours.");
  if (!inv.billToEmail) return fail("Add the client's email first.");
  if (inv.status === "CANCELLED") return fail("It's cancelled.");
  try {
    const { paymentUrl } = await sendInvoice(inv.id, text(form, "message", 2000), form.get("payment") === "on");
    await recordAuditLog({ action: "invoice.sent", entity: "invoice", entityId: inv.id, actorId: viewer.id });
    done();
    return ok(`Sent to ${inv.billToEmail}${paymentUrl && inv.status !== "PAID" ? " with a pay link" : ""}.`);
  } catch (error) {
    console.error("[crm] invoice send failed", error);
    return fail(error instanceof RazorpayError ? "Razorpay couldn't make the pay link. Send without it, or check the total." : "Couldn't send. Try again.");
  }
}

export async function markInvoicePaidAction(form: FormData) {
  const viewer = await staff();
  const inv = await mine(viewer, text(form, "id"));
  if (!inv) return;
  await markInvoicePaid(inv.id);
  await recordAuditLog({ action: "invoice.marked_paid", entity: "invoice", entityId: inv.id, actorId: viewer.id });
  done();
}

export async function cancelInvoice(form: FormData) {
  const viewer = await staff();
  const inv = await mine(viewer, text(form, "id"));
  if (!inv || inv.status === "PAID") return;
  if (inv.razorpayLinkId) await razorpay(`payment_links/${inv.razorpayLinkId}/cancel`, {}).catch(() => undefined);
  await getPrisma().invoice.update({ where: { id: inv.id }, data: { status: "CANCELLED" } });
  await recordAuditLog({ action: "invoice.cancelled", entity: "invoice", entityId: inv.id, actorId: viewer.id });
  done();
}

/** An invoice from a quote: its lines and creator fees, the client's billing details, ready to check and send. */
export async function invoiceFromQuote(form: FormData) {
  const viewer = await staff();
  const id = text(form, "quoteId");
  const prisma = getPrisma();
  const q = id ? await prisma.quote.findFirst({ where: { id, ...quoteScope(viewer) }, include: { lines: { orderBy: { position: "asc" } }, creators: true, account: true } }) : null;
  if (!q) return;
  /* One invoice per quote: an existing one opens instead of a duplicate. */
  const existing = await prisma.invoice.findFirst({ where: { quoteId: q.id, status: { not: "CANCELLED" } }, select: { id: true } });
  if (existing) redirect(`/admin/invoices/${existing.id}`);
  const fees = q.creators.reduce((s, c) => s + (c.feePaise ?? 0), 0);
  const issueDate = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const gstin = q.account?.gstin ?? null;
  const place = stateFromGstin(gstin) ?? q.account?.state ?? (q.igst ? "Other state (IGST)" : HOME_STATE);
  const n = await nextNumber(issueDate);
  const inv = await prisma.invoice.create({
    data: {
      ...n,
      token: newInvoiceToken(),
      accountId: q.accountId,
      quoteId: q.id,
      billToName: q.account?.legalName ?? q.company ?? q.contactName,
      billToEmail: q.contactEmail,
      billToGstin: gstin,
      billToAddress: q.account?.billingAddress ?? null,
      placeOfSupply: place,
      igst: place !== HOME_STATE,
      issueDate,
      dueDate: new Date(issueDate.getTime() + 15 * 864e5),
      discountPaise: q.discountPaise,
      notes: null,
      quotationRef: `#${String(q.number).padStart(7, "0")}`,
      quotationDate: q.sentAt ?? q.issuedAt,
      paymentTermDays: 15,
      billToPan: gstin ? gstin.slice(2, 12) : null,
      createdById: viewer.id,
      lines: {
        create: [
          ...q.lines.map((l, i) => ({ position: i, description: [l.title, l.subtitle].filter(Boolean).join(" — "), sac: "996211", qty: l.qty, unitPaise: l.unitPaise })),
          ...(fees > 0 ? [{ position: q.lines.length, description: `Creator fees (${q.creators.length} creators)`, sac: "996211", qty: 1, unitPaise: fees }] : []),
        ],
      },
    },
  });
  await refreshInvoice(inv.id);
  await assignSignatory(inv.id);
  done();
  redirect(`/admin/invoices/${inv.id}`);
}

/** The supporting document's link (a Drive folder, the live post), with its label. */
export async function setSupportingLink(form: FormData) {
  const viewer = await staff();
  const inv = await mine(viewer, text(form, "id"));
  if (!inv) return;
  const url = text(form, "url", 500);
  await getPrisma().invoiceFile.deleteMany({ where: { invoiceId: inv.id, kind: "LINK" } });
  if (url && /^https?:\/\//.test(url)) await getPrisma().invoiceFile.create({ data: { invoiceId: inv.id, kind: "LINK", driveId: url, name: text(form, "label", 200) ?? url, mimeType: "text/uri-list", uploadedById: viewer.id } });
  done();
}

export async function removeInvoiceFile(form: FormData) {
  const viewer = await staff();
  const id = text(form, "fileId");
  const file = id ? await getPrisma().invoiceFile.findUnique({ where: { id } }) : null;
  if (!file || !(await mine(viewer, file.invoiceId))) return;
  await getPrisma().invoiceFile.delete({ where: { id: file.id } });
  if (file.kind === "SIGNED") await getPrisma().invoice.update({ where: { id: file.invoiceId }, data: { signedAt: null, signedById: null } });
  done();
}
