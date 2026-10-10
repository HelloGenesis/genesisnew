import "server-only";

import { getPrisma } from "@/lib/db";
import { LEGAL_EMAIL } from "@/lib/legal";

/**
 * EMAIL, THROUGH A DURABLE OUTBOX (as genesis-coworking's notifications).
 *
 * Anything that should send an email writes a row here, usually in the same
 * request as the change it describes; the job runner (/api/jobs/run, every
 * minute on Vercel Cron) delivers it through Resend. A delivery failure never
 * touches the change: it retries with backoff, gives up after six attempts,
 * and shows in /admin/settings so someone can see it.
 *
 * Staff alerts name no address: they go to every staff member in a scope
 * (BCC, one send, so a retry never duplicates) plus CRM_OPS_EMAIL.
 *
 * Env: RESEND_API_KEY, CRM_EMAIL_FROM (or ORDER_EMAIL_FROM) on a domain
 * verified in Resend, CRM_OPS_EMAIL (defaults to hello@genesismedia.co).
 */

export type StaffScope = "all" | "sales" | "finance" | "producers";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && (process.env.CRM_EMAIL_FROM || process.env.ORDER_EMAIL_FROM));

export function appUrl(path: string): string {
  const base = process.env.APP_BASE_URL || "https://www.genesismedia.co";
  return new URL(path, base).toString();
}

const SIGN_OFF = "\n\n— Genesis Media\nhello@genesismedia.co · genesismedia.co";

/** One email to named people. `dedupeKey` makes a repeat (a retried webhook) a no-op. */
export async function queueEmail(input: { kind: string; to: (string | null | undefined)[]; subject: string; text: string; dedupeKey?: string }) {
  const to = [...new Set(input.to.filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase()))];
  if (to.length === 0) return;
  await getPrisma().emailOutbox.upsert({
    where: { dedupeKey: input.dedupeKey ?? `${input.kind}:${crypto.randomUUID()}` },
    create: { kind: input.kind, to, subject: input.subject, text: `${input.text}${SIGN_OFF}`, dedupeKey: input.dedupeKey ?? null },
    update: {},
  }).catch(() => undefined);
}

/** An alert to Genesis's own team. */
export async function queueStaffEmail(input: { kind: string; scope?: StaffScope; subject: string; text: string; dedupeKey?: string }) {
  await getPrisma().emailOutbox.upsert({
    where: { dedupeKey: input.dedupeKey ?? `${input.kind}:${crypto.randomUUID()}` },
    create: { kind: input.kind, toStaff: true, staffScope: input.scope ?? "all", subject: input.subject, text: input.text, dedupeKey: input.dedupeKey ?? null },
    update: {},
  }).catch(() => undefined);
}

/** Every portal member of an account (and its agency's members, for a managed brand). */
export async function accountEmails(accountId: string): Promise<string[]> {
  const prisma = getPrisma();
  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { parentId: true, email: true } });
  const members = await prisma.accountMember.findMany({
    where: { accountId: { in: [accountId, ...(account?.parentId ? [account.parentId] : [])] }, user: { emailVerified: true } },
    select: { user: { select: { email: true } } },
  });
  const emails = members.map((m) => m.user.email).filter((e): e is string => Boolean(e));
  return emails.length ? emails : account?.email ? [account.email] : [];
}

const SCOPE_ROLES: Record<StaffScope, string[] | null> = {
  all: null,
  sales: ["OWNER", "ADMIN", "SALES"],
  finance: ["OWNER", "ADMIN", "FINANCE"],
  producers: ["OWNER", "ADMIN", "PRODUCER"],
};

async function staffRecipients(scope: StaffScope): Promise<string[]> {
  const roles = SCOPE_ROLES[scope];
  const rows = await getPrisma().staffRole.findMany({
    where: { ...(roles ? { role: { in: roles as never } } : {}), user: { emailVerified: true, email: { not: null } } },
    select: { user: { select: { email: true } } },
  });
  const ops = process.env.CRM_OPS_EMAIL || LEGAL_EMAIL;
  return [...new Set([ops, ...rows.map((r) => r.user.email!)].map((e) => e.toLowerCase()))];
}

async function send(to: string[], bcc: string[], subject: string, text: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CRM_EMAIL_FROM || process.env.ORDER_EMAIL_FROM,
      to,
      ...(bcc.length ? { bcc } : {}),
      reply_to: LEGAL_EMAIL,
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

/** Sends up to `limit` due emails. Safe to overlap: each row is claimed once (SKIP LOCKED). */
export async function deliverEmails(limit = 25) {
  if (!emailConfigured()) return { skipped: "Resend not configured" };
  const prisma = getPrisma();
  const claimed = await prisma.$queryRaw<{ id: string }[]>`
    update crm_email_outbox set attempts = attempts + 1, next_attempt_at = now() + interval '10 minutes'
    where id in (select id from crm_email_outbox where status = 'PENDING' and next_attempt_at <= now()
                 order by created_at limit ${limit} for update skip locked)
    returning id`;
  let sent = 0;
  for (const { id } of claimed) {
    const row = await prisma.emailOutbox.findUnique({ where: { id } });
    if (!row) continue;
    try {
      let to = row.to;
      let bcc: string[] = [];
      if (row.toStaff) {
        const all = await staffRecipients((row.staffScope ?? "all") as StaffScope);
        to = all.slice(0, 1);
        bcc = all.slice(1);
      }
      if (to.length === 0) {
        await prisma.emailOutbox.update({ where: { id }, data: { status: "SKIPPED", lastError: "no recipient" } });
        continue;
      }
      await send(to, bcc, row.subject, row.text);
      await prisma.emailOutbox.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), lastError: null } });
      sent++;
    } catch (error) {
      const attempts = row.attempts;
      await prisma.emailOutbox.update({
        where: { id },
        data: {
          status: attempts >= 6 ? "FAILED" : "PENDING",
          lastError: String((error as Error).message).slice(0, 500),
          nextAttemptAt: new Date(Date.now() + Math.min(240, 5 * attempts * attempts) * 60_000),
        },
      });
    }
  }
  return { sent, picked: claimed.length };
}
