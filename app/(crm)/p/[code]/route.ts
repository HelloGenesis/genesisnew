import { NextResponse } from "next/server";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * A reseller's referral link: genesismedia.co/p/<code>. Remembers the partner
 * for 60 days (gm_partner), so a checkout in that time is credited to them
 * (lib/crm/orders), then sends the visitor to the homepage.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", url.origin));
  if (/^[a-f0-9]{8}$/.test(code) && isDatabaseConfigured()) {
    const partner = await getPrisma().account.findFirst({ where: { referralCode: code, isReseller: true }, select: { id: true } });
    if (partner) response.cookies.set("gm_partner", code, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  }
  return response;
}
