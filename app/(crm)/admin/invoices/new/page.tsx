import { redirect } from "next/navigation";

import { InvoiceBuilder } from "@/components/crm/invoice-builder";
import { PageHead } from "@/components/crm/ui";
import { money } from "@/lib/crm/catalog";
import { quoteRef } from "@/lib/crm/quote-templates";
import { quoteScope } from "@/lib/crm/scope";
import { getPrisma } from "@/lib/db";
import { HOME_STATE, STATES } from "@/lib/crm/invoices";
import { inDays } from "@/lib/crm/options";
import { can, requireStaff } from "@/lib/crm/session";

import { invoiceFromQuote } from "../../actions/invoices";
import { DEFAULT_TERMS, invoiceAccounts } from "../data";

export const dynamic = "force-dynamic";
export const metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const viewer = await requireStaff();
  const { account } = await searchParams;
  if (!can(viewer, "sales") && !can(viewer, "finance")) redirect("/admin/forbidden");
  const today = inDays(0);
  const due = inDays(15);
  const accounts = await invoiceAccounts(viewer);
  const client = account ? accounts.find((a) => a.id === account) : undefined;
  const quotes = await getPrisma().quote.findMany({ where: { ...quoteScope(viewer), status: { notIn: ["DECLINED", "EXPIRED"] } }, orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, number: true, title: true, company: true, contactName: true, totalPaise: true } });
  return (
    <>
      <PageHead kicker="Sales" title="New invoice" sub="Numbered when saved, GM/2026-27/0001 and on." />
      {/*
        FROM A QUOTE, OR FROM SCRATCH (Genesis, 22 Oct 2026). A quote isn't
        required (retainers, extra work and reimbursements have none), but when
        there is one, its client, billing details, lines, creator fees,
        discount and quotation number fill the invoice in one go.
      */}
      {quotes.length > 0 && (
        <form action={invoiceFromQuote} className="crm-card crm-pad flex flex-wrap items-end gap-3">
          <label className="min-w-[18rem] flex-1">
            <span className="crm-label">Fill from a quote</span>
            <select name="quoteId" required className="crm-input">
              {quotes.map((q) => <option key={q.id} value={q.id}>{quoteRef(q.number)} · {q.company || q.contactName || "No client yet"} · {q.title} · {money(q.totalPaise)}</option>)}
            </select>
          </label>
          <button className="crm-btn crm-btn-primary">Fill the invoice from this quote</button>
          <p className="w-full text-[0.875rem] text-ash">Or fill it in below for work without a quote.</p>
        </form>
      )}
      {/* From a project's Billing (Genesis, 31 Oct 2026): ?account= fills the client in. */}
      <InvoiceBuilder
        states={STATES}
        accounts={accounts}
        initial={{ ...(client ? { accountId: client.id, billToName: client.legalName ?? client.name, billToEmail: client.email ?? undefined, billToGstin: client.gstin ?? undefined, billToAddress: client.address ?? undefined } : { billToName: "" }), placeOfSupply: client?.state ?? HOME_STATE, issueDate: today, dueDate: due, discount: 0, terms: DEFAULT_TERMS, paymentTermDays: 15, quotationRef: "E-Mail", poNumber: "E-Mail", lines: [{ description: "", sac: "996211", qty: 1, uom: "NOS", unit: 0 }] }}
      />
    </>
  );
}
