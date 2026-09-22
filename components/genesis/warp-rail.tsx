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

/**
 * THE CYLINDER'S RADIUS, as a multiple of one card's width.
 *
 * THIS IS THE NUMBER THAT MAKES IT A CORRIDOR. The cards sit on the outside
 * of an upright cylinder whose far side is behind the screen, so how far a
 * card has turned and how far back it has gone are the SAME fact rather than
 * two effects tuned to look related. A small radius is a tight barrel — the
 * neighbours are already steeply turned and the run disappears within a
 * couple of cards. A large one flattens back into a row.
 *
 * 2.6, AND THE FIRST TRY AT 2.05 WAS TOO TIGHT. A barrel that small projects
 * its whole arc into the middle of the frame: the cards piled into a block
 * about a third of the width with empty dark either side, which is a barrel
 * rather than a corridor. At 2.6 the run fans out to roughly two thirds of
 * the frame, the neighbour stands at about 19 degrees and the fourth card out
 * is at 75 — turned hard, still legible as a picture.
 */
const RADIUS = 2.6;

/**
 * The viewing distance, also in card widths.
 *
 * It is the strength of the effect: the shorter it is, the harder the near
 * card blooms and the faster the far ones fall away.
 *
 * 4.2, AND THIS IS THE OTHER HALF OF WHY THE FIRST ATTEMPT LOOKED SMALL. At
 * 2.6 the viewer was so close that a card only a quarter-turn round the
 * cylinder had already shrunk by a third, so the arc collapsed inward faster
 * than it spread outward and the run never reached the edges of its frame.
 * Standing further back keeps the depth cue without eating the width.
 */
const VIEW = 4.2;

/** Px per second. Slow: the cards are meant to be looked at, not counted. */
const SPEED = 40;

/**
 * Arc between one card and the next, as a share of a card's width.
 *
 * UNDER 1, SO THEY OVERLAP. At 1 the cards merely touch, and the moment the
 * perspective pulls the outer ones back it opens gaps between them — which is
 * exactly what the first version looked like: a sparse row of thumbnails
 * floating in the dark rather than a wall of work. At 0.82 the turned cards
 * tuck behind their neighbours and the run reads as continuous.
 */
const STEP = 0.82;

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
    let radius = 0;
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
      stride = width * STEP;
      radius = width * RADIUS;
      /*
        The viewing distance and the track's pull-back are derived from the
        measured card too, so the whole corridor scales with it rather than
        being pixel constants that only look right at one viewport.
      */
      box.style.perspective = `${(width * VIEW).toFixed(0)}px`;
      rail.style.transform = `translateZ(${(-radius).toFixed(0)}px)`;
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
      if (stride === 0 || radius === 0) return;
      for (let i = 0; i < cards.length; i += 1) {
        /*
          WRAPPED INTO A BAND CENTRED ON THE FRAME, which is the difference
          between a corridor and a queue. Taking the position modulo the FULL
          track and folding the far half negative puts half the cards either
          side of the middle at every moment, including the first frame; the
          run then cycles through that band rather than marching along it.

          `rel` is ARC LENGTH along the cylinder, not a screen position — the
          projection below turns it into one.
        */
        let rel = ((i * stride - offset) % total + total) % total;
        if (rel > total / 2) rel -= total;

        /*
          ONE PERSPECTIVE FOR THE WHOLE RAIL, WHICH IS THE ACTUAL FIX.

          The first version gave every card its own `perspective()` inside its
          own transform. That is a separate projection per card, so there is
          no shared vanishing point: the cards turned, but they stayed evenly
          spaced and evenly sized, and the row read as a flat strip of tilted
          thumbnails — which is what Genesis called mid, correctly. It also
          made the turn, the pull-back and the shrink three hand-tuned numbers
          pretending to be one effect.

          The perspective now lives on the viewport (see `measure`) and the
          cards sit on a real cylinder: `rotateY(θ) translateZ(radius)` places
          a card on its surface facing outward, and the track's own
          `translateZ(-radius)` brings the front of that cylinder to the
          screen. θ is just the arc length over the radius.

          Everything else falls out of it. The far cards are smaller because
          they ARE further away; the spacing compresses toward the edges
          because that is what a cylinder does under perspective; and there is
          no `scale` term left at all.
        */
        const theta = rel / radius;
        const away = Math.abs(theta);
        cards[i].style.transform = `rotateY(${((theta * 180) / Math.PI).toFixed(2)}deg) translateZ(${radius.toFixed(0)}px)`;
        /*
          Past about 83 degrees a card is edge-on and then facing away. It
          fades out rather than being drawn as a hairline, which otherwise
          reads as a bright seam at each end of the run.
        */
        cards[i].style.opacity =
          away > 1.45 ? "0" : `${Math.max(0, 1 - Math.pow(away / 1.45, 1.7)).toFixed(3)}`;
        /* Only the cards facing the reader are targets. A 70-degree sliver is
           not something anyone is trying to click. */
        cards[i].style.pointerEvents = away > 0.6 ? "none" : "auto";
        cards[i].style.zIndex = `${100 - Math.round(away * 50)}`;
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
          green. It sits BEHIND the cards and is what the middle of the run
          appears to be lit by: the card square to the reader is at full
          strength over it and the ones turning away fall into the dark at the
          edges. Genesis asked for their own colours, and this is where they
          go.

          WIDER AND STRONGER than the first pass, because the cards overlap
          now — a narrow, faint wash behind a continuous wall of work does
          nothing at all, where behind a sparse row it at least filled the
          gaps. It reads as the light the corridor is lit by rather than as a
          shape sitting under it.
        */
        "before:pointer-events-none before:absolute before:inset-y-[-15%] before:left-1/2 before:z-0 before:w-[68%] before:-translate-x-1/2",
        "before:bg-[radial-gradient(ellipse_at_center,rgb(255_197_22/0.22)_0%,rgb(247_113_158/0.11)_42%,rgb(122_60_255/0.07)_64%,transparent_78%)]",
        /* And the ends dissolve rather than cut, as every rail here does. */
        "[mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]",
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
  /*
    CENTRED BY MARGIN, NOT BY TRANSFORM. Every positioner sits at the middle
    of the rail and is moved from there by the cylinder — so its resting place
    has to be the centre, and it cannot use `-translate-x-1/2` to get there
    because the loop owns `transform` outright. A negative margin of half a
    card does the same job in a property nothing else is writing.

    `backface-visibility` matters here for the same reason the opacity ramp
    does: a card past ninety degrees is showing its back, and a mirrored still
    of somebody's work is a worse artefact than a missing one.

    NO `preserve-3d` ON THIS BOX. The track needs it, because its children ARE
    positioned in three dimensions. The positioner's child is a flat card that
    should be rasterised as one plane and then projected — given a 3D context
    of its own, its border, video and caption each become separately
    positioned layers, which is how a card like this ends up with its caption
    detaching from its frame at a steep angle.
  */
  const positioner =
    "absolute inset-y-0 left-1/2 ml-[calc(var(--warp-card)/-2)] flex w-[var(--warp-card)] items-center will-change-transform [backface-visibility:hidden]";
  const card =
    "relative w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-ink shadow-[0_30px_60px_-24px_rgb(0_0_0/0.9)] aspect-[5/8]";

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
