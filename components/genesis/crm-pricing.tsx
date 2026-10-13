"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * GENESIS CRM PLANS (Genesis, 13 Oct 2026: "add a pricing page… three options,
 * monthly and annual"). Prices exclude GST; annual is ten months' price for
 * twelve. Choosing a plan opens the application with it filled in — the
 * workspace is set up on a short call, then billed by Razorpay.
 */

export const CRM_PLAN_PRICES = [
  {
    key: "Starter",
    monthly: 4999,
    blurb: "For a small agency getting off spreadsheets.",
    features: ["Up to 5 users", "Leads & pipeline, tasks, team roles", "Influencer database with Excel & Google Sheets import", "Quotes, proposals & influencer plans (PDF, Excel)", "GST tax invoices", "Email support"],
  },
  {
    key: "Growth",
    monthly: 9999,
    popular: true,
    blurb: "For a working agency with brands to look after.",
    features: ["Everything in Starter", "Up to 15 users", "AI inbox: briefs in Gmail & Drive become leads (2,000 a month)", "Live Google Sheets, internal & external", "Client portal for your brands", "WhatsApp & email outreach templates", "Your logo (white-label)", "Priority support on WhatsApp"],
  },
  {
    key: "Scale",
    monthly: 24999,
    blurb: "For agency networks, and brands with many agencies.",
    features: ["Everything in Growth", "Up to 50 users", "Brands with several agencies in one place", "10,000 AI reads a month", "Your own domain", "Onboarding and data import included", "A dedicated account manager"],
  },
] as const;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function CrmPricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <div>
      <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-full border border-[var(--glass-border)] p-1">
        {([[false, "Monthly"], [true, "Annual · 2 months free"]] as const).map(([value, label]) => (
          <button key={label} type="button" role="radio" aria-checked={annual === value} onClick={() => setAnnual(value)} className={`rounded-full px-4 py-2 text-small transition-colors ${annual === value ? "bg-[#ffc516] text-[#141216]" : "text-ash hover:text-bone"}`}>
            {label}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid gap-4 lg:grid-cols-3">
        {CRM_PLAN_PRICES.map((p) => {
          const yearly = p.monthly * 10;
          const popular = "popular" in p && p.popular;
          return (
            <li key={p.key} className={`glass glass-lit relative flex flex-col rounded-card p-6 sm:p-7 ${popular ? "ring-2 ring-[#ffc516]" : ""}`}>
              {popular && <span className="absolute -top-3 left-6 rounded-full bg-[#ffc516] px-3 py-1 text-[0.75rem] font-medium text-[#141216]">Most agencies pick this</span>}
              <h3 className="text-lead font-semibold text-bone">{p.key}</h3>
              <p className="mt-1 text-small text-ash">{p.blurb}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-h3 font-normal tabular-nums text-bone">{inr(annual ? yearly / 12 : p.monthly)}</span>
                <span className="text-small text-ash">/ month</span>
              </p>
              <p className="mt-1 text-[0.8125rem] text-faint">{annual ? `${inr(yearly)} billed yearly · you save ${inr(p.monthly * 2)}` : `or ${inr(yearly)} a year (2 months free)`} · + 18% GST</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-small text-ash">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#ffc516]" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href={`/resellers?plan=${p.key}&billing=${annual ? "annual" : "monthly"}#apply`} className={`mt-7 inline-flex h-12 items-center justify-center rounded-full px-6 text-small font-medium transition-colors ${popular ? "bg-[#ffc516] text-[#141216] hover:bg-[#ffd24d]" : "border border-[var(--glass-border)] text-bone hover:bg-[var(--hover-wash)]"}`}>
                Choose {p.key}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-small text-faint">Prices exclude 18% GST. Pay monthly or yearly by card, UPI AutoPay or netbanking through Razorpay; cancel any time. Resellers earn 20% of every payment from the agencies they bring, for the first 12 months.</p>
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
    return { monthlyHours, money, plan, times: money / plan.monthly };
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
          {r.plan.key} costs {inr(r.plan.monthly)} a month{r.times >= 1 ? <>, so it pays for itself about <span className="text-bone">{r.times.toFixed(1)}×</span>.</> : "."} Your numbers, your estimate. Change them to see.
        </p>
      </div>
    </div>
  );
}
