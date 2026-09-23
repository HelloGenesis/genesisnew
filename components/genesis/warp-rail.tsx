"use client";

import { useEffect, useRef } from "react";

import { RailArrow } from "./work-grid";
import { useInViewPlayback } from "./use-in-view-playback";
import { mediaUrl } from "@/lib/media-url";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { cn } from "@/lib/utils";

/**
 * The warp rail — a corridor of work, drifting past the reader.
 *
 * WHAT IT IS FOR. AI Lab's argument is volume — work "created with AI, built
 * for your brand", made at a rate a studio could not otherwise hold — and the
 * honest way to show that is a lot of finished work moving past you rather
 * than four tiles in a grid. Genesis pointed at a reference doing exactly this and
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
 * How far the card at the edge of the frame has turned, in degrees.
 *
 * MODEST, AND THAT IS THE WHOLE LESSON OF THIS COMPONENT. Two versions put
 * the cards on a cylinder — first convex, then concave — on the reasoning
 * that a real curve would produce a real corridor. Both were worse than the
 * flat row they replaced, and the concave one badly so: an arc that brings
 * its ends toward the reader magnifies them, and a magnified card seen at an
 * angle splays its top and bottom edges. Eleven of those in a row is a
 * barrel. Genesis's read — "this is like circle inside, I don't want that" —
 * is exactly what the geometry was doing.
 *
 * The reference is not a curve at all. It is a ROW of upright panels, evenly
 * spaced, leaning a little further the further they sit from the middle, and
 * falling back into the dark at the ends. Nothing in it bulges, because
 * nothing in it comes forward.
 */
const MAX_TURN = 34;

/**
 * How far the edge cards sit BACK, as a share of a card's width.
 *
 * Back, never forward. It is the only depth in the scene, and keeping every
 * card at or behind the screen is what stops the projection from splaying
 * anything: a card further away is smaller and flatter, which is the whole
 * depth cue, and it cannot bow.
 */
const DEPTH = 0.55;

/**
 * The viewing distance, in card widths.
 *
 * LONG, on purpose. The shared vanishing point is what makes this one scene
 * rather than a strip of separately tilted thumbnails — but a close viewer
 * turns a gentle lean into a fisheye. At nine card widths the depth reads
 * and the panels stay rectangular.
 */
const VIEW = 9;

/** Px per second. Slow: the cards are meant to be looked at, not counted. */
const SPEED = 40;

/**
 * Space between one card and the next, as a share of a card's width.
 *
 * OVER ONE, SO THERE ARE GAPS. The reference has clear dark between its
 * panels; the version that overlapped them read as a folded strip with
 * nothing legible on it.
 *
 * 1.18 rather than 1.1, because the lean eats into it. A card turned 30
 * degrees projects at about seven eighths of its width, so the gap measured
 * on screen is wider than the arithmetic in the middle of the row and
 * narrower at the ends — at 1.1 the outermost pair were four points apart,
 * which is a seam rather than a gap.
 */
const STEP = 1.18;

/**
 * How fast an arrow press is carried out, as a rate constant rather than a
 * duration: each frame the rail covers `GLIDE × delta` of whatever distance
 * is left, so the move starts quickly and settles rather than stopping dead.
 * 6 lands a card-and-a-bit in about half a second.
 */
