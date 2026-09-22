"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { useInViewPlayback } from "./use-in-view-playback";
import { mediaUrl } from "@/lib/media-url";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { cn } from "@/lib/utils";

/**
 * Two reels at a time, with arrows to walk the rest.
 *
 * WHAT IT REPLACED. A constellation: eleven creator portraits drifting on two
 * orbits around a wireframe globe, with the same arrows underneath. It was
 * built to Genesis's own mockup and it had one problem that no amount of
 * tuning fixed — it showed FACES. A visitor deciding whether to hire an
 * influencer agency is not asking who the creators are, they are asking what
 * the work looks like, and eleven headshots in orbit answered a question
 * nobody had. Genesis asked for two reel blocks and arrows instead: "content
 * dekhne ke liye".
 *
 * TWO, NOT A RAIL OF SIX. This block sits in one half of a two-column section
 * beside the copy, so a rail would give each piece about 150 points of width
 * — a 9:16 reel at that size is a thumbnail. Two fill the column at a size
 * where you can actually see what was shot, which is the entire point of
 * replacing the portraits with footage.
 *
 * THE ARROWS STEP BY TWO, so a press swaps both panels for two pieces the
 * reader has not seen. Stepping by one slides a piece from one side to the
 * other and asks them to notice which of the two is new, which is more work
 * than looking at a reel deserves.
 */

export type Reel = {
  /** Stable key, and the clip this block plays. */
  id: string;
  clip: string;
  poster: string;
  label: string;
  /** The study behind it, where one is written. Absent, not a link. */
  href?: string;
  onOpen?: () => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function ReelPair({
  reels,
  className,
}: {
  reels: Reel[];
  className?: string;
}) {
  const still = useReducedMotion();
  /**
   * Which pair is showing, as an index into `reels`, always even.
   *
   * HELD AS THE FIRST OF THE PAIR rather than as a page number, because the
   * list can be odd: `pairs` below rounds up, and the last page then wraps to
   * the beginning for its second slot rather than rendering a hole.
   */
  const [at, setAt] = useState(0);

  if (reels.length === 0) return null;

  const pairs = Math.max(1, Math.ceil(reels.length / 2));
  const page = Math.floor(at / 2);
  const step = (direction: 1 | -1) => {
    /* Wraps both ways: the arrows never dead-end. */
    setAt((current) => {
      const next = (Math.floor(current / 2) + direction + pairs) % pairs;
      return next * 2;
    });
  };

  const showing = [reels[at % reels.length], reels[(at + 1) % reels.length]];

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {showing.map((reel, slot) => (
          /*
            KEYED ON THE REEL, NOT THE SLOT, which is what makes the change
            animate at all. Keyed on the slot, React reuses the same two
            elements and only swaps their `src` — AnimatePresence sees nothing
            leave or arrive and the panels change with a hard cut, and the
            <video> keeps playing the old frame until the new file decodes.
          */
          <AnimatePresence key={slot} mode="wait" initial={false}>
            <motion.div
              key={reel.id}
              initial={still ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.34, ease: EASE, delay: slot * 0.05 }}
            >
              <ReelBlock reel={reel} />
            </motion.div>
          </AnimatePresence>
        ))}
      </div>

      {/*
        THE ARROWS THE CONSTELLATION HAD, in the same place and at the same
        size — they were the one part of that block Genesis asked to keep.
        Hidden entirely when there is only one pair, because a control that
        cannot do anything is worse than no control.
      */}
      {pairs > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => step(direction)}
              aria-label={direction < 0 ? "Previous reels" : "Next reels"}
              className="grid size-10 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] text-bone transition-colors hover:border-brand hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {direction < 0 ? (
                <ChevronLeft className="size-4" aria-hidden />
              ) : (
                <ChevronRight className="size-4" aria-hidden />
              )}
            </button>
          ))}
          {/*
            Which pair, for anyone who cannot see the panels change. Not
            printed: two arrows and a live count of "page 3 of 7" beside a
            pair of reels is furniture, and the arrows already say there is
            more. `aria-live` announces it on press.
          */}
          <span className="sr-only" aria-live="polite">
            Reels {page + 1} of {pairs}
          </span>
        </div>
      )}
    </div>
  );
}

function ReelBlock({ reel }: { reel: Reel }) {
  const video = useInViewPlayback<HTMLVideoElement>();

  const inner = (
    <>
      <video
        ref={video}
        src={mediaUrl(reel.clip)}
        poster={mediaUrl(reel.poster)}
        muted
        loop
        playsInline
        /*
          These two are the only videos this block has on screen and they are
          the reason it exists, so unlike a rail of twelve they are worth
          fetching on arrival rather than on first intersection.
        */
        preload="metadata"
        aria-label={reel.label}
        {...VIDEO_GUARD_CLIENT}
        className="size-full object-cover"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgb(0_0_0/0.82),transparent)] px-3 pb-3 pt-10 text-micro text-white/85">
        {reel.label}
      </span>
    </>
  );

  /*
    9:16, WHICH IS WHAT THESE WERE SHOT AT. Every piece of Influence work in
    the catalogue is a vertical social cut, so any other frame here is a crop
    of somebody's composition for no reason.
  */
  const box =
    "relative block aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink shadow-[0_24px_50px_-22px_rgb(0_0_0/0.85)]";

  if (!reel.href || !reel.onOpen) {
    return <div className={box}>{inner}</div>;
  }

  return (
    /*
      A real anchor whose plain click is intercepted — the same arrangement
      the Studios stage cards and the creator ring use, so every route into a
      study on this page behaves identically and none of them costs a reader
      their place. cmd-click still opens the study in a tab.
    */
    <a
      href={reel.href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        reel.onOpen?.();
      }}
      className={cn(
        box,
        "outline-none transition-[border-color,transform] duration-300 ease-out",
        "hover:border-brand/60 motion-safe:hover:-translate-y-1",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand",
      )}
    >
      {inner}
    </a>
  );
}
