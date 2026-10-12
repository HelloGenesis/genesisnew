import Link from "next/link";

import { Empty, PageHead, Stats, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/generated/prisma/enums";
import { ORDER_STATUS, SUBSCRIPTION_STATUS, date, dateTime, money } from "@/lib/crm/catalog";
import { orderScope, through, isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billing" };

/**
 * MONEY IN. Orders from checkout and from payment links, the plans running
 * on Razorpay subscriptions (with failing renewals first), and every payment
 * Razorpay has confirmed.
 */
export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const viewer = await requireStaff("finance");
  const mine = orderScope(viewer);
  const { status } = await searchParams;
  const prisma = getPrisma();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [orders, subscriptions, payments, month, pending] = await Promise.all([
    prisma.order.findMany({ where: { ...mine, ...(status && status in ORDER_STATUS ? { status: status as OrderStatus } : {}) }, orderBy: { createdAt: "desc" }, take: 100, include: { account: true, lines: true } }),
    prisma.subscription.findMany({ where: through("order", mine), orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 100, include: { account: true, order: { include: { lines: true } } } }),
    prisma.payment.findMany({ where: through("order", mine), orderBy: { paidAt: "desc" }, take: 50, include: { account: true, order: true } }),
    prisma.payment.aggregate({ where: { ...through("order", mine), paidAt: { gte: monthStart }, status: "CAPTURED" }, _sum: { amountPaise: true }, _count: true }),
    prisma.order.aggregate({ where: { ...mine, status: "PENDING" }, _sum: { totalPaise: true }, _count: true }),
  ]);
  const active = subscriptions.filter((s) => s.status === "ACTIVE");
  const mrr = active.reduce((sum, s) => sum + (s.billing === "quarterly" ? Math.round(s.amountPaise / 3) : s.amountPaise), 0);
  const failing = subscriptions.filter((s) => s.status === "PENDING" || s.status === "HALTED");
  return (
    <>
      <PageHead kicker="Money" title="Orders & subscriptions" exportKind={isSuperAdmin(viewer) ? "orders" : undefined} />
      <Stats
        items={[
          { label: "Collected this month", value: money(month._sum.amountPaise ?? 0), hint: `${month._count} payments` },
          { label: "Recurring (monthly)", value: money(mrr), hint: `${active.length} active plans` },
          { label: "Awaiting payment", value: money(pending._sum.totalPaise ?? 0), hint: `${pending._count} checkouts & links`, href: "/admin/billing?status=PENDING" },
          { label: "Renewals failing", value: failing.length, tone: failing.length ? "bad" : undefined },
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-[1.125rem] text-bone">Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <Empty>No plans yet. A membership bought at checkout appears here when Razorpay authorises it.</Empty>
        ) : (
          <Table head={["Client", "Plan", "Charge", "Status", "Paid cycles", "Paid to", "Next charge"]}>
            {subscriptions.map((s) => (
              <tr key={s.id}>
                <td>{s.account ? <Link href={`/admin/accounts/${s.account.id}`} className="text-bone hover:underline">{s.account.name}</Link> : (s.order?.company ?? "—")}</td>
                <td>
                  {s.order ? <Link href={`/admin/billing/${s.order.id}`} className="hover:underline">{s.order.lines.filter((l) => l.kind === "MEMBERSHIP").map((l) => `${l.group} ${l.name}`).join(" + ") || s.order.reference}</Link> : s.razorpayId}
                </td>
                <td className="tabular-nums">{money(s.amountPaise)} {s.billing === "quarterly" ? "/ 3 mo" : "/ mo"}</td>
                <td><Status value={SUBSCRIPTION_STATUS[s.status]} />{s.cancelRequestedAt && s.status === "ACTIVE" ? <span className="block text-[0.75rem] text-faint">cancels at cycle end</span> : null}</td>
                <td className="tabular-nums">{s.paidCount}</td>
                <td>{date(s.currentEnd)}</td>
                <td>{date(s.nextChargeAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[1.125rem] text-bone">Orders</h2>
          <nav className="flex gap-1">
            {[["", "All"], ["PENDING", "Awaiting payment"], ["PAID", "Paid"], ["CANCELLED", "Cancelled"]].map(([value, label]) => (
              <Link key={label} href={value ? `/admin/billing?status=${value}` : "/admin/billing"} aria-current={(status ?? "") === value ? "page" : undefined} className="crm-nav-link !min-h-8">{label}</Link>
            ))}
          </nav>
        </div>
        {orders.length === 0 ? (
          <Empty>No orders.</Empty>
        ) : (
          <Table head={["Order", "Client", "Items", "Total", "Status", "Created"]}>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/billing/${o.id}`} className="font-mono text-[0.8125rem] text-bone hover:underline">{o.reference}</Link><span className="block text-[0.75rem] text-faint">{o.channel.toLowerCase()}</span></td>
                <td>{o.account ? <Link href={`/admin/accounts/${o.account.id}`} className="hover:underline">{o.account.name}</Link> : (o.company ?? o.contactName)}<span className="block text-[0.8125rem] text-ash">{o.contactEmail}</span></td>
                <td className="max-w-[22rem]">{o.lines.map((l) => `${l.name}${l.qty > 1 ? ` ×${l.qty}` : ""}`).join(", ")}</td>
                <td className="tabular-nums">{money(o.totalPaise)}</td>
                <td><Status value={ORDER_STATUS[o.status]} /></td>
                <td>{dateTime(o.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[1.125rem] text-bone">Latest payments</h2>
        {payments.length === 0 ? (
          <Empty>No payments yet.</Empty>
        ) : (
          <Table head={["Paid", "Client", "For", "Amount", "Method", "Razorpay", "Invoice"]}>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{dateTime(p.paidAt)}</td>
                <td>{p.account?.name ?? "—"}</td>
                <td>{p.order ? p.order.reference : p.subscriptionId ? "Plan renewal" : "—"}</td>
                <td className="tabular-nums">{money(p.amountPaise)}</td>
                <td>{p.method ?? "—"}</td>
                <td className="font-mono text-[0.75rem]">{p.razorpayId}</td>
                <td>{p.invoiceUrl ? <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="crm-link">Invoice</a> : p.invoiceId ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </>
  );
}
