"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useRef } from "react";

import { GlassButton } from "@/components/genesis/glass-button";
import { RailProgress } from "@/components/genesis/rail-progress";
import { useAutoAdvance } from "@/components/genesis/use-auto-advance";
import { caseStudyList, leadClip, type CaseStudy } from "@/lib/case-studies";
import { caseStudyPages, caseStudyPath } from "@/lib/case-study-pages";
import { mediaUrl } from "@/lib/media-url";
import { findWork, reelPoster } from "@/lib/work";
import { cn } from "@/lib/utils";
import { findCopy } from "@/lib/case-study-copy";
import { clipRatio } from "@/lib/clip-shape";
import type { ReelId } from "@/lib/work";

/*
  A PORTRAIT CUT FOR A PORTRAIT CARD (Genesis, 6 Oct 2026: "the Activ Yuva
  study has very good content but the homepage shows cropped cards"). A 16:9
  film's still in a tall card is a slice out of its middle; where the study
  has a 9:16 cut, that is the card's picture instead.
*/
/** A study's page with the film to open it on, which the window reads (CaseStudyPopups). */
function withClip(path: string | undefined, clip: ReelId | undefined): string | undefined {
  return path && clip !== undefined ? `${path}?clip=${encodeURIComponent(String(clip))}` : path;
}

function portraitOf(clips: readonly (ReelId | undefined)[]): ReelId | undefined {
  return clips.find((clip): clip is ReelId => clip !== undefined && clipRatio(clip) < 1);
}

/**
 * A DIVISION'S CASE STUDIES, FOUR AT A TIME, for the right-hand column of its
 * plan box on the homepage (Genesis, 4 Oct 2026: "right will have an image
 * slider — a case study slider with 4 cards, 4:5, and a View case study
 * button"). A 2×2 page of portrait cards, each opening its study; the arrows
 * turn the page, the dots say which page is up.
 */
const PER_PAGE = 4;
/* A new page every few seconds (Genesis, 4 Oct 2026), held while the reader is on it. */
/* Below this many studies, a division's slider is topped up with the studies' other films. */
const MIN_CARDS = 8;

type Card = { slug: string; client: string; brand?: string; tag?: string; campaign?: string; image?: string; href?: string; stats?: { value: string; label: string }[] };

function cardFor(study: CaseStudy): Card {
  const copy = study.copy !== undefined ? findCopy(study.copy) : undefined;
  const clip = portraitOf([leadClip(study), ...(copy?.films ?? [])]) ?? leadClip(study);
  const piece = study.work?.[0] ? findWork(study.work[0]) : undefined;
  return {
    slug: study.slug,
    client: study.client,
    campaign: (study.copy !== undefined ? findCopy(study.copy)?.campaign : undefined) ?? study.campaign,
    brand: study.copy !== undefined ? findCopy(study.copy)?.brand : undefined,
    tag: [study.discipline].flat()[0],
    image: clip !== undefined ? mediaUrl(reelPoster(clip)) : (piece?.poster ?? piece?.art),
    /* The card's own film opens in the study's window (see CaseStudyPopups). */
    href: withClip(caseStudyPath(study.copy), clip),
    stats: study.copy !== undefined ? findCopy(study.copy)?.outcome ?? undefined : undefined,
  };
}

