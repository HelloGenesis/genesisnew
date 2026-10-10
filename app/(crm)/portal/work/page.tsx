import { redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Badge, Card, Empty, Field, PageHead } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, date, money } from "@/lib/crm/catalog";
import { requirePortal } from "@/lib/crm/session";

import { respondAssignment, submitVendorWork } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My work" };

/** A vendor's offers, live jobs and deliveries. Genesis reviews every delivery before a client sees it. */
export default async function PortalWork() {
  const { account } = await requirePortal();
  if (account.kind !== "VENDOR") redirect("/portal");
  const assignments = await getPrisma().vendorAssignment.findMany({
    where: { vendorId: account.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { project: true, deliverables: { orderBy: { createdAt: "desc" } } },
  });
  return (
    <>
      <PageHead kicker={account.name} title="My work" />
      {assignments.length === 0 ? <Empty>No work yet. We&apos;ll email you when Genesis offers you a job.</Empty> : assignments.map((a) => (
        <Card key={a.id} title={`${a.role} · ${a.project.name}`} action={<Badge tone={a.status === "OFFERED" ? "warn" : a.status === "DECLINED" || a.status === "CANCELLED" ? "bad" : a.status === "APPROVED" || a.status === "PAID" ? "good" : "info"}>{a.status.toLowerCase()}</Badge>}>
          <p className="text-[0.875rem] text-ash">{DIVISION_LABEL[a.project.division]} · fee {money(a.feePaise)}{a.dueDate ? ` · due ${date(a.dueDate)}` : ""}</p>
          {a.brief && <p className="mt-2 whitespace-pre-wrap text-bone">{a.brief}</p>}
          {a.status === "OFFERED" && (
            <div className="mt-4 flex gap-2">
              <form action={respondAssignment}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="answer" value="ACCEPTED" /><button className="crm-btn crm-btn-primary crm-btn-sm">Accept</button></form>
              <form action={respondAssignment}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="answer" value="DECLINED" /><button className="crm-btn crm-btn-secondary crm-btn-sm">Decline</button></form>
            </div>
          )}
          {a.deliverables.length > 0 && (
            <ul className="mt-4 space-y-1 text-[0.875rem]">
              {a.deliverables.map((d) => <li key={d.id}><a href={d.url} target="_blank" rel="noopener noreferrer" className="crm-link">{d.title} v{d.version}</a> <span className="text-faint">· {d.status === "DRAFT" ? "with Genesis for review" : d.status.toLowerCase().replace("_", " ")}</span></li>)}
            </ul>
          )}
          {(a.status === "ACCEPTED" || a.status === "SUBMITTED") && (
            <details className="mt-4 border-t border-[var(--glass-border)] pt-3">
              <summary className="cursor-pointer text-[0.9375rem] text-bone">Deliver files</summary>
              <ActionForm action={submitVendorWork} submit="Deliver" className="mt-3" reset>
                <input type="hidden" name="assignmentId" value={a.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="What it is" hint="Same title again = a new version."><input name="title" required className="crm-input" placeholder="Reel 2 · final edit" /></Field>
                  <Field label="Link to the files"><input name="url" type="url" required className="crm-input" /></Field>
                </div>
              </ActionForm>
            </details>
          )}
        </Card>
      ))}
    </>
  );
}
