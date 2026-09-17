"use client";

import { useState } from "react";

import { PosterRail, type Poster } from "@/components/genesis/poster-card";
import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { Reveal } from "@/components/genesis/reveal";
import { GlassButton } from "@/components/genesis/glass-button";
import { caseStudiesPage, caseStudyList, disciplines, leadClip } from "@/lib/case-studies";
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
      cover one client — Aditya Birla Capital has eighteen films behind
      several of these cards — and without it they would all open on the same
      video. `leadClip` makes that choice for the dialog as well.
    */
    const id = leadClip(study);
    const clip = id === undefined ? lead?.clip : mediaUrl(reelClip(id));
    const image =
      id === undefined ? (lead?.poster ?? lead?.art) : mediaUrl(reelPoster(id));

    return {
      id: study.slug,
      category: disciplines(study)[0],
      extraCategories: disciplines(study).slice(1),
      image,
      clip,
      /*
        THE COMPANY NAME AND NOTHING ELSE on the card ("itna saara content
        nahi chahiye"): the labels above, the reel, the client below. The
        headline and write-up are one click away, in the dialog.
      */
      title: study.client,
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
            <PosterRail
              posters={posters}
              onSelect={setOpenSlug}
              /*
                The container is 72rem wide with its own 1.5rem gutter inside
                it, so its text starts at (100vw - 72rem) / 2 + 1.5rem. The
                padding has to be that same figure or the first poster sits a
                gutter's width to the left of the heading it belongs under —
                measured, 144px against the heading's 168px. Below 72rem the
                whole expression falls under 1.5rem and the max holds the
                phone gutter.
              */
              className="px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
            />
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
