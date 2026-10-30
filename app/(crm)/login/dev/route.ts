import { NextResponse } from "next/server";

import { DEMO_COOKIE } from "@/lib/crm/demo";

import { devCookie, devLoginEnabled, safeNext, signDevIdentity } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/**
 * Local development sign-in (see devLoginEnabled): any email, no code. A
 * plain form post and a 303, so the browser follows the same full-page
 * redirects a real Auth0 sign-in does, through /account/complete.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!devLoginEnabled()) return NextResponse.redirect(new URL("/login", url.origin), 303);
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.redirect(new URL("/login?error=email", url.origin), 303);
  const next = safeNext(String(form.get("next") ?? ""), "");
  const response = NextResponse.redirect(new URL(`/account/complete${next ? `?next=${encodeURIComponent(next)}` : ""}`, url.origin), 303);
  response.cookies.set(devCookie.name, signDevIdentity(email), devCookie.options);
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
