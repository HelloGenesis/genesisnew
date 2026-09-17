"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { findWork, matchesFilter, workFilters, type WorkItem } from "@/lib/work";
import { cn } from "@/lib/utils";
import { WorkDialog } from "./work-dialog";
import { WorkTile } from "./work-tile";

/**
 * The work grid — filters plus tiles, used by both the homepage Work section
 * and the full Portfolio.
 *
 * ONE COMPONENT FOR BOTH, because they are the same thing at two lengths:
 * Work is the featured slice, Portfolio is everything. Two grids would drift
 * within a week.
 *
 * EVERY TILE IS A LINK TO A REAL URL, not a click handler that opens a
 * lightbox. /work/<slug> is a page — it can be shared, indexed, and pasted
 * into a proposal. Middle-click and cmd-click open the project in a tab,
 * which a div-with-onClick would have silently swallowed.
 *
 * THE MODAL IS GONE. /work/<slug> used to be intercepted into a dialog over
 * the grid, so browsing felt like a gallery while the address bar still said
 * something useful. Genesis has asked for the work to play "directly within
 * the gallery, without any pop-ups", and a dialog is a pop-up however it is
 * routed — so the tiles play where they sit (see useInViewPlayback) and the
 * click goes to the page. The interception route is deleted rather than left
 * unreferenced; the page it wrapped is untouched.
 */

