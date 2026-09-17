import type { Metadata } from "next";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import {
  caseStudiesPage,
  caseStudyList,
  disciplines,
  isPublished,
  leadClip,
  type CaseStudy,
} from "@/lib/case-studies";
import { filmUrl } from "@/lib/films";
import { isPending } from "@/lib/home-content";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { VIDEO_GUARD } from "@/lib/video-guard";
import { findWork, reelClip, reelPoster } from "@/lib/work";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Campaigns by Genesis Media for Aditya Birla, Mahindra Finance, House of Hiranandani and more — the film and the work behind it.",
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
 * NOTHING IS WRITTEN FOR THEM YET, and nothing is invented here. Problem,
 * strategy, execution and results appear the moment lib/case-studies has
 * them; until then a row carries what is true — the labels, the client, the
 * campaign and the division.
 */
export default function CaseStudiesPage() {
  return (
    <Atmosphere
      tone="brand"
      origin="top"
      intensity={0.2}
      className="relative isolate min-h-dvh overflow-hidden"
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

        <ol className="mt-16 flex flex-col gap-20 sm:gap-28">
          {caseStudyList.map((study, index) => (
            <StudyRow key={study.slug} study={study} index={index} />
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

function StudyRow({ study, index }: { study: CaseStudy; index: number }) {
  const clip = leadClip(study);
  const piece = study.work?.[0] ? findWork(study.work[0]) : undefined;
  const flipped = index % 2 === 1;
  const sections = [
    { label: "The problem", body: study.problem },
    { label: "The strategy", body: study.strategy },
    { label: "The execution", body: study.execution },
  ].filter((section) => !isPending(section.body));

  return (
    <li className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn("flex flex-col gap-5", flipped && "lg:order-2")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="micro-label !text-faint">
            {String(index + 1).padStart(2, "0")}
          </span>
          {disciplines(study).map((label) => (
            <span
              key={label}
              className="glass-chip rounded-full px-3 py-1 text-micro font-medium tracking-wide text-bone"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="micro-label text-brand-ink">{study.client}</p>
          <h2 className="text-balance text-h3 font-normal leading-[1.08] tracking-tight text-bone sm:text-h2">
            {isPublished(study) && study.headline && !isPending(study.headline)
              ? study.headline
              : (study.campaign ?? study.client)}
          </h2>
          {piece && (
            <p className="text-body leading-relaxed text-ash">
              {study.vertical} · {piece.title}
            </p>
          )}
        </div>

        {study.results && study.results.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-3">
            {study.results.map((metric) => (
              <li
                key={metric.label}
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-wash)] p-4"
              >
                <p className="text-h3 font-normal leading-none text-brand-ink">{metric.value}</p>
                <p className="mt-2 text-micro uppercase tracking-[0.12em] text-ash">
                  {metric.label}
                </p>
              </li>
            ))}
          </ul>
        )}

        {sections.map((section) => (
          <div key={section.label}>
            <p className="micro-label">{section.label}</p>
            <p className="mt-2 text-pretty text-body leading-relaxed text-ash">{section.body}</p>
          </div>
        ))}
      </Reveal>

      <Reveal
        delay={0.06}
        className={cn("flex justify-center", flipped ? "lg:order-1 lg:justify-start" : "lg:justify-end")}
      >
        {clip !== undefined && (
          <video
            poster={mediaUrl(reelPoster(clip))}
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
            className="h-[min(78vh,42rem)] w-auto max-w-full object-contain rounded-panel border border-[var(--glass-border)] bg-ink shadow-[0_24px_70px_-24px_rgb(0_0_0/0.8)]"
          >
            {filmUrl(clip) && <source src={filmUrl(clip)} type="video/mp4" />}
            <source src={mediaUrl(reelClip(clip))} type="video/mp4" />
          </video>
        )}
      </Reveal>
    </li>
  );
}
