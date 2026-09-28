"use client";

import { Lock, MapPin, ShoppingBag } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { priceCart } from "@/lib/cart";
import { TERMS_VERSION } from "@/lib/legal-commerce";
import { enquiryHref } from "@/lib/pricing";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  DIAL_CODES,
  GSTIN_PATTERN,
  SHOOT_CITY,
  findCountry,
  shootNote,
  taxFor,
} from "@/lib/regions";
import { cn } from "@/lib/utils";

import { CartLines, CartSummary, useCart } from "./cart";
import { GlassButton } from "./glass-button";
import { SectionLabel } from "./section-label";

/** A phone number without its country code: digits, spaces, dashes. */
const LOCAL_PHONE = "[0-9][0-9\\s\\-]{5,14}";

const FIELD =
  "w-full rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] px-4 py-3 text-small text-bone placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand";

/**
 * /cart — THE BASKET AND THE WAY TO PAY.
 *
 * Left: what is in the cart, editable, then who is buying and where. Right,
 * sticky on a wide screen: the total and the one button. Paying sends the
 * cart to /api/checkout, which prices it again and returns a Razorpay payment
 * link (or, until Razorpay keys are set, a WhatsApp message carrying the
 * order), and the browser goes there.
 *
 * THE COUNTRY DRIVES THE FORM (Genesis, 28 Sep 2026): its states in a
 * drop-down, its dialling code on both phone numbers, its postal code's
 * shape, and its tax — GST and a GSTIN in India, none on an export
 * elsewhere, with the buyer's own tax ID. See lib/regions.
 *
 * SHOOTS ARE MUMBAI ONLY, FOR NOW. A cart holding a Studios plan or anything
 * that needs a physical shoot asks where the shoot is, and only a Mumbai
 * shoot can check out; anywhere else is offered a conversation instead.
 */
type CheckoutResult = {
  mode?: "razorpay" | "razorpay-subscription" | "whatsapp";
  url?: string;
  error?: string;
  key?: string;
  subscriptionId?: string;
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
async function openSubscriptionCheckout(result: CheckoutResult, onDismiss: () => void) {
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
    handler: (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
      const query = new URLSearchParams({ ...response, reference: result.reference ?? "" });
      /* A full load, not a client push: the page verifies the signature on the server. */
      window.location.assign(new URL(`/cart/complete?${query.toString()}`, window.location.origin).href);
    },
    modal: { ondismiss: onDismiss },
  }).open();
}

