"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DivisionLockup } from "@/components/genesis/division-lockup";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { useEdgeFade } from "@/components/genesis/use-edge-fade";
import { WorkGrid } from "@/components/genesis/work-grid";
import { aspectFor, WorkTile } from "@/components/genesis/work-tile";
import {
  billboardItem,
  matchesFilter,
  workFilters,
  expandToClips,
  workRows,
  type WorkItem,
  type WorkRow,
} from "@/lib/work";
import { cn } from "@/lib/utils";

/**
 * The Portfolio, browsed rather than dumped.
 *
 * WHAT THIS REPLACED. One masonry wall of everything, five columns wide,
 * behind a row of filter chips: fourteen tiles in five different shapes with
 * no order, no grouping and nothing saying what any of it was. Genesis asked
 * for Netflix, and the part of that layout that does the work is the SHELF —
 * a titled row of a few things, so the page is read rather than scanned.
 *
 * TWO MODES, WHICH IS ALSO HOW NETFLIX WORKS.
 *
 *   BROWSE (no filter) — a billboard and then the shelves from lib/work.
 *   GENRE (a filter picked) — the shelves collapse to one grid of everything
 *     that matches, because once you have said what you want, rows that
 *     re-sort it are in the way.
 *
 * THE SHELVES ARE DATA, NOT LAYOUT. `workRows` is the whole definition of
 * what rows exist and what goes in them, and it lives beside the catalogue.
 * Genesis's instruction is that these become the folders in the shared Drive;
 * when that arrives it is an edit to one array in lib/work.ts, and nothing in
 * this file learns about it.
 */

/**
 * One shelf: a title, and a rail you can push.
 *
 * FIXED HEIGHT, VARYING WIDTH. The tiles are portrait reels, 4:3 shoots and
 * 173:200 mockup cards all in one row. Netflix rows are uniform because
 * Netflix artwork is; forcing one aspect here would crop the client's name off
 * the bottom of every mockup card. Giving every tile the row's HEIGHT and
 * letting its width follow keeps the row flush top and bottom, which is the
 * part the eye actually reads as uniform.
 */
