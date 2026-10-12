import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { Badge, Card, Empty, Notice, PageHead, Select, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { Reading } from "@/lib/crm/ai";
import { aiConfigured } from "@/lib/crm/ai";
import { dateTime, money } from "@/lib/crm/catalog";
import { COMPANY_ACCOUNT, googleConfigured } from "@/lib/crm/google";
import { sees } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { addAccountFromItem, attachItem, disconnectMyGoogle, dismissItem, expenseFromItem, importRazorpay, syncMyGoogle } from "../actions/inbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox" };

const KINDS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "info" | "muted" }> = {
  BRIEF: { label: "Brief", tone: "good" },
  CLIENT: { label: "Client details", tone: "info" },
  VENDOR: { label: "Vendor details", tone: "info" },
  INVOICE: { label: "Invoice", tone: "warn" },
  PROPOSAL: { label: "Proposal", tone: "muted" },
  LINK: { label: "Links", tone: "muted" },
  OTHER: { label: "Other", tone: "muted" },
};

const NOTICES: Record<string, [string, boolean]> = {
  connected: ["Google connected. Your inbox and Drive are checked every few minutes; the first look covers the last three weeks.", false],
  failed: ["Google didn't connect. Try again, signed in with your @genesismedia.co account.", true],
  cancelled: ["Connection cancelled.", true],
  unconfigured: ["Google isn't set up for the CRM yet (an owner adds the Google OAuth client). See Integrations.", true],
};

