import Link from "next/link";

import { Card, PageHead, StageBar, Stats, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, PROJECT_STATUS, REQUEST_STATUS, STAGES, SUBSCRIPTION_STATUS, date, money, requestRef } from "@/lib/crm/catalog";
import { requirePortal } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

export default async function PortalHome() {
  const { viewer, account } = await requirePortal();
  const prisma = getPrisma();
  const first = viewer.name?.split(" ")[0];

  if (account.kind === "VENDOR") {
    const [offers, live, invoices] = await Promise.all([
      prisma.vendorAssignment.findMany({ where: { vendorId: account.id, status: "OFFERED" }, include: { project: true } }),
      prisma.vendorAssignment.findMany({ where: { vendorId: account.id, status: { in: ["ACCEPTED", "SUBMITTED"] } }, include: { project: true }, orderBy: { dueDate: "asc" } }),
      prisma.vendorInvoice.aggregate({ where: { vendorId: account.id, status: { in: ["SUBMITTED", "APPROVED"] } }, _sum: { amountPaise: true, taxPaise: true } }),
    ]);
    return (
      <>
        <PageHead kicker={account.name} title={`Hi${first ? ` ${first}` : ""}. Here's your work with Genesis.`} />
        <Stats items={[{ label: "New offers", value: offers.length, tone: offers.length ? "warn" : undefined, href: "/portal/work" }, { label: "Jobs in progress", value: live.length, href: "/portal/work" }, { label: "Invoices being paid", value: money((invoices._sum.amountPaise ?? 0) + (invoices._sum.taxPaise ?? 0)), href: "/portal/invoices" }]} />
        <Card title="Due next">
          {live.length === 0 ? <p className="text-ash">Nothing in progress.</p> : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {live.map((a) => <li key={a.id} className="flex justify-between gap-2 py-2"><span className="text-bone">{a.role} · {a.project.name}</span><span className="text-[0.8125rem] text-ash">{a.dueDate ? `due ${date(a.dueDate)}` : ""}</span></li>)}
            </ul>
          )}
        </Card>
      </>
    );
  }

  const [review, projects, requests, subs] = await Promise.all([
    prisma.deliverable.findMany({ where: { status: "IN_REVIEW", project: { accountId: account.id } }, include: { project: true }, orderBy: { createdAt: "asc" } }),
    prisma.project.findMany({ where: { accountId: account.id, status: { in: ["ACTIVE", "ON_HOLD"] } }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { deliverables: { where: { status: "APPROVED" } } } } } }),
    prisma.request.findMany({ where: { accountId: account.id, status: { notIn: ["DONE", "DECLINED"] } }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.subscription.findMany({ where: { accountId: account.id, status: { notIn: ["CANCELLED", "COMPLETED"] } }, include: { order: { include: { lines: true } } } }),
  ]);
  const failing = subs.find((s) => s.status === "PENDING" || s.status === "HALTED");

  return (
    <>
      <PageHead kicker={account.name} title={`Hi${first ? ` ${first}` : ""}. Here's where everything stands.`}>
        <Link href="/portal/requests/new" className="crm-btn crm-btn-primary crm-btn-sm">Send a brief</Link>
      </PageHead>
      {failing && (
        <div className="crm-notice crm-notice-warn">
          Your plan&apos;s renewal payment didn&apos;t go through{failing.status === "HALTED" ? ", so new work is paused" : ". Razorpay is retrying"}. Update your payment method from Razorpay&apos;s email, or{" "}
          <Link href="/portal/requests/new?kind=BILLING" className="crm-link">ask us for a new link</Link>.
        </div>
      )}
      <Stats
        items={[
          { label: "Waiting for your review", value: review.length, tone: review.length ? "warn" : undefined, href: "/portal/projects" },
          { label: "Projects in progress", value: projects.length, href: "/portal/projects" },
          { label: "Open requests", value: requests.length, href: "/portal/requests" },
          { label: "Plan", value: subs[0] ? SUBSCRIPTION_STATUS[subs[0].status].label : "Pay per project", href: "/portal/billing" },
        ]}
      />
      {review.length > 0 && (
        <Card title="Ready for your review">
          <ul className="divide-y divide-[var(--glass-border)]">
            {review.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-bone">{d.title} <span className="text-[0.8125rem] text-ash">· {d.project.name}</span></span>
                <Link href={`/portal/projects/${d.projectId}#review`} className="crm-btn crm-btn-primary crm-btn-sm">Review</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Your projects" action={<Link href="/portal/projects" className="crm-link text-[0.875rem]">All projects</Link>}>
        {projects.length === 0 ? (
          <p className="text-ash">No work in progress. <Link href="/portal/requests/new" className="crm-link">Send a brief</Link> or <Link href="/pricing" className="crm-link">see plans</Link>.</p>
        ) : (
          <ul className="space-y-5">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/portal/projects/${p.id}`} className="block">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-bone">{p.name}</span>
                    <span className="flex items-center gap-2 text-[0.8125rem] text-ash">{DIVISION_LABEL[p.division]}{p.quota ? ` · ${p._count.deliverables} of ${p.quota} delivered` : ""} <Status value={PROJECT_STATUS[p.status]} /></span>
                  </span>
                  <span className="mt-2 block"><StageBar stages={STAGES[p.division]} stage={p.stage} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {requests.length > 0 && (
        <Card title="Your requests">
          <ul className="divide-y divide-[var(--glass-border)]">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/portal/requests/${r.id}`} className="truncate text-bone hover:underline">{requestRef(r.number)} · {r.title}</Link>
                <Status value={REQUEST_STATUS[r.status]} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      {subs.length > 0 && (
        <Card title="Your plan">
          {subs.map((s) => (
            <p key={s.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-bone">{s.order?.lines.filter((l) => l.kind === "MEMBERSHIP").map((l) => `${l.group} ${l.name}`).join(" + ") ?? "Plan"} · {money(s.amountPaise)} {s.billing === "quarterly" ? "every 3 months" : "a month"}</span>
              <span className="text-[0.8125rem] text-ash">{s.nextChargeAt ? `next charge ${date(s.nextChargeAt)}` : ""} <Status value={SUBSCRIPTION_STATUS[s.status]} /></span>
            </p>
          ))}
        </Card>
      )}
    </>
  );
}
