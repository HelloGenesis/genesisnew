"use client";

import { useState } from "react";

import { PosterCard, type Poster } from "@/components/genesis/poster-card";
import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { Reveal } from "@/components/genesis/reveal";
import { GlassButton } from "@/components/genesis/glass-button";
import { caseStudiesPage, caseStudyList, isPublished } from "@/lib/case-studies";
import { findWork, reelClip, reelPoster } from "@/lib/work";
import { mediaUrl } from "@/lib/media-url";
import { SectionShell } from "./section-shell";

/**
 * Section 4 — Case studies.
 *
 * THE ARCHETYPE WAS WRONG, not the styling. Spec page 13 is Case Studies, and
 * both design images on it (p13_1 = img-025, p13_2 = img-026) are movie-poster
 * stages: tall 2:3 posters on a dark ground inside a brand bloom, the centre
 * card enlarged, the flankers dimmed and cropped by the frame. This section
 * was rendering a 2x2 grid of rounded glass rectangles — identical in
 * silhouette to the services grid, the process cards and the footer stat bar,
 * and the single most generic layout on the web. It never imported PosterCard,
 * which already exists in this repo and is built for exactly this.
 *
 * WHAT IS REAL HERE. The four clients and their disciplines come from the spec
 * and are confirmed. The headline and the result figure for each are not
 * written yet, so the poster leads with the CLIENT — the part that is true —
 * and the story takes over the moment it is written. Nothing is invented.
 */
