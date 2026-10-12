"use client";

import { useEffect, type RefObject } from "react";

/** How long each card holds before the row moves on. Matches the case-study slider. */
const AUTO_MS = 4000;

/**
 * AN AUTO SLIDE FOR A SCROLLING ROW OF CARDS (Genesis, 6 Oct 2026: "auto
 * slider on for all across, phone, desktop and other devices").
 *
 * Every few seconds the row moves on one card, and from the last card back to
 * the first. It holds while the reader has it: the pointer over it, a finger
 * on it (and a moment after), or focus inside it. Off screen, or with reduced
 * motion asked for, it does nothing.
 */
export function useAutoAdvance(rail: RefObject<HTMLElement | null>, enabled = true, area?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = rail.current;
    if (!el || !enabled) return;
    /*
      THE WHOLE SLIDER HOLDS IT, NOT JUST THE ROW (Genesis, 11 Oct 2026: "fix
      the slider glitches"). The arrows sit outside the row, so a click on one
      scrolled a card and the timer, not knowing, scrolled another a moment
      later: a double jump. A wheel or trackpad swipe did the same. Any of
      them now holds the slide for a few beats.
    */
    const box = area?.current ?? el;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let held = false;
    let heldUntil = 0;
    let seen = false;
    let rested = false;
    const io = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
    });
    io.observe(el);

    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") held = true;
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") held = false;
    };
    const touch = () => {
      heldUntil = performance.now() + AUTO_MS * 2;
    };
    box.addEventListener("pointerenter", enter);
    box.addEventListener("pointerleave", leave);
    box.addEventListener("touchstart", touch, { passive: true });
    box.addEventListener("pointerdown", touch);
    box.addEventListener("wheel", touch, { passive: true });
    box.addEventListener("keydown", touch);

    const timer = window.setInterval(() => {
      if (!seen || held || performance.now() < heldUntil) return;
      if (el.contains(document.activeElement)) return;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card || el.scrollWidth <= el.clientWidth + 4) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        /* A beat's rest on the last card before running back to the first. */
        if (!rested) {
          rested = true;
          return;
        }
        rested = false;
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: card.getBoundingClientRect().width + gap, behavior: "smooth" });
      }
    }, AUTO_MS);

    return () => {
      window.clearInterval(timer);
      io.disconnect();
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointerleave", leave);
      box.removeEventListener("touchstart", touch);
      box.removeEventListener("pointerdown", touch);
      box.removeEventListener("wheel", touch);
      box.removeEventListener("keydown", touch);
    };
  }, [rail, enabled, area]);
}
