import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { QuoteBuilder, type BuilderQuote } from "@/components/crm/quote-builder";
import { Card, Field, Notice, PageHead, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { QUOTE_STATUS, dateTime, money, projectRef } from "@/lib/crm/catalog";
import { appUrl } from "@/lib/crm/notify";
import { builderData } from "@/lib/crm/quote-data";
import { quoteRef } from "@/lib/crm/quote-templates";
import { requireStaff } from "@/lib/crm/session";
import { razorpayKeys } from "@/lib/razorpay";

import { deleteQuote, duplicateQuote, sendQuoteAction, setQuoteStatus } from "../../actions/quotes";

export const dynamic = "force-dynamic";

export default async function QuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireStaff("sales");
  const { id } = await params;
  const { saved } = await searchParams;
  const q = await getPrisma().quote.findUnique({
    where: { id },
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
    discount: q.discountPaise / 100,
    lines: q.lines.map((l) => ({ kind: l.kind, productId: l.productId, division: l.division, title: l.title, subtitle: l.subtitle, details: l.details, note: l.note, qty: l.qty, unit: l.unitPaise / 100 })),
    creators: q.creators.map((c) => ({ creatorId: c.creatorId, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, deliverables: c.deliverables, fee: c.feePaise === null ? null : c.feePaise / 100 })),
  };
  const data = await builderData();
  const plan = q.kind === "INFLUENCER_PLAN";
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
            <Field label={`Message to ${q.contactName}`} hint="Goes above the summary in the email."><textarea name="message" className="crm-input !min-h-24" defaultValue={plan ? "Here's the influencer plan we've put together, with the creator list and fees. Approve it on the link and we'll start booking." : "Thank you for the brief. Here's our quotation for the scope we discussed."} /></Field>
            <label className="flex items-center gap-2 text-[0.875rem] text-ash">
              <input type="checkbox" name="payment" defaultChecked={Boolean(razorpayKeys())} disabled={!razorpayKeys()} /> Include a Razorpay payment link for {money(q.totalPaise)}
              {!razorpayKeys() && <span className="text-faint">(Razorpay keys not set)</span>}
            </label>
          </ActionForm>
          <p className="mt-3 break-all text-[0.8125rem] text-faint">Client link: {clientLink}</p>
          {q.paymentUrl && <p className="break-all text-[0.8125rem] text-faint">Payment link: {q.paymentUrl}</p>}
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

      {q.status === "PAID" ? <Notice>This quote is paid, so it can&apos;t change. Duplicate it to quote again.</Notice> : <QuoteBuilder initial={initial} catalog={data.catalog} terms={data.terms} pool={data.pool} />}
    </>
  );
}
