"use client";

import { useEffect, useRef, useState } from "react";

import { NICHES } from "@/lib/crm/niches";


/**
 * The niches, as chips to tap from the list above, plus any of your own. The
 * form still receives one comma-separated `niches` field, so saving is
 * unchanged.
 *
 * In a table (Genesis, 26 Oct 2026: "multiple selection and adding for
 * category, all across"): `value` and `onChange` make it live (each tap
 * changes the row), `onDone` runs when it closes, and the list opens on top
 * of the page so a scrolling table doesn't cut it off.
 */
/* `options` and the two labels let the same chips pick languages too (Genesis, 22 Oct 2026). */
export function NichePicker({
  name = "niches",
  defaultValue = [],
  value,
  onChange,
  onDone,
  compact = false,
  options = NICHES,
  label = "Choose categories",
  addLabel = "Add your own category",
}: {
  name?: string;
  defaultValue?: string[];
  value?: string[];
  onChange?: (next: string[]) => void;
  onDone?: (picked: string[]) => void;
  compact?: boolean;
  options?: readonly string[];
  label?: string;
  addLabel?: string;
}) {
  const [own, setOwn] = useState<string[]>(defaultValue);
  const picked = value ?? own;
  const set = (next: string[]) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const latest = useRef(picked);
  useEffect(() => {
    latest.current = picked;
  }, [picked]);

  const close = () => {
    setOpen(false);
    onDone?.(latest.current);
  };
  const toggleOpen = () => {
    if (open) return close();
    const r = box.current?.getBoundingClientRect();
    /* Under the box, kept on screen. */
    if (r) setAt({ top: Math.min(r.bottom + 4, window.innerHeight - 320), left: Math.max(8, Math.min(r.left, window.innerWidth - 432)) });
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node)) close();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `close` reads the latest picks through a ref.
  }, [open]);

  const toggle = (niche: string) => set(picked.some((n) => n.toLowerCase() === niche.toLowerCase()) ? picked.filter((n) => n.toLowerCase() !== niche.toLowerCase()) : [...picked, niche]);
  const add = () => {
    const next = custom.trim().replace(/,/g, " ");
    if (next && !picked.some((n) => n.toLowerCase() === next.toLowerCase())) set([...picked, next]);
    setCustom("");
  };
  const extras = picked.filter((p) => !options.some((n) => n.toLowerCase() === p.toLowerCase()));
  return (
    <div ref={box} className={compact ? "w-48" : ""}>
      <input type="hidden" name={name} value={picked.join(", ")} />
      <button type="button" onClick={toggleOpen} aria-expanded={open} className={`crm-input flex w-full items-center justify-between gap-2 text-left ${compact ? "!min-h-8 !px-2 text-[0.8125rem]" : ""}`}>
        <span className={`${compact ? "line-clamp-2" : "truncate"} ${picked.length ? "text-bone" : "text-faint"}`}>{picked.length ? picked.join(", ") : label}</span>
        <span aria-hidden className={`text-faint transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && at && (
        <div ref={panel} style={{ top: at.top, left: at.left }} className="fixed z-[80] w-[26rem] max-w-[calc(100vw-1rem)] rounded-xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-3 shadow-[var(--shadow-float)]">
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
          {onDone && (
            <button type="button" onClick={close} className="crm-btn crm-btn-primary crm-btn-sm mt-3 w-full">
              Done
            </button>
          )}
        </div>
      )}
    </div>
  );
}
