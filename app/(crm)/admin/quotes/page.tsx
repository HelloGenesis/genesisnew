import Link from "next/link";

import { Badge, Empty, PageHead, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { QuoteStatus } from "@/lib/generated/prisma/enums";
import { QUOTE_STATUS, date, money } from "@/lib/crm/catalog";
import { docRef } from "@/lib/crm/quote-templates";
import { daysFromNow } from "@/lib/crm/options";
import { quoteScope, isSuperAdmin, seesQuoteContact } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotes" };

/**
 * Every quotation and influencer plan, with what happened to it. `type`
 * (Genesis, 27 Oct 2026): price quotes and proposals under Sales, influencer
 * plans under Influence; neither shows both.
 */
export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const viewer = await requireStaff("plans");
  const { status, type: rawType } = await searchParams;
  const type = rawType === "plans" || rawType === "quotes" ? rawType : null;
  const kind = type === "plans" ? { kind: "INFLUENCER_PLAN" as const } : type === "quotes" ? { kind: "QUOTE" as const } : {};
  const withType = (q: string) => (type ? `type=${type}${q ? `&${q}` : ""}` : q);
  const prisma = getPrisma();
  const [quotes, open, won] = await Promise.all([
    prisma.quote.findMany({ where: { ...quoteScope(viewer), ...kind, ...(status && status in QUOTE_STATUS ? { status: status as QuoteStatus } : {}) }, orderBy: { createdAt: "desc" }, take: 200, include: { account: true, lead: true, _count: { select: { creators: true } } } }),
    prisma.quote.aggregate({ where: { ...quoteScope(viewer), ...kind, status: { in: ["SENT", "VIEWED"] } }, _sum: { totalPaise: true }, _count: true }),
    prisma.quote.aggregate({ where: { ...quoteScope(viewer), ...kind, status: { in: ["ACCEPTED", "PAID"] }, createdAt: { gte: daysFromNow(-30) } }, _sum: { totalPaise: true }, _count: true }),
  ]);
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
      <nav className="flex flex-wrap gap-1">
        {[["", "All"], ...Object.entries(QUOTE_STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <Link key={l} href={`/admin/quotes${withType(k ? `status=${k}` : "") ? `?${withType(k ? `status=${k}` : "")}` : ""}`} aria-current={(status ?? "") === k ? "page" : undefined} className="crm-nav-link !min-h-8">{l}</Link>
        ))}
      </nav>
      {quotes.length === 0 ? (
        <Empty>{type === "plans" ? "No influencer plans yet. Start one here, or from the influencer database." : "No quotes yet. Start one here, or from a lead, a client or a request."}</Empty>
      ) : (
        <Table head={["Quote", "Client", "Type", "Total", "Status", "Issued", "Valid until"]}>
          {quotes.map((q) => (
            <tr key={q.id}>
              <td><Link href={`/admin/quotes/${q.id}`} className="text-bone hover:underline">{docRef(q)} · {q.title}</Link></td>
              <td>{q.account?.name ?? q.company ?? (seesQuoteContact(viewer, q) ? q.contactName : "Client")}{seesQuoteContact(viewer, q) && <span className="block text-[0.75rem] text-faint">{q.contactEmail}</span>}</td>
              <td>{q.kind === "INFLUENCER_PLAN" ? `Influencer plan · ${q._count.creators}` : "Quote"}</td>
              <td className="tabular-nums">{money(q.totalPaise)}</td>
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
