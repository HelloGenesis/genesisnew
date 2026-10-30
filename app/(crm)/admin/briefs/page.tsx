import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Badge, Empty, PageHead, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, date, money } from "@/lib/crm/catalog";
import { briefScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { saveBrief } from "../actions/company";
import { BRIEF_STATUS, BriefFields } from "./brief-fields";
import { briefOptions } from "./options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Briefs" };

/**
 * BRIEFS (Genesis, 12 Oct 2026: "a brief section where we can add brief
 * information from new leads or existing clients"). What the client wants,
 * taken down on the call, kept in one place, and one click from a quote.
 */
export default async function BriefsPage({ searchParams }: { searchParams: Promise<{ lead?: string; account?: string }> }) {
  const viewer = await requireStaff("sales");
  const p = await searchParams;
  const prisma = getPrisma();
  const [briefs, options] = await Promise.all([prisma.brief.findMany({ where: briefScope(viewer), orderBy: { createdAt: "desc" }, take: 300 }), briefOptions(viewer)]);
  const leadIds = [...new Set(briefs.map((b) => b.leadId).filter((x): x is string => Boolean(x)))];
  const accountIds = [...new Set(briefs.map((b) => b.accountId).filter((x): x is string => Boolean(x)))];
  const [leads, accounts] = await Promise.all([
    prisma.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true, company: true } }),
    prisma.account.findMany({ where: { id: { in: accountIds } }, select: { id: true, name: true } }),
  ]);
  const from = (b: (typeof briefs)[number]) => {
    const lead = leads.find((l) => l.id === b.leadId);
    if (lead) return { label: lead.company ?? lead.name, kind: "Lead", href: `/admin/leads/${lead.id}` };
    const account = accounts.find((a) => a.id === b.accountId);
    if (account) return { label: account.name, kind: "Client", href: `/admin/accounts/${account.id}` };
    return null;
  };
  return (
    <>
      <PageHead kicker="Sales" title="Briefs" sub={`${briefs.length} brief${briefs.length === 1 ? "" : "s"}`} />
      <AddPanel label="Add a brief" open={Boolean(p.lead || p.account)}>
        <ActionForm action={saveBrief} submit="Save brief">
          <BriefFields brief={{ leadId: p.lead ?? null, accountId: p.account ?? null }} leads={options.leads} accounts={options.accounts} />
        </ActionForm>
      </AddPanel>
      {briefs.length === 0 ? (
        <Empty>No briefs yet. Add one from a call, a lead or an existing client.</Empty>
      ) : (
        <Table head={["Brief", "From", "Division", "Budget", "Duration", "Needed by", "Status"]}>
          {briefs.map((b) => {
            const f = from(b);
            return (
              <tr key={b.id}>
                <td><Link href={`/admin/briefs/${b.id}`} className="text-bone hover:underline">B-{String(b.number).padStart(4, "0")} · {b.title}</Link><span className="block text-[0.75rem] text-faint">Added {date(b.createdAt)}</span></td>
                <td>{f ? <Link href={f.href} className="hover:text-bone">{f.label} <span className="text-faint">· {f.kind}</span></Link> : "—"}</td>
                <td>{b.division ? DIVISION_LABEL[b.division] : "—"}</td>
                <td>{b.budgetPaise ? money(b.budgetPaise) : "—"}</td>
                <td>{b.duration || "—"}</td>
                <td>{date(b.deadline)}</td>
                <td><Badge tone={b.status === "WON" ? "good" : b.status === "LOST" ? "bad" : b.status === "NEW" ? "info" : "muted"}>{BRIEF_STATUS[b.status] ?? b.status}</Badge></td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
