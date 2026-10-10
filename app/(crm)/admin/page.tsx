import Link from "next/link";

import { Badge, Card, PageHead, Stats, Status, StageBar } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, DIVISIONS, LEAD_STATUS, ORDER_STATUS, REQUEST_KIND, REQUEST_STATUS, STAGES, date, money, projectRef, requestRef, todayIst } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/** Monthly value of a subscription: a quarterly plan's charge is three months. */
const monthly = (amountPaise: number, billing: string | null) => (billing === "quarterly" ? Math.round(amountPaise / 3) : amountPaise);

export default async function AdminOverview() {
  const viewer = await requireStaff();
  const prisma = getPrisma();
  const today = new Date(todayIst());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekAhead = new Date(today.getTime() + 7 * 864e5);

  const [pipeline, dueLeads, subs, revenue, activeProjects, inReview, changes, openRequests, failing, latestOrders, requests, dueProjects, myTasks, byDivision] = await Promise.all([
    prisma.lead.aggregate({ where: { status: { notIn: ["WON", "LOST", "NURTURE"] } }, _sum: { valuePaise: true }, _count: true }),
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: today } }, orderBy: { nextFollowUp: "asc" }, take: 8 }),
    prisma.subscription.findMany({ where: { status: { in: ["ACTIVE", "AUTHENTICATED"] } }, select: { amountPaise: true, billing: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: monthStart }, status: "CAPTURED" }, _sum: { amountPaise: true } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.deliverable.count({ where: { status: "IN_REVIEW" } }),
    prisma.deliverable.count({ where: { status: "CHANGES_REQUESTED" } }),
    prisma.request.count({ where: { status: "OPEN" } }),
    prisma.subscription.count({ where: { status: { in: ["PENDING", "HALTED"] } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { account: true } }),
    prisma.request.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, orderBy: { createdAt: "asc" }, take: 6, include: { account: true } }),
    prisma.project.findMany({ where: { status: "ACTIVE", dueDate: { lte: weekAhead } }, orderBy: { dueDate: "asc" }, take: 6, include: { account: true } }),
    prisma.task.findMany({ where: { status: "OPEN", ownerId: viewer.id }, orderBy: [{ dueDate: "asc" }], take: 6 }),
    prisma.project.groupBy({ by: ["division"], where: { status: "ACTIVE" }, _count: true }),
  ]);
  const mrr = subs.reduce((sum, s) => sum + monthly(s.amountPaise, s.billing), 0);

  return (
    <>
      <PageHead kicker="Genesis CRM" title={`Good to see you${viewer.name ? `, ${viewer.name.split(" ")[0]}` : ""}.`} sub="What needs attention across sales, delivery and money today." />

      <Stats
        items={[
          { label: "Open pipeline", value: money(pipeline._sum.valuePaise ?? 0), hint: `${pipeline._count} live leads`, href: "/admin/leads" },
          { label: "Follow-ups due", value: dueLeads.length, tone: dueLeads.length ? "warn" : undefined, href: "/admin/leads?due=1" },
          { label: "Recurring revenue (monthly)", value: money(mrr), hint: `${subs.length} active plans`, href: "/admin/billing" },
          { label: "Collected this month", value: money(revenue._sum.amountPaise ?? 0), href: "/admin/billing" },
          { label: "Active projects", value: activeProjects, href: "/admin/projects" },
          { label: "Waiting on client review", value: inReview, href: "/admin/projects?filter=review" },
          { label: "Changes requested", value: changes, tone: changes ? "warn" : undefined, href: "/admin/projects?filter=changes" },
          { label: failing ? "Renewals failing" : "Open requests", value: failing || openRequests, tone: failing ? "bad" : openRequests ? "warn" : undefined, href: failing ? "/admin/billing" : "/admin/requests" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Follow up today" action={<Link href="/admin/leads" className="crm-link text-[0.875rem]">Pipeline ↗</Link>}>
          {dueLeads.length === 0 ? (
            <p className="text-ash">Nothing due. Nice.</p>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {dueLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/leads/${lead.id}`} className="min-w-0">
                    <span className="block truncate text-bone">{lead.name}{lead.company ? ` · ${lead.company}` : ""}</span>
                    <span className="block truncate text-[0.8125rem] text-ash">{lead.interest ?? "—"} · due {date(lead.nextFollowUp)}</span>
                  </Link>
                  <Status value={LEAD_STATUS[lead.status]} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Requests waiting on us" action={<Link href="/admin/requests" className="crm-link text-[0.875rem]">Inbox ↗</Link>}>
          {requests.length === 0 ? (
            <p className="text-ash">Inbox zero.</p>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/requests/${r.id}`} className="min-w-0">
                    <span className="block truncate text-bone">{requestRef(r.number)} · {r.title}</span>
                    <span className="block truncate text-[0.8125rem] text-ash">{r.account.name} · {REQUEST_KIND[r.kind]} · {date(r.createdAt)}</span>
                  </Link>
                  <Status value={REQUEST_STATUS[r.status]} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Due in the next 7 days" action={<Link href="/admin/projects" className="crm-link text-[0.875rem]">Projects ↗</Link>}>
          {dueProjects.length === 0 ? (
            <p className="text-ash">No deadlines this week.</p>
          ) : (
            <ul className="space-y-4">
              {dueProjects.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/projects/${p.id}`} className="block">
                    <span className="flex justify-between gap-3 text-bone">
                      <span className="truncate">{projectRef(p.number)} · {p.name}</span>
                      <span className="shrink-0 text-[0.8125rem] text-ash">{date(p.dueDate)}</span>
                    </span>
                    <span className="mb-1.5 block text-[0.8125rem] text-ash">{p.account.name} · {DIVISION_LABEL[p.division]}</span>
                    <StageBar stages={STAGES[p.division]} stage={p.stage} compact />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Latest orders" action={<Link href="/admin/billing" className="crm-link text-[0.875rem]">Billing ↗</Link>}>
          {latestOrders.length === 0 ? (
            <p className="text-ash">No orders yet. They arrive here from checkout.</p>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {latestOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/billing/${o.id}`} className="min-w-0">
                    <span className="block truncate text-bone">{o.account?.name ?? o.company ?? o.contactName}</span>
                    <span className="block text-[0.8125rem] text-ash">{o.reference} · {money(o.totalPaise)} · {date(o.createdAt)}</span>
                  </Link>
                  <Status value={ORDER_STATUS[o.status]} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Your tasks" action={<Link href="/admin/tasks" className="crm-link text-[0.875rem]">All tasks ↗</Link>}>
          {myTasks.length === 0 ? (
            <p className="text-ash">Nothing assigned to you.</p>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {myTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-bone">{t.title}</span>
                  <span className="flex items-center gap-2">
                    {t.priority === "HIGH" && <Badge tone="bad">High</Badge>}
                    <span className="text-[0.8125rem] text-ash">{date(t.dueDate)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active work by division">
          <ul className="grid grid-cols-2 gap-3">
            {DIVISIONS.map((d) => (
              <li key={d} className="rounded-xl bg-[var(--hover-wash)] px-4 py-3">
                <Link href={`/admin/projects?division=${d}`}>
                  <span className="block text-[0.8125rem] text-ash">{DIVISION_LABEL[d]}</span>
                  <span className="text-[1.5rem] font-semibold text-bone">{byDivision.find((b) => b.division === d)?._count ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