const GLIDE = 6;

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
  /*
    THE ARROWS' WAY IN. The whole animation lives inside one effect — the
    position, the geometry and the frame loop are all closure variables, and
    deliberately so: they change sixty times a second and none of them is
    state React should re-render for. A ref holding the effect's own handler
    is how a button outside reaches in without any of that becoming state.
  */
  const nudge = useRef<((direction: 1 | -1) => void) | null>(null);

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
    /*
      HOW FAR THE ARROWS STILL HAVE TO CARRY THE RAIL, in pixels. The loop
      owns `offset` and nothing outside this effect can reach it, so a press
      does not move the rail — it adds to the distance the loop is on its way
      through. That keeps one writer for the position, which is what stops a
      press from fighting the drift for a frame and jumping.
    */
    let glide = 0;

    const measure = () => {
      /*
        The POSITIONER's width, which is --warp-card — the same value the
        visible card fills. Reading the card inside it would give the same
        number today and would quietly break the spacing the day the card
        gains a margin.
      */
      width = cards[0]?.offsetWidth ?? 0;
      stride = width * STEP;
      /*
        The viewing distance and the track's pull-back are derived from the
        measured card too, so the whole corridor scales with it rather than
        being pixel constants that only look right at one viewport.
      */
      box.style.perspective = `${(width * VIEW).toFixed(0)}px`;
      /*
        NO PULL-BACK ON THE TRACK. Every card sits at or behind z = 0 already,
        so there is nothing to bring forward — and translating the whole row
        toward the reader is precisely what produced the barrel.
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
      if (stride === 0) return;
      const reach = box.clientWidth / 2;
      for (let i = 0; i < cards.length; i += 1) {
        /*
          WRAPPED INTO A BAND CENTRED ON THE FRAME, which is the difference
          between a corridor and a queue. Taking the position modulo the FULL
          track and folding the far half negative puts half the cards either
          side of the middle at every moment, including the first frame; the
          run cycles through that band rather than marching along it.
        */
        let rel = (((i * stride - offset) % total) + total) % total;
        if (rel > total / 2) rel -= total;

        /*
          A FLAT ROW THAT LEANS, UNDER ONE SHARED PERSPECTIVE.

          The cards keep their spacing along x — evenly, with a real gap — and
          the only things that change with distance from the middle are how
          far a card has turned and how far BACK it sits. Never forward: a
          card at or behind the screen gets smaller and flatter as it recedes,
          which is the entire depth cue, and it cannot bow. That is what the
          two cylinder versions got wrong, most visibly the concave one, whose
          magnified end panels splayed into a barrel.

          The perspective lives on the viewport (see `measure`), so all of
          them share a vanishing point and the row reads as one scene rather
          than as separately tilted thumbnails. That part the first draft had
          wrong and it is the one thing kept from the rewrites.

          `d` is the position as a share of a half-frame, so the lean is tied
          to where a card sits in the FRAME rather than to how many cards
          happen to be in the list.
        */
        const d = Math.max(-1.4, Math.min(1.4, rel / reach));
        const away = Math.abs(d);
        const z = -away * DEPTH * width;
        cards[i].style.transform =
          `translate3d(${rel.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${(-d * MAX_TURN).toFixed(2)}deg)`;

        /*
          They fall into the dark at the ends rather than being cut by the
          frame. The mask on the viewport does the last of it; this is what
          stops a card arriving at full strength and then vanishing.
        */
        const taper =
          away > 1.3 ? 0 : away > 0.82 ? 1 - (away - 0.82) / 0.48 : 1;
        cards[i].style.opacity = (
          taper *
          (0.72 + 0.28 * (1 - away / 1.4))
        ).toFixed(3);
        /*
          Only the cards square enough to read are targets; a steeply leaning
          panel at the edge is not something anyone is trying to click.

          NO z-index. The track preserves 3D, so the browser sorts by real
          depth; a paint-order index would flatten that back and put the far
          cards over the near ones at the seams.
        */
        cards[i].style.pointerEvents = away > 0.75 ? "none" : "auto";
      }
    };

    const tick = (now: number) => {
      const delta = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;

      if (glide !== 0) {
        /*
          A PRESS SUSPENDS THE DRIFT until it has been served. Left alone the
          two would add up going forward and cancel going back, so the same
          press would cover different ground depending on which arrow it was.
        */
        const move = glide * Math.min(1, GLIDE * delta);
        offset += move;
        glide -= move;
        if (Math.abs(glide) < 0.5) glide = 0;
      } else if (!hovering && !still.matches) {
        offset += SPEED * delta;
      }

      /*
        WRAPPED IN BOTH DIRECTIONS, which the drift alone never needed. It
        only ever counted up, so one subtraction was enough; the left arrow
        can now take `offset` negative, and without the second branch it would
        stay there and the row would sit off its band.
      */
      if (half > 0) offset = ((offset % half) + half) % half;

      paint();
      frame = requestAnimationFrame(tick);
    };

    /*
      What the arrows call. A press is worth more than one card — a single
      stride barely changes what is in the middle of the frame — so it moves
      three, which swaps out most of what the reader can read.
    */
    nudge.current = (direction: 1 | -1) => {
      if (stride === 0) return;
      glide += direction * stride * 3;
      /* A press on a rail that has scrolled out of view should still be
         served when it comes back, so this does not touch `visible`. */
      start();
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
      nudge.current = null;
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
    /*
      A WRAPPER SO THE ARROWS ARE NOT CLIPPED. The rail itself is
      `overflow-hidden` — it has to be, the corridor runs past both edges —
      so a control positioned on it would be cut in half. This box holds
      both, and the arrows sit over the gutters where the mask has already
      faded the work to nothing.
    */
    <div className={cn("relative w-full", className)}>
      <div
        ref={viewport}
        className={cn(
          "relative w-full overflow-hidden",
          /*
          NO COLOUR BEHIND THE CARDS ANY MORE.

          There was a brand wash here and a beam down the axis, and Genesis's
          read was that they were doing nothing worth the noise — "fokat ka".
          They were right, and the reason is that both were built for a
          composition that no longer exists. The wash filled the gaps a sparse
          row left, and the beam gave a vanishing point to a corridor. This is
          a row of upright panels with small, even gaps: there is nothing for
          a wash to fill, and no tunnel for a beam to end.

          What was actually visible of them was their own edges — a soft-edged
          ellipse and a vertical smear sitting behind the work, read as
          shapes rather than as light. The section's Atmosphere already lights
          this block, and it lights the whole of it rather than a patch.
        */
          /* And the ends dissolve rather than cut, as every rail here does. */
          "[mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]",
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

      {/*
      THE SAME ARROWS THE PORTFOLIO RAIL HAS, in the same place and at the
      same size, because they do the same job — Genesis asked for them here
      ("idhar button daaldo left right ka"). The rail drifts on its own, which
      shows there is more work than fits; the arrows are how a reader who
      wants to see a particular piece gets to it without waiting.

      From `sm` up, like the portfolio's. On a phone the cards are a larger
      share of the screen and a 40px control parked over the artwork covers a
      real fraction of it, while the drift still shows everything.
    */}
      <RailArrow
        direction="left"
        label="Previous AI work"
        onClick={() => nudge.current?.(-1)}
        className="left-1 sm:left-2"
      />
      <RailArrow
        direction="right"
        label="Next AI work"
        onClick={() => nudge.current?.(1)}
        className="right-1 sm:right-2"
      />
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

  if (!item.onOpen) {
    return (
      <div aria-hidden={hidden} className={positioner}>
        <span className={card}>{inner}</span>
      </div>
    );
  }

  /*
    A HANDLER WITH NO URL IS A BUTTON, and getting this wrong cost a round.

    Cards whose clip has no written study open the portfolio's window on the
    piece instead, and there is no page for a piece — the old /work/<slug>
    routes redirect to the portfolio section. Giving those cards `/#library`
    as an honest-looking href did not work and could not: SmoothScroll
    registers its click listener in the CAPTURE phase precisely so it beats
    React, so it claimed the hash and scrolled the page before this
    component's onClick ever ran.

    It is also the right semantics on its own terms. A control that opens a
    window over the page is a button; an anchor promises a destination, and
    there is none to promise.
  */
  if (!item.href) {
    return (
      <button
        type="button"
        aria-hidden={hidden}
        tabIndex={hidden ? -1 : undefined}
        aria-label={`Open ${item.label}`}
        onClick={() => item.onOpen?.()}
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
      </button>
    );
  }

  return (
    <a
      href={item.href}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      onClick={(event) => {
        /* Modified clicks belong to the browser: cmd-click still opens a tab. */
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
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
