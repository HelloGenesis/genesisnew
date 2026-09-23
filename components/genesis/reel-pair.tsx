"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
 *
 * AND IT ADVANCES ON ITS OWN. Genesis asked for an auto-scroller here. Two
 * reels out of twenty-eight is a small window onto the work, and a reader who
 * does not press the arrows sees the same two for as long as they are in the
 * section — which is most readers, because an arrow under a video reads as a
 * control for the video.
 *
 * THE RULES IT FOLLOWS, all of them so it cannot become the thing that takes
 * the page over:
 *
 *   ONLY WHILE IT IS ON SCREEN. Off screen the clips are paused by
 *     useInViewPlayback anyway, so advancing there would burn through the
 *     run and leave a reader arriving at the tail.
 *   NOT WHILE ANYONE IS LOOKING AT IT. Hovering or tabbing into the block
 *     holds the pair still. Swapping a reel out from under a pointer that
 *     has stopped on it is the classic carousel failure.
 *   NEVER AFTER A PRESS. Once the reader works the arrows they have taken
 *     over, and a timer that keeps moving afterwards is fighting them. It
 *     stops for good rather than resuming after a pause.
 *   NOT AT ALL UNDER REDUCED MOTION, which is what that setting is for.
 *
 * SEVEN SECONDS, which is about two loops of a four-second cut — long enough
 * to watch a reel rather than catch it, short enough that a reader who stays
 * for the copy beside it sees several.
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

/** How long a pair holds before the next one arrives. See the note above. */
const AUTO_MS = 7_000;

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
  /* Set by the first arrow press, and never unset. See the note above. */
  const [taken, setTaken] = useState(false);
  /*
    TWO REASONS TO HOLD, TRACKED SEPARATELY, and that is a bug fix rather than
    bookkeeping. Written as one `running` flag, a pointer leaving the block
    set it back to true — including when the reader had hovered and then
    scrolled the block off screen, because the observer only fires on a
    crossing and there was none to correct it. The timer then ran on a section
    nobody was looking at.
  */
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const pairs = Math.max(1, Math.ceil(reels.length / 2));

  /*
    ON SCREEN OR NOT. `rootMargin` is negative on purpose: the block counts as
    visible once it is properly in the frame rather than the moment one pixel
    of it crosses the edge, so the first advance does not happen while the
    reader is still scrolling it into view.
  */
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "-15% 0px -15% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /*
    THE TIMER. Keyed on `at` through the dependency list, so every advance
    restarts the clock rather than queueing — and a hover that pauses mid-cycle
    gives a full interval when it resumes rather than an abrupt swap.
  */
  useEffect(() => {
    if (still || taken || !visible || held || pairs < 2) return;
    const id = window.setTimeout(() => {
      setAt((current) => ((Math.floor(current / 2) + 1) % pairs) * 2);
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [still, taken, visible, held, pairs, at]);

  if (reels.length === 0) return null;

  const page = Math.floor(at / 2);
  const step = (direction: 1 | -1) => {
    setTaken(true);
    /* Wraps both ways: the arrows never dead-end. */
    setAt((current) => {
      const next = (Math.floor(current / 2) + direction + pairs) % pairs;
      return next * 2;
    });
  };

  const showing = [reels[at % reels.length], reels[(at + 1) % reels.length]];

  return (
    <div
      ref={box}
      className={cn("w-full", className)}
      /*
        HOLD WHILE ANYONE IS ON IT. `focus`/`blur` rather than the React
        synthetic focus events' non-bubbling siblings — these are the
        delegated ones, so tabbing to either reel or to an arrow inside the
        block stops the clock.
      */
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
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
  const video = useInViewPlayback<HTMLVideoElement>(mediaUrl(reel.poster));

  const inner = (
    <>
      <video
        ref={video}
        src={mediaUrl(reel.clip)}
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

  if (!reel.onOpen) {
    return <div className={box}>{inner}</div>;
  }

  const lift =
    "outline-none transition-[border-color,transform] duration-300 ease-out hover:border-brand/60 motion-safe:hover:-translate-y-1 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand";

  /*
    NO STUDY, SO NO URL — and therefore a button rather than an anchor. The
    reel opens the portfolio's window on the piece it belongs to, and a piece
    has no page of its own. See the same note in WarpRail for why an
    honest-looking `/#library` href is not an option: SmoothScroll takes hash
    clicks on capture, before React sees them.
  */
  if (!reel.href) {
    return (
      <button
        type="button"
        aria-label={`Open ${reel.label}`}
        onClick={() => reel.onOpen?.()}
        className={cn(box, lift)}
      >
        {inner}
      </button>
    );
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
      className={cn(box, lift)}
    >
      {inner}
    </a>
  );
}
