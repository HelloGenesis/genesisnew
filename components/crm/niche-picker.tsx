"use client";

import { useState } from "react";

import { NICHES } from "@/lib/crm/niches";


/**
 * The niches, as chips to tap from the list above, plus any of your own. The
 * form still receives one comma-separated `niches` field, so saving is
 * unchanged.
 */
/* `options` and the two labels let the same chips pick languages too (Genesis, 22 Oct 2026). */
export function NichePicker({ name = "niches", defaultValue = [], options = NICHES, label = "Choose categories", addLabel = "Add your own category" }: { name?: string; defaultValue?: string[]; options?: readonly string[]; label?: string; addLabel?: string }) {
  const [picked, setPicked] = useState<string[]>(defaultValue);
  const [custom, setCustom] = useState("");
  const toggle = (niche: string) => setPicked((now) => (now.some((n) => n.toLowerCase() === niche.toLowerCase()) ? now.filter((n) => n.toLowerCase() !== niche.toLowerCase()) : [...now, niche]));
  const add = () => {
    const value = custom.trim().replace(/,/g, " ");
    if (value && !picked.some((n) => n.toLowerCase() === value.toLowerCase())) setPicked((now) => [...now, value]);
    setCustom("");
  };
  const extras = picked.filter((p) => !options.some((n) => n.toLowerCase() === p.toLowerCase()));
  return (
    <div>
      <input type="hidden" name={name} value={picked.join(", ")} />
      <details className="group relative">
        <summary className="crm-input flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className={`truncate ${picked.length ? "text-bone" : "text-faint"}`}>{picked.length ? picked.join(", ") : label}</span>
          <span aria-hidden className="text-faint transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-3 shadow-[var(--shadow-float)] sm:min-w-[26rem]">
          <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto" data-lenis-prevent>
            {[...options, ...extras].map((niche) => {
              const on = picked.some((n) => n.toLowerCase() === niche.toLowerCase());
              return (
                <button
                  key={niche}
                  type="button"
                  onClick={() => toggle(niche)}
                  aria-pressed={on}
                  className={`rounded-full border px-2.5 py-1 text-[0.8125rem] transition-colors ${on ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-ash hover:text-bone"}`}
                >
                  {niche}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              className="crm-input flex-1"
              placeholder={addLabel}
            />
            <button type="button" onClick={add} className="crm-btn crm-btn-secondary crm-btn-sm">Add</button>
          </div>
        </div>
      </details>
    </div>
  );
}
