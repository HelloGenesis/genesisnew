import { NextResponse } from "next/server";

import { DEMO_COOKIE } from "@/lib/crm/demo";
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
  /*
   * THE ADDRESS: from the short-lived cookie, or typed on the code screen.
   * Phones lose that cookie (Genesis, 13 Oct 2026: "it shows an expired code
   * within seconds"): a login opened in Gmail's or WhatsApp's in-app browser
   * is closed when you go to read the email, and a code asked for on one
   * device is often typed on another. The code itself is the proof; five
   * tries per address still apply.
   */
  const jar = await cookies();
  const typed = String(form.get("email") ?? "").trim().toLowerCase();
  const email = readSignedEmail(jar.get(PENDING_COOKIE)?.value) ?? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typed) && typed.length <= 200 ? typed : null);
  if (!email) return back("step=code&error=address");
  /* Sent twice (a phone's code auto-fill, or a double tap): the first one already signed in. */
  const continueTo = NextResponse.redirect(new URL(`/account/complete${next ? `?next=${encodeURIComponent(next)}` : ""}`, url.origin), 303);
  /* Signed in: no longer Nova's demo visitor in this browser (lib/crm/demo). */
  continueTo.cookies.delete(DEMO_COOKIE);
  const signedIn = readSignedEmail(jar.get(SESSION_COOKIE)?.value);

  const result = await checkLoginCode(email, String(form.get("code") ?? ""));
  if (result !== "ok" && signedIn === email) return continueTo;
  if (result === "wrong") return back("step=code&error=code");
  if (result === "expired") {
    const response = back("error=expired");
    response.cookies.delete(PENDING_COOKIE);
    return response;
  }
  const response = continueTo;
  response.cookies.delete(PENDING_COOKIE);
  response.cookies.set(SESSION_COOKIE, signEmail(email), sessionCookieOptions);
  return response;
}
