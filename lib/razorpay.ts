import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * RAZORPAY, SERVER SIDE — the few REST calls the site makes, and signature
 * checks. No SDK: four endpoints and an HMAC do not need one.
 *
 * Keys come from RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (test keys locally and
 * on previews, live keys in production only). The secret never leaves the
 * server; the key id is public and is handed to the browser for Checkout.
 */

export function razorpayKeys() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return id && secret ? { id, secret } : undefined;
}

export class RazorpayError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Razorpay ${status}`);
  }
}

export async function razorpay<T>(path: string, body: unknown): Promise<T> {
  const keys = razorpayKeys();
  if (!keys) throw new Error("Razorpay keys are not set");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keys.id}:${keys.secret}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new RazorpayError(response.status, await response.text().catch(() => ""));
  return (await response.json()) as T;
}

/** Constant-time HMAC-SHA256 check, hex. */
export function signatureMatches(payload: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Razorpay notes: at most 15 keys, each value at most 256 characters. */
export function notes(entries: Record<string, string | undefined | false>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (Object.keys(out).length === 15) break;
    out[key] = (value || "—").slice(0, 250);
  }
  return out;
}
