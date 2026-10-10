import Link from "next/link";

import { Badge, Empty, PageHead, Select, StageBar, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Division, ProjectStatus } from "@/lib/generated/prisma/enums";
import { DIVISION_LABEL, DIVISIONS, PROJECT_STATUS, STAGES, date, projectRef, todayIst } from "@/lib/crm/catalog";
import { staffOptions } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

import { advanceStage } from "../actions/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

/**
 * EVERY PIECE OF WORK, BY DIVISION. Each card is a project at its stage —
 * the AI approval workflow, the Studios shoot pipeline, the Brand & Design
 * concept rounds, an Influence campaign's creators — with what's delivered,
 * what's waiting on the client and what they asked to change.
 */
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ division?: string; status?: string; manager?: string; filter?: string; q?: string }> }) {
  await requireStaff();
  const params = await searchParams;
  const prisma = getPrisma();
  const division = DIVISIONS.includes(params.division as Division) ? (params.division as Division) : undefined;
  const status = (params.status && params.status in PROJECT_STATUS ? params.status : params.status === "all" ? undefined : "ACTIVE") as ProjectStatus | undefined;
  const where: Prisma.ProjectWhereInput = {
    ...(division ? { division } : {}),
    ...(status ? { status } : {}),
    ...(params.manager ? { managerId: params.manager } : {}),
    ...(params.filter === "review" ? { deliverables: { some: { status: "IN_REVIEW" } } } : {}),
    ...(params.filter === "changes" ? { deliverables: { some: { status: "CHANGES_REQUESTED" } } } : {}),
    ...(params.q ? { OR: [{ name: { contains: params.q, mode: "insensitive" } }, { account: { name: { contains: params.q, mode: "insensitive" } } }] } : {}),
  };
  const [projects, staff] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
      take: 300,
      include: {
        account: true,
        manager: true,
        deliverables: { select: { status: true } },
        _count: { select: { requests: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } } } },
      },
    }),
    staffOptions(),
  ]);
  const today = todayIst();

  return (
    <>
      <PageHead kicker="Delivery" title="Projects" sub={`${projects.length} shown`} exportKind="projects" />
      <form action="/admin/projects" className="flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={params.q} placeholder="Search project or client" className="crm-input max-w-xs" />
        <Select name="division" placeholder="All divisions" defaultValue={params.division} options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} className="max-w-[12rem]" />
        <Select name="status" defaultValue={params.status ?? "ACTIVE"} required options={[...Object.entries(PROJECT_STATUS).map(([k, v]) => [k, v.label] as const), ["all", "Any status"] as const]} className="max-w-[12rem]" />
        <Select name="manager" placeholder="Any producer" defaultValue={params.manager} options={staff} className="max-w-[12rem]" />
        <Select name="filter" placeholder="All work" defaultValue={params.filter} options={[["review", "Waiting on client"], ["changes", "Changes requested"]]} className="max-w-[12rem]" />
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Filter</button>
      </form>

      {projects.length === 0 ? (
        <Empty>No projects match. Paid orders open projects automatically; open one by hand from a client&apos;s page.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {projects.map((p) => {
            const approved = p.deliverables.filter((d) => d.status === "APPROVED").length;
            const review = p.deliverables.filter((d) => d.status === "IN_REVIEW").length;
            const changes = p.deliverables.filter((d) => d.status === "CHANGES_REQUESTED").length;
            const late = p.dueDate && p.status === "ACTIVE" && p.dueDate.toISOString().slice(0, 10) < today;
            return (
              <article key={p.id} className="crm-card flex flex-col gap-3 p-4">
                <Link href={`/admin/projects/${p.id}`} className="block">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-bone">{p.name}</span>
                      <span className="block truncate text-[0.8125rem] text-ash">{projectRef(p.number)} · {p.account.name}</span>
                    </span>
                    <Status value={PROJECT_STATUS[p.status]} />
                  </span>
                </Link>
                <StageBar stages={STAGES[p.division]} stage={p.stage} compact />
                <span className="flex flex-wrap gap-1">
                  <Badge tone="info">{DIVISION_LABEL[p.division]}</Badge>
                  {p.quota ? <Badge>{approved}/{p.quota} delivered</Badge> : approved ? <Badge>{approved} delivered</Badge> : null}
                  {review > 0 && <Badge tone="warn">{review} with client</Badge>}
                  {changes > 0 && <Badge tone="bad">{changes} changes</Badge>}
                  {p._count.requests > 0 && <Badge tone="warn">{p._count.requests} open requests</Badge>}
                </span>
                <span className="mt-auto flex items-center justify-between gap-2 text-[0.8125rem]">
                  <span className={late ? "font-semibold text-[#dc2626]" : "text-ash"}>
                    {p.dueDate ? `Due ${date(p.dueDate)}` : "No due date"} · {p.manager?.name ?? p.manager?.email ?? "Unassigned"}
                  </span>
                  {p.status === "ACTIVE" && p.stage < STAGES[p.division].length - 1 && (
                    <form action={advanceStage}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-ash hover:text-bone">Next stage →</button>
                    </form>
                  )}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
