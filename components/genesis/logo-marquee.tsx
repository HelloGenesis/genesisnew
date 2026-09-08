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
  className,
}: {
  /**
   * One node per item. Keyed by index internally, which is safe because the
   * list is static — a marquee that reorders itself is not a thing.
   */
  items: ReactNode[];
  speedSeconds?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        // Fade the rail into the background at both edges.
        "[mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
    >
      <div
        className="flex w-max animate-[genesis-marquee_var(--marquee-duration)_linear_infinite] items-center gap-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
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
            className="flex shrink-0 items-center gap-10"
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
