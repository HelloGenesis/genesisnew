import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { InvoiceBuilder } from "@/components/crm/invoice-builder";
import { Card, Field, Notice, PageHead, Status } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { dateTime, money } from "@/lib/crm/catalog";
import { INVOICE_STATUS, STATES } from "@/lib/crm/invoices";
import { appUrl } from "@/lib/crm/notify";
import { invoiceScope } from "@/lib/crm/scope";
import { can, requireStaff } from "@/lib/crm/session";
import { razorpayKeys } from "@/lib/razorpay";

import { cancelInvoice, markInvoicePaidAction, sendInvoiceAction } from "../../actions/invoices";
import { invoiceAccounts } from "../data";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const viewer = await requireStaff();
  if (!can(viewer, "sales") && !can(viewer, "finance")) redirect("/admin/forbidden");
  const { id } = await params;
  const { saved } = await searchParams;
  const inv = await getPrisma().invoice.findFirst({ where: { id, ...invoiceScope(viewer) }, include: { lines: { orderBy: { position: "asc" } } } });
  if (!inv) notFound();
  const link = appUrl(`/invoice/${inv.token}`);
  const locked = inv.status === "PAID" || inv.status === "CANCELLED";
  return (
    <>
      <PageHead kicker="Invoice" title={inv.number} sub={<><Status value={INVOICE_STATUS[inv.status]} /> <span className="ml-2">{inv.billToName} · {money(inv.totalPaise)}</span></>}>
        <a href={link} target="_blank" rel="noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Open / download PDF ↗</a>
        <Link href="/admin/invoices" className="crm-btn crm-btn-secondary crm-btn-sm">All invoices</Link>
      </PageHead>
      {saved && <Notice>Saved as {inv.number}. Check it, then send.</Notice>}
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
          <p className="mt-3 break-all text-[0.8125rem] text-faint">Client link: {link}</p>
          {inv.paymentUrl && <p className="break-all text-[0.8125rem] text-faint">Pay link: {inv.paymentUrl}</p>}
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
            lines: inv.lines.map((l) => ({ description: l.description, sac: l.sac, qty: l.qty, unit: l.unitPaise / 100 })),
          }}
        />
      )}
    </>
  );
}
