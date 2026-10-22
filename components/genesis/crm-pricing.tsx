"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CRM_PLAN_PRICES, crmCycleCharge, crmCycleTotal, crmPerMonth, type CrmBilling, type CrmPlan } from "@/lib/crm-plans";
import { openSubscriptionCheckout, type SubscriptionStart } from "./razorpay-checkout";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * THE THREE PLANS, PAID ON THE SPOT (Genesis, 14 Oct 2026: "this will have a
 * Razorpay payment directly"; "monthly will be 10% more than annual"). Annual
 * is the default and the lowest price per month, paid for the year; monthly
 * is 10% more. Choose a plan → a short form → Razorpay Checkout on a
 * subscription (app/api/crm-checkout) → /cart/complete?crm=1.
 */
export function CrmPricing({ compact = false }: { compact?: boolean }) {
  const [billing, setBilling] = useState<CrmBilling>("annual");
  const [chosen, setChosen] = useState<CrmPlan | null>(null);
  return (
    <div>
      <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-full border border-[var(--glass-border)] p-1">
        {([["annual", "Annual · lowest price"], ["monthly", "Monthly"]] as const).map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={billing === value} onClick={() => setBilling(value)} className={`rounded-full px-4 py-2 text-small transition-colors ${billing === value ? "bg-[#ffc516] text-[#141216]" : "text-ash hover:text-bone"}`}>
            {label}
          </button>
        ))}
      </div>
      <ul className={`${compact ? "mt-5 sm:grid-cols-3" : "mt-8 lg:grid-cols-3"} grid gap-4`}>
        {CRM_PLAN_PRICES.map((p) => {
          const popular = "popular" in p && p.popular;
          return (
            <li key={p.key} className={`glass glass-lit relative flex flex-col rounded-card ${compact ? "p-5" : "p-6 sm:p-7"} ${popular ? "ring-2 ring-[#ffc516]" : ""}`}>
              {popular && <span className="absolute -top-3 left-6 rounded-full bg-[#ffc516] px-3 py-1 text-[0.75rem] font-medium text-[#141216]">Most agencies pick this</span>}
              <h3 className={`${compact ? "text-body" : "text-lead"} font-semibold text-bone`}>{p.key}</h3>
              <p className="mt-1 text-small text-ash">{compact ? p.features.find((f) => /users/i.test(f)) : p.blurb}</p>
              <p className={`${compact ? "mt-4" : "mt-6"} flex items-baseline gap-1`}>
                <span className={`${compact ? "text-[1.75rem]" : "text-h3"} font-normal tabular-nums text-bone`}>{inr(crmPerMonth(p, billing))}</span>
                <span className="text-small text-ash">/ month</span>
              </p>
              <p className="mt-1 text-[0.8125rem] text-faint">
                {billing === "annual" ? `${inr(crmCycleCharge(p, "annual"))} billed yearly` : `Billed monthly · ${inr(crmPerMonth(p, "annual"))}/month on annual`} · + 18% GST
              </p>
              {/* The homepage keeps the cards small, as its other plan cards (Genesis, 22 Oct 2026): the full list is on /resellers. Tablet: two columns. */}
              <ul className={`mt-6 flex-1 gap-x-6 space-y-2.5 sm:grid sm:grid-cols-2 sm:space-y-0 sm:gap-y-2.5 lg:block lg:space-y-2.5 ${compact ? "hidden" : ""}`}>
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-small text-ash">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#ffc516]" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {compact && <div className="flex-1" />}
              <button type="button" onClick={() => setChosen(p)} className={`${compact ? "mt-5 h-10" : "mt-7 h-12"} inline-flex items-center justify-center rounded-full px-6 text-small font-medium transition-colors ${popular ? "bg-[#ffc516] text-[#141216] hover:bg-[#ffd24d]" : "border border-[var(--glass-border)] text-bone hover:bg-[var(--hover-wash)]"}`}>
                Choose {p.key}
              </button>
            </li>
          );
        })}
      </ul>
      <p className={`mt-6 text-small text-faint ${compact ? "hidden" : ""}`}>
        Prices exclude 18% GST. Annual is paid for the year upfront; monthly is 10% more, paid month by month. Pay by card, UPI AutoPay or netbanking through Razorpay. Resellers earn 20% of every payment from the agencies they bring, for the first 12 months.
      </p>
      {chosen && <CrmCheckout plan={chosen} billing={billing} onBilling={setBilling} onClose={() => setChosen(null)} />}
    </div>
  );
}

