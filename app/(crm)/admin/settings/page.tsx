import { Badge, Card, PageHead, Table } from "@/components/crm/ui";
import { isAuth0Configured } from "@/lib/auth0";
import { getPrisma } from "@/lib/db";
import { dateTime } from "@/lib/crm/catalog";
import { emailConfigured } from "@/lib/crm/notify";
import { crmSheetsConfigured } from "@/lib/crm/sheets";
import { adminRequiresMfa, devLoginEnabled, requireStaff } from "@/lib/crm/session";
import { upstashConfigured } from "@/lib/env";
import { razorpayKeys } from "@/lib/razorpay";

import { retryEmail } from "../actions/finance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations" };

/** Is every integration connected, and is anything stuck? */
export default async function SettingsPage() {
  await requireStaff();
  const prisma = getPrisma();
  const [failed, pendingEmails, sheetBacklog, sheetErrors, lastWebhook, webhookErrors] = await Promise.all([
    prisma.emailOutbox.findMany({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.emailOutbox.count({ where: { status: "PENDING" } }),
    prisma.sheetOutbox.count({ where: { sentAt: null } }),
    prisma.sheetOutbox.findFirst({ where: { sentAt: null, lastError: { not: null } }, orderBy: { changedAt: "desc" } }),
    prisma.webhookEvent.findFirst({ orderBy: { receivedAt: "desc" } }),
    prisma.webhookEvent.count({ where: { error: { not: null }, processedAt: null } }),
  ]);
  const rows: [string, boolean, string][] = [
    ["Sign-in (Auth0: Google, email & SMS one-time codes)", isAuth0Configured(), devLoginEnabled() ? "Local development sign-in is on" : "AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, AUTH0_CONNECTIONS"],
    ["Staff two-factor", adminRequiresMfa(), "Authenticator app (TOTP) or Auth0 MFA, every 12 hours"],
    ["Payments (Razorpay)", Boolean(razorpayKeys()), `RAZORPAY_KEY_ID / SECRET, webhook secret ${process.env.RAZORPAY_WEBHOOK_SECRET ? "set" : "missing"}${lastWebhook ? ` · last event ${dateTime(lastWebhook.receivedAt)}` : ""}`],
    ["Email (Resend)", emailConfigured(), `RESEND_API_KEY, CRM_EMAIL_FROM · ${pendingEmails} queued`],
    ["Google Sheets mirror", crmSheetsConfigured(), `GOOGLE_SHEETS_ID (or CRM_SHEETS_ID) + service account · ${sheetBacklog} rows queued`],
    ["Scheduled jobs (Vercel Cron)", Boolean(process.env.CRON_SECRET), "CRON_SECRET · /api/jobs/run every minute"],
    ["Rate limiting (Upstash)", upstashConfigured(), "UPSTASH_REDIS_REST_URL / TOKEN · sign-in codes and forms"],
  ];
  return (
    <>
      <PageHead kicker="Setup" title="Integrations" sub="What's connected, and anything stuck in a queue." />
      <Table head={["Integration", "Status", "Needs"]}>
        {rows.map(([name, on, needs]) => (
          <tr key={name}>
            <td className="text-bone">{name}</td>
            <td><Badge tone={on ? "good" : "warn"}>{on ? "Connected" : "Not set"}</Badge></td>
            <td className="text-[0.8125rem] text-ash">{needs}</td>
          </tr>
        ))}
      </Table>
      {(sheetErrors || webhookErrors > 0) && (
        <Card title="Errors">
          {sheetErrors && <p className="text-ash">Sheets: {sheetErrors.lastError}</p>}
          {webhookErrors > 0 && <p className="text-ash">{webhookErrors} Razorpay event{webhookErrors === 1 ? "" : "s"} failed to apply. Check the server logs.</p>}
        </Card>
      )}
      <Card title="Emails that couldn't be sent">
        {failed.length === 0 ? (
          <p className="text-ash">None.</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {failed.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0"><span className="block truncate text-bone">{e.subject}</span><span className="block truncate text-[0.75rem] text-faint">{e.toStaff ? "staff" : e.to.join(", ")} · {e.lastError}</span></span>
                <form action={retryEmail}><input type="hidden" name="id" value={e.id} /><button className="crm-btn crm-btn-secondary crm-btn-sm">Retry</button></form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
