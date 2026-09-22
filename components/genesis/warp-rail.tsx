"use client";

import { useEffect, useRef } from "react";

import { useInViewPlayback } from "./use-in-view-playback";
import { mediaUrl } from "@/lib/media-url";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { cn } from "@/lib/utils";

/**
 * The warp rail — a corridor of work, drifting past the reader.
 *
 * WHAT IT IS FOR. AI Lab's argument is volume: the division's whole claim is
 * "create more without creating everything from scratch", and the honest way
 * to show that is a lot of finished work moving past you rather than four
 * tiles in a grid. Genesis pointed at a reference doing exactly this and
 * asked for it in our colours.
 *
 * THE PERSPECTIVE IS THE POINT, and it is why this does not reuse
 * LogoMarquee. A flat marquee says "here is a list that is longer than the
 * screen". A corridor says "this keeps going", because the cards at the edges
 * turn away from you and recede rather than sliding off — the row reads as
 * having depth, and the piece in the middle reads as the one you are being
 * shown. Those are different sentences and this section wants the second.
 *
 * IT IS TRANSFORMED, NOT SCROLLED, and that is a correctness decision rather
 * than a preference. `perspective` on an element with `overflow-x: auto` is
 * unreliable — several engines flatten the 3D context to composite the
 * scrollport, and where they do not, the vanishing point fights the scroll
 * offset. Driving the track with a transform keeps the perspective on a box
 * that never scrolls, so the corridor's centre stays put while the work moves
 * through it. The cost is that a native drag does nothing, which is why there
 * are no scrollbars to suggest one.
 *
 * NOTHING IS MEASURED PER FRAME. Card geometry is read once on mount and on
 * resize; the loop is arithmetic on numbers it already holds, then one style
 * write per card. A getBoundingClientRect inside the loop would be a forced
 * layout sixty times a second for as long as the section is on screen.
 */

/** How far a card at the edge of the frame turns away from the reader. */
const TURN = 42;
/** How far back it goes, in px, and how much smaller it gets. */
const DEPTH = 220;
const SHRINK = 0.22;
/** Px per second. Slow: the cards are meant to be looked at, not counted. */
const SPEED = 34;
/** Space between two cards, in px. */
const GAP = 22;

export type WarpItem = {
  /** Stable key, and the clip this card plays. */
  id: string;
  clip: string;
  poster: string;
  label: string;
  /** Where the study lives, for crawlers and cmd-click. Absent, not a link. */
  href?: string;
  onOpen?: () => void;
};

