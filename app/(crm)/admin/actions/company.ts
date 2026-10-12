"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { BillingCycle, Division, ExpenseCategory, GstReturnStatus } from "@/lib/generated/prisma/enums";
import { DIVISIONS, toPaise } from "@/lib/crm/catalog";
import { BILLING_CYCLE, EXPENSE_CATEGORY, nextCycle } from "@/lib/crm/company";
import { type ActionState, day, fail, links, ok, text } from "@/lib/crm/form-state";
import { requireStaff } from "@/lib/crm/session";

/** Expenses, Genesis's own subscriptions, GST and briefs. Money is finance and owners; briefs are sales. */

const done = () => revalidatePath("/admin", "layout");
const list = (form: FormData, name: string) => (text(form, name) ?? "").split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20);

export async function addExpense(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("finance");
  const category = text(form, "category");
  const amount = toPaise(form.get("amount"));
  const description = text(form, "description", 200);
  if (!category || !(category in EXPENSE_CATEGORY)) return fail("Choose a category.");
  if (!amount) return fail("Enter the amount.");
  if (!description) return fail("Say what it was for.");
  await getPrisma().expense.create({
    data: {
      date: day(form, "date") ?? new Date(),
      category: category as ExpenseCategory,
      description,
      payee: text(form, "payee", 120),
      amountPaise: amount,
      gstPaise: toPaise(form.get("gst")) ?? 0,
      paidVia: text(form, "paidVia", 60),
      reference: text(form, "reference", 120),
      notes: text(form, "notes", 1000),
      createdById: viewer.id,
    },
  });
  done();
  return ok("Expense recorded.");
}

/** A month's salaries in one go: one row per person, from "Name: amount" lines. */
export async function addPayroll(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("finance");
  const when = day(form, "date") ?? new Date();
  const rows = (text(form, "lines", 6000) ?? "")
    .split("\n")
    .map((line) => line.match(/^\s*(.+?)\s*[:\-–,]\s*₹?\s*([\d,]+(?:\.\d+)?)\s*$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ payee: m[1].slice(0, 120), amountPaise: toPaise(m[2]) ?? 0 }))
    .filter((r) => r.amountPaise > 0);
  if (rows.length === 0) return fail("One person a line, like “Tanvi: 85000”.");
  const month = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(when);
  await getPrisma().expense.createMany({
    data: rows.map((r) => ({ date: when, category: "SALARY" as const, description: `Salary · ${month}`, payee: r.payee, amountPaise: r.amountPaise, paidVia: text(form, "paidVia", 60), createdById: viewer.id })),
  });
  done();
  return ok(`${rows.length} salar${rows.length === 1 ? "y" : "ies"} recorded for ${month}.`);
}

export async function deleteExpense(form: FormData) {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  if (!id) return;
  await getPrisma().expense.delete({ where: { id } }).catch(() => undefined);
  await recordAuditLog({ action: "expense.deleted", entity: "expense", entityId: id, actorId: viewer.id });
  done();
}

export async function saveCompanySubscription(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff("finance");
  const id = text(form, "id");
  const name = text(form, "name", 120);
  const amount = toPaise(form.get("amount"));
  const cycle = text(form, "cycle") ?? "MONTHLY";
  const due = day(form, "nextDueDate");
  if (!name || !amount || !due || !(cycle in BILLING_CYCLE)) return fail("Name, amount, cycle and the next due date, please.");
  const data = {
    name,
    vendor: text(form, "vendor", 120),
    category: text(form, "category", 60),
    amountPaise: amount,
    cycle: cycle as BillingCycle,
    nextDueDate: due,
    autoRenew: form.get("autoRenew") === "on",
    paymentMethod: text(form, "paymentMethod", 80),
    ownerId: text(form, "ownerId"),
    notes: text(form, "notes", 1000),
  };
  if (id) await getPrisma().companySubscription.update({ where: { id }, data });
  else await getPrisma().companySubscription.create({ data });
  done();
  return ok(id ? "Saved." : "Subscription added. Finance gets a reminder a week before it renews.");
}

/** Paid this cycle: recorded as a software expense and moved on to the next due date. */
export async function markSubscriptionPaid(form: FormData) {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  if (!id) return;
  const prisma = getPrisma();
  const sub = await prisma.companySubscription.findUnique({ where: { id } });
  if (!sub) return;
  await prisma.$transaction([
    prisma.expense.create({ data: { date: sub.nextDueDate, category: "SOFTWARE", description: `${sub.name} · ${BILLING_CYCLE[sub.cycle].label.toLowerCase()}`, payee: sub.vendor ?? sub.name, amountPaise: sub.amountPaise, paidVia: sub.paymentMethod, createdById: viewer.id } }),
    prisma.companySubscription.update({ where: { id }, data: { nextDueDate: nextCycle(sub.nextDueDate, sub.cycle) } }),
  ]);
  done();
}