export function CaseStudies() {
  /*
    WHICH STUDY IS OPEN, by slug. Genesis asked for the posters to be
    interactive — click one and the study appears over a blurred page — so the
    rail hands its id up here and the dialog reads the catalogue for the rest.
    Holding the slug rather than the object keeps this a single string of
    state that cannot drift from the source list.
  */
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  /*
    Reads the case-study catalogue rather than its own copy of the list. The
    homepage rail and /case-studies were describing the same four clients from
    two places, which is how a site ends up with a study that exists in one
    and not the other.
  */
  const posters: Poster[] = caseStudyList.map((study) => {
    const published = isPublished(study);

    /*
      THE CAMPAIGN'S OWN FOOTAGE, which these cards were missing entirely.
      Each study already names the catalogue pieces it covers in `work` — the
      /case-studies index has used that to find a hero all along, and this rail
      did not, so four posters sat here with a play control painted on them and
      nothing behind it.

      Two of the four have footage today. Aditya Birla Sun Life and HDFC are
      real relationships with no clip in either Drive folder, so they keep the
      typographic card rather than borrowing another client's video — Sun Life
      is a different company from Aditya Birla Capital, and using one's reel
      under the other's name would be a claim about both.
    */
    const lead = study.work?.[0] ? findWork(study.work[0]) : undefined;

    /*
      `heroClip` wins over the catalogue piece's own lead. Two studies can
      cover one client — Aditya Birla Capital has eighteen films behind two of
      these cards — and without it both would open on the same video.
    */
    const clip =
      study.heroClip === undefined
        ? lead?.clip
        : mediaUrl(reelClip(study.heroClip));
    const image =
      study.heroClip === undefined
        ? (lead?.poster ?? lead?.art)
        : mediaUrl(reelPoster(study.heroClip));

    return {
      id: study.slug,
      category: study.discipline,
      image,
      clip,
      // With no written study the client IS the title; with one, it steps
      // back up to the eyebrow above it.
      client: published ? study.client : undefined,
      title: published ? (study.headline ?? study.client) : study.client,
      meta: published && study.results?.[0] ? [study.results[0].value] : undefined,
    };
  });

  return (
    <SectionShell
      id="case-studies"
      label={caseStudiesPage.label}
      heading={caseStudiesPage.heading}
      headingAccent={caseStudiesPage.headingAccent}
      /*
        NO STANDFIRST. Genesis asked for the paragraph to come off this
        section — "Not a gallery — the problem, what we decided to do about
        it, and what changed…" was a promise made beside four posters that
        cannot keep it yet, and `align="split"` existed only to give that
        paragraph a column of its own. With it gone the heading takes the
        full width and the rail sits directly under it. The copy is still in
        lib/case-studies for the /case-studies page, which is where it is
        true.
      */
      align="left"
      tone="brand"
      origin="top-right"
      intensity={0.2}
    >
      <Reveal variant="scene">
        {/*
          The stage. img-025 sits its rail inside a broad brand bloom rather
          than on flat black — that glow is what makes the posters read as lit
          objects on a stage instead of tiles on a page.
        */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-8"
            style={{
              background:
                "radial-gradient(closest-side, rgb(255 197 22 / 0.3) 0%, rgb(255 197 22 / 0.12) 42%, transparent 76%)",
            }}
          />
          {/*
            FULL-BLEED, WHICH IS THE ACTUAL FIX FOR THE CUT.

            The rail used to end where the 72rem container ends. On a 1440
            screen that put its right edge at 1296px with 144px of empty page
            beyond it — so the last poster was not running off the screen, it
            was being guillotined in the middle of the page with daylight to
            its right. No amount of fading rescues that: a card dissolving at
            the edge of the window reads as "there is more this way", and the
            same card dissolving 144px short of the window reads as a
            rendering fault, which is exactly what Genesis kept pointing at.

            The rail now spans the viewport and pads itself back to the
            container's gutter, so the first poster still lines up under the
            heading while the last one runs off the actual edge of the screen.
            It also means the rail is 1440 wide instead of 1152 against 1296 of
            posters — above about 1300px nothing overflows at all any more, so
            there is no cut to fade and useEdgeFade correctly draws none.
            Below that it scrolls, and the fade lands on the window edge where
            it belongs. The wrapper is clipped by Atmosphere's own
            overflow-hidden, so 100vw cannot widen the page.
          */}
          <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
            <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-5 overflow-x-auto px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pb-6 pt-2">
              {posters.map((poster, index) => (
                <PostFrame
                  key={poster.id}
                  poster={poster}
                  index={index}
                  onSelect={setOpenSlug}
                />
              ))}
            </div>
          </div>
        </div>
      </Reveal>
      {/*
        The section is a trailer; the page is the thing. Without this the rail
        was a dead end — four posters and no way to read any of them.
      */}
      <Reveal delay={0.1} className="mt-10">
        <GlassButton href="/#library" variant="glass" arrow>
          See the work
        </GlassButton>
      </Reveal>

      <CaseStudyDialog
        study={caseStudyList.find((s) => s.slug === openSlug) ?? null}
        onClose={() => setOpenSlug(null)}
      />
    </SectionShell>
  );
}

/*
  THE DEVICE: A SOCIAL POST.

  Brand & Design is a set of folders; this is the feed. Genesis's work lives
  in people's phones, so each case study is framed the way it was actually
  seen — the brand at the top with a story ring, the film in the middle, and
  the reactions underneath. The ring and the heart carry the lockup's ramp.

  No invented numbers. The caption shows a study's real result where one is
  written and its discipline where one is not.
*/
function PostFrame({
  poster,
  index,
  onSelect,
}: {
  poster: Poster;
  index: number;
  onSelect: (id: string) => void;
}) {
  const name = poster.client ?? poster.title;
  const gradientId = `post-heart-${index}`;

  return (
    <article className="gm-rim w-[clamp(15rem,24vw,19.5rem)] shrink-0 snap-center rounded-[1.4rem] p-2.5 shadow-[0_26px_60px_-28px_rgb(208_106_138/0.55)] transition-transform duration-500 hover:-translate-y-2">
      <header className="flex items-center gap-2.5 px-1 pb-2.5">
        <span className="gm-story-ring shrink-0">
          <span className="grid size-8 place-items-center rounded-full bg-[var(--surface-base)] text-[0.8rem] font-semibold text-bone">
            {name.charAt(0)}
          </span>
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-small font-medium text-bone">{name}</span>
          <span className="block truncate text-[0.6875rem] text-faint">
            with <span className="gm-ramp-text">genesis.media</span>
          </span>
        </span>
        <span aria-hidden className="flex gap-[3px] px-1">
          {[0, 1, 2].map((d) => (
            <span key={d} className="size-[3px] rounded-full bg-[var(--ink-muted)]" />
          ))}
        </span>
      </header>

      {/* PosterCard wraps itself in a <button>, which shrinks to fit its
          content unless told to fill — and the card inside is w-full. */}
      <div className="[&>button]:w-full">
        <PosterCard
          poster={poster}
          onSelect={onSelect}
          className="w-full rounded-[1rem] border-0 hover:shadow-none"
        />
      </div>

      <div aria-hidden className="flex items-center gap-3.5 px-1 pt-3 text-bone">
        <svg viewBox="0 0 24 24" className="size-[1.35rem]">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffc516" />
              <stop offset="45%" stopColor="#e8663a" />
              <stop offset="100%" stopColor="#a48be0" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#${gradientId})`}
            d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 4.3 2.4.7-1.2 2.1-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z"
          />
        </svg>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5Z" />
        </svg>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M22 3 2 10.5l7.5 3L12 21l3.5-7.5L22 3Z" />
        </svg>
        <svg viewBox="0 0 24 24" className="ml-auto size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
        </svg>
      </div>

      <p className="px-1 pb-1 pt-2 text-[0.75rem] leading-snug text-ash">
        <span className="font-semibold text-bone">genesis.media</span>{" "}
        {poster.meta?.[0] ?? poster.category}{" "}
        <span className="gm-ramp-text">#{name.replace(/[^A-Za-z0-9]+/g, "")}</span>
      </p>
    </article>
  );
}
