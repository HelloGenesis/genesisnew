import Link from "next/link";

import { Empty, PageHead, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/crm/scope";
import { date, money } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";

import { setCommissionStatus, setVendorInvoiceStatus } from "../actions/finance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commissions & payouts" };

function Step({ action, id, status, label }: { action: (form: FormData) => Promise<void>; id: string; status: string; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="text-[0.8125rem] text-ash hover:text-bone">{label}</button>
    </form>
  );
}

/** Money out: resellers' commission on the clients they referred, and vendors' invoices. */
export default async function PayoutsPage() {
  const viewer = await requireStaff("finance");
  const prisma = getPrisma();
  const [commissions, invoices] = await Promise.all([
    prisma.commission.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, include: { partner: true, order: true } }),
    prisma.vendorInvoice.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, include: { vendor: true, assignment: { include: { project: true } } } }),
  ]);
  const owed = commissions.filter((c) => c.status === "DUE" || c.status === "APPROVED").reduce((s, c) => s + c.amountPaise, 0);
  const bills = invoices.filter((i) => i.status === "SUBMITTED" || i.status === "APPROVED").reduce((s, i) => s + i.amountPaise + i.taxPaise, 0);
  return (
    <>
      <PageHead kicker="Money" title="Commissions & payouts" exportKind={isSuperAdmin(viewer) ? "payouts" : undefined} />
      <Stats items={[{ label: "Commission owed", value: money(owed) }, { label: "Vendor invoices to pay", value: money(bills), tone: bills ? "warn" : undefined }]} />
      <section className="space-y-3">
        <h2 className="font-sans font-semibold text-[1.25rem] text-bone">Reseller commission</h2>
        {commissions.length === 0 ? (
          <Empty>No commission yet. It accrues automatically when a referred client pays.</Empty>
        ) : (
          <Table head={["Partner", "Order", "On", "Commission", "Status", ""]}>
            {commissions.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/accounts/${c.partnerId}`} className="text-bone hover:underline">{c.partner.name}</Link><span className="block text-[0.75rem] text-faint">{date(c.createdAt)}</span></td>
                <td>{c.order ? <Link href={`/admin/billing/${c.order.id}`} className="hover:underline">{c.order.reference}</Link> : "Renewal"}</td>
                <td className="tabular-nums">{money(c.basePaise)} × {c.percent}%</td>
                <td className="tabular-nums">{money(c.amountPaise)}</td>
                <td>{c.status.toLowerCase()}{c.paidAt ? ` · ${date(c.paidAt)}` : ""}</td>
                <td className="flex gap-3">
                  {c.status === "DUE" && <Step action={setCommissionStatus} id={c.id} status="APPROVED" label="Approve" />}
                  {(c.status === "DUE" || c.status === "APPROVED") && <Step action={setCommissionStatus} id={c.id} status="PAID" label="Mark paid" />}
                  {c.status !== "VOID" && c.status !== "PAID" && <Step action={setCommissionStatus} id={c.id} status="VOID" label="Void" />}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-sans font-semibold text-[1.25rem] text-bone">Vendor invoices</h2>
        {invoices.length === 0 ? (
          <Empty>No invoices. Vendors submit them from their portal.</Empty>
        ) : (
          <Table head={["Vendor", "Invoice", "For", "Amount", "Status", ""]}>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td><Link href={`/admin/accounts/${i.vendorId}`} className="text-bone hover:underline">{i.vendor.name}</Link><span className="block text-[0.75rem] text-faint">{date(i.createdAt)}</span></td>
                <td>{i.fileUrl ? <a href={i.fileUrl} target="_blank" rel="noopener noreferrer" className="crm-link">{i.number}</a> : i.number}</td>
                <td>{i.assignment ? `${i.assignment.role} · ${i.assignment.project.name}` : (i.note ?? "—")}</td>
                <td className="tabular-nums">{money(i.amountPaise)}{i.taxPaise ? ` + ${money(i.taxPaise)} GST` : ""}</td>
                <td>{i.status.toLowerCase()}{i.paidAt ? ` · ${date(i.paidAt)}` : ""}</td>
                <td className="flex gap-3">
                  {i.status === "SUBMITTED" && <Step action={setVendorInvoiceStatus} id={i.id} status="APPROVED" label="Approve" />}
                  {(i.status === "SUBMITTED" || i.status === "APPROVED") && <Step action={setVendorInvoiceStatus} id={i.id} status="PAID" label="Mark paid" />}
                  {i.status === "SUBMITTED" && <Step action={setVendorInvoiceStatus} id={i.id} status="REJECTED" label="Reject" />}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </>
  );
}
