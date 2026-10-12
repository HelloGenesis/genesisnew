import Link from "next/link";
import { redirect } from "next/navigation";

import { Empty, PageHead, Stats, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { InvoiceStatus } from "@/lib/generated/prisma/enums";
import { date, money } from "@/lib/crm/catalog";
import { INVOICE_STATUS } from "@/lib/crm/invoices";
import { quoteRef } from "@/lib/crm/quote-templates";
import { invoiceScope, quoteScope } from "@/lib/crm/scope";
import { can, requireStaff } from "@/lib/crm/session";

import { invoiceFromQuote } from "../actions/invoices";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

/** GST tax invoices: yours (super admins: everyone's), what's outstanding, and one from any accepted quote. */
export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const viewer = await requireStaff();
  if (!can(viewer, "sales") && !can(viewer, "finance")) redirect("/admin/forbidden");
  const { status } = await searchParams;
  const prisma = getPrisma();
  const scope = invoiceScope(viewer);
  const [invoices, outstanding, paidMonth, quotes] = await Promise.all([
    prisma.invoice.findMany({ where: { ...scope, ...(status && status in INVOICE_STATUS ? { status: status as InvoiceStatus } : {}) }, orderBy: [{ issueDate: "desc" }, { seq: "desc" }], take: 300 }),
    prisma.invoice.aggregate({ where: { ...scope, status: "SENT" }, _sum: { totalPaise: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...scope, status: "PAID", paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { totalPaise: true }, _count: true }),
    prisma.quote.findMany({ where: { ...quoteScope(viewer), status: { in: ["ACCEPTED", "PAID", "SENT", "VIEWED"] } }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, number: true, title: true, company: true, contactName: true, totalPaise: true, status: true } }),
  ]);
  const overdue = invoices.filter((i) => i.status === "SENT" && i.dueDate && i.dueDate < new Date());
  return (
    <>
      <PageHead kicker="Sales" title="Invoices" sub="GST tax invoices: CGST + SGST within Maharashtra, IGST outside">
        <Link href="/admin/invoices/new" className="crm-btn crm-btn-primary crm-btn-sm">New invoice</Link>
      </PageHead>
      <Stats
        items={[
          { label: "Outstanding", value: money(outstanding._sum.totalPaise ?? 0), hint: `${outstanding._count} sent, unpaid`, href: "/admin/invoices?status=SENT" },
          { label: "Overdue", value: overdue.length, tone: overdue.length ? "bad" : undefined },
          { label: "Paid this month", value: money(paidMonth._sum.totalPaise ?? 0), hint: `${paidMonth._count} invoices` },
          { label: "Drafts", value: invoices.filter((i) => i.status === "DRAFT").length, href: "/admin/invoices?status=DRAFT" },
        ]}
      />
      {quotes.length > 0 && (
        <form action={invoiceFromQuote} className="crm-card crm-pad flex flex-wrap items-end gap-2">
          <label className="min-w-[18rem] flex-1">
            <span className="crm-label">Invoice a quote</span>
            <select name="quoteId" required className="crm-input">
              {quotes.map((q) => <option key={q.id} value={q.id}>{quoteRef(q.number)} · {q.company ?? q.contactName} · {q.title} · {money(q.totalPaise)}</option>)}
            </select>
          </label>
          <button className="crm-btn crm-btn-secondary crm-btn-sm">Make the invoice</button>
        </form>
      )}
      {invoices.length === 0 ? (
        <Empty>No invoices yet. Make one from a quote above, or start a new one.</Empty>
      ) : (
        <Table head={["Invoice", "Billed to", "Date", "Due", "Total", "Status"]}>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td><Link href={`/admin/invoices/${i.id}`} className="text-bone hover:underline">{i.number}</Link></td>
              <td>{i.billToName}{i.billToGstin && <span className="block text-[0.75rem] text-faint">{i.billToGstin}</span>}</td>
              <td>{date(i.issueDate)}</td>
              <td className={i.status === "SENT" && i.dueDate && i.dueDate < new Date() ? "font-semibold text-[#dc2626]" : ""}>{date(i.dueDate)}</td>
              <td className="tabular-nums">{money(i.totalPaise)}</td>
              <td><Status value={INVOICE_STATUS[i.status]} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
