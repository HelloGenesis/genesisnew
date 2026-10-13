import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { getViewer, staffAccess } from "@/lib/crm/session";
import { COMPANY, quoteRef } from "@/lib/crm/quote-templates";
import { looksLikeHtml, sanitizeHtml, textToHtml } from "@/lib/rich-text";

import { AcceptForm } from "./accept-form";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
/*
  THE PAGE TITLE IS THE PDF'S FILE NAME (Genesis, 12 Oct 2026: "quotation me
  file name acc to the quotation number"): Save as PDF names the file after
  it, so it reads "Quotation 0000041 - Company".
*/
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const q = isDatabaseConfigured() ? await getPrisma().quote.findUnique({ where: { token }, select: { number: true, company: true, contactName: true, kind: true } }).catch(() => null) : null;
  const name = q ? `${q.kind === "INFLUENCER_PLAN" ? "Influencer Plan" : "Quotation"} ${String(q.number).padStart(7, "0")} - ${q.company ?? q.contactName}` : "Quotation";
  return { title: { absolute: name }, robots: { index: false, follow: false } };
}

/* Genesis Events and Media Group's own logo, when it's in /public/brand; its name set in type until then. */
const GROUP_LOGO = ["genesis-events-media.png", "genesis-events-media.svg", "genesis-events-media.webp"].find((f) => existsSync(join(process.cwd(), "public", "brand", f)));

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: Date) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);
const compact = (n: number | null) => (n ? new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n) : "—");

/**
 * THE QUOTATION THE CLIENT OPENS — Genesis's Price Quote layout (#0000039):
 * the logo and company block, quote number and dates, the client, every line
 * with what it includes, totals, notes and legal terms. An influencer plan
 * adds its creator list. Always on white, and prints to a clean PDF.
 *
 * The link's token is the permission; opening it marks the quote viewed
 * (unless it's Genesis staff looking).
 */
