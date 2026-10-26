import Link from "next/link";

import { OutreachPanel } from "@/components/crm/outreach-panel";
import { Card, Empty, PageHead } from "@/components/crm/ui";
import { date } from "@/lib/crm/catalog";
import { contactBits, DEFAULT_DELIVERABLES, DEFAULT_OUTREACH } from "@/lib/crm/outreach";
import { quoteRef } from "@/lib/crm/quote-templates";
import { contactVisibility } from "@/lib/crm/creator-privacy";
import { lastReaches } from "@/lib/crm/reachout";
import { quoteScope, seesCreators } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reach out" };

/**
 * REACH OUT (Genesis, 22 Oct 2026: "add a Reachout tab in the left"). Every
 * influencer plan's creators in one place: pick a plan, then message each
 * creator for costing on WhatsApp or email from the saved template, and see
 * who has been contacted. The same panel as a plan's own page.
 */
export default async function ReachoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const viewer = await requireStaff("plans");
  const { plan: picked } = await searchParams;
  const prisma = getPrisma();
  const plans = await prisma.quote.findMany({
    where: { ...quoteScope(viewer), kind: "INFLUENCER_PLAN", creators: { some: {} } },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: { id: true, number: true, title: true, company: true, updatedAt: true, creators: { select: { reachout: true } } },
  });
  const current = plans.find((p) => p.id === picked) ?? plans[0];
  const q = current
    ? await prisma.quote.findUnique({ where: { id: current.id }, select: { id: true, company: true, createdById: true, creators: { orderBy: { position: "asc" }, select: { id: true, name: true, handle: true, city: true, contact: true, reachout: true, creatorId: true } } } })
    : null;
  const linked = q ? await prisma.creator.findMany({ where: { id: { in: q.creators.map((c) => c.creatorId).filter((x): x is string => Boolean(x)) } }, select: { id: true, phone: true, email: true } }) : [];
  /* Creators' numbers and emails, only where this person may see them (lib/crm/creator-privacy). */
  const visible = q ? await contactVisibility(viewer, q, q.creators.map((c) => c.creatorId)) : () => false;
  /* Each creator's latest reach-out from any plan (lib/crm/reachout). */
  const lasts = await lastReaches((q?.creators ?? []).map((c) => c.creatorId));
  const rows = (q?.creators ?? []).map((c) => {
    const d = linked.find((x) => x.id === c.creatorId);
    const bits = contactBits(c.contact);
    const open = visible(c);
    return { id: c.id, name: c.name, handle: c.handle, phone: open ? (d?.phone ?? bits.phone) : null, email: open ? (d?.email ?? bits.email) : null, reachout: c.reachout, last: c.creatorId ? (lasts[c.creatorId] ?? null) : null, canEdit: open };
  });
  const cities = [...new Set((q?.creators ?? []).map((c) => c.city).filter((c): c is string => Boolean(c)))];
  const template = (await prisma.appSetting.findUnique({ where: { key: "outreach-template" } }))?.value ?? DEFAULT_OUTREACH;

  return (
    <>
      <PageHead kicker="Influence" title="Reach out" sub="Ask creators for costing on WhatsApp or email, plan by plan.">
        {/* A new reach out picks creators from the database; without database access, it starts from a new plan. */}
        <Link href={seesCreators(viewer) ? "/admin/creators?reachout=1" : "/admin/quotes/new?kind=INFLUENCER_PLAN"} className="crm-btn crm-btn-secondary crm-btn-sm">＋ New reach out</Link>
        <Link href="/admin/quotes/new?kind=INFLUENCER_PLAN" className="crm-btn crm-btn-primary crm-btn-sm">＋ New influencer plan</Link>
      </PageHead>
      {plans.length === 0 ? (
        <Empty>No influencer plans with creators yet. Make one from Quotes &amp; plans, then reach out from here.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card title="Plans">
            <ul className="-mx-2 space-y-1">
              {plans.map((p) => {
                const done = p.creators.filter((c) => c.reachout).length;
                return (
                  <li key={p.id}>
                    <Link href={`/admin/reachout?plan=${p.id}`} aria-current={p.id === current?.id ? "page" : undefined} className="crm-nav-link !h-auto flex-col !items-start !gap-0 py-2">
                      <span className="line-clamp-1">{p.company ? `${p.company} · ` : ""}{p.title}</span>
                      <span className="text-[0.75rem] opacity-70">{quoteRef(p.number)} · {done}/{p.creators.length} contacted · {date(p.updatedAt)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          {q && (
            <Card title={<>Get costing · <Link href={`/admin/quotes/${q.id}`} className="crm-link">open the plan</Link></>} className="min-w-0">
              <OutreachPanel
                key={q.id}
                rows={rows}
                template={template}
                fields={{
                  campaign: `${q.company ?? "brand"} campaign`,
                  audience: "",
                  cities: cities.length > 1 ? `${cities.slice(0, -1).join(", ")} and ${cities.at(-1)}` : (cities[0] ?? ""),
                  deliverables: DEFAULT_DELIVERABLES,
                  sender: viewer.name ?? "Genesis Media",
                  senderTitle: viewer.title ?? "",
                }}
              />
            </Card>
          )}
        </div>
      )}
    </>
  );
}
