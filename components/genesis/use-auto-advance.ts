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
export function useAutoAdvance(rail: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const el = rail.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let held = false;
    let heldUntil = 0;
    let seen = false;
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
      heldUntil = performance.now() + AUTO_MS * 1.5;
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("touchstart", touch, { passive: true });
    el.addEventListener("pointerdown", touch);

    const timer = window.setInterval(() => {
      if (!seen || held || performance.now() < heldUntil) return;
      if (el.contains(document.activeElement)) return;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card || el.scrollWidth <= el.clientWidth + 4) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: card.getBoundingClientRect().width + gap, behavior: "smooth" });
      }
    }, AUTO_MS);

    return () => {
      window.clearInterval(timer);
      io.disconnect();
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("touchstart", touch);
      el.removeEventListener("pointerdown", touch);
    };
  }, [rail, enabled]);
}
