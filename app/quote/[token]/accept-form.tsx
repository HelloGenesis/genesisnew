"use client";

import { useActionState } from "react";

import { type AcceptState, acceptQuoteAction } from "./actions";

export function AcceptForm({ token, plan, paymentUrl }: { token: string; plan: boolean; paymentUrl: string | null }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptQuoteAction, null);
  if (state?.ok)
    return (
      <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-[#14532d]">
        <p className="font-semibold">{state.message}</p>
        {state.paymentUrl && (
          <a href={state.paymentUrl} className="mt-3 inline-flex rounded-full bg-[#ffc516] px-5 py-2.5 font-semibold text-[#141216]">
            Pay now
          </a>
        )}
      </div>
    );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block text-[0.875rem] text-[#475569]">
        Your name
        <input name="name" required className="mt-1 block w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-[#0f172a]" />
      </label>
      <label className="flex items-start gap-2 text-[0.875rem] text-[#475569]">
        <input type="checkbox" name="agree" className="mt-1" /> I accept this {plan ? "plan" : "quotation"} and the legal terms above.
      </label>
      {state?.message && <p role="alert" className="text-[0.875rem] text-[#b91c1c]">{state.message}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className="rounded-full bg-[#0f172a] px-5 py-2.5 font-semibold text-white disabled:opacity-60">
          {pending ? "Accepting…" : plan ? "Approve this plan" : "Accept quotation"}
        </button>
        {paymentUrl && (
          <a href={paymentUrl} className="rounded-full bg-[#ffc516] px-5 py-2.5 font-semibold text-[#141216]">
            Accept & pay now
          </a>
        )}
      </div>
    </form>
  );
}
