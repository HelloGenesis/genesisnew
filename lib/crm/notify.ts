import "server-only";

import { assertNotDemo } from "./demo";
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

/* "leads": lead details are confidential (Genesis, 22 Oct 2026), so they go only to super admins and people who can see every lead; "owners": super admins. */
export type StaffScope = "all" | "sales" | "finance" | "producers" | "leads" | "owners";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && (process.env.CRM_EMAIL_FROM || process.env.ORDER_EMAIL_FROM));

export function appUrl(path: string): string {
  const base = process.env.APP_BASE_URL || "https://www.genesismedia.co";
  return new URL(path, base).toString();
}

export const SIGN_OFF = "\n\n— Genesis Media\nhello@genesismedia.co · genesismedia.co";

/** One email to named people. `dedupeKey` makes a repeat (a retried webhook) a no-op. */
/** `signOff` and `replyTo`: an agency CRM's own (lib/crm/workspace); Genesis's otherwise. */
export async function queueEmail(input: { kind: string; to: (string | null | undefined)[]; subject: string; text: string; dedupeKey?: string; signOff?: string; replyTo?: string | null }) {
  const to = [...new Set(input.to.filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase()))];
  if (to.length === 0) return;
  await getPrisma().emailOutbox.upsert({
    where: { dedupeKey: input.dedupeKey ?? `${input.kind}:${crypto.randomUUID()}` },
    create: { kind: input.kind, to, subject: input.subject, text: `${input.text}${input.signOff ?? SIGN_OFF}`, dedupeKey: input.dedupeKey ?? null, replyTo: input.replyTo ?? null },
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
  leads: ["OWNER"],
  owners: ["OWNER"],
};

async function staffRecipients(scope: StaffScope): Promise<string[]> {
  const roles = SCOPE_ROLES[scope];
  const rows = await getPrisma().staffRole.findMany({
    where: { ...(roles ? { role: { in: roles as never } } : {}), user: { emailVerified: true, email: { not: null } } },
    select: { user: { select: { email: true } } },
  });
  /* Plus whoever has been given every lead (Staff & roles → Can also see). */
  const granted = scope === "leads" ? await getPrisma().user.findMany({ where: { grants: { has: "leads" }, emailVerified: true, email: { not: null }, staffRoles: { some: {} } }, select: { email: true } }) : [];
  const ops = process.env.CRM_OPS_EMAIL || LEGAL_EMAIL;
  return [...new Set([ops, ...rows.map((r) => r.user.email!), ...granted.map((u) => u.email!)].map((e) => e.toLowerCase()))];
}

export type Attachment = { filename: string; content: Buffer };

async function send(to: string[], bcc: string[], subject: string, text: string, replyTo?: string | null, attachments: Attachment[] = [], from?: string) {
  await assertNotDemo();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: from || process.env.CRM_EMAIL_FROM || process.env.ORDER_EMAIL_FROM,
      to,
      ...(bcc.length ? { bcc } : {}),
      reply_to: replyTo || LEGAL_EMAIL,
      /* Marks every CRM email, so the Gmail reader never takes the CRM's own mail for a brief (the 12 Oct loop). */
      headers: { "X-Genesis-CRM": "1" },
      subject,
      text,
      ...(attachments.length ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })) } : {}),
    }),
    signal: AbortSignal.timeout(attachments.length ? 30_000 : 10_000),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

/** Sends one email now, outside the outbox (sign-in codes can't wait for the next run). */
export async function sendNow(to: string[], subject: string, text: string, opts: { replyTo?: string | null; signOff?: boolean | string; attachments?: Attachment[]; from?: string } = {}) {
  await send(to, [], subject, opts.signOff === false ? text : `${text}${typeof opts.signOff === "string" ? opts.signOff : SIGN_OFF}`, opts.replyTo, opts.attachments, opts.from);
}

/*
 * INFLUENCER REACH-OUTS FROM GENESIS INFLUENCE'S OWN ADDRESS (Genesis, 31 Oct
 * 2026: "influencer reach-outs go from coworking; they should go from
 * influence.genesismedia.co"). Env OUTREACH_EMAIL_FROM overrides; the domain
 * must be verified in Resend. Replies still go to the person who sent it.
 */
export const OUTREACH_FROM = () => process.env.OUTREACH_EMAIL_FROM || "Genesis Influence <hello@influence.genesismedia.co>";

export async function sendOutreach(to: string[], subject: string, text: string, replyTo: string | null) {
  await send(to, [], subject, text, replyTo, [], OUTREACH_FROM());
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
      await send(to, bcc, row.subject, row.text, row.replyTo);
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
