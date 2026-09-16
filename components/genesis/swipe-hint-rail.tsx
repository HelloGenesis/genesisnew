"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A horizontal rail that WOBBLES once when it first comes into view, so a
 * reader on a phone can tell it is a slider and not three cards with one
 * showing ("thoda user ko samjhe ki ye slider hai").
 *
 * THE SCROLL POSITION MOVES, NOT A TRANSFORM. The cards inside are Reveal
 * wrappers that animate their own transform, and a second transform on them
 * would fight the first; transforming the rail itself would drag its clip
 * edge across the screen. Scrolling it is what a swipe does, so the hint
 * looks like exactly the gesture it is teaching: a peek at the next card,
 * a spring back, a smaller peek, rest.
 *
 * Snap is lifted for the length of the wobble — mandatory snap would pull
 * every intermediate position straight back — and restored after. It runs
 * once per page view, only while the rail actually overflows (from xl the
 * same markup is a grid and nothing happens), never under Reduce Motion,
 * and it gives up the moment the reader touches the rail.
 */
export function SwipeHintRail({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let started = false;
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    rail.addEventListener("pointerdown", cancel, { passive: true });
    rail.addEventListener("touchstart", cancel, { passive: true });
    rail.addEventListener("wheel", cancel, { passive: true });

    const wobble = () => {
      const start = rail.scrollLeft;
      const room = rail.scrollWidth - rail.clientWidth - start;
      const amplitude = Math.min(56, room);
      if (amplitude < 8) return;

      const snap = rail.style.scrollSnapType;
      rail.style.scrollSnapType = "none";
      const DURATION = 1400;
      const t0 = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / DURATION);
        // Two peeks to the right, the second smaller: |sin| under a decay.
        const offset = amplitude * Math.abs(Math.sin(t * Math.PI * 2)) * (1 - t) ** 1.4;
        if (cancelled || t >= 1) {
          if (!cancelled) rail.scrollLeft = start;
          rail.style.scrollSnapType = snap;
          return;
        }
        rail.scrollLeft = start + offset;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    /*
      ON SCREEN IS ASKED, NOT OBSERVED, for the reason the portfolio strips
      give: an IntersectionObserver on this kind of rail never reported it
      visible on a phone. A scroll listener and one rect read is enough, and
      it removes itself once the hint has played.
    */
    let timer = 0;
    const check = () => {
      if (started || cancelled || document.hidden) return;
      const rect = rail.getBoundingClientRect();
      const visible = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
      if (!visible) return;
      started = true;
      window.removeEventListener("scroll", check);
      document.removeEventListener("visibilitychange", check);
      // A beat after it arrives, once the cards' own reveal has settled.
      timer = window.setTimeout(wobble, 700);
    };
    window.addEventListener("scroll", check, { passive: true });
    // A page opened in a background tab gets its hint when it is looked at.
    document.addEventListener("visibilitychange", check);
    check();

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", check);
      document.removeEventListener("visibilitychange", check);
      rail.removeEventListener("pointerdown", cancel);
      rail.removeEventListener("touchstart", cancel);
      rail.removeEventListener("wheel", cancel);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
