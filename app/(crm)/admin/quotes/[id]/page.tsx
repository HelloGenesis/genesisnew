import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { OutreachPanel } from "@/components/crm/outreach-panel";
import { ShareBox } from "@/components/crm/share-box";
import { QuoteBuilder, type BuilderQuote } from "@/components/crm/quote-builder";
import { Card, Field, Notice, PageHead, Select, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { QUOTE_STATUS, dateTime, money, projectRef } from "@/lib/crm/catalog";
import { appUrl } from "@/lib/crm/notify";
import { contactBits, DEFAULT_DELIVERABLES, DEFAULT_OUTREACH } from "@/lib/crm/outreach";
import { builderData } from "@/lib/crm/quote-data";
import { quoteRef } from "@/lib/crm/quote-templates";
import { quoteScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { razorpayKeys } from "@/lib/razorpay";

import { planSheets } from "../../actions/outreach";
import { deleteQuote, duplicateQuote, sendQuoteAction, setQuoteStatus } from "../../actions/quotes";

const rupee = (v: number | null | undefined) => (v === null || v === undefined ? null : v / 100);

export const dynamic = "force-dynamic";

export default async function QuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const viewer = await requireStaff("sales");
  const { id } = await params;
  const { saved } = await searchParams;
  const q = await getPrisma().quote.findFirst({
    where: { id, ...quoteScope(viewer) },
    include: { lines: { orderBy: { position: "asc" } }, creators: { orderBy: { position: "asc" } }, order: true, projects: true, lead: true, account: true, request: true },
  });
  if (!q) notFound();
  const initial: BuilderQuote = {
    id: q.id,
    kind: q.kind,
    title: q.title,
    division: q.division,
    accountId: q.accountId,
    leadId: q.leadId,
    requestId: q.requestId,
    contactName: q.contactName,
    contactEmail: q.contactEmail,
    contactPhone: q.contactPhone,
    company: q.company,
    expiresAt: q.expiresAt.toISOString().slice(0, 10),
    notes: q.notes,
    terms: q.terms,
    addGst: q.addGst,
    gstPercent: q.gstPercent,
    igst: q.igst,
    proposalPlatforms: q.proposalPlatforms,
    proposalProblems: q.proposalProblems,
    proposalObjectives: q.proposalObjectives,
    proposalInfluencers: q.proposalInfluencers,
    discount: q.discountPaise / 100,
    lines: q.lines.map((l) => ({ kind: l.kind, productId: l.productId, division: l.division, title: l.title, subtitle: l.subtitle, details: l.details, note: l.note, qty: l.qty, unit: l.unitPaise / 100 })),
    markupPercent: q.markupPercent,
    planBudget: q.planBudget,
    creators: q.creators.map((c) => ({
      creatorId: c.creatorId, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, deliverables: c.deliverables,
      fee: rupee(c.feePaise), er: c.engagementRate, reelCost: rupee(c.reelCostPaise), storyCost: rupee(c.storyCostPaise), dlCost: rupee(c.dlCostPaise),
      reelPrice: rupee(c.reelPricePaise), storyPrice: rupee(c.storyPricePaise), dlPrice: rupee(c.dlPricePaise), reachout: c.reachout, contact: c.contact, remarks: c.remarks,
    })),
  };
  const data = await builderData();
  const plan = q.kind === "INFLUENCER_PLAN";
  /* Outreach for the plan's creators: their numbers and emails from the influencer database (or the plan's contact line). */
  const hasCreators = q.creators.length > 0;
  const linked = hasCreators ? await getPrisma().creator.findMany({ where: { id: { in: q.creators.map((c) => c.creatorId).filter((x): x is string => Boolean(x)) } }, select: { id: true, phone: true, email: true } }) : [];
  const outreachRows = q.creators.map((c) => {
    const d = linked.find((x) => x.id === c.creatorId);
    const bits = contactBits(c.contact);
    return { id: c.id, name: c.name, handle: c.handle, phone: d?.phone ?? bits.phone, email: d?.email ?? bits.email, reachout: c.reachout };
  });
  const template = hasCreators ? ((await getPrisma().appSetting.findUnique({ where: { key: "outreach-template" } }))?.value ?? DEFAULT_OUTREACH) : "";
  const cities = [...new Set(q.creators.map((c) => c.city).filter(Boolean))] as string[];
  const clientLink = appUrl(`/quote/${q.token}`);

  return (
    <>
      <PageHead
        kicker={`${plan ? "Influencer plan" : "Price quote"} ${quoteRef(q.number)}`}
        title={q.title}
        sub={<>{q.account ? <Link href={`/admin/accounts/${q.account.id}`} className="crm-link">{q.account.name}</Link> : (q.company ?? q.contactName)} · {money(q.totalPaise)}{q.lead && <> · lead <Link href={`/admin/leads/${q.lead.id}`} className="crm-link">{q.lead.name}</Link></>}{q.request && <> · request <Link href={`/admin/requests/${q.request.id}`} className="crm-link">{q.request.title}</Link></>}</>}
      >
        <Status value={QUOTE_STATUS[q.status]} />
        <a href={`/quote/${q.token}`} target="_blank" rel="noopener noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Client view / PDF ↗</a>
      </PageHead>
      {saved && <Notice>Saved as a draft. Check the client view, then send it.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title={q.status === "DRAFT" ? "Send to the client" : "Send again"}>
          <ActionForm action={sendQuoteAction} submit={q.status === "DRAFT" ? "Send quotation email" : "Re-send with the latest changes"} confirm={`Email this ${plan ? "plan" : "quote"} to ${q.contactEmail}?`}>
            <input type="hidden" name="id" value={q.id} />
            <Field label="Send" hint="Together, or each part on its own: proposal (platforms, problems, objectives), pricing (lines, totals, terms), influencer plan (the creator list).">
              <Select name="view" required defaultValue="both" options={[["both", "Everything together (proposal, pricing, influencer plan)"], ["proposal", "Proposal only (no prices)"], ["proposal-plan", "Proposal + influencer list (no prices)"], ["plan", "Influencer plan only (with its prices)"], ["pricing", "Pricing only"]]} />
            </Field>
            <Field label={`Message to ${q.contactName}`} hint="Goes above the summary in the email."><textarea name="message" className="crm-input !min-h-24" defaultValue={plan ? "Here's the influencer plan we've put together, with the creator list and fees. Approve it on the link and we'll start booking." : "Thank you for the brief. Here's our quotation for the scope we discussed."} /></Field>
            <label className="flex items-center gap-2 text-[0.875rem] text-ash">
              <input type="checkbox" name="payment" defaultChecked={Boolean(razorpayKeys())} disabled={!razorpayKeys()} /> Include a Razorpay payment link for {money(q.totalPaise)}
              {!razorpayKeys() && <span className="text-faint">(Razorpay keys not set)</span>}
            </label>
          </ActionForm>
          <p className="mt-3 break-all text-[0.8125rem] text-faint">Client link: {clientLink} · <a className="crm-link" href={`${clientLink}?view=proposal`} target="_blank" rel="noreferrer">proposal only</a> · <a className="crm-link" href={`${clientLink}?view=plan`} target="_blank" rel="noreferrer">influencer plan only</a> · <a className="crm-link" href={`${clientLink}?view=pricing`} target="_blank" rel="noreferrer">pricing only</a></p>
          {q.paymentUrl && <p className="break-all text-[0.8125rem] text-faint">Payment link: {q.paymentUrl}</p>}
          <div className="mt-4 border-t border-[var(--glass-border)] pt-3">
            <p className="crm-label mb-1">Or share it on WhatsApp / email</p>
            <ShareBox
              subject={`${plan ? "Influencer plan" : "Quotation"} ${quoteRef(q.number)} · ${q.title}`}
              phone={q.contactPhone}
              text={`Hi ${q.contactName.split(" ")[0]},\n\nHere's our ${plan ? "influencer plan" : "quotation"} for ${q.title}:\n${clientLink}${q.paymentUrl ? `\n\nPay securely: ${q.paymentUrl}` : ""}\n\nBest,\n${viewer.name ?? "Genesis Media"}${viewer.title ? `\n${viewer.title}` : ""}\ngenesismedia.co`}
            />
          </div>
        </Card>
        <Card title="History">
          <ul className="space-y-1.5 text-[0.9375rem]">
            <li className="text-ash">Created {dateTime(q.createdAt)}</li>
            {q.sentAt && <li className="text-bone">Sent {dateTime(q.sentAt)}</li>}
            {q.viewedAt && <li className="text-bone">Opened by the client {dateTime(q.viewedAt)}</li>}
            {q.acceptedAt && <li className="text-bone">Accepted {dateTime(q.acceptedAt)} · {q.acceptedBy}</li>}
            {q.order && <li className="text-bone">Order <Link className="crm-link" href={`/admin/billing/${q.order.id}`}>{q.order.reference}</Link> · {q.order.status.toLowerCase()}</li>}
            {q.projects.map((p) => <li key={p.id} className="text-bone">Project <Link className="crm-link" href={`/admin/projects/${p.id}`}>{projectRef(p.number)} · {p.name}</Link></li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {!["ACCEPTED", "PAID"].includes(q.status) && (
              <form action={setQuoteStatus}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="status" value="ACCEPTED" /><button className="crm-btn crm-btn-secondary crm-btn-sm">Client accepted (start project)</button></form>
            )}
            {!["DECLINED", "PAID", "ACCEPTED"].includes(q.status) && (
              <form action={setQuoteStatus}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="status" value="DECLINED" /><button className="crm-btn crm-btn-secondary crm-btn-sm">Declined</button></form>
            )}
            <form action={duplicateQuote}><input type="hidden" name="id" value={q.id} /><button className="crm-btn crm-btn-secondary crm-btn-sm">Duplicate</button></form>
            {!["ACCEPTED", "PAID"].includes(q.status) && (
              <form action={deleteQuote}><input type="hidden" name="id" value={q.id} /><button className="crm-btn crm-btn-secondary crm-btn-sm text-[#dc2626]">Delete</button></form>
            )}
          </div>
        </Card>
      </div>

      {hasCreators && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card title="Get costing from the creators">
            <OutreachPanel
              rows={outreachRows}
              template={template}
              fields={{
                campaign: `${q.company ?? "brand"} campaign`,
                audience: "",
                cities: cities.length > 1 ? `${cities.slice(0, -1).join(", ")} and ${cities.at(-1)}` : (cities[0] ?? ""),
                deliverables: DEFAULT_DELIVERABLES,
                sender: viewer.name ?? "Genesis Media",
                senderTitle: viewer.title ?? "",
              }}
            />
          </Card>
          <Card title="Google Sheets">
            <p className="mb-3 text-[0.875rem] text-ash">The plan as Genesis&apos;s two sheets: <b className="text-bone">external</b> for the client (Summary + Influencer Plan, client prices only) and <b className="text-bone">internal</b> for the team (reach-out, creator costs, contact, profit).</p>
            <ActionForm action={planSheets} submit={q.extSheetId ? "Update both sheets" : "Create internal + external sheets"}>
              <input type="hidden" name="id" value={q.id} />
            </ActionForm>
            {q.extSheetId && (
              <div className="mt-3 space-y-1.5 text-[0.875rem]">
                <a className="crm-link block" href={`https://docs.google.com/spreadsheets/d/${q.extSheetId}/edit`} target="_blank" rel="noreferrer">External plan (for the client) ↗</a>
                <a className="crm-link block" href={`https://docs.google.com/spreadsheets/d/${q.intSheetId}/edit`} target="_blank" rel="noreferrer">Internal plan (team only) ↗</a>
                <a className="crm-link block" href={`https://docs.google.com/spreadsheets/d/${q.extSheetId}/export?format=xlsx`}>Download external as Excel</a>
                <a className="crm-link block" href={`https://docs.google.com/spreadsheets/d/${q.intSheetId}/export?format=xlsx`}>Download internal as Excel</a>
              </div>
            )}
            <p className="mt-3 text-[0.75rem] text-faint">Save the plan first; the sheets are written from what&apos;s saved. Shared with the super admins and you; share the external one with the client from Google.</p>
          </Card>
        </div>
      )}

      {q.status === "PAID" ? <Notice>This quote is paid, so it can&apos;t change. Duplicate it to quote again.</Notice> : <QuoteBuilder initial={initial} catalog={data.catalog} terms={data.terms} pool={data.pool} />}
    </>
  );
}
