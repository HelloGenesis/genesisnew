import { redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Empty, Field, PageHead, Select, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, money } from "@/lib/crm/catalog";
import { requirePortal } from "@/lib/crm/session";

import { saveVendorProfile, submitVendorInvoice } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices & payouts" };

export default async function PortalInvoices() {
  const { account } = await requirePortal();
  if (account.kind !== "VENDOR") redirect("/portal");
  const prisma = getPrisma();
  const [vendor, invoices, jobs] = await Promise.all([
    prisma.account.findUniqueOrThrow({ where: { id: account.id } }),
    prisma.vendorInvoice.findMany({ where: { vendorId: account.id }, orderBy: { createdAt: "desc" }, include: { assignment: { include: { project: true } } } }),
    prisma.vendorAssignment.findMany({ where: { vendorId: account.id, status: { in: ["ACCEPTED", "SUBMITTED", "APPROVED"] } }, include: { project: true } }),
  ]);
  return (
    <>
      <PageHead kicker={account.name} title="Invoices & payouts" />
      <Card title="Submit an invoice">
        <ActionForm action={submitVendorInvoice} submit="Submit" reset>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Invoice number"><input name="number" required className="crm-input" /></Field>
            <Field label="Amount before GST (₹)"><input name="amount" required inputMode="decimal" className="crm-input" /></Field>
            <Field label="GST (₹)"><input name="tax" inputMode="decimal" className="crm-input" /></Field>
            <Field label="For"><Select name="assignmentId" options={jobs.map((j) => [j.id, `${j.role} · ${j.project.name}`] as const)} /></Field>
          </div>
          <Field label="Link to the invoice PDF"><input name="fileUrl" type="url" className="crm-input" /></Field>
          <Field label="Note"><input name="note" className="crm-input" /></Field>
        </ActionForm>
      </Card>
      {invoices.length === 0 ? <Empty>No invoices yet.</Empty> : (
        <Table head={["Invoice", "For", "Amount", "Status", "Submitted"]}>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td className="text-bone">{i.fileUrl ? <a href={i.fileUrl} target="_blank" rel="noopener noreferrer" className="crm-link">{i.number}</a> : i.number}</td>
              <td>{i.assignment ? `${i.assignment.role} · ${i.assignment.project.name}` : (i.note ?? "—")}</td>
              <td className="tabular-nums">{money(i.amountPaise + i.taxPaise)}</td>
              <td>{i.status === "PAID" ? `Paid ${date(i.paidAt)}` : i.status.toLowerCase()}</td>
              <td>{date(i.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
      <Card title="Your details">
        <ActionForm action={saveVendorProfile} submit="Save">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Skills" hint="Comma separated."><input name="skills" defaultValue={vendor.vendorSkills.join(", ")} className="crm-input" /></Field>
            <Field label="Rates"><input name="rates" defaultValue={vendor.vendorRateNote ?? ""} className="crm-input" /></Field>
            <Field label="Phone"><input name="phone" defaultValue={vendor.phone ?? ""} className="crm-input" /></Field>
            <Field label="GSTIN (if registered)"><input name="gstin" defaultValue={vendor.gstin ?? ""} className="crm-input uppercase" /></Field>
          </div>
          <Field label="How we pay you" hint="UPI ID, or bank name and the last 4 digits; finance confirms the rest with you. Only Genesis finance sees this."><input name="payout" defaultValue={vendor.payoutNote ?? ""} className="crm-input" /></Field>
        </ActionForm>
      </Card>
    </>
  );
}
