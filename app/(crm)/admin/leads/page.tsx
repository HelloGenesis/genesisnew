import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Badge, Empty, Field, PageHead, Select, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { Division, LeadStatus, Prisma } from "@/lib/generated/prisma/client";
import { DIVISION_LABEL, DIVISIONS, LEAD_SOURCE, LEAD_STATUS, PIPELINE, date, money, todayIst } from "@/lib/crm/catalog";
import { accountOptions, inDays, staffOptions } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

import { createLead, moveLead } from "../actions/sales";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

/**
 * THE PIPELINE. Every enquiry from the website, every checkout that hasn't
 * paid, every lead a partner agency sends and every deal staff log by hand —
 * on one board, New → Won, with the follow-up date that drives the morning
 * digest. Lost and Nurture leave the board and stay in the list.
 */
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string; division?: string; owner?: string; due?: string; q?: string; status?: string }> }) {
  await requireStaff("sales");
  const params = await searchParams;
  const prisma = getPrisma();
  const division = DIVISIONS.includes(params.division as Division) ? (params.division as Division) : undefined;
  const where: Prisma.LeadWhereInput = {
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
      <PageHead kicker="Sales" title="Leads & pipeline" sub={`${leads.length} lead${leads.length === 1 ? "" : "s"} · ${money(leads.filter((l) => !["WON", "LOST"].includes(l.status)).reduce((s, l) => s + l.valuePaise, 0))} open`} exportKind="leads">
        <Link href={filter("view", board ? "list" : undefined)} className="crm-btn crm-btn-secondary crm-btn-sm">
          {board ? "List view" : "Board view"}
        </Link>
      </PageHead>

      <form className="flex flex-wrap items-end gap-2" action="/admin/leads">
        {params.view && <input type="hidden" name="view" value={params.view} />}
        <input name="q" defaultValue={params.q} placeholder="Search name, company, email" className="crm-input max-w-xs" />
        <Select name="division" placeholder="All divisions" defaultValue={params.division} options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} className="max-w-[12rem]" />
        <Select name="owner" placeholder="Any owner" defaultValue={params.owner} options={staff} className="max-w-[12rem]" />
        <label className="flex items-center gap-2 text-[0.875rem] text-ash">
          <input type="checkbox" name="due" value="1" defaultChecked={Boolean(params.due)} /> Due now
        </label>
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Filter</button>
      </form>

      <AddPanel label="Add a lead">
        <ActionForm action={createLead} submit="Add lead" reset>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name *"><input name="name" required className="crm-input" /></Field>
            <Field label="Company"><input name="company" className="crm-input" /></Field>
            <Field label="Email"><input name="email" type="email" className="crm-input" /></Field>
            <Field label="Phone"><input name="phone" className="crm-input" /></Field>
            <Field label="Division"><Select name="division" options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} /></Field>
            <Field label="Interested in"><input name="interest" className="crm-input" placeholder="AI Avatar Clone, Studios Growth…" /></Field>
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
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          <div className="grid min-w-[1400px] grid-cols-7 gap-3">
            {PIPELINE.map((status) => {
              const column = leads.filter((l) => l.status === status);
              return (
                <section key={status} className="min-w-0">
                  <header className="mb-2 flex items-baseline justify-between px-1">
                    <h2 className="text-[0.875rem] font-medium text-bone">{LEAD_STATUS[status].label}</h2>
                    <span className="text-[0.75rem] text-faint">
                      {column.length} · {money(column.reduce((s, l) => s + l.valuePaise, 0))}
                    </span>
                  </header>
                  <ol className="space-y-2">
                    {column.map((lead) => {
                      const next = PIPELINE[PIPELINE.indexOf(status) + 1];
                      return (
                        <li key={lead.id} className="crm-card p-3">
                          <Link href={`/admin/leads/${lead.id}`} className="block">
                            <span className="block truncate text-[0.9375rem] text-bone">{lead.name}</span>
                            {lead.company && <span className="block truncate text-[0.8125rem] text-ash">{lead.company}</span>}
                            <span className="mt-1.5 flex flex-wrap gap-1">
                              {lead.division && <Badge tone="info">{DIVISION_LABEL[lead.division]}</Badge>}
                              {lead.valuePaise > 0 && <Badge>{money(lead.valuePaise)}</Badge>}
                              {lead.partner && <Badge tone="warn">via {lead.partner.name}</Badge>}
                            </span>
                            {lead.nextFollowUp && (
                              <span className={`mt-1.5 block text-[0.75rem] ${overdue(lead.nextFollowUp) ? "font-semibold text-[#dc2626]" : "text-faint"}`}>
                                Follow up {date(lead.nextFollowUp)}
                              </span>
                            )}
                          </Link>
                          {next && (
                            <form action={moveLead} className="mt-2">
                              <input type="hidden" name="id" value={lead.id} />
                              <input type="hidden" name="status" value={next} />
                              <button className="text-[0.75rem] text-ash hover:text-bone">Move to {LEAD_STATUS[next].label} →</button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>
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
