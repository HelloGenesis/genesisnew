import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Select, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, DIVISIONS, LEAD_SOURCE, LEAD_STATUS, ORDER_STATUS, date, dateTime, money } from "@/lib/crm/catalog";
import { accountOptions, dateValue, inDays, staffOptions } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

import { createTask, toggleTask } from "../../actions/delivery";
import { convertLead, deleteLead, logActivity, updateLead } from "../../actions/sales";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("sales");
  const { id } = await params;
  const prisma = getPrisma();
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" }, include: { actor: true } }, tasks: { orderBy: { createdAt: "desc" } }, account: true, partner: true },
  });
  if (!lead) notFound();
  const [staff, partners, orders] = await Promise.all([
    staffOptions(),
    accountOptions(["AGENCY"], true),
    lead.email ? prisma.order.findMany({ where: { contactEmail: lead.email }, orderBy: { createdAt: "desc" } }) : [],
  ]);

  return (
    <>
      <PageHead kicker="Lead" title={lead.name} sub={[lead.company, lead.designation, LEAD_SOURCE[lead.source], `added ${date(lead.createdAt)}`].filter(Boolean).join(" · ")}>
        <Status value={LEAD_STATUS[lead.status]} />
        {lead.account ? (
          <Link href={`/admin/accounts/${lead.account.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">
            Client: {lead.account.name}
          </Link>
        ) : (
          <form action={convertLead}>
            <input type="hidden" name="id" value={lead.id} />
            <button className="crm-btn crm-btn-primary crm-btn-sm">Won · make client</button>
          </form>
        )}
      </PageHead>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card title="Details">
          <ActionForm action={updateLead} submit="Save">
            <input type="hidden" name="id" value={lead.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><input name="name" defaultValue={lead.name} className="crm-input" /></Field>
              <Field label="Company"><input name="company" defaultValue={lead.company ?? ""} className="crm-input" /></Field>
              <Field label="Email"><input name="email" type="email" defaultValue={lead.email ?? ""} className="crm-input" /></Field>
              <Field label="Phone"><input name="phone" defaultValue={lead.phone ?? ""} className="crm-input" /></Field>
              <Field label="Designation"><input name="designation" defaultValue={lead.designation ?? ""} className="crm-input" /></Field>
              <Field label="Division"><Select name="division" defaultValue={lead.division} options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} /></Field>
              <Field label="Interested in"><input name="interest" defaultValue={lead.interest ?? ""} className="crm-input" /></Field>
              <Field label="Source"><Select name="source" defaultValue={lead.source} options={LEAD_SOURCE} required /></Field>
              <Field label="Stage"><Select name="status" defaultValue={lead.status} options={Object.entries(LEAD_STATUS).map(([k, v]) => [k, v.label] as const)} required /></Field>
              <Field label="Value (₹)"><input name="value" defaultValue={lead.valuePaise ? lead.valuePaise / 100 : ""} inputMode="decimal" className="crm-input" /></Field>
              <Field label="Owner"><Select name="ownerId" defaultValue={lead.ownerId} options={staff} /></Field>
              <Field label="Next follow-up"><input name="nextFollowUp" type="date" defaultValue={dateValue(lead.nextFollowUp)} className="crm-input" /></Field>
              <Field label="Partner agency"><Select name="partnerId" defaultValue={lead.partnerId} options={partners} /></Field>
              <Field label="Lost reason (if lost)"><input name="lostReason" defaultValue={lead.lostReason ?? ""} className="crm-input" /></Field>
            </div>
            <Field label="Notes"><textarea name="notes" defaultValue={lead.notes ?? ""} className="crm-input" /></Field>
          </ActionForm>
          <form action={deleteLead} className="mt-4 border-t border-[var(--glass-border)] pt-4">
            <input type="hidden" name="id" value={lead.id} />
            <button className="text-[0.8125rem] text-[#dc2626] hover:underline">Delete lead</button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card title="Log a touch">
            <ActionForm action={logActivity} submit="Log" reset>
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Type"><Select name="kind" required options={[["CALL", "Call"], ["WHATSAPP", "WhatsApp"], ["EMAIL", "Email"], ["MEETING", "Meeting"], ["NOTE", "Note"]]} /></Field>
                <Field label="Next follow-up"><input name="nextFollowUp" type="date" defaultValue={inDays(3)} className="crm-input" /></Field>
              </div>
              <Field label="What happened"><textarea name="body" required className="crm-input" /></Field>
            </ActionForm>
          </Card>

          <Card title="Timeline">
            {lead.activities.length === 0 ? (
              <p className="text-ash">Nothing logged yet.</p>
            ) : (
              <ol className="space-y-3">
                {lead.activities.map((a) => (
                  <li key={a.id} className="border-l-2 border-[#ffc516]/60 pl-3">
                    <p className="text-[0.75rem] text-faint">
                      {a.kind.toLowerCase()} · {a.actor?.name ?? a.actor?.email ?? "Genesis"} · {dateTime(a.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap text-bone">{a.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Tasks">
            <ul className="mb-4 space-y-2">
              {lead.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button aria-label={t.status === "OPEN" ? "Mark done" : "Reopen"} className={`grid size-5 place-items-center rounded border border-[var(--glass-border)] ${t.status === "DONE" ? "bg-[#16a34a] text-white" : ""}`}>
                      {t.status === "DONE" ? "✓" : ""}
                    </button>
                  </form>
                  <span className={t.status === "DONE" ? "text-faint line-through" : "text-bone"}>{t.title}</span>
                  <span className="ml-auto text-[0.75rem] text-faint">{date(t.dueDate)}</span>
                </li>
              ))}
            </ul>
            <ActionForm action={createTask} submit="Add task" inline reset>
              <input type="hidden" name="leadId" value={lead.id} />
              <input name="title" placeholder="Send proposal deck" required className="crm-input min-w-[12rem] flex-1" />
              <input name="dueDate" type="date" defaultValue={inDays(2)} className="crm-input w-auto" />
            </ActionForm>
          </Card>

          {orders.length > 0 && (
            <Card title="Checkouts by this email">
              <ul className="divide-y divide-[var(--glass-border)]">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/billing/${o.id}`} className="text-bone hover:underline">
                      {o.reference} · {money(o.totalPaise)}
                    </Link>
                    <Status value={ORDER_STATUS[o.status]} />
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
