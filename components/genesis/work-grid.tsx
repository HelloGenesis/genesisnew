"use client";

import { useMemo, useState } from "react";

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
  className,
}: {
  items: WorkItem[];
  showFilters?: boolean;
  className?: string;
}) {
  const [filter, setFilter] = useState("All");
  const filters = useMemo(() => workFilters(items), [items]);
  const visible = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  return (
    <div className={className}>
      {showFilters && filters.length > 2 && (
        <div
          role="group"
          aria-label="Filter work"
          className="mb-8 flex flex-wrap gap-2"
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
                  "rounded-full px-3.5 py-1.5 text-small transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
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
      <div
        className={cn(
          "grid gap-3 sm:gap-4",
          "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        )}
      >
        {visible.map((item) => (
          <div key={item.slug} className="aspect-[9/13]">
            <WorkTile item={item} variant="fill" />
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-16 text-center text-small text-ash">
          Nothing in {filter} yet.
        </p>
      )}
    </div>
  );
}
