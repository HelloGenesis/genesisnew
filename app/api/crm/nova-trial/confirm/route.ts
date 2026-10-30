import { NextResponse } from "next/server";
import { z } from "zod";

import { cardAdded, trialAdmin } from "@/lib/crm/nova-trial";
import { razorpayKeys, signatureMatches } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Razorpay Checkout's signed reply when the card is authorised: the trial carries on at once, before the webhook arrives. */
export async function POST(request: Request) {
  const me = await trialAdmin();
  const keys = razorpayKeys();
  if (!me || !keys) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const parsed = z.object({ razorpay_payment_id: z.string().max(80), razorpay_subscription_id: z.string().max(80), razorpay_signature: z.string().max(200) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const { razorpay_payment_id: pay, razorpay_subscription_id: sub, razorpay_signature: sig } = parsed.data;
  /* Razorpay signs payment id | subscription id with the key secret. */
  if (sub !== me.trial.subscriptionId || !signatureMatches(`${pay}|${sub}`, sig, keys.secret)) return NextResponse.json({ error: "That payment couldn't be checked." }, { status: 400 });
  await cardAdded(sub);
  return NextResponse.json({ ok: true });
}
