"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { IconName, VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { OfferIcon } from "./icons";

export type PlanTab = { key: VerticalKey; label: string; icon: IconName; content: ReactNode };

/**
 * "ADD OTHER 3 VERTICALS COSTING PACKAGES SLIDER HERE AND ADD BUTTONS ABOVE TO
 * CHANGE THEM AND VIEW PARTICULAR PRICING."
 *
 * One panel at a time, sliding in from the side of the tab that was chosen,
 * so moving from AI Labs to Studios reads as the next slide rather than a
 * page swap. Real tabs underneath (role=tablist, arrow keys between them).
 *
 * ANY LINK ON THE PAGE CAN PICK A TAB with `data-plan-tab="studios"` — the
 * vertical cards at the top of /pricing do. That is read in the capture
 * phase for the same reason the work grid reads `data-work-filter`:
 * SmoothScroll stops a hash link's click before React's handlers see it.
 */
export function PlanTabs({ tabs, initial }: { tabs: PlanTab[]; initial?: VerticalKey }) {
  const [active, setActive] = useState<VerticalKey>(initial ?? tabs[0].key);
  const [direction, setDirection] = useState(1);
  const reduce = useReducedMotion();
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const select = (key: VerticalKey) => {
    const from = tabs.findIndex((tab) => tab.key === active);
    const to = tabs.findIndex((tab) => tab.key === key);
    setDirection(to >= from ? 1 : -1);
    setActive(key);
  };
  const selectRef = useRef(select);
  useEffect(() => {
    selectRef.current = select;
  });

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest?.("[data-plan-tab]");
      const key = trigger?.getAttribute("data-plan-tab") as VerticalKey | null;
      if (key && tabs.some((tab) => tab.key === key)) selectRef.current(key);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [tabs]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.key === active);
    const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    select(next.key);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-key="${next.key}"]`)?.focus();
  };

  const current = tabs.find((tab) => tab.key === active)!;

  return (
    <div>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Genesis verticals"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 gap-2 md:grid-cols-4"
      >
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              data-key={tab.key}
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.key)}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-card px-4 text-small transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:justify-start",
                selected ? "bg-brand text-on-brand" : "glass-chip text-ash hover:text-bone",
              )}
            >
              <OfferIcon name={tab.icon} className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative mt-8 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current.key}
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${current.key}`}
            custom={direction}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -48 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
