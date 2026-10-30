import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, Empty, PageHead, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { ORDER_STATUS, SUBSCRIPTION_STATUS, date, dateTime, money } from "@/lib/crm/catalog";
import { requirePortal } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billing & invoices" };

/** Plans, orders and every payment, with Razorpay's invoice where there is one. */
export default async function PortalBilling() {
  const { account } = await requirePortal();
  /* A vendor's work lives under My work, not client projects. */
  if (account.kind === "VENDOR") redirect("/portal/work");
  const prisma = getPrisma();
  const [subs, orders, payments] = await Promise.all([
    prisma.subscription.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" }, include: { order: { include: { lines: true } } } }),
    prisma.order.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" }, include: { lines: true } }),
    prisma.payment.findMany({ where: { accountId: account.id }, orderBy: { paidAt: "desc" }, include: { order: true } }),
  ]);
  return (
    <>
      <PageHead kicker={account.name} title="Billing & invoices" sub="Prices exclude GST unless shown. Questions about an invoice? Send a billing request.">
        <Link href="/portal/requests/new?kind=BILLING" className="crm-btn crm-btn-secondary crm-btn-sm">Billing question</Link>
      </PageHead>
      {subs.length > 0 && (
        <Card title="Plans">
          <ul className="space-y-3">
            {subs.map((s) => (
              <li key={s.id} className="rounded-xl bg-[var(--hover-wash)] px-4 py-3">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-bone">{s.order?.lines.filter((l) => l.kind === "MEMBERSHIP").map((l) => `${l.group} ${l.name}`).join(" + ") ?? "Plan"}</span>
                  <Status value={SUBSCRIPTION_STATUS[s.status]} />
                </span>
                <span className="mt-1 block text-[0.875rem] text-ash">
                  {money(s.amountPaise)} incl. GST {s.billing === "quarterly" ? "every 3 months" : "every month"} · {s.paidCount} paid · {s.currentEnd ? `paid to ${date(s.currentEnd)}` : ""} {s.nextChargeAt && s.status === "ACTIVE" ? `· next charge ${date(s.nextChargeAt)}` : ""}
                  {s.cancelRequestedAt && s.status === "ACTIVE" ? " · ends at the close of this cycle" : ""}
                </span>
                {s.status === "ACTIVE" && !s.cancelRequestedAt && (
                  <Link href="/portal/requests/new?kind=CANCELLATION" className="mt-2 inline-block text-[0.8125rem] text-ash hover:text-bone">Change or cancel this plan</Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <section className="space-y-3">
        <h2 className="font-sans font-semibold text-[1.25rem] text-bone">Orders</h2>
        {orders.length === 0 ? <Empty>No orders yet.</Empty> : (
          <Table head={["Order", "Items", "Total", "Status", "Date"]}>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="font-mono text-[0.8125rem] text-bone">{o.reference}</td>
                <td>{o.lines.map((l) => `${l.name}${l.qty > 1 ? ` ×${l.qty}` : ""}`).join(", ")}</td>
                <td className="tabular-nums">{money(o.totalPaise)}<span className="block text-[0.75rem] text-faint">incl. {money(o.taxPaise)} {o.taxLabel}</span></td>
                <td><Status value={ORDER_STATUS[o.status]} /></td>
                <td>{date(o.paidAt ?? o.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-sans font-semibold text-[1.25rem] text-bone">Payments</h2>
        {payments.length === 0 ? <Empty>No payments yet.</Empty> : (
          <Table head={["Paid", "For", "Amount", "Method", "Reference", "Invoice"]}>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{dateTime(p.paidAt)}</td>
                <td>{p.order?.reference ?? "Plan renewal"}</td>
                <td className="tabular-nums">{money(p.amountPaise)}</td>
                <td>{p.method ?? "—"}</td>
                <td className="font-mono text-[0.75rem]">{p.razorpayId}</td>
                <td>{p.invoiceUrl ? <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="crm-link">Download</a> : <span className="text-[0.8125rem] text-faint">Sent by Razorpay by email</span>}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </>
  );
}
