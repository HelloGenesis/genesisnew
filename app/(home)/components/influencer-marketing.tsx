import { Users } from "lucide-react";
import Link from "next/link";

import { LogoMarquee } from "@/components/genesis/logo-marquee";

import { CreatorConstellation } from "@/components/genesis/creator-constellation";
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

export function InfluencerMarketing() {
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
            "radial-gradient(46% 38% at 24% 16%, rgb(214 210 214 / 0.11) 0%, transparent 68%), radial-gradient(50% 44% at 8% 92%, rgb(255 197 22 / 0.16) 0%, transparent 70%), radial-gradient(60% 50% at 88% 40%, rgb(255 197 22 / 0.07) 0%, transparent 72%)",
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
          {/*
            THE PROMISE, UNDER THE MARK. The section had the lockup and then
            went straight into chips, a ring and a paragraph — so the one
            thing it never said was what the division is FOR. Genesis's line
            is the answer and it belongs directly under the name, in the same
            place every other division's claim sits.

            SMALLER THAN A SECTION HEADING. At text-h1 this pushed the
            constellation off a laptop screen, and the lockup above it is
            already carrying the section's announcement — this is the
            sentence under the sign, not a second sign.
          */}
          <h3 className="mt-5 max-w-2xl text-balance text-h3 font-normal leading-[1.06] tracking-tight text-bone sm:text-h2">
            {influencer.heading}{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              {influencer.headingAccent}
            </span>
          </h3>
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
        <div className="fit-window mt-6 grid items-center gap-6 md:grid-cols-[0.82fr_1.18fr] md:gap-6 lg:gap-8">
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
              THE NICHES MOVE NOW, on the same marquee as the client wall and
              the sector strip.

              WHAT THEY WERE. A wrapping row of chips: one swipeable line on a
              phone, and from `sm` up a block that wrapped. Eleven chips in a
              column this narrow wrapped to three ragged rows, which is a
              third of this section's left column spent on a list that is
              meant to be scanned rather than read.

              MOVING, IT IS ONE ROW AT EVERY WIDTH, and the chips pass a
              reader rather than the reader hunting them. It also stops the
              row's height depending on how many niches there are — a twelfth
              costs horizontal distance instead of another line.

              IT FADES AT BOTH ENDS, which is the other half of what Genesis
              asked for here, and it is LogoMarquee's own mask doing it. That
              matters more for chips than for the sector strip: a chip is a
              drawn object with a border, so one clipped at the boundary reads
              as a broken pill where a faded one reads as a row continuing.
            */}
            <Reveal delay={0.06} className="order-2 min-w-0 lg:order-none">
              <LogoMarquee
                /*
                  SLOWER THAN THE SECTOR STRIP'S 72s, because this rail is a
                  fraction of its width — a marquee's apparent speed is its
                  track length over its duration, so the same number here
                  would move the chips visibly faster. Hovering stops it, which
                  is what lets a brand actually look for their own category.
                */
                speedSeconds={90}
                gapClassName="gap-2"
                fadePercent={8}
                items={[
                  ...influencer.niches.map((niche) => (
                    <span
                      key={niche}
                      className="block whitespace-nowrap rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] px-3 py-1 text-micro font-medium uppercase tracking-[0.1em] text-ash"
                    >
                      {niche}
                    </span>
                  )),
                  /*
                    The board's own "+56 More". Ten named against sixty-six
                    covered is Genesis's figure from Genesis's artwork, and it
                    is the whole point of listing categories at all — a brand
                    whose own niche is not among the ten needs to be told the
                    list is a sample, not the extent of it.

                    It rides IN the loop rather than being pinned at the end,
                    because a loop has no end: pinned outside the marquee it
                    would sit still while the categories it qualifies travel
                    past it.
                  */
                  <span
                    key="more"
                    className="block whitespace-nowrap rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-micro font-medium uppercase tracking-[0.1em] text-brand-ink"
                  >
                    +{influencer.moreNiches} more
                  </span>,
                ]}
              />
            </Reveal>

            <Reveal delay={0.1} className="order-4 lg:order-none">
              <p className="max-w-lg text-pretty text-body leading-relaxed text-ash lg:mt-5">
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
            <Reveal delay={0.16} className="order-1 text-center lg:hidden">
              <p className="leading-none tracking-tight text-bone">
                <span className="text-[2.25rem] font-normal">
                  {influencer.databaseStat.value}
                </span>{" "}
                <span className="font-serif text-h3 italic text-brand-ink">
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
                    <span className="font-serif text-lead italic text-brand-ink">
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

          <Reveal delay={0.2} direction="left" variant="scene" className="order-3 lg:order-none">
            {/*
              The mockup labels these by niche and follower count, not by
              celebrity name — the named celebrity collaborations are a
              separate list and do not ride the orbits.

              CAPPED, BECAUSE IT SETS THE SECTION'S HEIGHT. The constellation
              is `aspect-[850/620] w-full`, so in a 708px column it stood 516px
              tall — taller than the entire left column beside it, which made
              it, not the copy, the thing deciding how far the section ran. A
              36rem cap puts it at 420px, under the copy's own height, so the
              grid is now as tall as its text and the orbits stop being the
              reason the CTA is below the fold.
            */}
            {/*
              BIGGER, AT GENESIS'S REQUEST. The cap was 36rem, set when this
              block was the tallest thing in the section and was deciding how
              far Influence ran. Two things have changed since: the niches are
              a single moving line rather than three wrapped rows, and the
              figures bar has left this section entirely for the case studies.
              Both came out of the column beside it, so the ring can take the
              height back without pushing the CTAs below the fold.

              44rem, not uncapped. The constellation is `aspect-[850/620]`, so
              every rem of width is three quarters of a rem of height — left
              to fill a 708px column it stood 516px tall and was once again
              the thing setting the section's height rather than the copy.
            */}
            <CreatorConstellation
              creators={influencer.creators.map((c) => ({ ...c }))}
              className="lg:max-w-[44rem]"
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
            size="lg"
            arrow
            className={MOBILE_CTA}
          >
            Plan an Influencer Campaign
          </GlassButton>
          <GlassButton
            href="#library"
            selectsFilter="Influence"
            variant="glass"
            size="lg"
            arrow
            className={MOBILE_CTA}
          >
            View Influence Work
          </GlassButton>
        </Reveal>
      </div>
    </section>
  );
}
