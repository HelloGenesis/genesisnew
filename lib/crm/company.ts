import "server-only";

import { getPrisma } from "@/lib/db";

import { date, money, todayIst } from "./catalog";
import { appUrl, queueStaffEmail } from "./notify";

/**
 * GENESIS'S OWN MONEY (Genesis, 12 Oct 2026): what it spends (salaries,
 * vendors, rent, software), the tools it subscribes to and when each renews,
 * and GST — what was collected, what can be claimed back, and which returns
 * are due when. Finance and owners only.
 */

export const EXPENSE_CATEGORY: Record<string, string> = {
  SALARY: "Salaries",
  FREELANCER: "Freelancers & crew",
  SOFTWARE: "Software & subscriptions",
  RENT: "Rent & office",
  UTILITIES: "Utilities & internet",
  MARKETING: "Marketing & ads",
  PRODUCTION: "Production costs",
  TRAVEL: "Travel",
  EQUIPMENT: "Equipment",
  PROFESSIONAL_FEES: "CA, legal & professional",
  TAXES: "Taxes & government fees",
  OTHER: "Other",
};

export const BILLING_CYCLE: Record<string, { label: string; months: number }> = {
  MONTHLY: { label: "Monthly", months: 1 },
  QUARTERLY: { label: "Quarterly", months: 3 },
  HALF_YEARLY: { label: "Every 6 months", months: 6 },
  YEARLY: { label: "Yearly", months: 12 },
};

/** The next renewal after `from`, one cycle on. */
export function nextCycle(from: Date, cycle: string): Date {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + (BILLING_CYCLE[cycle]?.months ?? 1));
  return d;
}

/** What a subscription costs a month, whatever its cycle. */
export const perMonth = (amountPaise: number, cycle: string) => Math.round(amountPaise / (BILLING_CYCLE[cycle]?.months ?? 1));

/* --- GST ------------------------------------------------------------------ */

export const GST_RETURNS: Record<string, string> = {
  "GSTR-1": "Outward supplies (sales invoices)",
  "GSTR-3B": "Summary return and tax payment",
  "GSTR-9": "Annual return",
};

const ym = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

/** Monthly filers: GSTR-1 by the 11th and GSTR-3B by the 20th of the next month; GSTR-9 by 31 December after the year. */
export function gstDueDates(period: string) {
  const [y, m] = period.split("-").map(Number);
  return { "GSTR-1": utc(y, m, 11), "GSTR-3B": utc(y, m, 20) };
}

/**
 * Makes sure last month's and this month's returns (and the last financial
 * year's annual) are listed, then each month after. Idempotent. Earlier months
 * are not added: on day one they would all read as overdue when the CA filed
 * them long ago.
 */
export async function ensureGstFilings() {
  const prisma = getPrisma();
  const today = new Date(todayIst());
  const rows: { returnType: string; period: string; dueDate: Date }[] = [];
  for (let back = 0; back <= 1; back += 1) {
    const d = utc(today.getUTCFullYear(), today.getUTCMonth() - back, 1);
    const period = ym(d);
    const due = gstDueDates(period);
    rows.push({ returnType: "GSTR-1", period, dueDate: due["GSTR-1"] }, { returnType: "GSTR-3B", period, dueDate: due["GSTR-3B"] });
  }
  const fyStart = today.getUTCMonth() >= 3 ? today.getUTCFullYear() - 1 : today.getUTCFullYear() - 2;
  rows.push({ returnType: "GSTR-9", period: `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`, dueDate: utc(fyStart + 1, 11, 31) });
  await prisma.gstFiling.createMany({ data: rows, skipDuplicates: true });
}

/**
 * The month's GST in and out. Output is the GST inside what was collected
 * (each payment's share of its order's tax, or 18/118 where there is no
 * order); input is the GST on the month's recorded expenses.
 */
export async function gstMonth(period: string) {
  const [y, m] = period.split("-").map(Number);
  const from = utc(y, m - 1, 1);
  const to = utc(y, m, 1);
  const prisma = getPrisma();
  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({ where: { status: "CAPTURED", paidAt: { gte: from, lt: to } }, select: { amountPaise: true, order: { select: { taxPaise: true, totalPaise: true } } } }),
    prisma.expense.aggregate({ where: { date: { gte: from, lt: to } }, _sum: { gstPaise: true, amountPaise: true } }),
  ]);
  const collected = payments.reduce((s, p) => s + p.amountPaise, 0);
  const output = payments.reduce((s, p) => s + (p.order && p.order.totalPaise > 0 ? Math.round((p.amountPaise * p.order.taxPaise) / p.order.totalPaise) : Math.round((p.amountPaise * 18) / 118)), 0);
  const input = expenses._sum.gstPaise ?? 0;
  return { period, collected, output, input, net: output - input, spent: expenses._sum.amountPaise ?? 0 };
}

/* --- Reminders ------------------------------------------------------------- */

/**
 * After 9am India time, once a day: the subscriptions renewing in the next
 * seven days and the GST returns due in the next five (or overdue), to
 * finance and owners.
 */
export async function moneyReminders() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()));
  if (hour < 9) return { skipped: "before 9am IST" };
  await ensureGstFilings();
  const prisma = getPrisma();
  const today = new Date(todayIst());
  const [subs, filings] = await Promise.all([
    prisma.companySubscription.findMany({ where: { active: true, nextDueDate: { lte: new Date(today.getTime() + 7 * 864e5) } }, orderBy: { nextDueDate: "asc" } }),
    prisma.gstFiling.findMany({ where: { status: "PENDING", dueDate: { lte: new Date(today.getTime() + 5 * 864e5) } }, orderBy: { dueDate: "asc" } }),
  ]);
  if (subs.length === 0 && filings.length === 0) return { nothing: true };
  const late = (d: Date) => (d < today ? " (OVERDUE)" : "");
  const text = [
    subs.length ? `RENEWALS DUE (${subs.length})` : "",
    ...subs.map((s) => `• ${s.name} · ${money(s.amountPaise)} · ${date(s.nextDueDate)}${late(s.nextDueDate)}${s.autoRenew ? " · auto-renews" : " · pay manually"}`),
    subs.length ? "" : "",
    filings.length ? `GST RETURNS DUE (${filings.length})` : "",
    ...filings.map((f) => `• ${f.returnType} for ${f.period} · due ${date(f.dueDate)}${late(f.dueDate)}`),
    "",
    `Subscriptions: ${appUrl("/admin/expenses/subscriptions")}`,
    `GST: ${appUrl("/admin/expenses/gst")}`,
  ]
    .filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n");
  await queueStaffEmail({ kind: "money_reminders", scope: "finance", subject: `Due soon · ${subs.length} renewals, ${filings.length} GST returns`, text, dedupeKey: `money-reminders:${todayIst()}` });
  return { subs: subs.length, filings: filings.length };
}
