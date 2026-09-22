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
 * THE CORRIDOR'S RADIUS, as a multiple of one card's width.
 *
 * THE CARDS ARE ON THE INSIDE OF THE CURVE, NOT THE OUTSIDE — and getting
 * that backwards is what made the first two attempts wrong in a way no amount
 * of tuning could fix.
 *
 * A CONVEX arc (cards on the outside of a cylinder, centre nearest) is
 * coverflow: one big card in the middle, neighbours turning away and
 * shrinking. That is what was built, and it is a different object from the
 * reference — there the cards at the EDGES are the large ones, angled inward,
 * and the run gets smaller and flatter toward the middle. You are not looking
 * at a row of cards. You are looking DOWN a corridor whose walls are made of
 * them, with the vanishing point in the centre of the frame.
 *
 * So the arc is concave: z runs toward the reader as the angle grows, and
 * each card turns to face the axis. The middle of the run is the far end of
 * the corridor.
 *
 * 3.05 puts four cards on each wall between the centre and the frame edge,
 * the nearest of them at about 77 degrees.
 */
const RADIUS = 3.05;

/**
 * The viewing distance, also in card widths.
 *
 * IT HAS A FLOOR THAT THE CONVEX VERSION DID NOT. With the arc curving toward
 * the reader, a card near the end of the run has real positive z — and as z
 * approaches the viewing distance its projected size runs away to infinity.
 * At 7.6 against a radius of 3.05 the nearest card sits at about a third of
 * the way to the eye and renders around 40% larger than the far ones, which
 * is the proportion the reference has. Shorten this and the outer cards
 * balloon off the frame.
 */
const VIEW = 7.6;

/** Px per second. Slow: the cards are meant to be looked at, not counted. */
const SPEED = 40;

/**
 * Arc between one card and the next, as a share of a card's width.
 *
 * 0.9, WHICH IS A COMPROMISE BETWEEN TWO FAILURES EITHER SIDE OF IT. At 0.82
 * on a CONCAVE arc the near cards — which are magnified, not shrunk — buried
 * each other and the wall became a folded strip with nothing readable on it.
 * At a clean 1.0 the arc spacing is right at the far end and the projection
 * then spreads the near ones apart, so the corridor opens gaps exactly where
 * it should look most solid. Just under one card width closes those without
 * the panels swallowing one another.
 */
const STEP = 0.9;

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
      /*
        NO PULL-BACK ON THE TRACK. The convex version needed one to bring the
        front of its cylinder to the screen. A concave arc already has its far
        end at z = 0 and comes forward from there, so translating the track
        would push the whole corridor into the reader's eye.
      */
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
          own transform: a separate projection per card, so there was no
          shared vanishing point. The cards turned but stayed evenly spaced
          and evenly sized, which is a flat strip of tilted thumbnails.

          The second was a real cylinder and still the wrong object. It was
          CONVEX — cards on the outside, centre nearest — which is coverflow:
          one big card in the middle, neighbours turning away. The reference
          is the other way round. Its large cards are at the EDGES, angled
          inward, and the run shrinks toward the middle, because you are
          looking down a corridor with the vanishing point in the centre of
          the frame.

          SO THE ARC IS CONCAVE. `z` grows with the angle rather than
          shrinking, putting the middle of the run at the far end and bringing
          the edges toward the reader, and each card turns by -θ to face back
          at the axis: the left wall faces right, the right wall faces left.
          The perspective lives on the viewport, so all of them share one
          vanishing point.

          Everything else falls out of the geometry. The edge cards are larger
          because they ARE nearer; the middle ones are small and nearly square
          to the eye because they are far away. No `scale` term anywhere.
        */
        const theta = rel / radius;
        const away = Math.abs(theta);
        const x = radius * Math.sin(theta);
        const z = radius * (1 - Math.cos(theta));
        cards[i].style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${((-theta * 180) / Math.PI).toFixed(2)}deg)`;

        /*
          DEPTH IS READ AS LIGHT, NOT ONLY AS SIZE. The far end of a corridor
          is darker, and without that the small central cards read as small
          rather than as distant.

          The taper past 1.3 radians is the end of the run: a card there is
          about to pass the eye, where the projection would throw it across
          the whole frame. It goes out before it can.
        */
        const lit = 0.62 + 0.38 * Math.min(1, away / 1.05);
        const taper = away > 1.5 ? 0 : away > 1.3 ? (1.5 - away) / 0.2 : 1;
        cards[i].style.opacity = (lit * taper).toFixed(3);
        /*
          Only the cards square enough to read are targets; a steeply angled
          panel is not something anyone is trying to click.

          NO z-index. The track preserves 3D, so the browser sorts these by
          their real depth — and a z-index would flatten that back into paint
          order, putting far cards over near ones at the seams.
        */
        cards[i].style.pointerEvents = away > 0.85 || taper < 1 ? "none" : "auto";
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
        /*
          AND THE LIGHT AT THE END OF IT. A narrow vertical beam on the
          corridor's axis, behind the cards, so it shows between the panels
          and burns brightest where they are furthest away and dimmest.
          The reference has one and it is doing real work: it gives the run a
          destination, which is the difference between a curved wall and a
          corridor you are looking down.

          Brand yellow rather than the reference's green, as Genesis asked.
        */
        "after:pointer-events-none after:absolute after:inset-y-[-8%] after:left-1/2 after:z-0 after:w-[9%] after:-translate-x-1/2",
        "after:bg-[linear-gradient(180deg,transparent,rgb(255_197_22/0.28)_22%,rgb(255_229_150/0.42)_50%,rgb(255_197_22/0.28)_78%,transparent)]",
        "after:blur-[22px]",
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
