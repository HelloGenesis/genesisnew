import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, ORDER_STATUS, PROJECT_STATUS, SUBSCRIPTION_STATUS, date, dateTime, money, projectRef } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";

import { cancelOrder, cancelSubscription, markOrderPaid } from "../../actions/finance";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("finance");
  const { id } = await params;
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: { lines: true, account: true, partner: true, subscription: true, payments: { orderBy: { paidAt: "desc" } }, projects: true, commissions: true },
  });
  if (!order) notFound();
  const sub = order.subscription;
  return (
    <>
      <PageHead kicker={`Order · ${order.channel.toLowerCase()}`} title={order.reference} sub={`${order.company ?? order.contactName} · ${dateTime(order.createdAt)}`}>
        <Status value={ORDER_STATUS[order.status]} />
        {order.account && <Link href={`/admin/accounts/${order.account.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">{order.account.name}</Link>}
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Table head={["Item", "Division", "Type", "Qty", "Charge", "Extras"]}>
            {order.lines.map((l) => (
              <tr key={l.id}>
                <td className="text-bone">{l.group} · {l.name}{l.extraLabels.length ? <span className="block text-[0.8125rem] text-ash">{l.extraLabels.join(", ")}</span> : null}</td>
                <td>{DIVISION_LABEL[l.division]}</td>
                <td>{l.kind === "MEMBERSHIP" ? "Plan" : l.kind === "QUOTED" ? "Quote requested" : "One-time"}</td>
                <td className="tabular-nums">{l.qty}</td>
                <td className="tabular-nums">{money(l.chargePaise)}</td>
                <td className="tabular-nums">{l.extrasPaise ? money(l.extrasPaise) : "—"}</td>
              </tr>
            ))}
          </Table>
          <Card title="Totals">
            <dl className="grid max-w-md grid-cols-[1fr_auto] gap-y-1.5 text-[0.9375rem]">
              <dt className="text-ash">Subtotal</dt><dd className="tabular-nums">{money(order.subtotalPaise)}</dd>
              {order.discountPaise > 0 && (<><dt className="text-ash">Bundle saving</dt><dd className="tabular-nums">−{money(order.discountPaise)}</dd></>)}
              {order.comboDiscountPaise > 0 && (<><dt className="text-ash">AI + Studios combo</dt><dd className="tabular-nums">−{money(order.comboDiscountPaise)}</dd></>)}
              <dt className="text-ash">{order.taxLabel}</dt><dd className="tabular-nums">{money(order.taxPaise)}</dd>
              <dt className="font-semibold text-bone">Total</dt><dd className="font-semibold tabular-nums text-bone">{money(order.totalPaise)}</dd>
              {order.recurringPaise > 0 && (<><dt className="text-ash">Recurring, {order.billing}</dt><dd className="tabular-nums">{money(order.recurringPaise)}</dd></>)}
            </dl>
          </Card>
          {order.projects.length > 0 && (
            <Card title="Projects opened">
              <ul className="divide-y divide-[var(--glass-border)]">
                {order.projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/projects/${p.id}`} className="text-bone hover:underline">{projectRef(p.number)} · {p.name}</Link>
                    <Status value={PROJECT_STATUS[p.status]} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Payments">
            {order.payments.length === 0 ? (
              <p className="text-ash">None yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2 text-[0.9375rem]">
                    <span>{dateTime(p.paidAt)} · {money(p.amountPaise)} · {p.method ?? "—"}</span>
                    <span className="font-mono text-[0.75rem] text-ash">{p.razorpayId}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Buyer">
            <dl className="space-y-2 text-[0.9375rem]">
              <div><dt className="text-[0.75rem] text-faint">Contact</dt><dd className="text-bone">{order.contactName} · {order.contactEmail}{order.contactPhone ? ` · ${order.contactPhone}` : ""}</dd></div>
              <div><dt className="text-[0.75rem] text-faint">Company</dt><dd>{order.company ?? "—"}{order.taxId ? ` · ${order.taxId}` : ""}</dd></div>
              <div><dt className="text-[0.75rem] text-faint">Billing address</dt><dd>{order.billingAddress ?? "—"}</dd></div>
              {order.notes && <div><dt className="text-[0.75rem] text-faint">Notes</dt><dd className="whitespace-pre-wrap">{order.notes}</dd></div>}
              {order.partner && <div><dt className="text-[0.75rem] text-faint">Partner</dt><dd>{order.partner.name}</dd></div>}
              {order.consent && <div><dt className="text-[0.75rem] text-faint">Consent</dt><dd className="text-[0.8125rem] text-ash">{order.consent}</dd></div>}
              <div><dt className="text-[0.75rem] text-faint">Razorpay</dt><dd className="font-mono text-[0.75rem]">{[order.razorpayLinkId, order.razorpaySubscriptionId, order.razorpayPaymentId].filter(Boolean).join(" · ") || "—"}</dd></div>
            </dl>
          </Card>
          {sub && (
            <Card title="Subscription">
              <p className="flex items-center justify-between gap-2"><span>{money(sub.amountPaise)} {sub.billing === "quarterly" ? "every 3 months" : "a month"}</span><Status value={SUBSCRIPTION_STATUS[sub.status]} /></p>
              <p className="mt-1 text-[0.875rem] text-ash">{sub.paidCount} paid cycle{sub.paidCount === 1 ? "" : "s"} · paid to {date(sub.currentEnd)} · next charge {date(sub.nextChargeAt)}</p>
              {sub.status !== "CANCELLED" && sub.status !== "COMPLETED" && (
                <ActionForm action={cancelSubscription} submit="Cancel subscription" tone="danger" confirm="Cancel this subscription on Razorpay?" className="mt-4">
                  <input type="hidden" name="id" value={sub.id} />
                  <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="radio" name="when" value="end" defaultChecked /> At the end of the paid cycle</label>
                  <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="radio" name="when" value="now" /> Immediately</label>
                </ActionForm>
              )}
            </Card>
          )}
          {order.status === "PENDING" && (
            <Card title="Paid another way?">
              <ActionForm action={markOrderPaid} submit="Mark paid & open projects" confirm="Mark this order paid?">
                <input type="hidden" name="id" value={order.id} />
                <Field label="Bank / UTR reference"><input name="paymentRef" required className="crm-input" /></Field>
              </ActionForm>
              <form action={cancelOrder} className="mt-3">
                <input type="hidden" name="id" value={order.id} />
                <button className="text-[0.8125rem] text-[#dc2626] hover:underline">Cancel this order</button>
              </form>
            </Card>
          )}
          {order.commissions.length > 0 && (
            <Card title="Commission">
              {order.commissions.map((c) => <p key={c.id}>{money(c.amountPaise)} ({c.percent}%) · {c.status.toLowerCase()}</p>)}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
