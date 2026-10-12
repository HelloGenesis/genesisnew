import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { getViewer, staffAccess } from "@/lib/crm/session";
import { COMPANY, quoteRef } from "@/lib/crm/quote-templates";

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

const MARK: Record<string, string> = { AI_LAB: "ai-lab", STUDIOS: "studios", BRAND_DESIGN: "brand-design", INFLUENCE: "influence" };
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
  const view = viewParam === "proposal" || viewParam === "pricing" ? viewParam : "both";
  const showPricing = view !== "proposal";
  const prisma = getPrisma();
  const q = await prisma.quote.findUnique({ where: { token }, include: { lines: { orderBy: { position: "asc" } }, creators: { orderBy: { position: "asc" } } } });
  if (!q) notFound();
  const staff = staffAccess(await getViewer().catch(() => null)) === "granted";
  if (!staff && q.status === "SENT") await prisma.quote.update({ where: { id: q.id }, data: { status: "VIEWED", viewedAt: new Date() } });

  const plan = q.kind === "INFLUENCER_PLAN";
  const expired = q.expiresAt < new Date() && !["ACCEPTED", "PAID"].includes(q.status);
  const creatorFees = q.creators.reduce((s, c) => s + (c.feePaise ?? 0), 0);
  const divisions = [...new Set([q.division, ...q.lines.map((l) => l.division)].filter((d): d is NonNullable<typeof d> => Boolean(d)))];
  const notesLines = (q.notes ?? "").split("\n").filter(Boolean);
  const terms = (q.terms ?? "").split("\n").map((t) => t.replace(/^[-•]\s*/, "")).filter(Boolean);
  const proposal = [
    ["Platforms", q.proposalPlatforms.join(" · ")],
    ["Problems we'll solve", q.proposalProblems],
    ["Objectives", q.proposalObjectives],
    ["Influencers", q.proposalInfluencers],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const showProposal = view !== "pricing" && proposal.length > 0;
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
            {/* Genesis Events and Media Group above, Genesis Media under it (Genesis, 12 Oct 2026). */}
            <div className="flex flex-col items-start gap-2.5">
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
            <div><dt className="inline">{view === "proposal" ? "Proposal" : plan ? "Influencer Plan" : "Price Quote"}: </dt><dd className="inline font-medium text-[#0f172a]">{quoteRef(q.number)}</dd></div>
            <div><dt className="inline">Issued on: </dt><dd className="inline">{day(q.issuedAt)}</dd></div>
            <div><dt className="inline">Expiry Date: </dt><dd className="inline">{day(q.expiresAt)}</dd></div>
          </dl>
        </header>

        <section className="px-8 pb-8 sm:px-12">
          <h1 className="text-[1.0625rem] font-semibold">{q.title}</h1>
          {divisions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {divisions.map((d) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={d} src={`/brand/divisions/wordmark/${MARK[d]}-dark.png`} alt={d} className="h-[14px] w-auto" />
              ))}
            </div>
          )}
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
            <dl className="grid gap-5 sm:grid-cols-2">
              {proposal.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f5f9ff] px-5 py-4">
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</dt>
                  <dd className="mt-2 space-y-1 text-[0.9375rem] leading-relaxed">{value.split("\n").filter(Boolean).map((line) => <p key={line}>{label === "Platforms" ? line : `• ${line.replace(/^[-•]\s*/, "")}`}</p>)}</dd>
                </div>
              ))}
            </dl>
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

        {q.creators.length > 0 && (
          <section className="break-inside-avoid border-t border-[#e2e8f0] px-8 py-8 sm:px-12">
            <h2 className="mb-3 font-semibold">{plan ? "Influencer plan" : "Creators"}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[0.875rem]">
                <thead className="text-[#64748b]"><tr><th className="py-2 pr-3 font-medium">Creator</th><th className="py-2 pr-3 font-medium">Platform</th><th className="py-2 pr-3 font-medium">Followers</th><th className="py-2 pr-3 font-medium">Avg views</th><th className="py-2 pr-3 font-medium">Niche</th><th className="py-2 pr-3 font-medium">Deliverables</th><th className="py-2 text-right font-medium">{showPricing ? "Fee" : ""}</th></tr></thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {q.creators.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 pr-3"><span className="font-medium">{c.name}</span><span className="block text-[#64748b]">{c.profileUrl ? <a className="underline" href={c.profileUrl} target="_blank" rel="noopener noreferrer">@{c.handle}</a> : `@${c.handle}`}{c.city ? ` · ${c.city}` : ""}</span></td>
                      <td className="py-2 pr-3">{c.platform.charAt(0) + c.platform.slice(1).toLowerCase()}</td>
                      <td className="py-2 pr-3">{compact(c.followers)}</td>
                      <td className="py-2 pr-3">{compact(c.avgViews)}</td>
                      <td className="py-2 pr-3">{c.niches.join(", ") || "—"}</td>
                      <td className="py-2 pr-3">{c.deliverables ?? "—"}</td>
                      <td className="whitespace-nowrap py-2 text-right">{!showPricing ? "" : c.feePaise === null ? "—" : inr(c.feePaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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
