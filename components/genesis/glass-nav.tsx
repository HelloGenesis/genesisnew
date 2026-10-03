"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DivisionLockup, DivisionName } from "./division-lockup";
import { CartButton } from "./cart";
import { GlassButton } from "./glass-button";
import { ThemeToggle } from "./theme-toggle";
import { GenesisMarkMotion } from "./genesis-mark-motion";
import { homeHref, navItems, primaryCta, type NavItem } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Floating glass navigation.
 *
 * Sits detached from the top edge as a pill (img-013, img-015). It starts
 * near-transparent over the hero and condenses into a heavier blur once the
 * page scrolls, so it never competes with the hero headline.
 */
/**
 * One definition for every top-level nav control, link or button.
 *
 * THE HOVER IS A RULE THAT GROWS, not only a wash. Genesis asked for smoother
 * micro-interactions on the bar, and a background tint alone is the weakest
 * hover a link can have: it tells you the target's BOX, which on a pill with
 * 10px of padding is barely larger than the word. A hairline drawn from the
 * centre outward is read as the word itself responding, and it is one
 * pseudo-element with a scale transform — composited, never a layout.
 *
 * `after:origin-center` with `scale-x-0` is what makes it grow from the
 * middle; growing from the left reads as a progress bar filling.
 */
const NAV_LINK = cn(
  /*
    A LITTLE TIGHTER BETWEEN lg AND xl, for "Pricing". The sixth item put the
    bar 15px over at 1024 — "Start a Project" ran out of the pill. 4px off
    each side of every link, at those widths only, buys it back; from xl the
    bar has room and is as it was.
  */
  /* Seven items from xl (four divisions, Case Studies, Pricing, Contact): 2px off each side until 2xl. */
  "relative whitespace-nowrap rounded-full px-2.5 py-2 text-small text-ash xl:max-2xl:px-2",
  "transition-colors duration-300 hover:bg-[var(--hover-wash)] hover:text-bone",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
  "after:pointer-events-none after:absolute after:inset-x-2.5 after:bottom-1 after:h-px",
  "after:origin-center after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 after:ease-out",
  "hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none",
);

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
    <motion.header
      ref={headerRef}
      /*
        THE FIRST BEAT OF THE PAGE'S ENTRANCE. Genesis's load sequence is
        navbar, then the orb, then the wordmark, then the four verticals — so
        the bar is what opens it, and DivisionBoard's own delays are measured
        against this arriving at roughly 0.36s.

        It is also the only entrance the bar has: it is `fixed`, so it can
        neither be revealed on scroll nor be part of any section's stagger.
        8px and a fade, because a pill that flies in from off-screen is the
        dramatic version Genesis explicitly did not ask for.
      */
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
          "nav-bar glass glass-lit pointer-events-auto flex w-full max-w-7xl items-center gap-4 rounded-full",
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
          className="-my-2 flex min-h-10 shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
        {/*
          THE FULL BAR FROM xl (1280px), the menu button below it (Genesis, 2 Oct
          2026). With the four divisions on the bar as their own menus, a
          1024px laptop pushed "Start a Project" off the right edge.
        */}
        <ul className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {navItems.map((item) =>
            item.children || item.items?.length ? (
              <NavMenu key={item.label} item={item} />
            ) : (
              <li key={item.label}>
                <Link href={item.href} {...outbound(item)} className={NAV_LINK}>
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        {/*
          `shrink-0`: the link list beside this is flex-1 and will happily take
          every pixel this cluster needs. The toggle and the CTA are fixed
          furniture — they are what the bar shrinks AROUND, not what shrinks.
        */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle className="hidden xl:inline-flex" />
          <CartButton />

          {/*
            "SLIGHT MOVEMENT/GLOW ON START A PROJECT", which is Genesis's
            one specific note about this cluster. A 1px lift and a soft halo
            in the brand — enough that the button reads as the live thing on
            the bar, short of the pulsing CTA every template ships with. The
            shadow is on the accent at 28%, so it is a warmth around the pill
            rather than a ring drawn on it.
          */}
          <GlassButton
            href={primaryCta.href}
            variant="brand"
            size="sm"
            className="hidden transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_6px_20px_-6px_rgb(255_197_22/0.55)] sm:inline-flex"
            arrow
          >
            {primaryCta.label}
          </GlassButton>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand xl:size-9 xl:hidden"
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
            className="glass glass-strong pointer-events-auto absolute inset-x-4 top-20 rounded-panel p-4 xl:hidden"
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
                    {...outbound(item)}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-card px-3 py-3 text-small text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone"
                  >
                    {/* A division is its logo — the N and the name — as everywhere else. */}
                    {item.short ? (
                      <>
                        <span className="sr-only">{item.label}</span>
                        <DivisionName name={item.short} height={22} />
                      </>
                    ) : (
                      item.label
                    )}
                  </Link>
                  {/*
                    THE SUBMENU IS ALWAYS OPEN ON A PHONE, which is the right
                    call rather than a shortcut. A sheet is already a
                    disclosure — the reader opened it — so putting a second
                    one inside it makes the four divisions two taps deep in a
                    menu with six items in it. They are indented under their
                    parent and that is the whole treatment.
                  */}
                  {item.children && (
                    <ul className="mb-1 ml-3 flex flex-col border-l border-[var(--glass-border)] pl-3">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            data-page-link
                            data-work-mode={child.workMode}
                            onClick={() => setMenuOpen(false)}
                            className="block rounded-card px-3 py-2.5 text-small transition-colors hover:bg-[var(--hover-wash)]"
                          >
                            <span className="bg-[linear-gradient(100deg,#a77be8_0%,#f2607e_55%,#f09a2e_100%)] bg-clip-text font-medium text-transparent">
                              {child.label}
                            </span>
                          </Link>
                          {/*
                            THE SERVICES ARE ON THE DESKTOP PANEL AND NOT
                            HERE. Four divisions with their three or four
                            services each is nineteen rows of unclickable
                            text inside a sheet a reader opened to navigate —
                            it would push Contact off the bottom of a phone
                            to describe columns they cannot click. The
                            division names are the navigation; the services
                            are what the wide panel has room to explain.
                          */}
                        </li>
                      ))}
                    </ul>
                  )}
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
    </motion.header>
  );
}

