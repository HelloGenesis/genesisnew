import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { Badge, Card, Empty, Notice, PageHead, Select, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { Reading } from "@/lib/crm/ai";
import { aiConfigured } from "@/lib/crm/ai";
import { dateTime, money } from "@/lib/crm/catalog";
import { sees, leadScope, accountScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { addAccountFromItem, attachItem, dismissItem, expenseFromItem, importRazorpay } from "../actions/inbox";

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

const daysAgo = (days: number) => new Date(Date.now() - days * 864e5);

const NOTICES: Record<string, [string, boolean]> = {
  connected: ["Google connected. Your inbox and Drive are checked every few minutes; the first look covers the last three days.", false],
  failed: ["Google didn't connect. Try again, signed in with your @genesismedia.co account.", true],
  cancelled: ["Connection cancelled.", true],
  unconfigured: ["Google isn't set up for the CRM yet (an owner adds the Google OAuth client). See Integrations.", true],
};

/**
 * THE INBOX (Genesis, 12 Oct 2026). What each person's Gmail and Drive turned
 * up, sorted by the AI. Briefs are already in the CRM (with a notification);
 * the rest waits here for one click. Owners and admins see everyone's.
 */
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string; person?: string; google?: string; item?: string; q?: string; days?: string }> }) {
  const viewer = await requireStaff();
  const p = await searchParams;
  const prisma = getPrisma();
  const seesAll = sees(viewer, "inbox");
  const finance = viewer.roles.some((r) => ["OWNER", "ADMIN", "FINANCE"].includes(r));
  const status = p.status === "DONE" || p.status === "DISMISSED" || p.status === "ALL" ? p.status : "NEW";
  const kind = p.kind && p.kind in KINDS ? p.kind : undefined;
  const person = seesAll ? (p.person === "me" ? viewer.id : p.person) : viewer.id;
  /* Search and recency (Genesis, 13 Oct 2026): the last 14 days unless asked for more; a search looks at everything. */
  const q = p.q?.trim().slice(0, 100) ?? "";
  const days = p.days === "all" || q || p.item ? null : Math.min(Math.max(Number(p.days) || 14, 1), 365);
  const recent = days ? { occurredAt: { gte: daysAgo(days) } } : {};
  const search = q ? { OR: (["title", "sender", "senderEmail", "summary"] as const).map((f) => ({ [f]: { contains: q, mode: "insensitive" as const } })) } : {};

  const [conn, connections, items, counts, leads, accounts] = await Promise.all([
    prisma.googleConnection.findUnique({ where: { userId: viewer.id } }),
    seesAll ? prisma.googleConnection.findMany({ orderBy: { connectedAt: "asc" } }) : Promise.resolve([]),
    prisma.inboxItem.findMany({
      where: { ...(status === "ALL" || q ? {} : { status }), ...(kind ? { kind: kind as never } : {}), ...(person ? { userId: person } : {}), ...(p.item ? { id: p.item } : {}), ...recent, ...search },
      orderBy: { occurredAt: "desc" },
      take: 150,
    }),
    prisma.inboxItem.groupBy({ by: ["kind"], where: { status: "NEW", ...(person ? { userId: person } : {}), ...recent }, _count: true }),
    prisma.lead.findMany({ where: { ...leadScope(viewer), status: { notIn: ["WON", "LOST"] } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, name: true, company: true } }),
    prisma.account.findMany({ where: accountScope(viewer), orderBy: { name: "asc" }, take: 400, select: { id: true, name: true, kind: true } }),
  ]);
  const people = await prisma.user.findMany({ where: { id: { in: [...new Set([...items.map((i) => i.userId), ...connections.map((c) => c.userId)].filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, email: true } });
  const who = (id: string | null) => people.find((u) => u.id === id)?.name ?? people.find((u) => u.id === id)?.email ?? "—";
  const linkTo = (key: string, value: string) => {
    const qs = new URLSearchParams({ ...(kind ? { kind } : {}), ...(status !== "NEW" ? { status } : {}), ...(p.person ? { person: p.person } : {}), ...(p.days ? { days: p.days } : {}), [key]: value });
    if (!value) qs.delete(key);
    return `/admin/inbox?${qs}`;
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

      {/* Connecting Google lives in My settings (Genesis, 31 Oct 2026: "this can go in settings"). */}
      {!conn && <Notice>Connect your Google once in <Link href="/admin/me" className="crm-link">My settings</Link>: new emails and Drive docs are then read for briefs, client and vendor details, invoices and links.</Notice>}
      <div>
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
        <input type="search" name="q" defaultValue={q} placeholder="Search mail & docs: subject, sender, email…" className="crm-input min-w-[16rem] flex-1 sm:max-w-[24rem]" aria-label="Search the inbox" />
        <Select name="days" defaultValue={p.days ?? "14"} options={[["7", "Last 7 days"], ["14", "Last 14 days"], ["30", "Last 30 days"], ["all", "All time"]]} className="max-w-[10rem]" />
        <Select name="kind" defaultValue={kind} options={Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.label]))} placeholder="Everything" className="max-w-[12rem]" />
        <Select name="status" required defaultValue={status} options={[["NEW", "To handle"], ["DONE", "Done"], ["DISMISSED", "Dismissed"], ["ALL", "All"]]} className="max-w-[10rem]" />
        {seesAll && <Select name="person" defaultValue={p.person} options={[["me", "Just mine"], ...people.map((u) => [u.id, u.name ?? u.email ?? "—"] as [string, string])]} placeholder="Everyone" className="max-w-[12rem]" />}
        <button className="crm-btn crm-btn-primary crm-btn-sm">Search</button>
        {(q || p.days || kind || status !== "NEW" || p.person) && <Link href="/admin/inbox" className="crm-btn crm-btn-secondary crm-btn-sm">Clear</Link>}
      </form>
      {q && <p className="text-[0.875rem] text-ash" role="status">{items.length === 150 ? "150+" : items.length} {items.length === 1 ? "result" : "results"} for “{q}” across everything (any status, any date).</p>}

      {items.length === 0 ? (
        <Empty>{q ? `Nothing matches “${q}”.` : days ? `Nothing in the last ${days} days. Choose “All time” to see older items.` : conn ? "Nothing here yet. New mail and docs are checked every few minutes." : "Connect your Google to start."}</Empty>
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
