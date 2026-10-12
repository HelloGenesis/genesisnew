import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { CampaignReport } from "@/components/crm/campaign-report";
import { Card, Field, PageHead, Select } from "@/components/crm/ui";
import { CAMPAIGN_CREATOR_STATUS, projectRef } from "@/lib/crm/catalog";
import { campaign } from "@/lib/crm/report";
import { sees } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { saveReport, updateCampaignCreator } from "../../../actions/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campaign report" };

/**
 * MAKE THE CAMPAIGN REPORT RIGHT HERE: each creator's post link and numbers
 * (views, reach, likes, comments, shares, saves) and notes, a written summary,
 * and one switch to share it with the client — who sees it in their portal and
 * can print it to PDF.
 */
export default async function CampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireStaff();
  /* Reports show everyone's numbers: super admins, or whoever they open it to (lib/crm/scope). */
  if (!sees(viewer, "reports")) redirect("/admin/forbidden");
  const { id } = await params;
  const data = await campaign(id);
  if (!data) notFound();
  const { project, rows } = data;
  return (
    <>
      <PageHead kicker={`Report · ${projectRef(project.number)}`} title={project.name} sub={project.account.name}>
        <Link href={`/admin/projects/${project.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">Project</Link>
        {project.reportShared && <a href={`/portal/projects/${project.id}/report`} className="crm-btn crm-btn-secondary crm-btn-sm">Client view ↗</a>}
      </PageHead>

      <CampaignReport title={project.name} client={project.account.name} rows={rows} summary={project.reportSummary} heading={false} />

      <Card title="Update the numbers">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <details className="rounded-xl bg-[var(--hover-wash)] px-3 py-2">
                <summary className="cursor-pointer text-bone">{r.name} <span className="text-[0.8125rem] text-ash">@{r.handle}</span></summary>
                <ActionForm action={updateCampaignCreator} submit="Save numbers" className="mt-3">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <Field label="Status"><Select name="status" required defaultValue={r.status} options={Object.entries(CAMPAIGN_CREATOR_STATUS).map(([k, v]) => [k, v.label] as const)} /></Field>
                    <Field label="Post link" className="sm:col-span-2"><input name="postUrl" type="url" defaultValue={r.postUrl ?? ""} className="crm-input" /></Field>
                    <Field label="Posted on"><input name="postedAt" type="date" defaultValue={r.postedAt ? r.postedAt.toISOString().slice(0, 10) : ""} className="crm-input" /></Field>
                    <Field label="Fee (₹)"><input name="fee" defaultValue={r.feePaise ? r.feePaise / 100 : ""} className="crm-input" /></Field>
                    <Field label="Deliverables"><input name="deliverables" defaultValue={r.deliverables ?? ""} className="crm-input" /></Field>
                    {(["views", "reach", "likes", "comments", "shares", "saves"] as const).map((k) => (
                      <Field key={k} label={k[0]!.toUpperCase() + k.slice(1)}><input name={k} inputMode="numeric" defaultValue={r[k] ?? ""} className="crm-input" /></Field>
                    ))}
                  </div>
                  <Field label="Notes (shown on the report)"><textarea name="notes" defaultValue={r.notes ?? ""} className="crm-input !min-h-16" /></Field>
                  <label className="flex items-center gap-2 text-[0.8125rem] text-ash"><input type="checkbox" name="clientVisible" defaultChecked={r.clientVisible} /> Show this creator to the client</label>
                </ActionForm>
              </details>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="text-ash">Shortlist creators on the project first.</p>}
      </Card>

      <Card title="Summary & sharing">
        <ActionForm action={saveReport} submit="Save report">
          <input type="hidden" name="projectId" value={project.id} />
          <Field label="Summary" hint="What worked, the standout posts, learnings and next steps."><textarea name="summary" defaultValue={project.reportSummary ?? ""} className="crm-input !min-h-36" /></Field>
          <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="shared" defaultChecked={project.reportShared} /> Share with the client in their portal</label>
          <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="notify" /> Email them that it&apos;s ready</label>
        </ActionForm>
      </Card>
    </>
  );
}
