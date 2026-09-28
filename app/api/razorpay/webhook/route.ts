import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

/**
 * RAZORPAY'S OWN WORD THAT AN ORDER WAS PAID.
 *
 * The /cart/complete redirect is for the buyer; it can be closed, blocked or
 * never reached. This is the record Genesis can trust: Razorpay calls it on
 * `payment_link.paid`, signed with the webhook secret set in the Razorpay
 * dashboard (RAZORPAY_WEBHOOK_SECRET), and an unsigned or mis-signed call is
 * refused.
 *
 * TODO(genesis): decide where a paid order goes — an email to the team, a
 * row in the database, a Slack message. It is logged for now, with
 * everything needed to fulfil it (the reference, amount, buyer and the items
 * in the payment link's notes).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const raw = await request.text();
  const given = request.headers.get("x-razorpay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "Bad signature" }, { status: 401 });

  const event = JSON.parse(raw) as {
    event?: string;
    payload?: {
      payment_link?: { entity?: { reference_id?: string; amount_paid?: number; notes?: Record<string, string>; customer?: unknown } };
      payment?: { entity?: { id?: string } };
    };
  };

  if (event.event === "payment_link.paid") {
    const link = event.payload?.payment_link?.entity;
    console.info("[razorpay] order paid", {
      reference: link?.reference_id,
      amount: (link?.amount_paid ?? 0) / 100,
      payment: event.payload?.payment?.entity?.id,
      customer: link?.customer,
      notes: link?.notes,
    });
  }

  return NextResponse.json({ ok: true });
}
