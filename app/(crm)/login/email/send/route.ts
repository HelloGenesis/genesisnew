import { NextResponse } from "next/server";

import { DEMO_COOKIE, withDemoWrites } from "@/lib/crm/demo";
import { emailLoginEnabled, PENDING_COOKIE, pendingCookieOptions, sendLoginCode, signEmail } from "@/lib/crm/email-login";
import { safeNext } from "@/lib/crm/session";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Step one of the email-code sign-in (lib/crm/email-login): emails the code
 * and remembers the address in a short-lived signed cookie, never the URL.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  /* Signing in ends Nova's live demo in this browser (lib/crm/demo): from here on it's this person, never the demo visitor. */
  const back = (query: string) => {
    const r = NextResponse.redirect(new URL(`/login?${query}`, url.origin), 303);
    r.cookies.delete(DEMO_COOKIE);
    return r;
  };
  if (!emailLoginEnabled()) return back("error=unavailable");
  const form = await request.formData();
  const next = safeNext(String(form.get("next") ?? ""), "");
  const tail = next ? `&next=${encodeURIComponent(next)}` : "";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return back(`error=email${tail}`);
  if (!(await checkRateLimit(rateLimitKey(request, "otp"))).success) return back(`error=slow${tail}`);
  try {
    /* Sent even if this browser opened the demo before (the demo refuses to send email). */
    await withDemoWrites(() => sendLoginCode(email));
  } catch (error) {
    console.error("[crm] sign-in code not sent", error);
    return back(`error=send${tail}`);
  }
  const response = back(`step=code${tail}`);
  response.cookies.set(PENDING_COOKIE, signEmail(email, pendingCookieOptions.maxAge), pendingCookieOptions);
  return response;
}
