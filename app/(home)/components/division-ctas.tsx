"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { GlassButton } from "@/components/genesis/glass-button";
import { homePlans } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

/** The homepage work filter each division's "Case Studies" selects — the chip's own name. */
const WORK_FILTER: Record<VerticalKey, string> = {
  "ai-labs": "AI Lab",
  studios: "Studios",
  "brand-design": "Brand & Design",
  influence: "Influence",
};

type PricingLink = { label: string; note: string; href: string; workMode?: "one-time" | "membership" };

/**
 * What "Explore Pricing" opens to. Three divisions sell a membership and
 * one-time projects; Influence sells a managed campaign and one-time UGC
 * packs, so its two are its own.
 */
function pricingLinks(vertical: VerticalKey): PricingLink[] {
  if (vertical === "influence") {
    return [
      {
        label: "Campaign Management",
        note: "15% agency commission + creator fees.",
        href: "/pricing?v=influence#plans",
      },
      { label: "UGC Packs", note: "One-time, from ₹39,999/-.", href: "/pricing#one-time" },
    ];
  }
  return [
    { label: "One-time Projects", note: "Buy once. No subscription.", href: "/pricing#one-time" },
    {
      label: "Explore Membership",
      note: "A monthly creative team.",
      href: `/pricing?v=${vertical}#plans`,
      workMode: "membership",
    },
  ];
}

/**
 * EVERY DIVISION'S THREE WAYS ON (Genesis, 29 Sep 2026): View Page, Explore
 * Pricing — a small menu of that division's pricing models — and Case
 * Studies, which scrolls to the homepage's own case studies with that
 * division's filter already chosen. The same row everywhere a division
 * offers its buttons, so a reader learns it once.
 */
export function DivisionCtas({
  vertical,
  size = "md",
  align = "start",
  opens = "down",
  className,
}: {
  vertical: VerticalKey;
  size?: "sm" | "md";
  align?: "start" | "center";
  /**
   * Which way the pricing menu opens. "up" at the foot of a section: the
   * homepage sections clip what spills past their edge, and the plan bar is
   * the last thing in each.
   */
  opens?: "down" | "up";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const small = size === "sm" ? "max-sm:h-10 max-sm:px-4 max-sm:text-small" : undefined;

  /* Close on Escape, on a click outside, and on any link inside (SmoothScroll may swallow its click). */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!holder.current?.contains(target) || target?.closest?.("a")) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, [open]);

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 sm:gap-3", align === "center" && "justify-center", className)}
      data-track={`division-ctas:${vertical}`}
    >
      <GlassButton href={homePlans[vertical].page} pageLink variant="brand" arrow className={small}>
        View Page
      </GlassButton>

      <div ref={holder} className="relative">
        {/* A real button with its own state, styled as the glass pill beside it. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="true"
          onClick={() => setOpen((was) => !was)}
          className={cn(
            "glass glass-lit relative inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-small font-medium text-bone transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            small,
          )}
        >
          Explore Pricing
          <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", open && "rotate-180")} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              id={menuId}
              initial={{ opacity: 0, y: opens === "up" ? 6 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: opens === "up" ? 6 : -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                opens === "up" ? "bottom-full mb-2" : "top-full mt-2",
                "absolute z-20 w-64 rounded-panel border border-[var(--glass-border)] bg-[var(--surface-raised)] p-2 text-left shadow-float",
                align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
              )}
            >
              {pricingLinks(vertical).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    data-page-link
                    data-work-mode={link.workMode}
                    className="block rounded-card px-4 py-3 transition-colors hover:bg-[var(--hover-wash)] focus-visible:bg-[var(--hover-wash)] focus-visible:outline-none"
                  >
                    <span className="block text-small font-medium text-bone">{link.label}</span>
                    <span className="mt-0.5 block text-[0.75rem] leading-snug text-ash">{link.note}</span>
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <GlassButton
        href="/#library"
        selectsFilter={WORK_FILTER[vertical]}
        variant="glass"
        arrow
        className={small}
      >
        Case Studies
      </GlassButton>
    </div>
  );
}
