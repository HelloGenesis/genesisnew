import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { priceCart } from "@/lib/cart";
import { TERMS_VERSION } from "@/lib/legal-commerce";
import { COUNTRIES, SHOOT_CITY, findCountry, validPostal } from "@/lib/regions";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { RazorpayError, notes, razorpay, razorpayKeys } from "@/lib/razorpay";
import { whatsappLink } from "@/lib/site-config";

/**
 * CHECKOUT — turns a cart into a Razorpay payment link and hands back its URL.
 *
 * The browser sends ids, quantities and billing only. The order is priced
 * HERE from lib/cart, so what Razorpay charges is what the site's own price
 * lists say, whatever the browser claims.
 *
 * WITH RAZORPAY KEYS (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET):
 *   - a cart with a MEMBERSHIP becomes a Razorpay SUBSCRIPTION that runs until
 *     cancelled, its one-time products added to the first invoice; the
 *     browser opens Razorpay Checkout on it;
 *   - a cart of ONE-TIME products only becomes a Payment Link for the total.
 * Both carry GST and every saving, and come back to /cart/complete.
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
        /* Longer videos, adaptations and add-ons — clamped again by priceCart (lib/extras). */
        extras: z
          .object({
            extendSteps: z.number().int().min(0).max(10).optional(),
            extendVideos: z.number().int().min(0).max(200).optional(),
            adaptations: z.number().int().min(0).max(50).optional(),
            addOns: z.record(z.string().max(80), z.number().int().min(0).max(50)).optional(),
          })
          .optional(),
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
          /* The extras, so the team sees what to make: "[+30 sec on 2 videos, 1 adaptation]". */
          line.extraLines.length ? `[${line.extraLines.map((extra) => extra.label).join(", ")}]` : "",
        ]
          .filter(Boolean)
          .join(" "),
      )
      .join("; ");
  const items = describe(order.payable);
  const quotes = describe(order.quoted);

  /* No keys, or nothing to pay for yet: send the order on WhatsApp. */
  if (!razorpayKeys() || order.total <= 0) {
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
  const contactPhone = `${customer.phoneDial}${customer.phone.replace(/[\s-]/g, "")}`;
  const contact = `${customer.name}${customer.designation ? ` (${customer.designation})` : ""} · ${customer.email} · ${phone}`;

  try {
    /*
      A MEMBERSHIP IN THE CART → A RAZORPAY SUBSCRIPTION (Genesis, 29 Sep
      2026: memberships run until cancelled). One plan is made for this order
      — the memberships' charge per cycle, tax included, every month or every
      three — and the one-time products ride on the first invoice as an
      add-on, so the buyer authorises once and pays everything together. The
      browser opens Razorpay Checkout on the subscription and comes back to
      /cart/complete with a signature.
    */
    if (order.recurring.total > 0 && order.billing) {
      const quarterly = order.billing === "quarterly";
      const memberships = order.payable.filter((line) => line.product.kind === "membership");
      const planName = `Genesis: ${memberships.map((line) => `${line.product.group} ${line.product.name}`).join(" + ")}`;
      const cycle = quarterly ? "every 3 months" : "every month";

      const plan = await razorpay<{ id: string }>("plans", {
        period: "monthly",
        interval: quarterly ? 3 : 1,
        item: {
          name: planName.slice(0, 120),
          amount: order.recurring.total * 100, // paise
          currency: "INR",
          description: clip(`${order.billing} subscription, ${order.taxLabel} included`),
        },
        notes: { reference },
      });

      const subscription = await razorpay<{ id: string; short_url?: string }>("subscriptions", {
        plan_id: plan.id,
        /* "Until cancelled": the longest run Razorpay needs a number for — ten years. */
        total_count: quarterly ? 40 : 120,
        quantity: 1,
        customer_notify: 1,
        ...(order.oneTime.total > 0
          ? {
              addons: [
                {
                  item: {
                    name: "Pay-per-project work (first invoice)",
                    amount: order.oneTime.total * 100,
                    currency: "INR",
                  },
                },
              ],
            }
          : {}),
        notes: notes({
          reference,
          items,
          billing: `${order.billing}: ${inr(order.recurring.total)} ${cycle} (${order.taxLabel} ${inr(order.recurring.tax)})`,
          one_time: order.oneTime.total > 0 && `${inr(order.oneTime.total)} on the first invoice (${order.taxLabel} ${inr(order.oneTime.tax)})`,
          savings: `bundle ${inr(order.discount)} · combo ${inr(order.comboDiscount)} (combo every cycle)`,
          quote_requests: quotes,
          company: customer.company,
          tax_id: customer.taxId && `${taxIdLabel} ${customer.taxId}`,
          contact,
          business: [customer.businessEmail, businessPhone].filter(Boolean).join(" · "),
          billing_address: `${customer.address}, ${place}`,
          consent,
          buyer_notes: [customer.website && `Website: ${customer.website}`, customer.notes].filter(Boolean).join(" · "),
        }),
      });

      return NextResponse.json({
        mode: "razorpay-subscription",
        key: razorpayKeys()!.id,
        subscriptionId: subscription.id,
        /* Razorpay's own page for the same subscription — used if Checkout cannot load. */
        url: subscription.short_url,
        reference,
        description: `${memberships.map((line) => line.product.name).join(" + ")} · ${order.billing}`,
        prefill: { name: customer.name, email: customer.email, contact: contactPhone },
      });
    }

    /* ONE-TIME PRODUCTS ONLY → A PAYMENT LINK for the total, as before. */
    const link = await razorpay<{ short_url?: string }>("payment_links", {
      amount: order.total * 100, // paise
      currency: "INR",
      accept_partial: false,
      reference_id: reference,
      description: clip(`Genesis Media: ${items}`),
      customer: { name: customer.name, email: customer.email, contact: contactPhone },
      notify: { sms: true, email: true },
      reminder_enable: true,
      /* Razorpay allows 15 notes of up to 256 characters — enough to fulfil the order from the dashboard. */
      notes: notes({
        items,
        quote_requests: quotes,
        subtotal: inr(order.subtotal),
        bundle_saving: inr(order.discount),
        combo_saving: inr(order.comboDiscount),
        tax: `${order.taxLabel}: ${inr(order.gst)}`,
        company: customer.company,
        tax_id: customer.taxId && `${taxIdLabel} ${customer.taxId}`,
        contact,
        business_email: customer.businessEmail,
        business_phone: businessPhone,
        billing_address: customer.address,
        place,
        consent,
        buyer_notes: [customer.website && `Website: ${customer.website}`, customer.notes].filter(Boolean).join(" · "),
      }),
      callback_url: `${origin}/cart/complete`,
      callback_method: "get",
    });
    if (!link.short_url) throw new Error("No payment link returned");
    return NextResponse.json({ mode: "razorpay", url: link.short_url, reference });
  } catch (error) {
    console.error(
      "[checkout] Razorpay failed",
      error instanceof RazorpayError ? `${error.status} ${error.body}` : error,
    );
    return NextResponse.json({ error: "Payment could not be started. Please try again, or message us on WhatsApp." }, { status: 502 });
  }
}
