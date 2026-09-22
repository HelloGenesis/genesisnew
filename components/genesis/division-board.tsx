"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { DivisionLockup } from "@/components/genesis/division-lockup";
import { GenesisMark } from "@/components/genesis/genesis-mark";
import { NeuralOrb, type OrbFocus } from "@/components/genesis/neural-orb";
import { services } from "@/lib/home-content";
import { cn } from "@/lib/utils";

/**
 * The Brain — the orb, the wordmark at its core, and the four divisions in
 * their four corners, as one interactive composition.
 *
 * IT USED TO BE FOUR SEPARATE THINGS IN A GRID. The orb rendered itself, each
 * name was an independent link with its own hover, and nothing connected
 * them: pointing at AI Lab lifted AI Lab half a pixel and the sphere in the
 * middle of the picture carried on as though nothing had happened. Genesis's
 * read was exactly that — "the main purpose is to make the full composition
 * feel like one connected system rather than separate objects around a centre
 * graphic" — so the hover now lives in ONE place and drives all five parts of
 * the picture at once.
 *
 * WHAT A HOVER DOES, and each part is one of Genesis's numbered asks:
 *
 *   THE NAME ITSELF comes forward — full strength, a touch larger, and a
 *     lift of 6px TOWARD THE SPHERE rather than straight up, which is what
 *     turns four things arranged around a centre into four things attached to
 *     it.
 *   ITS DESCRIPTION fades in and rises. It is hidden at rest on any device
 *     that can hover, and permanently visible on one that cannot — see the
 *     note on the tagline classes.
 *   THE OTHER THREE drop back to 45%. This is the part that actually
 *     answers "I am currently interacting with AI Lab" — a highlight with no
 *     contrast against its neighbours is just a highlight.
 *   THE ORB TURNS AND LIGHTS toward that division's own corner. Influence
 *     top-left, AI Lab top-right, Studios bottom-right, Brand & Design
 *     bottom-left, which is the arrangement on screen.
 *
 * THE FIRST LOAD IS A SEQUENCE, NOT A REVEAL. Genesis: navbar, then the orb,
 * then the wordmark, then the four verticals, the whole thing inside about a
 * second and a half. The nav runs its own entrance (see GlassNav); the three
 * stages below are timed against the same clock and the verticals arrive from
 * the direction of the corner they occupy, roughly 20px, which is the "slight
 * directional movement" asked for rather than a slide.
 *
 * WHY MOUNT AND NOT whileInView. This is the first thing on the page — a
 * viewport-triggered reveal fires on the same frame anyway, and doing it that
 * way makes the order of the sequence an accident of intersection callbacks
 * rather than something written down.
 */

/**
 * Which corner each division holds, as a direction from the sphere's centre.
 * x right, y down. Read in `services.items` order — Influence, Brand &
 * Design, Studios, AI Lab — which is NOT reading order and is why this is a
 * table rather than arithmetic on the index.
 *
 * It drives three things that must not disagree: where the name sits in the
 * grid (PLACEMENT, below), which way it leans when hovered, and where the orb
 * lights up. One source, so a fifth division or a reordering cannot leave the
 * sphere answering the wrong corner.
 */
const CORNERS: OrbFocus[] = [
  { x: -1, y: -1 }, // Influence — top-left
  { x: -1, y: 1 }, //  Brand & Design — bottom-left
  { x: 1, y: 1 }, //   Studios — bottom-right
  { x: 1, y: -1 }, //  AI Lab — top-right
];

/**
 * Where each division sits, in order. Written as whole class strings because
 * Tailwind reads the source for literals; `lg:col-start-${n}` compiles to
 * nothing at all.
 *
 * THE SAME FOUR CORNERS ON A PHONE. Below `lg` this used to fall back to one
 * column: the orb, then the four names stacked under it, a screen and a half
 * of scrolling for what is one diagram on desktop. A phone gets the same
 * arrangement turned on its side — two names above the orb, two below, each
 * in the quadrant it holds on desktop — which is also what lets CORNERS above
 * be true at every width.
 *
 * CENTRED IN THEIR QUADRANTS ON A PHONE, not hugging the middle. Pushed to
 * the centre line a pair is only balanced if its two names are the same
 * width, and Brand & Design is more than twice Studios. Desktop keeps its
 * inward alignment from `lg`, where the names sit beside the orb rather than
 * above and below it.
 */
