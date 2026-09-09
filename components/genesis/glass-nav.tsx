"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { GlassButton } from "./glass-button";
import { ThemeToggle } from "./theme-toggle";
import { GenesisMarkMotion } from "./genesis-mark-motion";
import { homeHref, navItems, primaryCta } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Floating glass navigation.
 *
 * Sits detached from the top edge as a pill (img-013, img-015). It starts
 * near-transparent over the hero and condenses into a heavier blur once the
 * page scrolls, so it never competes with the hero headline.
 */
/** One definition for every top-level nav control, link or button. */
const NAV_LINK =
  "whitespace-nowrap rounded-full px-2.5 py-2 text-small text-ash transition-colors duration-200 hover:bg-[var(--hover-wash)] hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function GlassNav() {
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /*
    Whether the pill is currently floating over a section that pins itself
    dark. The Brain is now the first thing on the page and it is ALWAYS dark,
    in either theme — so in light mode the nav was a pale pill sitting on a
    black hero, with a dark wordmark on it that all but vanished.

    `body:has(main.scene-dark) header` already handles a page whose whole main
    element is a dark scene. This is the other case: one dark section at the
    top of an otherwise light page, which that rule deliberately does not
    match (a mid-page dark section must not flip the chrome).
  */
  const [overDark, setOverDark] = useState(false);
  const darkUntil = useRef(0);
  const { scrollY } = useScroll();
  const headerRef = useRef<HTMLElement>(null);

  /*
    Escape and click-outside. The sheet had neither: once open, the only way
    to dismiss it was to hit an X, which is not what anyone expects from a
    menu and leaves keyboard users stuck in it.
  */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const header = headerRef.current;
      if (header && !header.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Capture phase, so a link inside the page cannot navigate before the
    // menu closes and leave it open on the next view.
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [menuOpen]);

  /*
    Measure how far the leading dark section runs, once and on resize, rather
    than reading layout on every scroll frame.
  */
  useEffect(() => {
    const measure = () => {
      const first = document.querySelector("main > *");
      const isDark =
        first instanceof HTMLElement && first.classList.contains("scene-dark");
      darkUntil.current = isDark
        ? first.getBoundingClientRect().height + window.scrollY
        : 0;
      setOverDark(isDark && window.scrollY + 96 < darkUntil.current);
    };
    measure();
    window.addEventListener("resize", measure);
    // Fonts and images settle after load and change the section's height.
    window.addEventListener("load", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (value) => {
    setCondensed(value > 40);
    setOverDark(darkUntil.current > 0 && value + 96 < darkUntil.current);
  });

  return (
    <header
      ref={headerRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-6"
    >
      {/*
        DRIVEN BY THE TOKENS, not by hardcoded values. This component used to
        animate between rgba(255,255,255,0.03) and 0.07 with blur(12px)/28px of
        its own, which meant the most visible glass surface on the site opted
        out of the one place glass is defined — and sat at 3% where the token
        was 5%. Measured on the hero it lifted its background by +3.4 luminance
        against the +18.6 of Genesis's own artwork.

        It now wears .glass and swaps to .glass-strong once scrolled, so it
        inherits any future change to --glass-fill. Framer cannot interpolate
        between CSS custom properties, so the crossfade is a CSS transition
        rather than an animate prop.
      */}
      <nav
        className={cn(
          "glass glass-lit pointer-events-auto flex w-full max-w-6xl items-center gap-4 rounded-full",
          // No border utility here: .glass already sets one from
          // --glass-border, and the `border-white/10` that used to sit here
          // overrode it with a white line on a near-white pill — measured
          // 1.00:1 against the pill's own surface in the light theme.
          "px-4 py-3 sm:px-6",
          "transition-[background-color,backdrop-filter] duration-500 ease-out",
          condensed && "glass-strong",
          // Takes the dark scene's tokens — inks, glass fill, border and the
          // white wordmark — for as long as it is over one, WITHOUT taking
          // its opaque background. See .on-dark.
          overDark && "on-dark",
        )}
      >
        {/*
          BACK TO THE BRAIN, not to "/". Genesis asked for the wordmark to
          lead to the orb; on the homepage "/" was a link to the page you were
          already on, which did nothing when clicked. See homeHref.
        */}
        <Link
          href={homeHref}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={`${"Genesis Media"}, back to the Brain`}
        >
          {/*
            THE ANIMATED LOCKUP. Genesis supplied footage for this slot and
            asked for it to run here. It replaces the sheen that used to
            sweep the still mark; see GenesisMarkMotion for the crop, the
            two blend modes and the Reduce Motion still.
          */}
          <GenesisMarkMotion />
        </Link>

        {/*
          FIVE ITEMS. The verticals came off the bar — the Brain is how you
          reach a division now — leaving Work, Case Studies, the two forms and
          contact. See navItems for why those first two are separate.

          lg AGAIN, AND THE MEASUREMENT IS WHY. Eight items needed about
          1150px beside the wordmark, the toggle and the CTA, which is what
          pushed this to xl and gave every laptop under 1280 the hamburger.
          Five short ones measure roughly 500px, so the full bar comes back at
          lg with room to spare.
        */}
        {/*
          CENTRED IN THE SPACE BETWEEN THE LOCKUP AND THE ACTIONS, which is
          what makes the bar read as even.

          IT WAS LEFT-ALIGNED AND THAT IS WHAT LOOKED WRONG. Measured on a
          1512 display: the five links sat 24px from the lockup and 231px from
          the theme toggle. Their spacing among themselves was already even —
          2px of gap either side of 10px of link padding, so 22px between one
          word and the next — but a block with a sliver on one side and a void
          ten times bigger on the other does not read as aligned to anything.
          It reads as floating.

          THE ANIMATED LOCKUP MADE IT WORSE, and this is the part that is not
          obvious from the CSS. That canvas is 191px wide but "GENESIS." alone
          is about 76 of them: the rest is deliberately empty, reserved for
          the division name that animates in and out (see CSS_HEIGHT in
          GenesisMarkMotion for why the box has to be that shape). So the gap
          a visitor actually SEES between the wordmark and "Work" is 24px when
          "Brand & Design" is showing and about 140px when nothing is — the
          left-hand gap pulses while the right-hand void never moves.

          `justify-center` on the flex-1 list splits the leftover space evenly
          instead, so the gutters match by construction and stay matched as
          the lockup animates and at every width the full bar is shown. The
          bar becomes the conventional three-part header it always looked like
          it was meant to be: mark left, links centre, actions right.
        */}
        <ul className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className={NAV_LINK}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/*
          `shrink-0`: the link list beside this is flex-1 and will happily take
          every pixel this cluster needs. The toggle and the CTA are fixed
          furniture — they are what the bar shrinks AROUND, not what shrinks.
        */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle className="hidden lg:inline-flex" />

          <GlassButton
            href={primaryCta.href}
            variant="brand"
            size="sm"
            className="hidden sm:inline-flex"
            arrow
          >
            {primaryCta.label}
          </GlassButton>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass glass-strong pointer-events-auto absolute inset-x-4 top-20 rounded-panel p-4 lg:hidden"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="micro-label">Menu</span>
              {/*
                The toggle lives here as well as in the pill. In the pill it is
                `hidden lg:inline-flex`, and it appeared nowhere else — so on
                every phone and tablet the theme could not be changed at all.
              */}
              {/*
                No close button here. The pill's own toggle already shows an X
                while the menu is open, at the same x and 67px above this row —
                two identical affordances an inch apart. This row carries the
                theme toggle instead, which had no mobile home at all.
              */}
              <ThemeToggle />
            </div>
            <ul className="flex flex-col">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-card px-3 py-3 text-small text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>


            <GlassButton
              href={primaryCta.href}
              variant="brand"
              size="md"
              arrow
              className="mt-3 w-full"
            >
              {primaryCta.label}
            </GlassButton>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
