import "server-only";

import type { priceCart } from "@/lib/cart";
import { findProduct } from "@/lib/cart";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import { products } from "@/lib/products";

import { divisionOf, money, quotaFrom } from "./catalog";
import { markInvoicePaid } from "./invoices";
import { accountEmails, appUrl, queueEmail, queueStaffEmail } from "./notify";
import { openProject } from "./projects";
import { openFor } from "./quotes";
import { queueSheet } from "./sheets";

/**
 * ORDERS, FROM CHECKOUT TO A CLIENT WITH PROJECTS.
 *
 *   1. /api/checkout prices the cart (lib/cart) and starts a Razorpay payment
 *      link or subscription; `recordCheckout` keeps it as a PENDING order with
 *      its lines, and as a lead — an unpaid checkout is the warmest lead there is.
 *   2. Razorpay's webhook says it was paid; `applyRazorpayEvent` (idempotent per
 *      event id) marks it PAID and `fulfil` turns it into work: the client's
 *      account (found by email, or created from the checkout's business
 *      details), portal access for the buyer, one project per product, the
 *      payment, a reseller's commission, the lead closed as won, and an email
 *      telling the client exactly what Genesis needs from them to start —
 *      each product's own requirements from lib/products.
 *   3. Every renewal adds that month's project for each plan; a failing or
 *      halted renewal alerts finance and producers (pause the queue, as Genesis
 *      decided on 29 Sep 2026) and tells the client.
 *
 * Nothing here can break checkout or the webhook's reply: callers wrap it.
 */

type Priced = ReturnType<typeof priceCart>;

export type CheckoutCustomer = {
  name: string;
  designation?: string;
  email: string;
  phone: string;
  company: string;
  taxId?: string;
  address: string;
  notes?: string;
};

const paise = (rupees: number) => Math.round(rupees * 100);

export async function recordCheckout(input: {
  reference: string;
  order: Priced;
  customer: CheckoutCustomer;
  consent: string;
  razorpayLinkId?: string;
  razorpaySubscriptionId?: string;
  partnerCode?: string | null;
}) {
  if (!isDatabaseConfigured()) return;
  const prisma = getPrisma();
  const { order, customer } = input;
  const partner = input.partnerCode
    ? await prisma.account.findFirst({ where: { referralCode: input.partnerCode, isReseller: true }, select: { id: true } })
    : null;

  const created = await prisma.order.create({
    data: {
      reference: input.reference,
      channel: partner ? "PARTNER" : "WEBSITE",
      partnerId: partner?.id ?? null,
      billing: order.billing ?? null,
      subtotalPaise: paise(order.subtotal),
      discountPaise: paise(order.discount),
      comboDiscountPaise: paise(order.comboDiscount),
      taxPaise: paise(order.gst),
      taxLabel: order.taxLabel,
      totalPaise: paise(order.total),
      recurringPaise: paise(order.recurring.total),
      oneTimePaise: paise(order.oneTime.total),
      contactName: customer.designation ? `${customer.name} (${customer.designation})` : customer.name,
      contactEmail: customer.email.toLowerCase(),
      contactPhone: customer.phone,
      company: customer.company,
      taxId: customer.taxId || null,
      billingAddress: customer.address,
      notes: customer.notes || null,
      consent: input.consent,
      razorpayLinkId: input.razorpayLinkId ?? null,
      razorpaySubscriptionId: input.razorpaySubscriptionId ?? null,
      lines: {
        create: order.lines.map((line) => ({
          productId: line.id,
          name: line.product.name,
          group: line.product.group,
          division: divisionOf(line.product.vertical),
          kind: line.quoted ? "QUOTED" : line.product.kind === "membership" ? "MEMBERSHIP" : "ONE_TIME",
          qty: line.qty,
          chargePaise: paise(line.charge),
          extras: (line.extras ?? undefined) as Prisma.InputJsonValue | undefined,
          extraLabels: line.extraLines.map((extra) => extra.label),
          extrasPaise: paise(line.extrasCharge),
        })),
      },
    },
  });
  await queueSheet("orders", created.id);

  /* The checkout as a lead, unless this person already has an open one. */
  const open = await prisma.lead.findFirst({ where: { email: customer.email.toLowerCase(), status: { notIn: ["WON", "LOST"] } } });
  const interest = order.lines.map((line) => line.product.name).join(", ");
  if (open) {
    await prisma.activity.create({ data: { leadId: open.id, kind: "SYSTEM", body: `Started checkout ${input.reference}: ${interest} (${money(created.totalPaise)})` } });
  } else {
    const lead = await prisma.lead.create({
      data: {
        name: customer.name,
        email: customer.email.toLowerCase(),
        phone: customer.phone,
        company: customer.company,
        designation: customer.designation || null,
        division: order.lines[0] ? divisionOf(order.lines[0].product.vertical) : null,
        interest,
        source: partner ? "PARTNER" : "CHECKOUT",
        partnerId: partner?.id ?? null,
        status: "NEGOTIATION",
        valuePaise: created.totalPaise,
        notes: `Checkout ${input.reference} started, awaiting payment.`,
      },
    });
    await queueSheet("leads", lead.id);
  }
}