export default async function QuoteDocument({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ paid?: string; view?: string }> }) {
  if (!isDatabaseConfigured()) notFound();
  const { token } = await params;
  const { paid, view: viewParam } = await searchParams;
  /* Proposal and pricing can go separately (Genesis, 12 Oct 2026): ?view=proposal hides every price, ?view=pricing the proposal. */
  const view = viewParam === "proposal" || viewParam === "pricing" || viewParam === "plan" || viewParam === "proposal-plan" ? viewParam : "both";
  /* Each part on its own or together (Genesis, 12 Oct 2026): proposal, pricing, influencer plan. */
  const showPricing = view === "both" || view === "pricing";
  const showCreators = view === "both" || view === "plan" || view === "proposal-plan";
  const showCreatorFees = view === "both" || view === "plan";
  const prisma = getPrisma();
  const q = await prisma.quote.findUnique({ where: { token }, include: { lines: { orderBy: { position: "asc" } }, creators: { orderBy: { position: "asc" } } } });
  if (!q) notFound();
  const staff = staffAccess(await getViewer().catch(() => null)) === "granted";
  if (!staff && q.status === "SENT") await prisma.quote.update({ where: { id: q.id }, data: { status: "VIEWED", viewedAt: new Date() } });

  const plan = q.kind === "INFLUENCER_PLAN";
  const expired = q.expiresAt < new Date() && !["ACCEPTED", "PAID"].includes(q.status);
  const creatorFees = q.creators.reduce((s, c) => s + (c.feePaise ?? 0), 0);
  const notesLines = (q.notes ?? "").split("\n").filter(Boolean);
  const terms = (q.terms ?? "").split("\n").map((t) => t.replace(/^[-•]\s*/, "")).filter(Boolean);
  /* The proposal's boxes, one after another (Genesis, 13 Oct 2026), as formatted in the builder; older plain lines become bullets. */
  const sections = Array.isArray(q.proposalSections) ? (q.proposalSections as { title?: string; html?: string }[]) : [];
  const proposal = [
    ["Platforms", q.proposalPlatforms.length ? `<p>${q.proposalPlatforms.join(" · ")}</p>` : ""],
    ["TG (target group)", q.proposalTg],
    ["Problems we'll solve", q.proposalProblems],
    ["Objectives", q.proposalObjectives],
    ["Influencers", q.proposalInfluencers],
    ...sections.map((x) => [x.title ?? "", x.html ?? ""]),
  ]
    .map(([label, value]) => [label ?? "", value ? sanitizeHtml(looksLikeHtml(value) ? value : textToHtml(value)) : ""] as [string, string])
    .filter(([, value]) => Boolean(value));
  /* The plan's columns as chosen in the builder: removed ones left out, added ones after. */
  const cols = (q.planColumns ?? {}) as { hidden?: string[]; custom?: string[] };
  const hiddenCols = new Set(cols.hidden ?? []);
  const customCols = (cols.custom ?? []).filter(Boolean);
  const showCol = (k: string) => !hiddenCols.has(k);
  const showProposal = (view === "both" || view === "proposal" || view === "proposal-plan") && proposal.length > 0;
  const cgst = Math.round(q.taxPaise / 2);

  return (
    <div className="min-h-dvh bg-[#eef2f7] py-6 text-[#0f172a] print:bg-white print:py-0 [color-scheme:light]">
      <style>{`@media print { @page { size: A4; margin: 12mm; } .no-print { display: none !important; } }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[860px] flex-wrap items-center justify-between gap-2 px-4">
        <p className="text-[0.875rem] text-[#475569]">
          {q.status === "PAID" || paid ? "Payment received. Thank you!" : q.status === "ACCEPTED" ? "Accepted. Thank you!" : expired ? "This quotation has expired. Reply to the email for a fresh one." : `Valid until ${day(q.expiresAt)}`}
        </p>
        <PrintButton />
      </div>

      <article className="font-sans [&_h1]:font-sans [&_h2]:font-sans mx-auto max-w-[860px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_-20px_rgb(15_23_42/0.35)] print:max-w-none print:rounded-none print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 px-8 pb-6 pt-10 sm:px-12">
          <div className="flex flex-wrap items-start gap-6">
            {/* Genesis Events and Media Group above, Genesis Media under it, together in one box (Genesis, 12–13 Oct 2026). */}
            <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4">
              {GROUP_LOGO ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/brand/${GROUP_LOGO}`} alt="Genesis Events and Media Group" className="h-9 w-auto" />
              ) : (
                <span className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/genesis-only-dark.png" alt="Genesis" className="h-7 w-auto" />
                  <span className="mt-1 text-[0.5rem] font-bold tracking-[0.18em] text-[#0f172a]">EVENTS &amp; MEDIA GROUP</span>
                </span>
              )}
              <span className="h-px w-full bg-[#e2e8f0]" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/genesis-wordmark-dark.png" alt="Genesis Media" className="h-[16px] w-auto" />
            </div>
            <address className="not-italic text-[0.9375rem] leading-relaxed text-[#334155]">
              <strong className="text-[#0f172a]">{COMPANY.name}</strong>
              {COMPANY.lines.map((l) => <span key={l} className="block">{l}</span>)}
              <span className="block">{COMPANY.email}</span>
              <span className="block">Phone: {COMPANY.phone}</span>
            </address>
          </div>
          <dl className="text-right text-[0.9375rem] leading-relaxed text-[#334155]">
            <div><dt className="inline">{view === "proposal" || view === "proposal-plan" ? "Proposal" : view === "plan" || plan ? "Influencer Plan" : "Price Quote"}: </dt><dd className="inline font-medium text-[#0f172a]">{quoteRef(q.number)}</dd></div>
            <div><dt className="inline">Issued on: </dt><dd className="inline">{day(q.issuedAt)}</dd></div>
            <div><dt className="inline">Expiry Date: </dt><dd className="inline">{day(q.expiresAt)}</dd></div>
          </dl>
        </header>

        <section className="px-8 pb-8 sm:px-12">
          <h1 className="text-[1.0625rem] font-semibold">{q.title}</h1>
          <div className="mt-6 text-[0.9375rem] leading-relaxed">
            <p className="font-semibold">{q.contactName}</p>
            {q.company && q.company !== q.contactName && <p>{q.company}</p>}
            <p>{q.contactEmail}</p>
            {q.contactPhone && <p>{q.contactPhone}</p>}
          </div>
        </section>

        {showProposal && (
          <section className="break-inside-avoid border-t border-[#e2e8f0] px-8 py-8 sm:px-12">
            <h2 className="mb-4 text-[1.0625rem] font-semibold">Proposal</h2>
            <dl className="space-y-4">
              {proposal.map(([label, value], i) => (
                <div key={`${label}-${i}`} className="break-inside-avoid rounded-xl bg-[#f5f9ff] px-5 py-4">
                  {label && <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</dt>}
                  <dd
                    className="mt-2 space-y-2 text-[0.9375rem] leading-relaxed [&_a]:text-[#1d4ed8] [&_a]:underline [&_h3]:text-[1rem] [&_h3]:font-semibold [&_h4]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-[640px] [&_iframe]:rounded-lg [&_img]:max-h-[420px] [&_img]:rounded-lg [&_li]:my-0.5 [&_mark]:rounded [&_mark]:bg-[#fff2a8] [&_mark]:px-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 print:[&_iframe]:hidden"
                    dangerouslySetInnerHTML={{ __html: value }}
                  />
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* The influencer plan, then the costing below everything (Genesis, 13 Oct 2026). */}
        {showCreators && q.creators.length > 0 && (
          <section className="break-inside-avoid border-t border-[#e2e8f0] px-8 py-8 sm:px-12">
            <h2 className="mb-3 font-semibold">{plan ? "Influencer plan" : "Creators"}</h2>
            <div className="overflow-x-auto">
              {/* The plan's columns, as on Genesis's influencer plans: prices per deliverable only when pricing is part of what's sent. */}
              <table className="w-full min-w-[760px] text-left text-[0.8125rem]">
                <thead className="bg-[#fff2cc] text-[#1e293b]">
                  <tr>
                    {[
                      ...(showCol("tier") ? ["Tier"] : []), "Name", ...(showCol("category") ? ["Category"] : []), ...(showCol("ig") ? ["IG Link"] : []), ...(showCol("followers") ? ["Followers"] : []), ...(showCol("avgViews") ? ["Avg Views"] : []), ...(showCol("er") ? ["ER"] : []),
                      ...(showCreatorFees ? [...(showCol("reelPrice") ? ["1 IG Reel"] : []), ...(showCol("storyPrice") ? ["Story + LIB"] : []), ...(showCol("dlPrice") ? ["DL (1 month)"] : [])] : []),
                      ...(showCol("location") ? ["Location"] : []), ...customCols,
                    ].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {[...q.creators].sort((a, b) => a.followers - b.followers).map((c) => (
                    <tr key={c.id} className="align-top">
                      {showCol("tier") && <td className="whitespace-nowrap px-2 py-2 font-medium">{c.followers < 100_000 ? "Nano & Micro" : "Macro & Mega"}</td>}
                      <td className="px-2 py-2 font-medium">{c.name}</td>
                      {showCol("category") && <td className="px-2 py-2">{c.niches.join(" & ") || "—"}</td>}
                      {showCol("ig") && <td className="px-2 py-2">{c.profileUrl ? <a className="underline" href={c.profileUrl} target="_blank" rel="noopener noreferrer">@{c.handle}</a> : `@${c.handle}`}</td>}
                      {showCol("followers") && <td className="whitespace-nowrap px-2 py-2">{compact(c.followers)}</td>}
                      {showCol("avgViews") && <td className="whitespace-nowrap px-2 py-2">{compact(c.avgViews)}</td>}
                      {showCol("er") && <td className="whitespace-nowrap px-2 py-2">{c.engagementRate ? `${c.engagementRate}%` : "—"}</td>}
                      {showCreatorFees && (
                        <>
                          {showCol("reelPrice") && <td className="whitespace-nowrap px-2 py-2">{c.reelPricePaise ? inr(c.reelPricePaise) : "—"}</td>}
                          {showCol("storyPrice") && <td className="whitespace-nowrap px-2 py-2">{c.storyPricePaise ? inr(c.storyPricePaise) : "—"}</td>}
                          {showCol("dlPrice") && <td className="whitespace-nowrap px-2 py-2">{c.dlPricePaise ? inr(c.dlPricePaise) : "—"}</td>}
                        </>
                      )}
                      {showCol("location") && <td className="px-2 py-2">{c.city ?? "—"}</td>}
                      {customCols.map((name) => <td key={name} className="px-2 py-2">{((c.extra ?? {}) as Record<string, string>)[name] || "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showPricing && (
        <table className="w-full border-collapse text-left text-[0.9375rem]">
          <thead className="bg-[#dbe8ff] text-[#1e293b]">
            <tr>
              <th className="px-8 py-3.5 font-semibold sm:px-12">Product or Service</th>
              <th className="px-3 py-3.5 font-semibold">Quantity</th>
              <th className="px-3 py-3.5 font-semibold">Price</th>
              <th className="px-3 py-3.5 font-semibold">Tax</th>
              <th className="px-8 py-3.5 text-right font-semibold sm:px-12">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {q.lines.map((l) => (
              <tr key={l.id} className="break-inside-avoid align-top">
                <td className="px-8 py-6 sm:px-12">
                  <p className="font-medium">{l.title}</p>
                  {l.subtitle && <p className="text-[#64748b]">{l.subtitle}</p>}
                  {l.details && (
                    <ul className="mt-3 space-y-0.5 text-[#64748b]">
                      {l.details.split("\n").filter(Boolean).map((d) => <li key={d}>• {d.replace(/^[-•]\s*/, "")}</li>)}
                    </ul>
                  )}
                  {l.note && <p className="mt-3 whitespace-pre-line text-[#64748b]">{l.note}</p>}
                </td>
                <td className="px-3 py-6">{l.qty}</td>
                <td className="whitespace-nowrap px-3 py-6">{inr(l.unitPaise)}</td>
                <td className="px-3 py-6 text-[#64748b]">{q.addGst ? (q.igst ? `IGST ${q.gstPercent}%` : `${q.gstPercent / 2}% + ${q.gstPercent / 2}%`) : ""}</td>
                <td className="whitespace-nowrap px-8 py-6 text-right sm:px-12">{inr(l.qty * l.unitPaise)}</td>
              </tr>
            ))}
            {q.creators.length > 0 && (
              <tr className="align-top">
                <td className="px-8 py-6 sm:px-12">
                  <p className="font-medium">{plan ? "Creators" : "Creator fees"}</p>
                  <p className="text-[#64748b]">{q.creators.length} creators, as listed below</p>
                </td>
                <td className="px-3 py-6">{q.creators.length}</td>
                <td className="px-3 py-6" />
                <td className="px-3 py-6 text-[#64748b]">{q.addGst ? (q.igst ? `IGST ${q.gstPercent}%` : `${q.gstPercent / 2}% + ${q.gstPercent / 2}%`) : ""}</td>
                <td className="whitespace-nowrap px-8 py-6 text-right sm:px-12">{inr(creatorFees)}</td>
              </tr>
            )}
          </tbody>
        </table>
        )}

        {showPricing && (
        <section className="break-inside-avoid border-t border-[#e2e8f0] px-8 py-10 sm:px-12">
          <dl className="ml-auto max-w-sm space-y-3 text-[1rem]">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(q.subtotalPaise)}</dd></div>
            {q.discountPaise > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{inr(q.discountPaise)}</dd></div>}
            {q.addGst && (q.igst ? (
              <div className="flex justify-between"><dt>IGST ({q.gstPercent}%)</dt><dd>{inr(q.taxPaise)}</dd></div>
            ) : (
              <>
                <div className="flex justify-between"><dt>CGST ({q.gstPercent / 2}%)</dt><dd>{inr(cgst)}</dd></div>
                <div className="flex justify-between"><dt>SGST ({q.gstPercent / 2}%)</dt><dd>{inr(q.taxPaise - cgst)}</dd></div>
              </>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-[#dbe8ff] bg-[#f5f9ff] px-5 py-4">
              <dt className="text-[1.0625rem]">Total Price:</dt>
              <dd className="text-[1.375rem] font-bold">{inr(q.totalPaise)}</dd>
            </div>
            {!q.addGst && <p className="text-right text-[0.8125rem] text-[#64748b]">Exclusive of GST.</p>}
          </dl>
        </section>
        )}

        {(notesLines.length > 0 || terms.length > 0) && (
          <section className="space-y-6 border-t border-[#e2e8f0] px-8 py-10 text-[0.875rem] leading-relaxed text-[#334155] sm:px-12">
            {notesLines.length > 0 && (
              <div>
                <h2 className="font-semibold text-[#1e293b]">Notes</h2>
                {notesLines.map((n) => (
                  <p key={n}>{/^https?:\/\//.test(n.split(": ")[1] ?? "") ? <>{n.split(": ")[0]}: <a className="underline" href={n.split(": ")[1]} target="_blank" rel="noopener noreferrer">{n.split(": ")[1]}</a></> : n}</p>
                ))}
              </div>
            )}
            {terms.length > 0 && (
              <div className="break-inside-avoid-page">
                <h2 className="font-semibold text-[#1e293b]">Legal Terms</h2>
                {terms.map((t) => <p key={t}>- {t}</p>)}
              </div>
            )}
          </section>
        )}

        {showPricing && !["PAID", "ACCEPTED", "DECLINED"].includes(q.status) && !expired && !paid && (
          <section className="no-print border-t border-[#e2e8f0] bg-[#f8fafc] px-8 py-8 sm:px-12">
            <h2 className="mb-3 font-semibold">{plan ? "Approve the plan" : "Accept the quotation"}</h2>
            <AcceptForm token={q.token} plan={plan} paymentUrl={q.paymentUrl} />
          </section>
        )}
        {q.status === "ACCEPTED" && q.paymentUrl && !paid && (
          <section className="no-print border-t border-[#e2e8f0] bg-[#f8fafc] px-8 py-6 sm:px-12">
            <a href={q.paymentUrl} className="inline-flex rounded-full bg-[#ffc516] px-5 py-2.5 font-semibold text-[#141216]">Pay {inr(q.totalPaise)} now</a>
          </section>
        )}
      </article>
    </div>
  );
}
