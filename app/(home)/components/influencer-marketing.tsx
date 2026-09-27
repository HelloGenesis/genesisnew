"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import Link from "next/link";

import { LogoMarquee } from "@/components/genesis/logo-marquee";
import { softRadial } from "@/lib/soft-gradient";

import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { pagerFor } from "@/components/genesis/overlay";
import { ReelPair } from "@/components/genesis/reel-pair";
import { VideoDialog, type OpenVideo } from "@/components/genesis/video-dialog";
import type { CaseStudy } from "@/lib/case-studies";
import {
  caseStudyForClip,
  caseStudyPathForClip,
  uniqueStudies,
} from "@/lib/case-study-pages";
import { expandToClips, reelClip, reelPoster, work } from "@/lib/work";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { influencer, services } from "@/lib/home-content";

/*
  ON A PHONE THE TWO CALLS TO ACTION SHARE ONE LINE, smaller ("buttons on same
  line - reduce size"). `max-sm:` leaves every larger screen as it was, and the
  arrow goes first because it is the one part of a button that says nothing
  its label does not.
*/
const MOBILE_CTA =
  "max-sm:h-10 max-sm:gap-1.5 max-sm:px-3 max-sm:text-[0.78125rem] max-sm:[&>svg:last-child]:hidden";

/**
 * Influencer marketing — built to the Genesis mockup on page 7.
 *
 * This section does NOT use SectionShell, and the difference is deliberate.
 * The mockup sets its own rules and they are the opposite of the site's
 * default heading pattern:
 *
 *   - the headline is LIGHT weight, not semibold, and very large
 *   - the second word recedes into grey rather than taking the serif accent
 *   - the eyebrow sits BELOW the headline, not above it
 *   - the figures live inside one bar that also holds the CTA
 *
 * Copying those choices matters more than internal consistency here: it is
 * Genesis's own artwork for this exact section.
 */

/**
 * THE INFLUENCE WORK THE REEL BLOCKS PLAY.
 *
 * Every clip the catalogue files under the Influence vertical, one block
 * each. `expandToClips` is what turns a handful of engagements into the
 * couple of dozen reels the arrows walk through — Aditya Birla alone is
 * fifteen cuts, and a pair at a time is a long enough run that the arrows are
 * worth pressing.
 *
 * A BLOCK IS A LINK ONLY WHERE THERE IS A STUDY BEHIND IT. Most of this work
 * has one; the rest plays as footage rather than as a target, and becomes
 * clickable the day a study is written with no change here.
 *
 * Computed at module scope: it is derived from static data and would
 * otherwise be rebuilt on every render of a component that re-renders
 * whenever the dialog opens or the arrows are pressed.
 */
const CLIP_REELS = expandToClips(
  work.filter((item) => item.vertical === "Influence"),
)
  .filter((item) => item.reel?.length)
  .map((item) => {
    const clip = item.key?.slice(item.slug.length + 1) ?? "";
    return {
      id: item.key ?? item.slug,
      clip: reelClip(clip),
      poster: reelPoster(clip),
      label: item.client,
      href: caseStudyPathForClip(clip),
      study: caseStudyForClip(clip),
      /* The clip itself: where a study opens, and what a reel with no
         study plays. See the note at the ReelPair. */
      clipId: clip,
    };
  });

/**
 * The reels, ROUND-ROBINED BY STUDY rather than left in catalogue order.
 *
 * In catalogue order the first six blocks — three whole pages of the pair —
 * are Mahindra Finance, because the entry carries five consecutive cuts of
 * one campaign. Genesis pressed the arrows, clicked, and got the same study
 * every time: "koi bhi video click karu mahindra finance ka hi case study
 * khulta hai". The attribution behind it was also wrong and is fixed in
 * caseStudyForClip; this is the other half, and it is a display problem.
 *
 * One pass per round takes the next unseen reel from each study in turn, so
 * a page of two is two different campaigns and pressing the arrow moves to
 * two more. Nothing is dropped — a study with more cuts than the others
 * simply keeps supplying them once the shorter runs are exhausted, so the
 * tail of the list is the deep campaigns and the head is the variety.
 *
 * Reels with no study group under their client, which keeps L'Oreal's two
 * apart in the same way.
 */
