import { redirect } from "next/navigation";

import { InvoiceBuilder } from "@/components/crm/invoice-builder";
import { PageHead } from "@/components/crm/ui";
import { HOME_STATE, STATES } from "@/lib/crm/invoices";
import { inDays } from "@/lib/crm/options";
import { can, requireStaff } from "@/lib/crm/session";

import { DEFAULT_TERMS, invoiceAccounts } from "../data";

export const dynamic = "force-dynamic";
export const metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const viewer = await requireStaff();
  if (!can(viewer, "sales") && !can(viewer, "finance")) redirect("/admin/forbidden");
  const today = inDays(0);
  const due = inDays(15);
  return (
    <>
      <PageHead kicker="Sales" title="New invoice" sub="Numbered when saved, GM/2026-27/0001 and on." />
      <InvoiceBuilder
        states={STATES}
        accounts={await invoiceAccounts(viewer)}
        initial={{ billToName: "", placeOfSupply: HOME_STATE, issueDate: today, dueDate: due, discount: 0, terms: DEFAULT_TERMS, paymentTermDays: 15, quotationRef: "E-Mail", poNumber: "E-Mail", lines: [{ description: "", sac: "996211", qty: 1, uom: "NOS", unit: 0 }] }}
      />
    </>
  );
}
