import { after, NextResponse } from "next/server";

import { type OrderEvent, recordOrderEvent } from "@/lib/orders";
import { signatureMatches } from "@/lib/razorpay";

/**
 * RAZORPAY'S OWN WORD THAT AN ORDER WAS PAID — and, for memberships, every
 * renewal, failure and cancellation after it.
 *
 * The /cart/complete redirect is for the buyer; it can be closed, blocked or
 * never reached. This is the record Genesis can trust: Razorpay calls it,
 * signed with the webhook secret set in the Razorpay dashboard
 * (RAZORPAY_WEBHOOK_SECRET), and an unsigned or mis-signed call is refused.
 *
 * Each event becomes a row in the Orders sheet and an email to the team
 * (lib/orders). That work runs AFTER the reply — Razorpay waits only a few
 * seconds and retries a webhook that is slow to answer.
 *
 * Events to enable in the dashboard: payment_link.paid,
 * subscription.activated, subscription.charged, subscription.pending,
 * subscription.halted, subscription.cancelled.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Notes = Record<string, string | undefined>;
type Payload = {
  event?: string;
  payload?: {
    payment_link?: {
      entity?: {
        id?: string;
        reference_id?: string;
        amount_paid?: number;
        notes?: Notes;
        customer?: { name?: string; email?: string; contact?: string };
      };
    };
    subscription?: {
      entity?: { id?: string; plan_id?: string; paid_count?: number; status?: string; notes?: Notes; charge_at?: number };
    };
    payment?: { entity?: { id?: string; amount?: number } };
  };
};

const clean = (value?: string) => (value && value !== "—" ? value : undefined);

/** A Razorpay event, as the team reads it — or nothing, for events we do not act on. */
function describe(event: Payload): OrderEvent | undefined {
  const payment = event.payload?.payment?.entity;
  const link = event.payload?.payment_link?.entity;
  const sub = event.payload?.subscription?.entity;

  if (event.event === "payment_link.paid" && link) {
    const n = link.notes ?? {};
    const buyer = link.customer;
    return {
      event: "One-time order paid",
      reference: link.reference_id,
      amount: (link.amount_paid ?? 0) / 100,
      items: clean(n.items),
      billing: "One-time",
      company: clean(n.company),
      contact: clean(n.contact) ?? [buyer?.name, buyer?.email, buyer?.contact].filter(Boolean).join(" · "),
      taxId: clean(n.tax_id),
      address: [clean(n.billing_address), clean(n.place)].filter(Boolean).join(", "),
      razorpay: [payment?.id, link.id].filter(Boolean).join(" · "),
      notes: [clean(n.quote_requests) && `Quote: ${n.quote_requests}`, clean(n.buyer_notes), clean(n.tax)]
        .filter(Boolean)
        .join(" · "),
    };
  }

  if (!sub) return undefined;
  const n = sub.notes ?? {};
  const base: OrderEvent = {
    event: "",
    reference: clean(n.reference),
    items: clean(n.items),
    billing: clean(n.billing),
    company: clean(n.company),
    contact: clean(n.contact),
    taxId: clean(n.tax_id),
    address: clean(n.billing_address),
    razorpay: [payment?.id, sub.id].filter(Boolean).join(" · "),
    notes: [clean(n.one_time) && `One-time: ${n.one_time}`, clean(n.quote_requests) && `Quote: ${n.quote_requests}`, clean(n.buyer_notes)]
      .filter(Boolean)
      .join(" · "),
  };
  const amount = payment?.amount === undefined ? undefined : payment.amount / 100;

  switch (event.event) {
    case "subscription.activated":
      return { ...base, event: "Membership activated" };
    case "subscription.charged":
      return (sub.paid_count ?? 1) <= 1
        ? { ...base, event: "New membership paid — start onboarding", amount }
        : { ...base, event: `Membership renewed (payment ${sub.paid_count})`, amount };
    case "subscription.pending":
      return {
        ...base,
        alert: true,
        event: "Renewal payment failed — Razorpay is retrying",
        notes: "Razorpay retries the charge automatically. Check with the client before starting new work.",
      };
    case "subscription.halted":
      return {
        ...base,
        alert: true,
        event: "Membership halted — pause the work queue",
        notes: "Every retry failed. Pause the queue and contact the client to update their payment method.",
      };
    case "subscription.cancelled":
      return { ...base, alert: true, event: "Membership cancelled — close out the queue" };
    default:
      return undefined;
  }
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const raw = await request.text();
  if (!signatureMatches(raw, request.headers.get("x-razorpay-signature") ?? "", secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let event: Payload;
  try {
    event = JSON.parse(raw) as Payload;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const order = describe(event);
  if (order) {
    /* The delivery id, so a webhook Razorpay retried is recognisable in the sheet. */
    const delivery = request.headers.get("x-razorpay-event-id");
    if (delivery) order.razorpay = [order.razorpay, `event ${delivery}`].filter(Boolean).join(" · ");
    after(() => recordOrderEvent(order));
  }

  return NextResponse.json({ ok: true });
}
