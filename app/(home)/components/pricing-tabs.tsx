"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The one-time products on /pricing, one vertical at a time — the brief's
 * pricing mockup files them under four tabs rather than as fifteen cards in
 * a row. Every panel is server-rendered and stays in the document; the tabs
 * only choose which one is shown, so a crawler reads all four.
 */
export function PricingTabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div role="tablist" aria-label="One-time projects" className="flex flex-wrap gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            id={`one-time-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`one-time-panel-${index}`}
            onClick={() => setActive(index)}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-small transition-colors",
              active === index
                ? "bg-brand text-on-brand"
                : "border border-white/12 text-ash hover:border-white/25 hover:text-bone",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`one-time-panel-${index}`}
          aria-labelledby={`one-time-tab-${index}`}
          hidden={active !== index}
          className="mt-8"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
