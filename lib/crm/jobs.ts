import "server-only";

import { getPrisma } from "@/lib/db";

import { LEAD_STATUS, date, todayIst } from "./catalog";
import { appUrl, deliverEmails, queueStaffEmail } from "./notify";
import { retryWebhookEvents } from "./orders";
import { syncSheets } from "./sheets";

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
  await step("emails", () => deliverEmails());
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
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: today } }, orderBy: { nextFollowUp: "asc" }, take: 30, include: { owner: true } }),
    prisma.task.findMany({ where: { status: "OPEN", dueDate: { lte: today } }, orderBy: { dueDate: "asc" }, take: 30, include: { owner: true } }),
    prisma.deliverable.count({ where: { status: "IN_REVIEW" } }),
  ]);
  if (leads.length === 0 && tasks.length === 0 && waiting === 0) return { nothing: true };
  const text = [
    leads.length ? `FOLLOW-UPS DUE (${leads.length})` : "",
    ...leads.map((l) => `• ${l.name}${l.company ? ` (${l.company})` : ""} · ${LEAD_STATUS[l.status].label} · due ${date(l.nextFollowUp)}${l.owner ? ` · ${l.owner.name ?? l.owner.email}` : ""}`),
    leads.length ? "" : "",
    tasks.length ? `TASKS DUE (${tasks.length})` : "",
    ...tasks.map((t) => `• ${t.title} · due ${date(t.dueDate)}${t.owner ? ` · ${t.owner.name ?? t.owner.email}` : ""}`),
    tasks.length ? "" : "",
    waiting ? `${waiting} deliverable${waiting === 1 ? "" : "s"} waiting on client review.` : "",
    "",
    `Open the CRM: ${appUrl("/admin")}`,
  ]
    .filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n");
  await queueStaffEmail({ kind: "digest", scope: "all", subject: `Today at Genesis · ${leads.length} follow-ups, ${tasks.length} tasks`, text, dedupeKey: `digest:${todayIst()}` });
  return { leads: leads.length, tasks: tasks.length, waiting };
}