/**
 * THE INBOX (Genesis, 12 Oct 2026). What each person's Gmail and Drive turned
 * up, sorted by the AI. Briefs are already in the CRM (with a notification);
 * the rest waits here for one click. Owners and admins see everyone's.
 */
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string; person?: string; google?: string; item?: string }> }) {
  const viewer = await requireStaff();
  const p = await searchParams;
  const prisma = getPrisma();
  const seesAll = sees(viewer, "inbox");
  const finance = viewer.roles.some((r) => ["OWNER", "ADMIN", "FINANCE"].includes(r));
  const status = p.status === "DONE" || p.status === "DISMISSED" || p.status === "ALL" ? p.status : "NEW";
  const kind = p.kind && p.kind in KINDS ? p.kind : undefined;
  const person = seesAll ? (p.person === "me" ? viewer.id : p.person) : viewer.id;

  const [conn, connections, items, counts, leads, accounts] = await Promise.all([
    prisma.googleConnection.findUnique({ where: { userId: viewer.id } }),
    seesAll ? prisma.googleConnection.findMany({ orderBy: { connectedAt: "asc" } }) : Promise.resolve([]),
    prisma.inboxItem.findMany({
      where: { ...(status === "ALL" ? {} : { status }), ...(kind ? { kind: kind as never } : {}), ...(person ? { userId: person } : {}), ...(p.item ? { id: p.item } : {}) },
      orderBy: { occurredAt: "desc" },
      take: 150,
    }),
    prisma.inboxItem.groupBy({ by: ["kind"], where: { status: "NEW", ...(person ? { userId: person } : {}) }, _count: true }),
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, name: true, company: true } }),
    prisma.account.findMany({ orderBy: { name: "asc" }, take: 400, select: { id: true, name: true, kind: true } }),
  ]);
  const people = await prisma.user.findMany({ where: { id: { in: [...new Set([...items.map((i) => i.userId), ...connections.map((c) => c.userId)].filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, email: true } });
  const who = (id: string | null) => people.find((u) => u.id === id)?.name ?? people.find((u) => u.id === id)?.email ?? "—";
  const linkTo = (key: string, value: string) => {
    const q = new URLSearchParams({ ...(kind ? { kind } : {}), ...(status !== "NEW" ? { status } : {}), ...(p.person ? { person: p.person } : {}), [key]: value });
    if (!value) q.delete(key);
    return `/admin/inbox?${q}`;
  };
  const notice = p.google ? NOTICES[p.google] : undefined;
  const attachOptions = (
    <>
      <optgroup label="Clients">{accounts.filter((a) => a.kind !== "VENDOR").map((a) => <option key={a.id} value={`account:${a.id}`}>{a.name}</option>)}</optgroup>
      <optgroup label="Leads">{leads.map((l) => <option key={l.id} value={`lead:${l.id}`}>{l.company ? `${l.company} · ${l.name}` : l.name}</option>)}</optgroup>
      <optgroup label="Vendors">{accounts.filter((a) => a.kind === "VENDOR").map((a) => <option key={a.id} value={`account:${a.id}`}>{a.name}</option>)}</optgroup>
    </>
  );

  return (
    <>
      <PageHead kicker="Today" title="Inbox · Gmail & Drive" sub={seesAll ? "Everyone's, sorted by AI" : "Yours, sorted by AI"}>
        <Link href="/admin/inbox/sheets" className="crm-btn crm-btn-secondary crm-btn-sm">Import a Google Sheet</Link>
      </PageHead>
      {notice && <Notice warn={notice[1]}>{notice[0]}</Notice>}
      {!aiConfigured() && <Notice warn>The AI key isn&apos;t set yet (ANTHROPIC_API_KEY), so nothing is read until it is.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                Connect your @genesismedia.co Google once. New emails and Drive docs are read for briefs, client and vendor details, invoices, proposals and links. Briefs become leads automatically and you&apos;re notified; the rest waits here.
              </p>
              <p className="text-[0.8125rem] text-faint">Read-only. Personal mail, newsletters and notifications are skipped and never stored.</p>
              {googleConfigured() ? <a href="/api/crm/google/connect" className="crm-btn crm-btn-primary">Connect Google</a> : <Notice warn>Google isn&apos;t set up for the CRM yet. An owner adds the Google OAuth client (see Integrations).</Notice>}
            </div>
          )}
        </Card>

        <Card title="Waiting for you">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(KINDS).filter(([k]) => k !== "OTHER").map(([k, v]) => (
              <li key={k}>
                <Link href={linkTo("kind", k)} className="block rounded-xl bg-[var(--hover-wash)] px-3 py-2.5">
                  <span className="block text-[0.8125rem] text-ash">{v.label}</span>
                  <span className="text-[1.375rem] text-bone">{counts.find((c) => c.kind === k)?._count ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
          {finance && (
            <div className="mt-4 border-t border-[var(--glass-border)] pt-3">
              <p className="mb-2 text-[0.8125rem] text-ash">Past invoices and payments from Razorpay (two years), matched to clients:</p>
              <ActionForm action={importRazorpay} submit="Bring in Razorpay history" inline />
            </div>
          )}
        </Card>
      </div>

      {seesAll && connections.length > 0 && (
        <Table head={["Team member", "Google", "Last checked", "Status"]}>
          {connections.map((c) => (
            <tr key={c.id}>
              <td className="text-bone"><Link href={linkTo("person", c.userId)} className="hover:underline">{who(c.userId)}</Link></td>
              <td>{c.email}</td>
              <td>{c.lastSyncAt ? dateTime(c.lastSyncAt) : "Not yet"}</td>
              <td>{c.status === "ACTIVE" && !c.lastError ? <Badge tone="good">Connected</Badge> : <Badge tone="bad">{c.status === "REVOKED" ? "Needs reconnecting" : "Error"}</Badge>}</td>
            </tr>
          ))}
        </Table>
      )}

      <form action="/admin/inbox" className="flex flex-wrap items-end gap-2">
        <Select name="kind" defaultValue={kind} options={Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.label]))} placeholder="Everything" className="max-w-[12rem]" />
        <Select name="status" required defaultValue={status} options={[["NEW", "To handle"], ["DONE", "Done"], ["DISMISSED", "Dismissed"], ["ALL", "All"]]} className="max-w-[10rem]" />
        {seesAll && <Select name="person" defaultValue={p.person} options={[["me", "Just mine"], ...people.map((u) => [u.id, u.name ?? u.email ?? "—"] as [string, string])]} placeholder="Everyone" className="max-w-[12rem]" />}
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Show</button>
      </form>

      {items.length === 0 ? (
        <Empty>{conn ? "Nothing here yet. New mail and docs are checked every few minutes." : "Connect your Google to start."}</Empty>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const r = (item.data ?? {}) as unknown as Reading;
            const facts = [
              r.contact?.name && `Contact: ${r.contact.name}${r.contact.role ? ` (${r.contact.role})` : ""}`,
              (r.contact?.company ?? r.company?.name) && `Company: ${r.contact?.company ?? r.company?.name}`,
              r.contact?.email && `Email: ${r.contact.email}`,
              r.contact?.phone && `Phone: ${r.contact.phone}`,
              r.brief?.budgetRupees && `Budget: ${money(r.brief.budgetRupees * 100)}`,
              r.brief?.deliverables && `Deliverables: ${r.brief.deliverables}`,
              r.brief?.deadline && `Needed by: ${r.brief.deadline}`,
              r.company?.gstin && `GSTIN: ${r.company.gstin}`,
              r.company?.services && `Services: ${r.company.services}`,
              r.company?.rates && `Rates: ${r.company.rates}`,
              r.invoice?.amountRupees && `Invoice: ${money(r.invoice.amountRupees * 100)}${r.invoice.gstRupees ? ` (GST ${money(r.invoice.gstRupees * 100)})` : ""}${r.invoice.number ? ` · #${r.invoice.number}` : ""}${r.invoice.direction === "RECEIVED" ? " · to pay" : r.invoice.direction === "SENT" ? " · we billed" : ""}`,
            ].filter(Boolean) as string[];
            return (
              <li key={item.id} className="crm-card crm-pad space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={KINDS[item.kind]!.tone}>{KINDS[item.kind]!.label}</Badge>
                  <span className="text-[0.75rem] text-faint">{item.source === "GMAIL" ? "Gmail" : item.source === "DRIVE" ? "Drive" : item.source} · {dateTime(item.occurredAt)}{seesAll ? ` · ${who(item.userId)}` : ""}</span>
                  {item.status !== "NEW" && <Badge tone="muted">{item.status === "DONE" ? "Done" : "Dismissed"}</Badge>}
                </div>
                <p className="text-bone">{item.title}{item.sender && <span className="text-ash"> · {item.sender}</span>}</p>
                {item.summary && <p className="text-[0.875rem] text-ash">{item.summary}</p>}
                {facts.length > 0 && <p className="text-[0.8125rem] text-ash">{facts.join(" · ")}</p>}
                {item.links.length > 0 && (
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem]">
                    {item.links.slice(0, 6).map((l) => <a key={l} href={l} target="_blank" rel="noreferrer" className="crm-link max-w-[22rem] truncate">{l.replace(/^https?:\/\/(www\.)?/, "")}</a>)}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Open in {item.source === "GMAIL" ? "Gmail" : "Drive"} ↗</a>}
                  {item.briefId && <Link href={`/admin/briefs/${item.briefId}`} className="crm-btn crm-btn-primary crm-btn-sm">Open brief</Link>}
                  {item.leadId && <Link href={`/admin/leads/${item.leadId}`} className="crm-btn crm-btn-secondary crm-btn-sm">Lead</Link>}
                  {item.accountId && <Link href={`/admin/accounts/${item.accountId}`} className="crm-btn crm-btn-secondary crm-btn-sm">Client</Link>}
                  {item.status === "NEW" && (
                    <>
                      {(item.kind === "CLIENT" || item.kind === "VENDOR") && (
                        <>
                          <form action={addAccountFromItem}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="as" value={item.kind === "VENDOR" ? "VENDOR" : "BRAND"} /><button className="crm-btn crm-btn-primary crm-btn-sm">{item.accountId ? "Fill in the client" : item.kind === "VENDOR" ? "Add vendor" : "Add client"}</button></form>
                          {!item.accountId && <form action={addAccountFromItem}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="as" value={item.kind === "VENDOR" ? "BRAND" : "VENDOR"} /><button className="crm-btn crm-btn-secondary crm-btn-sm">{item.kind === "VENDOR" ? "It's a client" : "It's a vendor"}</button></form>}
                        </>
                      )}
                      {item.kind === "INVOICE" && finance && r.invoice?.amountRupees && r.invoice.direction !== "SENT" && (
                        <form action={expenseFromItem}><input type="hidden" name="id" value={item.id} /><button className="crm-btn crm-btn-primary crm-btn-sm">Record as expense</button></form>
                      )}
                      {item.kind !== "BRIEF" || !item.briefId ? (
                        <form action={attachItem} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={item.id} />
                          <select name="to" defaultValue={item.accountId ? `account:${item.accountId}` : item.leadId ? `lead:${item.leadId}` : ""} className="crm-input w-auto max-w-[16rem] !py-1.5 text-[0.8125rem]">
                            <option value="">{item.kind === "BRIEF" ? "New lead" : "Keep on…"}</option>
                            {attachOptions}
                          </select>
                          {item.kind === "BRIEF" ? (
                            <button name="as" value="brief" className="crm-btn crm-btn-primary crm-btn-sm">Make it a brief</button>
                          ) : (
                            <>
                              <button className="crm-btn crm-btn-secondary crm-btn-sm">Keep</button>
                              <button name="as" value="brief" className="text-[0.8125rem] text-ash hover:text-bone">It&apos;s a brief</button>
                            </>
                          )}
                        </form>
                      ) : null}
                      <form action={dismissItem}><input type="hidden" name="id" value={item.id} /><button className="text-[0.8125rem] text-faint hover:text-bone">Dismiss</button></form>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
