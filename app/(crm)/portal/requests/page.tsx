import { redirect } from "next/navigation";
import Link from "next/link";

import { Empty, PageHead, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { REQUEST_KIND, REQUEST_STATUS, dateTime, requestRef } from "@/lib/crm/catalog";
import { requirePortal } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Briefs & requests" };

export default async function PortalRequests() {
  const { account } = await requirePortal();
  /* A vendor's work lives under My work, not client projects. */
  if (account.kind === "VENDOR") redirect("/portal/work");
  const requests = await getPrisma().request.findMany({ where: { accountId: account.id }, orderBy: { updatedAt: "desc" }, include: { project: true } });
  return (
    <>
      <PageHead kicker={account.name} title="Briefs & requests" sub="New briefs, revisions, content requests and questions. We reply within one working day.">
        <Link href="/portal/requests/new" className="crm-btn crm-btn-primary crm-btn-sm">New request</Link>
      </PageHead>
      {requests.length === 0 ? (
        <Empty>No requests yet. Send your first brief.</Empty>
      ) : (
        <Table head={["Request", "Type", "Project", "Status", "Updated"]}>
          {requests.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/portal/requests/${r.id}`} className="text-bone hover:underline">{requestRef(r.number)} · {r.title}</Link></td>
              <td>{REQUEST_KIND[r.kind]}</td>
              <td>{r.project?.name ?? "—"}</td>
              <td><Status value={REQUEST_STATUS[r.status]} /></td>
              <td>{dateTime(r.updatedAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
