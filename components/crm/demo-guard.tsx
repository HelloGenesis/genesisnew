"use client";

import { useEffect, useState } from "react";

/**
 * NOVA'S LIVE DEMO IN THE CRM (lib/crm/demo): every page opens and every
 * screen works, but a form that would save stops here with a word about the
 * trial, before it reaches the server (which refuses it anyway). Search and
 * filter forms (GET) still run.
 */
export function DemoGuard() {
  const [note, setNote] = useState(false);
  useEffect(() => {
    const stop = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if ((form.getAttribute("method") ?? "").toLowerCase() === "get") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setNote(true);
    };
    document.addEventListener("submit", stop, true);
    return () => document.removeEventListener("submit", stop, true);
  }, []);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(false), 5000);
    return () => clearTimeout(t);
  }, [note]);
  return (
    <div role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--glass-border)] bg-[var(--surface-float)] py-2 pl-4 pr-2 text-[0.8125rem] text-bone shadow-[var(--shadow-float)] transition-all duration-300 ${note ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
      This is the Nova demo, so nothing is saved.
      <a href="/resellers#apply" target="_top" className="crm-btn crm-btn-primary crm-btn-sm">Book a trial</a>
    </div>
  );
}