// --- Razorpay events -----------------------------------------------------------------

type Entity = Record<string, unknown>;
type RazorpayEvent = { event?: string; created_at?: number; payload?: Record<string, { entity?: Entity } | undefined> };

const str = (value: unknown) => (typeof value === "string" ? value : undefined);
const num = (value: unknown) => (typeof value === "number" ? value : undefined);
const when = (unix: unknown) => (typeof unix === "number" && unix > 0 ? new Date(unix * 1000) : null);

const SUBSCRIPTION_EVENTS: Record<string, SubscriptionStatus> = {
  "subscription.authenticated": "AUTHENTICATED",
  "subscription.activated": "ACTIVE",
  "subscription.charged": "ACTIVE",
  "subscription.pending": "PENDING",
  "subscription.halted": "HALTED",
  "subscription.paused": "PAUSED",
  "subscription.resumed": "ACTIVE",
  "subscription.cancelled": "CANCELLED",
  "subscription.completed": "COMPLETED",
};

/**
 * Applies one webhook delivery. A delivery already applied is skipped; one
 * that failed (a renewal racing the first charge, a database blip) keeps its
 * payload and is retried by the job runner (`retryWebhookEvents`).
 */
export async function applyRazorpayEvent(event: RazorpayEvent, deliveryId: string | null) {
  if (!isDatabaseConfigured() || !event.event) return;
  const prisma = getPrisma();
  if (deliveryId) {
    const seen = await prisma.webhookEvent.findUnique({ where: { id: deliveryId } });
    if (seen?.processedAt) return;
    if (!seen) await prisma.webhookEvent.create({ data: { id: deliveryId, event: event.event, payload: event as Prisma.InputJsonValue } }).catch(() => undefined);
    await prisma.webhookEvent.update({ where: { id: deliveryId }, data: { attempts: { increment: 1 } } });
  }
  try {
    const link = event.payload?.payment_link?.entity;
    const sub = event.payload?.subscription?.entity;
    const payment = event.payload?.payment?.entity;

    if (event.event === "payment_link.paid" && link) {
      const order = await prisma.order.findFirst({ where: { OR: [{ razorpayLinkId: str(link.id) ?? "-" }, { reference: str(link.reference_id) ?? "-" }] } });
      if (order && (await claimPaid(order.id, payment))) await fulfil(order.id, payment);
      /* An invoice's pay link (lib/crm/invoices). */
      if (!order) {
        const invoice = await prisma.invoice.findFirst({ where: { razorpayLinkId: str(link.id) ?? "-" }, select: { id: true } });
        if (invoice) await markInvoicePaid(invoice.id, str(payment?.id), str(payment?.method));
      }
    } else if (sub && SUBSCRIPTION_EVENTS[event.event]) {
      await applySubscription(event.event, sub, payment, when(event.created_at) ?? new Date());
    }
    if (deliveryId) await prisma.webhookEvent.update({ where: { id: deliveryId }, data: { processedAt: new Date(), error: null } });
  } catch (error) {
    if (deliveryId) await prisma.webhookEvent.update({ where: { id: deliveryId }, data: { error: String((error as Error).message).slice(0, 500) } }).catch(() => undefined);
    throw error;
  }
}

