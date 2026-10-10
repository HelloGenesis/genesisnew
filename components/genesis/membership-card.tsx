"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useRef, useState, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

const SIZES = { sm: 168, md: 280, lg: 400, xl: 520 } as const;

const CARD_SRC = "/brand/genesis-membership-card.webp";

/** How far the card turns toward the pointer, in degrees, at its edges. */
const TURN = 12;

/**
 * THE GENESIS MEMBERSHIP CARD — the object a subscription is, drawn as one.
 *
 * Genesis's own artwork (28 Sep 2026): a black card with a gold edge, the
 * brand's dotted orb glowing violet to amber, the N mark at its heart and
 * "Genesis Club Membership" along the foot. The file is the card alone, its
 * corners transparent, so it lies on any surface.
 *
 * Tilted the way a card lies on a table, so it reads as a thing you get, not
 * a panel.
 *
 * IT ANSWERS THE POINTER (Genesis, 29 Sep 2026: "wherever the card is, make
 * it interactive on hover"). Hovered, it straightens, lifts, turns in 3D
 * toward the cursor and catches a highlight that follows it — the way a real
 * card catches light in the hand. Under Reduce Motion it only lifts. Still
 * decorative (every place it sits says "membership" in words), so it stays
 * hidden from assistive tech and is not focusable.
 */
export function MembershipCard({
  size = "md",
  tilt = -8,
  className,
}: {
  size?: keyof typeof SIZES;
  /** Degrees; negative leans left. */
  tilt?: number;
  className?: string;
}) {
  const width = SIZES[size];
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState({ x: 0, y: 0, active: false });

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType === "touch") return;
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    /* -0.5 … 0.5 across the card, from its centre. */
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setPose({ x, y, active: true });
  };
  const onEnter = () => setPose((was) => ({ ...was, active: true }));
  const onLeave = () => setPose({ x: 0, y: 0, active: false });

  const lifted = pose.active;
  const transform = reduce
    ? `rotate(${tilt}deg) translateY(${lifted ? -6 : 0}px)`
    : `perspective(900px) rotate(${lifted ? tilt / 3 : tilt}deg) rotateX(${(-pose.y * TURN).toFixed(2)}deg) rotateY(${(pose.x * TURN).toFixed(2)}deg) translateY(${lifted ? -8 : 0}px) scale(${lifted ? 1.03 : 1})`;

  return (
    <div
      ref={box}
      aria-hidden
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("relative shrink-0 select-none", className)}
      /* Its size, or the column's width if that is smaller — never wider than where it sits. */
      style={{ width: `min(100%, ${width}px)` }}
    >
      <div
        className="relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{ transform, transitionDuration: lifted && !reduce ? "180ms" : undefined }}
      >
        <Image
          src={CARD_SRC}
          alt=""
          width={1408}
          height={830}
          sizes={`${width}px`}
          draggable={false}
          className={cn(
            "h-auto w-full transition-[filter] duration-500",
            lifted
              ? "drop-shadow-[0_40px_50px_rgb(0_0_0/0.65)] drop-shadow-[0_0_28px_rgb(247_120_143/0.25)]"
              : "drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)]",
          )}
        />
        {/*
          The highlight — a soft sheen that follows the pointer across the
          card's face. MASKED BY THE CARD ARTWORK ITSELF, so it takes the
          card's exact shape: it was an inset rounded rectangle, and its edge
          showed as a second outline inside the card on hover.
        */}
        {!reduce && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-300"
            style={{
              opacity: lifted ? 1 : 0,
              background: `radial-gradient(circle at ${(pose.x + 0.5) * 100}% ${(pose.y + 0.5) * 100}%, rgb(255 255 255 / 0.16), transparent 50%)`,
              WebkitMaskImage: `url(${CARD_SRC})`,
              maskImage: `url(${CARD_SRC})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          />
        )}
      </div>
    </div>
  );
}
