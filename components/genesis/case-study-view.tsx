"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

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
  clips,
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
  /**
   * The rest of this campaign's films, lead first.
   *
   * Genesis: a study should show all of the campaign's videos, so a reader
   * can see the work was a body of it rather than one cut. Which clips a
   * study may honestly claim is decided in lib/case-study-pages — see
   * `campaignClips`, and the note there on why it is not simply every reel
   * of the engagement.
   *
   * Absent or one long, the strip does not render: a row of thumbnails with
   * a single thumbnail in it is furniture.
   */
  clips?: { id: string; poster: string; film: string; ratio: number }[];
}) {
  /*
    WHICH FILM IS PLAYING. The strip swaps the main player rather than opening
    anything — a study is already a window, and a window inside a window to
    watch the second of five cuts is a door too many.
  */
  const [playing, setPlaying] = useState(0);

  /*
    RESET WHEN THE STUDY CHANGES, DURING RENDER RATHER THAN IN AN EFFECT.

    The windows keep this component mounted and page through studies by
    swapping props, so without a reset the third film of one campaign stays
    selected into the next — which has a different number of clips and would
    show the wrong film, or none.

    An effect is the obvious place and the wrong one: it renders once with
    stale state, then again to correct it, and the reader sees a frame of the
    previous campaign's selection. Comparing against the previous value during
    render and adjusting immediately is React's own documented answer for
    this — a setState on the SAME component while rendering is not a cascade,
    it restarts the render before anything is committed.

    Keyed on the lead film's id rather than on a study id, because that is
    what this component is given; two studies cannot share a lead (see
    campaignClips), so it identifies the campaign as well as a slug would.
  */
  const campaign = clips?.[0]?.id;
  const [seen, setSeen] = useState(campaign);
  if (campaign !== seen) {
    setSeen(campaign);
    setPlaying(0);
  }

  const current = clips?.[playing];
  const shownFilm = current?.film ?? film;
  const shownPoster = current?.poster ?? poster;
  const shownRatio = current?.ratio ?? ratio;
  const landscape = shownRatio > 1;

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
              key={shownFilm ?? preview}
              poster={shownPoster}
              controls
              autoPlay={autoPlay}
              playsInline
              preload="metadata"
              {...VIDEO_GUARD_CLIENT}
              style={{ aspectRatio: shownRatio }}
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
              {shownFilm && <source src={shownFilm} type="video/mp4" />}
              {preview && !current && <source src={preview} type="video/mp4" />}
            </video>
          </div>
        )}

        <div className="min-w-0">
          {/*
            THE REST OF THE CAMPAIGN, AND IT SITS WITH THE COPY RATHER THAN
            UNDER THE FILM.

            Under the player it would be squeezed into the same narrow column
            a portrait reel occupies — five thumbnails at about 55 points
            each, which is a row of stamps. Beside the copy it has the full
            measure, and it lands where a reader arrives after the brief
            rather than before it: read what the campaign was, then see how
            much of it there is.
          */}
          {clips && clips.length > 1 && (
            <div className="mb-8">
              <p className="micro-label !text-faint">
                {clips.length} films in this campaign
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {clips.map((clip, index) => (
                  <li key={clip.id}>
                    <button
                      type="button"
                      onClick={() => setPlaying(index)}
                      aria-pressed={index === playing}
                      aria-label={`Play film ${index + 1} of ${clips.length}`}
                      className={cn(
                        "relative block h-20 overflow-hidden rounded-lg border bg-ink transition-[border-color,opacity] duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                        index === playing
                          ? "border-brand opacity-100"
                          : "border-[var(--glass-border)] opacity-65 hover:opacity-100",
                      )}
                      /*
                        Each thumbnail keeps its own film's shape, so a
                        landscape cut in a portrait campaign is not squashed
                        into a reel-shaped box. Height is fixed and width
                        follows, which is what keeps the row on one baseline.
                      */
                      style={{ aspectRatio: clip.ratio }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={clip.poster}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
