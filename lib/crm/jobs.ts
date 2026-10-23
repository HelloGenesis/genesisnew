import "server-only";

import { getPrisma } from "@/lib/db";

import { LEAD_STATUS, date, todayIst } from "./catalog";
import { moneyReminders } from "./company";
import { appUrl, deliverEmails, queueEmail, queueStaffEmail } from "./notify";
import { retryWebhookEvents } from "./orders";
import { mirrorCreators, syncSheets } from "./sheets";

/**
 * Every scheduled CRM job, run by Vercel Cron through /api/jobs/run each
 * minute (as genesis-coworking). Each step is idempotent and safe to overlap,
 * and one failing never stops the others.
 */
export async function runAllJobs() {
  const report: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      report[name] = await fn();
    } catch (error) {
      report[name] = { error: String((error as Error).message).slice(0, 300) };
    }
  };
  await step("webhooks", () => retryWebhookEvents());
  await step("digest", morningDigest);
  await step("money", moneyReminders);
  await step("emails", () => deliverEmails());
  await step("creators", () => mirrorCreators());
  await step("sheets", () => syncSheets());
  return report;
}

/**
 * After 9am India time, once a day: the follow-ups due and overdue, the tasks
 * due, and the deliverables waiting on clients — to sales and producers.
 */
async function morningDigest() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()));
  if (hour < 9) return { skipped: "before 9am IST" };
  const today = new Date(todayIst());
  const prisma = getPrisma();
  const [leads, tasks, waiting] = await Promise.all([
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: today }, workspaceId: null }, orderBy: { nextFollowUp: "asc" }, take: 200, include: { owner: true } }),
    prisma.task.findMany({ where: { status: "OPEN", dueDate: { lte: today }, workspaceId: null }, orderBy: { dueDate: "asc" }, take: 200, include: { owner: true } }),
    prisma.deliverable.count({ where: { status: "IN_REVIEW" } }),
  ]);
  if (leads.length === 0 && tasks.length === 0 && waiting === 0) return { nothing: true };
  const body = (ls: typeof leads, ts: typeof tasks, showOwner: boolean) =>
    [
      ls.length ? `FOLLOW-UPS DUE (${ls.length})` : "",
      ...ls.slice(0, 30).map((l) => `• ${l.name}${l.company ? ` (${l.company})` : ""} · ${LEAD_STATUS[l.status].label} · due ${date(l.nextFollowUp)}${showOwner && l.owner ? ` · ${l.owner.name ?? l.owner.email}` : ""}`),
      ls.length ? "" : "",
      ts.length ? `TASKS DUE (${ts.length})` : "",
      ...ts.slice(0, 30).map((t) => `• ${t.title} · due ${date(t.dueDate)}${showOwner && t.owner ? ` · ${t.owner.name ?? t.owner.email}` : ""}`),
      ts.length ? "" : "",
      showOwner && waiting ? `${waiting} deliverable${waiting === 1 ? "" : "s"} waiting on client review.` : "",
      "",
      `Open the CRM: ${appUrl("/admin")}`,
    ]
      .filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""))
      .join("\n");
  /*
   * LEADS ARE CONFIDENTIAL (Genesis, 22 Oct 2026): the whole picture goes only
   * to super admins; everyone else gets their own follow-ups and tasks.
   */
  await queueStaffEmail({ kind: "digest", scope: "owners", subject: `Today at Genesis · ${leads.length} follow-ups, ${tasks.length} tasks`, text: body(leads, tasks, true), dedupeKey: `digest:${todayIst()}` });
  const owners = new Set((await prisma.staffRole.findMany({ where: { role: "OWNER" }, select: { userId: true } })).map((r) => r.userId));
  const people = new Map<string, { email: string; leads: typeof leads; tasks: typeof tasks }>();
  for (const l of leads) if (l.owner?.email && !owners.has(l.owner.id)) (people.get(l.owner.id) ?? people.set(l.owner.id, { email: l.owner.email, leads: [], tasks: [] }).get(l.owner.id)!).leads.push(l);
  for (const t of tasks) if (t.owner?.email && !owners.has(t.owner.id)) (people.get(t.owner.id) ?? people.set(t.owner.id, { email: t.owner.email, leads: [], tasks: [] }).get(t.owner.id)!).tasks.push(t);
  for (const [id, p] of people) {
    await queueEmail({ kind: "digest", to: [p.email], subject: `Today · ${p.leads.length} follow-ups, ${p.tasks.length} tasks`, text: body(p.leads, p.tasks, false), dedupeKey: `digest:${todayIst()}:${id}` });
  }
  return { leads: leads.length, tasks: tasks.length, waiting, people: people.size };
}
