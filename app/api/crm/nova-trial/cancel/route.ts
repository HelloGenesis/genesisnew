import { NextResponse } from "next/server";

import { cancelTrial, trialAdmin } from "@/lib/crm/nova-trial";
import { RazorpayError } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cancels the trial (or the plan): nothing more is charged, and they're told by email (lib/crm/nova-trial). */
export async function POST() {
  const me = await trialAdmin();
  if (!me) return NextResponse.json({ error: "Only your agency's admin can cancel." }, { status: 403 });
  try {
    await cancelTrial(me.trial);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[nova-trial] cancel failed", error instanceof RazorpayError ? `${error.status} ${error.body}` : error);
    return NextResponse.json({ error: "It couldn't be cancelled just now. Please try again, or reply to any of our emails and we'll do it." }, { status: 502 });
  }
}
