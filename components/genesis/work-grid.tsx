"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { matchesFilter, workFilters, type WorkItem } from "@/lib/work";
import { cn } from "@/lib/utils";
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
  const filters = useMemo(() => workFilters(items), [items]);
  const visible = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  const scroller = useRef<HTMLDivElement>(null);
  const page = useCallback((direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    /* Roughly a screenful, so a click moves the reader on without losing the
       thread of where they were. */
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

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
        <div className="relative">
          {/*
            TWO ROWS, FLOWING SIDEWAYS. `grid-flow-col` with two explicit rows
            fills top-then-bottom and starts a new column, which is what makes
            a horizontal rail read in the same order a grid does. Each column
            is a fixed fraction of the viewport so a tile is never a sliver,
            and `snap-x` lands the scroll on a column edge rather than halfway
            through one.
          */}
          <div
            ref={scroller}
            className="no-scrollbar -mx-6 grid snap-x snap-mandatory grid-flow-col grid-rows-2 gap-3 overflow-x-auto scroll-smooth px-6 pb-1 sm:gap-4"
            style={{ gridAutoColumns: "clamp(9rem, 38vw, 15rem)" }}
          >
            {visible.map((item) => (
              <div key={item.key ?? item.slug} className="aspect-[9/13] snap-start">
                <WorkTile item={item} variant="fill" />
              </div>
            ))}
          </div>

          {/*
            THE ARROWS. Genesis asked for them, and they are an addition to
            the scroll rather than a replacement: the rail still takes a
            trackpad swipe, a shift-wheel and a keyboard, so the buttons are
            aria-hidden furniture for the pointer rather than the only way
            through. They page by roughly a screenful, clamped so a short rail
            cannot scroll into empty space.
          */}
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
              <WorkTile item={item} variant="fill" />
            </div>
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <p className="py-16 text-center text-small text-ash">
          Nothing in {filter} yet.
        </p>
      )}
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
function RailArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const left = direction === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={left ? "Previous work" : "Next work"}
      className={cn(
        "absolute top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full sm:grid",
        "border border-[var(--glass-border)] bg-[var(--surface-raised)]/85 text-bone backdrop-blur",
        "transition-colors hover:bg-[var(--hover-wash)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        left ? "-left-2" : "-right-2",
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
