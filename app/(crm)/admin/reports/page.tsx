import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, Empty, PageHead, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, DIVISIONS, LEAD_STATUS, PIPELINE, date, money, projectRef } from "@/lib/crm/catalog";
import { FOLDERS } from "@/lib/crm/files";
import { compact, metrics, pct } from "@/lib/crm/report";
import { daysFromNow } from "@/lib/crm/options";
import { sees } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { stagesOf } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

const bytes = (n: number) => (n > 1e12 ? `${(n / 1e12).toFixed(2)} TB` : n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(0)} MB` : `${Math.round(n / 1e3)} KB`);
const month = (d: Date) => new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "Asia/Kolkata" }).format(d);

/**
 * WHAT'S HAPPENING, IN NUMBERS (Genesis, 10 Oct 2026: "monitor the live
 * videos, current raw files total, influencer campaign report …").
 *
 * Live posts and their reach; every campaign's numbers, one click from its
 * client-ready report; the raw footage and files held per project; where the
 * delivery pipeline is; money in by month and division; sales conversion;
 * and who on the team is carrying what.
 */
export default async function ReportsPage() {
  const viewer = await requireStaff();
  /* Reports show everyone's numbers: super admins, or whoever they open it to (lib/crm/scope). */
  if (!sees(viewer, "reports")) redirect("/admin/forbidden");
  const prisma = getPrisma();
  const since = daysFromNow(-180);
  const [posts, campaigns, fileGroups, rawByProject, active, deliverables, payments, leads, quotes, tasks, vendorPaid] = await Promise.all([
    prisma.campaignCreator.findMany({ where: { postUrl: { not: null } }, orderBy: [{ postedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }], take: 25, include: { creator: true, project: { include: { account: true } } } }),
    prisma.project.findMany({ where: { division: "INFLUENCE", creators: { some: {} } }, orderBy: { updatedAt: "desc" }, take: 30, include: { account: true, creators: true } }),
    prisma.driveFile.groupBy({ by: ["folder"], _count: true, _sum: { sizeBytes: true } }),
    prisma.driveFile.groupBy({ by: ["projectId"], where: { folder: "raw" }, _count: true, _sum: { sizeBytes: true }, orderBy: { _sum: { sizeBytes: "desc" } }, take: 15 }),
    prisma.project.findMany({ where: { status: "ACTIVE" }, select: { stages: true, division: true, stage: true, dueDate: true } }),
    prisma.deliverable.groupBy({ by: ["status"], _count: true }),
    prisma.payment.findMany({ where: { paidAt: { gte: since }, status: "CAPTURED" }, select: { amountPaise: true, paidAt: true, order: { select: { lines: { select: { division: true }, take: 1 } } }, subscription: { select: { order: { select: { lines: { select: { division: true }, take: 1 } } } } } } }),
    prisma.lead.groupBy({ by: ["status"], _count: true, _sum: { valuePaise: true } }),
    prisma.quote.groupBy({ by: ["status"], where: { createdAt: { gte: daysFromNow(-90) } }, _count: true, _sum: { totalPaise: true } }),
    prisma.task.groupBy({ by: ["ownerId"], where: { status: "OPEN" }, _count: true }),
    prisma.vendorInvoice.aggregate({ where: { status: "PAID", paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { amountPaise: true, taxPaise: true } }),
  ]);
  const rawProjects = await prisma.project.findMany({ where: { id: { in: rawByProject.map((r) => r.projectId!).filter(Boolean) } }, include: { account: true } });
  const owners = await prisma.user.findMany({ where: { id: { in: tasks.map((t) => t.ownerId!).filter(Boolean) } }, select: { id: true, name: true, email: true } });
  const overdueByOwner = await prisma.task.groupBy({ by: ["ownerId"], where: { status: "OPEN", dueDate: { lt: new Date() } }, _count: true });

  const allPosts = metrics(posts);
  const totalFiles = fileGroups.reduce((s, g) => s + g._count, 0);
  const totalBytes = fileGroups.reduce((s, g) => s + Number(g._sum.sizeBytes ?? 0), 0);
  const raw = fileGroups.find((g) => g.folder === "raw");
  const late = active.filter((p) => p.dueDate && p.dueDate < new Date()).length;

  /* Where active work sits: by stage name across every template. */
  const atStage = new Map<string, number>();
  for (const p of active) {
    const name = stagesOf(p)[p.stage] ?? "—";
    atStage.set(name, (atStage.get(name) ?? 0) + 1);
  }

  /* Money in, by month and by the division of what was bought. */
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return month(d);
  });
  const revenue = new Map<string, number>(months.map((m) => [m, 0]));
  const byDivision = new Map<string, number>();
  for (const p of payments) {
    const m = month(p.paidAt);
    if (revenue.has(m)) revenue.set(m, revenue.get(m)! + p.amountPaise);
    const d = p.order?.lines[0]?.division ?? p.subscription?.order?.lines[0]?.division ?? "STUDIOS";
    byDivision.set(d, (byDivision.get(d) ?? 0) + p.amountPaise);
  }
  const maxMonth = Math.max(1, ...revenue.values());
  const q = (s: string) => quotes.find((x) => x.status === s)?._count ?? 0;
  const sent = quotes.reduce((s, x) => s + (x.status === "DRAFT" ? 0 : x._count), 0);
  const won = q("ACCEPTED") + q("PAID");

  return (
    <>
      <PageHead kicker="Today" title="Reports" sub="Live content, files, campaigns, delivery, money and the team, in one place." />
      <Stats
        items={[
          { label: "Live posts tracked", value: posts.length, hint: `${compact(allPosts.views)} views · ${compact(allPosts.engagements)} engagements` },
          { label: "Raw footage held", value: raw ? bytes(Number(raw._sum.sizeBytes ?? 0)) : "0", hint: `${raw?._count ?? 0} raw files` },
          { label: "All project files", value: bytes(totalBytes), hint: `${totalFiles} files in Drive` },
          { label: "Projects running late", value: late, tone: late ? "bad" : undefined, href: "/admin/projects" },
        ]}
      />

      <Card title="Influencer campaigns" action={<span className="text-[0.8125rem] text-ash">Open one for the client-ready report</span>}>
        {campaigns.length === 0 ? (
          <p className="text-ash">No campaigns with creators yet.</p>
        ) : (
          <Table head={["Campaign", "Creators", "Live", "Views", "Engagements", "ER", "Spend", "CPV", "Shared"]}>
            {campaigns.map((c) => {
              const m = metrics(c.creators);
              return (
                <tr key={c.id}>
                  <td><Link href={`/admin/reports/campaign/${c.id}`} className="text-bone hover:underline">{c.name}</Link><span className="block text-[0.75rem] text-ash">{c.account.name} · {projectRef(c.number)}</span></td>
                  <td className="tabular-nums">{m.creators}</td>
                  <td className="tabular-nums">{m.live}</td>
                  <td className="tabular-nums">{compact(m.views)}</td>
                  <td className="tabular-nums">{compact(m.engagements)}</td>
                  <td className="tabular-nums">{pct(m.engagementRate)}</td>
                  <td className="tabular-nums">{money(m.spend)}</td>
                  <td className="tabular-nums">{m.cpv === null ? "—" : money(Math.round(m.cpv * 100) / 100)}</td>
                  <td>{c.reportShared ? "Yes" : "—"}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Card title="Live videos" action={<span className="text-[0.8125rem] text-ash">Latest posts with a link</span>}>
        {posts.length === 0 ? (
          <p className="text-ash">No live posts yet. Add the post link and numbers to a creator on a campaign.</p>
        ) : (
          <Table head={["Post", "Campaign", "Posted", "Views", "Likes", "Comments", "Shares", "Saves", "ER"]}>
            {posts.map((p) => {
              const m = metrics([p]);
              return (
                <tr key={p.id}>
                  <td><a href={p.postUrl!} target="_blank" rel="noopener noreferrer" className="text-bone hover:underline">{p.creator.name} ↗</a><span className="block text-[0.75rem] text-ash">@{p.creator.handle} · {p.creator.platform.toLowerCase()}</span></td>
                  <td><Link href={`/admin/reports/campaign/${p.projectId}`} className="hover:underline">{p.project.name}</Link><span className="block text-[0.75rem] text-ash">{p.project.account.name}</span></td>
                  <td>{date(p.postedAt)}</td>
                  <td className="tabular-nums">{compact(p.views)}</td>
                  <td className="tabular-nums">{compact(p.likes)}</td>
                  <td className="tabular-nums">{compact(p.comments)}</td>
                  <td className="tabular-nums">{compact(p.shares)}</td>
                  <td className="tabular-nums">{compact(p.saves)}</td>
                  <td className="tabular-nums">{pct(m.engagementRate)}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Files by folder">
          {fileGroups.length === 0 ? (
            <p className="text-ash">No files uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {FOLDERS.map((f) => {
                const g = fileGroups.find((x) => x.folder === f.key);
                return g ? (
                  <li key={f.key} className="flex justify-between py-2"><span className="text-bone">{f.label}</span><span className="tabular-nums text-ash">{g._count} files · {bytes(Number(g._sum.sizeBytes ?? 0))}</span></li>
                ) : null;
              })}
            </ul>
          )}
        </Card>
        <Card title="Raw footage by project">
          {rawByProject.length === 0 ? (
            <p className="text-ash">No raw files yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {rawByProject.map((r) => {
                const p = rawProjects.find((x) => x.id === r.projectId);
                return (
                  <li key={r.projectId} className="flex justify-between gap-2 py-2">
                    <Link href={`/admin/projects/${r.projectId}#files`} className="truncate text-bone hover:underline">{p ? `${projectRef(p.number)} · ${p.name}` : "—"}<span className="block text-[0.75rem] text-ash">{p?.account.name}</span></Link>
                    <span className="shrink-0 tabular-nums text-ash">{r._count} · {bytes(Number(r._sum.sizeBytes ?? 0))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Where active work is">
          <ul className="space-y-1.5">
            {[...atStage.entries()].sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
              <li key={stage} className="flex items-center gap-3">
                <span className="w-48 shrink-0 truncate text-[0.875rem] text-ash">{stage}</span>
                <span className="h-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#f2607e]" style={{ width: `${(count / Math.max(1, active.length)) * 100}%`, minWidth: "0.5rem" }} />
                <span className="text-[0.8125rem] tabular-nums text-bone">{count}</span>
              </li>
            ))}
            {active.length === 0 && <li className="text-ash">Nothing active.</li>}
          </ul>
          <p className="mt-4 text-[0.8125rem] text-ash">
            Deliverables: {deliverables.map((d) => `${d._count} ${d.status.toLowerCase().replace("_", " ")}`).join(" · ") || "none"}
          </p>
        </Card>

        <Card title="Money in, last 6 months">
          <ul className="space-y-1.5">
            {months.map((m) => (
              <li key={m} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-[0.8125rem] text-ash">{m}</span>
                <span className="h-2 rounded-full bg-[#ffc516]" style={{ width: `${(revenue.get(m)! / maxMonth) * 70}%`, minWidth: revenue.get(m) ? "0.5rem" : 0 }} />
                <span className="text-[0.8125rem] tabular-nums text-bone">{money(revenue.get(m)!)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.8125rem] text-ash">
            By division: {DIVISIONS.map((d) => `${DIVISION_LABEL[d]} ${money(byDivision.get(d) ?? 0)}`).join(" · ")} · Vendors paid this month {money((vendorPaid._sum.amountPaise ?? 0) + (vendorPaid._sum.taxPaise ?? 0))}
          </p>
        </Card>

        <Card title="Sales">
          <ul className="divide-y divide-[var(--glass-border)]">
            {PIPELINE.map((s) => {
              const g = leads.find((l) => l.status === s);
              return <li key={s} className="flex justify-between py-1.5 text-[0.9375rem]"><span className="text-ash">{LEAD_STATUS[s].label}</span><span className="tabular-nums text-bone">{g?._count ?? 0} · {money(g?._sum.valuePaise ?? 0)}</span></li>;
            })}
          </ul>
          <p className="mt-3 text-[0.8125rem] text-ash">
            Quotes, last 90 days: {sent} sent · {q("VIEWED")} opened · {won} won ({sent ? Math.round((won / sent) * 100) : 0}%) · {q("DECLINED")} declined
          </p>
        </Card>

        <Card title="Team workload">
          {tasks.length === 0 ? (
            <Empty>No open tasks.</Empty>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {tasks.sort((a, b) => b._count - a._count).map((t) => {
                const o = owners.find((x) => x.id === t.ownerId);
                const late = overdueByOwner.find((x) => x.ownerId === t.ownerId)?._count ?? 0;
                return (
                  <li key={t.ownerId ?? "none"} className="flex justify-between py-2">
                    <Link href={`/admin/tasks?owner=${t.ownerId ?? "all"}`} className="text-bone hover:underline">{o?.name ?? o?.email ?? "Unassigned"}</Link>
                    <span className="tabular-nums text-ash">{t._count} open{late ? <span className="text-[#dc2626]"> · {late} overdue</span> : null}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