export function CartPageView() {
  const { lines, ready } = useCart();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [phoneDial, setPhoneDial] = useState(findCountry(DEFAULT_COUNTRY).dial);
  const [businessDial, setBusinessDial] = useState(findCountry(DEFAULT_COUNTRY).dial);
  const [shootLocation, setShootLocation] = useState<"" | "mumbai" | "elsewhere">("");
  const [agreed, setAgreed] = useState(false);

  const country = findCountry(countryCode);
  const tax = taxFor(countryCode);
  const totals = priceCart(lines, { country: countryCode });
  const onlyQuotes = totals.payable.length === 0 && totals.quoted.length > 0;
  /* A shoot outside Mumbai — or a buyer abroad with a shoot in the cart — cannot check out yet. */
  const shootBlocked = totals.inPerson && (shootLocation === "elsewhere" || country.code !== "IN");

  function chooseCountry(code: string) {
    setCountryCode(code);
    const dial = findCountry(code).dial;
    if (dial !== "+") {
      setPhoneDial(dial);
      setBusinessDial(dial);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (shootBlocked) return;
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          agreed,
          termsVersion: TERMS_VERSION,
          customer: {
            ...Object.fromEntries(
              [
                "name",
                "designation",
                "email",
                "phone",
                "company",
                "taxId",
                "businessEmail",
                "businessPhone",
                "address",
                "city",
                "state",
                "postalCode",
                "website",
                "notes",
              ].map((key) => [key, String(form.get(key) ?? "").trim()]),
            ),
            country: countryCode,
            phoneDial,
            businessPhoneDial: businessDial,
            shootLocation: totals.inPerson ? shootLocation : "",
          },
        }),
      });
      const result = (await response.json()) as CheckoutResult;
      if (!response.ok) throw new Error(result.error ?? "Payment could not be started.");
      if (result.mode === "razorpay-subscription" && result.subscriptionId && result.key) {
        await openSubscriptionCheckout(result, () => setStatus("idle"));
        return;
      }
      if (!result.url) throw new Error(result.error ?? "Payment could not be started.");
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
            <GlassButton href="/pricing#one-time" variant="glass" arrow>
              See one-time products
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

            {/* Where the shoot is — only when something in the cart needs one. */}
            {totals.inPerson && (
              <section aria-labelledby="cart-shoot" className="glass glass-lit rounded-panel p-5 sm:p-7">
                <h2 id="cart-shoot" className="flex items-center gap-2 font-sans text-lead text-bone">
                  <MapPin className="size-4 text-brand-ink" aria-hidden />
                  Where is the shoot?
                </h2>
                <p className="mt-1 text-small text-ash">{shootNote}</p>
                <div role="radiogroup" aria-label="Shoot location" className="mt-5 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["mumbai", `${SHOOT_CITY} (incl. Navi Mumbai & Thane)`],
                      ["elsewhere", "Another city"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-card border px-4 py-3 text-small transition-colors",
                        shootLocation === value
                          ? "border-brand/60 bg-brand/[0.08] text-bone"
                          : "border-[var(--glass-border)] text-ash hover:text-bone",
                      )}
                    >
                      <input
                        type="radio"
                        name="shootLocation"
                        value={value}
                        required
                        checked={shootLocation === value}
                        onChange={() => setShootLocation(value)}
                        className="accent-[#ffc516]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {shootBlocked && (
                  <div role="alert" className="mt-4 rounded-card border border-brand/40 bg-brand/[0.06] p-4 text-small text-bone">
                    We only shoot in {SHOOT_CITY} for now, so Studios plans and shoots can&rsquo;t be checked out for
                    {country.code !== "IN" ? " a buyer outside India" : " another city"} yet. Remove them to buy the rest,
                    or{" "}
                    <a
                      href={enquiryHref("a shoot outside Mumbai")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-ink underline underline-offset-2"
                    >
                      talk to us about your city
                    </a>
                    .
                  </div>
                )}
              </section>
            )}

            <section aria-labelledby="cart-contact" className="glass glass-lit rounded-panel p-5 sm:p-7">
              <h2 id="cart-contact" className="font-sans text-lead text-bone">
                Contact person
              </h2>
              <p className="mt-1 text-small text-ash">Who we speak to about this order.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" name="name" autoComplete="name" required />
                <Field label="Designation" name="designation" autoComplete="organization-title" />
                <Field label="Email" name="email" type="email" autoComplete="email" required />
                <PhoneField label="Mobile number" name="phone" dial={phoneDial} onDial={setPhoneDial} required />
              </div>
            </section>

            <section aria-labelledby="cart-business" className="glass glass-lit rounded-panel p-5 sm:p-7">
              <h2 id="cart-business" className="font-sans text-lead text-bone">
                Business details
              </h2>
              <p className="mt-1 text-small text-ash">For your invoice and the payment link.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Company / legal name" name="company" autoComplete="organization" required />
                <Labelled label="Country" id="cart-country" required>
                  <select
                    id="cart-country"
                    name="country"
                    autoComplete="country"
                    value={countryCode}
                    onChange={(event) => chooseCountry(event.target.value)}
                    className={FIELD}
                  >
                    {COUNTRIES.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </Labelled>
                <Field
                  key={`tax-${country.code}`}
                  label={tax.idLabel}
                  name="taxId"
                  pattern={country.code === "IN" ? GSTIN_PATTERN : "[A-Za-z0-9 \\-\\/]{3,20}"}
                  hint={tax.idHint}
                  uppercase
                />
                <Field label="Business email" name="businessEmail" type="email" autoComplete="email" hint="Where the invoice goes." />
                <PhoneField label="Business phone" name="businessPhone" dial={businessDial} onDial={setBusinessDial} />
                <Field label="Website or Instagram" name="website" autoComplete="url" />
                <Field label="Billing address" name="address" autoComplete="street-address" required className="sm:col-span-2" />
                <Field label="City" name="city" autoComplete="address-level2" required />
                {country.states ? (
                  <Labelled key={`state-${country.code}`} label={country.stateLabel} id="cart-state" required>
                    <select id="cart-state" name="state" autoComplete="address-level1" required defaultValue="" className={FIELD}>
                      <option value="" disabled>
                        Choose…
                      </option>
                      {country.states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </Labelled>
                ) : (
                  <Field key={`state-${country.code}`} label={country.stateLabel} name="state" autoComplete="address-level1" />
                )}
                <Field
                  key={`postal-${country.code}`}
                  label={country.postalLabel}
                  name="postalCode"
                  autoComplete="postal-code"
                  required={!country.postalOptional}
                  pattern={country.postal ?? "[A-Za-z0-9 \\-]{2,10}"}
                />
                <Field label="Anything we should know?" name="notes" multiline className="sm:col-span-2" />
              </div>
            </section>
          </div>

          <aside className="glass glass-strong glass-lit rounded-panel p-5 sm:p-7 lg:sticky lg:top-28">
            <h2 className="font-sans text-lead text-bone">Order summary</h2>
            <div className="mt-5">
              <CartSummary country={countryCode} />
            </div>
            {/*
              THE BUYER'S AGREEMENT, TAKEN BEFORE PAYMENT (Genesis, 28 Sep
              2026: "a tick mark — I have read the agreement and agree to the
              terms"). Required; the server refuses an order without it and
              records the version accepted with the order.
            */}
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] p-4 text-small leading-relaxed text-ash">
              <input
                type="checkbox"
                name="agreed"
                required
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-1 size-4 shrink-0 accent-[#ffc516]"
              />
              <span>
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-bone underline underline-offset-2">
                  Terms &amp; Conditions
                </a>{" "}
                and the{" "}
                <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="text-bone underline underline-offset-2">
                  Cancellation &amp; Refund Policy
                </a>
                , and I have read the{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-bone underline underline-offset-2">
                  Privacy Policy
                </a>
                . I am authorised to place this order for the business named above.
              </span>
            </label>
            <GlassButton
              type="submit"
              variant="brand"
              arrow
              className="mt-4 w-full"
              disabled={status === "sending" || shootBlocked || !agreed}
            >
              {status === "sending" ? "Starting payment…" : onlyQuotes ? "Send request" : "Proceed to payment"}
            </GlassButton>
            {shootBlocked && (
              <p className="mt-3 text-small text-ash">Studios plans and shoots are Mumbai only for now — see above.</p>
            )}
            {status === "error" && (
              <p role="alert" className="mt-3 text-small text-brand-ink">
                {error}
              </p>
            )}
            <p className="mt-4 flex items-start gap-2 text-[0.75rem] leading-relaxed text-faint">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Secure payment by Razorpay — UPI, cards, net banking and wallets.{" "}
              {country.code === "IN" ? "A GST invoice follows by email." : "An export invoice follows by email."}
            </p>
          </aside>
        </form>
      )}
    </main>
  );
}

