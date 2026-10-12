import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { COMPANY } from "@/lib/crm/quote-templates";

import { PrintButton } from "../../quote/[token]/print-button";

export const dynamic = "force-dynamic";

/* Save as PDF takes the page title as the file name: "Invoice GM-2026-27-0001 - Client". */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const inv = isDatabaseConfigured() ? await getPrisma().invoice.findUnique({ where: { token }, select: { number: true, billToName: true } }).catch(() => null) : null;
  return { title: { absolute: inv ? `Invoice ${inv.number.replace(/\//g, "-")} - ${inv.billToName}` : "Invoice" }, robots: { index: false, follow: false } };
}

const GROUP_LOGO = ["genesis-events-media.png", "genesis-events-media.svg", "genesis-events-media.webp"].find((f) => existsSync(join(process.cwd(), "public", "brand", f)));
const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: Date) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);

/** Rupees in words, Indian style, as a tax invoice states the total. */
function inWords(paise: number) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? ones[n]! : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`);
  const three = (n: number) => `${n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " : ""}` : ""}${n % 100 ? two(n % 100) : ""}`;
  let r = Math.floor(paise / 100);
  const p = paise % 100;
  if (r === 0 && p === 0) return "Zero Rupees";
  const parts: string[] = [];
  for (const [size, name] of [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"]] as const) {
    if (r >= size) {
      parts.push(`${three(Math.floor(r / size))} ${name}`);
      r %= size;
    }
  }
  if (r) parts.push(three(r));
  return `${parts.join(" ")} Rupees${p ? ` and ${two(p)} Paise` : ""} Only`;
}

/**
 * THE TAX INVOICE THE CLIENT OPENS: Genesis Events and Media Group's
 * letterhead, GSTINs, place of supply, SAC per line, CGST + SGST (or IGST),
 * the total in words, and the pay link while unpaid. Prints to a clean PDF.
 */
export default async function InvoiceDocument({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ paid?: string }> }) {
  if (!isDatabaseConfigured()) notFound();
  const { token } = await params;
  const { paid } = await searchParams;
  const prisma = getPrisma();
  const inv = await prisma.invoice.findUnique({ where: { token }, include: { lines: { orderBy: { position: "asc" } } } });
  if (!inv || inv.status === "DRAFT") notFound();
  const profile = await prisma.appSetting.findUnique({ where: { key: "gst-profile" } }).then((r) => (r ? (JSON.parse(r.value) as { gstin?: string; legalName?: string }) : {}));
  const taxable = inv.subtotalPaise - inv.discountPaise;

  return (
    <div className="min-h-dvh bg-[#eef2f7] py-6 text-[#0f172a] print:bg-white print:py-0 [color-scheme:light]">
      <style>{`@media print { @page { size: A4; margin: 12mm; } .no-print { display: none !important; } }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[860px] flex-wrap items-center justify-between gap-2 px-4">
        <p className="text-[0.875rem] text-[#475569]">{inv.status === "PAID" || paid ? "Paid. Thank you!" : inv.status === "CANCELLED" ? "This invoice was cancelled." : inv.dueDate ? `Due ${day(inv.dueDate)}` : ""}</p>
        <div className="flex gap-2">
          {inv.paymentUrl && inv.status === "SENT" && !paid && <a href={inv.paymentUrl} className="rounded-full bg-[#ffc516] px-4 py-2 text-[0.875rem] font-semibold text-[#141216]">Pay {inr(inv.totalPaise)}</a>}
          <PrintButton />
        </div>
      </div>

      <article className="mx-auto max-w-[860px] overflow-hidden rounded-2xl bg-white font-sans shadow-[0_10px_40px_-20px_rgb(15_23_42/0.35)] print:max-w-none print:rounded-none print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 px-8 pb-6 pt-10 sm:px-12">
          <div className="flex flex-col items-start gap-2.5">
            {GROUP_LOGO ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/brand/${GROUP_LOGO}`} alt="Genesis Events and Media Group" className="h-9 w-auto" />
            ) : (
              <span className="text-[0.8125rem] font-bold uppercase leading-tight tracking-[0.14em]">Genesis Events<br />&amp; Media Group</span>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/genesis-wordmark-dark.png" alt="Genesis Media" className="h-[16px] w-auto" />
            <address className="mt-2 not-italic text-[0.875rem] leading-relaxed text-[#334155]">
              <strong className="text-[#0f172a]">{profile.legalName ?? COMPANY.name}</strong>
              {COMPANY.lines.map((l) => <span key={l} className="block">{l}</span>)}
              <span className="block">{COMPANY.email} · {COMPANY.phone}</span>
              {profile.gstin && <span className="block font-medium text-[#0f172a]">GSTIN: {profile.gstin}</span>}
            </address>
          </div>
          <div className="text-right">
            <h1 className="text-[1.375rem] font-bold tracking-tight">TAX INVOICE</h1>
            <dl className="mt-2 text-[0.9375rem] leading-relaxed text-[#334155]">
              <div><dt className="inline">Invoice no: </dt><dd className="inline font-medium text-[#0f172a]">{inv.number}</dd></div>
              <div><dt className="inline">Date: </dt><dd className="inline">{day(inv.issueDate)}</dd></div>
              {inv.dueDate && <div><dt className="inline">Due: </dt><dd className="inline">{day(inv.dueDate)}</dd></div>}
              <div><dt className="inline">Place of supply: </dt><dd className="inline">{inv.placeOfSupply}</dd></div>
            </dl>
          </div>
        </header>

        <section className="border-t border-[#e2e8f0] px-8 py-6 text-[0.9375rem] leading-relaxed sm:px-12">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Billed to</p>
          <p className="mt-1 font-semibold">{inv.billToName}</p>
          {inv.billToAddress && <p className="text-[#334155]">{inv.billToAddress}</p>}
          {inv.billToGstin && <p className="text-[#334155]">GSTIN: {inv.billToGstin}</p>}
          {inv.billToEmail && <p className="text-[#334155]">{inv.billToEmail}</p>}
        </section>

        <table className="w-full border-collapse text-left text-[0.9375rem]">
          <thead className="bg-[#dbe8ff] text-[#1e293b]">
            <tr>
              <th className="px-8 py-3 font-semibold sm:px-12">#</th>
              <th className="px-3 py-3 font-semibold">Description</th>
              <th className="px-3 py-3 font-semibold">SAC</th>
              <th className="px-3 py-3 text-right font-semibold">Qty</th>
              <th className="px-3 py-3 text-right font-semibold">Rate</th>
              <th className="px-8 py-3 text-right font-semibold sm:px-12">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {inv.lines.map((l, i) => (
              <tr key={l.id} className="align-top">
                <td className="px-8 py-4 sm:px-12">{i + 1}</td>
                <td className="px-3 py-4">{l.description}</td>
                <td className="px-3 py-4 text-[#64748b]">{l.sac}</td>
                <td className="px-3 py-4 text-right">{l.qty}</td>
                <td className="whitespace-nowrap px-3 py-4 text-right">{inr(l.unitPaise)}</td>
                <td className="whitespace-nowrap px-8 py-4 text-right sm:px-12">{inr(l.qty * l.unitPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="break-inside-avoid border-t border-[#e2e8f0] px-8 py-8 sm:px-12">
          <dl className="ml-auto max-w-sm space-y-2 text-[0.9375rem]">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(inv.subtotalPaise)}</dd></div>
            {inv.discountPaise > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{inr(inv.discountPaise)}</dd></div>}
            <div className="flex justify-between"><dt>Taxable value</dt><dd>{inr(taxable)}</dd></div>
            {inv.igst ? (
              <div className="flex justify-between"><dt>IGST @ 18%</dt><dd>{inr(inv.igstPaise)}</dd></div>
            ) : (
              <>
                <div className="flex justify-between"><dt>CGST @ 9%</dt><dd>{inr(inv.cgstPaise)}</dd></div>
                <div className="flex justify-between"><dt>SGST @ 9%</dt><dd>{inr(inv.sgstPaise)}</dd></div>
              </>
            )}
            <div className="flex items-center justify-between rounded-xl border border-[#dbe8ff] bg-[#f5f9ff] px-5 py-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-[1.25rem] font-bold">{inr(inv.totalPaise)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-right text-[0.8125rem] text-[#475569]">{inWords(inv.totalPaise)}</p>
        </section>

        {(inv.notes || inv.terms) && (
          <section className="space-y-4 border-t border-[#e2e8f0] px-8 py-8 text-[0.875rem] leading-relaxed text-[#334155] sm:px-12">
            {inv.notes && <p className="whitespace-pre-line">{inv.notes}</p>}
            {inv.terms && (
              <div>
                <h2 className="font-semibold text-[#1e293b]">Terms</h2>
                <p className="whitespace-pre-line">{inv.terms}</p>
              </div>
            )}
          </section>
        )}
        <footer className="border-t border-[#e2e8f0] px-8 py-6 text-[0.75rem] text-[#64748b] sm:px-12">This is a computer-generated invoice.</footer>
      </article>
    </div>
  );
}
