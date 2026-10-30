import { NextResponse } from "next/server";

import { settleTopUp } from "@/lib/crm/nova-ai";

export const dynamic = "force-dynamic";

/** Back from paying a NOVA AI top-up: the link is checked with Razorpay and the credits added (once), then on to NOVA AI. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const link = url.searchParams.get("razorpay_payment_link_id");
  const paid = link ? await settleTopUp(link).catch(() => false) : false;
  return NextResponse.redirect(new URL(`/admin/assistant?topup=${paid ? "done" : "pending"}`, url.origin), 303);
}