function Labelled({ label, id, required, children }: { label: string; id: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="micro-label mb-2 block">
        {label}
        {required && <span className="ml-1 text-brand-ink">*</span>}
      </label>
      {children}
    </div>
  );
}

/** A phone number with its dialling code — the code follows the country, and can be changed. */
function PhoneField({
  label,
  name,
  dial,
  onDial,
  required = false,
}: {
  label: string;
  name: string;
  dial: string;
  onDial: (dial: string) => void;
  required?: boolean;
}) {
  const id = `cart-${name}`;
  return (
    <Labelled label={label} id={id} required={required}>
      <div className="flex gap-2">
        <select
          aria-label={`${label} — country code`}
          value={dial}
          onChange={(event) => onDial(event.target.value)}
          className={cn(FIELD, "w-[6.5rem] shrink-0 px-3")}
        >
          {DIAL_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete={name === "phone" ? "tel-national" : "off"}
          required={required}
          pattern={LOCAL_PHONE}
          className={cn(FIELD, "min-w-0 flex-1")}
        />
      </div>
    </Labelled>
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
  hint,
  uppercase = false,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  autoComplete?: string;
  pattern?: string;
  hint?: string;
  uppercase?: boolean;
  className?: string;
}) {
  const id = `cart-${name}`;
  return (
    <div className={cn(className)}>
      <label htmlFor={id} className="micro-label mb-2 block">
        {label}
        {required && <span className="ml-1 text-brand-ink">*</span>}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={3} maxLength={500} className={FIELD} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          pattern={pattern}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(FIELD, uppercase && "uppercase")}
        />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.75rem] text-faint">
          {hint}
        </p>
      )}
    </div>
  );
}
