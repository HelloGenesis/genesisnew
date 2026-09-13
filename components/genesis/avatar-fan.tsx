"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";
import { AvatarDialog } from "./avatar-dialog";

/**
 * The AI avatar roster, dealt as a hand of cards.
 *
 * THE DECK'S OWN BOARD. The AI Lab page fans seven portraits across the
 * bottom of the frame, overlapping, tipping further as they run out to the
 * edges, with one held upright in the middle and lit. It reads as a roster
 * being shown to you — which is what a roster of avatars is.
 *
 * WHAT THIS REPLACED. A five-panel rotateY wall at 1200px perspective. That
 * was built from a different reference (a curved video wall) and it had two
 * problems here: rotateY foreshortens a face until the outer panels are
 * unreadable slivers, and it made five avatars look like one continuous
 * screen rather than five separate people. A flat fan keeps every face at
 * full width and every card visibly its own object.
 *
 * THE GEOMETRY IS A PIVOT, NOT AN OFFSET. The first attempt rotated each
 * card about its own centre and then pushed it down by the square of its
 * distance from the middle. That is the arithmetic of an arc and it produced
 * the opposite of one — an arch, curving UP at the ends — because rotating
 * about the centre swings the top of an outer card toward the middle while
 * the drop moves the whole card down. It also broke the layout: transforms do
 * not affect flow, so the pushed-down cards fell straight out of the bottom
 * of their own container and were clipped.
 *
 * A hand of cards fans from a point BELOW the hand. So every card sits in the
 * same place and the only transform is a rotation about an origin four card
 * heights down. The spread, the descent toward the edges and the overlap all
 * fall out of that one number — there is nothing left to tune against itself,
 * and the container's height is a fixed multiple of a card's rather than
 * something that has to be kept in sync with a drop formula.
 *
 * NO OPACITY RAMP, deliberately, and this is the second time it has been
 * written down: the board keeps every card at full brightness, and the
 * outermost one is as vivid as the centre. Fading the flanks produces the
 * generic 3D-carousel look the board is not.
 *
 * IT DEALS ITSELF, which is what Genesis's animation shows and what this was
 * missing: the fan simply existed, fully spread, the moment the section
 * appeared. The hand now arrives stacked — every card at zero rotation, one
 * on top of another, sitting a little low — and opens outward from the middle
 * as it comes into view.
 *
 * THE STAGGER IS BY DISTANCE FROM THE CENTRE, not by index. Dealing left to
 * right would put the upright card, the one the whole fan is arranged around,
 * fourth in a queue. Ordering by distance lands the centre first and then
 * releases each pair outward, which is how a hand of cards actually opens and
 * what makes the middle read as the card being presented rather than as the
 * one that happens to be in the middle.
 *
 * ONCE, and never again on the way back up: a fan that re-deals every time it
 * re-enters the viewport turns a flourish into a tic.
 */

/** Placeholder grounds, one per position, running the deck's spectrum warm to
 *  cool so the fan is not seven of the same rectangle. Replaced wholesale by
 *  the real portraits. */
const PLACEHOLDER = [
  "122 60 255",
  "160 74 220",
  "214 90 175",
  "247 113 158",
  "255 143 120",
  "255 160 82",
  "255 200 90",
];

type Avatar = {
  id: string;
  name: string;
  role?: string | undefined;
  /** The supplied card, 1080x1920. Absent for an avatar not yet shot. */
  portrait?: string | undefined;
};

/**
 * Degrees between neighbouring cards, and how far below a card the pivot
 * sits as a percentage of its height.
 *
 * THESE TWO ARE ONE DECISION. Spread is the product of them — pivot distance
 * times angle — so a near pivot with a big angle and a far pivot with a small
 * one cover the same width and look nothing alike. The near one tips the
 * outer cards hard and, because the bottom of a card is closer to a pivot
 * beneath it than the top is, jams their bottom edges together. That is
 * exactly where the names are, and at 400%/10deg the roles on the flanking
 * cards were being eaten by their neighbours.
 *
 * 650%/6.6deg covers the same width with a card's bottom edge at 85% of its
 * top edge's radius instead of 75%, which leaves the overlap at the name line
 * around 15% rather than 27% — enough to read every role, still enough to
 * read as a hand of cards rather than a row of them.
 */
