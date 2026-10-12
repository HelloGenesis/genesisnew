"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { Division } from "@/lib/generated/prisma/enums";
import type { Reading } from "@/lib/crm/ai";
import { todayIst } from "@/lib/crm/catalog";
import { type ActionState, fail, ok, text } from "@/lib/crm/form-state";
import { disconnectGoogle } from "@/lib/crm/google";
import { syncPerson } from "@/lib/crm/ingest";
import { importRazorpayHistory } from "@/lib/crm/razorpay-import";
import { IMPORT_KINDS, planImport, runImport, sheetInfo, spreadsheetIdFrom } from "@/lib/crm/sheet-import";
import { requireStaff, type Viewer } from "@/lib/crm/session";

/** The Inbox: what Gmail and Drive turned up, and the one-click moves into the CRM. */

const done = () => revalidatePath("/admin", "layout");
const seesAll = (v: Viewer) => v.roles.some((r) => r === "OWNER" || r === "ADMIN");
const rupees = (n?: number) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null);

/** An item this person may act on: their own, or anyone's for owners and admins. */
async function itemFor(viewer: Viewer, id: string | null) {
  if (!id) return null;
  const item = await getPrisma().inboxItem.findUnique({ where: { id } });
  if (!item || (!seesAll(viewer) && item.userId !== viewer.id)) return null;
  return { item, reading: (item.data ?? {}) as unknown as Reading };
}

export async function syncMyGoogle(): Promise<ActionState> {
  const viewer = await requireStaff();
  const result = await syncPerson(viewer.id);
  done();
  if ("error" in result) return fail(`Google said: ${result.error}`);
  if ("skipped" in result) return fail(result.skipped === "not connected" ? "Connect your Google first." : "The AI key isn't set yet (ANTHROPIC_API_KEY).");
  return ok(`Checked. ${result.briefs} new brief${result.briefs === 1 ? "" : "s"}, ${result.filed} item${result.filed === 1 ? "" : "s"} sorted.`);
}

export async function disconnectMyGoogle() {
  const viewer = await requireStaff();
  await disconnectGoogle(viewer.id);
  await recordAuditLog({ action: "google.disconnected", entity: "user", entityId: viewer.id, actorId: viewer.id });
  done();
}

export async function dismissItem(form: FormData) {
  const viewer = await requireStaff();
  const found = await itemFor(viewer, text(form, "id"));
  if (!found) return;
  await getPrisma().inboxItem.update({ where: { id: found.item.id }, data: { status: "DISMISSED", handledById: viewer.id } });
  done();
}

/** Client or vendor details → a client or vendor account (or filled into the one they belong to). */
export async function addAccountFromItem(form: FormData) {
  const viewer = await requireStaff();
  const found = await itemFor(viewer, text(form, "id"));
  if (!found) return;
  const { item, reading } = found;
  const prisma = getPrisma();
  const kind = form.get("as") === "VENDOR" ? "VENDOR" : "BRAND";
  const c = reading.company ?? {};
  const contact = reading.contact ?? {};
  const name = (c.name ?? contact.company ?? item.sender ?? item.senderEmail ?? "New account").slice(0, 160);
  const email = (contact.email ?? item.senderEmail)?.toLowerCase() ?? null;
  const details = {
    legalName: c.legalName ?? null,
    gstin: c.gstin?.toUpperCase().slice(0, 15) ?? null,
    billingAddress: c.address ?? null,
    city: c.city ?? null,
    website: c.website ?? null,
    phone: contact.phone ?? null,
    ...(kind === "VENDOR" ? { vendorSkills: c.services ? c.services.split(/[,/]+/).map((s) => s.trim()).filter(Boolean).slice(0, 10) : [], vendorRateNote: c.rates ?? null } : {}),
  };
  let accountId = item.accountId;
  if (accountId) {
    const current = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    const patch = Object.fromEntries(Object.entries(details).filter(([k, v]) => v && !(current as Record<string, unknown>)[k]));
    if (Object.keys(patch).length) await prisma.account.update({ where: { id: accountId }, data: patch });
  } else {
    const account = await prisma.account.create({ data: { name, kind, status: kind === "VENDOR" ? "ACTIVE" : "PROSPECT", email, ...details, notes: [reading.summary, item.url].filter(Boolean).join("\n") } });
    accountId = account.id;
  }
  await prisma.inboxItem.update({ where: { id: item.id }, data: { status: "DONE", accountId, handledById: viewer.id } });
  done();
  redirect(`/admin/accounts/${accountId}`);
}

