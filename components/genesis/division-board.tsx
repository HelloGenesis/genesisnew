"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { DivisionLockup } from "@/components/genesis/division-lockup";
import { GenesisMark } from "@/components/genesis/genesis-mark";
import { NeuralOrb, type OrbFocus } from "@/components/genesis/neural-orb";
import { services } from "@/lib/home-content";
import { verticalCards } from "@/lib/pricing";
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
 *     top-left, AI Lab top-right, Studios bottom-left, Brand & Design
 *     bottom-right, which is the arrangement on screen.
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
  /* Brand & Design and Studios swapped sides (Genesis, 3 Oct 2026). */
  { x: 1, y: 1 }, //   Brand & Design — bottom-right
  { x: -1, y: 1 }, //  Studios — bottom-left
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
/*
  THE FOUR NAMES AROUND THE ORB, AS PILLS ON ITS EDGE (Genesis, 4 Oct 2026:
  "I actually meant like this — just the layout — also reflect it on the
  website"). Each division sits in a glass pill on the circle's rim, at
  staggered heights as in Genesis's reference: Influence high on the left,
  AI Lab a third of the way down the right, Studios low on the left, Brand &
  Design at the foot on the right. `x`/`y` are the pill's centre as a share
  of the orb's box; a left-hand pill is pulled 35% of its width over the
  orb, a right-hand one 65%, so they overlap the rim rather than float off
  it and stay inside a phone's screen. `up`: the details open above the
  pill, for the two at the foot.
*/
/*
  FROM lg, SLIMMER PILLS ON THE RIM ITSELF (Genesis, 4 Oct 2026: "thin and
  sleek, attached to the edge of the orb, the orb should be visible"): `lgX`
  is where the circle's edge is at that height, and the pill sits outside it
  with only its inner tip over the rim, so the sphere stays in view.
*/
const SPOTS: { x: number; lgX: number; y: number; side: "left" | "right"; up: boolean }[] = [
  { x: 6, lgX: 27, y: 11, side: "left", up: false }, //  Influence
  { x: 87, lgX: 70, y: 92, side: "right", up: true }, // Brand & Design
  { x: 7, lgX: 20, y: 85, side: "left", up: true }, //   Studios
  { x: 91, lgX: 93, y: 31, side: "right", up: false }, // AI Lab
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
        undefined custom property is an invalid value, not zero.
      */
      style={{ "--par-x": 0, "--par-y": 0 } as React.CSSProperties}
      /*
        THE ORB'S OWN BOX, centred, the pills placed on it. Its size is the
        orb's: a phone's width less room for the pills, and on a laptop the
        height bound that keeps the orb, the pills and the hero line under it
        inside one screen.
      */
      className="relative mx-auto mb-14 mt-8 w-[min(calc(100vw-5rem),24rem,46vh)] lg:mb-12 lg:mt-4 lg:w-[min(64vh,calc(100dvh-19rem),40rem)]"
    >
      <motion.div
        initial={still ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: ENTER.orb, ease: EASE }}
      >
        <div className="relative w-full motion-safe:translate-x-[calc(var(--par-x)*6px)] motion-safe:translate-y-[calc(var(--par-y)*6px)] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out">
          <NeuralOrb focus={focus} />

          {/* The wordmark, fading up once the sphere is a sphere. A picture; the header carries the real one. */}
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
        const spot = SPOTS[index];
        const isActive = active === index;
        const dimmed = active !== null && !isActive;
        /* Everything except the one being travelled to gets out of the way. */
        const leaving = chosen !== null && chosen !== index;
        /* The hover lift toward the sphere plus the parallax drift. */
        const lift = `translate3d(calc(var(--drift-x, 0px) + ${
          isActive ? -corner.x * 6 : 0
        }px), calc(var(--drift-y, 0px) + ${isActive ? -corner.y * 6 : 0}px), 0)`;
        /* This division's subscription — the price under its name. */
        const pricing = verticalCards.find((card) => card.short === service.short);

        return (
          <motion.div
            key={service.title}
            data-vert={index}
            /* Each name arrives from its own side, closing on the sphere. */
            initial={still ? false : { opacity: 0, x: corner.x * 20, y: corner.y * 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{
              duration: ENTER.duration,
              delay: ENTER.names + index * ENTER.stagger,
              ease: EASE,
            }}
            style={{ "--x": `${spot.x}%`, "--lg-x": `${spot.lgX}%`, top: `${spot.y}%` } as React.CSSProperties}
            className={cn(
              "group/vert absolute left-[var(--x)] flex -translate-y-1/2 flex-col lg:left-[var(--lg-x)]",
              spot.side === "left"
                ? "-translate-x-[35%] items-start lg:-translate-x-[94%]"
                : "-translate-x-[65%] items-end lg:-translate-x-[6%]",
              isActive ? "z-20" : "z-10",
            )}
            onPointerEnter={(event) => event.pointerType === "mouse" && setActive(index)}
            onPointerLeave={(event) => event.pointerType === "mouse" && leave()}
          >
            {/*
              THE PILL, A LINK TO THE DIVISION'S PAGE AND NOTHING ELSE (Genesis,
              5 Oct 2026: "remove these hover cards … if clicked just redirect
              to their vertical pages", on every screen).
            */}
            <div
              className={cn(
                "flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] p-0.5 shadow-[var(--shadow-raised)] backdrop-blur-[14px] backdrop-saturate-[1.3]",
                "transition-[transform,opacity] duration-300 ease-out",
                "motion-safe:[--drift-x:calc(var(--par-x)*2px)] motion-safe:[--drift-y:calc(var(--par-y)*2px)]",
                dimmed && "opacity-45",
                leaving && "opacity-0",
              )}
              style={{ transform: `${lift} scale(${isActive || chosen === index ? 1.035 : 1})` }}
            >
              <Link
                href={pricing?.href ?? service.href}
                prefetch={false}
                onFocus={() => setActive(index)}
                onBlur={leave}
                onClick={() => setDeparting(index)}
                className="flex min-h-9 w-[6.5rem] items-center justify-center rounded-full px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-brand sm:w-[8rem] lg:w-[9.5rem] lg:px-3.5 lg:py-1.5 xl:w-[10.5rem]"
              >
                <DivisionLockup
                  name={service.short}
                  tagline=""
                  ramp={service.ramp}
                  as="h3"
                  fluid
                  nameOnly
                  priority
                  className="flex w-full justify-center"
                />
              </Link>
            </div>

          </motion.div>
        );
      })}
    </div>
  );
}
