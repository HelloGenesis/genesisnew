import Image from "next/image";

import { cn } from "@/lib/utils";

const SIZES = { sm: 168, md: 280, lg: 400 } as const;

/**
 * THE GENESIS MEMBERSHIP CARD — the object a subscription is, drawn as one.
 *
 * Genesis's own artwork (28 Sep 2026): a black card with a gold edge, the
 * brand's dotted orb glowing violet to amber, the N mark at its heart and
 * "Genesis Club Membership" along the foot. It replaced a card drawn in CSS
 * after the Designjoy reference. The file is the card alone, its corners
 * transparent, so it lies on any surface.
 *
 * Tilted and lifted the way a card lies on a table, so it reads as a thing
 * you get, not a panel. Three sizes: `lg` beside the footer calendar, `md` in
 * the homepage memberships block and the /pricing opening. Decorative — every
 * place it appears already says "membership" in words — so it is hidden from
 * assistive tech.
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
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none relative shrink-0 select-none", className)}
      /* Its size, or the column's width if that is smaller — never wider than where it sits. */
      style={{ width: `min(100%, ${width}px)`, rotate: `${tilt}deg` }}
    >
      <Image
        src="/brand/genesis-membership-card.webp"
        alt=""
        width={1408}
        height={830}
        sizes={`${width}px`}
        className="h-auto w-full drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)]"
      />
    </div>
  );
}
