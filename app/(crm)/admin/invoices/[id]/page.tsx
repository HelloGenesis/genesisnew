import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { InvoiceBuilder } from "@/components/crm/invoice-builder";
import { InvoiceUpload } from "@/components/crm/invoice-upload";
import { Card, Field, Notice, PageHead, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { dateTime, money } from "@/lib/crm/catalog";
import { INVOICE_STATUS, STATES } from "@/lib/crm/invoices";
import { appUrl } from "@/lib/crm/notify";
import { invoiceAccess } from "@/lib/crm/scope";
import { can, requireStaff } from "@/lib/crm/session";
import { razorpayKeys } from "@/lib/razorpay";

import { cancelInvoice, markInvoicePaidAction, removeInvoiceFile, sendInvoiceAction, setSupportingLink } from "../../actions/invoices";
import { invoiceAccounts } from "../data";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const viewer = await requireStaff();
  if (!can(viewer, "sales") && !can(viewer, "finance")) redirect("/admin/forbidden");
  const { id } = await params;
  const { saved } = await searchParams;
  /* Its maker, super admins, or the person named to sign it. */
  const inv = await getPrisma().invoice.findFirst({ where: { id, ...invoiceAccess(viewer) }, include: { lines: { orderBy: { position: "asc" } }, files: { orderBy: [{ kind: "asc" }, { position: "asc" }] } } });
  if (!inv) notFound();
  const supporting = inv.files.filter((f) => f.kind === "SUPPORTING");
  const signed = inv.files.find((f) => f.kind === "SIGNED");
  const link = inv.files.find((f) => f.kind === "LINK");
  const people = await getPrisma().user.findMany({ where: { id: { in: [inv.signatoryId, inv.signedById].filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true, email: true } });
  const nameOf = (uid: string | null) => people.find((p) => p.id === uid)?.name ?? people.find((p) => p.id === uid)?.email ?? "—";
  const clientLink = appUrl(`/invoice/${inv.token}`);
  const locked = inv.status === "PAID" || inv.status === "CANCELLED";
  return (
    <>
      <PageHead kicker="Invoice" title={inv.number} sub={<><Status value={INVOICE_STATUS[inv.status]} /> <span className="ml-2">{inv.billToName} · {money(inv.totalPaise)}</span></>}>
        <a href={`/invoice/${inv.token}?preview=1`} target="_blank" rel="noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Invoice PDF ↗</a>
        <a href={`/invoice/${inv.token}?preview=1&doc=supporting`} target="_blank" rel="noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Supporting doc ↗</a>
        <a href={`/invoice/${inv.token}?preview=1&doc=both`} target="_blank" rel="noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Both together ↗</a>
        <Link href="/admin/invoices" className="crm-btn crm-btn-secondary crm-btn-sm">All invoices</Link>
      </PageHead>
      {saved && <Notice>Saved as {inv.number}. Check it, then send.</Notice>}
      {/* What prints under "To," (Genesis, 22 Oct 2026): name, address, then the customer's GST No. and PAN No. */}
      {inv.status === "DRAFT" && (!inv.billToAddress || !inv.billToGstin) && (
        <Notice warn>
          Add the client&apos;s {[!inv.billToAddress && "billing address", !inv.billToGstin && "GSTIN (the PAN fills from it)"].filter(Boolean).join(" and ")} under <b>Billed to</b> below: they print under &ldquo;To,&rdquo; on the invoice. Saved once, they fill in for this client next time.
        </Notice>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title={inv.status === "DRAFT" ? "Send to the client" : "Send again"}>
          {inv.status === "CANCELLED" ? (
            <p className="text-ash">Cancelled.</p>
          ) : (
            <ActionForm action={sendInvoiceAction} submit={inv.status === "DRAFT" ? "Send invoice email" : "Re-send"} confirm={`Email ${inv.number} to ${inv.billToEmail ?? "the client"}?`}>
              <input type="hidden" name="id" value={inv.id} />
              <Field label="Message"><textarea name="message" className="crm-input !min-h-20" defaultValue="Please find our tax invoice below. Thank you for working with Genesis." /></Field>
              {inv.status !== "PAID" && (
                <label className="flex items-center gap-2 text-[0.875rem] text-ash">
                  <input type="checkbox" name="payment" defaultChecked={Boolean(razorpayKeys())} disabled={!razorpayKeys()} /> Include a Razorpay pay link for {money(inv.totalPaise)}
                </label>
              )}
            </ActionForm>
          )}
          <p className="mt-3 break-all text-[0.8125rem] text-faint">Client link: {clientLink}</p>
          {inv.paymentUrl && <p className="break-all text-[0.8125rem] text-faint">Pay link: {inv.paymentUrl}</p>}
        </Card>
        <Card title="Signature">
          {signed ? (
            <p className="text-[0.9375rem] text-bone">Signed by {nameOf(inv.signedById)} · {dateTime(inv.signedAt)} · <a className="crm-link" href={`/api/crm/invoices/file/${signed.id}`} target="_blank" rel="noreferrer">signed copy ↗</a></p>
          ) : (
            <p className="text-[0.9375rem] text-ash">Waiting for {nameOf(inv.signatoryId)} to sign. Download the invoice, sign it by hand, then upload the signed copy here; finance is told at once.</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <InvoiceUpload invoiceId={inv.id} kind="SIGNED" label={signed ? "Replace signed copy" : "Upload signed copy"} />
            {signed && <form action={removeInvoiceFile}><input type="hidden" name="fileId" value={signed.id} /><button className="text-[0.8125rem] text-faint hover:text-[#dc2626]">Remove</button></form>}
          </div>
        </Card>
        <Card title="Supporting document">
          <form action={setSupportingLink} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={inv.id} />
            <Field label="Link label"><input name="label" defaultValue={link?.name ?? ""} className="crm-input" placeholder="ABHI | AI Army Trend" /></Field>
            <Field label="Link (Drive folder, live post)" className="min-w-[14rem] flex-1"><input name="url" type="url" defaultValue={link?.driveId ?? ""} className="crm-input" /></Field>
            <button className="crm-btn crm-btn-secondary crm-btn-sm">Save</button>
          </form>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {supporting.map((f) => (
              <figure key={f.id} className="relative overflow-hidden rounded-xl border border-[var(--glass-border)]">
                {f.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/crm/invoices/file/${f.id}`} alt={f.name} className="aspect-video w-full object-cover" />
                ) : (
                  <a href={`/api/crm/invoices/file/${f.id}`} target="_blank" rel="noreferrer" className="grid aspect-video place-items-center text-[0.8125rem] text-ash">{f.name}</a>
                )}
                <form action={removeInvoiceFile} className="absolute right-1 top-1"><input type="hidden" name="fileId" value={f.id} /><button aria-label="Remove" className="rounded-full bg-black/60 px-2 text-white">×</button></form>
              </figure>
            ))}
          </div>
          <div className="mt-3"><InvoiceUpload invoiceId={inv.id} kind="SUPPORTING" label="Add screenshots" /></div>
        </Card>
        <Card title="History">
          <ul className="space-y-1.5 text-[0.9375rem]">
            <li className="text-ash">Created {dateTime(inv.createdAt)}</li>
            {inv.sentAt && <li className="text-bone">Sent {dateTime(inv.sentAt)}</li>}
            {inv.paidAt && <li className="text-bone">Paid {dateTime(inv.paidAt)}</li>}
            {inv.quoteId && <li><Link className="crm-link" href={`/admin/quotes/${inv.quoteId}`}>The quote it bills</Link></li>}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
              <form action={markInvoicePaidAction}><input type="hidden" name="id" value={inv.id} /><button className="crm-btn crm-btn-secondary crm-btn-sm">Mark paid (bank transfer)</button></form>
            )}
            {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
              <form action={cancelInvoice}><input type="hidden" name="id" value={inv.id} /><button className="crm-btn crm-btn-secondary crm-btn-sm">Cancel invoice</button></form>
            )}
          </div>
        </Card>
      </div>
      {locked ? (
        <Notice>{inv.status === "PAID" ? "Paid invoices can't be edited. Issue a credit note or a new invoice." : "Cancelled."}</Notice>
      ) : (
        <InvoiceBuilder
          states={STATES}
          accounts={await invoiceAccounts(viewer)}
          initial={{
            id: inv.id,
            accountId: inv.accountId,
            quoteId: inv.quoteId,
            billToName: inv.billToName,
            billToEmail: inv.billToEmail,
            billToGstin: inv.billToGstin,
            billToAddress: inv.billToAddress,
            placeOfSupply: inv.placeOfSupply,
            issueDate: inv.issueDate.toISOString().slice(0, 10),
            dueDate: inv.dueDate?.toISOString().slice(0, 10) ?? "",
            discount: inv.discountPaise / 100,
            notes: inv.notes,
            terms: inv.terms,
            quotationRef: inv.quotationRef,
            quotationDate: inv.quotationDate?.toISOString().slice(0, 10) ?? "",
            poNumber: inv.poNumber,
            poDate: inv.poDate?.toISOString().slice(0, 10) ?? "",
            executionDate: inv.executionDate?.toISOString().slice(0, 10) ?? "",
            paymentTermDays: inv.paymentTermDays,
            reference: inv.reference,
            billToPan: inv.billToPan,
            lines: inv.lines.map((l) => ({ description: l.description, sac: l.sac, qty: l.qty, uom: l.unit, unit: l.unitPaise / 100 })),
          }}
        />
      )}
    </>
  );
}
