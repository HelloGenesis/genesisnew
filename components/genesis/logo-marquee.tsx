"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * An infinite horizontal marquee.
 *
 * The track is duplicated once and translated by exactly -50%, which makes the
 * loop seamless without measuring anything. The duplicate is aria-hidden so
 * screen readers announce each item exactly once.
 *
 * Uses a CSS animation rather than Framer Motion: this runs continuously for
 * the life of the page, and keeping it off the main thread avoids a permanent
 * rAF subscription.
 *
 * IT TAKES NODES NOW, NOT STRINGS. It was written when the client wall was a
 * list of NAMES set as type, with a note saying to swap in real logos when
 * they arrived. They arrived, and Genesis has asked for the wall to move — so
 * the marquee has to be able to carry a chip with an <Image> in it rather than
 * only a <span> of text. The styling of an item is the caller's business;
 * what belongs here is the loop.
 */

export function LogoMarquee({
  items,
  speedSeconds = 40,
  reverse = false,
  gapClassName = "gap-10",
  fadePercent = 6,
  className,
}: {
  /**
   * One node per item. Keyed by index internally, which is safe because the
   * list is static — a marquee that reorders itself is not a thing.
   */
  items: ReactNode[];
  speedSeconds?: number;
  reverse?: boolean;
  /**
   * The space between items, as a Tailwind gap class.
   *
   * IT IS ONE VALUE APPLIED IN TWO PLACES and that is the whole reason it is
   * a prop rather than something a caller sets from outside. The track is a
   * flex row of two identical copies, each itself a flex row of the items:
   * the gap BETWEEN the copies and the gap between items INSIDE a copy must
   * be identical, or the seam where the loop wraps is a different width from
   * every other join and the strip visibly hitches once per cycle. Passing it
   * in keeps the two in step.
   *
   * 40px suits logos, which are objects with their own silhouettes. Text
   * wants less — see the sector strip, which sets its own.
   */
  gapClassName?: string;
  /**
   * How much of each end the fade eats, as a percentage of the width.
   *
   * 6 suits the logo rails: they run the full viewport, so a short fade is
   * enough to dissolve a mark at the screen's edge and anything longer would
   * start dimming logos that are meant to be read.
   *
   * A strip of TEXT held to the page's measure wants more. It has margin
   * either side of it rather than a screen edge, so the fade is not tidying a
   * boundary — it is the thing that makes the strip look like it has room,
   * and at 6% the words were still near-solid where the column stops. See the
   * sector strip, which asks for twice this.
   */
  fadePercent?: number;
  className?: string;
}) {
  return (
    <div
      style={{ "--fade": `${fadePercent}%` } as React.CSSProperties}
      className={cn(
        "group relative overflow-hidden",
        /*
          Fade the rail into the background at both edges. Through a custom
          property rather than an arbitrary Tailwind value because the stop
          appears TWICE — once at `--fade` and once at `100% - --fade` — and a
          caller passing a number that only updated one of them would fade one
          end and cut the other.
        */
        "[mask-image:linear-gradient(90deg,transparent,black_var(--fade),black_calc(100%-var(--fade)),transparent)]",
        /*
          UNDER REDUCE MOTION THE STRIP STOPS, AND THEN IT HAS TO BE
          REACHABLE. The animation is switched off below, which leaves a track
          wider than its box inside `overflow-hidden` — fine for a wall of
          logos, and not fine for the sector strip, where the items are words
          that say what the company does. Anything past the right edge would
          simply be unreadable, with no way to get at it.

          Scrollable instead of hidden, so the same markup a moving reader
          watches is one a still reader can swipe. The mask stays, which means
          it still fades at both ends while being scrolled.
        */
        "no-scrollbar motion-reduce:overflow-x-auto",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-max animate-[genesis-marquee_var(--marquee-duration)_linear_infinite] items-center",
          "group-hover:[animation-play-state:paused] motion-reduce:animate-none",
          gapClassName,
        )}
        style={
          {
            "--marquee-duration": `${speedSeconds}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className={cn("flex shrink-0 items-center", gapClassName)}
          >
            {items.map((item, index) => (
              <div key={`${copy}-${index}`} className="shrink-0">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
