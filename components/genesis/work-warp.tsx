"use client";

import { useMemo, useState } from "react";

import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { pagerFor } from "@/components/genesis/overlay";
import { Reveal } from "@/components/genesis/reveal";
import { VideoDialog, type OpenVideo } from "@/components/genesis/video-dialog";
import { WarpRail } from "@/components/genesis/warp-rail";
import { caseStudyList, leadClip, type CaseStudy } from "@/lib/case-studies";
import { caseStudyForClip, caseStudyPath, caseStudyPathForClip, uniqueStudies } from "@/lib/case-study-pages";
import { expandToClips, reelClip, reelPoster, work } from "@/lib/work";
import { cn } from "@/lib/utils";
import { findCopy } from "@/lib/case-study-copy";
import { ProofBar } from "@/components/genesis/proof-bar";
import { caseStudiesPage } from "@/lib/case-studies";

/**
 * SECTION 2 ON EVERY PAGE (Genesis, 4 Oct 2026: "all pages — all verticals and
 * the homepage — section 2 will have their relevant work and case studies, in
 * this exact same format"). The curved card rail the AI Lab section uses,
 * filled with the page's own work: the homepage's case studies, or one
 * division's films. A card with a written study opens it on that film; one
 * without plays the film in the video window. Nothing is claimed that the
 * catalogue does not hold.
 */
type Card = {
  id: string;
  clip: string;
  poster: string;
  label: string;
  href?: string;
  study?: CaseStudy;
  clipId: string;
  /** A logo or artwork, shown whole on white rather than cropped. */
  art?: boolean;
};


function divisionCards(divisions: readonly string[]): Card[] {
  const films = expandToClips(work.filter((item) => divisions.includes(item.vertical)))
    .filter((item) => item.reel?.length)
    .map((item) => {
      const clip = item.key?.slice(item.slug.length + 1) ?? "";
      return {
        id: item.key ?? item.slug,
        clip: reelClip(clip),
        poster: reelPoster(clip),
        label: item.client,
        href: caseStudyPathForClip(clip),
        study: caseStudyForClip(clip),
        clipId: clip,
      };
    });
  /*
    The films first, then the pieces with no film as stills (Brand & Design's
    logos), each opening its study where there is one (Genesis, 5 Oct 2026:
    the motion graphics join Brand & Design's rail).
  */
  const stills = work
    .filter((item) => divisions.includes(item.vertical) && !item.reel?.length && (item.art || item.poster))
    .map((item) => {
      const study = caseStudyList.find((entry) => entry.work?.includes(item.slug));
      return {
        id: item.slug,
        clip: "",
        poster: (item.art ?? item.poster) as string,
        label: item.client,
        href: study ? caseStudyPath(study.copy) : undefined,
        study,
        clipId: item.slug,
        art: Boolean(item.art),
      };
    });
  return [...films, ...stills];
}

function studyCards(): Card[] {
  return caseStudyList.flatMap((study) => {
    const clip = leadClip(study);
    if (clip === undefined) return [];
    return [
      {
        id: study.slug,
        clip: reelClip(clip),
        poster: reelPoster(clip),
        label: study.client,
        href: caseStudyPath(study.copy),
        study,
        clipId: String(clip),
      },
    ];
  });
}

export function WorkWarp({
  divisions,
  order,
  className,
}: {
  /** The divisions whose work this rail shows; leave out for every case study (the homepage). */
  divisions?: readonly string[];
  /** Card ids to lead with, in this order; the rest follow as they were. */
  order?: readonly string[];
  className?: string;
}) {
  const cards = useMemo(() => {
    const all = divisions ? divisionCards(divisions) : studyCards();
    if (!order?.length) return all;
    const lead = order.map((id) => all.find((card) => card.id === id)).filter((card): card is Card => Boolean(card));
    return [...lead, ...all.filter((card) => !order.includes(card.id))];
  }, [divisions, order]);
  const studies = useMemo(() => uniqueStudies(cards.map((card) => card.study)), [cards]);
  const videos: OpenVideo[] = useMemo(
    () => cards.filter((card) => !card.study && card.clip).map((card) => ({ id: card.clipId, label: card.label })),
    [cards],
  );
  const [study, setStudy] = useState<CaseStudy | null>(null);
  const [studyClip, setStudyClip] = useState<string | undefined>(undefined);
  const [video, setVideo] = useState<OpenVideo | null>(null);

  if (cards.length === 0) return null;

  return (
    <>
      <Reveal
        variant="scene"
        className={cn("relative left-1/2 w-screen -translate-x-1/2", className)}
      >
        {/* The AI Lab rail's sizes: a phone's, then wider and capped from sm. */}
        <div className="[--warp-card:78vw] [--warp-h:calc(78vw*1.6)] sm:[--warp-card:clamp(11rem,22vw,20rem)] sm:[--warp-h:calc(var(--warp-card)*1.6+1.75rem)]">
          <WarpRail
            items={cards.map((card) => ({
              id: card.id,
              clip: card.clip,
              art: card.art,
              poster: card.poster,
              label: card.label,
              href: card.href,
              campaign: (card.study?.copy !== undefined ? findCopy(card.study.copy)?.campaign : undefined) ?? card.study?.campaign,
              brand: card.study?.copy !== undefined ? findCopy(card.study.copy)?.brand : undefined,
              tags: card.study ? [card.study.discipline].flat() : undefined,
              stats: card.study?.copy !== undefined ? findCopy(card.study.copy)?.outcome ?? undefined : undefined,
              onOpen: card.study
                ? () => {
                    setStudy(card.study ?? null);
                    setStudyClip(card.clipId);
                  }
                : card.clip
                  ? () => setVideo({ id: card.clipId, label: card.label })
                  : undefined,
            }))}
          />
        </div>
      </Reveal>

      <CaseStudyDialog
        study={study}
        startClip={studyClip}
        onClose={() => setStudy(null)}
        pager={pagerFor(
          studies,
          studies.findIndex((entry) => entry.slug === study?.slug),
          (entry) => {
            setStudy(entry);
            setStudyClip(undefined);
          },
          (entry) => entry.client,
        )}
      />
      <VideoDialog
        video={video}
        onClose={() => setVideo(null)}
        pager={pagerFor(
          videos,
          videos.findIndex((entry) => String(entry.id) === String(video?.id)),
          (entry) => setVideo(entry),
          (entry) => entry.label,
        )}
      />
    </>
  );
}

/**
 * THE HEAD OVER SECTION 2 ON THE DIVISION PAGES (Genesis, 4 Oct 2026: "add
 * this everywhere here on all the verticals"): the homepage's "Work that moved
 * a needle." and its figures bar, over the curved rail of the division's work.
 */
export function WorkHead({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6 pb-8 pt-4 sm:pb-10", className)}>
      <Reveal>
        <h2 className="text-balance text-center text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
          {caseStudiesPage.heading}{" "}
          <span className="font-serif font-normal italic text-brand-ink">{caseStudiesPage.headingAccent}</span>
        </h2>
      </Reveal>
      <ProofBar className="mt-6 sm:mt-8" />
    </div>
  );
}
