"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useId } from "react";

import { usePref } from "./use-pref";

/**
 * A CARD THAT FOLDS (Genesis, 27 Oct 2026: "everything is collapsible, proper
 * buttons"): every titled card in the CRM (components/crm/ui Card) has a fold
 * button by its title, and stays folded on this device until opened again.
 * Folded cards keep their content on the page, just hidden.
 */
export function FoldCard({ title, foldKey, action, className = "", children }: { title: React.ReactNode; foldKey: string | null; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  const path = (usePathname() ?? "/admin").replace(/\/[a-z0-9-]{20,}(?=\/|$)/gi, "/:id");
  const [open, setOpen] = usePref(`crm-fold:${path}:${foldKey ?? ""}`, true);
  const id = useId();
  const shown = foldKey ? open : true;
  return (
    <section className={`crm-card crm-pad ${className}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 ${shown ? "mb-4" : ""}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          {foldKey && (
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={shown} aria-controls={id} aria-label={shown ? "Fold this away" : "Open this"} title={shown ? "Fold away" : "Open"} className="-ml-1.5 grid size-7 shrink-0 place-items-center rounded-lg text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone">
              <ChevronDown className={`size-4 transition-transform ${shown ? "" : "-rotate-90"}`} aria-hidden />
            </button>
          )}
          {/* Easy to read at a glance (Genesis, 22 Oct 2026: "make the font size big and user friendly"). */}
          <h2 className="font-sans text-[1.25rem] font-semibold tracking-[-0.005em] text-bone">{title}</h2>
        </div>
        {shown && action}
      </div>
      <div id={id} hidden={!shown}>
        {children}
      </div>
    </section>
  );
}
