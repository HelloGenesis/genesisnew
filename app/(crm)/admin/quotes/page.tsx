import Link from "next/link";

import { Badge, Empty, PageHead, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { QuoteStatus } from "@/lib/generated/prisma/enums";
import { QUOTE_STATUS, date, money, moneyIn } from "@/lib/crm/catalog";
import { docRef } from "@/lib/crm/quote-templates";
import { daysFromNow } from "@/lib/crm/options";
import { quoteScope, isSuperAdmin, seesQuoteContact } from "@/lib/crm/scope";
import { workspaces } from "@/lib/crm/workspace";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotes" };

/**
 * Every quotation and influencer plan, with what happened to it. `type`
 * (Genesis, 27 Oct 2026): price quotes and proposals under Sales, influencer
 * plans under Influence; neither shows both.
 */
export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; crm?: string }> }) {
  const viewer = await requireStaff("plans");
  const { status, type: rawType, crm } = await searchParams;
  /*
   * EVERY CRM AT ONCE, FOR GENESIS'S OWNERS (Genesis, 2 Nov 2026: "as a super
   * admin, why wasn't I able to see this"): Genesis Media's quotes and plans
   * and every agency CRM's, each with its CRM, opening in it.
   */
  const owner = isSuperAdmin(viewer) && !viewer.workspaceId;
  const everyCrm = owner && crm === "all";
  const crms = owner ? await workspaces() : [];
  const crmName = (ws: string | null) => (ws ? (crms.find((c) => c.id === ws)?.name ?? "Agency CRM") : "Genesis Media");
  /* Its key present, so lib/db leaves every CRM in. */
  const scope = everyCrm ? { workspaceId: undefined } : quoteScope(viewer);
  const type = rawType === "plans" || rawType === "quotes" ? rawType : null;
  const kind = type === "plans" ? { kind: "INFLUENCER_PLAN" as const } : type === "quotes" ? { kind: "QUOTE" as const } : {};
  const withType = (q: string) => [type ? `type=${type}` : "", crm === "all" ? "crm=all" : "", q].filter(Boolean).join("&");
  const prisma = getPrisma();
  const [quotes, open, won] = await Promise.all([
    prisma.quote.findMany({ where: { ...scope, ...kind, ...(status && status in QUOTE_STATUS ? { status: status as QuoteStatus } : {}) }, orderBy: { createdAt: "desc" }, take: 200, include: { account: true, lead: true, _count: { select: { creators: true } } } }),
    /* Rupee totals only: a quote abroad is in its own currency. */
    prisma.quote.aggregate({ where: { ...scope, ...kind, currency: "INR", status: { in: ["SENT", "VIEWED"] } }, _sum: { totalPaise: true }, _count: true }),
    prisma.quote.aggregate({ where: { ...scope, ...kind, currency: "INR", status: { in: ["ACCEPTED", "PAID"] }, createdAt: { gte: daysFromNow(-30) } }, _sum: { totalPaise: true }, _count: true }),
  ]);
  /* Who made each, so a plan is easy to find by its maker. */
  const makers = new Map((await prisma.user.findMany({ where: { id: { in: [...new Set(quotes.map((q) => q.createdById).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, email: true } })).map((u) => [u.id, u.name ?? u.email ?? ""]));
  return (
    <>
      <PageHead
        kicker={type === "plans" ? "Influence" : "Sales"}
        title={type === "plans" ? "Influencer plans" : type === "quotes" ? "Quotes & proposals" : "Quotes & influencer plans"}
        exportKind={isSuperAdmin(viewer) ? "quotes" : undefined}
        sub={type === "plans" ? "Creator lists with costs and client prices, shared as a proposal, a client link or Google Sheets." : "Build from the standard plans and add-ons or write a custom quote, with a proposal, then send it with a payment link."}
      >
        {type !== "plans" && <Link href="/admin/quotes/new" className={`crm-btn crm-btn-sm ${type === "quotes" || !type ? "crm-btn-primary" : "crm-btn-secondary"}`}>New quote</Link>}
        {type !== "quotes" && <Link href="/admin/quotes/new?kind=INFLUENCER_PLAN" className={`crm-btn crm-btn-sm ${type === "plans" ? "crm-btn-primary" : "crm-btn-secondary"}`}>New influencer plan</Link>}
      </PageHead>
      <Stats items={[{ label: "Out with clients", value: money(open._sum.totalPaise ?? 0), hint: `${open._count} quotes` }, { label: "Won, last 30 days", value: money(won._sum.totalPaise ?? 0), hint: `${won._count} accepted or paid` }]} />
      {owner && (
        <div className="flex flex-wrap items-center gap-2 text-[0.875rem]">
          <Link href={`/admin/quotes?${[type ? `type=${type}` : "", status ? `status=${status}` : ""].filter(Boolean).join("&")}`} aria-current={!everyCrm ? "page" : undefined} className="crm-nav-link !min-h-8">This CRM</Link>
          <Link href={`/admin/quotes?${[type ? `type=${type}` : "", status ? `status=${status}` : "", "crm=all"].filter(Boolean).join("&")}`} aria-current={everyCrm ? "page" : undefined} className="crm-nav-link !min-h-8">Every CRM ({crms.length + 1})</Link>
          {everyCrm && <span className="text-ash">Genesis Media and every agency&apos;s; opening one switches to its CRM.</span>}
        </div>
      )}
      <nav className="flex flex-wrap gap-1">
        {[["", "All"], ...Object.entries(QUOTE_STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <Link key={l} href={`/admin/quotes${withType(k ? `status=${k}` : "") ? `?${withType(k ? `status=${k}` : "")}` : ""}`} aria-current={(status ?? "") === k ? "page" : undefined} className="crm-nav-link !min-h-8">{l}</Link>
        ))}
      </nav>
      {quotes.length === 0 ? (
        <Empty>{type === "plans" ? "No influencer plans yet. Start one here, or from the influencer database." : "No quotes yet. Start one here, or from a lead, a client or a request."}</Empty>
      ) : (
        <Table head={everyCrm ? ["Quote", "CRM", "Client", "Type", "Total", "Status", "Issued", "Valid until"] : ["Quote", "Client", "Type", "Total", "Status", "Issued", "Valid until"]}>
          {quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <Link href={owner && (q.workspaceId ?? null) !== (viewer.ws ?? null) ? `/admin/switch?ws=${q.workspaceId ?? ""}&next=${encodeURIComponent(`/admin/quotes/${q.id}`)}` : `/admin/quotes/${q.id}`} className="text-bone hover:underline">
                  {docRef(q)} · {q.title}
                </Link>
                {q.createdById && makers.get(q.createdById) && <span className="block text-[0.75rem] text-faint">by {makers.get(q.createdById)}</span>}
              </td>
              {everyCrm && <td className="text-ash">{crmName(q.workspaceId)}</td>}
              <td>{q.account?.name ?? q.company ?? (seesQuoteContact(viewer, q) ? q.contactName : "Client")}{seesQuoteContact(viewer, q) && <span className="block text-[0.75rem] text-faint">{q.contactEmail}</span>}</td>
              <td>{q.kind === "INFLUENCER_PLAN" ? `Influencer plan · ${q._count.creators}` : "Quote"}</td>
              <td className="tabular-nums">{moneyIn(q.totalPaise, q.currency)}</td>
              <td><Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge></td>
              <td>{date(q.issuedAt)}</td>
              <td className={q.expiresAt < new Date() && !["PAID", "ACCEPTED"].includes(q.status) ? "text-[#dc2626]" : ""}>{date(q.expiresAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
