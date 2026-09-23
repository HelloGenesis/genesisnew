"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { CaseStudyCopy } from "@/lib/case-study-copy";
import { cn, isPlainClick } from "@/lib/utils";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { CaseStudyView } from "./case-study-view";
import { Overlay, pagerFor } from "./overlay";
import { useInViewPlayback } from "./use-in-view-playback";
import { campaignFilmsForSlug } from "@/lib/case-study-pages";

/** One card on /case-studies, with everything resolved on the server. */
export type CaseStudyCard = {
  key: string;
  /**
   * The study's own page, for every study with a write-up. The card becomes
   * a link to it — which is how a crawler finds the thirty-six pages — and a
   * plain click still opens the window. Film-only pieces have no page.
   */
  href?: string;
  brand: string;
  /** The line under the brand. Absent for film-only pieces. */
  line?: string;
  labels: string[];
  /** Filter chips this card answers to (division, format, sector). */
  facets: string[];
  /** The film's poster frame, or a design study's artwork. */
  poster: string;
  /** Absent for a study with no film at all — see `art` on CaseStudyCopy. */
  preview?: string;
  /** Full film where Drive serves one; the preview otherwise. */
  film?: string;
  copy?: CaseStudyCopy;
  /** The film's width over height. */
  ratio: number;
};

/**
 * /case-studies as a work index, after Schbang's: filter chips over a grid of
 * cards, each a picture with the client in bold and one line beneath, the
 * study opening over the page.
 *
 * REEL-SHAPED, EXCEPT WHERE THE FILM IS NOT. Most films are 9:16, so the grid
 * is four narrow columns on a laptop and two on a phone; a landscape film
 * spans two of them at the same height instead of being cropped to a reel.
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

      {/* Dense, so a two-column landscape card never leaves a hole. */}
      <ul className="mt-10 grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {visible.map((card) => (
          /*
            A LANDSCAPE FILM TAKES TWO REELS' ROOM ("do reels jitni jagah
            lo"): it spans two columns, and the li is a size container so the
            card can match its row's reel height exactly — see CardFace.
          */
          <li
            key={card.key}
            className={cn(card.ratio > 1 && "col-span-2 [container-type:inline-size]")}
          >
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
  const label = card.line ? `${card.brand}: ${card.line}` : card.brand;
  const className = "group block w-full text-left focus-visible:outline-none";

  const face = <CardFace card={card} videoRef={videoRef} />;

  if (card.href) {
    return (
      <Link
        href={card.href}
        /*
          No prefetch: a plain click opens the window and never navigates, so
          prefetching thirty-six study pages as they scroll past would fetch
          thirty-six documents nobody here asked for.
        */
        prefetch={false}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          onOpen();
        }}
        aria-haspopup="dialog"
        aria-label={label}
        className={className}
      >
        {face}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={label}
      className={className}
    >
      {face}
    </button>
  );
}

function CardFace({
  card,
  videoRef,
}: {
  card: CaseStudyCard;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const landscape = card.ratio > 1;
  /* A design study's own artwork — see the note below. */
  const art = card.copy?.art;
  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-card border border-[var(--glass-border)] bg-ink",
          /*
            Reels are 9:16. A landscape card is as tall as the reels beside it:
            one column is (width − gap) / 2 of this two-column card, and a
            reel is 16/9 of its width — so (100cqw − gap) × 8/9, with the
            grid's own gaps (1rem, 1.5rem from lg).
          */
          landscape
            ? "h-[calc((100cqw-1rem)*8/9)] lg:h-[calc((100cqw-1.5rem)*8/9)]"
            : "aspect-[9/16]",
          "transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_50px_-22px_rgb(255_197_22/0.45)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-brand",
        )}
        style={
          landscape || !card.poster || art
            ? undefined
            : { backgroundImage: `url(${card.poster})`, backgroundSize: "cover" }
        }
      >
        {/*
          ARTWORK IS CONTAINED ON WHITE, NOT CROPPED TO A REEL.

          A design study's picture is a LOGO — the Activ Health mark, the
          Tripgate wordmark — and `background-size: cover` in a 9:16 tile
          took a tall slice out of the middle of one and threw the rest away,
          which on the boomerang meant a blown-up corner of it. Genesis: "use
          proper logos here."

          The plate is white because both files are ink drawn for paper: one
          has the white ground baked in and the other is dark on
          transparency, so on the near-black card it would not be there at
          all. This is also what the study's own page does with the same
          artwork, so the tile and the page agree.
        */}
        {art && (
          <div className="absolute inset-0 grid place-items-center bg-white p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- a logo of
                unknown intrinsic size that next/image would only re-encode;
                both are small PNGs already committed to /public. */}
            <img src={art} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        )}
        {/*
          NO PICTURE, SO THE NAME IS THE PICTURE — the same fallback the
          portfolio's PosterCard uses, and for the same reason. Tripgate's
          identity is a locked palette with no file on disk, and a card with
          an empty background-image is a black rectangle that reads as a
          failed image rather than as a deliberate card.
        */}
        {!card.poster && !art && (
          <div className="absolute inset-0 grid place-items-center px-5 pb-12">
            <p className="text-balance text-center text-h3 font-semibold leading-[1.1] tracking-tight text-bone/90">
              {card.brand}
            </p>
          </div>
        )}
        {/*
          The whole landscape film, centred, over a blurred copy of its own
          frame — so the room above and below it is the film's colour, not a
          black bar, and nothing of the picture is cropped away.
        */}
        {landscape && (
          <div
            aria-hidden
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl"
            style={{ backgroundImage: `url(${card.poster})` }}
          />
        )}
        {/*
          NO PLAYER WHERE THERE IS NO FILM. The two Brand & Design studies are
          pictures — a <video> with src="" paints a black rectangle over the
          artwork the background-image behind it just drew.
        */}
        {card.preview && (
        <video
          ref={videoRef}
          src={card.preview}
          poster={card.poster}
          muted
          loop
          playsInline
          /*
            NOTHING UNTIL IT IS ON SCREEN. "metadata" asked for every card's
            file on load — forty requests on this page before a scroll — and a
            four-second preview's metadata is most of the file. The poster is
            already painted; useInViewPlayback starts the load when the card
            comes into view.
          */
          preload="none"
          aria-hidden
          {...VIDEO_GUARD_CLIENT}
          className={cn(
            "absolute inset-0 size-full",
            landscape ? "object-contain" : "object-cover",
          )}
        />
        )}
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
    </>
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
      art={card.copy?.art}
      copy={card.copy}
      ratio={card.ratio}
      /*
        The card holds the study's PAGE href rather than the study itself, so
        the slug is read off the end of it — see campaignFilmsForSlug. A
        film-only card has no href and no study, and gets no strip.
      */
      clips={campaignFilmsForSlug(card.href?.split("/").pop())}
      pageHref={card.href}
    />
  );
}
