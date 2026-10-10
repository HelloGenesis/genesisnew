"use server";

import { headers } from "next/headers";

import { acceptQuote } from "@/lib/crm/quotes";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export type AcceptState = { ok: boolean; message: string; paymentUrl?: string | null } | null;

/** The client accepts on the quote's own page (the token in the link is the permission). */
export async function acceptQuoteAction(_: AcceptState, form: FormData): Promise<AcceptState> {
  const ip = clientIp(await headers());
  if (!(await checkRateLimit(`quote-accept:${ip}`)).success) return { ok: false, message: "Please wait a minute and try again." };
  const token = String(form.get("token") ?? "");
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  if (!name) return { ok: false, message: "Type your name to accept." };
  if (form.get("agree") !== "on") return { ok: false, message: "Tick that you agree to the terms." };
  const result = await acceptQuote(token, name);
  if (!result) return { ok: false, message: "This quote can't be accepted any more. It may have expired; reply to the email and we'll send a fresh one." };
  return { ok: true, message: "Accepted. Thank you! The team has been told and your project is open.", paymentUrl: result.paymentUrl };
}