export function WarpRail({
  items,
  className,
}: {
  items: WarpItem[];
  className?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = viewport.current;
    const rail = track.current;
    if (!box || !rail || items.length === 0) return;

    const cards = Array.from(rail.children) as HTMLElement[];
    if (cards.length === 0) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    /*
      GEOMETRY, COMPUTED RATHER THAN READ — and this is a correction worth
      recording, because the obvious version is silently wrong here.

      The first pass cached each card's `offsetLeft`. Every one came back 0,
      so all thirteen cards stacked on top of each other at the left edge and
      the rail rendered as a single card. The reason is that these cards are
      `position: absolute` — their whole position is the transform this loop
      writes, so there is no laid-out offset to read. `offsetLeft` was
      answering honestly; the question was wrong.

      Their spacing is a decision this file makes (one width plus GAP), so it
      is arithmetic on the card width, which IS a real measurement. Read once
      on mount and on resize, because the width is a viewport-relative clamp.
    */
    let width = 0;
    let stride = 0;
    let half = 0;
    let total = 0;
    let frame = 0;
    let offset = 0;
    let last = 0;
    let hovering = false;

    const measure = () => {
      /*
        The POSITIONER's width, which is --warp-card — the same value the
        visible card fills. Reading the card inside it would give the same
        number today and would quietly break the spacing the day the card
        gains a margin.
      */
      width = cards[0]?.offsetWidth ?? 0;
      stride = width + GAP;
      /*
        The list is rendered TWICE (see the track below), so the loop wraps by
        subtracting the width of one copy — every card plus the gap that
        follows it, which is what makes the seam identical to every other
        join rather than a card-width short.
      */
      half = stride * items.length;
      total = stride * cards.length;
    };

    const paint = () => {
      const centre = box.clientWidth / 2;
      if (stride === 0) return;
      for (let i = 0; i < cards.length; i += 1) {
        /*
          Where this card sits relative to the middle of the frame, as a
          fraction of a half-width: 0 dead centre, ±1 at the edges. Cards
          beyond the frame keep going past ±1 and are simply clamped, so one
          that is about to enter is already turned rather than snapping.

          THE TRACK IS CENTRED ON THE FRAME, not hung off its left edge: the
          run is offset by half a viewport so the corridor opens in the
          middle of the section rather than everything entering from the
          left with dead space beside it.
        */
        /*
          WRAPPED INTO A BAND CENTRED ON THE FRAME, which is the difference
          between a corridor and a queue.

          The first version laid the cards out from the middle and ran them
          rightward, wrapping only once one had left on the left. At rest that
          put every card on the right of centre and nothing at all on the
          left: half a corridor, with the opening off to one side. It also
          never recovered, because a card leaving the left was sent past the
          END of the second copy rather than into the gap behind it.

          Taking the position modulo the FULL track and folding the far half
          negative puts half the cards either side of the middle at every
          moment, including the first frame. The run then cycles through that
          band rather than marching along it.
        */
        let rel = ((i * stride - offset) % total + total) % total;
        if (rel > total / 2) rel -= total;
        const x = centre - width / 2 + rel;
        const d = rel / centre;
        const clamped = Math.max(-1.35, Math.min(1.35, d));
        const away = Math.abs(clamped);

        /*
          THE LOOP OWNS ONLY THE 3D PART. Vertical centring is done by layout
          — the positioner is full-height and centres its card with flexbox —
          and this is why. `transform` is ONE property: the moment the loop
          writes it, any `-translate-y-1/2` from a class is gone. Putting the
          half-height shift back into this string looks like the fix and is
          not, because a percentage there resolves against the transformed
          box rather than the card, so the cards drifted up by an amount that
          changed with their scale. Layout has no such ambiguity.
        */
        cards[i].style.transform = `translate3d(${x.toFixed(1)}px,0,0) perspective(1100px) rotateY(${(-clamped * TURN).toFixed(2)}deg) translateZ(${(-away * DEPTH).toFixed(1)}px) scale(${(1 - away * SHRINK).toFixed(3)})`;
        /*
          The edges dim as well as turn. Without it the corridor's walls are
          as loud as the piece in the middle and the composition has no
          subject.
        */
        cards[i].style.opacity = `${Math.max(0.18, 1 - away * 0.72).toFixed(3)}`;
        cards[i].style.zIndex = `${100 - Math.round(away * 100)}`;
      }
    };

    const tick = (now: number) => {
      const delta = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!hovering && !still.matches) offset += SPEED * delta;
      if (half > 0 && offset >= half) offset -= half;
      paint();
      frame = requestAnimationFrame(tick);
    };

    measure();
    paint();

    const onResize = () => {
      measure();
      paint();
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(box);

    const enter = () => {
      hovering = true;
    };
    const leave = () => {
      hovering = false;
    };
    box.addEventListener("pointerenter", enter);
    box.addEventListener("pointerleave", leave);

    /*
      Only a visible rail runs. This is a 60Hz loop writing sixteen transforms
      a frame; three sections below the fold it has no business being awake.
    */
    let visible = false;
    const start = () => {
      if (frame || !visible || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: "10% 0px" },
    );
    watcher.observe(box);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      watcher.disconnect();
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  /* Rendered twice so the corridor has no end. See `half` in the loop. */
  const doubled = [...items, ...items];

  return (
    <div
      ref={viewport}
      className={cn(
        "relative w-full overflow-hidden",
        /*
          THE CORRIDOR'S OWN LIGHT, in the brand rather than the reference's
          green. It sits BEHIND the cards and is what the middle of the row
          appears to be lit by — the cards nearest the centre are at full
          opacity over it, and the ones turning away fall into the dark at
          the edges. Genesis asked for their own colours; this and the mask
          below are the whole of it.
        */
        "before:pointer-events-none before:absolute before:inset-y-0 before:left-1/2 before:z-0 before:w-[46%] before:-translate-x-1/2",
        "before:bg-[radial-gradient(ellipse_at_center,rgb(255_197_22/0.16)_0%,rgb(247_113_158/0.08)_45%,transparent_72%)]",
        /* And the ends dissolve rather than cut, as every rail here does. */
        "[mask-image:linear-gradient(90deg,transparent,black_14%,black_86%,transparent)]",
        className,
      )}
      style={{ height: "var(--warp-h)" }}
    >
      <div
        ref={track}
        className="absolute inset-0 [transform-style:preserve-3d]"
        aria-label="Selected AI work"
      >
        {doubled.map((item, index) => (
          <WarpCard
            key={`${item.id}-${index}`}
            item={item}
            /* The duplicate copy is decoration; announcing it twice is noise. */
            hidden={index >= items.length}
          />
        ))}
      </div>
    </div>
  );
}

function WarpCard({ item, hidden }: { item: WarpItem; hidden: boolean }) {
  const video = useInViewPlayback<HTMLVideoElement>();

  const inner = (
    <>
      <video
        ref={video}
        src={mediaUrl(item.clip)}
        poster={mediaUrl(item.poster)}
        muted
        loop
        playsInline
        preload="none"
        aria-label={item.label}
        {...VIDEO_GUARD_CLIENT}
        className="size-full object-cover"
      />
      {/*
        A caption that only exists when the card is worth reading — the ones
        turning away are dimmed to near nothing by the loop, so a label on
        them would be unreadable text the eye still tries to parse.
      */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgb(0_0_0/0.8),transparent)] px-3 pb-2.5 pt-8 text-micro text-white/85">
        {item.label}
      </span>
    </>
  );

  /*
    TWO BOXES: A POSITIONER AND A CARD.

    The positioner is what the loop transforms. It spans the rail's full
    height and centres the card inside itself with flexbox, so the card sits
    in the middle of the corridor without anything in the transform string
    having to say so — see the note in the loop for why that matters.

    The card is the visible object: a share of the viewport wide, 3:4, which
    is the shape most of this footage is shot in.
  */
  const positioner =
    "absolute inset-y-0 left-0 flex w-[var(--warp-card)] items-center will-change-transform";
  const card =
    "relative w-full overflow-hidden rounded-2xl border border-white/12 bg-ink shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)] aspect-[3/4]";

  if (!item.href || !item.onOpen) {
    return (
      <div aria-hidden={hidden} className={positioner}>
        <span className={card}>{inner}</span>
      </div>
    );
  }

  return (
    <a
      href={item.href}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      onClick={(event) => {
        /* Modified clicks belong to the browser: cmd-click still opens a tab. */
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        item.onOpen?.();
      }}
      className={cn(positioner, "outline-none")}
    >
      <span
        className={cn(
          card,
          "transition-[border-color,box-shadow] duration-300",
          "hover:border-brand/60 group-focus-visible:border-brand",
        )}
      >
        {inner}
      </span>
    </a>
  );
}
