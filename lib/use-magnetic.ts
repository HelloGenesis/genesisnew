"use client";

import { useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useCallback, type PointerEvent } from "react";

/**
 * Pointer-follow ("magnetic") behaviour, defined once and shared by every
 * component that needs it — the floating paper cards, glass buttons, and the
 * orbiting card cluster.
 *
 * Returns spring-damped x/y offsets plus the handlers to spread onto the
 * element. Honours `prefers-reduced-motion` by pinning the offsets to zero.
 *
 * `strength` is the fraction of the pointer's distance from the centre that
 * the element follows; `maxOffset` caps that in pixels. See the note on the
 * clamp for why the second one matters more than the first.
 */
export function useMagnetic(strength = 0.35, maxOffset = Infinity) {
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const spring = { stiffness: 200, damping: 18, mass: 0.6 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (prefersReducedMotion) return;
      // Coarse pointers (touch) have no hover state to track.
      if (event.pointerType !== "mouse") return;

      const bounds = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - (bounds.left + bounds.width / 2);
      const offsetY = event.clientY - (bounds.top + bounds.height / 2);

      /*
        THE TRAVEL IS CAPPED, AND THAT IS THE FIX FOR "BUTTONS MOVING TOO
        MUCH" rather than the strength being lowered alone.

        The offset is a fraction of the distance from the element's CENTRE, so
        how far a thing can travel is set by how big it is: at one strength, a
        200px-wide button reaches five times the offset of a 40px one. On a
        row of buttons that is the fault Genesis reported — "Plan an
        Influencer Campaign" swimming under the cursor while "See the work"
        beside it barely moved. It reads as the wide button being broken
        rather than as a shared effect.

        A ceiling in PIXELS makes the behaviour a property of the interaction
        instead of a property of the element's width, so every button in a row
        moves the same distance however long its label is.
      */
      const clamp = (v: number) =>
        Math.max(-maxOffset, Math.min(maxOffset, v * strength));
      rawX.set(clamp(offsetX));
      rawY.set(clamp(offsetY));
    },
    [prefersReducedMotion, rawX, rawY, strength, maxOffset],
  );

  const onPointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return {
    x: prefersReducedMotion ? 0 : x,
    y: prefersReducedMotion ? 0 : y,
    magneticProps: { onPointerMove, onPointerLeave },
  };
}
