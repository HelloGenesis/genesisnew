import { PageHead } from "@/components/crm/ui";
import { QuoteBuilder, type BuilderQuote } from "@/components/crm/quote-builder";
import { getPrisma } from "@/lib/db";
import { builderData } from "@/lib/crm/quote-data";
import { termsByKey, termsFor } from "@/lib/crm/quote-templates";
import { daysFromNow } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "New quote" };

/**
 * A new quote, filled in from wherever it was started: a lead (its contact and
 * interest), a client account, or a client's request — "every manual brief
 * that comes in" gets its quotation or influencer plan right there.
 */
export default async function NewQuote({ searchParams }: { searchParams: Promise<{ lead?: string; account?: string; request?: string; kind?: string; brief?: string }> }) {
  await requireStaff("sales");
  const p = await searchParams;
  const prisma = getPrisma();
  /* From a brief (/admin/briefs): its lead or client, its title and what it asks for. */
  const brief = p.brief ? await prisma.brief.findUnique({ where: { id: p.brief } }) : null;
  const leadParam = p.lead ?? brief?.leadId ?? undefined;
  const [lead, request] = await Promise.all([
    leadParam ? prisma.lead.findUnique({ where: { id: leadParam } }) : null,
    p.request ? prisma.request.findUnique({ where: { id: p.request }, include: { createdBy: true } }) : null,
  ]);
  const accountId = p.account ?? brief?.accountId ?? request?.accountId ?? lead?.accountId ?? null;
  const account = accountId ? await prisma.account.findUnique({ where: { id: accountId }, include: { members: { include: { user: true }, take: 1 } } }) : null;
  const kind = p.kind === "INFLUENCER_PLAN" ? "INFLUENCER_PLAN" : "QUOTE";
  const division = brief?.division ?? lead?.division ?? (kind === "INFLUENCER_PLAN" ? "INFLUENCE" : null);
  const terms = kind === "INFLUENCER_PLAN" ? termsByKey("influencer")! : termsFor(division);
  const contact = account?.members[0]?.user;
  const initial: BuilderQuote = {
    kind,
    title: brief?.title ?? request?.title ?? (lead ? `${lead.company ?? lead.name}${lead.interest ? ` — ${lead.interest}` : ""}` : account ? `${account.name} — ` : ""),
    division,
    accountId,
    leadId: lead?.id ?? null,
    requestId: request?.id ?? null,
    contactName: lead?.name ?? request?.createdBy?.name ?? contact?.name ?? account?.name ?? "",
    contactEmail: lead?.email ?? request?.createdBy?.email ?? contact?.email ?? account?.email ?? "",
    contactPhone: lead?.phone ?? account?.phone ?? null,
    company: lead?.company ?? account?.legalName ?? account?.name ?? null,
    expiresAt: daysFromNow(14).toISOString().slice(0, 10),
    notes: brief ? [brief.objective && `Objective: ${brief.objective}`, brief.deliverables && `Deliverables: ${brief.deliverables}`, terms.notes].filter(Boolean).join("\n\n") : terms.notes,
    terms: terms.terms.join("\n"),
    addGst: true,
    gstPercent: 18,
    igst: false,
    proposalPlatforms: brief?.platforms ?? [],
    proposalProblems: null,
    proposalObjectives: brief?.objective ?? null,
    proposalInfluencers: brief?.deliverables ?? null,
    discount: 0,
    lines: [],
    creators: [],
  };
  const data = await builderData();
  return (
    <>
      <PageHead kicker="Sales" title={kind === "INFLUENCER_PLAN" ? "New influencer plan" : "New quote"} sub={request ? `For request: ${request.title}` : lead ? `For lead: ${lead.name}` : undefined} />
      <QuoteBuilder initial={initial} catalog={data.catalog} terms={data.terms} pool={data.pool} />
    </>
  );
}
