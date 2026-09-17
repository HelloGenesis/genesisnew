"use client";

import type { ReactNode } from "react";

import type { CaseStudyCopy } from "@/lib/case-study-copy";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { CaseStudyBody } from "./case-study-body";

/**
 * A case study opened over the page, in the layout Genesis drew:
 *
 *   HEADLINE, BOLD, ACROSS THE TOP
 *   subheadline — brand · campaign
 *   ┌────────┐  copy
 *   │ video  │  copy
 *   │        │  copy
 *   └────────┘
 *
 * The film takes a narrow column at its own 9:16 shape and stays in view
 * while the copy beside it scrolls; on a phone the two stack, film first.
 * Used by both windows that open a study — the homepage slider's and
 * /case-studies' — so they cannot drift apart.
 */
export function CaseStudyView({
  labels,
  headline,
  subheadline,
  poster,
  film,
  preview,
  copy,
  fallback,
}: {
  labels: string[];
  headline?: string;
  subheadline: string;
  poster?: string;
  film?: string;
  preview?: string;
  copy?: CaseStudyCopy;
  /** Shown in the copy column when there is no write-up. */
  fallback?: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        {labels.length > 0 && <p className="micro-label !text-brand">{labels.join(" · ")}</p>}
        <h2 className="text-balance text-h3 font-semibold leading-[1.1] tracking-tight text-bone sm:text-h2">
          {headline ?? subheadline}
        </h2>
        {headline && <p className="text-lead leading-relaxed text-ash">{subheadline}</p>}
      </header>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
        {(film || preview) && (
          <div className="flex justify-center md:sticky md:top-0">
            <video
              key={film ?? preview}
              poster={poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              {...VIDEO_GUARD_CLIENT}
              /*
                Its own shape: a fixed height, the width from the file, capped
                by the column. 9:16 at 20rem wide is 35.5rem tall, which is
                also as tall as the window lets it be.
              */
              className="aspect-[9/16] h-[min(70vh,35.5rem)] w-auto max-w-full rounded-2xl border border-[var(--glass-border)] bg-ink object-contain"
            >
              {film && <source src={film} type="video/mp4" />}
              {preview && <source src={preview} type="video/mp4" />}
            </video>
          </div>
        )}

        <div className="min-w-0">
          {copy ? <CaseStudyBody copy={copy} /> : fallback}
        </div>
      </div>
    </article>
  );
}
