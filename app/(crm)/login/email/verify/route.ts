import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { checkLoginCode, emailLoginEnabled, PENDING_COOKIE, readSignedEmail, SESSION_COOKIE, sessionCookieOptions, signEmail } from "@/lib/crm/email-login";
import { safeNext } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/** Step two: the code. A match signs in and continues through /account/complete, like any sign-in. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData();
  const next = safeNext(String(form.get("next") ?? ""), "");
  const tail = next ? `&next=${encodeURIComponent(next)}` : "";
  const back = (query: string) => NextResponse.redirect(new URL(`/login?${query}${tail}`, url.origin), 303);
  if (!emailLoginEnabled()) return back("error=unavailable");
  const email = readSignedEmail((await cookies()).get(PENDING_COOKIE)?.value);
  if (!email) return back("error=expired");

  const result = await checkLoginCode(email, String(form.get("code") ?? ""));
  if (result === "wrong") return back("step=code&error=code");
  if (result === "expired") {
    const response = back("error=expired");
    response.cookies.delete(PENDING_COOKIE);
    return response;
  }
  const response = NextResponse.redirect(new URL(`/account/complete${next ? `?next=${encodeURIComponent(next)}` : ""}`, url.origin), 303);
  response.cookies.delete(PENDING_COOKIE);
  response.cookies.set(SESSION_COOKIE, signEmail(email), sessionCookieOptions);
  return response;
}
