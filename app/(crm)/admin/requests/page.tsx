import Link from "next/link";

import { Badge, Empty, PageHead, Select, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/crm/scope";
import type { RequestKind, RequestStatus } from "@/lib/generated/prisma/enums";
import { REQUEST_KIND, REQUEST_STATUS, dateTime, requestRef } from "@/lib/crm/catalog";
import { staffOptions } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Requests" };

/** Briefs, revisions, new-content asks and support from the portal — the team's shared inbox. */
export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; assignee?: string }> }) {
  const viewer = await requireStaff();
  const params = await searchParams;
  const open = !params.status;
  const [requests, staff] = await Promise.all([
    getPrisma().request.findMany({
      where: {
        ...(open ? { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT"] } } : params.status !== "all" && params.status! in REQUEST_STATUS ? { status: params.status as RequestStatus } : {}),
        ...(params.kind && params.kind in REQUEST_KIND ? { kind: params.kind as RequestKind } : {}),
        ...(params.assignee ? { assigneeId: params.assignee } : {}),
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      take: 300,
      include: { account: true, assignee: true, project: true, _count: { select: { messages: true } } },
    }),
    staffOptions(),
  ]);
  return (
    <>
      <PageHead kicker="Delivery" title="Requests & support" sub={open ? "Open, in progress and waiting on the client." : undefined} exportKind={isSuperAdmin(viewer) ? "requests" : undefined} />
      <form action="/admin/requests" className="flex flex-wrap items-end gap-2">
        <Select name="status" placeholder="Still open" defaultValue={params.status} options={[...Object.entries(REQUEST_STATUS).map(([k, v]) => [k, v.label] as const), ["all", "Any"] as const]} className="max-w-[12rem]" />
        <Select name="kind" placeholder="Any type" defaultValue={params.kind} options={REQUEST_KIND} className="max-w-[12rem]" />
        <Select name="assignee" placeholder="Anyone" defaultValue={params.assignee} options={staff} className="max-w-[12rem]" />
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Filter</button>
      </form>
      {requests.length === 0 ? (
        <Empty>Nothing waiting. Clients send briefs and requests from their portal.</Empty>
      ) : (
        <Table head={["Request", "Client", "Type", "Status", "Assignee", "Opened"]}>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/admin/requests/${r.id}`} className="text-bone hover:underline">{requestRef(r.number)} · {r.title}</Link>
                <span className="mt-0.5 flex flex-wrap gap-1">
                  {r.priority === "HIGH" && <Badge tone="bad">High</Badge>}
                  {r.project && <Badge>{r.project.name}</Badge>}
                  {r._count.messages > 0 && <Badge>{r._count.messages} messages</Badge>}
                </span>
              </td>
              <td><Link href={`/admin/accounts/${r.accountId}`} className="hover:underline">{r.account.name}</Link></td>
              <td>{REQUEST_KIND[r.kind]}</td>
              <td><Status value={REQUEST_STATUS[r.status]} /></td>
              <td>{r.assignee?.name ?? r.assignee?.email ?? "—"}</td>
              <td>{dateTime(r.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