/** The buyer's details for the invoice, then Razorpay. */
function CrmCheckout({ plan, billing, onBilling, onClose }: { plan: CrmPlan; billing: CrmBilling; onBilling: (b: CrmBilling) => void; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const charge = crmCycleCharge(plan, billing);
  const total = crmCycleTotal(plan, billing);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (k: string) => String(form.get(k) ?? "").trim();
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/crm-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.key, billing, agreed, customer: { name: value("name"), email: value("email"), phone: value("phone"), company: value("company"), gstin: value("gstin").toUpperCase() } }),
      });
      const result = (await response.json()) as SubscriptionStart & { error?: string };
      if (!response.ok || !result.subscriptionId) throw new Error(result.error ?? "Payment could not be started.");
      await openSubscriptionCheckout(result, () => setStatus("idle"), { crm: "1" });
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
    }
  }

  const field = "mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--surface-base)] px-3 py-2.5 text-body text-bone outline-none focus:ring-2 focus:ring-[#ffc516]";
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="crm-checkout-title" className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="glass glass-strong relative w-full max-w-md space-y-4 rounded-card p-6 sm:p-7">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
          <X className="size-4" aria-hidden />
        </button>
        <div>
          <p className="micro-label">Genesis CRM</p>
          <h3 id="crm-checkout-title" className="mt-2 text-h3 font-normal text-bone">{plan.key}</h3>
        </div>
        <div role="radiogroup" aria-label="Billing" className="grid grid-cols-2 gap-2">
          {(["annual", "monthly"] as const).map((b) => (
            <button key={b} type="button" role="radio" aria-checked={billing === b} onClick={() => onBilling(b)} className={`rounded-xl border px-3 py-2 text-left text-small ${billing === b ? "border-[#ffc516] text-bone" : "border-[var(--glass-border)] text-ash"}`}>
              <span className="block font-medium">{b === "annual" ? "Annual" : "Monthly"}</span>
              <span className="tabular-nums">{inr(crmPerMonth(plan, b))}/month</span>
            </button>
          ))}
        </div>
        <label className="block text-small text-ash">Your name<input name="name" required autoComplete="name" className={field} /></label>
        <label className="block text-small text-ash">Work email<input name="email" type="email" required autoComplete="email" className={field} /></label>
        <label className="block text-small text-ash">Phone<input name="phone" type="tel" required autoComplete="tel" defaultValue="+91 " className={field} /></label>
        <label className="block text-small text-ash">Company<input name="company" required autoComplete="organization" className={field} /></label>
        <label className="block text-small text-ash">GSTIN <span className="text-faint">(optional, for a GST invoice)</span><input name="gstin" maxLength={15} className={`${field} uppercase`} /></label>
        <div className="rounded-xl border border-[var(--glass-border)] p-3 text-small">
          <p className="flex justify-between text-ash"><span>{billing === "annual" ? "12 months" : "1 month"}</span><span className="tabular-nums text-bone">{inr(charge)}</span></p>
          <p className="flex justify-between text-ash"><span>GST 18%</span><span className="tabular-nums text-bone">{inr(total - charge)}</span></p>
          <p className="mt-1 flex justify-between border-t border-[var(--glass-border)] pt-1 text-bone"><span>Today, then {billing === "annual" ? "every year" : "every month"}</span><span className="tabular-nums">{inr(total)}</span></p>
        </div>
        <label className="flex gap-2 text-[0.8125rem] text-ash">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-[#ffc516]" required />
          <span>I agree to the <Link href="/terms" target="_blank" className="underline">Terms</Link> and <Link href="/refund-policy" target="_blank" className="underline">Cancellation & Refund Policy</Link>. The plan renews until I cancel.</span>
        </label>
        {error && <p role="alert" className="text-small text-[#dc2626]">{error}</p>}
        <button disabled={status === "sending" || !agreed} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#ffc516] px-6 text-small font-medium text-[#141216] transition-colors hover:bg-[#ffd24d] disabled:opacity-60">
          {status === "sending" ? "Opening Razorpay…" : `Pay ${inr(total)} with Razorpay`}
        </button>
      </form>
    </div>
  );
}

/**
 * WHAT IT SAVES, IN YOUR OWN NUMBERS. No promised percentages: you say how
 * much time goes on spreadsheets, copying briefs, chasing follow-ups and
 * building quotes, and how much of it you'd expect to win back.
 */
export function SavingsCalculator() {
  const [people, setPeople] = useState(5);
  const [hours, setHours] = useState(6);
  const [rate, setRate] = useState(400);
  const [share, setShare] = useState(40);
  const r = useMemo(() => {
    const monthlyHours = people * hours * 4.33 * (share / 100);
    const money = monthlyHours * rate;
    const plan = people <= 5 ? CRM_PLAN_PRICES[0] : people <= 15 ? CRM_PLAN_PRICES[1] : CRM_PLAN_PRICES[2];
    return { monthlyHours, money, plan, times: money / plan.rate };
  }, [people, hours, rate, share]);
  const field = (label: string, value: number, set: (n: number) => void, min: number, max: number, step: number, suffix: string) => (
    <label className="block">
      <span className="flex items-baseline justify-between text-small text-ash">
        {label}
        <span className="tabular-nums text-bone">{value.toLocaleString("en-IN")}{suffix}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-[#ffc516]" />
    </label>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="glass glass-lit space-y-5 rounded-card p-6 sm:p-7">
        {field("People on your team", people, setPeople, 1, 50, 1, "")}
        {field("Hours each spends a week on sheets, copying briefs, follow-ups and quotes", hours, setHours, 1, 20, 1, " h")}
        {field("What an hour of their time costs you", rate, setRate, 150, 2000, 50, " ₹")}
        {field("Share of that time you'd expect to win back", share, setShare, 10, 80, 5, "%")}
      </div>
      <div className="glass glass-strong glass-lit flex flex-col justify-center rounded-card p-6 sm:p-7">
        <p className="text-small text-ash">Every month, that&apos;s about</p>
        <p className="mt-2 text-h2 font-normal tabular-nums text-bone">{Math.round(r.monthlyHours).toLocaleString("en-IN")} hours</p>
        <p className="text-lead text-ash">back for your team, worth about <span className="text-bone">{inr(r.money)}</span></p>
        <p className="mt-5 border-t border-[var(--glass-border)] pt-4 text-small text-ash">
          {r.plan.key} costs {inr(r.plan.rate)} a month{r.times >= 1 ? <>, so it pays for itself about <span className="text-bone">{r.times.toFixed(1)}×</span>.</> : "."} Your numbers, your estimate. Change them to see.
        </p>
      </div>
    </div>
  );
}
