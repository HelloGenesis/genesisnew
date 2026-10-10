"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export const WORD_GRADIENT = "linear-gradient(100deg, #8b5cf6 0%, #c066d9 30%, #f2607e 65%, #f5923e 100%)";

/**
 * ONE WORD AT A TIME, SLIDING UP (Genesis, 2 Oct 2026: "make sure the hero
 * products are slid good and nice so it's easily understandable"). The
 * homepage hero's services and each division page's headline use it.
 *
 * A TICKER, NOT A CROSSFADE. The first version faded one word into the next
 * in place, and for a moment the two sat on top of each other and read as
 * neither. Now the word leaving slides up and is gone (its fade is quicker
 * than its move) before the next one, rising from below, fades in.
 *
 * All the words share one grid cell, so the line is always as wide and tall
 * as the longest and nothing around it moves — the orb above the homepage
 * hero included. It pauses while the tab is hidden; with Reduce Motion the
 * first word simply stays. A screen reader gets the whole list once.
 */
export function WordCycler({
  words,
  interval = 2200,
  align = "center",
  suffix,
  className,
}: {
  words: readonly string[];
  interval?: number;
  align?: "start" | "center";
  /** After every word, outside the gradient — the yellow full stop. */
  suffix?: React.ReactNode;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [words.length, interval]);

  const previous = (index - 1 + words.length) % words.length;

  return (
    /*
      CLIPPED VERTICALLY WITH overflow: clip, NOT hidden and NOT a clip-path.
      Hidden overflow takes the box's baseline from its bottom edge, which
      lifted the word off the sentence's line ("align it properly"); a
      clip-path kept the baseline but can stop gradient (background-clip:
      text) words from painting in Chrome — the line showed blank. `clip`
      neither moves the baseline nor makes a new layer, and only the vertical
      axis is cut so the italic overhang still shows.
    */
    <span className={cn("relative inline-grid overflow-x-visible overflow-y-clip py-[0.12em]", className)}>
      <span className="sr-only">{words.join(", ")}</span>
      {words.map((word, i) => {
        const state = i === index ? "in" : i === previous ? "out" : "wait";
        return (
          <span
            key={word}
            aria-hidden
            className={cn(
              "col-start-1 row-start-1 whitespace-nowrap motion-reduce:transition-none",
              align === "center" ? "justify-self-center" : "justify-self-start",
              "transition-[transform,opacity] ease-[cubic-bezier(0.22,1,0.36,1)]",
              state === "in" && "translate-y-0 opacity-100 duration-500 [transition-delay:120ms]",
              state === "out" && "-translate-y-full opacity-0 duration-300",
              state === "wait" && "translate-y-full opacity-0 duration-0",
            )}
          >
            <span className="bg-clip-text pe-[0.08em] text-transparent" style={{ backgroundImage: WORD_GRADIENT }}>
              {word}
            </span>
            {suffix}
          </span>
        );
      })}
    </span>
  );
}
