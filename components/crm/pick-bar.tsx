"use client";

import { useEffect, useState, useTransition } from "react";

import { draftFromCreators } from "@/app/(crm)/admin/actions/quotes";

/**
 * THE TICK-BOXES' BAR (Genesis, 12 Oct 2026: "a tick to select influencers to
 * add or make a customised plan"). Counts what's ticked in its form, ticks or
 * clears every row, and submits the form: a new influencer plan with them.
 */
export function PickBar({ formId, label = "Make a plan with these", excel = false }: { formId: string; label?: string; excel?: boolean }) {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const ticked = () => [...(document.getElementById(formId)?.querySelectorAll<HTMLInputElement>('input[name="creators"]:checked') ?? [])].map((b) => b.value);
  /* A draft plan of the ticked creators, kept in Quotes & plans; with both Google Sheets made when asked. */
  const draft = (then?: "sheets") => {
    setBusy(then === "sheets" ? "Making the sheets…" : "Saving…");
    start(async () => {
      const result = await draftFromCreators(ticked(), then);
      if (result && !result.ok) {
        window.alert(result.message);
        setBusy(null);
      }
    });
  };
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
      <span className="flex flex-wrap items-center gap-2">
        {/* The ticked creators as a plan in Excel, external or internal (Genesis, 13 Oct 2026); their rates as cost, +30% as price. */}
        {excel && (
          <>
            <button form={formId} formAction="/api/crm/plan-xlsx" name="which" value="ext" disabled={count === 0} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-50">Excel · external</button>
            <button form={formId} formAction="/api/crm/plan-xlsx" name="which" value="int" disabled={count === 0} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-50">Excel · internal</button>
            <button type="button" onClick={() => draft("sheets")} disabled={count === 0 || busy !== null} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-50">Google Sheets · int + ext</button>
            <button type="button" onClick={() => draft()} disabled={count === 0 || busy !== null} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-50">Save draft</button>
            {busy && <span className="text-[0.8125rem] text-ash" role="status">{busy}</span>}
          </>
        )}
        <button form={formId} disabled={count === 0} className="crm-btn crm-btn-primary crm-btn-sm disabled:opacity-50">
          {label} →
        </button>
      </span>
    </div>
  );
}
