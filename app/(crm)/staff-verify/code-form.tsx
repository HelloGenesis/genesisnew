"use client";

import { useActionState } from "react";

import { verifyStaffCode, type VerifyState } from "./actions";

export function CodeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyStaffCode, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="crm-label">6-digit code</span>
        <input
          name="code"
          className="crm-input text-center text-xl tabular-nums tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
        />
      </label>
      {state?.message && (
        <p className="crm-notice crm-notice-warn" role="alert">
          {state.message}
        </p>
      )}
      <button className="crm-btn crm-btn-primary w-full" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
