"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

export type NovaAi = { credits: number; free: number; packs: { credits: number; price: number }[]; demo: boolean; admin: boolean };

/**
 * NOVA AI's credits in the chat (lib/crm/nova-ai): how many are left, and
 * the top-up packs (a Razorpay payment link, back to NOVA AI once paid).
 * `open` shows the packs straight away, when a request found none left.
 */
export function NovaAiCredits({ nova, open = false, compact = false }: { nova: NovaAi; open?: boolean; compact?: boolean }) {
  const [show, setShow] = useState(open);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buy = async (i: number) => {
    setBusy(i);
    setError(null);
    const res = await fetch("/api/crm/nova-ai/topup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pack: i }) });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && data.url) return window.location.assign(data.url);
    setError(data.error ?? "The top-up couldn't be started.");
    setBusy(null);
  };
  const left = nova.demo ? 0 : nova.credits;
  return (
    <div className={compact ? "" : "mx-3 mb-3 rounded-xl border border-[var(--glass-border)] px-3 py-2.5"}>
      <div className="flex items-center justify-between gap-2 text-[0.75rem]">
        <span className="flex items-center gap-1.5 text-ash"><Sparkles className="size-3.5 text-[#ffc516]" aria-hidden /> NOVA AI credits</span>
        <span className={`tabular-nums ${left ? "text-bone" : "text-[#ffc516]"}`}>{nova.demo ? "Not in the demo" : `${left} left`}</span>
      </div>
      {!nova.demo && (show || left === 0) ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-[0.75rem] text-ash">{left === 0 ? `Your ${nova.free} free requests are used. ` : ""}One credit is one request. Top up:</p>
          {nova.admin ? (
            nova.packs.map((p, i) => (
              <button key={i} type="button" onClick={() => buy(i)} disabled={busy !== null} className="flex w-full items-center justify-between rounded-lg border border-[var(--glass-border)] px-2.5 py-1.5 text-[0.75rem] text-bone hover:border-[#ffc516]/60 disabled:opacity-60">
                <span>{p.credits} credits</span>
                <span className="flex items-center gap-1 tabular-nums">{busy === i && <Loader2 className="size-3 animate-spin" aria-hidden />}₹{p.price.toLocaleString("en-IN")}</span>
              </button>
            ))
          ) : (
            <p className="text-[0.75rem] text-faint">Ask your agency&apos;s admin to top up.</p>
          )}
          {error && <p className="text-[0.75rem] text-[#dc2626]">{error}</p>}
        </div>
      ) : (
        !nova.demo && (
          <button type="button" onClick={() => setShow(true)} className="mt-1 text-[0.75rem] text-ash underline-offset-4 hover:text-bone hover:underline">Top up</button>
        )
      )}
    </div>
  );
}

/**
 * The credits as a pill in the chat's top corner (Genesis, 31 Oct 2026: "put
 * it here, in place of New chat, and make the colour nice"): NOVA's orb
 * colours, the count, and the top-up packs under it on a click.
 */
export function NovaAiPill({ nova }: { nova: NovaAi }) {
  const [open, setOpen] = useState(false);
  const low = nova.credits <= 1;
  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-full bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#ffc516] p-px shadow-[0_6px_24px_-8px_rgba(244,114,182,0.55)] transition-transform hover:scale-[1.03]"
      >
        <span className="flex items-center gap-2 rounded-full bg-[#1a1720] px-3.5 py-1.5 text-[0.8125rem]">
          <Sparkles className="size-3.5 text-[#f472b6]" aria-hidden />
          <span className="bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#ffc516] bg-clip-text font-medium text-transparent">NOVA AI</span>
          <span className={`tabular-nums ${low ? "text-[#ffc516]" : "text-bone"}`}>{nova.credits} credit{nova.credits === 1 ? "" : "s"}</span>
          <span className="text-ash">· Top up</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float,#1d1b1f)] p-3 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)]">
          <NovaAiCredits nova={nova} open compact />
        </div>
      )}
    </div>
  );
}