async function applySubscription(name: string, sub: Entity, payment: Entity | undefined, at: Date) {
  const prisma = getPrisma();
  const razorpayId = str(sub.id);
  if (!razorpayId) return;
  const order = await prisma.order.findFirst({ where: { razorpaySubscriptionId: razorpayId } });
  const status = SUBSCRIPTION_EVENTS[name]!;
  const paidCount = num(sub.paid_count) ?? 0;

  /*
    OUT OF ORDER IS NORMAL: Razorpay retries and parallel deliveries mean a
    "renewal failing" can land after the "charged" that followed it. The
    status (and dates) follow the newest event; money and projects are
    applied whatever order they arrive in, once each.
  */
  const before = await prisma.subscription.findUnique({ where: { razorpayId }, select: { lastEventAt: true } });
  const newest = !before?.lastEventAt || at >= before.lastEventAt;
  const subscription = await prisma.subscription.upsert({
    where: { razorpayId },
    create: {
      razorpayId,
      status,
      orderId: order?.id ?? null,
      accountId: order?.accountId ?? null,
      billing: order?.billing ?? null,
      amountPaise: order?.recurringPaise ?? 0,
      paidCount,
      currentEnd: when(sub.current_end),
      nextChargeAt: when(sub.charge_at),
      lastEventAt: at,
    },
    update: newest
      ? {
          status,
          paidCount: Math.max(paidCount, 0),
          currentEnd: when(sub.current_end),
          nextChargeAt: when(sub.charge_at),
          lastEventAt: at,
          ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
        }
      : {},
  });

  if (name === "subscription.charged") {
    /* The first charge opens the work (once, whichever delivery wins); every later one is a renewal. */
    const first = order ? await claimPaid(order.id, paidCount <= 1 ? payment : undefined) : false;
    if (first) await fulfil(order!.id, paidCount <= 1 ? payment : undefined, subscription.id);
    if (paidCount > 1) await renew(subscription.id, payment);
  }

  const accountId = subscription.accountId ?? order?.accountId ?? null;
  if (order) await queueSheet("orders", order.id);
  if (name === "subscription.pending" || name === "subscription.halted") {
    const halted = name === "subscription.halted";
    await queueStaffEmail({
      kind: "subscription_attention",
      scope: "finance",
      subject: `${halted ? "Subscription halted: pause the work queue" : "Renewal payment failing"}${order ? ` · ${order.company ?? order.contactName}` : ""}`,
      text: `${halted ? "Every retry failed. Pause the queue and contact the client to update their payment method." : "Razorpay is retrying the renewal charge. Check with the client before starting new work."}\n\nOrder: ${order?.reference ?? "—"}\nSubscription: ${razorpayId}\nOpen: ${appUrl("/admin/billing")}`,
      dedupeKey: `sub-attention:${razorpayId}:${name}:${paidCount}`,
    });
    if (accountId) {
      await queueEmail({
        kind: "subscription_payment_failed",
        to: await accountEmails(accountId),
        subject: halted ? "Your Genesis plan is paused: payment needed" : "We couldn't take your Genesis renewal payment",
        text: `${halted ? "We could not collect your plan's renewal after several attempts, so new work is paused." : "Your bank declined this cycle's renewal. Razorpay will retry automatically over the next few days."}\n\nTo keep your content on schedule, update your payment method from the link in Razorpay's email, or reply and we'll send a fresh one.\n\nYour plan: ${appUrl("/portal/billing")}`,
        dedupeKey: `sub-failed-client:${razorpayId}:${name}:${paidCount}`,
      });
    }
  }
  if (name === "subscription.cancelled" && accountId) {
    await queueStaffEmail({
      kind: "subscription_cancelled",
      scope: "all",
      subject: `Subscription cancelled · ${order?.company ?? razorpayId}`,
      text: `Close out the queue for this client.\n\nOpen: ${appUrl(`/admin/accounts/${accountId}`)}`,
      dedupeKey: `sub-cancelled:${razorpayId}`,
    });
  }
}

