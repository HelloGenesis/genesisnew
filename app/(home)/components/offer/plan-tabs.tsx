"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { IconName, VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { OfferIcon } from "./icons";

export type PlanTab = {
  key: VerticalKey;
  label: string;
  icon: IconName;
  /** The division's own name artwork — shown in place of the icon and label when given. */
  art?: ReactNode;
  /**
   * THE TAB AS A CARD (Genesis, 28 Sep 2026): the division's name, one line
   * about it, and a link to its page. The whole card picks the tab; the link
   * sits above it and goes to the page.
   */
  card?: { blurb: string; href: string; linkLabel: string; ramp?: string };
  content: ReactNode;
};

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

  /*
    LINKABLE TABS. /pricing?v=studios opens on Studios, so a sales message, an
    ad or the homepage strip can land a reader on the exact offer, and the
    address bar follows the tab they pick (replaceState — no history entry
    per click). Read after mount: the page is static, and the server cannot
    know the query string.
  */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("v") as VerticalKey | null;
    if (wanted && wanted !== active && tabs.some((tab) => tab.key === wanted)) selectRef.current(wanted);
    // Only on arrival; later changes come from the tabs themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("v") === active) return;
    // A plain visit to /pricing keeps its clean URL until a tab is chosen.
    if (!url.searchParams.has("v") && active === (initial ?? tabs[0].key)) return;
    url.searchParams.set("v", active);
    window.history.replaceState(window.history.state, "", url);
  }, [active, initial, tabs]);

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
        data-lenis-prevent-horizontal
        className={cn(
          tabs.some((tab) => tab.card)
            ? /* A swipeable row on a small phone — four stacked cards were a screen of tabs before any price. */
              "-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] min-[480px]:grid min-[480px]:grid-cols-2 min-[480px]:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden"
            : "grid grid-cols-2 gap-2 md:grid-cols-4",
        )}
      >
        {tabs.map((tab) => {
          const selected = tab.key === active;
          if (tab.card) {
            /*
              A CARD, NOT A BUTTON WITH A CARD INSIDE. A link cannot live
              inside a button, so the tab button is stretched over the whole
              card (it is what a click on the card hits) and the "Learn more"
              link is lifted above it — two targets, neither inside the other.
            */
            return (
              <div
                key={tab.key}
                className={cn(
                  "relative flex w-[70%] shrink-0 snap-start flex-col overflow-hidden rounded-card border px-4 py-3.5 transition-[background-color,border-color,box-shadow,transform] duration-300 min-[480px]:w-auto",
                  selected
                    ? "border-brand/70 bg-brand/[0.08] shadow-[0_0_0_1px_rgb(255_197_22/0.25),0_16px_40px_-18px_rgb(255_197_22/0.5)]"
                    : "glass glass-lit border-transparent hover:-translate-y-0.5",
                )}
              >
                {tab.card.ramp && (
                  <span aria-hidden className="absolute inset-x-0 top-0 h-px opacity-80" style={{ backgroundImage: tab.card.ramp }} />
                )}
                <button
                  type="button"
                  role="tab"
                  data-key={tab.key}
                  data-track={`pricing-tab:${tab.key}`}
                  id={`${baseId}-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(tab.key)}
                  aria-label={tab.label}
                  className="absolute inset-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                />
                {/*
                  COMPACT (Genesis, 29 Sep 2026: "make the boxes smaller … it's
                  getting difficult to figure out the pricing"): the name, two
                  lines at most, and a small link — a choice, not a feature.
                */}
                <div className="pointer-events-none relative flex items-start justify-between gap-2">
                  {tab.art}
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                      selected ? "border-brand bg-brand text-on-brand" : "border-[var(--glass-border)]",
                    )}
                  >
                    {selected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </div>
                <p className="pointer-events-none relative mt-2 line-clamp-2 text-pretty text-[0.8125rem] leading-snug text-ash">
                  {tab.card.blurb}
                </p>
                <Link
                  href={tab.card.href}
                  data-track={`pricing-tab-link:${tab.key}`}
                  className="relative z-[1] mt-auto inline-flex min-h-8 w-fit items-center gap-1 pt-1 text-[0.75rem] text-ash transition-colors hover:text-brand-ink"
                >
                  {tab.card.linkLabel}
                  <ArrowRight className="size-3.5 shrink-0 text-brand-ink" aria-hidden />
                </Link>
              </div>
            );
          }
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              data-key={tab.key}
              data-track={`pricing-tab:${tab.key}`}
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.key)}
              aria-label={tab.art ? tab.label : undefined}
              className={cn(
                "flex items-center justify-center gap-2 rounded-card px-4 text-small transition-[background-color,border-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:justify-start",
                tab.art ? "h-16 border" : "h-12",
                tab.art
                  ? selected
                    ? "border-brand/70 bg-brand/[0.08] shadow-[0_0_0_1px_rgb(255_197_22/0.25),0_12px_32px_-16px_rgb(255_197_22/0.5)]"
                    : "glass-chip border-transparent opacity-70 hover:opacity-100"
                  : selected
                    ? "bg-brand text-on-brand"
                    : "glass-chip text-ash hover:text-bone",
              )}
            >
              {tab.art ?? (
                <>
                  <OfferIcon name={tab.icon} className="size-4" />
                  {tab.label}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative mt-2 overflow-hidden">
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
