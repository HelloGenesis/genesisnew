import { redirect } from "next/navigation";
import { Badge, Card, PageHead, Table } from "@/components/crm/ui";
import { isAuth0Configured } from "@/lib/auth0";
import { emailLoginEnabled } from "@/lib/crm/email-login";
import { getPrisma } from "@/lib/db";
import { dateTime } from "@/lib/crm/catalog";
import { contactsStatus } from "@/lib/crm/contacts";
import { driveStatus } from "@/lib/crm/drive";
import { emailConfigured } from "@/lib/crm/notify";
import { crmSheetsConfigured } from "@/lib/crm/sheets";
import { adminRequiresMfa, can, devLoginEnabled, requireStaff } from "@/lib/crm/session";
import { upstashConfigured } from "@/lib/env";
import { razorpayKeys } from "@/lib/razorpay";

import { ConnectorCard } from "@/components/crm/connector-card";
import { connectorKeys } from "@/lib/crm/mcp-keys";
import { usesAi } from "@/lib/crm/scope";

import { disconnectGoogleDrive, retryEmail } from "../actions/finance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations" };

/** Is every integration connected, and is anything stuck? */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ drive?: string }> }) {
  const viewer = await requireStaff();
  /* Genesis's integrations and outbox: not for an agency CRM's team. */
  if (viewer.workspaceId) redirect("/admin/forbidden");
  const driveResult = (await searchParams).drive;
  const drive = await driveStatus();
  const contacts = await contactsStatus(viewer.id).catch(() => "needs-access" as const);
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
    ["Sign-in (Auth0: Google, email & SMS one-time codes)", isAuth0Configured() || emailLoginEnabled(), devLoginEnabled() ? "Local development sign-in is on" : emailLoginEnabled() ? "Email codes sent by Genesis (Resend) until Auth0 is set up" : "AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, AUTH0_CONNECTIONS"],
    ["Staff two-factor", adminRequiresMfa(), "Authenticator app (TOTP) or Auth0 MFA, every 12 hours"],
    ["Payments (Razorpay)", Boolean(razorpayKeys()), `RAZORPAY_KEY_ID / SECRET, webhook secret ${process.env.RAZORPAY_WEBHOOK_SECRET ? "set" : "missing"}${lastWebhook ? ` · last event ${dateTime(lastWebhook.receivedAt)}` : ""}`],
    ["Email (Resend)", emailConfigured(), `RESEND_API_KEY, CRM_EMAIL_FROM · ${pendingEmails} queued`],
    ["Google Sheets mirror", crmSheetsConfigured(), `GOOGLE_SHEETS_ID (or CRM_SHEETS_ID) + service account · ${sheetBacklog} rows queued`],
    ["Google Drive (project files)", Boolean(drive.account), drive.account ? `Connected as ${drive.account}` : "GOOGLE_OAUTH_CLIENT_ID / SECRET, then Connect below"],
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
      <Card title="Google Drive" action={drive.account ? <span className="text-[0.8125rem] text-ash">{drive.connectedAt ? `since ${dateTime(drive.connectedAt)}` : ""}</span> : undefined}>
        {driveResult === "connected" && <p className="crm-notice mb-3">Connected. New project files go to that Drive.</p>}
        {driveResult === "failed" && <p className="crm-notice crm-notice-warn mb-3">Google didn&apos;t complete the connection. Try again, and allow access when asked.</p>}
        {driveResult === "unconfigured" && <p className="crm-notice crm-notice-warn mb-3">Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first (see CRM.md).</p>}
        <p className="text-ash">
          Everything is filed in <strong className="text-bone">hello@genesismedia.co</strong>&apos;s Google Drive, one folder per client: &quot;Genesis CRM / client /&quot; then <em>Quotes &amp; plans</em> (each quote&apos;s PDF), <em>Invoices</em> (each invoice&apos;s PDF, signed copy and screenshots) and a folder per project (briefs, raw footage, cuts, finals). The CRM can only see the files it put there.
        </p>
        {can(viewer, "staff") && (
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/api/crm/drive/connect" className="crm-btn crm-btn-primary crm-btn-sm">{drive.account ? "Reconnect Google Drive" : "Connect Google Drive"}</a>
            {drive.account && !drive.account.startsWith("local") && (
              <form action={disconnectGoogleDrive}><button className="crm-btn crm-btn-secondary crm-btn-sm">Disconnect</button></form>
            )}
          </div>
        )}
      </Card>
      {/* The CRM in ChatGPT or Claude (app/api/mcp): each owner's own link (Genesis Copilot is for the owners only). */}
      {usesAi(viewer) && (
        <Card title="ChatGPT / Claude">
          <ConnectorCard links={await connectorKeys(viewer.id)} />
        </Card>
      )}
      <Card title="Google Contacts">
        <p className="text-ash">
          Your contacts go into <strong className="text-bone">your own</strong> Google Contacts: the influencers you added, your leads, and the clients and vendors you look after, each under a &ldquo;Genesis ·&rdquo; label and updated when they change here (every few minutes). Super admins get everyone&apos;s.
        </p>
        {contacts === "connected" ? (
          <p className="crm-notice mt-3">On: contacts are syncing.</p>
        ) : (
          <p className="crm-notice crm-notice-warn mt-3">
            Off for you: open <b>Inbox · Gmail &amp; Drive</b> and click <b>Connect Google</b>, allowing Contacts. (The People API must be turned on in the Google Cloud project of the CRM&apos;s OAuth client.)
          </p>
        )}
      </Card>
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
