import type { Metadata } from "next";

import { ClearCart } from "@/components/genesis/clear-cart";
import { GlassButton } from "@/components/genesis/glass-button";
import { SectionLabel } from "@/components/genesis/section-label";
import { bookingHref } from "@/lib/pricing";
import { signatureMatches } from "@/lib/razorpay";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

type Search = Promise<Record<string, string | string[] | undefined>>;

/**
 * WHERE RAZORPAY SENDS THE BUYER BACK — after a payment link, or after
 * Checkout on a membership's subscription.
 *
 * The query string says paid or not, and anyone can type a query string, so
 * it is believed only when its signature checks out, made with the key
 * secret over `link_id|reference_id|status|payment_id` for a link and
 * `payment_id|subscription_id` for a subscription. A verified
 * payment empties the cart; anything else says so and keeps it.
 * (The webhook, not this page, is the record of a sale.)
 */
export default async function CartCompletePage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const paymentId = get("razorpay_payment_id");
  const signature = get("razorpay_signature");
  /* A payment link signs `link_id|reference_id|status|payment_id`… */
  const linkId = get("razorpay_payment_link_id");
  const status = get("razorpay_payment_link_status");
  /* …a subscription paid in Checkout signs `payment_id|subscription_id`. */
  const subscriptionId = get("razorpay_subscription_id");
  const membership = Boolean(subscriptionId);
  const reference = membership ? get("reference") : get("razorpay_payment_link_reference_id");

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const paid = Boolean(
    secret &&
      signature &&
      (membership
        ? signatureMatches(`${paymentId}|${subscriptionId}`, signature, secret)
        : status === "paid" && signatureMatches(`${linkId}|${reference}|${status}|${paymentId}`, signature, secret)),
  );
  const orderName = reference ? `Order ${reference}` : "Your order";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-[var(--section-pad)] pt-32 text-center sm:pt-40">
      {paid && <ClearCart />}
      <SectionLabel dot tone="brand" className="justify-center">
        {paid ? "Payment received" : "Payment not completed"}
      </SectionLabel>
      <h1 className="mt-5 text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone">
        {paid ? (
          <>
            Welcome to Genesis<span className="font-serif italic text-brand-ink">.</span>
          </>
        ) : (
          "Your cart is still here."
        )}
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-pretty text-body leading-relaxed text-ash">
        {paid
          ? membership
            ? `${orderName} is confirmed and your subscription is active. It renews automatically until you cancel; Razorpay emails a receipt for every payment. The team will reach out within one working day to book your onboarding call.`
            : `${orderName} is confirmed. Your receipt is on its way by email, and the team will reach out within one working day to book your onboarding call.`
          : "The payment didn't go through, or was cancelled. Nothing has been charged. You can try again whenever you're ready."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {paid ? (
          <GlassButton href={bookingHref("my onboarding")} variant="brand" arrow>
            Book your onboarding call
          </GlassButton>
        ) : (
          <GlassButton href="/cart" variant="brand" arrow>
            Back to cart
          </GlassButton>
        )}
        <GlassButton href="/" variant="glass" arrow>
          Back to the site
        </GlassButton>
      </div>
    </main>
  );
}
