import { BarChart3, Globe, Sparkles, Target, Users } from "lucide-react";
import Link from "next/link";

import { CreatorConstellation } from "@/components/genesis/creator-constellation";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { influencer, isPending, services } from "@/lib/home-content";

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

const STAT_ICONS = [Target, BarChart3, Sparkles, Globe];

export function InfluencerMarketing() {
  // An unconfirmed figure is omitted, never printed as a placeholder.
  const stats = influencer.stats.filter((stat) => !isPending(stat.value));

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
        </Reveal>

        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          {/*
            min-w-0 is load-bearing. A grid item defaults to `min-width: auto`,
            which refuses to shrink below its content's longest unbreakable
            run — so at 375px the 44px headline held "Influencer marketing," on
            one line, expanded its column to 393px, and was silently clipped by
            the section's overflow:hidden at 417px against a 375px viewport.
            With min-w-0 the column can shrink and the line wraps instead.
          */}
          <div className="min-w-0">
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
            <Reveal delay={0.06}>
              <ul className="flex flex-wrap gap-x-2 gap-y-2">
                {influencer.niches.map((niche) => (
                  <li
                    key={niche}
                    className="rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] px-3 py-1 text-micro font-medium uppercase tracking-[0.1em] text-ash"
                  >
                    {niche}
                  </li>
                ))}
                {/*
                  The board's own "+56 More". Ten named against sixty-six
                  covered is Genesis's figure from Genesis's artwork, and it
                  is the whole point of listing categories at all — a brand
                  whose own niche is not among the ten needs to be told the
                  list is a sample, not the extent of it.
                */}
                <li className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-micro font-medium uppercase tracking-[0.1em] text-brand-ink">
                  +{influencer.moreNiches} more
                </li>
              </ul>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-5 max-w-lg text-pretty text-body leading-relaxed text-ash">
                {influencer.body}
              </p>
            </Reveal>

            {/* The database card: red-tinted glass, icon well, circular arrow. */}
            <Reveal delay={0.16}>
              <div
                className="glass glass-lit mt-6 flex items-center gap-5 rounded-panel p-5"
                style={{
                  background:
                    "linear-gradient(102deg, rgb(255 197 22 / 0.17) 0%, rgb(255 197 22 / 0.05) 42%, rgb(255 255 255 / 0.03) 100%)",
                }}
              >
                <div className="grid size-14 shrink-0 place-items-center rounded-card border border-brand/35 bg-brand/10 text-brand-ink">
                  <Users className="size-6" aria-hidden />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-h3 font-medium leading-none tracking-tight text-bone">
                    {influencer.databaseStat.value}
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

          <Reveal delay={0.2} direction="left" variant="scene">
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
            <CreatorConstellation
              creators={influencer.creators.map((c) => ({ ...c }))}
              className="lg:max-w-[36rem]"
            />
          </Reveal>
        </div>

        {/* The figures bar — the CTA lives inside it, as in the mockup. */}
        <Reveal delay={0.24} className="mt-8">
          <div className="glass glass-lit flex flex-col gap-6 rounded-panel px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
            <div className="grid flex-1 grid-cols-2 gap-y-6 lg:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = STAT_ICONS[index] ?? Globe;
                const highlight = index === 0;

                return (
                  <div
                    key={stat.label}
                    className={cnJoin(
                      "flex items-center gap-4 px-1",
                      index > 0 ? "lg:border-l lg:border-white/10 lg:pl-6" : "",
                    )}
                  >
                    <span
                      className={cnJoin(
                        "grid size-10 shrink-0 place-items-center rounded-card border",
                        highlight
                          ? "border-brand/35 bg-brand/10 text-brand-ink"
                          : "border-white/12 bg-white/5 text-bone",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-h3 font-medium leading-none tracking-tight text-bone">
                        {stat.value}
                      </span>
                      <span className="mt-2 block text-small leading-tight text-ash">
                        {stat.label}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </Reveal>

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
        <Reveal delay={0.15} className="mt-5 flex flex-wrap gap-3">
          <GlassButton
            href="/#contact"
            quickContact="influence:plan-a-campaign"
            variant="brand"
            size="lg"
            arrow
          >
            Plan Influencer Campaign
          </GlassButton>
          <GlassButton
            href="/#case-studies"
            variant="glass"
            size="lg"
            arrow
          >
            View Case Studies
          </GlassButton>
        </Reveal>
      </div>
    </section>
  );
}

/** Local join so this file needs no extra import for two conditional classes. */
function cnJoin(...parts: string[]) {
  return parts.filter(Boolean).join(" ");
}
