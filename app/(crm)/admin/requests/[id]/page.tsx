import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Select, Status, Thread } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, DIVISIONS, REQUEST_KIND, REQUEST_STATUS, dateTime, requestRef } from "@/lib/crm/catalog";
import { staffOptions } from "@/lib/crm/options";
import { can, requireStaff } from "@/lib/crm/session";

import { postStaffMessage, requestToProject, updateRequest } from "../../actions/delivery";

export const dynamic = "force-dynamic";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireStaff();
  const { id } = await params;
  const prisma = getPrisma();
  const request = await prisma.request.findUnique({
    where: { id },
    include: { account: true, createdBy: true, project: true, messages: { orderBy: { createdAt: "asc" }, include: { author: true } } },
  });
  if (!request) notFound();
  const [staff, projects] = await Promise.all([
    staffOptions(),
    prisma.project.findMany({ where: { accountId: request.accountId }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHead
        kicker={`${REQUEST_KIND[request.kind]} · ${requestRef(request.number)}`}
        title={request.title}
        sub={<>From <Link href={`/admin/accounts/${request.accountId}`} className="crm-link">{request.account.name}</Link>{request.createdBy ? ` · ${request.createdBy.name ?? request.createdBy.email}` : ""} · {dateTime(request.createdAt)}</>}
      >
        <Status value={REQUEST_STATUS[request.status]} />
        <Link href={`/admin/quotes/new?request=${request.id}`} className="crm-btn crm-btn-primary crm-btn-sm">Send a quotation</Link>
        <Link href={`/admin/quotes/new?request=${request.id}&kind=INFLUENCER_PLAN`} className="crm-btn crm-btn-secondary crm-btn-sm">Send influencer plan</Link>
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="What they asked">
            <p className="whitespace-pre-wrap text-pretty text-bone">{request.body}</p>
            {request.links.length > 0 && (
              <ul className="mt-3 space-y-1">
                {request.links.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="crm-link break-all">{l}</a></li>)}
              </ul>
            )}
          </Card>
          <Card title="Conversation">
            <Thread messages={request.messages} viewerId={viewer.id} />
            <ActionForm action={postStaffMessage} submit="Send" className="mt-4" reset>
              <input type="hidden" name="requestId" value={request.id} />
              <textarea name="body" required className="crm-input" placeholder="Reply to the client (emails them), or an internal note" />
              <Field label="Links (one per line)"><textarea name="links" className="crm-input !min-h-12" /></Field>
              <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="internal" /> Internal note</label>
            </ActionForm>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Handle it">
            <ActionForm action={updateRequest} submit="Save">
              <input type="hidden" name="id" value={request.id} />
              <Field label="Status"><Select name="status" required defaultValue={request.status} options={Object.entries(REQUEST_STATUS).map(([k, v]) => [k, v.label] as const)} /></Field>
              <Field label="Assignee"><Select name="assigneeId" defaultValue={request.assigneeId} options={staff} /></Field>
              <Field label="Priority"><Select name="priority" required defaultValue={request.priority} options={[["LOW", "Low"], ["NORMAL", "Normal"], ["HIGH", "High"]]} /></Field>
              <Field label="Project"><Select name="projectId" defaultValue={request.projectId} options={projects.map((p) => [p.id, p.name] as const)} /></Field>
            </ActionForm>
          </Card>
          {!request.projectId && can(viewer, "delivery") && (request.kind === "NEW_BRIEF" || request.kind === "NEW_CONTENT") && (
            <Card title="Start it as a project">
              <form action={requestToProject} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={request.id} />
                <Select name="division" required options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} className="w-auto" />
                <button className="crm-btn crm-btn-primary crm-btn-sm">Open project</button>
              </form>
            </Card>
          )}
          {request.project && (
            <Card title="Project">
              <Link href={`/admin/projects/${request.project.id}`} className="crm-link">{request.project.name}</Link>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
