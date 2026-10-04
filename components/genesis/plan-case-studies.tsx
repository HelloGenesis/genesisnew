"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { GlassButton } from "@/components/genesis/glass-button";
import { caseStudyList, leadClip, type CaseStudy } from "@/lib/case-studies";
import { caseStudyPath } from "@/lib/case-study-pages";
import { mediaUrl } from "@/lib/media-url";
import { findWork, reelPoster } from "@/lib/work";
import { cn } from "@/lib/utils";
import { findCopy } from "@/lib/case-study-copy";

/**
 * A DIVISION'S CASE STUDIES, FOUR AT A TIME, for the right-hand column of its
 * plan box on the homepage (Genesis, 4 Oct 2026: "right will have an image
 * slider — a case study slider with 4 cards, 4:5, and a View case study
 * button"). A 2×2 page of portrait cards, each opening its study; the arrows
 * turn the page, the dots say which page is up.
 */
const PER_PAGE = 4;

type Card = { slug: string; client: string; campaign?: string; image?: string; href?: string; stats?: { value: string; label: string }[] };

function cardFor(study: CaseStudy): Card {
  const clip = leadClip(study);
  const piece = study.work?.[0] ? findWork(study.work[0]) : undefined;
  return {
    slug: study.slug,
    client: study.client,
    campaign: study.campaign,
    image: clip !== undefined ? mediaUrl(reelPoster(clip)) : (piece?.poster ?? piece?.art),
    href: caseStudyPath(study.copy),
    stats: study.copy !== undefined ? findCopy(study.copy)?.outcome ?? undefined : undefined,
  };
}

export function PlanCaseStudies({ vertical, className }: { vertical: string; className?: string }) {
  const cards = useMemo(
    () => caseStudyList.filter((study) => study.vertical === vertical).map(cardFor).filter((card) => card.image),
    [vertical],
  );
  const pages = Math.max(1, Math.ceil(cards.length / PER_PAGE));
  const [page, setPage] = useState(0);
  const shown = cards.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="micro-label !text-brand-ink">Case studies</p>
        {/* The arrows always show (Genesis, 4 Oct 2026); with one page they rest disabled. */}
        {(
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous case studies"
              disabled={pages < 2}
              onClick={() => setPage((at) => (at - 1 + pages) % pages)}
              className="grid size-8 place-items-center rounded-full border border-white/20 text-bone transition-colors hover:border-white/40 hover:bg-white/5 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="More case studies"
              disabled={pages < 2}
              onClick={() => setPage((at) => (at + 1) % pages)}
              className="grid size-8 place-items-center rounded-full border border-white/20 text-bone transition-colors hover:border-white/40 hover:bg-white/5 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <ul key={page} className="mt-3 grid animate-[fade-in_400ms_ease-out] grid-cols-2 gap-3">
        {shown.map((card) => {
          const inner = (
            <>
              <Image
                src={card.image!}
                alt=""
                fill
                sizes="(min-width: 1024px) 12rem, 45vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgb(0_0_0/0.85),transparent)] px-3 pb-3 pt-10">
                {/* Just the headline figure and the client (Genesis, 4 Oct 2026: "don't add so much text here"). */}
                {card.stats?.[0] && (
                  <span className="mb-1 block truncate text-[1rem] font-light leading-none text-brand-ink">
                    {card.stats[0].value} <span className="text-[0.6875rem] text-white/70">{card.stats[0].label}</span>
                  </span>
                )}
                <span className="block truncate text-small leading-snug text-white">{card.client}</span>
              </span>
            </>
          );
          const box =
            "group relative block aspect-[4/5] overflow-hidden rounded-card border border-white/12 bg-ink transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
          return (
            <li key={card.slug}>
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

      <div className="mt-4 flex items-center justify-between gap-3">
        <GlassButton href="/case-studies" variant="glass" size="sm" arrow>
          View all case studies
        </GlassButton>
        {pages > 1 && (
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: pages }, (_, index) => (
              <span
                key={index}
                className={cn("h-1.5 rounded-full transition-[width,background-color] duration-300", index === page ? "w-5 bg-brand" : "w-1.5 bg-white/30")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
