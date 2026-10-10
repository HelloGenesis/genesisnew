import { redirect } from "next/navigation";
import Link from "next/link";

import { Badge, Empty, PageHead, StageBar, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, PROJECT_STATUS, date, projectRef } from "@/lib/crm/catalog";
import { requirePortal } from "@/lib/crm/session";
import { stagesOf } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function PortalProjects() {
  const { account } = await requirePortal();
  /* A vendor's work lives under My work, not client projects. */
  if (account.kind === "VENDOR") redirect("/portal/work");
  const projects = await getPrisma().project.findMany({
    where: { accountId: account.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { deliverables: { where: { status: { not: "DRAFT" } }, select: { status: true } } },
  });
  return (
    <>
      <PageHead kicker={account.name} title="Projects" sub="Every piece of work, from brief to delivery." />
      {projects.length === 0 ? (
        <Empty>No projects yet. They open as soon as you buy, or when we start on a brief.</Empty>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => {
            const review = p.deliverables.filter((d) => d.status === "IN_REVIEW").length;
            const approved = p.deliverables.filter((d) => d.status === "APPROVED").length;
            return (
              <li key={p.id}>
                <Link href={`/portal/projects/${p.id}`} className="crm-card flex h-full flex-col gap-3 p-4 transition-transform hover:-translate-y-0.5">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0"><span className="block text-bone">{p.name}</span><span className="block text-[0.8125rem] text-ash">{projectRef(p.number)} · {DIVISION_LABEL[p.division]}{p.dueDate ? ` · due ${date(p.dueDate)}` : ""}</span></span>
                    <Status value={PROJECT_STATUS[p.status]} />
                  </span>
                  <StageBar stages={stagesOf(p)} stage={p.stage} compact />
                  <span className="flex flex-wrap gap-1">
                    {review > 0 && <Badge tone="warn">{review} to review</Badge>}
                    {(p.quota || approved > 0) && <Badge tone="good">{approved}{p.quota ? ` of ${p.quota}` : ""} delivered</Badge>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
