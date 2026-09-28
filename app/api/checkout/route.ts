import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { priceCart } from "@/lib/cart";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { whatsappLink } from "@/lib/site-config";

/**
 * CHECKOUT — turns a cart into a Razorpay payment link and hands back its URL.
 *
 * The browser sends ids, quantities and billing only. The order is priced
 * HERE from lib/cart, so what Razorpay charges is what the site's own price
 * lists say, whatever the browser claims.
 *
 * WITH RAZORPAY KEYS (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) it creates a
 * Payment Link for the total — GST and the bundle saving included — with the
 * buyer's details prefilled, and Razorpay sends them back to /cart/complete.
 *
 * WITHOUT THEM, or for a cart that is all "priced on request", it returns a
 * WhatsApp link carrying the order, so checkout still ends somewhere useful
 * while the keys are not set.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  lines: z
    .array(
      z.object({
        id: z.string().max(120),
        qty: z.number().int().min(1).max(99),
        billing: z.enum(["quarterly", "monthly"]).optional(),
      }),
    )
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().regex(/^\+?[\d\s-]{8,16}$/),
    company: z.string().trim().max(120).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
  }),
});

const inr = (value: number) => `Rs ${value.toLocaleString("en-IN")}`;

export async function POST(request: Request) {
  const limit = await checkRateLimit(rateLimitKey(request, "checkout"));
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Check your details and try again." }, { status: 400 });
  }

  const order = priceCart(body.lines);
  if (order.lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const { customer } = body;
  const describe = (lines: typeof order.lines) =>
    lines
      .map((line) =>
        [
          line.product.group,
          line.product.name,
          line.billing ? `(${line.billing})` : line.qty > 1 ? `x${line.qty}` : "",
        ]
          .filter(Boolean)
          .join(" "),
      )
      .join("; ");
  const items = describe(order.payable);
  const quotes = describe(order.quoted);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  /* No keys, or nothing to pay for yet: send the order on WhatsApp. */
  if (!keyId || !keySecret || order.total <= 0) {
    const message = [
      "Hi Genesis! I'd like to place this order:",
      items && `Items: ${items}`,
      order.total > 0 && `Total: ${inr(order.total)} incl. GST${order.discount ? ` (bundle saving ${inr(order.discount)})` : ""}`,
      quotes && `Please quote: ${quotes}`,
      `Name: ${customer.name}${customer.company ? `, ${customer.company}` : ""}`,
      `Email: ${customer.email} · Phone: ${customer.phone}`,
      customer.notes && `Notes: ${customer.notes}`,
    ]
      .filter(Boolean)
      .join("\n");
    return NextResponse.json({ mode: "whatsapp", url: whatsappLink(message) ?? "/#contact" });
  }

  /* Razorpay: reference_id is ours, unique per attempt, at most 40 characters. */
  const reference = `GM-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`.toUpperCase();
  const origin = new URL(request.url).origin;
  const clip = (value: string) => value.slice(0, 250);

  const response = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: order.total * 100, // paise
      currency: "INR",
      accept_partial: false,
      reference_id: reference,
      description: clip(`Genesis Media — ${items}`),
      customer: { name: customer.name, email: customer.email, contact: customer.phone.replace(/[\s-]/g, "") },
      notify: { sms: true, email: true },
      reminder_enable: true,
      /* Razorpay allows 15 notes of up to 256 characters — enough to fulfil the order from the dashboard. */
      notes: {
        items: clip(items),
        quote_requests: clip(quotes || "—"),
        subtotal: inr(order.subtotal),
        bundle_saving: inr(order.discount),
        gst: inr(order.gst),
        company: clip(customer.company || "—"),
        buyer_notes: clip(customer.notes || "—"),
      },
      callback_url: `${origin}/cart/complete`,
      callback_method: "get",
    }),
  });

  if (!response.ok) {
    console.error("[checkout] Razorpay payment link failed", response.status, await response.text().catch(() => ""));
    return NextResponse.json({ error: "Payment could not be started. Please try again, or message us on WhatsApp." }, { status: 502 });
  }

  const link = (await response.json()) as { short_url?: string };
  if (!link.short_url) {
    return NextResponse.json({ error: "Payment could not be started." }, { status: 502 });
  }
  return NextResponse.json({ mode: "razorpay", url: link.short_url, reference });
}
