import { NextResponse } from "next/server";

import { emailLoginEnabled, SESSION_COOKIE } from "@/lib/crm/email-login";
import { devCookie, devLoginEnabled, STAFF_2FA_COOKIE } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/** Signs out of the CRM: the staff two-factor mark, then Auth0's session (or the local development cookie). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(devLoginEnabled() || emailLoginEnabled() ? "/login" : "/auth/logout", url.origin));
  response.cookies.delete(STAFF_2FA_COOKIE);
  response.cookies.delete("gm_portal_account");
  if (devLoginEnabled()) response.cookies.delete(devCookie.name);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
