"use client";

import { useState, useSyncExternalStore } from "react";

import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { WorkWarp } from "@/components/genesis/work-warp";
import { pagerFor } from "@/components/genesis/overlay";
import { ProofBar } from "@/components/genesis/proof-bar";
import { Reveal } from "@/components/genesis/reveal";
import { GlassButton } from "@/components/genesis/glass-button";
import { caseStudiesPage, caseStudyList } from "@/lib/case-studies";
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
/*
  A PHONE OPENS ON VIKRANT AND RASHMI (Genesis, 4 Oct 2026: "first add
  Vikrant and Rashmi's on phone, then the launch film"): the two portrait
  films lead, the landscape launch film third, the rest as they were.
*/
const PHONE_FIRST = [
  "aditya-birla-capital-vikrant-massey",
  "aditya-birla-capital-content-campaign",
  "aditya-birla-capital-brand-performance",
];
const PHONE_QUERY = "(max-width: 639px)";
const subscribePhone = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function CaseStudies() {
  /*
    WHICH STUDY IS OPEN, by slug. Genesis asked for the posters to be
    interactive — click one and the study appears over a blurred page — so the
    rail hands its id up here and the dialog reads the catalogue for the rest.
    Holding the slug rather than the object keeps this a single string of
    state that cannot drift from the source list.
  */
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const phone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);

  return (
    <SectionShell
      id="case-studies"
      /* No eyebrow label: Genesis took "Case studies" off — the heading says it. */
      heading={caseStudiesPage.heading}
      headingAccent={caseStudiesPage.headingAccent}
      /*
        ON A PHONE (Genesis, 4 Oct 2026): the figures above the heading, the
        heading on one line, bigger posters, and the two buttons under them.
      */
      before={<ProofBar className="mb-6 sm:hidden" />}
      headingClassName="max-sm:whitespace-nowrap max-sm:text-[min(1.75rem,6.6vw)] sm:text-h2 lg:text-h2"
      /*
        NO STANDFIRST. THE FIGURES ARE THE STANDFIRST.

        "Selected campaigns, content and creative work built to deliver real
        business outcomes" stood here, and Genesis asked for the box in its
        place. That is the better line by some distance, because it is not a
        line: a heading that says "work that moved a number" followed by a
        sentence promising outcomes is the same claim twice in prose, where
        the same heading followed by 50+, 45+, 500M+ and 20+ is the claim and
        then the evidence for it.

        It also puts the figures where they are read as the SECTION's, not the
        rail's. Under the posters they summarised the four cards above them;
        under the heading they are the scale of everything the section is
        about to show.
      */
      /* Centred, at Genesis's request, over the figures and the rail. */
      align="center"
      tone="brand"
      origin="top-right"
      intensity={0.2}
    >
      {/*
        THE FIGURES, IN THE SLOT THE STANDFIRST HELD.

        This bar has been three places in three passes — the foot of
        Influence, then under this section's posters, now under its heading —
        and each move was Genesis narrowing in on the same thing: the numbers
        belong to the company, not to whichever block they happen to sit
        beside. Here they read as the scale of the work, with the posters
        underneath as the examples.

        It also removes an attribution problem the first placement had: two of
        these four are the COMPANY's figures rather than the creator
        division's (see lib/proof), so at the foot of Influence half of them
        claimed something narrower than they mean.
      */}
      <ProofBar className="max-sm:hidden" />

      {/* No buttons under the figures on a desktop (Genesis, 4 Oct 2026); a phone has them under the posters. */}

      {/*
        THE WHOLE SECTION ON ONE PHONE SCREEN (Genesis, 4 Oct 2026): the
        heading, the figures, the buttons and a poster, so the posters stand
        at about a third of the screen's height there.
      */}
      {/*
        THE CASE STUDIES IN THE CURVED RAIL EVERY PAGE'S SECTION 2 SHARES
        (Genesis, 4 Oct 2026: "all pages … section 2 will have their relevant
        work and case studies, in this exact same format"). Each card opens
        its study on its film. A phone leads with Vikrant and Rashmi.
      */}
      <div id="case-study-posters" className="mt-[var(--block-gap)] scroll-mt-28 max-sm:mt-6">
        <WorkWarp order={phone ? PHONE_FIRST : undefined} />
      </div>
      {/*
        The section is a trailer; the page is the thing. Without this the rail
        was a dead end — four posters and no way to read any of them.
      */}

      {/* The two buttons, under the posters on a phone. */}
      <Reveal delay={0.1} className="mt-6 grid grid-cols-2 gap-2 sm:hidden [&_a]:h-11 [&_a]:w-full [&_a]:justify-center [&_a]:px-3 [&_a]:text-[0.8125rem]">
        <GlassButton href="#book-a-call" variant="brand" arrow>
          Book a call
        </GlassButton>
        <GlassButton href="#case-study-posters" variant="glass" arrow>
          Case studies
        </GlassButton>
      </Reveal>

      <CaseStudyDialog
        study={caseStudyList.find((s) => s.slug === openSlug) ?? null}
        onClose={() => setOpenSlug(null)}
        pager={pagerFor(
          caseStudyList,
          caseStudyList.findIndex((s) => s.slug === openSlug),
          (s) => setOpenSlug(s.slug),
          (s) => s.client,
        )}
      />
    </SectionShell>
  );
}