/**
 * One nav item that is a menu — Services, and today the only one.
 *
 * IT OPENS ON HOVER AND ON CLICK, AND THAT IS TWO DIFFERENT AUDIENCES RATHER
 * THAN A BELT-AND-BRACES. Hover is what a pointer user expects from a bar
 * like this and costs them nothing; it is also unreachable from a keyboard
 * and from every touch screen, where the first tap would otherwise follow the
 * trigger's own href and the menu would never be seen at all. The click
 * handler covers both, so the panel is reachable by pointer, by tab and by
 * thumb.
 *
 * THE TRIGGER IS A BUTTON, NOT A LINK, for the same reason. A link whose
 * click is swallowed to open a menu lies to the status bar and to anyone
 * middle-clicking it. The Brain — where the trigger would have gone — is the
 * first item INSIDE the panel instead, so nothing is lost.
 *
 * THE PANEL CLOSES ON ESCAPE AND ON LEAVING, and a focus leaving the
 * subtree closes it too: tabbing past the last division should not leave a
 * panel hanging over the page.
 */
function NavMenu({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  /* A menu of plain links (Pricing) rather than division columns (Services). */
  const simple = !item.children?.some((child) => child.short || child.items?.length);
  /* A division of its own on the bar: its mark, its services and its page. */
  const division = !item.children && (item.items?.length ?? 0) > 0;

  /*
    CLOSE ON ANY LINK INSIDE, read in the capture phase: SmoothScroll handles
    a same-page jump ("/pricing#plans" while on /pricing) there and stops the
    click before React's own onClick would have closed the menu.
  */
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a");
      if (link && holder.current?.contains(link)) setOpen(false);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [open]);
  const holder = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <li
      ref={holder}
      className="relative"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onBlur={(event) => {
        /* Only when focus has left the whole item, not when it moves between
           the trigger and the links inside. */
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      {/*
        THE NAME IS A LINK, THE CHEVRON OPENS THE MENU (Genesis, 2 Oct 2026:
        "make these clickable and redirect to their pages"). Hovering still
        opens the menu; a click on "Studios" goes to /content-production. The
        chevron is its own button so a keyboard or a touch screen can still
        open the menu without leaving the page.
      */}
      <span className="inline-flex items-center">
        <Link href={item.href} {...outbound(item)} data-page-link className={cn(NAV_LINK, "pr-1 xl:max-2xl:pr-1")}>
          {item.label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={`${item.label} menu`}
          onClick={() => setOpen((was) => !was)}
          className="-ml-0.5 grid size-7 place-items-center rounded-full text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3.5 transition-transform duration-300",
              open && "rotate-180",
            )}
          />
        </button>
      </span>

      <AnimatePresence>
        {open && division && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-10 w-72 -translate-x-1/2 pt-3"
          >
            <div className="menu-glass rounded-panel p-4">
              <Link href={item.href} data-page-link onClick={() => setOpen(false)} className="block w-fit focus-visible:outline-none">
                {item.short ? (
                  <DivisionLockup
                    name={item.short}
                    tagline=""
                    ramp={item.ramp ?? ""}
                    as="h3"
                    nameOnly
                    height={20}
                    taglineClassName="hidden"
                  />
                ) : (
                  <span className="text-body text-bone">{item.label}</span>
                )}
              </Link>
              <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--glass-border)] pt-3">
                {item.items?.map((service) => (
                  <li key={service}>
                    <Link
                      href={item.href}
                      data-page-link
                      onClick={() => setOpen(false)}
                      className="block rounded-card px-2 py-1.5 text-small leading-snug text-ash transition-colors duration-200 hover:bg-[var(--hover-wash)] hover:text-[var(--menu-hover)] focus-visible:text-[var(--menu-hover)] focus-visible:outline-none"
                    >
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={item.href}
                data-page-link
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center gap-1.5 border-t border-[var(--glass-border)] pt-3 text-small text-bone transition-colors hover:text-brand-ink"
              >
                View {item.label === "AI Lab" ? "AI Labs" : item.label}
                <ArrowRight className="size-3.5 text-brand-ink" aria-hidden />
              </Link>
            </div>
          </motion.div>
        )}
        {open && simple && !division && (
          /*
            A SMALL MENU — Pricing's two links — hangs under its own trigger
            rather than spanning the bar like the Services panel. Padding, not
            margin, bridges the gap so the pointer can cross it.
          */
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-10 w-72 -translate-x-1/2 pt-3"
          >
            <ul className="menu-glass rounded-panel p-2">
              {item.children?.map((child) => (
                <li key={child.label}>
                  <Link
                    href={child.href}
                    data-page-link
                    data-work-mode={child.workMode}
                    onClick={() => setOpen(false)}
                    className="block rounded-card px-4 py-3 transition-colors hover:bg-[var(--hover-wash)] focus-visible:bg-[var(--hover-wash)] focus-visible:outline-none"
                  >
                    <span className="block w-fit bg-[linear-gradient(100deg,#a77be8_0%,#f2607e_55%,#f09a2e_100%)] bg-clip-text text-transparent text-body font-medium">{child.label}</span>
                    {child.description && (
                      <span className="mt-0.5 block text-[0.75rem] leading-snug text-ash">{child.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {open && !simple && !division && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            /*
              A BRIDGE OF PADDING, not a gap. The panel sits below the trigger
              and the pointer has to cross the space between them; with a
              margin that space is outside the item, `pointerleave` fires
              halfway there and the menu shuts under the cursor. Padding keeps
              it inside the hover target.
            */
            /*
              FOUR COLUMNS, CENTRED ON THE BAR RATHER THAN ON THE TRIGGER.

              A panel this wide hung under one word would run off the right
              of a 1280 screen — "Services" sits left of centre. It is pinned
              to the viewport's middle instead and capped at the page's own
              measure, so it lines up with the content underneath it the way
              a mega-menu should.
            */
            className="fixed left-1/2 top-[4.5rem] z-10 w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 pt-3"
          >
            {/*
              OPAQUE, NOT GLASS — "itna transparent kyu hai, dikh hi nahi raha
              kuch", and the report is exact.

              Glass is a translucent fill over a blur, which works for the nav
              pill: that sits over one scene at a time and is 64 points tall,
              so whatever shows through is a smear. This panel is 500 points
              of small type hanging over the middle of a page, and what showed
              through was the FOOTER — its links, its column headings and its
              giant ghosted wordmark — interleaved with the menu's own text at
              almost the same weight. Two sets of words in one space is not a
              legibility problem to be tuned, it is a panel that needs a floor.

              `--surface-raised` is the page's own raised ground and is opaque
              in both themes, so the blur below it is belt and braces now
              rather than the thing doing the work.
            */}
            <div className="menu-glass rounded-panel p-6">
              <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                {item.children?.map((child) => (
                  <div key={child.label}>
                    {/*
                      THE COLUMN HEADING IS THE ONLY LINK IN IT. The services
                      under it have no pages of their own, and inventing
                      anchors for them would be inventing content — so the
                      division is the destination and the list is what it
                      covers. Making the heading the link also means the
                      largest target in each column is the one that goes
                      somewhere.
                    */}
                    <Link
                      href={child.href}
                      data-page-link
                      onClick={() => setOpen(false)}
                      className="group/col block"
                    >
                      {/*
                        THE DIVISION'S OWN MARK, NAME ONLY — Genesis asked for
                        the short lockup here rather than the route's name set
                        in type. `nameOnly` is the artwork with the symbol and
                        the tagline cropped away, which is exactly what a
                        column heading wants: the four are normalised to one
                        letter height, so they line up the way four text
                        headings would while carrying the brand's gradients.

                        The lockup's own tagline is hidden too: Genesis wants
                        the name and nothing under it.
                      */}
                      {child.short ? (
                        <DivisionLockup
                          name={child.short}
                          tagline=""
                          ramp={child.ramp ?? ""}
                          as="h3"
                          nameOnly
                          height={20}
                          taglineClassName="hidden"
                        />
                      ) : (
                        <span className="block text-small font-medium text-bone transition-colors group-hover/col:text-brand-ink">
                          {child.label}
                        </span>
                      )}
                      {/*
                        NO TAGLINE UNDER THE NAME. "Creator-led growth" and
                        its three siblings sat here; Genesis asked for all
                        four gone. The mark is the heading and the services
                        below say what the division does.
                      */}
                    </Link>

                    {child.items && child.items.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1.5 border-t border-[var(--glass-border)] pt-3">
                        {child.items.map((service) => (
                          /*
                            LINKS, SO THE HOVER IS HONEST. Genesis asked for
                            the services to turn violet on hover. These were
                            plain text on purpose — a row that lights up and
                            then does nothing when clicked is worse than one
                            that never invited it — so each now goes where its
                            heading goes: the division's page, which is where
                            that service is described. The violet is the
                            brand ramp's first stop (--menu-hover).
                          */
                          <li key={service}>
                            <Link
                              href={child.href}
                              data-page-link
                              onClick={() => setOpen(false)}
                              className="block text-small leading-snug text-ash transition-colors duration-200 hover:text-[var(--menu-hover)] focus-visible:text-[var(--menu-hover)] focus-visible:outline-none"
                            >
                              {service}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/**
 * The extra attributes for a nav item that leaves the site — "Contact" is
 * the WhatsApp chat now (see contactItem). Its own tab, so the visitor's
 * session on the site is not replaced by WhatsApp Web, and the contact
 * marker QuickContact reads to name the page in the message.
 */
function outbound(item: NavItem) {
  if (!item.external) return {};
  return {
    target: "_blank",
    rel: "noopener noreferrer",
    ...(item.contact ? { "data-contact-cta": "" } : {}),
  };
}