/** Marks an order paid exactly once: true only for the call that made the change. */
async function claimPaid(orderId: string, payment: Entity | undefined) {
  const { count } = await getPrisma().order.updateMany({
    where: { id: orderId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PAID", paidAt: new Date(), razorpayPaymentId: str(payment?.id) ?? null },
  });
  return count === 1;
}

/** Re-applies webhook events that failed, oldest first, up to five attempts each. */
export async function retryWebhookEvents(limit = 20) {
  const prisma = getPrisma();
  const stuck = await prisma.webhookEvent.findMany({
    where: { processedAt: null, attempts: { lt: 5 }, receivedAt: { lt: new Date(Date.now() - 60_000) }, payload: { not: Prisma.DbNull } },
    orderBy: { receivedAt: "asc" },
    take: limit,
  });
  let applied = 0;
  for (const e of stuck) {
    try {
      await applyRazorpayEvent(e.payload as RazorpayEvent, e.id);
      applied++;
    } catch {
      /* recorded on the row by applyRazorpayEvent */
    }
  }
  return { retried: stuck.length, applied };
}

/** Find or create the client's account for an order, and give the buyer portal access. */
async function accountFor(orderId: string) {
  const prisma = getPrisma();
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.accountId) return order.accountId;

  const email = order.contactEmail.toLowerCase();
  const member = await prisma.accountMember.findFirst({ where: { user: { email, emailVerified: true }, account: { kind: { not: "VENDOR" } } }, select: { accountId: true } });
  const existing =
    member?.accountId ??
    (await prisma.account.findFirst({ where: { OR: [{ email }, ...(order.taxId ? [{ gstin: order.taxId }] : [])], kind: { not: "VENDOR" } }, select: { id: true } }))?.id;

  const accountId =
    existing ??
    (
      await prisma.account.create({
        data: {
          name: order.company || order.contactName,
          legalName: order.company,
          gstin: order.taxId,
          billingAddress: order.billingAddress,
          email,
          phone: order.contactPhone,
          status: "ACTIVE",
          referredById: order.partnerId,
          notes: `Created from order ${order.reference}.`,
        },
      })
    ).id;

  await prisma.account.update({ where: { id: accountId }, data: { status: "ACTIVE" } });
  await prisma.order.update({ where: { id: orderId }, data: { accountId } });

  /* The buyer's portal access: straight away for a verified user, otherwise waiting for their first sign-in with this email. */
  const user = await prisma.user.findFirst({ where: { email, emailVerified: true } });
  if (user) {
    await prisma.accountMember.upsert({ where: { accountId_userId: { accountId, userId: user.id } }, create: { accountId, userId: user.id, role: "OWNER" }, update: {} });
  } else {
    await prisma.accountInvite.upsert({ where: { accountId_email: { accountId, email } }, create: { accountId, email, role: "OWNER" }, update: {} });
  }
  await queueSheet("accounts", accountId);
  return accountId;
}

const monthName = (d: Date) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);

