import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Empty, Field, PageHead, Select, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { Division, LeadStatus, Prisma } from "@/lib/generated/prisma/client";
import { LeadBoard } from "@/components/crm/lead-board";
import { DIVISION_LABEL, DIVISIONS, LEAD_SOURCE, LEAD_STATUS, PIPELINE, SERVICES, date, money, todayIst } from "@/lib/crm/catalog";
import { leadScope, isSuperAdmin } from "@/lib/crm/scope";
import { accountOptions, inDays, staffOptions } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

import { createLead, moveLead, planLeadEvent } from "../actions/sales";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

/**
 * THE PIPELINE. Every enquiry from the website, every checkout that hasn't
 * paid, every lead a partner agency sends and every deal staff log by hand —
 * on one board, New → Won, with the follow-up date that drives the morning
 * digest. Lost and Nurture leave the board and stay in the list.
 */
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string; division?: string; owner?: string; due?: string; q?: string; status?: string; add?: string }> }) {
  const viewer = await requireStaff("sales");
  const params = await searchParams;
  const prisma = getPrisma();
  const division = DIVISIONS.includes(params.division as Division) ? (params.division as Division) : undefined;
  const where: Prisma.LeadWhereInput = {
    ...leadScope(viewer),
    ...(division ? { division } : {}),
    ...(params.owner ? { ownerId: params.owner } : {}),
    ...(params.due ? { nextFollowUp: { lte: new Date(todayIst()) }, status: { notIn: ["WON", "LOST"] } } : {}),
    ...(params.status && params.status in LEAD_STATUS ? { status: params.status as LeadStatus } : {}),
    ...(params.q
      ? { OR: [{ name: { contains: params.q, mode: "insensitive" } }, { company: { contains: params.q, mode: "insensitive" } }, { email: { contains: params.q, mode: "insensitive" } }] }
      : {}),
  };
  const [leads, staff, partners] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: [{ nextFollowUp: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }], take: 500, include: { owner: true, partner: true } }),
    staffOptions(),
    accountOptions(["AGENCY"], true),
  ]);
  const board = params.view !== "list";
  const today = todayIst();
  const overdue = (d: Date | null) => d !== null && d.toISOString().slice(0, 10) < today;

  const filter = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    if (value) next.set(key, value);
    else next.delete(key);
    return `/admin/leads?${next.toString()}`;
  };

  return (
    <>
      <PageHead kicker="Sales" title="Leads & pipeline" sub={`${leads.length} lead${leads.length === 1 ? "" : "s"} · ${money(leads.filter((l) => !["WON", "LOST"].includes(l.status)).reduce((s, l) => s + l.valuePaise, 0))} open`} exportKind={isSuperAdmin(viewer) ? "leads" : undefined}>
        <Link href={filter("view", board ? "list" : undefined)} className="crm-btn crm-btn-secondary crm-btn-sm">
          {board ? "List view" : "Board view"}
        </Link>
      </PageHead>

      <form className="flex flex-wrap items-end gap-2" action="/admin/leads">
        {params.view && <input type="hidden" name="view" value={params.view} />}
        <input name="q" defaultValue={params.q} placeholder="Search name, company, email" className="crm-input max-w-xs" />
        <Select name="division" placeholder="All divisions" defaultValue={params.division} options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} className="max-w-[12rem]" />
        {Object.keys(leadScope(viewer)).length === 0 && <Select name="owner" placeholder="Any owner" defaultValue={params.owner} options={staff} className="max-w-[12rem]" />}
        <label className="flex items-center gap-2 text-[0.875rem] text-ash">
          <input type="checkbox" name="due" value="1" defaultChecked={Boolean(params.due)} /> Due now
        </label>
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Filter</button>
      </form>

      <AddPanel label="Add a lead" open={params.add === "1"}>
        <ActionForm action={createLead} submit="Add lead" reset>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name *"><input name="name" required className="crm-input" /></Field>
            <Field label="Company"><input name="company" className="crm-input" /></Field>
            <Field label="Email"><input name="email" type="email" className="crm-input" /></Field>
            <Field label="Phone"><input name="phone" className="crm-input" /></Field>
            <Field label="Division"><Select name="division" options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} /></Field>
            <Field label="Interested in" hint="Pick one, or type your own.">
              <input name="interest" list="crm-services" className="crm-input" placeholder="Choose a service" />
              <datalist id="crm-services">{SERVICES.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Source"><Select name="source" options={LEAD_SOURCE} defaultValue="CALL" required /></Field>
            <Field label="Value (₹)"><input name="value" inputMode="decimal" className="crm-input" /></Field>
            <Field label="Owner"><Select name="ownerId" options={staff} /></Field>
            <Field label="Follow up on"><input name="nextFollowUp" type="date" defaultValue={inDays(1)} className="crm-input" /></Field>
            <Field label="Referred by partner"><Select name="partnerId" options={partners} /></Field>
          </div>
          <Field label="Notes"><textarea name="notes" className="crm-input" /></Field>
        </ActionForm>
      </AddPanel>

      {leads.length === 0 ? (
        <Empty>No leads match. Website enquiries and unpaid checkouts land here automatically.</Empty>
      ) : board ? (
        <div>
          <LeadBoard
            move={moveLead}
            plan={planLeadEvent}
            columns={PIPELINE.map((status) => ({ status, label: LEAD_STATUS[status].label }))}
            leads={leads
              .filter((l) => PIPELINE.includes(l.status))
              .map((l) => ({
                id: l.id,
                name: l.name,
                company: l.company,
                status: l.status,
                division: l.division ? DIVISION_LABEL[l.division] : null,
                value: l.valuePaise > 0 ? money(l.valuePaise) : null,
                partner: l.partner?.name ?? null,
                followUp: l.nextFollowUp ? date(l.nextFollowUp) : null,
                overdue: overdue(l.nextFollowUp),
              }))}
          />
          {leads.some((l) => l.status === "LOST" || l.status === "NURTURE") && (
            <p className="mt-3 text-[0.8125rem] text-faint">
              Off the board: {leads.filter((l) => l.status === "NURTURE").length} nurture, {leads.filter((l) => l.status === "LOST").length} lost.{" "}
              <Link className="crm-link" href={filter("view", "list")}>
                See them in the list
              </Link>
            </p>
          )}
        </div>
      ) : (
        <Table head={["Lead", "Division", "Source", "Status", "Value", "Owner", "Follow up", "Added"]}>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <Link href={`/admin/leads/${lead.id}`} className="text-bone hover:underline">
                  {lead.name}
                </Link>
                <span className="block text-[0.8125rem] text-ash">{[lead.company, lead.email].filter(Boolean).join(" · ")}</span>
              </td>
              <td>{lead.division ? DIVISION_LABEL[lead.division] : "—"}</td>
              <td>{LEAD_SOURCE[lead.source]}{lead.partner ? ` · ${lead.partner.name}` : ""}</td>
              <td><Status value={LEAD_STATUS[lead.status]} /></td>
              <td className="tabular-nums">{money(lead.valuePaise)}</td>
              <td>{lead.owner?.name ?? lead.owner?.email ?? "—"}</td>
              <td className={overdue(lead.nextFollowUp) && !["WON", "LOST"].includes(lead.status) ? "font-semibold text-[#dc2626]" : ""}>{date(lead.nextFollowUp)}</td>
              <td>{date(lead.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
