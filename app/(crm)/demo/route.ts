import { NextResponse } from "next/server";

import { DEMO_COOKIE } from "@/lib/crm/demo";
import { ensureDemo } from "@/lib/crm/demo-seed";
import { signedInIdentity } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/**
 * NOVA'S LIVE DEMO, THE WAY IN (lib/crm/demo): makes the demo agency if it
 * isn't there, marks this browser as a demo visitor and opens the CRM. Someone
 * already signed in keeps their own CRM and is told how to see the demo.
 * ?exit ends it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.has("exit")) {
    const out = NextResponse.redirect(new URL("/resellers", url.origin));
    out.cookies.delete(DEMO_COOKIE);
    return out;
  }
  if (await signedInIdentity()) return NextResponse.redirect(new URL("/demo/signed-in", url.origin));
  await ensureDemo();
  const next = url.searchParams.get("next");
  const out = NextResponse.redirect(new URL(next && /^\/(admin|portal)(\/|$)/.test(next) ? next : "/admin", url.origin));
  out.cookies.set(DEMO_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 60 * 60 * 6 });
  return out;
}
