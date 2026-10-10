import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { ProjectFiles } from "@/components/crm/project-files";
import { filesFor } from "@/lib/crm/files-view";
import { Card, Field, PageHead, StageBar, Status, Table, Thread } from "@/components/crm/ui";
import { findProduct } from "@/lib/cart";
import { getPrisma } from "@/lib/db";
import { CAMPAIGN_CREATOR_STATUS, DELIVERABLE_STATUS, DIVISION_LABEL, PROJECT_STATUS, REQUEST_KIND, REQUEST_STATUS, date, projectRef, requestRef } from "@/lib/crm/catalog";
import { portalAccounts, requirePortal } from "@/lib/crm/session";

import { postClientMessage, reviewDeliverable } from "../../actions";
import { stagesOf } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";

const compact = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n));
const VISIBLE_CREATOR = ["CONFIRMED", "CONTENT_RECEIVED", "APPROVED", "POSTED", "PAID"];

/**
 * ONE PROJECT, AS THE CLIENT SEES IT: where it is, what's included, what's
 * waiting for their review (approve, or one consolidated round of changes),
 * everything delivered, the creators on an Influence campaign and their
 * results, and a thread with the team. Drafts and internal notes never show.
 */
export default async function PortalProject({ params }: { params: Promise<{ id: string }> }) {
  const { viewer } = await requirePortal();
  const { id } = await params;
  const allowed = new Set((await portalAccounts(viewer)).map((a) => a.id));
  const project = await getPrisma().project.findUnique({
    where: { id },
    include: {
      account: true,
      manager: true,
      deliverables: { where: { status: { not: "DRAFT" } }, orderBy: [{ createdAt: "desc" }] },
      messages: { where: { internal: false }, orderBy: { createdAt: "asc" }, include: { author: true } },
      creators: { where: { clientVisible: true, status: { in: VISIBLE_CREATOR as never } }, include: { creator: true } },
      requests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project || !allowed.has(project.accountId)) notFound();
  const files = await filesFor(project.id, "client", { avatar: stagesOf(project).some((s) => /avatar/i.test(s)) });
  const included = project.productId ? findProduct(project.productId)?.includes : undefined;
  const toReview = project.deliverables.filter((d) => d.status === "IN_REVIEW");
  const rest = project.deliverables.filter((d) => d.status !== "IN_REVIEW");
  const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;

  return (
    <>
      <PageHead kicker={`${DIVISION_LABEL[project.division]} · ${projectRef(project.number)}`} title={project.name} sub={[project.account.name, project.manager && `Your producer: ${project.manager.name ?? project.manager.email}`, project.dueDate && `due ${date(project.dueDate)}`].filter(Boolean).join(" · ")}>
        <Status value={PROJECT_STATUS[project.status]} />
        {project.driveUrl && <a href={project.driveUrl} target="_blank" rel="noopener noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Shared folder ↗</a>}
        <Link href={`/portal/requests/new?project=${project.id}&kind=REVISION`} className="crm-btn crm-btn-secondary crm-btn-sm">Ask for a change</Link>
        {project.reportShared && <Link href={`/portal/projects/${project.id}/report`} className="crm-btn crm-btn-primary crm-btn-sm">Campaign report</Link>}
      </PageHead>

      <Card>
        <StageBar stages={stagesOf(project)} stage={project.stage} />
        {project.quota ? <p className="mt-3 text-[0.875rem] text-ash">{approved} of {project.quota} pieces delivered and approved.</p> : null}
      </Card>

      <Card title="Files" action={<span className="text-[0.8125rem] text-ash">Upload your brief, logos and product photos to Brief &amp; assets</span>}>
        <ProjectFiles projectId={project.id} role="client" folders={files.folders} files={files.files} />
      </Card>

      {toReview.length > 0 && (
        <section id="review" className="space-y-3">
          <h2 className="text-[1.125rem] text-bone">Ready for your review</h2>
          {toReview.map((d) => (
            <div key={d.id} className="crm-card crm-pad space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[1.0625rem] text-bone underline-offset-4 hover:underline">{d.title} <span className="text-[0.8125rem] text-faint">version {d.version} ↗</span></a>
                <Status value={DELIVERABLE_STATUS[d.status]} />
              </div>
              <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                <ActionForm action={reviewDeliverable} submit="Approve">
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="decision" value="approve" />
                </ActionForm>
                <details className="rounded-xl border border-[var(--glass-border)] px-3 py-2">
                  <summary className="cursor-pointer text-[0.9375rem] text-bone">Request changes</summary>
                  <ActionForm action={reviewDeliverable} submit="Send changes" tone="secondary" className="mt-3">
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="decision" value="changes" />
                    <Field label="Everything you'd like changed, in one note" hint="Timestamps help: 0:12 make the logo bigger."><textarea name="feedback" required className="crm-input" /></Field>
                  </ActionForm>
                </details>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Delivered & in progress">
            {rest.length === 0 ? (
              <p className="text-ash">Nothing shared yet. You&apos;ll get an email the moment there&apos;s something to see.</p>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {rest.map((d) => (
                  <li key={d.id} className="py-2.5">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-bone hover:underline">{d.title} <span className="text-[0.8125rem] text-faint">v{d.version} ↗</span></a>
                      <Status value={DELIVERABLE_STATUS[d.status]} />
                    </span>
                    {d.feedback && d.status === "CHANGES_REQUESTED" && <p className="mt-1 text-[0.875rem] text-ash">Your note: {d.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {project.division === "INFLUENCE" && project.creators.length > 0 && (
            <Card title="Creators on your campaign">
              <Table head={["Creator", "Followers", "Deliverables", "Status", "Views", "Post"]}>
                {project.creators.map((c) => (
                  <tr key={c.id}>
                    <td className="text-bone">{c.creator.name}<span className="block text-[0.8125rem] text-ash">@{c.creator.handle} · {c.creator.platform.toLowerCase()}</span></td>
                    <td className="tabular-nums">{compact(c.creator.followers)}</td>
                    <td>{c.deliverables ?? "—"}</td>
                    <td><Status value={CAMPAIGN_CREATOR_STATUS[c.status]} /></td>
                    <td className="tabular-nums">{compact(c.views)}</td>
                    <td>{c.postUrl ? <a href={c.postUrl} target="_blank" rel="noopener noreferrer" className="crm-link">View</a> : "—"}</td>
                  </tr>
                ))}
              </Table>
              <p className="mt-3 text-[0.875rem] text-ash">
                Total views so far: {compact(project.creators.reduce((s, c) => s + (c.views ?? 0), 0))}
              </p>
            </Card>
          )}

          <Card title="Messages with the team">
            <Thread messages={project.messages} viewerId={viewer.id} />
            <ActionForm action={postClientMessage} submit="Send" className="mt-4" reset>
              <input type="hidden" name="projectId" value={project.id} />
              <textarea name="body" required className="crm-input" placeholder="Ask a question, share a reference, add context…" />
              <Field label="Links (one per line)"><textarea name="links" className="crm-input !min-h-12" placeholder="https://drive.google.com/…" /></Field>
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-6">
          {project.brief && (
            <Card title="Brief">
              <p className="whitespace-pre-wrap text-ash">{project.brief}</p>
            </Card>
          )}
          {included && (
            <Card title="What's included">
              <ul className="space-y-2">
                {included.map((line) => (
                  <li key={line} className="flex gap-2 text-[0.9375rem] text-bone"><span aria-hidden className="text-brand-ink">✓</span>{line}</li>
                ))}
              </ul>
            </Card>
          )}
          {project.requests.length > 0 && (
            <Card title="Requests on this project">
              <ul className="divide-y divide-[var(--glass-border)]">
                {project.requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/portal/requests/${r.id}`} className="truncate text-bone hover:underline">{requestRef(r.number)} · {REQUEST_KIND[r.kind]}</Link>
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
