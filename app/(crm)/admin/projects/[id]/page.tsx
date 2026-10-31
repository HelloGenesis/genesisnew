import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { canDeleteFiles } from "@/app/(crm)/files-actions";
import { ProjectFiles } from "@/components/crm/project-files";
import { Badge, Card, Field, PageHead, Select, StageBar, Status, Thread } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import {
  CAMPAIGN_CREATOR_STATUS,
  DELIVERABLE_STATUS,
  DIVISION_LABEL,
  PROJECT_STATUS,
  REQUEST_KIND,
  REQUEST_STATUS,
 
  date,
  dateTime,
  money,
  projectRef,
  requestRef,
} from "@/lib/crm/catalog";
import { accountOptions, dateValue, inDays, staffOptions } from "@/lib/crm/options";
import { fileAdmin } from "@/lib/crm/files";
import { filesFor } from "@/lib/crm/files-view";
import { creatorScope, projectScope, seesCreators } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import {
  addCampaignCreators,
  addDeliverable,
  advanceStage,
  assignVendor,
  createTask,
  postStaffMessage,
  setAssignmentStatus,
  setDeliverableStatus,
  toggleTask,
  updateCampaignCreator,
  updateProject,
} from "../../actions/delivery";
import { stagesOf } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";

const compact = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n));

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireStaff();
  const { id } = await params;
  const prisma = getPrisma();
  const project = await prisma.project.findFirst({
    where: { id, ...projectScope(viewer) },
    include: {
      account: true,
      manager: true,
      order: true,
      deliverables: { orderBy: [{ title: "asc" }, { version: "desc" }] },
      messages: { orderBy: { createdAt: "asc" }, include: { author: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 30, include: { actor: true } },
      tasks: { orderBy: { createdAt: "desc" } },
      assignments: { orderBy: { createdAt: "desc" }, include: { vendor: true } },
      creators: { orderBy: { createdAt: "asc" }, include: { creator: true } },
      requests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();
  const influence = project.division === "INFLUENCE";
  const [staff, vendors, pool] = await Promise.all([
    staffOptions(),
    accountOptions(["VENDOR"]),
    influence && seesCreators(viewer)
      ? prisma.creator.findMany({ where: { blacklisted: false, campaigns: { none: { projectId: id } }, ...creatorScope(viewer) }, orderBy: { followers: "desc" }, take: 200, select: { id: true, name: true, handle: true, platform: true, followers: true, niches: true, city: true } })
      : [],
  ]);
  const stages = stagesOf(project);
  const files = await filesFor(project.id, "staff", { avatar: stages.some((s) => /avatar/i.test(s)), admin: fileAdmin(viewer) });
  const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;
  const fees = project.creators.reduce((s, c) => s + (c.status !== "DROPPED" ? (c.feePaise ?? 0) : 0), 0);
  const views = project.creators.reduce((s, c) => s + (c.views ?? 0), 0);

  return (
    <>
      <PageHead
        kicker={`${DIVISION_LABEL[project.division]} · ${projectRef(project.number)}`}
        title={project.name}
        sub={
          <>
            <Link href={`/admin/accounts/${project.accountId}`} className="crm-link">{project.account.name}</Link>
            {project.order && <> · order <Link href={`/admin/billing/${project.order.id}`} className="crm-link">{project.order.reference}</Link></>}
            {project.quota ? ` · ${approved} of ${project.quota} delivered` : ""}
            {project.dueDate ? ` · due ${date(project.dueDate)}` : ""}
          </>
        }
      >
        <Status value={PROJECT_STATUS[project.status]} />
        {influence && <Link href={`/admin/reports/campaign/${project.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">Campaign report</Link>}
        {project.driveUrl && <a href={project.driveUrl} target="_blank" rel="noopener noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Drive folder ↗</a>}
        {project.status === "ACTIVE" && project.stage < stages.length - 1 && (
          <form action={advanceStage}>
            <input type="hidden" name="id" value={project.id} />
            <button className="crm-btn crm-btn-primary crm-btn-sm">Move to {stages[project.stage + 1]} →</button>
          </form>
        )}
      </PageHead>

      <Card>
        <StageBar stages={stages} stage={project.stage} />
      </Card>

      <Card title="Files" action={<span className="text-[0.8125rem] text-ash">{project.workspaceId ? "Stored in Google Drive · new files are for admins until shared" : <>Stored in Genesis&apos;s Google Drive · clients and vendors see only their folders</>}</span>}>
        <ProjectFiles projectId={project.id} role="staff" folders={files.folders} files={files.files} drive={files.drive} agency={Boolean(project.workspaceId)} admin={fileAdmin(viewer)} brief={project.brief ?? null} canDelete={await canDeleteFiles(project.id)} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Deliverables" action={<span className="text-[0.8125rem] text-ash">Clients see everything except drafts and internal reviews</span>}>
            {project.deliverables.length === 0 ? (
              <p className="text-ash">Nothing shared yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {project.deliverables.map((d) => (
                  <li key={d.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-bone hover:underline">
                        {d.title} <span className="text-[0.8125rem] text-faint">v{d.version} · {d.kind.toLowerCase()}</span>
                      </a>
                      <Status value={DELIVERABLE_STATUS[d.status]} />
                    </div>
                    {d.feedback && <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-[#ef4444]/10 px-3 py-2 text-[0.875rem] text-bone">Client: {d.feedback}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-[0.75rem]">
                      {/* The approval steps (Genesis, 31 Oct 2026): internal review with the producer, then the client. */}
                      {(d.status === "INTERNAL_REVIEW" ? (["IN_REVIEW", "CHANGES_REQUESTED", "DRAFT"] as const) : (["INTERNAL_REVIEW", "IN_REVIEW", "APPROVED", "DRAFT"] as const))
                        .filter((s) => s !== d.status)
                        .map((s) => (
                          <form key={s} action={setDeliverableStatus}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="status" value={s} />
                            <button className={s === "IN_REVIEW" && d.status === "INTERNAL_REVIEW" ? "font-medium text-[#ffc516] hover:underline" : "text-ash hover:text-bone"}>
                              {s === "IN_REVIEW" ? (d.status === "INTERNAL_REVIEW" ? "Approve & send to client" : "Send to client") : s === "INTERNAL_REVIEW" ? "Internal review" : s === "CHANGES_REQUESTED" ? "Ask the editor for changes" : s === "APPROVED" ? "Mark approved" : "Back to draft"}
                            </button>
                          </form>
                        ))}
                      <span className="text-faint">{dateTime(d.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-4 border-t border-[var(--glass-border)] pt-4" open={project.deliverables.length === 0}>
              <summary className="cursor-pointer text-[0.9375rem] text-bone">＋ Add a deliverable or a new version</summary>
              <ActionForm action={addDeliverable} submit="Add" className="mt-3" reset>
                <input type="hidden" name="projectId" value={project.id} />
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_9rem]">
                  <Field label="Title" hint="Same title = a new version of it."><input name="title" required className="crm-input" placeholder="Reel 1 · Product explainer" /></Field>
                  <Field label="Link"><input name="url" type="url" required className="crm-input" placeholder="https://drive.google.com/…" /></Field>
                  <Field label="Type"><Select name="kind" required options={[["VIDEO", "Video"], ["IMAGE", "Image"], ["DESIGN", "Design"], ["DOCUMENT", "Document"], ["LINK", "Link"]]} /></Field>
                </div>
                <Field label="Approval">
                  <select name="review" defaultValue="client" className="crm-input sm:max-w-sm">
                    <option value="client">Send to the client for review now (emails them)</option>
                    <option value="internal">Internal review first (producer and editors)</option>
                    <option value="">Save as a draft</option>
                  </select>
                </Field>
              </ActionForm>
            </details>
          </Card>

          {influence && (
            <Card title="Creators on this campaign" action={<span className="text-[0.8125rem] text-ash">{project.creators.filter((c) => c.status !== "DROPPED").length} creators · {money(fees)} fees · {compact(views)} views</span>}>
              {project.creators.length > 0 && (
                <ul className="space-y-2">
                  {project.creators.map((c) => (
                    <li key={c.id}>
                      <details className="rounded-xl bg-[var(--hover-wash)] px-3 py-2">
                        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                          <span className="text-bone">
                            {c.creator.name} <span className="text-[0.8125rem] text-ash">@{c.creator.handle} · {compact(c.creator.followers)}</span>
                          </span>
                          <span className="flex items-center gap-2 text-[0.8125rem] text-ash">
                            {c.feePaise ? money(c.feePaise) : ""} {c.views ? `· ${compact(c.views)} views` : ""} <Status value={CAMPAIGN_CREATOR_STATUS[c.status]} />
                          </span>
                        </summary>
                        <ActionForm action={updateCampaignCreator} submit="Save" className="mt-3">
                          <input type="hidden" name="id" value={c.id} />
                          <div className="grid gap-2 sm:grid-cols-3">
                            <Field label="Status"><Select name="status" required defaultValue={c.status} options={Object.entries(CAMPAIGN_CREATOR_STATUS).map(([k, v]) => [k, v.label] as const)} /></Field>
                            <Field label="Fee (₹)"><input name="fee" defaultValue={c.feePaise ? c.feePaise / 100 : ""} className="crm-input" /></Field>
                            <Field label="Deliverables"><input name="deliverables" defaultValue={c.deliverables ?? ""} className="crm-input" placeholder="1 reel + 2 stories" /></Field>
                            <Field label="Post link"><input name="postUrl" type="url" defaultValue={c.postUrl ?? ""} className="crm-input" /></Field>
                            <Field label="Views"><input name="views" defaultValue={c.views ?? ""} className="crm-input" /></Field>
                            <Field label="Likes / comments">
                              <span className="flex gap-2">
                                <input name="likes" defaultValue={c.likes ?? ""} className="crm-input" />
                                <input name="comments" defaultValue={c.comments ?? ""} className="crm-input" />
                              </span>
                            </Field>
                          </div>
                          <label className="flex items-center gap-2 text-[0.8125rem] text-ash">
                            <input type="checkbox" name="clientVisible" defaultChecked={c.clientVisible} /> Show to the client in their portal
                          </label>
                          <input type="hidden" name="notes" value={c.notes ?? ""} />
                        </ActionForm>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
              <details className="mt-4 border-t border-[var(--glass-border)] pt-4" open={project.creators.length === 0}>
                <summary className="cursor-pointer text-[0.9375rem] text-bone">＋ Shortlist from the influencer database</summary>
                {pool.length === 0 ? (
                  <p className="mt-2 text-ash">
                    No more creators to add. <Link href="/admin/creators" className="crm-link">Add creators</Link>
                  </p>
                ) : (
                  <ActionForm action={addCampaignCreators} submit="Shortlist selected" className="mt-3">
                    <input type="hidden" name="projectId" value={project.id} />
                    <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
                      {pool.map((c) => (
                        <li key={c.id}>
                          <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--hover-wash)]">
                            <input type="checkbox" name="creatorId" value={c.id} />
                            <span className="text-bone">{c.name}</span>
                            <span className="truncate text-[0.8125rem] text-ash">
                              @{c.handle} · {c.platform.toLowerCase()} · {compact(c.followers)} {c.niches.length ? `· ${c.niches.join(", ")}` : ""} {c.city ? `· ${c.city}` : ""}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </ActionForm>
                )}
              </details>
            </Card>
          )}

          <Card title="Messages with the client">
            <Thread messages={project.messages} viewerId={viewer.id} />
            <ActionForm action={postStaffMessage} submit="Send" className="mt-4" reset>
              <input type="hidden" name="projectId" value={project.id} />
              <textarea name="body" required className="crm-input" placeholder="Write to the client, or tick 'internal' for a note only the team sees" />
              <Field label="Links (one per line)"><textarea name="links" className="crm-input !min-h-12" /></Field>
              <label className="flex items-center gap-2 text-[0.875rem] text-ash">
                <input type="checkbox" name="internal" /> Internal note (never shown to the client)
              </label>
            </ActionForm>
          </Card>
          <Card title="Tasks">
            <ul className="mb-4 space-y-2">
              {project.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button aria-label={t.status === "OPEN" ? "Mark done" : "Reopen"} className={`grid size-5 place-items-center rounded border border-[var(--glass-border)] ${t.status === "DONE" ? "bg-[#16a34a] text-white" : ""}`}>{t.status === "DONE" ? "✓" : ""}</button>
                  </form>
                  <span className={t.status === "DONE" ? "text-faint line-through" : "text-bone"}>{t.title}</span>
                  <span className="ml-auto text-[0.75rem] text-faint">{date(t.dueDate)}</span>
                </li>
              ))}
            </ul>
            <ActionForm action={createTask} submit="Add" inline reset>
              <input type="hidden" name="projectId" value={project.id} />
              <input name="title" required placeholder="Book the location" className="crm-input min-w-[10rem] flex-1" />
              <input name="dueDate" type="date" defaultValue={inDays(2)} className="crm-input w-auto" />
              <Select name="ownerId" options={staff} className="w-auto" />
            </ActionForm>
          </Card>

          <Card title="Timeline">
            <ol className="space-y-3">
              {project.activities.map((a) => (
                <li key={a.id} className="border-l-2 border-[#ffc516]/60 pl-3">
                  <p className="text-[0.75rem] text-faint">{a.actor?.name ?? a.actor?.email ?? "Genesis"} · {dateTime(a.createdAt)}</p>
                  <p className="text-bone">{a.body}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Project">
            <ActionForm action={updateProject} submit="Save">
              <input type="hidden" name="id" value={project.id} />
              <Field label="Name"><input name="name" defaultValue={project.name} className="crm-input" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Stage"><Select name="stage" required defaultValue={String(project.stage)} options={stages.map((s, i) => [String(i), s] as const)} /></Field>
                <Field label="Status"><Select name="status" required defaultValue={project.status} options={Object.entries(PROJECT_STATUS).map(([k, v]) => [k, v.label] as const)} /></Field>
                <Field label="Producer"><Select name="managerId" defaultValue={project.managerId} options={staff} /></Field>
                <Field label="Due"><input name="dueDate" type="date" defaultValue={dateValue(project.dueDate)} className="crm-input" /></Field>
                <Field label="Pieces included"><input name="quota" type="number" min={0} defaultValue={project.quota ?? ""} className="crm-input" /></Field>
                <Field label="Drive folder"><input name="driveUrl" type="url" defaultValue={project.driveUrl ?? ""} className="crm-input" /></Field>
              </div>
              <Field label="Brief"><textarea name="brief" defaultValue={project.brief ?? ""} className="crm-input" /></Field>
              <Field label="Stages (one per line)" hint="Every service runs differently; change this project's steps here."><textarea name="stages" defaultValue={stages.join("\n")} className="crm-input !min-h-40" /></Field>
            </ActionForm>
          </Card>

          <Card title="Vendors & crew">
            {project.assignments.length > 0 && (
              <ul className="mb-4 space-y-2">
                {project.assignments.map((a) => (
                  <li key={a.id} className="rounded-xl bg-[var(--hover-wash)] px-3 py-2">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/admin/accounts/${a.vendorId}`} className="text-bone hover:underline">{a.vendor.name} · {a.role}</Link>
                      <Badge tone={a.status === "DECLINED" || a.status === "CANCELLED" ? "bad" : a.status === "APPROVED" || a.status === "PAID" ? "good" : "info"}>{a.status.toLowerCase()}</Badge>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-3 text-[0.75rem] text-ash">
                      {money(a.feePaise)} {a.dueDate ? `· due ${date(a.dueDate)}` : ""}
                      {(["APPROVED", "CANCELLED"] as const)
                        .filter((s) => s !== a.status)
                        .map((s) => (
                          <form key={s} action={setAssignmentStatus}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="status" value={s} />
                            <button className="hover:text-bone">{s === "APPROVED" ? "Approve work" : "Cancel"}</button>
                          </form>
                        ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {vendors.length === 0 ? (
              <p className="text-ash">No vendors yet. <Link href="/admin/vendors" className="crm-link">Add one</Link>.</p>
            ) : (
              <ActionForm action={assignVendor} submit="Offer the work" reset>
                <input type="hidden" name="projectId" value={project.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Vendor"><Select name="vendorId" required options={vendors} /></Field>
                  <Field label="Role"><input name="role" required className="crm-input" placeholder="Editor, DOP, AI artist…" /></Field>
                  <Field label="Fee (₹)"><input name="fee" inputMode="decimal" className="crm-input" /></Field>
                  <Field label="Due"><input name="dueDate" type="date" defaultValue={inDays(7)} className="crm-input" /></Field>
                </div>
                <Field label="Brief for them"><textarea name="brief" className="crm-input !min-h-16" /></Field>
              </ActionForm>
            )}
          </Card>

          {project.requests.length > 0 && (
            <Card title="Requests on this project">
              <ul className="divide-y divide-[var(--glass-border)]">
                {project.requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/admin/requests/${r.id}`} className="truncate text-bone hover:underline">{requestRef(r.number)} · {REQUEST_KIND[r.kind]} · {r.title}</Link>
                    <Status value={REQUEST_STATUS[r.status]} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

        </div>
      </div>
    </>
  );
}