const INFLUENCE_REELS = (() => {
  const runs = new Map<string, typeof CLIP_REELS>();
  for (const reel of CLIP_REELS) {
    const group = reel.study?.slug ?? `client:${reel.label}`;
    runs.set(group, [...(runs.get(group) ?? []), reel]);
  }

  const queues = [...runs.values()];
  const out: typeof CLIP_REELS = [];
  for (let round = 0; out.length < CLIP_REELS.length; round += 1) {
    for (const queue of queues) {
      if (queue[round]) out.push(queue[round]);
    }
  }
  return out;
})();

/** The distinct studies the reels cover, for the window's pager. */
const INFLUENCE_STUDIES = uniqueStudies(INFLUENCE_REELS.map((reel) => reel.study));

/* The reels with no study, in reel order — the video window's arrows walk these. */
const INFLUENCE_VIDEOS: OpenVideo[] = INFLUENCE_REELS.filter((reel) => !reel.study).map(
  (reel) => ({ id: reel.clipId, label: reel.label }),
);

export function InfluencerMarketing() {
  /*
    WHICH STUDY IS OPEN OVER THE PAGE. The same window the case-study posters,
    the Studios stage cards and the AI rail open — Genesis's rule is that a
    study opens where the reader already is.
  */
  const [study, setStudy] = useState<CaseStudy | null>(null);
  /* Which clip the study opens on — the reel that was clicked. */
  const [studyClip, setStudyClip] = useState<string | undefined>(undefined);
  /* And which clip, for a reel with no study behind it: the video alone. */
  const [video, setVideo] = useState<OpenVideo | null>(null);

  return (
    <section
      id="influence"
      className="relative isolate overflow-hidden py-12 sm:py-14 lg:py-16"
    >
      {/*
        Soft key light behind the headline, warm spill low-left, as in the
        mockup — and `.seamless`, because the low-left source sits at 92% of
        the section's height with a 44% radius, so unmasked it was still at
        full strength when the section's own overflow cut it. That slice was
        the hard line under this block.
      */}
      <div
        aria-hidden
        className="seamless pointer-events-none absolute inset-0"
        style={{
          background:
            /*
              Three washes that each faded linearly to a hard last stop, which
              is three visible circles over one section. Same geometry, soft
              falloff — see lib/soft-gradient.
            */
            [
              softRadial("46% 38% at 24% 16%", "214 210 214", 0.11),
              softRadial("50% 44% at 8% 92%", "255 197 22", 0.16),
              softRadial("60% 50% at 88% 40%", "255 197 22", 0.07),
            ].join(", "),
        }}
      />

      <div className="relative z-[2] mx-auto w-full max-w-7xl px-6">
        {/*
          THE MARK ABOVE THE GRID, CENTRED — the arrangement every division
          uses now. It used to sit in the left column, stacked over the
          niches and the copy, which made the section's title one item in a
          list rather than the thing the section is called. Pulling it out
          leaves the two columns to do what they are for: the reading on one
          side, the constellation on the other.
        */}
        <Reveal className="flex flex-col items-center text-center">
          <DivisionLockup
            name="Influence"
            tagline={services.items[0].caption}
            ramp={services.items[0].ramp}
          />
        </Reveal>

        {/*
          THE CATEGORIES SIT UNDER THE MARK, CENTRED, AND ACROSS THE WHOLE
          SECTION — "categories jo hai unko just below the logo in the centre".

          THEY WERE IN THE LEFT COLUMN, above the copy, which gave a rail of
          ten moving chips about 40% of the width to move in: the loop came
          round every few seconds and a reader scanning for their own category
          had to catch it. Full width it is a slow band under the division's
          name, which is also where a reader looks for "what kind of creators"
          before they read anything else.

          The heading and the copy that used to sit here have moved down into
          the column, left-aligned. See the note there.
        */}
        <Reveal delay={0.06} className="mt-6">
          <LogoMarquee
            /*
              SLOWER AGAIN, NOW THAT THE RAIL IS THE FULL WIDTH. A marquee's
              apparent speed is its track length over its duration — the same
              90s that read as a gentle drift in a 40% column is nearly three
              times the distance here. 150s keeps it at the pace it had.
            */
            speedSeconds={150}
            gapClassName="gap-2"
            fadePercent={10}
            /*
              NO "+56 MORE" CHIP ANY MORE. Ten categories plus a count of the
              rest was a stand-in for the list; Genesis has now given the
              list, so the rail carries all of it. A chip saying there are
              more, sitting beside all of them, would be counting itself.
            */
            items={influencer.niches.map((niche) => (
              <span
                key={niche}
                className="block whitespace-nowrap rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] px-3 py-1 text-micro font-medium uppercase tracking-[0.1em] text-ash"
              >
                {niche}
              </span>
            ))}
          />
        </Reveal>

        {/*
          A DIFFERENT ORDER ON A PHONE, from Genesis's mobile notes: the
          1,00,000+ card first ("1 lakh + influencer above the scroll wala"),
          then the niches, then the constellation ("ye upar hona chahiye phone
          me"), then the copy ("copy below this section, only mobile").

          `contents` on the left column below `lg` dissolves it, so its three
          blocks and the constellation become siblings in this grid and
          `order` can interleave them. At `lg` the column is a real box again,
          every order resets, and desktop is exactly what it was.
        */}
        {/*
          TWO COLUMNS FROM md, NOT lg. Stacked, a tablet put the copy, the
          ring and the stats one under another and Influence stood 1223
          points on a 1024 screen. There is room for the split at 768 — the
          ring caps its own height — and side by side the section comes in
          under one screen.
        */}
        {/*
          `grid-cols-[minmax(0,1fr)]` BELOW md, and it is a layout fix. With no
          columns declared the single implicit track sized itself to its
          widest child's min-content — the reel slider's 26rem — so on a 360px
          phone the whole column was 416px and the figure, the heading and the
          reels all ran off the right edge. A minmax(0,…) track cannot grow
          past the container.
        */}
        <div className="fit-window mt-6 grid grid-cols-[minmax(0,1fr)] items-center gap-6 md:grid-cols-[0.82fr_1.18fr] md:gap-6 lg:gap-8">
          {/*
            min-w-0 is load-bearing. A grid item defaults to `min-width: auto`,
            which refuses to shrink below its content's longest unbreakable
            run — so at 375px the 44px headline held "Influencer marketing," on
            one line, expanded its column to 393px, and was silently clipped by
            the section's overflow:hidden at 417px against a 375px viewport.
            With min-w-0 the column can shrink and the line wraps instead.
          */}
          <div className="contents lg:block lg:min-w-0">
            {/*
              THE DIVISION'S OWN LOCKUP, replacing a bespoke headline set at
              up to 80px across three lines. Two things were wrong with it:
              this section announced itself differently from every other
              vertical, and the headline alone was most of the reason the
              section ran to 1.29 screens.
            */}
            {/*
              THE NICHES, BELOW THE HEADLINE, per the mockup's eyebrow slot —
              but set as chips rather than as one letterspaced line.

              Eight categories joined by middots run to about a hundred
              characters, and micro-label is uppercase and tracked out, so in a
              490px column that wrapped into three ragged lines that read as a
              sentence someone had failed to finish. As chips they wrap into a
              block, each one is its own object, and a brand scanning for their
              own category finds it in one pass — which is the whole reason
              Genesis wanted the niches here instead of three adjectives.

              A list, semantically, because that is what it is.
            */}
            {/*
              THE PROMISE, LEFT-ALIGNED AND IN THE COLUMN — "the right voices
              wale text ko left me karo".

              IT WAS CENTRED UNDER THE LOCKUP. That put three centred blocks
              in a row above a two-column grid, and the heading was the one
              that suffered: a centred line over a left-aligned paragraph
              reads as a caption that has come loose from its text. Down here
              it opens the column it belongs to, the copy runs directly under
              it on the same left edge, and the section's order is the one
              Genesis asked for — mark, categories, promise, copy.

              ON A PHONE THE PROMISE AND COPY COME BEFORE THE REELS — "ye copy
              ko upar karo phone me above the cards". Stacked, the reels are a
              full screen tall, and the words that say what they are arrived
              only after them. So below md it reads figure, promise, copy,
              reels; the tablet grid keeps its figure-and-reels top row.
            */}
            {/*
              CENTRED ON A PHONE — "centre align on phone". Stacked in one
              column under a centred figure, a left-set heading and paragraph
              read as a second block that had slid to the edge. From md the
              copy has its own column beside the reels and sets left again.
            */}
            <Reveal delay={0.08} className="order-2 min-w-0 text-center md:order-3 md:text-left lg:order-none">
              <h3 className="mx-auto max-w-xl text-balance text-h3 font-normal leading-[1.06] tracking-tight text-bone sm:text-h2 md:mx-0">
                {influencer.heading}{" "}
                <span className="font-serif font-normal italic text-brand-ink">
                  {influencer.headingAccent}
                </span>
              </h3>
            </Reveal>

            <Reveal delay={0.1} className="order-3 text-center md:order-4 md:text-left lg:order-none">
              <p className="mx-auto max-w-lg text-pretty text-body leading-relaxed text-ash md:mx-0 lg:mt-5">
                {influencer.body}
              </p>
            </Reveal>

            {/* The database card: red-tinted glass, icon well, circular arrow. */}
            {/*
              ON A PHONE, JUST THE NUMBER ("box hatado, sirf text rakho").
              The glass card below is desktop's: an icon, a description and an
              arrow in a panel. On a phone Genesis wants the figure on its
              own, where it reads as the headline it is rather than a widget.
            */}
            <Reveal delay={0.16} className="order-1 min-w-0 text-center lg:hidden">
              {/* min-w-0 and balance: on a narrow phone the figure and its
                  label wrap onto two even lines instead of running off the
                  right edge of the screen. */}
              <p className="text-balance leading-tight tracking-tight text-bone">
                <span className="text-[2.25rem] font-normal">
                  {influencer.databaseStat.value}
                </span>{" "}
                {/*
                  THE SAME FACE AS THE FIGURE BESIDE IT — "keep the font
                  consistent". This was serif italic, which is the site's
                  HEADING accent: right for one word inside a headline, wrong
                  here, where it sits directly against a sans figure at the
                  same size and reads as two fonts colliding rather than as
                  one line with a highlight. The colour does the work on its
                  own, as it does in the positioning line on the Brain.

                  The heading above this block keeps its serif italic, because
                  that one IS a headline.
                */}
                <span className="text-h3 text-brand-ink">
                  {influencer.databaseStat.label}
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.16} className="hidden lg:order-none lg:block">
              <div
                className="glass glass-lit flex items-center gap-5 rounded-panel p-5 lg:mt-6"
                style={{
                  background:
                    "linear-gradient(102deg, rgb(255 197 22 / 0.17) 0%, rgb(255 197 22 / 0.05) 42%, rgb(255 255 255 / 0.03) 100%)",
                }}
              >
                <div className="grid size-14 shrink-0 place-items-center rounded-card border border-brand/35 bg-brand/10 text-brand-ink">
                  <Users className="size-6" aria-hidden />
                </div>

                <div className="min-w-0 flex-1">
                  {/*
                    THE FIGURE AND WHAT IT COUNTS, ON ONE LINE.

                    It was the number alone. Genesis's note is "1,00,000+
                    influencer network" — and the reason it needs saying is
                    that a bare "1,00,000+" is a quantity with no noun, so a
                    reader had to reach the second line before they knew what
                    had been counted. The label is set in the same serif
                    italic the mobile version already used for it, which is
                    what keeps the two treatments one design.
                  */}
                  <p className="leading-none tracking-tight text-bone">
                    <span className="text-h3 font-medium">
                      {influencer.databaseStat.value}
                    </span>{" "}
                    <span className="text-lead text-brand-ink">
                      {influencer.databaseStat.label}
                    </span>
                  </p>
                  <p className="mt-2 text-small leading-relaxed text-ash">
                    {influencer.databaseStat.description}
                  </p>
                </div>

                <Link
                  /* Stays on the landing page: only the two forms change page. */
                  href="/#library"
                  aria-label="See influencer campaigns"
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 text-bone transition-colors hover:border-brand hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span aria-hidden className="text-h3 leading-none">→</span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/*
            TWO REELS AND ARROWS, NOT ELEVEN FACES.

            This was the creator constellation — portraits drifting on two
            orbits round a wireframe globe. It was built to Genesis's own
            mockup and it answered a question nobody asks: a brand weighing up
            an influencer agency wants to know what the WORK looks like, not
            who the creators are. Genesis asked for reels instead, "content
            dekhne ke liye", and kept the arrows.

            The creator roster is not lost — it is still the source of the
            constellation's data in lib/home-content, and the eleven names and
            their Instagram links are one component away if this block ever
            wants a face in it again.
          */}
          <Reveal delay={0.2} direction="left" variant="scene" className="order-4 md:order-2 lg:order-none">
            {/*
              EVERY REEL OPENS SOMETHING. Fourteen of these twenty-eight clips
              have a written study, and open it on the reel that was clicked.
              The rest — The WorldGrad, FOY, L'Oreal, HT Brunch and nine of the
              Aditya Birla cuts — have none, and play on their own in the video
              window: "jiska nahi hai uski sirf video play ho". Same rule as
              the AI Lab rail and the portfolio.
            */}
            <ReelPair
              reels={INFLUENCE_REELS.map((reel) => ({
                ...reel,
                onOpen: reel.study
                  ? () => {
                      setStudy(reel.study ?? null);
                      setStudyClip(reel.clipId);
                    }
                  : () => setVideo({ id: reel.clipId, label: reel.label }),
              }))}
              className="mx-auto max-w-[26rem] lg:max-w-[30rem]"
            />
          </Reveal>
        </div>

        {/*
          THE FIGURES BAR IS NOT HERE ANY MORE — it is a band of its own,
          above this section. See components/genesis/proof-bar.

          WHY IT LEFT. Genesis asked for it above Influence, and the move
          fixed something the placement had been hiding: two of those four
          figures are the COMPANY's, not this division's. 50+ campaigns and
          30+ brands come from the journey board and 50M+ reach and 20+
          platforms from the Influence mockup (see lib/proof), so printed at
          the foot of this section half of them were claiming to be about
          creator work specifically. Between the case studies and this
          section they read as what they are.
        */}

        {/*
          TWO ACTIONS, both specific, and BELOW the figures rather than inside
          them. "Contact Us" was the only one here, which is the least useful
          thing a section about influencer campaigns can say — it asks the
          reader to translate their own intent into a generic enquiry. Sitting
          them in the stats panel packed four numbers and two buttons into one
          row; they get their own line.
        */}
        {/*
          THE TWO BUTTONS GENESIS SPECIFIED, in their words and to their
          destinations.

          "Explore Genesis Influence" is gone. It went to /influencer-campaigns
          — the division's own page — which is a third thing to click in a
          section that is meant to offer a choice between starting a campaign
          and seeing the work. Genesis asked for the second button to be "View
          Case Studies", landing on the library "filtering exclusively for
          influencer campaigns", which is what the query string does. The
          division page is still reachable from the card above.
        */}
        <Reveal delay={0.15} className="mt-5 flex flex-nowrap gap-2 sm:flex-wrap sm:gap-3">
          <GlassButton
            href="/#contact"
            quickContact="influence:plan-a-campaign"
            variant="brand"
            arrow
            className={MOBILE_CTA}
          >
            Plan an Influencer Campaign
          </GlassButton>
          <GlassButton
            href="#library"
            selectsFilter="Influence"
            variant="glass"
            arrow
            className={MOBILE_CTA}
          >
            View Influence Work
          </GlassButton>
        </Reveal>
      </div>

      {/*
        THE STUDY, OVER THE PAGE. The pager walks the reels in their own
        order, so "next" from a piece is the piece beside it in the run rather
        than whatever is next in the case-study ordering.
      */}
      <CaseStudyDialog
        study={study}
        startClip={studyClip}
        onClose={() => setStudy(null)}
        /*
          DEDUPED, OR THE ARROWS DO NOTHING. Several reels of one engagement
          resolve to the same study, so the raw list had twenty entries
          covering far fewer studies — "next" stepped to the following index,
          which was usually the same study, and the window replaced its
          content with identical content. See `uniqueStudies`.
        */
        pager={pagerFor(
          INFLUENCE_STUDIES,
          INFLUENCE_STUDIES.findIndex((entry) => entry.slug === study?.slug),
          (entry) => {
            setStudy(entry);
            setStudyClip(undefined);
          },
          (entry) => entry.client,
        )}
      />

      {/* The video alone, for the reels with no study. */}
      <VideoDialog
        video={video}
        onClose={() => setVideo(null)}
        pager={pagerFor(
          INFLUENCE_VIDEOS,
          INFLUENCE_VIDEOS.findIndex((entry) => String(entry.id) === String(video?.id)),
          (entry) => setVideo(entry),
          (entry) => entry.label,
        )}
      />
    </section>
  );
}
