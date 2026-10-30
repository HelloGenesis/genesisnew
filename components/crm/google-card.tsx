import { ActionForm } from "@/components/crm/action-form";
import { Card, Notice } from "@/components/crm/ui";
import { dateTime } from "@/lib/crm/catalog";
import { COMPANY_ACCOUNT, googleConfigured } from "@/lib/crm/google";
import { getPrisma } from "@/lib/db";

import { disconnectMyGoogle, syncMyGoogle } from "@/app/(crm)/admin/actions/inbox";

/**
 * YOUR GOOGLE: this person's Gmail and Drive, connected once for the Inbox
 * (lib/crm/ingest). In My settings (Genesis, 31 Oct 2026: "this can go in
 * settings"); the Inbox links here.
 */
export async function GoogleCard({ userId, agency }: { userId: string; agency: boolean }) {
  const conn = await getPrisma().googleConnection.findUnique({ where: { userId } });
  return (
    <Card title="Your Google">
          {conn ? (
            <div className="space-y-3">
              <p className="text-bone">Connected as {conn.email}</p>
              {!conn.scopes.includes("auth/drive.file") && (
                <Notice warn>
                  Reconnect once to allow file access: project uploads and the live CRM Google Sheets need it{conn.email === COMPANY_ACCOUNT() ? " (this is the company account they use)" : ""}.{" "}
                  <a href="/api/crm/google/connect" className="crm-link">Reconnect Google</a>
                </Notice>
              )}
              <p className="text-[0.875rem] text-ash">
                Gmail inbox and Drive, read-only. {conn.lastSyncAt ? `Last checked ${dateTime(conn.lastSyncAt)}.` : "First check within five minutes."}
              </p>
              {conn.lastError && <Notice warn><span className="break-words [overflow-wrap:anywhere]">{conn.status === "REVOKED" ? "Google access was removed. Connect again." : `Last check failed: ${conn.lastError.slice(0, 160)}`}</span></Notice>}
              <div className="flex flex-wrap items-center gap-2">
                <ActionForm action={syncMyGoogle} submit="Check now" inline />
                {conn.status === "REVOKED" && <a href="/api/crm/google/connect" className="crm-btn crm-btn-primary crm-btn-sm">Connect again</a>}
                <form action={disconnectMyGoogle}>
                  <button className="text-[0.8125rem] text-faint hover:text-[#dc2626]">Disconnect</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-ash">
                Connect your {agency ? "work" : "@genesismedia.co"} Google once. New emails and Drive docs are read for briefs, client and vendor details, invoices, proposals and links. Briefs become leads automatically and you&apos;re notified; the rest waits here.
              </p>
              <p className="text-[0.8125rem] text-faint">Read-only. Personal mail, newsletters and notifications are skipped and never stored.</p>
              {googleConfigured() ? <a href="/api/crm/google/connect" className="crm-btn crm-btn-primary">Connect Google</a> : <Notice warn>Google isn&apos;t set up for the CRM yet. An owner adds the Google OAuth client (see Integrations).</Notice>}
            </div>
          )}
        </Card>
  );
}
