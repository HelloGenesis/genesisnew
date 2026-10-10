import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Status, Thread } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { REQUEST_KIND, REQUEST_STATUS, dateTime, requestRef } from "@/lib/crm/catalog";
import { portalAccounts, requirePortal } from "@/lib/crm/session";

import { postClientMessage } from "../../actions";

export const dynamic = "force-dynamic";

export default async function PortalRequest({ params }: { params: Promise<{ id: string }> }) {
  const { viewer } = await requirePortal();
  const { id } = await params;
  const allowed = new Set((await portalAccounts(viewer)).map((a) => a.id));
  const request = await getPrisma().request.findUnique({
    where: { id },
    include: { project: true, assignee: true, messages: { where: { internal: false }, orderBy: { createdAt: "asc" }, include: { author: true } } },
  });
  if (!request || !allowed.has(request.accountId)) notFound();
  return (
    <>
      <PageHead kicker={`${REQUEST_KIND[request.kind]} · ${requestRef(request.number)}`} title={request.title} sub={`Sent ${dateTime(request.createdAt)}${request.assignee ? ` · with ${request.assignee.name ?? "the team"}` : ""}`}>
        <Status value={REQUEST_STATUS[request.status]} />
        {request.project && <Link href={`/portal/projects/${request.project.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">{request.project.name}</Link>}
      </PageHead>
      <Card title="Your request">
        <p className="whitespace-pre-wrap text-bone">{request.body}</p>
        {request.links.length > 0 && <ul className="mt-3 space-y-1">{request.links.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="crm-link break-all">{l}</a></li>)}</ul>}
      </Card>
      <Card title="Conversation">
        <Thread messages={request.messages} viewerId={viewer.id} />
        {request.status !== "DONE" && request.status !== "DECLINED" && (
          <ActionForm action={postClientMessage} submit="Send" className="mt-4" reset>
            <input type="hidden" name="requestId" value={request.id} />
            <textarea name="body" required className="crm-input" />
            <Field label="Links (one per line)"><textarea name="links" className="crm-input !min-h-12" /></Field>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