/** A bill → an expense, with its GST as input credit. */
export async function expenseFromItem(form: FormData) {
  const viewer = await requireStaff("finance");
  const found = await itemFor(viewer, text(form, "id"));
  if (!found) return;
  const { item, reading } = found;
  const inv = reading.invoice ?? {};
  const amount = rupees(inv.amountRupees);
  if (!amount) return;
  const when = inv.date && /^\d{4}-\d{2}-\d{2}$/.test(inv.date) ? new Date(`${inv.date}T00:00:00Z`) : item.occurredAt;
  const expense = await getPrisma().expense.create({
    data: {
      date: when,
      category: "OTHER",
      description: (inv.description ?? item.title).slice(0, 200),
      payee: inv.party ?? item.sender ?? null,
      amountPaise: amount,
      gstPaise: rupees(inv.gstRupees) ?? 0,
      reference: inv.number ?? null,
      notes: item.url ?? null,
      createdById: viewer.id,
    },
  });
  await getPrisma().inboxItem.update({ where: { id: item.id }, data: { status: "DONE", expenseId: expense.id, handledById: viewer.id } });
  done();
}

/** Anything (a proposal, links, a brief the AI wasn't sure of) kept on a client or lead. `as=brief` makes it a brief there. */
export async function attachItem(form: FormData) {
  const viewer = await requireStaff();
  const found = await itemFor(viewer, text(form, "id"));
  if (!found) return;
  const { item, reading } = found;
  const [kind, ref] = (text(form, "to") ?? "").split(":");
  const prisma = getPrisma();
  const accountId = kind === "account" ? ref! : item.accountId;
  let leadId = kind === "lead" ? ref! : item.leadId;
  if (form.get("as") === "brief") {
    const b = reading.brief ?? {};
    const c = reading.contact ?? {};
    if (!accountId && !leadId) {
      leadId = (
        await prisma.lead.create({
          data: { name: (c.name ?? item.sender ?? c.company ?? "New brief").slice(0, 120), email: (c.email ?? item.senderEmail)?.toLowerCase() ?? null, phone: c.phone ?? null, company: c.company ?? null, source: item.source === "GMAIL" ? "EMAIL" : "GOOGLE_DRIVE", ownerId: item.userId ?? viewer.id, createdById: viewer.id, nextFollowUp: new Date(todayIst()), valuePaise: rupees(b.budgetRupees) ?? 0, notes: reading.summary ?? null },
        })
      ).id;
    }
    const brief = await prisma.brief.create({
      data: {
        title: (b.title ?? item.title).slice(0, 200),
        leadId: accountId && kind === "account" ? null : leadId,
        accountId: accountId ?? null,
        division: (b.division as Division | undefined) ?? null,
        services: b.services ?? [],
        objective: b.objective ?? null,
        audience: b.audience ?? null,
        deliverables: b.deliverables ?? null,
        platforms: b.platforms ?? [],
        budgetPaise: rupees(b.budgetRupees),
        references: item.links.slice(0, 10),
        notes: [reading.summary, item.url].filter(Boolean).join("\n\n"),
        createdById: viewer.id,
      },
    });
    await prisma.inboxItem.update({ where: { id: item.id }, data: { status: "DONE", briefId: brief.id, leadId, accountId, handledById: viewer.id } });
    done();
    redirect(`/admin/briefs/${brief.id}`);
  }
  await prisma.inboxItem.update({ where: { id: item.id }, data: { status: "DONE", accountId: accountId ?? null, leadId: leadId ?? null, handledById: viewer.id } });
  if (leadId) await prisma.activity.create({ data: { leadId, kind: "NOTE", actorId: viewer.id, body: `${item.title}${item.url ? `\n${item.url}` : ""}${item.links.length ? `\n${item.links.slice(0, 8).join("\n")}` : ""}` } }).catch(() => undefined);
  done();
}

