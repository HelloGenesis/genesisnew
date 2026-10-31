"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { HeaderSlot } from "./header-slot";

/**
 * WHOSE CRM AN OWNER IS LOOKING AT, IN THE TOP BAR (Genesis, 31 Oct 2026:
 * "this takes too much space; an icon on the top right"). A small button with
 * the CRM's name; picking another switches straight away. Drawn into the
 * header's slot (app/(crm)/layout), so it never takes a row of the page.
 */
export function ViewingSwitch({ current, options, action }: { current: string | null; options: { id: string; name: string }[]; action: (form: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const all = [{ id: "", name: "Genesis Media" }, ...options];
  const now = all.find((o) => o.id === (current ?? "")) ?? all[0]!;
  return (
    <HeaderSlot>
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" title="Whose CRM you're viewing" className="flex h-9 items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 text-[0.8125rem] text-ash transition-colors hover:border-[#ffc516]/60 hover:text-bone">
        <Building2 className="size-4 shrink-0" aria-hidden />
        <span className="max-w-[9rem] truncate max-sm:hidden">{now.name}</span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-1.5 shadow-[var(--shadow-float)]">
          <p className="px-3 pb-1 pt-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Viewing</p>
          {all.map((o) => (
            <form key={o.id || "genesis"} action={action}>
              <input type="hidden" name="ws" value={o.id} />
              <button role="menuitem" className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[0.875rem] text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
                <span className="min-w-0 truncate">{o.name}{o.id ? <span className="text-faint"> · agency</span> : null}</span>
                {o.id === now.id && <Check className="size-4 shrink-0 text-[#ffc516]" aria-hidden />}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
    </HeaderSlot>
  );
}