/** A paid order becomes an account, projects, a payment and (for a referral) a commission. */
export async function fulfil(orderId: string, payment?: Entity, subscriptionId?: string) {
  const prisma = getPrisma();
  const accountId = await accountFor(orderId);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { lines: true, account: { include: { referredBy: true } } } });

  if (subscriptionId) await prisma.subscription.update({ where: { id: subscriptionId }, data: { accountId } });

  /* The lead this order closes, so its project carries the lead (every won lead has a project). */
  const leads = await prisma.lead.findMany({ where: { email: order.contactEmail, status: { notIn: ["WON", "LOST"] } }, select: { id: true } });
  const quote = order.quoteId ? await prisma.quote.findUnique({ where: { id: order.quoteId } }) : null;
  const opened = await prisma.project.count({ where: { orderId } });

  if (opened === 0 && quote) {
    /* A quote is one piece of work, whatever its lines: its project (already open if the client accepted first), now paid. */
    if (!quote.accountId) await prisma.quote.update({ where: { id: quote.id }, data: { accountId } });
    const projectId = await openFor(quote.id);
    const linked = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { leadId: true } });
    await prisma.project.update({ where: { id: projectId }, data: { orderId, ...(linked.leadId ? {} : { leadId: leads[0]?.id ?? null }) } });
  } else if (opened === 0) {
    /* One project per product. A plan's project is this month's; renewals add the next. */
    for (const [i, line] of order.lines.entries()) {
      if (line.kind === "QUOTED") continue;
      const product = findProduct(line.productId);
      const quota = quotaFrom(product?.includes);
      await openProject({
        accountId,
        name: line.kind === "MEMBERSHIP" ? `${line.group} ${line.name} · ${monthName(new Date())}` : line.name,
        division: line.division,
        productName: line.name,
        productId: line.productId,
        membership: line.kind === "MEMBERSHIP",
        orderId,
        orderLineId: line.id,
        subscriptionId: line.kind === "MEMBERSHIP" ? (subscriptionId ?? null) : null,
        leadId: i === 0 ? (leads[0]?.id ?? null) : null,
        quota: quota ? quota * (line.kind === "ONE_TIME" ? line.qty : 1) : null,
        brief: line.extraLabels.length ? `Extras bought: ${line.extraLabels.join(", ")}` : null,
        why: `Opened from order ${order.reference}.`,
      });
    }
  }
  if (quote) await prisma.quote.update({ where: { id: quote.id }, data: { status: "PAID" } });

  const amount = num(payment?.amount) ?? order.totalPaise;
  const paymentRow = str(payment?.id)
    ? await prisma.payment.upsert({
        where: { razorpayId: str(payment!.id)! },
        create: { razorpayId: str(payment!.id)!, amountPaise: amount, method: str(payment!.method) ?? null, orderId, subscriptionId: subscriptionId ?? null, accountId, invoiceId: str(payment!.invoice_id) ?? null },
        update: {},
      })
    : null;
  if (paymentRow) await queueSheet("payments", paymentRow.id);
  await commission(order.account?.referredBy ?? null, order.partnerId, orderId, paymentRow?.id ?? null, amount, order.taxPaise, order.totalPaise);

  /* The lead that became this order. */
  for (const lead of leads) {
    await prisma.lead.update({ where: { id: lead.id }, data: { status: "WON", accountId, valuePaise: order.totalPaise } });
    await prisma.activity.create({ data: { leadId: lead.id, kind: "STATUS", body: `Won: order ${order.reference} paid (${money(order.totalPaise)}).` } });
    await queueSheet("leads", lead.id);
  }
  await prisma.activity.create({ data: { accountId, kind: "SYSTEM", body: `Order ${order.reference} paid: ${money(order.totalPaise)}.` } });
  await queueSheet("orders", orderId);

  /* What happens next, per product, in Genesis's own words (lib/products). */
  const nextSteps = order.lines
    .filter((line) => line.kind !== "QUOTED")
    .map((line) => {
      const detail = products.find((p) => p.name === line.name);
      const needs = detail?.requirements?.length ? `\n${detail.requirementsIntro ?? "What we need from you:"}\n${detail.requirements.map((r) => `  • ${r}`).join("\n")}` : "";
      const steps = detail?.process?.length ? `\nHow it runs: ${detail.process.join(" → ")}` : "";
      return `${line.name}${line.qty > 1 ? ` ×${line.qty}` : ""}${steps}${needs}`;
    })
    .join("\n\n");
  await queueEmail({
    kind: "order_confirmed",
    to: [order.contactEmail],
    subject: `Order confirmed · ${order.reference}`,
    text: `Hi ${order.contactName.split(" ")[0]},\n\nThank you. Your payment of ${money(amount)} is confirmed and your projects are open.\n\n${nextSteps}\n\nYour client portal has your projects, files to review, invoices, and a direct line to the team. Sign in with this email address (${order.contactEmail}) — we'll send you a one-time code, no password needed:\n${appUrl("/portal")}\n\nReference: ${order.reference}`,
    dedupeKey: `order-confirmed:${orderId}`,
  });
}