export async function markNotificationsRead(form: FormData) {
  const viewer = await requireStaff();
  const id = text(form, "id");
  await getPrisma().notification.updateMany({ where: { userId: viewer.id, readAt: null, ...(id ? { id } : {}) }, data: { readAt: new Date() } });
  done();
}

/* --- Sheets ------------------------------------------------------------------ */

export async function startSheetImport(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const id = spreadsheetIdFrom(text(form, "sheet") ?? "");
  const kind = text(form, "kind");
  if (!id) return fail("Paste the sheet's link (docs.google.com/spreadsheets/d/…).");
  if (!kind || !(kind in IMPORT_KINDS)) return fail("Choose what the sheet holds.");
  if (kind === "expenses" && !viewer.roles.some((r) => ["OWNER", "ADMIN", "FINANCE"].includes(r))) return fail("Expenses are for finance.");
  let jobId: string;
  try {
    const info = await sheetInfo(viewer.id, id);
    const tab = text(form, "tab") && info.tabs.includes(text(form, "tab")!) ? text(form, "tab")! : info.tabs[0]!;
    const plan = await planImport(viewer.id, id, tab, kind);
    if (Object.keys(plan.mapping).length === 0) return fail("Couldn't match any columns to CRM fields. Check the first row has headings.");
    const job = await getPrisma().sheetImport.upsert({
      where: { spreadsheetId_sheetName_kind: { spreadsheetId: id, sheetName: tab, kind } },
      create: { userId: viewer.id, spreadsheetId: id, sheetName: tab, title: `${info.title} · ${tab}`, kind, mapping: plan.mapping },
      update: { mapping: plan.mapping, userId: viewer.id },
    });
    jobId = job.id;
  } catch (error) {
    return fail(`Couldn't read that sheet: ${(error as Error).message.slice(0, 160)}. Is it shared with you (or your Google connected)?`);
  }
  done();
  redirect(`/admin/inbox/sheets?plan=${jobId}`);
}

export async function saveMappingAndRun(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const id = text(form, "id");
  if (!id) return fail("Missing import.");
  const job = await getPrisma().sheetImport.findUnique({ where: { id } });
  if (!job || (job.userId !== viewer.id && !seesAll(viewer))) return fail("Not found.");
  const fields = IMPORT_KINDS[job.kind]!.fields;
  const mapping: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("col:") && typeof value === "string" && value in fields) mapping[key.slice(4)] = value;
  }
  await getPrisma().sheetImport.update({ where: { id }, data: { mapping, autoSync: IMPORT_KINDS[job.kind]!.sync && form.get("autoSync") === "on" } });
  try {
    const result = await runImport(id);
    await recordAuditLog({ action: "sheet.imported", entity: "sheet_import", entityId: id, actorId: viewer.id, metadata: result });
    done();
    return ok(`Imported: ${result.added} added, ${result.updated} updated.`);
  } catch (error) {
    return fail(`Import failed: ${(error as Error).message.slice(0, 200)}`);
  }
}

export async function rerunSheetImport(form: FormData) {
  const viewer = await requireStaff();
  const id = text(form, "id");
  const job = id ? await getPrisma().sheetImport.findUnique({ where: { id } }) : null;
  if (!job || (job.userId !== viewer.id && !seesAll(viewer))) return;
  await runImport(job.id).catch((error) => getPrisma().sheetImport.update({ where: { id: job.id }, data: { lastError: String(error.message).slice(0, 300) } }));
  done();
}

export async function deleteSheetImport(form: FormData) {
  const viewer = await requireStaff();
  const id = text(form, "id");
  const job = id ? await getPrisma().sheetImport.findUnique({ where: { id } }) : null;
  if (!job || (job.userId !== viewer.id && !seesAll(viewer))) return;
  await getPrisma().sheetImport.delete({ where: { id: job.id } });
  done();
}

export async function importRazorpay(): Promise<ActionState> {
  const viewer = await requireStaff("finance");
  try {
    const result = await importRazorpayHistory(730);
    await recordAuditLog({ action: "razorpay.history_imported", entity: "payment", actorId: viewer.id, metadata: result });
    done();
    return ok(`${result.added} past payments brought in, ${result.matched} matched to clients.`);
  } catch (error) {
    return fail(`Razorpay: ${(error as Error).message.slice(0, 200)}`);
  }
}
