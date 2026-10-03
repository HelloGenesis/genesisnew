"use client";

import { useEffect, useState, type RefObject } from "react";

import { cn } from "@/lib/utils";

const GRADIENT = "linear-gradient(115deg, #8b5cf6 0%, #c066d9 30%, #f2607e 65%, #f5923e 100%)";

/**
 * WHERE YOU ARE IN A SLIDER (Genesis, 2 Oct 2026: "add this slider wherever
 * there's a slider gallery"). A thin gradient bar that fills as the row
 * scrolls, and "2 / 15" beside it.
 *
 * The count is the card in view: on a touch screen the one nearest the
 * middle (the rails snap to centre there); with a mouse, the first one whose
 * left edge is in view — so a row that has not moved reads "1 / N", not the
 * card that happens to sit mid-screen.
 *
 * It hides itself while the row has nothing to scroll — a rail that becomes a
 * grid on a laptop, or a short one that fits.
 */
export function RailProgress({
  rail,
  className,
  onActive,
}: {
  rail: RefObject<HTMLElement | null>;
  className?: string;
  /** The card in view, for a rail that lights it (the homepage offer cards). */
  onActive?: (index: number) => void;
}) {
  const [state, setState] = useState({ progress: 0, index: 0, count: 0, scrollable: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const touch = window.matchMedia("(hover: none)");
    let frame = 0;

    const measure = () => {
      frame = 0;
      const items = Array.from(el.children).filter((child) => (child as HTMLElement).offsetWidth > 0);
      const max = el.scrollWidth - el.clientWidth;
      const box = el.getBoundingClientRect();
      let index = 0;
      /* A row at its start reads 1, at its end the last — whatever sits mid-screen. */
      const left = Math.abs(el.scrollLeft); // negative in a right-to-left row
      if (max > 2 && left <= 2) index = 0;
      else if (max > 2 && left >= max - 2) index = items.length - 1;
      else if (touch.matches) {
        const middle = box.left + el.clientWidth / 2;
        let best = Infinity;
        items.forEach((item, i) => {
          const r = item.getBoundingClientRect();
          const gap = Math.abs(r.left + r.width / 2 - middle);
          if (gap < best) {
            best = gap;
            index = i;
          }
        });
      } else {
        const start = box.left + parseFloat(getComputedStyle(el).paddingLeft || "0") - 4;
        const first = items.findIndex((item) => item.getBoundingClientRect().left >= start);
        index = Math.max(0, first);
      }
      setState({
        progress: max > 0 ? left / max : 1,
        index,
        count: items.length,
        scrollable: max > 2,
      });
      onActive?.(index);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    /*
      MEASURED AT ONCE (and on a resize or new cards), on the next frame for
      scrolls, which fire far more often. An animation frame
      never comes in a tab the browser is not painting, so a first measure
      left to one could leave the bar unmade until the visitor scrolled.
    */
    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    /* Cards that arrive later (images, a filter, a toggle) change the row's width. */
    const observer = new MutationObserver(measure);
    observer.observe(el, { childList: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [rail, onActive]);

  if (!state.scrollable) return null;

  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden>
      <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-[var(--glass-border)]">
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200"
          style={{ width: `${Math.max(8, state.progress * 100)}%`, background: GRADIENT }}
        />
      </span>
      <span className="text-[0.75rem] tabular-nums text-faint">
        {state.index + 1} / {state.count}
      </span>
    </div>
  );
}
