"use client";

import { Lock, ShoppingBag } from "lucide-react";
import { useState, type FormEvent } from "react";

import { priceCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

import { CartLines, CartSummary, useCart } from "./cart";
import { GlassButton } from "./glass-button";
import { SectionLabel } from "./section-label";

/**
 * /cart — THE BASKET AND THE WAY TO PAY.
 *
 * Left: what is in the cart, editable, then who is buying. Right, sticky on
 * a wide screen: the total and the one button. Paying sends the cart to
 * /api/checkout, which prices it again and returns a Razorpay payment link
 * (or, until Razorpay keys are set, a WhatsApp message carrying the order),
 * and the browser goes there.
 */
export function CartPageView() {
  const { lines, ready } = useCart();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const totals = priceCart(lines);
  const onlyQuotes = totals.payable.length === 0 && totals.quoted.length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          customer: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            company: form.get("company"),
            notes: form.get("notes"),
          },
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Payment could not be started.");
      window.location.assign(result.url);
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Payment could not be started.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-[var(--section-pad)] pt-32 sm:pt-40">
      <SectionLabel dot tone="brand">
        Checkout
      </SectionLabel>
      <h1 className="mt-5 text-h2 font-normal leading-[1.05] tracking-tight text-bone">
        Your cart<span className="font-serif italic text-brand-ink">.</span>
      </h1>

      {!ready ? null : lines.length === 0 ? (
        <div className="glass glass-lit mt-10 flex flex-col items-center gap-4 rounded-panel px-6 py-16 text-center">
          <ShoppingBag className="size-8 text-faint" aria-hidden />
          <p className="text-body text-ash">Your cart is empty.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <GlassButton href="/pricing" variant="brand" arrow>
              Explore Memberships
            </GlassButton>
            <GlassButton href="/ai-content-automation" variant="glass" arrow>
              Try AI Content Starter
            </GlassButton>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.9fr] lg:items-start">
          <div className="grid gap-6">
            <section aria-labelledby="cart-items" className="glass glass-lit rounded-panel px-5 py-2 sm:px-7">
              <h2 id="cart-items" className="sr-only">
                Items
              </h2>
              <CartLines />
            </section>

            <section aria-labelledby="cart-details" className="glass glass-lit rounded-panel p-5 sm:p-7">
              <h2 id="cart-details" className="font-sans text-lead text-bone">
                Your details
              </h2>
              <p className="mt-1 text-small text-ash">For your invoice and the payment link.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Name" name="name" autoComplete="name" required />
                <Field label="Company" name="company" autoComplete="organization" />
                <Field label="Email" name="email" type="email" autoComplete="email" required />
                <Field label="Phone" name="phone" type="tel" autoComplete="tel" required pattern="\+?[\d\s\-]{8,16}" />
                <Field label="Anything we should know?" name="notes" multiline className="sm:col-span-2" />
              </div>
            </section>
          </div>

          <aside className="glass glass-strong glass-lit rounded-panel p-5 sm:p-7 lg:sticky lg:top-28">
            <h2 className="font-sans text-lead text-bone">Order summary</h2>
            <div className="mt-5">
              <CartSummary />
            </div>
            <GlassButton
              type="submit"
              variant="brand"
              arrow
              className="mt-6 w-full"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Starting payment…" : onlyQuotes ? "Send request" : "Proceed to payment"}
            </GlassButton>
            {status === "error" && (
              <p role="alert" className="mt-3 text-small text-brand-ink">
                {error}
              </p>
            )}
            <p className="mt-4 flex items-start gap-2 text-[0.75rem] leading-relaxed text-faint">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Secure payment by Razorpay — UPI, cards, net banking and wallets. A GST invoice follows by email.
            </p>
          </aside>
        </form>
      )}
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  multiline = false,
  autoComplete,
  pattern,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  autoComplete?: string;
  pattern?: string;
  className?: string;
}) {
  const id = `cart-${name}`;
  const shared =
    "w-full rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] px-4 py-3 text-small text-bone placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand";
  return (
    <div className={cn(className)}>
      <label htmlFor={id} className="micro-label mb-2 block">
        {label}
        {required && <span className="ml-1 text-brand-ink">*</span>}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={3} maxLength={500} className={shared} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          pattern={pattern}
          className={shared}
        />
      )}
    </div>
  );
}
