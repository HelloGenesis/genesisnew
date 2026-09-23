"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { watchReader } from "@/lib/slider";
import { cn } from "@/lib/utils";

/**
 * An infinite horizontal marquee — that a finger can also swipe.
 *
 * IT WAS A CSS ANIMATION, translating a doubled track by -50% inside an
 * overflow-hidden box. That is seamless and costs no JavaScript, and it has
 * one fatal property on a phone: there is nothing to scroll. The strip moved
 * and a thumb could not move it — "phone me logo slider ko mai manually slide
 * nahi kar paa raha hu, phone me sabkuch manually slidable rakho".
 *
 * NOW IT IS A REAL SCROLLING ROW with the drift written into scrollLeft, the
 * same arrangement as the Influence reels and the case-study posters. A
 * swipe, a trackpad or a drag moves it natively; the drift gives way while
 * the reader is moving it (watchReader) or pointing at it with a mouse, and
 * picks up the instant they stop. The track is repeated three times and the
 * position folds by one copy's width whenever it runs past either side, which
 * lands on an identical frame — so it loops forever in both directions and a
 * swipe never reaches an end. It only runs while on screen.
 *
 * `speedSeconds` keeps its meaning: the time one copy takes to pass.
 *
 * IT TAKES NODES, NOT STRINGS. It was written when the client wall was a
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
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const watcher = watchReader(el);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const direction = reverse ? -1 : 1;

    /** One copy's width, gap included — the distance the loop folds by. */
    const period = () => {
      const copies = el.firstElementChild?.children;
      if (!copies || copies.length < 2) return 0;
      return (copies[1] as HTMLElement).offsetLeft - (copies[0] as HTMLElement).offsetLeft;
    };

    /* Start on the middle copy, so there is a copy's room either way. */
    const place = () => {
      const span = period();
      if (span > 0) {
        el.scrollLeft = span;
        watcher.wrote();
      }
    };
    place();

    /* A swipe past either side folds back onto the identical frame. */
    const onScroll = () => {
      const span = period();
      if (span <= 0) return;
      if (el.scrollLeft >= span * 2) el.scrollLeft -= span;
      else if (el.scrollLeft <= 0) el.scrollLeft += span;
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    let hovering = false;
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering = true;
    };
    const leave = () => {
      hovering = false;
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);

    /*
      The position is a float written back each frame: at these speeds a
      frame's step is a fraction of a pixel, which a browser would round
      away if the position were read back and added to.
    */
    let at = el.scrollLeft;
    let last = 0;
    let frame = 0;
    const tick = (now: number) => {
      const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const span = period();
      if (hovering || still.matches || watcher.busy() || span <= 0) {
        at = el.scrollLeft;
      } else {
        at += (direction * span * dt) / speedSeconds;
        if (at >= span * 2) at -= span;
        else if (at < span * 0.001) at += span;
        el.scrollLeft = at;
        watcher.wrote();
      }
      frame = requestAnimationFrame(tick);
    };

    /* Only while on screen: a marquee three sections away does no work. */
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!entry.isIntersecting) return;
      at = el.scrollLeft;
      last = 0;
      frame = requestAnimationFrame(tick);
    });
    visibility.observe(el);
    const onResize = () => place();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      watcher.dispose();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", onResize);
    };
  }, [reverse, speedSeconds]);

  return (
    <div
      ref={row}
      style={{ "--fade": `${fadePercent}%` } as React.CSSProperties}
      className={cn(
        "no-scrollbar relative overflow-x-auto overscroll-x-contain",
        /*
          Fade the rail into the background at both edges. Through a custom
          property rather than an arbitrary Tailwind value because the stop
          appears TWICE — once at `--fade` and once at `100% - --fade` — and a
          caller passing a number that only updated one of them would fade one
          end and cut the other.
        */
        "[mask-image:linear-gradient(90deg,transparent,black_var(--fade),black_calc(100%-var(--fade)),transparent)]",
        className,
      )}
    >
      <div className={cn("flex w-max items-center", gapClassName)}>
        {[0, 1, 2].map((copy) => (
          <div
            key={copy}
            // Only the first copy is read out; the others are the loop.
            aria-hidden={copy !== 0}
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
