"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/* The site's yellow button (the CRM's crm-btn styles aren't loaded on the public pages). */
const BUTTON = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ffc516] px-6 text-body font-medium text-[#141216] shadow-[0_10px_30px_-10px_rgb(255_197_22/0.6)] transition-transform hover:scale-[1.02] disabled:opacity-60";
const FIELD = "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-3 text-body text-bone placeholder:text-faint focus:border-[#ffc516] focus:outline-none";
const STEPS = [
  ["Today", "Your own Nova CRM, everything switched on. No card."],
  ["Day 3", "Choose a plan and add your card. You pay ₹0."],
  ["Day 14", "Your trial ends and the plan starts. Cancel any time before."],
] as const;

/**
 * START A 14-DAY FREE TRIAL (lib/crm/nova-trial; Genesis, 31 Oct 2026). Name,
 * email, phone and agency: the CRM is made at once and the sign-in link
 * emailed. How the 14 days go is said up front.
 */
export function NovaTrialForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (form: FormData) => {
    setBusy(true);
    setError(null);
    const body = { name: form.get("name"), email: form.get("email"), phone: form.get("phone"), company: form.get("company"), agreed: form.get("agreed") === "on" };
    try {
      const res = await fetch("/api/nova-trial", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setDone(String(body.email));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-start">
      <div>
        <h2 id="trial-heading" className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">Start your 14-day free trial</h2>
        <p className="mt-4 max-w-xl text-pretty text-body leading-relaxed text-ash">Your own Nova CRM in a minute, with your team, brands and creators. No card to start.</p>
        <ol className="mt-8 space-y-4">
          {STEPS.map(([when, what]) => (
            <li key={when} className="flex gap-4">
              <span className="w-16 shrink-0 text-small font-medium text-[#ffc516]">{when}</span>
              <span className="text-small text-ash">{what}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-small text-faint">We email you before every step.</p>
      </div>
      {done ? (
        <div className="glass glass-lit rounded-card p-6">
          <Check className="size-6 text-[#ffc516]" aria-hidden />
          <h3 className="mt-3 text-lead text-bone">Your trial has started</h3>
          <p className="mt-2 text-small text-ash">We&apos;ve emailed {done} with the details. Sign in with that email (Google or a one-time code) to open your CRM.</p>
          <Link href="/login?next=/admin" className={`${BUTTON} mt-5`}>Sign in now</Link>
        </div>
      ) : (
        <form action={submit} className="glass glass-lit space-y-3 rounded-card p-6">
          <input name="name" required maxLength={100} placeholder="Your name" autoComplete="name" className={FIELD} />
          <input name="email" type="email" required maxLength={200} placeholder="Work email" autoComplete="email" className={FIELD} />
          <input name="phone" type="tel" required maxLength={20} placeholder="Phone" autoComplete="tel" className={FIELD} />
          <input name="company" required maxLength={160} placeholder="Agency name" autoComplete="organization" className={FIELD} />
          <label className="flex items-start gap-2 pt-1 text-[0.8125rem] text-ash">
            <input type="checkbox" name="agreed" required className="mt-0.5" />
            <span>
              I agree to the <Link href="/terms" target="_blank" className="underline">Terms</Link> and <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>.
            </span>
          </label>
          {error && <p className="text-[0.8125rem] text-[#dc2626]">{error}</p>}
          <button type="submit" disabled={busy} className={`${BUTTON} w-full`}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Start free trial
          </button>
          <p className="text-center text-[0.75rem] text-faint">No card today · cancel any time</p>
        </form>
      )}
    </div>
  );
}
