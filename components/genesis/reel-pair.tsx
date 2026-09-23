"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { useEdgeFade } from "./use-edge-fade";
import { useInViewPlayback } from "./use-in-view-playback";
import { mediaUrl } from "@/lib/media-url";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { cn } from "@/lib/utils";

/**
 * The Influence reels: a two-card slider, with arrows to walk the rest.
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
 * TWO CARDS WIDE, AND NOW A REAL SLIDER. This sits in one half of a
 * two-column section beside the copy, so a rail of six would give each piece
 * about 150 points — a 9:16 reel at that size is a thumbnail. It was a fixed
 * pair that swapped on a timer; Genesis asked for "actual slider wala, sirf
 * do blocks jitna ho fir fade hojaye". So every reel sits in one row that
 * swipes and snaps, the window shows two and the edge of a third, and the
 * edge mask fades the rest into the page. The arrows step one card, which on
 * a scrolling row reads as movement rather than as a swap to decode.
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
 *     holds the row still. Swapping a reel out from under a pointer that
 *     has stopped on it is the classic carousel failure.
 *   NOT RIGHT AFTER A PRESS OR A SWIPE. A timer that moves the row the
 *     moment the reader has put it somewhere is fighting them, so it waits
 *     eight seconds after the last one. It used to stop for good — and on a
 *     phone, where the first swipe comes within seconds, that meant the
 *     auto-slide Genesis asked for was barely ever seen ("auto slide bhi ho").
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

/** How long the row holds before it moves on by one card. See the note above. */
const AUTO_MS = 7_000;
/** How long a press or swipe pauses it before it carries on. */
const RESUME_MS = 8_000;

export function ReelPair({
  reels,
  className,
}: {
  reels: Reel[];
  className?: string;
}) {
  const still = useReducedMotion();
  /*
    WHEN THE READER LAST WORKED IT. A press or a swipe pauses the row for
    RESUME_MS and then it carries on — see the note above.
  */
  const [touchedAt, setTouchedAt] = useState(0);
  const takeOver = () => setTouchedAt(Date.now());
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
  const [tick, setTick] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const { ref: rail, style: fadeStyle } = useEdgeFade<HTMLDivElement>({ ramp: 120, max: 16 });

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

  /**
   * One card along, either way, wrapping at both ends so an arrow never
   * dead-ends. A card's step is read off the second card's offset rather
   * than computed from a width, so it includes the gap at every breakpoint.
   */
  const step = useCallback(
    (direction: 1 | -1) => {
      const el = rail.current;
      if (!el) return;
      const cards = el.children;
      const card =
        cards.length > 1
          ? (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft
          : el.clientWidth;
      const travel = el.scrollWidth - el.clientWidth;
      const behavior = still ? "auto" : "smooth";
      if (direction > 0 && el.scrollLeft >= travel - 4) {
        el.scrollTo({ left: 0, behavior });
      } else if (direction < 0 && el.scrollLeft <= 4) {
        el.scrollTo({ left: travel, behavior });
      } else {
        el.scrollBy({ left: direction * card, behavior });
      }
    },
    [rail, still],
  );

  /*
    THE TIMER. Keyed on `tick`, so each advance restarts the clock rather than
    queueing — and a hover that pauses mid-cycle gives a full interval when it
    resumes rather than an abrupt move.
  */
  useEffect(() => {
    if (still || !visible || held || reels.length < 3) return;
    const wait = Math.max(AUTO_MS, touchedAt + RESUME_MS - Date.now());
    const id = window.setTimeout(() => {
      step(1);
      setTick((n) => n + 1);
    }, wait);
    return () => window.clearTimeout(id);
  }, [still, touchedAt, visible, held, reels.length, step, tick]);

  if (reels.length === 0) return null;

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
      onPointerEnter={(event) => event.pointerType === "mouse" && setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      /*
        KEYBOARD FOCUS ONLY. A tapped arrow keeps focus on a phone, where
        nothing ever blurs it — so holding on any focus stopped the row for
        good after the first tap, which read as the auto-slide not working.
      */
      onFocus={(event) => event.target.matches(":focus-visible") && setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      {/*
        A REAL SLIDER, TWO CARDS WIDE — "actual slider wala hi dalo, sirf do
        blocks jitna ho fir fade hojaye". It swapped a fixed pair on a timer,
        which could not be swiped and showed nothing of what came next. Now
        every reel is in one row that scrolls and snaps card by card; the
        window is two cards and a little, and the edge mask (useEdgeFade)
        fades whatever runs past it into the page — on the side that has more
        only, so the first card is never dimmed.
      */}
      <div
        ref={rail}
        style={fadeStyle}
        onPointerDown={takeOver}
        onWheel={takeOver}
        /*
          -my/py: a scrolling row clips on both axes, so the hover lift and
          the card shadow need room inside it or they are cut flat.
        */
        className="no-scrollbar -my-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain py-3 sm:gap-4"
      >
        {reels.map((reel) => (
          <div
            key={reel.id}
            className="w-[44%] shrink-0 snap-start"
          >
            <ReelBlock reel={reel} scroller={visible ? rail : undefined} />
          </div>
        ))}
      </div>

      {/*
        THE ARROWS THE CONSTELLATION HAD, in the same place and at the same
        size — they were the one part of that block Genesis asked to keep.
        Hidden entirely when everything already fits, because a control that
        cannot do anything is worse than no control.
      */}
      {reels.length > 2 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => {
                takeOver();
                step(direction);
              }}
              aria-label={direction < 0 ? "Previous reel" : "Next reel"}
              className="grid size-10 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] text-bone transition-colors hover:border-brand hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {direction < 0 ? (
                <ChevronLeft className="size-4" aria-hidden />
              ) : (
                <ChevronRight className="size-4" aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReelBlock({
  reel,
  scroller,
}: {
  reel: Reel;
  scroller?: RefObject<HTMLElement | null>;
}) {
  const video = useInViewPlayback<HTMLVideoElement>(mediaUrl(reel.poster), scroller);

  const inner = (
    <>
      <video
        ref={video}
        src={mediaUrl(reel.clip)}
        muted
        loop
        playsInline
        /*
          Nothing until it is on screen: the row now holds every reel, not
          two, and useInViewPlayback starts each one as it slides in.
        */
        preload="none"
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
