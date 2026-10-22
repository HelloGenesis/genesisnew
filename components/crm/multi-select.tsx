"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A FILTER THAT TAKES SEVERAL VALUES (Genesis, 12 Oct 2026: "multiple options
 * should be selected across these filters to make better plans"). A dropdown
 * of tick boxes with a search, submitting one `name=value` per choice, so a
 * plain GET form sends ?niche=Dance&niche=Fitness.
 */
/* `allowCustom`: the search box can add a value that isn't in the list ("write your own", Genesis, 22 Oct 2026). */
export function MultiSelect({ name, label, options: given, defaultValue = [], className = "", allowCustom = false }: { name: string; label: string; options: readonly (readonly [string, string])[]; defaultValue?: string[]; className?: string; allowCustom?: boolean }) {
  const [extra, setExtra] = useState<string[]>(() => defaultValue.filter((v) => !given.some(([o]) => o === v)));
  const options = useMemo(() => [...given, ...extra.map((v) => [v, v] as const)], [given, extra]);
  const [picked, setPicked] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter(([, l]) => l.toLowerCase().includes(s)) : options;
  }, [options, q]);
  const labelOf = (v: string) => options.find(([o]) => o === v)?.[1] ?? v;
  const addCustom = () => {
    const v = q.trim().slice(0, 60);
    if (!v) return;
    if (!options.some(([o]) => o === v)) setExtra((now) => [...now, v]);
    setPicked((now) => (now.includes(v) ? now : [...now, v]));
    setQ("");
  };
  const toggle = (v: string) => setPicked((now) => (now.includes(v) ? now.filter((x) => x !== v) : [...now, v]));

  return (
    <div ref={box} className={`relative ${className}`}>
      {picked.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      <button type="button" onClick={() => setOpen((o) => !o)} className="crm-input flex w-full items-center justify-between gap-2 text-left" aria-expanded={open}>
        <span className={`truncate ${picked.length ? "text-bone" : "text-faint"}`}>
          {picked.length === 0 ? label : picked.length <= 2 ? picked.map(labelOf).join(", ") : `${labelOf(picked[0]!)} +${picked.length - 1}`}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {picked.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Clear ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                setPicked([]);
              }}
              onKeyDown={(e) => e.key === "Enter" && setPicked([])}
              className="text-faint hover:text-bone"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown className="size-4 text-faint" aria-hidden />
        </span>
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-max min-w-full max-w-[20rem] rounded-xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-2 shadow-[var(--shadow-float)]">
          {(allowCustom || options.length > 8) && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={allowCustom ? "Search or write your own…" : "Search…"} onKeyDown={(e) => { if (e.key === "Enter" && allowCustom && q.trim()) { e.preventDefault(); addCustom(); } }} className="crm-input mb-2 !min-h-8 !py-1 text-[0.8125rem]" />}
          <ul className="max-h-72 overflow-y-auto" data-lenis-prevent>
            {shown.map(([v, l]) => {
              const on = picked.includes(v);
              return (
                <li key={v}>
                  <button type="button" onClick={() => toggle(v)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.875rem] text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
                    <span className={`grid size-4 shrink-0 place-items-center rounded border ${on ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)]"}`}>{on && <Check className="size-3" />}</span>
                    <span className={on ? "text-bone" : ""}>{l}</span>
                  </button>
                </li>
              );
            })}
            {allowCustom && q.trim() && !options.some(([, l]) => l.toLowerCase() === q.trim().toLowerCase()) && (
              <li>
                <button type="button" onClick={addCustom} className="w-full rounded-lg px-2 py-1.5 text-left text-[0.875rem] text-brand-ink hover:bg-[var(--hover-wash)]">+ Add &ldquo;{q.trim()}&rdquo;</button>
              </li>
            )}
            {shown.length === 0 && !allowCustom && <li className="px-2 py-1.5 text-[0.8125rem] text-faint">No match.</li>}
          </ul>
          {picked.length > 0 && (
            <div className="mt-2 flex justify-between border-t border-[var(--glass-border)] pt-2 text-[0.75rem]">
              <span className="text-faint">{picked.length} selected</span>
              <button type="button" onClick={() => setPicked([])} className="crm-link">Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
