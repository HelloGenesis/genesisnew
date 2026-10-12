"use client";

import { useEffect, useState } from "react";

/**
 * THE TICK-BOXES' BAR (Genesis, 12 Oct 2026: "a tick to select influencers to
 * add or make a customised plan"). Counts what's ticked in its form, ticks or
 * clears every row, and submits the form: a new influencer plan with them.
 */
export function PickBar({ formId, label = "Make a plan with these" }: { formId: string; label?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const update = () => setCount(form.querySelectorAll('input[name="creators"]:checked').length);
    form.addEventListener("change", update);
    update();
    return () => form.removeEventListener("change", update);
  }, [formId]);
  const setAll = (on: boolean) => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    form?.querySelectorAll<HTMLInputElement>('input[name="creators"]').forEach((box) => (box.checked = on));
    setCount(on ? (form?.querySelectorAll('input[name="creators"]').length ?? 0) : 0);
  };
  return (
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float)] px-4 py-2.5 shadow-[var(--shadow-float)]">
      <span className="text-[0.875rem] text-ash">
        <b className="text-bone">{count}</b> selected ·{" "}
        <button type="button" onClick={() => setAll(true)} className="crm-link">tick all shown</button> ·{" "}
        <button type="button" onClick={() => setAll(false)} className="crm-link">clear</button>
      </span>
      <button form={formId} disabled={count === 0} className="crm-btn crm-btn-primary crm-btn-sm disabled:opacity-50">
        {label} →
      </button>
    </div>
  );
}
