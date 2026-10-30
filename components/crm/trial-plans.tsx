"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { openSubscriptionCheckout, type SubscriptionStart } from "@/components/genesis/razorpay-checkout";

export type PlanCard = { key: string; perMonth: number; total: number; blurb: string; features: readonly string[]; popular?: boolean };

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * THE TRIAL'S CARD STEP (lib/crm/nova-trial): pick a plan, then Razorpay
 * Checkout saves the card for a subscription that starts when the trial ends.
 * Said plainly before anything is asked: ₹0 today, the date and amount of
 * the first charge, and cancel any time before it.
 */
export function TrialPlans({ plans, firstCharge, admin, initial }: { plans: PlanCard[]; firstCharge: string; admin: boolean; initial?: string | null }) {
  const router = useRouter();
  const [picked, setPicked] = useState(initial ?? plans.find((p) => p.popular)?.key ?? plans[0]!.key);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = plans.find((p) => p.key === picked)!;

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/nova-trial/card", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan: picked }) });
      const data = (await res.json()) as SubscriptionStart & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      await openSubscriptionCheckout(
        data,
        () => setBusy(false),
        {},
        async (reply) => {
          await fetch("/api/crm/nova-trial/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(reply) });
          router.replace("/admin/plan?added=1");
          router.refresh();
        },
      );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <ul className="grid gap-3 md:grid-cols-3">
        {plans.map((p) => (
          <li key={p.key}>
            <button type="button" onClick={() => setPicked(p.key)} aria-pressed={picked === p.key} disabled={!admin} className={`flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-colors ${picked === p.key ? "border-[#ffc516] bg-[#ffc516]/[0.06]" : "border-[var(--glass-border)] hover:border-[var(--glass-border-strong,#555)]"}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-[1.0625rem] font-semibold text-bone">{p.key}</span>
                {p.popular && <span className="rounded-full bg-[#ffc516] px-2 py-0.5 text-[0.6875rem] font-medium text-[#141216]">Most chosen</span>}
              </span>
              <span className="mt-2 font-sans text-[1.5rem] font-semibold tabular-nums text-bone">{rupees(p.perMonth)}<span className="text-[0.875rem] font-normal text-ash"> a month</span></span>
              <span className="text-[0.75rem] text-faint">{rupees(p.total)} with 18% GST</span>
              <span className="mt-2 text-[0.8125rem] text-ash">{p.blurb}</span>
              <ul className="mt-3 space-y-1.5">
                {p.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex gap-2 text-[0.8125rem] text-ash">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#ffc516]" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </button>
          </li>
        ))}
      </ul>

      <div className="crm-card space-y-3 p-5">
        <p className="text-[1.0625rem] text-bone">
          You pay <b>₹0 today</b>. Your card is first charged <b>{rupees(plan.total)}</b> on <b>{firstCharge}</b>, when your trial ends, then monthly.
        </p>
        <p className="text-[0.8125rem] text-ash">Cancel any time before {firstCharge} from Plan & billing and you won&apos;t be charged. We&apos;ll email you two days before. Your bank may show a ₹5 card check, which Razorpay refunds straight away.</p>
        {admin ? (
          <>
            <label className="flex items-start gap-2 text-[0.8125rem] text-ash">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              <span>
                I agree to the <Link href="/terms" target="_blank" className="underline">Terms</Link> and <Link href="/refund-policy" target="_blank" className="underline">Cancellation & Refund Policy</Link>. The plan renews monthly until I cancel.
              </span>
            </label>
            {error && <p className="text-[0.8125rem] text-[#dc2626]">{error}</p>}
            <button type="button" onClick={add} disabled={!agreed || busy} className="crm-btn crm-btn-primary disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Add card for {plan.key} · ₹0 today
            </button>
          </>
        ) : (
          <p className="crm-notice">Only your agency&apos;s admin can choose the plan and add the card. Ask them to sign in.</p>
        )}
      </div>
    </div>
  );
}

/** Cancel, with a confirm: the trial or plan stops and nothing more is charged. */
export function CancelTrial({ label, until }: { label: string; until: string | null }) {
  const router = useRouter();
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    const res = await fetch("/api/crm/nova-trial/cancel", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "It couldn't be cancelled just now.");
      setBusy(false);
      return;
    }
    router.refresh();
  };
  if (!sure) return <button type="button" onClick={() => setSure(true)} className="crm-btn crm-btn-secondary crm-btn-sm">{label}</button>;
  return (
    <div className="space-y-2">
      <p className="text-[0.875rem] text-bone">Cancel? Nothing more will be charged{until ? `, and you can keep using Nova until ${until}` : ""}. We&apos;ll confirm by email.</p>
      {error && <p className="text-[0.8125rem] text-[#dc2626]">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={go} disabled={busy} className="crm-btn crm-btn-primary crm-btn-sm">{busy ? "Cancelling…" : "Yes, cancel"}</button>
        <button type="button" onClick={() => setSure(false)} className="crm-btn crm-btn-secondary crm-btn-sm">Keep it</button>
      </div>
    </div>
  );
}
