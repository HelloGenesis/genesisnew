"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import type { CaseStudyCopy } from "@/lib/case-study-copy";
import { posterSrc } from "@/lib/poster";
import { cn } from "@/lib/utils";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { CaseStudyBody } from "./case-study-body";
import { PlanBar } from "@/app/(home)/components/plan-bar";
import { caseStudyPages, relatedStudies } from "@/lib/case-study-pages";
import { servicePageForVertical } from "@/lib/services";
import type { VerticalKey } from "@/lib/verticals/types";

/* Which division's plans a study's division sells; events are a Studios shoot, creatives are design work. */
const DIVISION_KEY: Record<string, VerticalKey> = {
  "AI Lab": "ai-labs",
  Studios: "studios",
  Influence: "influence",
  "Brand & Design": "brand-design",
  Events: "studios",
  Creatives: "brand-design",
};

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
  art,
  copy,
  fallback,
  ratio = 9 / 16,
  headingAs: Heading = "h2",
  autoPlay = true,
  pageHref,
  clips,
  startClip,
}: {
  /** The film's width over height; see lib/clip-shape. */
  ratio?: number;
  labels: string[];
  headline?: string;
  subheadline: string;
  poster?: string;
  film?: string;
  preview?: string;
  /**
   * A still shown where the player would be, for a study with no film.
   *
   * Genesis's two Brand & Design studies are a logo exploration and a brand
   * guideline — there is nothing to play, and a study that renders only text
   * where every other one leads with a picture looks like a broken one.
   */
  art?: string;
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
  /** Which of `clips` to open on, by id — the one the reader tapped. */
  startClip?: string;
}) {
  /*
    WHICH FILM IS PLAYING. The strip swaps the main player rather than opening
    anything — a study is already a window, and a window inside a window to
    watch the second of five cuts is a door too many.
  */
  const startAt = Math.max(0, clips?.findIndex((clip) => clip.id === startClip) ?? 0);
  const [playing, setPlaying] = useState(startAt);

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
  // The tapped clip is part of the key: paging from one clip of a campaign
  // to the next must move the player too, not only a change of campaign.
  const campaign = `${clips?.[0]?.id}|${startClip ?? ""}`;
  const [seen, setSeen] = useState(campaign);
  if (campaign !== seen) {
    setSeen(campaign);
    setPlaying(startAt);
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
          /*
            ONE COLUMN WHERE THERE IS NOTHING TO PUT IN THE FIRST ONE. A
            study with no film and no artwork — Tripgate's identity, whose
            palette lives as hex values rather than as a file — otherwise
            reserved a 20rem column for a player that never rendered and set
            its whole write-up in the narrow half of the window.
          */
          landscape || (!film && !preview && !art)
            ? "grid-cols-1"
            : "md:grid-cols-[minmax(0,20rem)_1fr]",
        )}
      >
        {/*
          ARTWORK INSTEAD OF A PLAYER. Same frame, same column, same sticky
          behaviour — only the element inside changes, so a design study sits
          in the layout the film studies already established rather than in a
          second one written for it.
        */}
        {!film && !preview && art && (
          <div className={cn("flex justify-center", !landscape && "md:sticky md:top-0")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- one still,
                whose intrinsic size is unknown here and which next/image would
                only re-encode; it is already a small PNG committed to /public. */}
            <img
              src={art}
              alt=""
              className="max-h-[min(62vh,34rem)] w-auto max-w-full rounded-2xl border border-[var(--glass-border)] bg-white object-contain p-6"
            />
          </div>
        )}

        {(film || preview) && (
          <div className={cn("flex justify-center", !landscape && "md:sticky md:top-0")}>
            <video
              key={shownFilm ?? preview}
              /*
                THE FILM ALONE. The preview used to follow it as a second
                <source>, so a film that failed to load played four seconds
                instead. It is the source only when there is no film (Drive
                switched off); otherwise it waits in data-preview for a film
                that fails twice. See recoverFilm.
              */
              src={shownFilm ?? preview}
              data-preview={shownFilm ? preview : undefined}
              // Optimised, not lazy: this is the page's main picture.
              poster={posterSrc(shownPoster, 828)}
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
            />
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
                        src={posterSrc(clip.poster)}
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
      {/*
        THE DIVISION'S PLANS UNDER EVERY CASE STUDY (Genesis, 6 Oct 2026),
        in the plan box's gradient frame, so a reader who likes the work can
        buy the same kind of work from here.
      */}
      {/*
        RELATED LINKS IN THE WINDOW (Genesis, 6 Oct 2026: "add relevant
        backlinks to the case studies for SEO and GEO"). The study's own page
        already links its division and its neighbours; the window did not, so
        a reader (or a crawler of the rendered page) met a dead end here. The
        anchors say what is behind them: the division's service in words a
        search would use, and each related study by its headline.
      */}
      {/* In every window; the study's own page (its h1) lists its related studies itself. */}
      {Heading !== "h1" && copy && <RelatedLinks copy={copy} />}
      {/* The way from the work to buying the same kind of work (Genesis, 6 Oct 2026). */}
      {copy?.division && (
        <div className="mt-12 text-center sm:mt-14">
          <p className="text-balance text-h3 font-normal leading-tight tracking-tight text-bone">
            Want results like these <span className="font-serif italic text-brand-ink">for your brand?</span>
          </p>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-body leading-relaxed text-ash">
            Pick a plan below and get started today: pay per project or subscribe, all prices up front.
          </p>
        </div>
      )}
      {copy?.division && (
        <PlanBar vertical={DIVISION_KEY[copy.division] ?? "studios"} onPage plansOnly className="!mt-6" />
      )}
    </article>
  );
}

function RelatedLinks({ copy }: { copy: CaseStudyCopy }) {
  const service = servicePageForVertical(copy.division);
  const page = caseStudyPages.find((entry) => entry.slug === copy.slug);
  const related = page ? relatedStudies(page, 3) : [];
  if (!service && related.length === 0) return null;
  return (
    <nav aria-label="Related" className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="micro-label">Related case studies</p>
        {service && (
          <Link href={`/${service.slug}`} className="text-small text-brand-ink underline-offset-4 hover:underline">
            {service.seo.title}
          </Link>
        )}
      </div>
      {/*
        SQUARE CARDS, NOT A LIST (Genesis, 6 Oct 2026: "add 1:1 cards for
        related case studies"): each study's picture, its brand and its
        headline, the headline still the link text for search.
      */}
      {related.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {related.map((study) => (
            <li key={study.slug}>
              <Link
                href={`/case-studies/${study.slug}`}
                className="group relative block aspect-square overflow-hidden rounded-card border border-white/12 bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {study.poster && (
                  // eslint-disable-next-line @next/next/no-img-element -- a poster already sized for the web; next/image adds nothing in a dialog.
                  <img src={study.poster} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-[linear-gradient(0deg,rgb(0_0_0/0.92),rgb(0_0_0/0.5)_60%,transparent)] p-3 pt-12">
                  <span className="max-w-full self-start truncate rounded-full border border-white/20 bg-black/35 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-white/85 backdrop-blur-md">
                    {study.copy.brand}
                  </span>
                  <span className="line-clamp-2 text-small leading-snug text-white">{study.copy.headline}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/case-studies" className="mt-4 inline-flex text-small text-ash underline-offset-4 hover:text-bone hover:underline">
        All Genesis Media case studies →
      </Link>
    </nav>
  );
}
