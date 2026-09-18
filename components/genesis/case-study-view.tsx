"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { CaseStudyCopy } from "@/lib/case-study-copy";
import { cn } from "@/lib/utils";
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
 * /case-studies' — and by the study's own page at /case-studies/<slug>, so
 * the three cannot drift apart.
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
  ratio = 9 / 16,
  headingAs: Heading = "h2",
  autoPlay = true,
  pageHref,
}: {
  /** The film's width over height; see lib/clip-shape. */
  ratio?: number;
  labels: string[];
  headline?: string;
  subheadline: string;
  poster?: string;
  film?: string;
  preview?: string;
  copy?: CaseStudyCopy;
  /** Shown in the copy column when there is no write-up. */
  fallback?: ReactNode;
  /** h1 on the study's own page, where the headline is the page's title. */
  headingAs?: "h1" | "h2";
  /**
   * The windows start the film because a click opened them; the page does
   * not, because nobody asked, and an unmuted autoplay is blocked anyway.
   */
  autoPlay?: boolean;
  /**
   * The study's own page. Given in the windows, so a study a reader wants to
   * send someone has a URL to send.
   */
  pageHref?: string;
}) {
  const landscape = ratio > 1;

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        {labels.length > 0 && <p className="micro-label !text-brand">{labels.join(" · ")}</p>}
        <Heading className="text-balance text-h3 font-semibold leading-[1.1] tracking-tight text-bone sm:text-h2">
          {headline ?? subheadline}
        </Heading>
        {headline && <p className="text-lead leading-relaxed text-ash">{subheadline}</p>}
      </header>

      {/*
        A PORTRAIT FILM takes the narrow left column Genesis drew; a
        LANDSCAPE one would be a strip in it, so it spans the window above
        the copy instead. Either way the frame is the film's own shape.
      */}
      <div
        className={cn(
          "grid items-start gap-8 lg:gap-12",
          landscape ? "grid-cols-1" : "md:grid-cols-[minmax(0,20rem)_1fr]",
        )}
      >
        {(film || preview) && (
          <div className={cn("flex justify-center", !landscape && "md:sticky md:top-0")}>
            <video
              key={film ?? preview}
              poster={poster}
              controls
              autoPlay={autoPlay}
              playsInline
              preload="metadata"
              {...VIDEO_GUARD_CLIENT}
              style={{ aspectRatio: ratio }}
              /*
                A fixed height and the width from the ratio, capped by the
                column — so a portrait film is a reel and a landscape one is
                a screen, and neither is cropped.
              */
              className={cn(
                "w-auto max-w-full rounded-2xl border border-[var(--glass-border)] bg-ink object-contain",
                landscape ? "h-[min(62vh,34rem)]" : "h-[min(70vh,35.5rem)]",
              )}
            >
              {film && <source src={film} type="video/mp4" />}
              {preview && <source src={preview} type="video/mp4" />}
            </video>
          </div>
        )}

        <div className="min-w-0">
          {copy ? <CaseStudyBody copy={copy} /> : fallback}
          {pageHref && (
            <Link
              href={pageHref}
              className="mt-8 inline-flex text-small text-brand-ink underline-offset-4 transition-colors hover:text-bone hover:underline"
            >
              Open as a page →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
