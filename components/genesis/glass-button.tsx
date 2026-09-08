"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useMagnetic } from "@/lib/use-magnetic";
import { cn } from "@/lib/utils";

/**
 * The Genesis pill button.
 *
 * Three surface treatments, all drawn from the references:
 *   brand  — filled brand gradient with a red bloom  (img-012 "Contact Us")
 *   luminous — warm brand core, dark label             (img-014 "Schedule a call")
 *   glass    — One UI blur over whatever is behind it  (img-013, img-044)
 *   ghost    — hairline outline only, for tertiary actions
 */

type GlassButtonProps = {
  /**
   * Opens the quick lead popup instead of navigating, and names itself as the
   * submission's source. A string rather than a boolean so it is possible to
   * tell later which CTA actually produces business.
   */
  quickContact?: string;
  children: ReactNode;
  variant?: "brand" | "luminous" | "glass" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Renders an anchor instead of a button. */
  href?: string;
  /** Trailing arrow, as on nearly every CTA in the references. */
  arrow?: boolean;
  /** Opt-in pointer-follow. Reserve for hero CTAs; it is loud in quantity. */
  magnetic?: boolean;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

const SIZES = {
  sm: "h-9 px-4 text-small gap-2",
  md: "h-11 px-6 text-small gap-2",
  lg: "h-14 px-8 text-body gap-3",
} as const;

const VARIANTS = {
  brand: [
    // BLACK on the yellow, not white. The brand accent is #ffc516: white on it
    // measures 1.58:1 and the brand's own near-black measures 12.4:1. This is
    // the one place the palette dictates the text colour rather than the
    // theme, which is why it uses --color-on-brand and not an ink token.
    "text-on-brand border border-brand-deep/50",
    "bg-[linear-gradient(180deg,#ffd658_0%,#ffc516_45%,#e0ad13_100%)]",
    "shadow-[0_8px_30px_-6px_rgb(255_197_22/0.45),0_1px_0_0_rgb(255_255_255/0.45)_inset]",
    "hover:shadow-[0_12px_44px_-6px_rgb(255_197_22/0.65),0_1px_0_0_rgb(255_255_255/0.55)_inset]",
  ],
  luminous: [
    "text-on-brand border border-brand-deep/40",
    "bg-[radial-gradient(120%_140%_at_50%_50%,#fff7e0_0%,#ffdc72_45%,#ffc516_100%)]",
    "shadow-[0_8px_34px_-4px_rgb(255_197_22/0.6),0_1px_0_0_rgb(255_255_255/0.5)_inset]",
    "hover:shadow-[0_14px_50px_-4px_rgb(255_197_22/0.8),0_1px_0_0_rgb(255_255_255/0.6)_inset]",
  ],
  glass: ["glass glass-lit text-bone", "hover:bg-white/10"],
  ghost: [
    "text-ash border border-white/12 bg-transparent",
    "hover:text-bone hover:border-white/25 hover:bg-white/5",
  ],
} as const;

/**
 * next/link with framer-motion's props bolted on. Created ONCE at module
 * scope: motion.create() returns a new component type on every call, and a new
 * type inside render unmounts and remounts the subtree on each pass — which
 * for a link means losing focus and restarting the hover spring mid-gesture.
 */
const MOTION_LINK = motion.create(Link);

export function GlassButton({
  children,
  variant = "glass",
  size = "md",
  href,
  arrow = false,
  magnetic = false,
  icon,
  className,
  onClick,
  type = "button",
  disabled,
  quickContact,
}: GlassButtonProps) {
  const { x, y, magneticProps } = useMagnetic(0.18);

  const classes = cn(
    /*
      `whitespace-nowrap` because a pill does not wrap. "Start a Project" broke
      across two lines in the nav the moment the bar grew to eight items: the
      link list is `flex-1`, so it took the slack and squeezed this button
      until its label folded inside a shape built for one line. A button's text
      wrapping is never the right answer to a narrow container — either it fits
      or the container gives.
    */
    "relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-medium",
    "transition-[background-color,border-color,box-shadow,color] duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
    "disabled:pointer-events-none disabled:opacity-50",
    SIZES[size],
    VARIANTS[variant],
    className,
  );

  const content = (
    <>
      {icon}
      <span>{children}</span>
      {arrow && <ArrowUpRight className="size-4 shrink-0" aria-hidden />}
    </>
  );

  const motionProps = {
    style: magnetic ? { x, y } : undefined,
    ...(magnetic ? magneticProps : {}),
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  };

  if (href) {
    /*
      ROUTED, NOT RELOADED — and this was breaking the work dialog.

      This branch rendered a bare <a>, so every CTA in the site that carries an
      href was a full document navigation: the client router never saw the
      click, and a route that only exists as an interception never had a
      chance to intercept. The Portfolio billboard's "View project" is the case
      Genesis reported — the tiles beside it opened the piece in a dialog
      because they use next/link, while the button under the same headline
      tore the page down and rebuilt it as a standalone page.

      Internal paths go through next/link. Everything else — external origins,
      mailto:, tel:, and a bare "#hash", which SmoothScroll handles on capture
      before React ever sees it — stays a plain anchor, because handing those
      to the router either fails or costs a needless prefetch.
    */
    const routed = href.startsWith("/");
    const MotionLink = routed ? MOTION_LINK : motion.a;

    /*
      A LINK TO ANOTHER ORIGIN OPENS IN ITS OWN TAB, and takes the usual pair
      of rel tokens with it. AI Lab's "Create Your AI Avatar" is the case that
      needed it: sent to wa.me in the same tab, the visitor's whole session on
      the site is replaced by WhatsApp Web and the back button is their only
      way back to the page they were reading.

      Scoped to http(s) so mailto: and tel: are untouched — those hand off to
      a separate application and never navigate the page, so a blank target
      would leave an empty tab behind.
    */
    const external = /^https?:\/\//.test(href);

    return (
      <MotionLink
        href={href}
        data-quick-contact={quickContact}
        className={classes}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...motionProps}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}

/**
 * Segmented pill — one lit option inside a dark trough (img-014).
 * Used where two adjacent CTAs share a container.
 */
export function GlassSegment({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass inline-flex items-center rounded-full p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative h-10 rounded-full px-6 text-small font-medium transition-colors duration-300",
              active ? "text-[#2b1a0d]" : "text-ash hover:text-bone",
            )}
          >
            {active && (
              <motion.span
                layoutId="glass-segment-active"
                className="absolute inset-0 rounded-full bg-[radial-gradient(120%_140%_at_50%_50%,#fff7e0_0%,#ffdc72_45%,#ffc516_100%)] shadow-[0_6px_28px_-4px_rgb(255_197_22/0.7)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