export async function setSubscriptionActive(form: FormData) {
  await requireStaff("finance");
  const id = text(form, "id");
  if (!id) return;
  await getPrisma().companySubscription.update({ where: { id }, data: { active: form.get("active") === "1" } });
  done();
}

export async function updateGstFiling(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  const status = text(form, "status") as GstReturnStatus | null;
  if (!id || !status || !["PENDING", "FILED", "NOT_APPLICABLE"].includes(status)) return fail("Choose a status.");
  await getPrisma().gstFiling.update({
    where: { id },
    data: { status, filedOn: status === "FILED" ? (day(form, "filedOn") ?? new Date()) : null, arn: text(form, "arn", 60), taxPaidPaise: toPaise(form.get("taxPaid")), notes: text(form, "notes", 500) },
  });
  await recordAuditLog({ action: "gst.updated", entity: "gst_filing", entityId: id, actorId: viewer.id, metadata: { status } });
  done();
  return ok("Saved.");
}

const GST_PROFILE = "gst-profile";
export type GstProfile = { gstin?: string; legalName?: string; state?: string; frequency?: string; accountant?: string; accountantEmail?: string; portalUser?: string; notes?: string; address?: string; phone?: string; invoiceEmail?: string; payee?: string; bank?: string; account?: string; ifsc?: string; signatoryEmail?: string };

export async function saveGstProfile(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff("finance");
  const value: GstProfile = {
    gstin: text(form, "gstin", 15)?.toUpperCase() ?? undefined,
    legalName: text(form, "legalName", 160) ?? undefined,
    state: text(form, "state", 60) ?? undefined,
    frequency: text(form, "frequency", 30) ?? undefined,
    accountant: text(form, "accountant", 120) ?? undefined,
    accountantEmail: text(form, "accountantEmail", 160) ?? undefined,
    portalUser: text(form, "portalUser", 80) ?? undefined,
    notes: text(form, "notes", 2000) ?? undefined,
    address: text(form, "address", 300) ?? undefined,
    phone: text(form, "phone", 30) ?? undefined,
    invoiceEmail: text(form, "invoiceEmail", 160) ?? undefined,
    payee: text(form, "payee", 160) ?? undefined,
    bank: text(form, "bank", 120) ?? undefined,
    account: text(form, "account", 40) ?? undefined,
    ifsc: text(form, "ifsc", 20)?.toUpperCase() ?? undefined,
    signatoryEmail: text(form, "signatoryEmail", 160)?.toLowerCase() ?? undefined,
  };
  if (value.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(value.gstin)) return fail("That GSTIN doesn't look right (15 characters, like 27ABCDE1234F1Z5).");
  await getPrisma().appSetting.upsert({ where: { key: GST_PROFILE }, create: { key: GST_PROFILE, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
  done();
  return ok("Saved.");
}

/* --- Briefs --------------------------------------------------------------- */

export async function saveBrief(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  const title = text(form, "title", 200);
  const about = text(form, "about"); // "lead:<id>" or "account:<id>"
  if (!title) return fail("Give the brief a title.");
  const [kind, ref] = (about ?? "").split(":");
  const division = text(form, "division");
  const data = {
    title,
    leadId: kind === "lead" ? ref : null,
    accountId: kind === "account" ? ref : null,
    division: division && (DIVISIONS as readonly string[]).includes(division) ? (division as Division) : null,
    services: list(form, "services"),
    objective: text(form, "objective"),
    audience: text(form, "audience", 1000),
    deliverables: text(form, "deliverables"),
    platforms: form.getAll("platforms").map(String).slice(0, 12),
    budgetPaise: toPaise(form.get("budget")),
    deadline: day(form, "deadline"),
    references: links(form, "references"),
    notes: text(form, "notes"),
  };
  if (id) {
    await getPrisma().brief.update({ where: { id }, data });
    done();
    return ok("Saved.");
  }
  const brief = await getPrisma().brief.create({ data: { ...data, createdById: viewer.id } });
  if (data.leadId) await getPrisma().activity.create({ data: { leadId: data.leadId, kind: "NOTE", actorId: viewer.id, body: `Brief added: ${title}` } }).catch(() => undefined);
  done();
  redirect(`/admin/briefs/${brief.id}`);
}

export async function setBriefStatus(form: FormData) {
  await requireStaff("sales");
  const id = text(form, "id");
  const status = text(form, "status");
  if (!id || !status || !["NEW", "QUOTED", "WON", "ON_HOLD", "LOST"].includes(status)) return;
  await getPrisma().brief.update({ where: { id }, data: { status } });
  done();
}