const STEP = 6.6;
const PIVOT = "50% 650%";

/**
 * Is there room to fan?
 *
 * THE FAN IS 775px WIDE AND A PHONE IS 375, and the answer used to be a
 * horizontal scroller — the hand at full size with the viewport panning
 * across it. It reads as broken rather than as scrollable: what you see on
 * load is two cards cut in half at both edges, with nothing saying the rest
 * is a thumb away. Genesis's word for it was "fucked up", and they are right.
 *
 * So below 880px the fan is not a fan. Same seven cards, same links, laid out
 * as two centred rows — four and three — with no rotation, no pivot and no
 * sway. Everyone is on screen at their real size and the page does not move
 * sideways.
 *
 * Measured rather than assumed, because the geometry is real and a Tailwind
 * `sm:` on the transform would not have been enough: the rotation is written
 * by Framer as an inline style, and an inline transform beats any class.
 * matchMedia is the only place both the layout and the animation can agree.
 *
 * 880, NOT 640, AND IT IS NOT A TAILWIND BREAKPOINT. The fan's width is the
 * card's width times the geometry, and the card is
 * `clamp(7.5rem, 14vw, 13rem)` — so below 857px viewport the clamp floor
 * pins the card at 120px and the hand stops shrinking with the page. It stays
 * 832px wide however narrow the phone gets, which is why at 673px the outer
 * two cards hung 79px off each edge of a container that clips, and why at 840
 * they still overran it by 4. 880 is the first width where the hand fits with
 * a margin either side.
 *
 * Every size decision below hangs off `fan` for the same reason: a `sm:` on
 * the caption would have re-opened the gap between 640 and 880.
 *
 * Server-rendered as the fan — the desktop case, and the one where a wrong
 * first paint is cheapest: a phone corrects on hydration, in the same frame
 * the deal-in animation would have started anyway.
 */
const FAN_QUERY = "(min-width: 880px)";

function useFanRoom(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(FAN_QUERY);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(FAN_QUERY).matches,
    () => true,
  );
}

