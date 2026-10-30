"use client";

/** What a checkout route hands back to open Razorpay Checkout on a subscription (the cart's and Genesis CRM's). */
export type SubscriptionStart = {
  key?: string;
  subscriptionId?: string;
  url?: string;
  reference?: string;
  description?: string;
  prefill?: { name: string; email: string; contact: string };
};

type RazorpayCheckout = new (options: Record<string, unknown>) => { open: () => void };

/** Razorpay's Checkout script, loaded once, on demand — only a buyer paying for a membership needs it. */
function loadRazorpay(): Promise<RazorpayCheckout | undefined> {
  const existing = (window as unknown as { Razorpay?: RazorpayCheckout }).Razorpay;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve((window as unknown as { Razorpay?: RazorpayCheckout }).Razorpay);
    script.onerror = () => resolve(undefined);
    document.body.appendChild(script);
  });
}

/**
 * A MEMBERSHIP IS PAID IN RAZORPAY CHECKOUT, over the page: the buyer
 * authorises the subscription (card or UPI Autopay), pays the first cycle
 * and any one-time products, and comes back to /cart/complete with
 * Razorpay's signature. If the script cannot load — a blocker, a flaky
 * network — Razorpay's own page for the same subscription is the fallback.
 */
export type CheckoutReply = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };

/** `onPaid` instead of /cart/complete: Nova's trial card step checks the reply itself (components/crm/trial-plans). */
export async function openSubscriptionCheckout(result: SubscriptionStart, onDismiss: () => void, extra: Record<string, string> = {}, onPaid?: (reply: CheckoutReply) => void) {
  const Razorpay = await loadRazorpay();
  if (!Razorpay) {
    if (result.url) window.location.assign(result.url);
    else throw new Error("Payment could not be started.");
    return;
  }
  new Razorpay({
    key: result.key,
    subscription_id: result.subscriptionId,
    name: "Genesis Media",
    description: result.description,
    prefill: result.prefill,
    notes: { reference: result.reference },
    theme: { color: "#ffc516" },
    handler: (response: CheckoutReply) => {
      if (onPaid) return onPaid(response);
      const query = new URLSearchParams({ ...response, reference: result.reference ?? "", ...extra });
      /* A full load, not a client push: the page verifies the signature on the server. */
      window.location.assign(new URL(`/cart/complete?${query.toString()}`, window.location.origin).href);
    },
    modal: { ondismiss: onDismiss },
  }).open();
}