export function WorkGrid({
  items,
  showFilters = true,
  rail = false,
  className,
}: {
  items: WorkItem[];
  showFilters?: boolean;
  /**
   * Two rows that slide sideways, with arrows, instead of a grid that grows
   * downward. The homepage uses it; the Portfolio page does not.
   *
   * WHY THE HOMEPAGE WANTS IT. That section is a teaser inside a page of
   * teasers, and a grid there can only get taller: twelve pieces at four
   * across is three rows, and every piece added later is another row pushing
   * the contact form further away. Two rows is a fixed height whatever the
   * catalogue does, and sideways is the direction that costs the page
   * nothing. Genesis asked for a maximum of two rows and for arrows.
   */
  rail?: boolean;
  className?: string;
}) {
  const [filter, setFilter] = useState("All");
  /* Which piece is open over the page, by slug: a clip tile opens its whole engagement. */
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const filters = useMemo(() => workFilters(items), [items]);
  const visible = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  /*
    A CTA ELSEWHERE ON THE PAGE CAN ASK FOR A FILTER. AI Lab's "View AI
    Content" scrolls here and means the AI work specifically; without this it
    landed on "All" and the reader had to find the chip themselves. The event
    carries the chip's own name and is ignored unless this grid actually
    offers it, so a stale caller cannot empty the shelf.
  */
  useEffect(() => {
    const onClickAnywhere = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest?.("[data-work-filter]");
      const wanted = trigger?.getAttribute("data-work-filter");
      if (wanted && filters.includes(wanted)) setFilter(wanted);
    };
    document.addEventListener("click", onClickAnywhere, true);
    return () => document.removeEventListener("click", onClickAnywhere, true);
  }, [filters]);

  const rowA = useRef<HTMLDivElement>(null);
  const rowB = useRef<HTMLDivElement>(null);
  const page = useCallback((direction: 1 | -1) => {
    /*
      BOTH ROWS MOVE, IN OPPOSITE DIRECTIONS, which is Genesis's "upar wala
      right scroll, niche wala left scroll". The bottom row is laid out
      right-to-left (see the rail below), so "forward" for it is a negative
      scrollLeft. Roughly a screenful each time, so a click moves the reader on
      without losing the thread of where they were.
    */
    for (const [ref, sign] of [[rowA, 1], [rowB, -1]] as const) {
      const el = ref.current;
      if (el) el.scrollBy({ left: sign * direction * el.clientWidth * 0.8, behavior: "smooth" });
    }
  }, []);

  const railBox = useRef<HTMLDivElement>(null);

  /*
    THE STRIPS MOVE ON THEIR OWN ("portfolio me auto move wala rakho"), in
    opposite directions, and they still belong to the reader.

    DRIVEN BY scrollLeft, NOT A CSS MARQUEE. A transform animation is the usual
    way to do this and it would have taken three things away: the swipe (a
    translated track is not a scroll position), the arrows (which step the
    scroll), and the loop without a seam, which a transform marquee buys by
    DOUBLING the track — seventy-two video tiles becoming a hundred and
    forty-four. Moving the real scroll position keeps all three and doubles
    nothing. At the end of a strip it turns and comes back.

    IT GETS OUT OF THE WAY. Pointing at the rail stops it; touching, dragging
    or wheeling a strip stops it for a few seconds and it picks up from
    wherever the reader left it; it only runs while the rail is on screen and
    the tab is visible; and Reduce Motion gets still strips.

    NO SCROLL-SNAP ON THESE STRIPS ANY MORE. Snap re-aligns the position at the
    end of every scroll, and a strip creeping forward a fraction of a pixel a
    frame is one long run of scroll ends: snap kept pulling it back, so it
    stuttered in place instead of moving. The arrows ask for smooth scrolling
    themselves, so the strips no longer need `scroll-smooth` either — which
    would otherwise have tried to animate every one of those fractional steps.
  */
  useEffect(() => {
    if (!rail) return;
    const box = railBox.current;
    const strips = [rowA.current, rowB.current].filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (!box || strips.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const SPEED = 26; // px per second
    const lanes = strips.map((el) => ({
      el,
      rtl: el.dir === "rtl",
      step: 1,
      offset: Math.abs(el.scrollLeft),
    }));
    let onScreen = false;
    let hovering = false;
    let holdUntil = 0;
    let frame = 0;
    let last = performance.now();


    const hold = (ms: number) => {
      holdUntil = performance.now() + ms;
    };
    const enter = () => {
      hovering = true;
    };
    const leave = () => {
      hovering = false;
      hold(900);
    };
    const touched = () => hold(3500);
    box.addEventListener("pointerenter", enter);
    box.addEventListener("pointerleave", leave);
    for (const el of strips) {
      el.addEventListener("pointerdown", touched, { passive: true });
      el.addEventListener("touchstart", touched, { passive: true });
      el.addEventListener("wheel", touched, { passive: true });
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      /*
        ON SCREEN IS MEASURED HERE, EVERY FRAME, not reported by an
        IntersectionObserver. It was an observer first, and on a phone it never
        once reported the rail visible — while a second observer, attached to
        the same element with the same threshold from outside the component,
        reported it fully in view. The strips never moved. The loop already
        runs each frame, and one rect read per frame is cheap, so it asks the
        element directly and cannot be left holding a stale answer.
      */
      const rect = box.getBoundingClientRect();
      onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      const running = onScreen && !hovering && now > holdUntil && !document.hidden;
      for (const lane of lanes) {
        const max = lane.el.scrollWidth - lane.el.clientWidth;
        if (!running || max <= 0) {
          /* Follow the reader's own scrolling, so the drift resumes from there. */
          lane.offset = Math.abs(lane.el.scrollLeft);
          continue;
        }
        /*
          The offset is kept as a float and only WRITTEN, never read back,
          while running. A browser may round scrollLeft to whole pixels, and
          at 26px a second a frame's step is under half of one — read back and
          re-added, it would round to nothing and the strip would never move.
        */
        lane.offset += lane.step * SPEED * dt;
        if (lane.offset >= max) {
          lane.offset = max;
          lane.step = -1;
        } else if (lane.offset <= 0) {
          lane.offset = 0;
          lane.step = 1;
        }
        lane.el.scrollLeft = lane.rtl ? -lane.offset : lane.offset;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointerleave", leave);
      for (const el of strips) {
        el.removeEventListener("pointerdown", touched);
        el.removeEventListener("touchstart", touched);
        el.removeEventListener("wheel", touched);
      }
    };
  }, [rail, visible]);

  return (
    <div className={className}>
      {showFilters && filters.length > 2 && (
        <div
          role="group"
          aria-label="Filter work"
          /*
            A SLIDER ON NARROW SCREENS, a wrapping row on wide ones. Genesis
            asked for the filters to slide. Eight chips wrap to three ragged
            lines on a phone and push the work itself below the fold; as one
            scrolling rail they stay a single line and the grid starts where
            it should. `no-scrollbar` hides the bar, and the row goes back to
            wrapping at sm where there is width for it.
          */
          className="no-scrollbar -mx-6 mb-8 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {filters.map((tag) => {
            const active = tag === filter;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setFilter(tag)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-small transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  active
                    ? "bg-brand text-on-brand"
                    : "border border-[var(--glass-border)] text-ash hover:bg-[var(--hover-wash)] hover:text-bone",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/*
        A LIBRARY: EVERY TILE THE SAME SIZE.

        THIRD LAYOUT, AND THE REASONING IS WORTH KEEPING because the first two
        both failed for the same underlying reason.

        It was CSS multi-column masonry — one width, height set by each
        picture's own aspect — which left a ragged bottom edge and no way to
        emphasise anything. Then it was a bento, with a double-size feature
        every fifth tile. Genesis's verdict on the bento was that it does not
        look good and the library should be uniform, and they are right about
        why: a bento says "this one matters more", and it was saying it about
        whichever piece happened to land on an index divisible by five. An
        emphasis that is assigned by arithmetic is not an emphasis, it is
        noise — and in a catalogue that re-flows every time a filter is
        picked, the same tile is large under one filter and small under the
        next.

        A library is a shelf. Same size, same shape, in order, and the WORK is
        what differs between them. Emphasis, when there is a real reason for
        it, belongs to the billboard at the top of the Portfolio — which is
        chosen deliberately, from the data, rather than by position.

        9:13 FOR EVERY CELL, because that is what the footage is. All 42 clips
        are 1080x1920; the earlier layouts cropped a wide slice out of the
        middle of portrait video on every tile. One aspect for the grid also
        means `aspectFor` no longer has a say here — the cell decides, and the
        tile fills it.
      */}
      {rail ? (
        <div ref={railBox} className="relative">
          {/*
            TWO ROWS THAT SLIDE ON THEIR OWN, IN OPPOSITE DIRECTIONS.

            It was one scroll container holding two grid rows, so both rows
            only ever moved together. Genesis's phone note asks for four cards
            on screen in two lines, "upar wala right scroll, niche wala left
            scroll": two independent strips, each swiped by itself, running
            against each other the way the client wall does.

            The bottom strip is `dir="rtl"`, which is what makes it start at
            the right-hand edge and travel left. Each tile resets to `ltr`, so
            only the strip's direction flips and no caption is mirrored.

            The catalogue is dealt alternately into the two strips rather than
            split in half, so both open with a mix of divisions instead of the
            top being one run of work and the bottom another.

            Two cards per strip on a phone, which is the "4 cards" on screen;
            from `sm` up each tile takes its previous width.
          */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {[
              visible.filter((_, index) => index % 2 === 0),
              visible.filter((_, index) => index % 2 === 1),
            ].map((row, rowIndex) =>
              row.length === 0 ? null : (
                <div
                  key={rowIndex}
                  ref={rowIndex === 0 ? rowA : rowB}
                  dir={rowIndex === 1 ? "rtl" : "ltr"}
                  className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-1 sm:gap-4"
                >
                  {row.map((item) => (
                    <div
                      key={item.key ?? item.slug}
                      dir="ltr"
                      /*
                        A TILE IS BOUND BY THE SCREEN'S HEIGHT TOO, not just
                        its width. These are 9:13, so width sets height, and
                        at 15rem two rows plus the heading and filters stood
                        1074 points on a 800-point laptop. `20vh` caps a tile
                        at about 29vh tall, which keeps both rows and the
                        chrome inside one screen at any window size.

                        LOOSENED FROM 15.5vh TO 22vh at Genesis's request:
                        the tiles read as thumbnails, and "thoda sa slide
                        hoga toh chalega" — a little scroll past one screen
                        is an acceptable price for posters you can read.
                      */
                      className="aspect-[9/13] w-[calc((100vw-3.75rem)/2)] shrink-0 sm:w-[clamp(9rem,min(36vw,22vh),16rem)]"
                    >
                      <WorkTile item={item} variant="fill" onOpen={() => setOpenSlug(item.slug)} />
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>

          <RailArrow direction="left" onClick={() => page(-1)} />
          <RailArrow direction="right" onClick={() => page(1)} />
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3 sm:gap-4",
            "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          )}
        >
          {visible.map((item) => (
            <div key={item.key ?? item.slug} className="aspect-[9/13]">
              <WorkTile item={item} variant="fill" onOpen={() => setOpenSlug(item.slug)} />
            </div>
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <p className="py-16 text-center text-small text-ash">
          Nothing in {filter} yet.
        </p>
      )}
      <WorkDialog
        item={openSlug ? (findWork(openSlug) ?? null) : null}
        onClose={() => setOpenSlug(null)}
      />
    </div>
  );
}

/**
 * One of the rail's two arrows.
 *
 * OVER THE RAIL, NOT ABOVE IT, so it costs no vertical space in a section
 * whose whole point was to stop growing downward. It sits on the gutter the
 * full-bleed rail already runs into, and `pointer-events-none` on the track
 * plus `pointer-events-auto` here means the button is clickable while the
 * area around it still scrolls.
 *
 * HIDDEN BELOW `sm`. On a phone the rail is swiped, the tiles are wider
 * relative to the screen, and a 40px control parked over the artwork covers
 * a real fraction of it.
 */
export function RailArrow({
  direction,
  onClick,
  label,
  className,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  const left = direction === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? (left ? "Previous work" : "Next work")}
      className={cn(
        "absolute top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full sm:grid",
        "border border-[var(--glass-border)] bg-[var(--surface-raised)]/85 text-bone backdrop-blur",
        "transition-colors hover:bg-[var(--hover-wash)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        left ? "-left-2" : "-right-2",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={left ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}
