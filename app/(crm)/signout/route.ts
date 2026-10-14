import { NextResponse } from "next/server";

import { emailLoginEnabled, SESSION_COOKIE } from "@/lib/crm/email-login";
import { devCookie, devLoginEnabled, STAFF_2FA_COOKIE } from "@/lib/crm/session";
import { SIGNED_IN_HINT } from "@/lib/signed-in-hint";

export const dynamic = "force-dynamic";

/**
 * Signs out of the CRM: the staff two-factor mark, then Auth0's session (or
 * the email-code / local development cookie). POST only, from the Sign out
 * button: as a GET, the production <Link> prefetch of /signout signed people
 * out the moment the admin rendered.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(devLoginEnabled() || emailLoginEnabled() ? "/login" : "/auth/logout", url.origin), 303);
  response.cookies.delete(STAFF_2FA_COOKIE);
  response.cookies.delete("gm_portal_account");
  response.cookies.delete(SIGNED_IN_HINT);
  if (devLoginEnabled()) response.cookies.delete(devCookie.name);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

/** A visit (or a prefetch) to /signout changes nothing. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", new URL(request.url).origin));
}
