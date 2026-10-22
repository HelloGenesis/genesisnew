import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { ShareBox } from "@/components/crm/share-box";
import { Card, PageHead } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, date, money } from "@/lib/crm/catalog";
import { briefScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { saveBrief, setBriefStatus } from "../../actions/company";
import { briefOptions } from "../options";
import { BRIEF_STATUS, BriefFields } from "../brief-fields";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireStaff("sales");
  const { id } = await params;
  const prisma = getPrisma();
  const brief = await prisma.brief.findFirst({ where: { id, ...briefScope(viewer) } });
  if (!brief) notFound();
  const [lead, account, options] = await Promise.all([
    brief.leadId ? prisma.lead.findUnique({ where: { id: brief.leadId } }) : null,
    brief.accountId ? prisma.account.findUnique({ where: { id: brief.accountId } }) : null,
    briefOptions(viewer),
  ]);
  const rows: [string, React.ReactNode][] = [
    ["From", lead ? <Link href={`/admin/leads/${lead.id}`} className="crm-link">{lead.company ?? lead.name} (lead)</Link> : account ? <Link href={`/admin/accounts/${account.id}`} className="crm-link">{account.name} (client)</Link> : "—"],
    ["Division", brief.division ? DIVISION_LABEL[brief.division] : "—"],
    ["Services", brief.services.join(", ") || "—"],
    ["Platforms", brief.platforms.join(", ") || "—"],
    ["Budget", brief.budgetPaise ? money(brief.budgetPaise) : "—"],
    ["Needed by", date(brief.deadline)],
  ];
  return (
    <>
      <PageHead kicker={`Brief B-${String(brief.number).padStart(4, "0")}`} title={brief.title} sub={`Added ${date(brief.createdAt)} · ${BRIEF_STATUS[brief.status] ?? brief.status}`}>
        <Link href={`/admin/quotes/new?brief=${brief.id}`} className="crm-btn crm-btn-primary crm-btn-sm">Make a quote</Link>
        <Link href={`/admin/quotes/new?brief=${brief.id}&kind=INFLUENCER_PLAN`} className="crm-btn crm-btn-secondary crm-btn-sm">Influencer plan</Link>
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card title="The brief">
          <dl className="space-y-4">
            {([["Objective", brief.objective], ["Audience", brief.audience], ["Deliverables", brief.deliverables], ["Notes", brief.notes]] as const).map(([k, v]) => (
              <div key={k}><dt className="crm-label">{k}</dt><dd className="mt-1 whitespace-pre-wrap text-bone">{v || "—"}</dd></div>
            ))}
            {brief.references.length > 0 && (
              <div><dt className="crm-label">References</dt><dd className="mt-1 space-y-1">{brief.references.map((r) => <a key={r} href={r} target="_blank" rel="noreferrer" className="crm-link block truncate">{r}</a>)}</dd></div>
            )}
          </dl>
        </Card>
        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-2 text-[0.875rem]">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ash">{k}</dt><dd className="text-right text-bone">{v}</dd></div>)}</dl>
          </Card>
          <Card title="Share the brief">
            <ShareBox
              subject={`Brief: ${brief.title}`}
              phone={lead?.phone}
              text={[
                `Brief: ${brief.title}`,
                lead || account ? `For: ${lead?.company ?? lead?.name ?? account?.name}` : "",
                brief.objective ? `\nObjective: ${brief.objective}` : "",
                brief.audience ? `Audience: ${brief.audience}` : "",
                brief.deliverables ? `Deliverables: ${brief.deliverables}` : "",
                brief.platforms.length ? `Platforms: ${brief.platforms.join(", ")}` : "",
                brief.deadline ? `Needed by: ${date(brief.deadline)}` : "",
                brief.references.length ? `\nReferences:\n${brief.references.join("\n")}` : "",
                "\n— Genesis Media",
              ].filter(Boolean).join("\n")}
            />
          </Card>
          <Card title="Status">
            <div className="flex flex-wrap gap-2">
              {Object.entries(BRIEF_STATUS).map(([k, v]) => (
                <form key={k} action={setBriefStatus}>
                  <input type="hidden" name="id" value={brief.id} />
                  <input type="hidden" name="status" value={k} />
                  <button className={`crm-btn crm-btn-sm ${brief.status === k ? "crm-btn-primary" : "crm-btn-secondary"}`}>{v}</button>
                </form>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <details className="crm-card crm-pad">
        <summary className="cursor-pointer text-bone">Edit the brief</summary>
        <ActionForm action={saveBrief} submit="Save" className="mt-4">
          <BriefFields brief={brief} leads={options.leads} accounts={options.accounts} />
        </ActionForm>
      </details>
    </>
  );
}
