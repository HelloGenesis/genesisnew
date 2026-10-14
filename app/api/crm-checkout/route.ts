import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { crmCycleCharge, crmCycleTotal, crmPerMonth, findCrmPlan } from "@/lib/crm-plans";
import { recordCrmCheckout } from "@/lib/crm/orders";
import { TERMS_VERSION } from "@/lib/legal-commerce";
import { inr } from "@/lib/money";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { RazorpayError, notes, razorpay, razorpayKeys } from "@/lib/razorpay";

/**
 * GENESIS CRM CHECKOUT (Genesis, 14 Oct 2026: "this will have a Razorpay
 * payment directly"). A plan and billing from the pricing cards, the buyer's
 * details, and back comes a Razorpay subscription for Checkout to open.
 *
 * Priced HERE from lib/crm-plans, whatever the browser says: annual is twelve
 * months at the plan's rate, paid yearly; monthly is 10% more, paid monthly.
 * GST (18%) on top. The subscription runs until cancelled; the webhook
 * (lib/crm/orders) records the payment and tells the team to set up the
 * workspace.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

const bodySchema = z.object({
  plan: z.string().max(20),
  billing: z.enum(["annual", "monthly"]),
  agreed: z.literal(true),
  customer: z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,16}$/),
    company: z.string().trim().min(1).max(160),
    gstin: z.union([z.literal(""), z.string().trim().toUpperCase().regex(GSTIN)]).optional().default(""),
  }),
});

export async function POST(request: Request) {
  const limited = await checkRateLimit(rateLimitKey(request, "crm-checkout"));
  if (!limited.success) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.at(-1);
    const why: Record<string, string> = { gstin: "That GSTIN doesn't look right (15 characters, e.g. 27ABCDE1234F1Z5), or leave it blank.", phone: "Please check the phone number.", email: "Please check the email address.", agreed: "Please accept the terms to continue." };
    return NextResponse.json({ error: why[String(field)] ?? "Please fill in your name, email, phone and company." }, { status: 400 });
  }
  const { billing, customer } = parsed.data;
  const plan = findCrmPlan(parsed.data.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  if (!razorpayKeys()) return NextResponse.json({ error: "Online payment isn't switched on yet. Please message us on WhatsApp and we'll send a payment link." }, { status: 503 });

  const charge = crmCycleCharge(plan, billing);
  const total = crmCycleTotal(plan, billing);
  const annual = billing === "annual";
  const reference = `GM-CRM-${Date.now().toString(36)}-${randomBytes(2).toString("hex")}`.toUpperCase();
  const consent = `Accepted Terms & Conditions and Cancellation & Refund Policy (version ${TERMS_VERSION}) on ${new Date().toISOString()}`;
  const contact = customer.phone.replace(/[\s-]/g, "");
  const describe = `Genesis CRM ${plan.key} · ${annual ? `${inr(crmPerMonth(plan, "annual"))} a month, billed yearly` : "billed monthly"}`;

  try {
    const made = await razorpay<{ id: string }>("plans", {
      period: annual ? "yearly" : "monthly",
      interval: 1,
      item: { name: `Genesis CRM ${plan.key} (${billing})`, amount: total * 100, currency: "INR", description: `${describe}, GST 18% included` },
      notes: { reference },
    });
    const subscription = await razorpay<{ id: string; short_url?: string }>("subscriptions", {
      plan_id: made.id,
      /* "Until cancelled": the longest run Razorpay needs a number for — ten years. */
      total_count: annual ? 10 : 120,
      quantity: 1,
      customer_notify: 1,
      notes: notes({
        reference,
        product: `Genesis CRM ${plan.key}`,
        billing: `${billing}: ${inr(total)} ${annual ? "a year" : "a month"} (${inr(charge)} + GST ${inr(total - charge)})`,
        company: customer.company,
        tax_id: customer.gstin && `GSTIN ${customer.gstin}`,
        contact: `${customer.name} · ${customer.email} · ${customer.phone}`,
        consent,
      }),
    });

    const partnerCode = request.headers.get("cookie")?.match(/(?:^|;\s*)gm_partner=([A-Za-z0-9-]+)/)?.[1] ?? null;
    await recordCrmCheckout({
      reference,
      plan: plan.key,
      billing,
      chargeRupees: charge,
      totalRupees: total,
      consent,
      partnerCode,
      razorpaySubscriptionId: subscription.id,
      customer: { name: customer.name, email: customer.email, phone: customer.phone, company: customer.company, taxId: customer.gstin ? `GSTIN ${customer.gstin}` : undefined, address: "" },
    }).catch((error) => console.error("[crm-checkout] CRM record failed", error));

    return NextResponse.json({
      mode: "razorpay-subscription",
      key: razorpayKeys()!.id,
      subscriptionId: subscription.id,
      url: subscription.short_url,
      reference,
      description: describe,
      prefill: { name: customer.name, email: customer.email, contact },
    });
  } catch (error) {
    console.error("[crm-checkout] Razorpay failed", error instanceof RazorpayError ? `${error.status} ${error.body}` : error);
    return NextResponse.json({ error: "Payment could not be started. Please try again, or message us on WhatsApp." }, { status: 502 });
  }
}
