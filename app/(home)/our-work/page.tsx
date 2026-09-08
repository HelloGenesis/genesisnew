import type { Metadata } from "next";

import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { WorkBrowse } from "@/components/genesis/work-browse";
import { ourWork } from "@/lib/page-content";
import { work, workFilters } from "@/lib/work";

export const metadata: Metadata = {
  title: "Portfolio",
  description: ourWork.body,
};

/**
 * /our-work — the Portfolio: the complete library.
 *
 * WORK vs PORTFOLIO, which the brief is explicit about and the site was not:
 * Work is the selected section on the homepage, Portfolio is everything.
 * They now read the one catalogue in lib/work.ts, so a piece cannot appear in
 * one and be missing from the other, and every tile in both leads to the same
 * /work/<slug>.
 *
 * WHAT THIS REPLACED: a second, parallel implementation — its own grid, its
 * own list view, its own search, its own copy of the ten stills, and tiles
 * that opened nothing. It was the better-built of the two galleries and it
 * was the wrong shape: a library whose items have no URL cannot be shared,
 * indexed, or sent to a client, which is the whole reason this page exists.
 *
 * Search went with it. It filtered fourteen items behind a text box; the
 * filter row does that job at this size. It earns its place back when the
 * catalogue is long enough that scanning it is work.
 *
 * IT IS BROWSED NOW, NOT DUMPED. This was one masonry wall of everything,
 * five columns wide, under a row of chips — fourteen tiles in five shapes
 * with no order and nothing telling you what any of it was. Genesis asked for
 * it to work like Netflix, so it does: a billboard, then titled shelves you
 * push sideways, and the shelves collapse to a single grid the moment a
 * filter is picked. What the shelves ARE lives in lib/work.ts, because
 * Genesis's instruction is that they become the folders in the shared Drive.
 */
export default async function OurWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  /*
    `?filter=` OPENS THE PAGE ON A GENRE. The division sections link here for
    their own work — Influence's "View case studies" wants influencer
    campaigns, not the whole catalogue — and landing on everything and asking
    the reader to find the chip is not what that button promised.

    VALIDATED AGAINST THE REAL FILTER LIST rather than passed through. An
    unrecognised value would render a filter row with nothing selected and a
    grid with nothing in it, which looks like an empty portfolio rather than
    like a bad link. Anything unknown falls back to "All".
  */
  const { filter } = await searchParams;
  const known = workFilters(work);
  const initialFilter = filter && known.includes(filter) ? filter : "All";

  return (
    <main className="relative min-h-dvh pb-32 pt-32 sm:pt-40">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <SectionLabel dot tone="brand">
            {ourWork.label}
          </SectionLabel>
          <h1 className="mt-6 max-w-2xl text-balance text-h2 font-normal leading-[1.02] tracking-tight text-bone sm:text-h1">
            {ourWork.heading}{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              {ourWork.headingAccent}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-body leading-relaxed text-ash">
            {ourWork.body}
          </p>
        </Reveal>

      </div>

      {/*
        Outside the container on purpose. The shelves are full-bleed — a rail
        that stops at the 72rem edge leaves 144px of empty page beyond its
        fade on a large display, which is the cut Genesis has found on every
        rail on this site — so WorkBrowse manages its own width and re-applies
        the container to the parts that need it.
      */}
      <Reveal variant="scene" className="mt-14 sm:mt-16">
        <WorkBrowse items={work} initialFilter={initialFilter} />
      </Reveal>
    </main>
  );
}
