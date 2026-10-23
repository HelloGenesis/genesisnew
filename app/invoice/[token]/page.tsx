import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { INVOICE_TERMS, supplierFor } from "@/lib/crm/invoices";
import { isArchiveKey } from "@/lib/crm/archive-key";
import { getViewer, staffAccess } from "@/lib/crm/session";

import { PrintButton } from "../../quote/[token]/print-button";

export const dynamic = "force-dynamic";

type Search = { paid?: string; doc?: string; preview?: string; archive?: string };

/* Save as PDF takes the page title as the file name: "Invoice 110142 - Client", "Invoice 110142 - Supporting Document". */
export async function generateMetadata({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Search> }): Promise<Metadata> {
  const { token } = await params;
  const { doc } = await searchParams;
  const inv = isDatabaseConfigured() ? await getPrisma().invoice.findUnique({ where: { token }, select: { number: true, billToName: true } }).catch(() => null) : null;
  const name = !inv ? "Invoice" : doc === "supporting" ? `Invoice ${inv.number}-Supporting Document` : `Invoice-${inv.number}-${inv.billToName}`;
  return { title: { absolute: name }, robots: { index: false, follow: false } };
}

const GROUP_LOGO = ["genesis-events-media.png", "genesis-events-media.svg", "genesis-events-media.webp"].find((f) => existsSync(join(process.cwd(), "public", "brand", f)));
const inr = (paise: number) => `₹ ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const ddmmyyyy = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(d) : "");

/** Rupees in words, Indian style, as on Genesis's invoices. */
function inWords(paise: number) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? ones[n]! : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`);
  const three = (n: number) => `${n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " : ""}` : ""}${n % 100 ? two(n % 100) : ""}`;
  let r = Math.floor(paise / 100);
  const p = paise % 100;
  if (r === 0 && p === 0) return "Zero Only";
  const parts: string[] = [];
  for (const [size, name] of [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"]] as const) {
    if (r >= size) {
      parts.push(`${three(Math.floor(r / size))} ${name}`);
      r %= size;
    }
  }
  if (r) parts.push(three(r));
  return `${parts.join(" ")}${p ? ` and ${two(p)} Paise` : ""} Only`;
}

/** Genesis Events & Media Group's logo: the file when it's in /public/brand, else the wordmark with the group line. */
function Logo() {
  return GROUP_LOGO ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/brand/${GROUP_LOGO}`} alt="Genesis Events & Media Group" className="h-14 w-auto" />
  ) : (
    <div className="flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/genesis-only-dark.png" alt="Genesis" className="h-8 w-auto" />
      <span className="mt-1 text-[0.5625rem] font-bold tracking-[0.18em]">EVENTS &amp; MEDIA GROUP</span>
    </div>
  );
}

/**
 * GENESIS'S TAX INVOICE, LAID OUT AS #110141 (Genesis, 12 Oct 2026): the
 * letterhead, invoice / quotation / PO / execution details, customer and
 * supplier GST and PAN, the HSN/SAC table, the tax summary, bank details,
 * the standing terms, the total in words, and a blank space for the
 * authorised signatory to sign by hand. ?doc=supporting prints the
 * supporting document; ?doc=both prints the two together.
 */
