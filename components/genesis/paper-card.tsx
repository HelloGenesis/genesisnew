"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { useMagnetic } from "@/lib/use-magnetic";
import { cn } from "@/lib/utils";

/**
 * Magnetic floating paper card.
 *
 * The connective motif of the whole site: sheets of paper caught in a single
 * hard light (img-009 pinned notes, img-011 paper vortex, img-053 angled
 * process cards). Each card sits at a slight rotation, lifts and straightens
 * under the cursor, and carries a directional sheen along its top edge.
 */

export function PaperCard({
  children,
  /** Resting rotation in degrees. Small values read as intentional; large as broken. */
  rotate = -2,
  tone = "brand",
  pinned = false,
  className,
}: {
  children: ReactNode;
  rotate?: number;
  tone?: "brand" | "neutral";
  /** Adds the pushpin from img-009. */
  pinned?: boolean;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { x, y, magneticProps } = useMagnetic(0.08);

  const sheen =
    tone === "brand"
      ? "rgb(255 197 22 / 0.18)"
      : tone === "neutral"
        ? "rgb(255 255 255 / 0.14)"
        : "rgb(255 228 102 / 0.2)";

  return (
    <motion.div
      {...magneticProps}
      // The tilt is NOT motion — it is the card's orientation, the thing that
      // makes a pinned paper card read as dropped rather than aligned. It is
      // therefore not gated on prefers-reduced-motion: that setting is about
      // movement, and straightening every card removes the design rather than
      // the animation. The hover, which does move, is still gated below.
      //
      // Gating it here also broke hydration. useReducedMotion() returns null
      // on the server and true on the client, so the server rendered
      // transform: rotate(-11deg) and the client expected none. React
      // discarded the server HTML for every service card, for exactly the
      // users who asked for less work per frame.
      style={{ x, y, rotate }}
      whileHover={prefersReducedMotion ? undefined : { rotate: 0, y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className={cn(
        "glass glass-lit relative rounded-card p-6",
        "shadow-[0_20px_60px_-24px_rgb(0_0_0/0.95)]",
        className,
      )}
    >
      {/* The light falling across the sheet. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-card"
        style={{
          background: `linear-gradient(155deg, ${sheen} 0%, transparent 45%)`,
        }}
      />

      {pinned && <Pushpin />}

      <div className="relative">{children}</div>
    </motion.div>
  );
}

/**
 * The pushpin from img-009.
 *
 * Its head was lime once and the head is now brand, but the GLOW was left
 * behind at rgb(197 255 46) — so every pinned card on the site wore a lime
 * halo around a red pin, a hue that appears nowhere else in the brand and
 * reads as a rendering fault rather than a choice. A pin glows its own
 * colour.
 */
function Pushpin() {
  return (
    <span
      aria-hidden
      className="absolute -top-3 left-1/2 z-10 -translate-x-1/2"
    >
      <span className="block size-4 rounded-full bg-[#ffc516] shadow-[0_0_14px_3px_rgb(255_197_22/0.5)]" />
      <span className="mx-auto block h-3 w-px bg-[#a8121f]" />
    </span>
  );
}

/**
 * A scattered cluster of paper cards (img-053). Rotations alternate so the
 * stack reads as dropped rather than arranged.
 */
export function PaperStack({
  items,
  tone = "brand",
  className,
}: {
  items: { title: string; caption?: string; body?: string }[];
  tone?: "brand" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <PaperCard
          key={item.title}
          tone={tone}
          // Alternating tilt, damped toward the middle of the row.
          rotate={index % 2 === 0 ? -2.5 : 2}
          className="h-full"
        >
          <h3 className="text-h3 font-normal tracking-tight text-bone">
            {item.title}
          </h3>
          {item.caption && (
            <p className="mt-1 text-small text-ash/80">{item.caption}</p>
          )}
          {item.body && (
            <p className="mt-3 text-small leading-relaxed text-ash">{item.body}</p>
          )}
        </PaperCard>
      ))}
    </div>
  );
}
