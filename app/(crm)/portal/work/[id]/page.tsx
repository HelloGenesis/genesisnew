import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectFiles } from "@/components/crm/project-files";
import { Badge, Card, PageHead, StageBar } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, date, money, projectRef } from "@/lib/crm/catalog";
import { filesFor } from "@/lib/crm/files-view";
import { portalAccounts, requirePortal } from "@/lib/crm/session";
import { stagesOf } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Job" };

/**
 * A vendor's view of one job: the brief, where the project is, and the
 * project's folders they're allowed into — the brief and scripts, raw footage
 * and edits, and the cuts they upload. Client-only and internal files never show.
 */
export default async function VendorJob({ params }: { params: Promise<{ id: string }> }) {
  const { viewer } = await requirePortal();
  const { id } = await params;
  const vendorIds = (await portalAccounts(viewer)).filter((a) => a.kind === "VENDOR").map((a) => a.id);
  const a = await getPrisma().vendorAssignment.findUnique({ where: { id }, include: { project: { include: { account: true } } } });
  if (!a || !vendorIds.includes(a.vendorId) || a.status === "DECLINED" || a.status === "CANCELLED" || a.status === "OFFERED") notFound();
  const files = await filesFor(a.projectId, "vendor", { avatar: stagesOf(a.project).some((s) => /avatar/i.test(s)) });
  return (
    <>
      <PageHead kicker={`${DIVISION_LABEL[a.project.division]} · ${projectRef(a.project.number)}`} title={`${a.role} · ${a.project.name}`} sub={`Fee ${money(a.feePaise)}${a.dueDate ? ` · due ${date(a.dueDate)}` : ""}`}>
        <Badge tone="info">{a.status.toLowerCase()}</Badge>
        <Link href="/portal/work" className="crm-btn crm-btn-secondary crm-btn-sm">All my work</Link>
      </PageHead>
      {a.brief && <Card title="Your brief"><p className="whitespace-pre-wrap text-bone">{a.brief}</p></Card>}
      <Card><StageBar stages={stagesOf(a.project)} stage={a.project.stage} /></Card>
      <Card title="Project files" action={<span className="text-[0.8125rem] text-ash">Your uploads go to Genesis first; they decide what the client sees</span>}>
        <ProjectFiles projectId={a.projectId} role="vendor" folders={files.folders} files={files.files} />
      </Card>
    </>
  );
}