export default async function InvoiceDocument({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Search> }) {
  if (!isDatabaseConfigured()) notFound();
  const { token } = await params;
  const { paid, doc, preview, archive } = await searchParams;
  const prisma = getPrisma();
  const inv = await prisma.invoice.findUnique({ where: { token }, include: { lines: { orderBy: { position: "asc" } }, files: { orderBy: { position: "asc" } } } });
  if (!inv) notFound();
  /* A draft is only for Genesis staff checking it before it goes. */
  /* Staff, or the Drive copy being printed (lib/crm/archive). */
  const viewer = await getViewer().catch(() => null);
  /* An agency's team previews only its own CRM's drafts (lib/crm/workspace). */
  const staff = isArchiveKey(token, archive) || (staffAccess(viewer) === "granted" && (!viewer!.workspaceId || viewer!.workspaceId === inv.workspaceId));
  if (inv.status === "DRAFT" && !(preview && staff)) notFound();
  /* Genesis's details, or the agency's when the invoice is from an agency's CRM. */
  const s = await supplierFor(inv.workspaceId);
  const taxable = inv.subtotalPaise - inv.discountPaise;
  const totalTax = inv.cgstPaise + inv.sgstPaise + inv.igstPaise;
  const rate = inv.igst ? "18.00%" : "18.00%";
  const signed = inv.files.find((f) => f.kind === "SIGNED");
  const supporting = inv.files.filter((f) => f.kind === "SUPPORTING");
  const link = inv.files.find((f) => f.kind === "LINK");
  const showInvoice = doc !== "supporting";
  const showSupporting = doc === "supporting" || doc === "both";
  const fileUrl = (id: string) => `/api/crm/invoices/file/${id}?t=${inv.token}`;
  const cell = "border border-[#111] px-2 py-1 align-top";
  /* Money never breaks between the ₹ and the amount. */
  const amount = `${cell} whitespace-nowrap text-right`;

  return (
    <div className="min-h-dvh bg-[#eef2f7] py-6 text-[#111] print:bg-white print:py-0 [color-scheme:light]">
      <style>{`@media print { @page { size: A4; margin: 10mm; } .no-print { display: none !important; } .page-break { break-before: page; } }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[900px] flex-wrap items-center justify-between gap-2 px-4">
        <p className="text-[0.875rem] text-[#475569]">{inv.status === "PAID" || paid ? "Paid. Thank you!" : inv.status === "CANCELLED" ? "This invoice was cancelled." : inv.dueDate ? `Due ${ddmmyyyy(inv.dueDate)}` : ""}</p>
        <div className="flex flex-wrap gap-2">
          {signed && <a href={fileUrl(signed.id)} className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-[0.875rem] font-medium">Signed copy</a>}
          {inv.paymentUrl && inv.status === "SENT" && !paid && <a href={inv.paymentUrl} className="rounded-full bg-[#ffc516] px-4 py-2 text-[0.875rem] font-semibold text-[#141216]">Pay {inr(inv.totalPaise)}</a>}
          <PrintButton />
        </div>
      </div>

      {showInvoice && (
        <article className="mx-auto max-w-[900px] bg-white p-6 font-[Arial,Helvetica,sans-serif] text-[11px] leading-snug shadow-[0_10px_40px_-20px_rgb(15_23_42/0.35)] print:max-w-none print:p-0 print:shadow-none">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={`${cell} w-[45%] py-4 text-center`}>
                  {s.agency ? (
                    s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={s.name} className="mx-auto h-14 w-auto" />
                    ) : (
                      <span className="text-[16px] font-bold uppercase">{s.name}</span>
                    )
                  ) : (
                    <Logo />
                  )}
                </td>
                <td className={`${cell} py-3 font-semibold`} colSpan={2}>
                  {s.address.split(s.agency ? /\n/ : /,\s*(?=Sector|New Panvel)/).map((l) => <span key={l} className="block">{l}</span>)}
                  <span className="block">Contact : {s.phone}</span>
                  <span className="block">{s.email}</span>
                  <span className="block text-[#1d4ed8] underline">{s.website}</span>
                </td>
              </tr>
              <tr><td className={`${cell} text-center text-[12px] font-bold`} colSpan={3}>TAX INVOICE</td></tr>
              <tr>
                <td className={`${cell} py-3`}>
                  <span className="block font-bold">To,</span>
                  <span className="block font-bold uppercase">{inv.billToName}</span>
                  {inv.billToAddress && <span className="block whitespace-pre-line font-bold">{inv.billToAddress}</span>}
                  <span className="mt-4 block font-bold">Customer</span>
                  {inv.billToGstin && <span className="block">GST No. {inv.billToGstin}</span>}
                  {inv.billToPan && <span className="block">PAN No. {inv.billToPan}</span>}
                </td>
                <td className={`${cell} py-3`} colSpan={2}>
                  <div className="grid grid-cols-[8rem_1fr_auto] gap-x-2 font-bold">
                    <span>Invoice</span><span>: {inv.number}</span><span>Date : {ddmmyyyy(inv.issueDate)}</span>
                    <span>Quotation No</span><span>: {inv.quotationRef ?? ""}</span><span>{inv.quotationDate ? `Date : ${ddmmyyyy(inv.quotationDate)}` : ""}</span>
                    <span>PO No</span><span>: {inv.poNumber ?? ""}</span><span>{inv.poDate ? `Date : ${ddmmyyyy(inv.poDate)}` : ""}</span>
                    <span>Date of Execution</span><span>: {ddmmyyyy(inv.executionDate)}</span><span />
                    <span>Payment Term</span><span>: {inv.paymentTermDays} Days</span><span />
                    <span>Ref</span><span>: {inv.reference ?? ""}</span><span />
                  </div>
                  <span className="mt-4 block font-bold">Supplier&apos;s</span>
                  <span className="block">GST No. : {s.gstin}</span>
                  <span className="block">PAN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {s.pan}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[9px] font-bold">
                <th className={`${cell} text-[#1d4ed8]`}>Sr.No</th>
                <th className={cell}>ITEM DESCRIPTION</th>
                <th className={cell}>HSN/SAC</th>
                <th className={cell}>QTY</th>
                <th className={cell}>Unit</th>
                <th className={cell}>UNIT PRICE</th>
                <th className={cell}>TAXABLE VALUE</th>
                <th className={cell}>GST RATE</th>
                <th className={cell}>TAX AMOUNT</th>
                <th className={cell}>TOTAL VALUE</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, i) => {
                const value = l.qty * l.unitPaise;
                const share = inv.subtotalPaise ? Math.round((value * taxable) / inv.subtotalPaise) : value;
                const tax = Math.round((share * 18) / 100);
                return (
                  <tr key={l.id} className="h-8">
                    <td className={`${cell} text-right`}>{i + 1}</td>
                    <td className={cell}>{i === 0 && <span className="mb-2 block font-bold">{l.description}</span>}{l.description}</td>
                    <td className={`${cell} text-center`}>{l.sac}</td>
                    <td className={`${cell} text-center`}>{l.qty}</td>
                    <td className={`${cell} text-center`}>{l.unit}</td>
                    <td className={amount}>{inr(l.unitPaise)}</td>
                    <td className={amount}>{inr(share)}</td>
                    <td className={cell}>{rate}</td>
                    <td className={amount}>{inr(tax)}</td>
                    <td className={amount}>{inr(share + tax)}</td>
                  </tr>
                );
              })}
              <tr className="h-48"><td className={cell} /><td className={cell} /><td className={cell} /><td className={cell} /><td className={cell} /><td className={cell} /><td className={cell} /><td className={cell} /><td className={cell} /><td className={cell} /></tr>
              <tr className="font-bold">
                <td className={cell} colSpan={2} rowSpan={9}>
                  <div className="space-y-2 pt-8 font-normal">{INVOICE_TERMS.map((t) => <p key={t} className="text-[9px]">{t}</p>)}</div>
                </td>
                <td className={cell}>TOTAL</td>
                <td className={`${cell} text-right`}>{inv.lines.reduce((n, l) => n + l.qty, 0)}</td>
                <td className={cell} />
                <td className={amount}>{inr(inv.subtotalPaise)}</td>
                <td className={amount}>{inr(taxable)}</td>
                <td className={cell} />
                <td className={amount}>{inr(totalTax)}</td>
                <td className={amount}>{inr(inv.totalPaise)}</td>
              </tr>
              {[
                ["PAYEE NAME", s.payee, "ASSESABLE VALUE", inr(taxable)],
                ["BANK NAME.", s.bank, "CGST", inv.cgstPaise ? inr(inv.cgstPaise) : "0"],
                ["BANK ACCOUNT NO.", s.account, "SGST", inv.sgstPaise ? inr(inv.sgstPaise) : "0"],
                ["MODE OF PAYMENT", s.mode, "IGST", inv.igstPaise ? inr(inv.igstPaise) : "0"],
                ["BANK BRANCH CODE", s.ifsc, "CESS", "0"],
                ["", "", "TOTAL TAX", inr(totalTax)],
                ["", "", "OTHER CHARGS/TCS", "0"],
                ["", "", "ROUND OFF", "0"],
              ].map(([k1, v1, k2, v2]) => (
                <tr key={k2}>
                  <td className={`${cell} border-r-0 text-[9px] font-bold`} colSpan={2}>{k1}</td>
                  <td className={`${cell} border-l-0 text-[9px]`} colSpan={3}>{k1 ? `: ${v1}` : ""}</td>
                  <td className={`${cell} font-bold`} colSpan={2}>{k2}</td>
                  <td className={`${cell} text-right font-bold`}>{v2}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className={cell} colSpan={7}>TOTAL INVOICE VALUE IN INR (WORDS) : {inWords(inv.totalPaise)}</td>
                <td className={cell} colSpan={2}>TOTAL INVOICE VALUE INR</td>
                <td className={amount}>{inr(inv.totalPaise)}</td>
              </tr>
              <tr>
                <td className={`${cell} h-36 text-center`} colSpan={10}>
                  {/* Left blank to sign by hand (Genesis, 12 Oct 2026); the signed copy is uploaded back to the CRM. */}
                  <div className="ml-auto mr-24 w-56 pt-2 text-center">
                    <p className="font-bold text-[#1d4ed8]">For {s.name}</p>
                    <div className="h-20" />
                    <p className="font-bold text-[#1d4ed8]">Authorised Signatory</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          {inv.notes && <p className="mt-2 whitespace-pre-line text-[10px]">{inv.notes}</p>}
          {inv.terms && <p className="mt-1 whitespace-pre-line text-[10px]">{inv.terms}</p>}
        </article>
      )}

      {showSupporting && (
        <article className={`${showInvoice ? "page-break mt-6" : ""} mx-auto max-w-[900px] bg-white px-12 py-16 font-[Arial,Helvetica,sans-serif] shadow-[0_10px_40px_-20px_rgb(15_23_42/0.35)] print:max-w-none print:p-0 print:shadow-none`}>
          <h1 className="text-center text-[26px] font-bold underline">Invoice {inv.number} - Supporting Document</h1>
          {link && (
            <p className="mt-2 text-center text-[18px] font-bold underline">
              Link: <a href={link.driveId} className="rounded bg-[#f1f5f9] px-1.5">{link.name}</a>
            </p>
          )}
          <div className="mt-16 space-y-10">
            {supporting.length === 0 && <p className="no-print text-center text-[#64748b]">No screenshots added yet.</p>}
            {supporting.map((f) =>
              f.mimeType.startsWith("image/") ? (
                <figure key={f.id} className="break-inside-avoid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fileUrl(f.id)} alt={f.caption ?? f.name} className="mx-auto max-h-[70vh] w-auto max-w-full" />
                  {f.caption && <figcaption className="mt-2 text-center text-[13px] text-[#475569]">{f.caption}</figcaption>}
                </figure>
              ) : (
                <p key={f.id} className="text-center"><a href={fileUrl(f.id)} className="underline">{f.name}</a></p>
              ),
            )}
          </div>
        </article>
      )}
    </div>
  );
}
