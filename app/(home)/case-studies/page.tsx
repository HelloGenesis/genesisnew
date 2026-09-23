import type { Metadata } from "next";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { CaseStudyGrid, type CaseStudyCard } from "@/components/genesis/case-study-grid";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { caseStudiesPage, caseStudyList } from "@/lib/case-studies";
import { labelsFor } from "@/lib/case-study-pages";
import {
  caseStudyCopy,
  videoOnlyStudies,
  type CaseStudyCopy,
} from "@/lib/case-study-copy";
import { clipRatio } from "@/lib/clip-shape";
import { filmUrl } from "@/lib/films";
import { mediaUrl } from "@/lib/media-url";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import {
  findWork,
  reelClip,
  reelPoster,
  work,
  workFilters,
  type ReelId,
  type WorkItem,
} from "@/lib/work";

export const metadata: Metadata = pageMetadata({
  title: "Case Studies: Influencer, Video & AI Work",
  description:
    "Case studies from Genesis Media: influencer campaigns, video production and AI content for Aditya Birla Health Insurance, Mahindra Finance, HDFC Bank and more.",
  path: "/case-studies",
});

/**
 * /case-studies — the whole set as a work index, after Schbang's /work.
 *
 * Filter chips over a grid of reel cards — client in bold, one line under
 * it — and each study opens over the page in the layout Genesis drew:
 * headline across the top, film on the left, copy on the right, arrows to
 * step through the rest. See CaseStudyGrid and CaseStudyView.
 *
 * THE COPY IS GENESIS'S, from their case-study master, matched to the
 * portfolio clip each study describes. Four pieces — FOY, Dove, L'Oréal and
 * HT Brunch — are films only, at Genesis's request. See lib/case-study-copy
 * for what was held back and why.
 */
export default function CaseStudiesPage() {
  const pieces = cards.map((card) => pieceForCard(card)).filter(
    (piece): piece is WorkItem => piece !== undefined,
  );

  return (
    <Atmosphere
      tone="brand"
      origin="top"
      intensity={0.2}
      className="relative isolate min-h-dvh overflow-hidden"
      style={{ background: "var(--page-ground-compact)" }}
    >
      <JsonLd data={breadcrumbJsonLd([{ name: "Case Studies", path: "/case-studies" }])} />
      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pt-36 pb-24">
        <Reveal>
          <SectionLabel dot tone="brand">
            {caseStudiesPage.label}
          </SectionLabel>
          {/*
            THE PORTFOLIO'S OWN TITLE, which Genesis wrote for this board —
            the same pair the homepage section carries, with the separator as
            its own muted span so it reads as a divider between two names.
          */}
          <h1 className="mt-6 whitespace-nowrap text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2 lg:text-h1">
            Portfolio{" "}
            <span aria-hidden className="text-faint">
              -
            </span>{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              Case Studies
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.05} className="mt-10">
          <CaseStudyGrid
            cards={cards}
            filters={workFilters(pieces)}
          />
        </Reveal>

        <Reveal className="mt-24 flex flex-wrap items-center gap-3">
          <GlassButton href="/#library" variant="glass" size="lg" arrow>
            See the portfolio
          </GlassButton>
          <GlassButton href="/#contact" variant="brand" size="lg" arrow magnetic>
            Contact us
          </GlassButton>
        </Reveal>

        {/* Genesis's note on the case-study copy, at the foot of the page. */}
        <p className="mt-12 text-micro text-faint">Generated using AI, might have errors.</p>
      </div>
    </Atmosphere>
  );
}

/** The portfolio piece a clip belongs to, whose facets the card borrows. */
function pieceFor(clip: ReelId | undefined): WorkItem | undefined {
  if (clip === undefined) return undefined;
  return work.find((item) => item.reel?.some((id) => String(id) === String(clip)));
}

/**
 * The piece behind a CARD, which is not always the piece behind a clip.
 *
 * A design study has no clip — an identity system is not a film — so the
 * chain clip → piece cannot start. It reaches its catalogue entry the other
 * way instead: the study card in lib/case-studies names the work slugs the
 * study covers, and the first of those is the piece whose division, format
 * and sectors the filter chips should answer to.
 */
function pieceForCard(card: { clip?: ReelId; copy?: CaseStudyCopy }): WorkItem | undefined {
  const byClip = pieceFor(card.clip);
  if (byClip) return byClip;

  const study = caseStudyList.find((entry) => entry.copy === card.copy?.n);
  return study?.work?.[0] ? findWork(study.work[0]) : undefined;
}

function facetsForCard(card: { clip?: ReelId; copy?: CaseStudyCopy }): string[] {
  const piece = pieceForCard(card);
  if (piece) return [piece.vertical, piece.format, ...(piece.tags ?? [])];

  /*
    NO CATALOGUE PIECE, WHICH IS NOT THE SAME AS NO DIVISION. `work` drops
    any entry with neither footage nor artwork on disk — Tripgate's identity
    is a locked palette rendered as live hex values, so it has no file and no
    catalogue entry — and without this the card answered to no chip at all
    and vanished from every filter including its own division's.

    The study knows its own division. That is the one facet it can state
    without a piece behind it, and it is the facet the filter row is made of.
  */
  return card.copy ? [card.copy.division] : [];
}

/*
  THE CARD'S MEDIA, AND ALL FOUR FIELDS ARE OPTIONAL TOGETHER. With no clip
  there is no poster, no preview and no film; the card falls back to the
  study's own artwork, and the grid renders it as a picture rather than as a
  player. `ratio` is 1 so an unphotographed study is a square tile rather
  than a reel-shaped hole.
*/
function media(clip: ReelId | undefined, art: string | undefined) {
  if (clip === undefined) {
    return { ratio: 1, poster: art ?? "", preview: undefined, film: undefined };
  }
  return {
    ratio: clipRatio(clip),
    poster: mediaUrl(reelPoster(clip)),
    preview: mediaUrl(reelClip(clip)),
    film: filmUrl(clip),
  };
}

/*
  ORDER: the homepage slider's first — Genesis chose that order — then every
  other study in the master document's own order, the film-only pieces in
  their place.
*/
const featured = caseStudyList
  .map((study) => study.copy)
  .filter((n, i, all): n is number => n !== undefined && all.indexOf(n) === i);

type Entry = CaseStudyCopy | (typeof videoOnlyStudies)[number];

const ordered: Entry[] = [
  ...featured
    .map((n) => caseStudyCopy.find((copy) => copy.n === n))
    .filter((copy): copy is CaseStudyCopy => copy !== undefined),
  ...[...caseStudyCopy.filter((copy) => !featured.includes(copy.n)), ...videoOnlyStudies].sort(
    (a, b) => a.n - b.n,
  ),
];

const cards: (CaseStudyCard & { clip?: ReelId })[] = ordered.map((entry) =>
  "headline" in entry
    ? {
        key: entry.slug,
        /* The study's own page — the card is a link to it. See CaseStudyGrid. */
        href: `/case-studies/${entry.slug}`,
        clip: entry.clip,
        brand: entry.brand,
        line: entry.headline,
        labels: labelsFor(entry),
        facets: facetsForCard(entry.clip !== undefined ? { clip: entry.clip } : { copy: entry }),
        copy: entry,
        ...media(entry.clip, entry.art),
      }
    : {
        key: `film-${entry.n}`,
        clip: entry.clip,
        brand: entry.brand,
        labels: [],
        facets: facetsForCard({ clip: entry.clip }),
        ...media(entry.clip, undefined),
      },
);
