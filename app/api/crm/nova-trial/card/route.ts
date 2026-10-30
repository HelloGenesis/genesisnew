import { NextResponse } from "next/server";
import { z } from "zod";

import { startCard, trialAdmin, TrialProblem } from "@/lib/crm/nova-trial";
import { RazorpayError } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The trial's card step: the chosen plan as a Razorpay subscription starting when the trial ends (lib/crm/nova-trial). */
export async function POST(request: Request) {
  const me = await trialAdmin();
  if (!me) return NextResponse.json({ error: "Only your agency's admin can add the card." }, { status: 403 });
  const parsed = z.object({ plan: z.string().max(20) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });
  try {
    return NextResponse.json(await startCard(me.trial, parsed.data.plan, { name: me.viewer.name, email: me.viewer.email, phone: me.viewer.phone }));
  } catch (error) {
    if (error instanceof TrialProblem) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("[nova-trial] card failed", error instanceof RazorpayError ? `${error.status} ${error.body}` : error);
    return NextResponse.json({ error: "The card step couldn't be started. Please try again, or message us on WhatsApp." }, { status: 502 });
  }
}