function Shelf({
  title,
  blurb,
  division,
  items,
}: {
  title: string;
  blurb?: string;
  division?: WorkRow["division"];
  items: WorkItem[];
}) {
  /*
    A narrower fade than the poster rail's 14%. That number was set for
    500px-wide poster cards, where a third of a card had to dissolve; these
    tiles are 180-260px, so 14% would veil a whole tile at each end.
  */
  const { ref, style } = useEdgeFade<HTMLDivElement>({ max: 6, ramp: 120 });
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /*
    Arrow state is the ONLY thing here that needs React. The fade is written
    straight onto the node by useEdgeFade precisely so scrolling does not
    re-render; these two booleans change a handful of times per rail, and they
    are set only when the value actually flips.
  */
  const sync = useCallback(() => {
    const rail = ref.current;
    if (!rail) return;
    const travel = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(travel <= 2 || rail.scrollLeft >= travel - 2);
  }, [ref]);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    sync();
    rail.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [ref, sync]);

  const push = (direction: -1 | 1) => {
    const rail = ref.current;
    if (!rail) return;
    // Nine tenths of a screenful, so the tile at the edge stays half in view
    // and the row does not feel like it jumped somewhere else.
    rail.scrollBy({ left: direction * rail.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="group/shelf relative">
      <header className="mb-4 flex items-end justify-between gap-4 px-6">
        <div className="min-w-0">
          {/*
            A division shelf is announced by its own lockup, at Genesis's
            instruction — the supplied artwork with the gradient, the same
            mark the division carries everywhere else on the site. It brings
            its tagline with it as text, so the row's blurb is not printed as
            well; see the note on WorkRow.division.

            38px rather than the lockup's own 58. This is a shelf heading
            sitting next to a 20px blurb on the rows either side of it, and at
            full size GENESIS.Brand & Design would run 280px wide in a row
            header and read as a section title rather than a shelf.
          */}
          {division ? (
            <DivisionLockup
              name={division.name}
              tagline={division.tagline}
              ramp={division.ramp}
              height={38}
            />
          ) : (
            <>
              <h2 className="text-h3 font-medium tracking-tight text-bone">
                {title}
              </h2>
              {blurb && <p className="mt-1 text-small text-ash">{blurb}</p>}
            </>
          )}
        </div>

        {/*
          The arrows live in the header rather than floating over the artwork.
          Over the rail they cover a tile at exactly the moment you are trying
          to look at it, and on a touch screen — where the rail is swiped and
          they are useless — they cover it permanently.
        */}
        <div className="hidden shrink-0 gap-2 sm:flex">
          {([-1, 1] as const).map((direction) => {
            const disabled = direction === -1 ? atStart : atEnd;
            const Icon = direction === -1 ? ChevronLeft : ChevronRight;
            return (
              <button
                key={direction}
                type="button"
                onClick={() => push(direction)}
                disabled={disabled}
                aria-label={`Scroll ${title} ${direction === -1 ? "left" : "right"}`}
                className={cn(
                  "grid size-9 place-items-center rounded-full border border-[var(--glass-border)] transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  disabled
                    ? "cursor-default text-faint opacity-40"
                    : "text-ash hover:bg-[var(--hover-wash)] hover:text-bone",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            );
          })}
        </div>
      </header>

      {/*
        Full-bleed, and the padding is what the page container would have
        given it — so the row runs off both edges of the screen the way a
        shelf should, and the fade has page to dissolve into rather than
        stopping at a container boundary with empty page beyond it.
      */}
      <div
        ref={ref}
        style={style}
        className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-6 pb-2 sm:gap-4"
      >
        {items.map((item) => (
          <div
            key={item.slug}
            className="h-[13rem] shrink-0 snap-start sm:h-[15rem] lg:h-[17rem]"
          >
            <WorkTile item={item} variant="rail" />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * The billboard.
 *
 * NOT A FULL-BLEED BACKDROP, and that is the artwork's doing rather than a
 * preference. Netflix's hero is a 21:9 key art still; every picture in this
 * catalogue is portrait or square — the interim cards are 173:200 — and a
 * 21:9 crop of a portrait still is a band of someone's shoulder. So the
 * picture keeps its own shape in its own column and the copy sits beside it,
 * which is a hero built from what exists rather than one built from what a
 * reference had.
 */
function Billboard({ item }: { item: WorkItem }) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
      <div className="flex flex-col items-start gap-5">
        <span className="micro-label text-brand-ink">Featured</span>
        <h2 className="text-balance text-h1 font-normal leading-[1.02] tracking-tight text-bone">
          {item.client}
        </h2>
        <p className="text-pretty text-lead leading-relaxed text-ash">
          {item.title}
        </p>
        <div className="flex flex-wrap gap-2">
          {[item.vertical, item.format].map((tag) => (
            <span
              key={tag}
              className="glass-chip rounded-full px-3 py-1.5 text-micro text-bone"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-3">
          <GlassButton href={`/work/${item.slug}`} variant="brand" arrow>
            View project
          </GlassButton>
        </div>
      </div>

      {/*
        CAPPED, because a portrait hero has no natural ceiling. Stacked below
        lg the art column is the full container, and at 173:200 a 625px column
        renders a 723px-tall picture — a hero that is taller than the phone
        looking at it. 22rem keeps it to about 430px there; from lg it shares
        the row and the grid does the limiting.
      */}
      <div
        className={cn(
          "relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-panel border border-[var(--glass-border)] bg-ink lg:mx-0 lg:max-w-none",
          aspectFor(item),
        )}
      >
        {item.art && (
          <Image
            src={item.art}
            alt={`${item.client}, ${item.title}`}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}

export function WorkBrowse({
  items,
  initialFilter = "All",
}: {
  items: WorkItem[];
  /**
   * Which filter the page opens on, from `?filter=` on the URL.
   *
   * IT IS A PROP, NOT A useSearchParams CALL, and that is a rendering
   * decision rather than a style one. Reading the query string inside this
   * component would opt the whole Portfolio route out of static rendering
   * and require a Suspense boundary around it. The page is a server
   * component that already receives searchParams; handing the answer down
   * costs nothing and keeps the page static for the common case of no query
   * at all.
   *
   * Genesis's use for it is the division CTAs: "View Case Studies" under
   * Influence has to land on the library already filtered to influencer
   * campaigns rather than on the whole catalogue.
   */
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const filters = useMemo(() => workFilters(items), [items]);
  const shelves = useMemo(() => workRows(items), [items]);
  const hero = useMemo(() => billboardItem(items), [items]);
  const filtered = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );
  const browsing = filter === "All";

  return (
    <div>
      {browsing && hero && (
        <Reveal variant="scene" className="mx-auto w-full max-w-6xl px-6">
          <Billboard item={hero} />
        </Reveal>
      )}

      <div className="mx-auto w-full max-w-6xl px-6">
        <div
          role="group"
          aria-label="Filter work"
          className={cn("flex flex-wrap gap-2", browsing ? "mt-14 sm:mt-16" : "mt-0")}
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
      </div>

      {browsing ? (
        /*
          Full-bleed wrapper, so each shelf can run to both edges of the
          screen. The page's own container stops at 72rem, and a rail that
          stops there has 144px of empty page beyond its fade on a large
          display — which is the cut Genesis has found on every rail on this
          site.
        */
        <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2 space-y-12 sm:space-y-14">
          {shelves.map(({ row, items: shelfItems }) => (
            <div key={row.id} className="mx-auto w-full max-w-6xl">
              <Shelf
              title={row.title}
              blurb={row.blurb}
              division={row.division}
              items={shelfItems}
            />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-10 w-full max-w-6xl px-6">
          {/*
            The grid's own filter row is off — this view already has one above,
            and two sets of chips filtering the same list is a bug waiting to
            be reported.
          */}
          {/*
            EVERY CLIP, not one tile per engagement — the same fix the landing
            page needed. Filtering happens on engagements above, so expanding
            here keeps the chips answering for whole pieces while the grid
            shows all the footage inside them.
          */}
          <WorkGrid items={expandToClips(filtered)} showFilters={false} />
        </div>
      )}
    </div>
  );
}