/** A renewal: the payment, the commission, and this cycle's project for each plan. */
async function renew(subscriptionId: string, payment: Entity | undefined) {
  const prisma = getPrisma();
  const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: subscriptionId }, include: { order: { include: { lines: true } }, account: { include: { referredBy: true } } } });
  /* The first charge hasn't opened the account yet (it arrived later, or is still running): fail, and the job retries. */
  if (!subscription.accountId) throw new Error("Renewal before the subscription's account exists; will retry");
  const paymentId = str(payment?.id);
  if (!paymentId) return;
  const existing = await prisma.payment.findUnique({ where: { razorpayId: paymentId } });
  if (existing) return;
  const amount = num(payment?.amount) ?? subscription.amountPaise;
  const row = await prisma.payment.create({
    data: { razorpayId: paymentId, amountPaise: amount, method: str(payment?.method) ?? null, subscriptionId, accountId: subscription.accountId, invoiceId: str(payment?.invoice_id) ?? null },
  });
  await queueSheet("payments", row.id);
  await commission(subscription.account?.referredBy ?? null, subscription.order?.partnerId ?? null, subscription.orderId, row.id, amount, null, null);

  for (const line of subscription.order?.lines.filter((l) => l.kind === "MEMBERSHIP") ?? []) {
    await openProject({
      accountId: subscription.accountId,
      name: `${line.group} ${line.name} · ${monthName(new Date())}`,
      division: line.division,
      productName: line.name,
      productId: line.productId,
      membership: true,
      orderId: subscription.orderId,
      subscriptionId,
      quota: quotaFrom(findProduct(line.productId)?.includes),
      why: `Opened for renewal ${subscription.paidCount}.`,
    });
  }
  await queueEmail({
    kind: "subscription_renewed",
    to: await accountEmails(subscription.accountId),
    subject: "Your Genesis plan renewed",
    text: `Your plan renewed for another cycle (${money(amount)}), and this cycle's work is open in your portal. Send us this cycle's briefs whenever you're ready.\n\n${appUrl("/portal/requests/new")}`,
    dedupeKey: `renewed:${paymentId}`,
  });
}

/** A reseller's share of a payment, on the amount before tax. Once per payment. */
async function commission(referrer: { id: string; isReseller: boolean; commissionPercent: number } | null, partnerId: string | null, orderId: string | null, paymentId: string | null, amountPaise: number, taxPaise: number | null, totalPaise: number | null) {
  const prisma = getPrisma();
  const partner = partnerId ? await prisma.account.findUnique({ where: { id: partnerId } }) : referrer;
  if (!partner?.isReseller || partner.commissionPercent <= 0) return;
  if (paymentId && (await prisma.commission.findUnique({ where: { paymentId } }))) return;
  /* The pre-tax part of what was paid: the order's own tax share, or GST at 18% on a renewal. */
  const base = totalPaise && taxPaise !== null ? Math.round((amountPaise * (totalPaise - taxPaise)) / totalPaise) : Math.round(amountPaise / 1.18);
  await prisma.commission.create({
    data: { partnerId: partner.id, orderId, paymentId, percent: partner.commissionPercent, basePaise: base, amountPaise: Math.round((base * partner.commissionPercent) / 100) },
  });
}
