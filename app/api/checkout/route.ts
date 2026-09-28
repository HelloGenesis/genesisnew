import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { priceCart } from "@/lib/cart";
import { TERMS_VERSION } from "@/lib/legal-commerce";
import { COUNTRIES, SHOOT_CITY, findCountry, validPostal } from "@/lib/regions";
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

/* A number without its country code, and a dialling code on its own. */
const LOCAL_PHONE = /^[0-9][0-9\s-]{5,14}$/;
const DIAL = /^\+[0-9]{1,4}$/;
/* 2-digit state code, PAN, entity number, "Z", checksum. */
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
const TAX_ID = /^[A-Z0-9 \-/]{3,20}$/;

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
  /* The buyer's agreement to the terms of sale — required; see lib/legal-commerce. */
  agreed: z.literal(true),
  termsVersion: z.string().max(40).optional(),
  customer: z
    .object({
      /* The contact person. */
      name: z.string().trim().min(1).max(100),
      designation: z.string().trim().max(100).optional().default(""),
      email: z.string().trim().email().max(200),
      phoneDial: z.string().trim().regex(DIAL),
      phone: z.string().trim().regex(LOCAL_PHONE),
      /* The business, for the invoice. */
      company: z.string().trim().min(1).max(160),
      country: z.string().refine((code) => COUNTRIES.some((country) => country.code === code), "Unknown country"),
      taxId: z.string().trim().toUpperCase().max(20).optional().default(""),
      businessEmail: z.union([z.literal(""), z.string().trim().email().max(200)]).optional().default(""),
      businessPhoneDial: z.string().trim().regex(DIAL).optional().default("+91"),
      businessPhone: z.union([z.literal(""), z.string().trim().regex(LOCAL_PHONE)]).optional().default(""),
      address: z.string().trim().min(3).max(300),
      city: z.string().trim().min(2).max(80),
      state: z.string().trim().max(80).optional().default(""),
      postalCode: z.string().trim().max(12).optional().default(""),
      website: z.string().trim().max(200).optional().default(""),
      notes: z.string().trim().max(500).optional().default(""),
      /* Only asked when the cart has something that needs a physical shoot. */
      shootLocation: z.enum(["", "mumbai", "elsewhere"]).optional().default(""),
    })
    /* The country decides what the rest must look like — see lib/regions. */
    .superRefine((customer, ctx) => {
      const country = findCountry(customer.country);
      if (!validPostal(country, customer.postalCode)) {
        ctx.addIssue({ code: "custom", path: ["postalCode"], message: `Invalid ${country.postalLabel}` });
      }
      if (country.states && !country.states.includes(customer.state)) {
        ctx.addIssue({ code: "custom", path: ["state"], message: `Choose a ${country.stateLabel.toLowerCase()}` });
      }
      if (customer.taxId && !(country.code === "IN" ? GSTIN : TAX_ID).test(customer.taxId)) {
        ctx.addIssue({ code: "custom", path: ["taxId"], message: "Invalid tax ID" });
      }
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

  const { customer } = body;
  const country = findCountry(customer.country);
  const order = priceCart(body.lines, { country: country.code });
  if (order.lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  /* Shoots are Mumbai only, for now — the cart page says so; this is what enforces it. */
  if (order.inPerson && (country.code !== "IN" || customer.shootLocation !== "mumbai")) {
    return NextResponse.json(
      { error: `Studios plans and shoots are available in ${SHOOT_CITY} only, for now. Remove them to buy the rest, or message us about your city.` },
      { status: 400 },
    );
  }

  /* What was agreed, and when — kept with the order (Razorpay notes, or the WhatsApp message). */
  const consent = `Accepted Terms & Conditions and Cancellation & Refund Policy (version ${TERMS_VERSION}) on ${new Date().toISOString()}`;

  const phone = `${customer.phoneDial} ${customer.phone}`;
  const businessPhone = customer.businessPhone ? `${customer.businessPhoneDial} ${customer.businessPhone}` : "";
  const taxIdLabel = country.code === "IN" ? "GSTIN" : "Tax ID";
  const place = [customer.city, customer.state, customer.postalCode, country.name].filter(Boolean).join(", ");
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
      order.total > 0 &&
        `Total: ${inr(order.total)} (${order.taxLabel} ${inr(order.gst)})${order.discount ? ` (bundle saving ${inr(order.discount)})` : ""}${
          order.comboDiscount ? ` (AI + Studios combo saving ${inr(order.comboDiscount)})` : ""
        }`,
      quotes && `Please quote: ${quotes}`,
      `Contact: ${customer.name}${customer.designation ? ` (${customer.designation})` : ""} · ${customer.email} · ${phone}`,
      `Company: ${customer.company}${customer.taxId ? ` · ${taxIdLabel} ${customer.taxId}` : ""}`,
      (customer.businessEmail || businessPhone) &&
        `Business: ${[customer.businessEmail, businessPhone].filter(Boolean).join(" · ")}`,
      `Billing address: ${customer.address}, ${place}`,
      order.inPerson && `Shoot location: ${SHOOT_CITY}`,
      customer.website && `Website: ${customer.website}`,
      customer.notes && `Notes: ${customer.notes}`,
      consent,
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
      customer: { name: customer.name, email: customer.email, contact: `${customer.phoneDial}${customer.phone.replace(/[\s-]/g, "")}` },
      notify: { sms: true, email: true },
      reminder_enable: true,
      /* Razorpay allows 15 notes of up to 256 characters — enough to fulfil the order from the dashboard. */
      notes: {
        items: clip(items),
        quote_requests: clip(quotes || "—"),
        subtotal: inr(order.subtotal),
        bundle_saving: inr(order.discount),
        combo_saving: inr(order.comboDiscount),
        tax: `${order.taxLabel}: ${inr(order.gst)}`,
        company: clip(customer.company),
        tax_id: customer.taxId ? `${taxIdLabel} ${customer.taxId}` : "—",
        contact: clip(`${customer.name}${customer.designation ? ` (${customer.designation})` : ""}`),
        business_email: clip(customer.businessEmail || "—"),
        business_phone: clip(businessPhone || "—"),
        billing_address: clip(customer.address),
        place: clip(place),
        consent: clip(consent),
        buyer_notes: clip([customer.website && `Website: ${customer.website}`, customer.notes].filter(Boolean).join(" · ") || "—"),
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
