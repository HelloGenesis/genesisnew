"use client";

import { useMemo, useState } from "react";

import type { CaseStudyCopy } from "@/lib/case-study-copy";
import { cn } from "@/lib/utils";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { CaseStudyView } from "./case-study-view";
import { Overlay, pagerFor } from "./overlay";
import { useInViewPlayback } from "./use-in-view-playback";

/** One card on /case-studies, with everything resolved on the server. */
export type CaseStudyCard = {
  key: string;
  brand: string;
  /** The line under the brand. Absent for film-only pieces. */
  line?: string;
  labels: string[];
  /** Filter chips this card answers to (division, format, sector). */
  facets: string[];
  poster: string;
  preview: string;
  /** Full film where Drive serves one; the preview otherwise. */
  film?: string;
  copy?: CaseStudyCopy;
};

/**
 * /case-studies as a work index, after Schbang's: filter chips over a grid of
 * cards, each a picture with the client in bold and one line beneath, the
 * study opening over the page.
 *
 * REEL-SHAPED, NOT LANDSCAPE. Schbang's cards are wide article images; every
 * film here is 9:16, and Genesis asked for the reel shape, so the grid is
 * four narrow columns on a laptop and two on a phone.
 *
 * THE CHIPS ARE THE PORTFOLIO'S, in its order, so the two sections filter the
 * same way. Each card answers to the division, format and sector of the
 * portfolio piece its film belongs to — nothing is tagged by hand here.
 *
 * THE WINDOW STEPS. Its arrows and the arrow keys walk the cards the reader
 * is looking at — the filtered set, in grid order.
 */
export function CaseStudyGrid({
  cards,
  filters,
}: {
  cards: CaseStudyCard[];
  filters: string[];
}) {
  const [filter, setFilter] = useState("All");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "All" ? cards : cards.filter((card) => card.facets.includes(filter))),
    [cards, filter],
  );
  const openIndex = visible.findIndex((card) => card.key === openKey);
  const open = openIndex === -1 ? null : visible[openIndex];

  return (
    <div>
      <div
        role="group"
        aria-label="Filter case studies"
        className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
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

      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {visible.map((card) => (
          <li key={card.key}>
            <Card card={card} onOpen={() => setOpenKey(card.key)} />
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="py-16 text-center text-small text-ash">Nothing in {filter} yet.</p>
      )}

      <Overlay
        open={open !== null}
        label={open ? `${open.brand}${open.copy ? `, ${open.copy.campaign}` : ""}` : "Case study"}
        onClose={() => setOpenKey(null)}
        className="max-w-6xl"
        pager={pagerFor(visible, openIndex, (card) => setOpenKey(card.key), (card) => card.brand)}
      >
        {open && <Study card={open} />}
      </Overlay>
    </div>
  );
}

function Card({ card, onOpen }: { card: CaseStudyCard; onOpen: () => void }) {
  const videoRef = useInViewPlayback<HTMLVideoElement>();

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={card.line ? `${card.brand}: ${card.line}` : card.brand}
      className="group block w-full text-left focus-visible:outline-none"
    >
      <div
        className={cn(
          "relative aspect-[9/16] overflow-hidden rounded-card border border-[var(--glass-border)] bg-ink",
          "transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_50px_-22px_rgb(255_197_22/0.45)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-brand",
        )}
        style={{ backgroundImage: `url(${card.poster})`, backgroundSize: "cover" }}
      >
        <video
          ref={videoRef}
          src={card.preview}
          poster={card.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          {...VIDEO_GUARD_CLIENT}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute left-2.5 right-2.5 top-2.5 flex flex-wrap gap-1.5">
          {card.labels.map((label) => (
            <span
              key={label}
              className="glass rounded-full px-2.5 py-1 text-micro font-medium tracking-wide text-bone"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-3 text-body font-semibold leading-snug text-bone">{card.brand}</p>
      {card.line && (
        <p className="mt-1 line-clamp-2 text-small leading-snug text-ash">{card.line}</p>
      )}
    </button>
  );
}

function Study({ card }: { card: CaseStudyCard }) {
  return (
    <CaseStudyView
      labels={card.labels}
      headline={card.copy?.headline}
      subheadline={card.copy ? `${card.brand} · ${card.copy.campaign}` : card.brand}
      poster={card.poster}
      film={card.film}
      preview={card.preview}
      copy={card.copy}
    />
  );
}