export function AvatarFan({
  avatars,
  className,
}: {
  avatars: readonly Avatar[];
  className?: string;
}) {
  // The middle card, whichever way the roster is ordered.
  const centre = (avatars.length - 1) / 2;
  /*
    Reduce Motion gets the finished fan, not a stack. The spread is the
    layout, not decoration — collapsing to a pile and staying there would
    leave six of the seven avatars hidden behind the seventh.
  */
  const still = useReducedMotion();
  const fan = useFanRoom();
  /* Which avatar is open over the page. They were routes; see AvatarDialog. */
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    /*
      Height is the card's 4:3 height, plus the extra a rotated rectangle
      needs for its corners, plus the distance the outermost pair swings down.
      For a 3:4 card at 19.8 degrees that comes to just over twice the card's
      WIDTH, which is the unit the card is sized in — so the box is expressed
      as a multiple of that and stays right at every viewport.

      It has to be generous: the bleed wrapper around this is overflow-hidden
      to keep w-screen from widening the page, so anything that overruns this
      box is not merely overlapping, it is cut off. At 1.82 it was slicing the
      bottom off the outer two cards' names.
    */
    <>
    <div
      className={cn(
        /*
          2.08, NOT 2.2. Measured with the fan actually SPREAD — the first
          reading was taken while it was still stacked, which put the cards
          150px higher than they really sit and would have had me cut the box
          nearly in half. Dealt, the cards span 393px of a 444px box, so there
          were 52px doing nothing under them. 2.08 leaves about 27, which is
          what the shadows and the sway's ±0.9 degrees need.
        */
        fan
          ? "relative h-[calc(clamp(7.5rem,14vw,13rem)*2.08)] w-full"
          : // A swipeable row of full-size cards. See useFanRoom.
            /*
              BIGGER, AND SWIPED ("scroll karke bada kardo ai avatars wale
              ko"). The phone layout was two centred rows of four and three,
              which at 375px made every card about 80px wide with its name
              at 9px: seven avatars reduced to stamps. One row that scrolls
              lets each card be nearly half the screen, and the whole point
              of the section is that you can see the faces.
            */
            "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2",
        className,
      )}
    >
      {avatars.map((avatar, index) => {
        const offset = index - centre;
        const distance = Math.abs(offset);
        const isCentre = distance < 0.5;

        return (
          <motion.div
            key={avatar.id}
            /*
              POINTER-EVENTS-NONE, WHICH IS WHY SIX OF THE SEVEN WERE DEAD.

              Each card is centred inside a wrapper that spans the FULL width
              of the fan, and the wrappers are stacked with the middle card
              highest — so the centre card's wrapper, an invisible full-width
              box, lay over every other card and swallowed their clicks.
              Measured before this: one of seven reachable, and the one that
              worked was Adi, the middle card. Nothing looked wrong, which is
              why it took a hit-test to find.

              The wrapper is a positioning device and should never have been a
              target; the link inside it takes pointer events back.
            */
            /*
              THE WIDTH BELONGS ON THE FLEX ITEM. This was `display:contents`,
              which handed flex sizing to the sway wrapper inside it while the
              card's `w-[…%]` still resolved against that wrapper — a width
              defined as a fraction of a box whose own width came from its
              content. Five cards landed in the first row instead of four, at
              whatever size the loop settled on.
            */
            className={
              fan
                ? "pointer-events-none absolute inset-x-0 top-0 flex justify-center"
                : "w-[46vw] max-w-[13rem] shrink-0 snap-center"
            }
            style={
              fan
                ? {
                    // Nearer the middle sits on top, so the fan overlaps
                    // outward from the card being presented.
                    zIndex: Math.round((avatars.length - distance) * 10),
                    transformOrigin: PIVOT,
                  }
                : undefined
            }
            /*
              Rotation is animated rather than written into `transform`, so
              Framer owns the property outright — a static transform here and
              an animated one there fight over the same matrix and the fan
              snaps.
            */
            initial={
              still || !fan ? false : { rotate: 0, y: 26, opacity: 0 }
            }
            /*
              The rows still have to be TOLD to be visible. An empty target
              here left the phone showing seven boxes at opacity 0 — the
              server renders the fan, so the stacked `initial` had already
              been written into the DOM, and switching to rows on hydration
              gave Framer nothing to animate back from.
            */
            whileInView={
              fan
                ? { rotate: offset * STEP, y: 0, opacity: 1 }
                : { rotate: 0, y: 0, opacity: 1 }
            }
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              // Long and heavily eased-out: the cards leave the stack quickly
              // and settle slowly, which is the weight a dealt card has.
              duration: 0.85,
              delay: distance * 0.085,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/*
              THE WHOLE CARD IS A LINK to /avatars/<slug>. Every avatar has a
              page of its own, so a brand can be sent one directly; browsing
              the fan opens it as a dialog over the roster instead.
            */}
            {/*
              THE CONTINUOUS SWAY LIVES ON ITS OWN ELEMENT, inside the one
              Framer is animating. Both rotate about the same pivot, so the
              card stays in its place in the fan and simply breathes there —
              but they cannot share a transform, because two animations
              writing one matrix fight and the deal-in snaps. See
              `avatar-sway` in globals.css.
            */}
            <div
              className={
                fan
                  ? "motion-safe:animate-[avatar-sway_7s_ease-in-out_infinite_alternate]"
                  : undefined
              }
              style={
                fan
                  ? {
                      transformOrigin: PIVOT,
                      // Negative, so every card starts mid-cycle and the wave
                      // is already travelling rather than beginning on a
                      // queue.
                      animationDelay: `${(-0.55 * index).toFixed(2)}s`,
                    }
                  : undefined
              }
            >
            <button
              type="button"
              onClick={() => setOpenId(avatar.id)}
              aria-haspopup="dialog"
              aria-label={`${avatar.name}${avatar.role ? `, ${avatar.role}` : ""}`}
              className={cn(
                "pointer-events-auto block w-full rounded-[1.25rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              )}
            >
            <figure
              className={cn(
                "relative aspect-[3/4] overflow-hidden rounded-[1.25rem] border",
                /*
                  Off the fan's own unit above 640, and off the row below it,
                  where the wrapper carries the width — see the note on it.
                */
                /*
                  BACK TO THE ORIGINAL SIZE. The one-screen pass capped this
                  by viewport height and shrank the fan to fit; Genesis's
                  answer was that the roster "was looking good earlier". The
                  fan is the argument of this section, so it keeps its size
                  and the section is allowed to run a little past a short
                  screen.
                */
                fan ? "w-[clamp(6.75rem,min(14vw,23vh),13rem)]" : "w-full",
                // The upright card is the only one carrying a lift, so the
                // eye is told where to start.
                isCentre
                  ? "border-white/25 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.9),0_0_44px_-12px_rgb(255_197_22/0.28)]"
                  : "border-white/10 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.9)]",
              )}
              style={
                avatar.portrait
                  ? undefined
                  : {
                      background: `linear-gradient(160deg, rgb(${PLACEHOLDER[index % PLACEHOLDER.length]} / 0.34) 0%, rgb(14 14 18 / 0.97) 58%), radial-gradient(78% 52% at 50% 16%, rgb(255 255 255 / 0.13), transparent 72%)`,
                    }
              }
            >
              {/*
                THE REAL PORTRAIT, and the ramp behind it stays as the fallback
                for an avatar that has not been shot yet.

                `sizes` is the card's own width, not the viewport's: these are
                1080x1920 originals and the card tops out at 13rem, so without
                it every one of the seven would fetch a full-width file to fill
                208px. The card is 3:4 and the source is 9:16, so it crops —
                object-cover, centred, which is where these are framed.
              */}
              {avatar.portrait && (
                <Image
                  src={avatar.portrait}
                  alt=""
                  fill
                  sizes="(min-width: 880px) 14vw, 46vw"
                  className="object-cover"
                />
              )}
              {/*
                The scrim. On the board the names are burned into the lower
                third of each photograph, and white type straight onto a
                portrait is a coin toss — this makes it a certainty.
              */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-3/5"
                style={{
                  background:
                    "linear-gradient(0deg, rgb(0 0 0 / 0.88) 0%, rgb(0 0 0 / 0.45) 46%, transparent 100%)",
                }}
              />

              <figcaption
                className={cn(
                  "absolute inset-x-0 bottom-0 text-center",
                  fan ? "p-3 sm:p-4" : "p-3",
                )}
              >
                <span
                  className={cn(
                    "block font-semibold uppercase leading-none tracking-tight text-white",
                    fan ? "text-[clamp(0.95rem,1.9vw,1.6rem)]" : "text-[1.05rem]",
                  )}
                >
                  {avatar.name}
                </span>
                {avatar.role && (
                  <span
                    className={cn(
                      "block font-medium uppercase leading-tight text-white/70",
                      fan
                        ? "mt-1.5 text-[clamp(0.4rem,0.72vw,0.6rem)] tracking-[0.14em]"
                        : "mt-1.5 text-[0.55rem] tracking-[0.12em]",
                    )}
                  >
                    {avatar.role}
                  </span>
                )}
              </figcaption>
            </figure>
            </button>
            </div>
          </motion.div>
        );
      })}
    </div>
    <AvatarDialog id={openId} onClose={() => setOpenId(null)} onNavigate={setOpenId} />
    </>
  );
}