const PLACEMENT = [
  "col-start-1 row-start-1 items-center text-center lg:col-start-1 lg:row-start-1 lg:items-end lg:text-right",
  "col-start-1 row-start-3 items-center text-center lg:col-start-1 lg:row-start-2 lg:items-end lg:text-right",
  "col-start-2 row-start-3 items-center text-center lg:col-start-3 lg:row-start-2 lg:items-start lg:text-left",
  "col-start-2 row-start-1 items-center text-center lg:col-start-3 lg:row-start-1 lg:items-start lg:text-left",
];

/** The entrance, in Genesis's order and inside their 1.5s budget. */
const ENTER = {
  orb: 0.12,
  mark: 0.46,
  names: 0.72,
  /** Between one vertical and the next. Four of them, so the last lands at 1.4s. */
  stagger: 0.07,
  duration: 0.52,
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function DivisionBoard() {
  const [active, setActive] = useState<number | null>(null);
  /**
   * The division a reader has just clicked, held for the length of the scroll.
   *
   * Genesis asked for clicking a vertical to feel like a transition into that
   * section rather than an anchor jump: the chosen name comes forward, the
   * rest of the composition falls back, and the page travels. The scroll
   * itself is SmoothScroll's, which runs 1.2s; this only dresses the frame it
   * leaves from, and clears itself afterwards so coming back up the page
   * finds the board as it was.
   */
  const [departing, setDeparting] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();

  /*
    THE CURSOR PARALLAX, as two custom properties rather than as state.

    Genesis asked for it restrained and NUMBERED: the orb 4-8px, the internal
    gradient more than that, the names 1-3px — "the section should not feel
    like everything is chasing the cursor". Writing --par-x/--par-y straight
    onto the stage means a pointer move costs one style write and no React
    render at all, and each part downstream decides for itself how much of
    that to take. The orb's own lean (a few degrees of yaw on the canvas) is
    separate and lives in NeuralOrb.
  */
  useEffect(() => {
    const el = stage.current;
    if (!el || still) return;
    /* Coarse pointers have no hover to parallax from, and reading layout on
       every touchmove is the worst place to do it. */
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;
      el.style.setProperty("--par-x", pending.x.toFixed(3));
      el.style.setProperty("--par-y", pending.y.toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pending = {
        x: Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)),
        y: Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)),
      };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      pending = { x: 0, y: 0 };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const zone = el.closest("section") ?? el;
    zone.addEventListener("pointermove", onMove as EventListener, { passive: true });
    zone.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      zone.removeEventListener("pointermove", onMove as EventListener);
      zone.removeEventListener("pointerleave", onLeave);
    };
  }, [still]);

  const leave = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (departing === null) return;
    const timer = window.setTimeout(() => setDeparting(null), 1300);
    return () => window.clearTimeout(timer);
  }, [departing]);

  const focus = active === null ? null : CORNERS[active];
  const chosen = departing;

  return (
    <div
      ref={stage}
      /*
        --par-x/--par-y are declared here with a value so every consumer below
        has something to read on the first frame. A `calc()` against an
        undefined custom property is an invalid value, not zero, and the whole
        transform would be dropped until the first pointer move.
      */
      style={{ "--par-x": 0, "--par-y": 0 } as React.CSSProperties}
      /*
        NO TOP MARGIN. This board is the first thing in its section now — the
        positioning line moved underneath it — so the space above it is the
        section's own padding. The margin was here to clear a heading that is
        no longer above it.
      */
      className="grid grid-cols-2 items-center gap-x-5 gap-y-6 lg:grid-cols-[1fr_minmax(0,20rem)_1fr] lg:grid-rows-2 lg:gap-x-8 lg:gap-y-12 xl:grid-cols-[1fr_minmax(0,26rem)_1fr] xl:gap-x-12"
    >
      <motion.div
        initial={still ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: ENTER.orb, ease: EASE }}
        className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1"
      >
        {/*
          CENTRED BY TRANSLATE, NOT BY MARGINS. The orb overruns its own column
          into the grid gap, and negative margins only centre that overrun
          while the width fills the space they open — on a laptop the height
          bound wins and the box is narrower, so it sat 20px left of centre.
          Half the column plus a translate of half the box centres it at any
          width.

          THE PARALLAX RIDES ON THE SAME TRANSFORM, which is why it is written
          into the class rather than applied to an inner box: `translate` and
          `-translate-x-1/2` are one property, and a second element just to
          hold 6px of drift is a box that exists for nothing. 6px is the
          middle of Genesis's 4-8.
        */}
        <div className="relative mx-auto w-[min(62vw,17rem,36vh)] motion-safe:translate-x-[calc(var(--par-x)*6px)] motion-safe:translate-y-[calc(var(--par-y)*6px)] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out lg:left-1/2 lg:mx-0 lg:w-[min(130%,58vh)] lg:-translate-x-1/2 lg:motion-safe:translate-x-[calc(-50%+var(--par-x)*6px)]">
          <NeuralOrb focus={focus} />

          {/*
            The wordmark at the core, and the third beat of the entrance. It
            fades up rather than arriving with the sphere, because the
            sequence Genesis wrote is orb THEN logo — the sphere has to be a
            sphere before anything is written across it.

            aria-hidden because the header already carries the real wordmark;
            a second "Genesis Media" in the accessibility tree is noise, and
            this one is a picture.
          */}
          <motion.div
            aria-hidden
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: ENTER.mark, ease: EASE }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <GenesisMark
              animated
              className="h-auto w-[64%] aspect-[8.8/1]"
              sizes="(min-width: 1280px) 330px, (min-width: 1024px) 255px, 40vw"
            />
          </motion.div>
        </div>
      </motion.div>

      {services.items.map((service, index) => {
        const corner = CORNERS[index];
        const isActive = active === index;
        const dimmed = active !== null && !isActive;
        /* Everything except the one being travelled to gets out of the way. */
        const leaving = chosen !== null && chosen !== index;

        return (
          <motion.div
            key={service.title}
            /*
              ARRIVING FROM ITS OWN CORNER. 20px, which is the middle of
              Genesis's 15-25, in the direction the name already sits — so the
              four converge on the sphere rather than all rising together.
            */
            initial={still ? false : { opacity: 0, x: corner.x * 20, y: corner.y * 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{
              duration: ENTER.duration,
              delay: ENTER.names + index * ENTER.stagger,
              ease: EASE,
            }}
            className={cn("flex flex-col", PLACEMENT[index])}
          >
            <Link
              href={service.href}
              /*
                NO PREFETCH. On this page a plain click scrolls to the
                division's section rather than navigating (SmoothScroll), so
                prefetching the four division pages would fetch four documents
                nobody here opens. The href is for crawlers and for cmd-click.
              */
              prefetch={false}
              onPointerEnter={() => setActive(index)}
              onPointerLeave={leave}
              onFocus={() => setActive(index)}
              onBlur={leave}
              onClick={() => setDeparting(index)}
              /*
                THE WHOLE VERTICAL IS THE TARGET, name and caption together —
                a two-line block where only the first line is clickable is a
                small target and an arbitrary one. `group` drives the caption's
                own state from here.
              */
              className={cn(
                "group flex w-full flex-col rounded-sm outline-none",
                "transition-[transform,opacity,filter] duration-300 ease-out",
                "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
                /* The names take the smallest share of the parallax: 2px,
                   inside Genesis's 1-3. */
                "motion-safe:[--drift-x:calc(var(--par-x)*2px)] motion-safe:[--drift-y:calc(var(--par-y)*2px)]",
                dimmed && "opacity-45",
                leaving && "opacity-0",
              )}
              style={{
                /*
                  THE LIFT IS TOWARD THE SPHERE, not up. `-corner` is the
                  direction from the name back to the centre, so the top-left
                  division moves right and down and the bottom-right one moves
                  left and up — four names closing on one body. 6px, in
                  Genesis's 5-8.

                  Written as an inline transform rather than as a Tailwind
                  class because it composes the parallax drift with a
                  per-division direction; as classes that is eight literals
                  that have to stay in step with CORNERS.
                */
                transform: `translate3d(calc(var(--drift-x, 0px) + ${
                  isActive ? -corner.x * 6 : 0
                }px), calc(var(--drift-y, 0px) + ${isActive ? -corner.y * 6 : 0}px), 0) scale(${
                  isActive || chosen === index ? 1.035 : 1
                })`,
              }}
            >
              <DivisionLockup
                name={service.short}
                tagline={service.caption}
                ramp={service.ramp}
                as="h3"
                fluid
                /*
                  THE NAME SET: the short name, no GENESIS prefix, and the
                  tagline cropped out of the artwork so it can be live text
                  below. The wordmark is already at the orb's core, so the
                  full lockup in all four corners made the composition say
                  GENESIS five times.
                */
                nameOnly
                /*
                  HIDDEN UNTIL POINTED AT — back to what it was, at Genesis's
                  instruction ("sirf hover hone pe dikhe, jaise pehle tha").

                  IT WAS ALWAYS-ON FOR A ROUND, and the reasoning is worth
                  keeping because it was not wrong, only outvoted: the written
                  feedback asked that a visitor understand the four divisions
                  "within the first few seconds without having to scroll
                  further", which a hidden subtitle cannot do. Living with it,
                  Genesis's read is that four permanent captions crowd the
                  composition — the board is a diagram, and four lines of grey
                  type under four gradient names turns it into a menu. The
                  heading above the orb now carries the first-few-seconds job
                  on its own.

                  IT STILL FADES IN AND RISES rather than simply appearing,
                  which was a separate instruction and survives this one: the
                  line sits 4px low at rest and settles as it fades up.

                  ONLY WHERE THERE IS A HOVER TO GIVE. `@media (hover: hover)`
                  is what hides it — so a touch screen, which can never
                  produce the hover this is gated on, shows the line
                  permanently instead of hiding it forever. That is the one
                  part that is deliberately NOT "jaise pehle tha": the old
                  version was `hidden lg:block`, so on a phone the
                  descriptions did not exist at all, and "show it on hover" is
                  not an instruction a device without hover can carry out.

                  IT RESERVES ITS SPACE EITHER WAY. Opacity and transform
                  only, never mounting, so moving between the four names
                  cannot push the other three around. The min-height keeps the
                  four marks on one line as the taglines wrap to one line or
                  two at different widths.
                */
                taglineClassName={cn(
                  /*
                    `whitespace-normal` IS LOAD-BEARING. DivisionLockup's own
                    tagline class sets `whitespace-nowrap` below `sm` — that
                    was written when this line was hidden on phones and only
                    had to hold one line on the division PAGES. Left in place
                    here it ran "AI Content · Avatars · Automation · Games &
                    Apps" as a single 300px line inside a 154px column, so the
                    two halves of the board printed straight through each
                    other. It wraps.
                  */
                  "mt-2 block min-h-[2.7em] whitespace-normal text-balance text-[0.6875rem] leading-[1.4] text-bone sm:mt-3 sm:text-small",
                  /*
                    The resting state, on pointer devices only: invisible and
                    sitting 4px low, so revealing it is a fade AND a rise. A
                    touch screen matches neither selector and keeps the
                    defaults above, which is the line permanently visible.
                  */
                  "[@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0",
                  "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
                  "group-hover:translate-y-0 group-hover:opacity-100",
                  "group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
                )}
                /*
                  ABOVE THE FOLD, SO NOT LAZY. These four names are the
                  homepage's Largest Contentful Paint — measured, Brand &
                  Design's is the LCP element — and a lazy image is fetched
                  only after layout proves it is on screen, at low priority.
                */
                priority
              />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
