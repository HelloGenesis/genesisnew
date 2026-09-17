import type { Metadata } from "next";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { CaseStudyBody } from "@/components/genesis/case-study-body";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { caseStudiesPage, caseStudyList, disciplines } from "@/lib/case-studies";
import { caseStudyCopy, type CaseStudyCopy } from "@/lib/case-study-copy";
import { filmUrl } from "@/lib/films";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { VIDEO_GUARD } from "@/lib/video-guard";
import { reelClip, reelPoster } from "@/lib/work";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Forty campaigns by Genesis Media across influencer marketing, AI content and video production — for Aditya Birla, Mahindra Finance, Dove, L'Oréal, House of Hiranandani and more.",
};

/**
 * /case-studies — every study, one row each, film and write-up side by side.
 *
 * IT IS A PAGE AGAIN. The route was folded into the homepage slider and
 * redirected there; Genesis asked for "View all case studies" to open a page
 * of its own with the whole set on it, so the redirect for this path is gone
 * (the per-study URLs still redirect — there are no per-study pages).
 *
 * THE SIDES ALTERNATE, as asked: write-up left and film right, then the
 * other way round, so a long page reads as a rhythm rather than a column.
 * On a phone every row stacks write-up first.
 *
 * THE FILM KEEPS ITS OWN SHAPE. No aspect box: the video sizes itself from
 * the file, portrait or landscape, and is only capped in height so a 9:16
 * film does not stand taller than the window.
 *
 * THE COPY IS GENESIS'S, from their case-study master: all forty studies,
 * headline and write-up each, matched to the portfolio clip they describe.
 * See lib/case-study-copy for what was held back from it and why.
 */
export default function CaseStudiesPage() {
  return (
    <Atmosphere
      tone="brand"
      origin="top"
      intensity={0.2}
      /*
        overflow-CLIP, not hidden: hidden makes this box a scroll container,
        and a sticky film inside one sticks to the box, not the window.
      */
      className="relative isolate min-h-dvh overflow-clip"
      style={{ background: "var(--page-ground-compact)" }}
    >
      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pt-36 pb-24">
        <Reveal>
          <SectionLabel dot tone="brand">
            {caseStudiesPage.label}
          </SectionLabel>
          <h1 className="mt-6 text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
            {caseStudiesPage.heading}{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              {caseStudiesPage.headingAccent}
            </span>
          </h1>
        </Reveal>

        <ol className="mt-16 flex flex-col gap-24 sm:gap-32">
          {ordered.map((copy, index) => (
            <StudyRow key={copy.n} copy={copy} index={index} />
          ))}
        </ol>

        <Reveal className="mt-24 flex flex-wrap items-center gap-3">
          <GlassButton href="/#library" variant="glass" size="lg" arrow>
            See the portfolio
          </GlassButton>
          <GlassButton href="/#contact" variant="brand" size="lg" arrow magnetic>
            Contact us
          </GlassButton>
        </Reveal>
      </div>
    </Atmosphere>
  );
}

/*
  ORDER: the homepage slider's first — Genesis chose that order — then every
  other study in the master document's own order.
*/
const featured = caseStudyList
  .map((study) => study.copy)
  .filter((n): n is number => n !== undefined);
const ordered: CaseStudyCopy[] = [
  ...featured
    .filter((n, i) => featured.indexOf(n) === i)
    .map((n) => caseStudyCopy.find((copy) => copy.n === n))
    .filter((copy): copy is CaseStudyCopy => copy !== undefined),
  ...caseStudyCopy.filter((copy) => !featured.includes(copy.n)),
];

/** The slider's labels for a study where it has a card, else its division. */
function labelsFor(copy: CaseStudyCopy): string[] {
  const card = caseStudyList.find((study) => study.copy === copy.n);
  return card ? disciplines(card) : [copy.division];
}

function StudyRow({ copy, index }: { copy: CaseStudyCopy; index: number }) {
  const flipped = index % 2 === 1;

  return (
    <li id={copy.slug} className="grid scroll-mt-32 items-start gap-8 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn("flex flex-col gap-6", flipped && "lg:order-2")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="micro-label !text-faint">
            {String(index + 1).padStart(2, "0")}
          </span>
          {labelsFor(copy).map((label) => (
            <span
              key={label}
              className="glass-chip rounded-full px-3 py-1 text-micro font-medium tracking-wide text-bone"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="micro-label text-brand-ink">
            {copy.brand} · {copy.campaign}
          </p>
          <h2 className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
            {copy.headline}
          </h2>
        </div>

        <CaseStudyBody copy={copy} compact />
      </Reveal>

      {/*
        The film stays beside its write-up while the text scrolls past it,
        so a long study never leaves the reader looking at an empty column.
      */}
      <Reveal
        delay={0.06}
        className={cn(
          "flex justify-center lg:sticky lg:top-28",
          flipped ? "lg:order-1 lg:justify-start" : "lg:justify-end",
        )}
      >
        <video
          poster={mediaUrl(reelPoster(copy.clip))}
          controls
          playsInline
          preload="none"
          {...VIDEO_GUARD}
          /*
            Its own aspect ratio: no box, no crop. A fixed HEIGHT and an
            auto width, so the width comes from the file's own shape. Auto
            on both let the frame size itself from the 720px poster and
            then jump when the 1080p film loaded; a set height cannot jump.
          */
          className="h-[min(78vh,42rem)] w-auto max-w-full rounded-panel border border-[var(--glass-border)] bg-ink object-contain shadow-[0_24px_70px_-24px_rgb(0_0_0/0.8)]"
        >
          {filmUrl(copy.clip) && <source src={filmUrl(copy.clip)} type="video/mp4" />}
          <source src={mediaUrl(reelClip(copy.clip))} type="video/mp4" />
        </video>
      </Reveal>
    </li>
  );
}
