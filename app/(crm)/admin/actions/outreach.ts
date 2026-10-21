"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { type ActionState, fail, ok, text } from "@/lib/crm/form-state";
import { sendNow } from "@/lib/crm/notify";
import { makePlanSheets } from "@/lib/crm/plan-sheets";
import { quoteScope } from "@/lib/crm/scope";
import { requireStaff, type Viewer } from "@/lib/crm/session";

/** Creator outreach and the plan's Google Sheets. Sales, on their own plans (super admins any). */

const done = () => revalidatePath("/admin", "layout");
const TEMPLATE_KEY = "outreach-template";

async function planCreator(viewer: Viewer, id: string | null) {
  if (!id) return null;
  const qc = await getPrisma().quoteCreator.findUnique({ where: { id } });
  if (!qc) return null;
  const quote = await getPrisma().quote.findFirst({ where: { id: qc.quoteId, ...quoteScope(viewer) }, select: { id: true } });
  return quote ? qc : null;
}

/** Saves the message as everyone's starting template. */
export async function saveOutreachTemplate(template: string) {
  await requireStaff("plans");
  const value = template.slice(0, 4000);
  await getPrisma().appSetting.upsert({ where: { key: TEMPLATE_KEY }, create: { key: TEMPLATE_KEY, value }, update: { value } });
  return { ok: true };
}

/** After WhatsApp opened (or an email went): the creator's reach-out status on the plan. */
export async function markReachout(quoteCreatorId: string, status: string) {
  const viewer = await requireStaff("plans");
  const qc = await planCreator(viewer, quoteCreatorId);
  if (!qc) return { ok: false };
  await getPrisma().quoteCreator.update({ where: { id: qc.id }, data: { reachout: status.slice(0, 60) } });
  done();
  return { ok: true };
}

/** Emails a creator their personalised message, from the CRM, with replies to the sender. */
export async function emailCreator(quoteCreatorId: string, to: string, subject: string, body: string) {
  const viewer = await requireStaff("plans");
  const qc = await planCreator(viewer, quoteCreatorId);
  if (!qc) return { ok: false, message: "Not your plan." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, message: "No valid email for this creator." };
  try {
    await sendNow([to.toLowerCase()], subject.slice(0, 200), body.slice(0, 8000), { replyTo: viewer.email, signOff: false });
  } catch (error) {
    return { ok: false, message: `Email didn't send: ${(error as Error).message.slice(0, 120)}` };
  }
  await getPrisma().quoteCreator.update({ where: { id: qc.id }, data: { reachout: "Email" } });
  await recordAuditLog({ action: "creator.emailed", entity: "quote_creator", entityId: qc.id, actorId: viewer.id, metadata: { to } });
  done();
  return { ok: true, message: `Sent to ${to}.` };
}

/** Makes (or rewrites) the plan's external and internal Google Sheets. */
export async function planSheets(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("plans");
  const id = text(form, "id");
  const quote = id ? await getPrisma().quote.findFirst({ where: { id, ...quoteScope(viewer) }, select: { id: true } }) : null;
  if (!quote) return fail("Not your plan.");
  let made: Awaited<ReturnType<typeof makePlanSheets>>;
  try {
    made = await makePlanSheets(quote.id, viewer.email, viewer.id);
  } catch (error) {
    return fail(`Couldn't make the sheets: ${(error as Error).message.slice(0, 200)}`);
  }
  await recordAuditLog({ action: "plan.sheets", entity: "quote", entityId: quote.id, actorId: viewer.id });
  done();
  return ok(made.own ? `Done: both sheets are in your Google Drive (${made.account}), up to date.` : `Done: both sheets are up to date (in ${made.account}'s Drive; reconnect your Google in Inbox to have them in yours).`);
}

/** Shares a brief or a quote by email, from the CRM, replies to the sender. */
export async function shareByEmail(to: string, subject: string, body: string) {
  const viewer = await requireStaff();
  const list = to.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).slice(0, 10);
  if (list.length === 0) return { ok: false, message: "Add an email address." };
  try {
    await sendNow(list, subject.slice(0, 200), body.slice(0, 10000), { replyTo: viewer.email, signOff: false });
  } catch (error) {
    return { ok: false, message: `Didn't send: ${(error as Error).message.slice(0, 120)}` };
  }
  await recordAuditLog({ action: "shared.email", entity: "share", actorId: viewer.id, metadata: { to: list, subject } });
  return { ok: true, message: `Sent to ${list.join(", ")}.` };
}
