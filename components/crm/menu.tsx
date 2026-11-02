"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * A BUTTON THAT OPENS A PANEL (Genesis, 3 Nov 2026: "put this as an icon,
 * history, and give dropdowns"): the History icon and the Actions dropdown on
 * a quote. Closes on a click outside, Escape, or picking something in it.
 * The panel's contents can be server-rendered (forms, links).
 */
export function Menu({ label, icon, title, children, width = "w-64", caret = true, tone = "secondary" }: { label?: React.ReactNode; icon?: React.ReactNode; title?: string; children: React.ReactNode; width?: string; caret?: boolean; tone?: "primary" | "secondary" }) {
  const [open, setOpen] = useState(false);
  /* Opens rightward when there's no room to the left (Genesis, 3 Nov 2026: the History panel ran under the side rail). */
  const [fromLeft, setFromLeft] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button type="button" title={title} aria-label={title} aria-expanded={open} onClick={() => {
          setFromLeft((box.current?.getBoundingClientRect().right ?? 1000) < 360);
          setOpen((o) => !o);
        }} className={`crm-btn crm-btn-${tone} crm-btn-sm ${label ? "" : "!px-2.5"}`}>
        {icon}
        {label}
        {caret && label && <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />}
      </button>
      {open && (
        <div
          role="menu"
          onClick={(e) => (e.target as HTMLElement).closest("button[type=submit], button:not([type]), a") && setTimeout(() => setOpen(false), 0)}
          className={`absolute ${fromLeft ? "left-0" : "right-0"} top-full z-40 mt-2 ${width} max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--crm-panel)] p-1.5 text-left shadow-[var(--shadow-float)]`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