export function PlanCaseStudies({
  vertical,
  className,
  style,
  perPage = PER_PAGE,
  cardClassName,
}: {
  vertical: string;
  className?: string;
  /** Cards a page: 4 in a 2×2 (the plan boxes), 3 in a row (the AI Lab strip). */
  perPage?: number;
  /** Extra classes on each card, to change its shape where it is used. */
  cardClassName?: string;
  style?: React.CSSProperties;
}) {
  const cards = useMemo(
    /*
      EVERY STUDY OF THIS DIVISION (Genesis, 6 Oct 2026: "all the case studies
      of that particular vertical, for each"). Not only the ones with a card
      on the homepage — every written study page in the division, the carded
      ones first (they have the curated picture), the rest after, looping.
    */
    () => {
      const pages = caseStudyPages.filter((page) => page.copy.division === vertical);
      const carded = pages.flatMap((page) => {
        const study = caseStudyList.find((entry) => entry.copy === page.copy.n);
        return study ? [cardFor(study)] : [];
      });
      const rest = pages
        .filter((page) => !caseStudyList.some((entry) => entry.copy === page.copy.n))
        .map(
          (page): Card => ({
            slug: page.slug,
            client: page.copy.brand,
            brand: page.copy.brand,
            tag: page.labels[0],
            campaign: page.copy.campaign,
            image: (() => {
              const portrait = portraitOf([page.copy.clip, ...(page.copy.films ?? [])]);
              return portrait !== undefined ? mediaUrl(reelPoster(portrait)) : page.poster || undefined;
            })(),
            href: withClip(page.path, portraitOf([page.copy.clip, ...(page.copy.films ?? [])])),
            stats: page.copy.outcome,
          }),
        );
      const studies = [...carded, ...rest].filter((card) => card.image);
      /*
        A SHORT LIST TOPPED UP WITH THE STUDIES' OTHER FILMS (Genesis, 6 Oct
        2026: "if there are fewer case studies, add video cards of the
        existing case studies"): each further cut of a study's campaign as a
        card of its own, opening that same study.
      */
      if (studies.length >= MIN_CARDS) return studies;
      const shown = new Set(studies.map((card) => card.image));
      const extra = pages.flatMap((page) =>
        /* Portrait cuts only, so none of these is a cropped widescreen still. */
        (page.copy.films ?? []).filter((clip) => clipRatio(clip) < 1).map(
          (clip): Card => ({
            slug: `${page.slug}~${clip}`,
            client: page.copy.brand,
            brand: page.copy.brand,
            tag: page.labels[0],
            campaign: page.copy.campaign,
            image: mediaUrl(reelPoster(clip)),
            href: withClip(page.path, clip),
            stats: page.copy.outcome,
          }),
        ),
      ).filter((card) => !shown.has(card.image));
      return [...studies, ...extra];
    },
    [vertical],
  );
  /*
    A ROW THAT SCROLLS, NOT PAGES THAT SWAP (Genesis, 6 Oct 2026: "this should
    slide on phone and desktop when you scroll with fingers or touch, and add
    our gradient slider"). A snap row a finger, a trackpad or a mouse wheel
    moves; the arrows step it a card at a time and wrap at the ends; it moves
    on its own between (useAutoAdvance) and the gradient bar under it shows
    where you are.
  */
  const rail = useRef<HTMLUListElement>(null);
  useAutoAdvance(rail);
  const step = (direction: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    if (direction > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (direction < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  };
  const scrolls = cards.length > perPage;
  const width =
    cards.length === 1 ? "w-full" : perPage === 3 ? "w-[calc((100%-1.5rem)/3)]" : "w-[calc((100%-0.75rem)/2)]";

  return (
    <div className={cn("flex h-full flex-col", className)} style={style}>
      <div className="flex items-center justify-between gap-3">
        <p className="micro-label !text-brand-ink">Case studies</p>
        <div className="flex items-center gap-2">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              aria-label={direction < 0 ? "Previous case studies" : "More case studies"}
              disabled={!scrolls}
              onClick={() => step(direction)}
              className="grid size-8 place-items-center rounded-full border border-white/20 text-bone transition-colors hover:border-white/40 hover:bg-white/5 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {direction < 0 ? <ArrowLeft className="size-3.5" aria-hidden /> : <ArrowRight className="size-3.5" aria-hidden />}
            </button>
          ))}
        </div>
      </div>

      <ul
        ref={rail}
        data-lenis-prevent-horizontal
        className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain lg:min-h-0 lg:flex-1"
      >
        {cards.map((card) => {
          const inner = (
            <>
              <Image
                src={card.image!}
                alt=""
                fill
                sizes="(min-width: 1024px) 12rem, 45vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/*
                THE CASE STUDIES PAGE'S CARD, CUT DOWN for a small tile (Genesis,
                5 Oct 2026): one tag, the brand pill, the campaign and one figure.
              */}
              {card.tag && (
                <span className="glass pointer-events-none absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[0.625rem] font-medium tracking-wide text-bone">{card.tag}</span>
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-[linear-gradient(0deg,rgb(0_0_0/0.92),rgb(0_0_0/0.55)_60%,transparent)] px-2 pb-2 pt-10">
                <span className="max-w-full self-start truncate rounded-full border border-white/20 bg-black/35 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.06em] text-white/85 backdrop-blur-md">{card.brand ?? card.client}</span>
                {card.campaign && <span className="truncate px-0.5 text-[0.6875rem] leading-tight text-brand-ink/90">{card.campaign}</span>}
                {card.stats?.[0] && (
                  <span className="flex items-baseline justify-center gap-1.5 truncate rounded-lg border border-white/15 bg-white/[0.08] px-2 py-1 backdrop-blur-md">
                    <span className="font-display text-[0.9375rem] leading-none text-brand-ink">{card.stats[0].value}</span>
                    <span className="truncate text-[0.625rem] uppercase tracking-[0.04em] text-white/75">{card.stats[0].label}</span>
                  </span>
                )}
              </span>
            </>
          );
          const box = cn(
            "group relative block aspect-[9/16] w-full overflow-hidden sm:aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[11rem] rounded-card border border-white/12 bg-ink transition-[border-color] duration-300 hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            cardClassName,
          );
          return (
            <li key={card.slug} className={cn("flex shrink-0 snap-start", width)}>
              {card.href ? (
                <Link href={card.href} prefetch={false} className={box} aria-label={`${card.client}: ${card.campaign ?? "case study"}`}>
                  {inner}
                </Link>
              ) : (
                <div className={box}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      {scrolls && <RailProgress rail={rail} className="mt-3" />}

      <div className="mt-4 flex items-center justify-between gap-3">
        <GlassButton href="/case-studies" variant="glass" size="sm" arrow>
          View all case studies
        </GlassButton>
      </div>
    </div>
  );
}
