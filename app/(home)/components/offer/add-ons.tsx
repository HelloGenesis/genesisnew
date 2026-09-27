"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId, useState } from "react";

import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import type { AddOns } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { OfferIcon } from "./icons";

/**
 * Add-ons: the categories as chips, the prices behind a button.
 *
 * THE BRIEF IS SPECIFIC: "Keep only the categories visible … On click, open
 * the pricing/details as an accordion. Do not show all those prices on the
 * default page" — "so the page doesn't start feeling like a price menu."
 */
export function AddOnsBlock({ data, compact = false }: { data: AddOns; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <Reveal>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel dot tone="brand">
            {data.label}
          </SectionLabel>
          <h2
            className={cn(
              "mt-4 text-balance font-normal leading-[1.05] tracking-tight text-bone",
              compact ? "text-h3" : "text-h3 sm:text-h2",
            )}
          >
            {data.heading}
          </h2>
          {data.body && <p className="mt-3 max-w-2xl text-pretty text-body leading-relaxed text-ash">{data.body}</p>}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-brand/50 px-5 text-small text-bone transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {data.button}
          <Plus
            aria-hidden
            className={cn("size-4 text-brand-ink transition-transform duration-300", open && "rotate-45")}
          />
        </button>
      </div>

      {data.chips && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {data.chips.map((chip) => (
            <li
              key={chip.label}
              className="glass-chip inline-flex h-10 items-center gap-2 rounded-full px-4 text-small text-bone"
            >
              {chip.icon && <OfferIcon name={chip.icon} className="size-4 text-brand-ink" />}
              {chip.label}
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="add-ons"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="glass glass-lit mt-6 divide-y divide-white/10 rounded-panel px-5 sm:px-6">
              {data.items.map((item) => (
                <li key={item.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-bone">{item.name}</p>
                    {item.body && <p className="mt-1 text-pretty text-small leading-relaxed text-ash">{item.body}</p>}
                  </div>
                  <p className="font-display text-lead text-brand-ink">{item.price}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </Reveal>
  );
}
