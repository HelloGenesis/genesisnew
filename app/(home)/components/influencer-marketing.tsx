import { BarChart3, Globe, Sparkles, Target, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CreatorConstellation } from "@/components/genesis/creator-constellation";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { influencer, isPending, services } from "@/lib/home-content";

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
            <Reveal delay={0.06} className="order-2 min-w-0 lg:order-none">
              {/*
                THE DEVICE: A CREATOR'S PROFILE. The niches are the profile's
                story highlights — each a ringed circle with its name under it
                — so a brand scans for its category the way it scans a
                creator's page. The last bubble is the "+56 more".
              */}
              <ul className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:gap-x-3 sm:gap-y-3 sm:overflow-visible sm:px-0">
                {influencer.niches.map((niche) => (
                  <li key={niche} className="flex w-[3.6rem] shrink-0 flex-col items-center gap-1.5">
                    <span className="gm-story-ring">
                      <span className="grid size-12 place-items-center rounded-full border-2 border-[var(--surface-base)] bg-[var(--surface-raised)]">
                        <span className="gm-ramp-text gm-ramp-text--full text-[0.8rem] font-semibold uppercase tracking-tight">
                          {niche.slice(0, 2)}
                        </span>
                      </span>
                    </span>
                    <span className="w-full truncate text-center text-[0.625rem] text-ash">
                      {niche}
                    </span>
                  </li>
                ))}
                <li className="flex w-[3.6rem] shrink-0 flex-col items-center gap-1.5">
                  <span className="grid size-[3.3rem] place-items-center rounded-full bg-brand text-[0.8rem] font-semibold text-on-brand shadow-[0_0_24px_-6px_rgb(255_197_22/0.7)]">
                    +{influencer.moreNiches}
                  </span>
                  <span className="text-center text-[0.625rem] text-ash">more</span>
                </li>
              </ul>
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
                  influencers
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
            <CreatorConstellation
              creators={influencer.creators.map((c) => ({ ...c }))}
              className="lg:max-w-[36rem]"
            />
          </Reveal>
        </div>

        {/* The figures bar — the CTA lives inside it, as in the mockup. */}
        {/*
          The stat bento is off on phones ("remove the bentogrid, only
          mobile"): below the constellation it was a fourth consecutive block
          of numbers, and the 1,00,000+ card already leads the section.
        */}
        <Reveal delay={0.24} className="mt-8 hidden sm:block">
          <div className="gm-rim relative overflow-hidden rounded-panel shadow-[0_30px_70px_-30px_rgb(164_92_255/0.4)]">
            {/* The profile's cover: the lockup's ramp, as a band. */}
            <div aria-hidden className="h-10 bg-[linear-gradient(100deg,rgb(255_197_22/0.55),rgb(243_154_60/0.45)_28%,rgb(232_102_58/0.4)_52%,rgb(208_106_138/0.4)_76%,rgb(164_139_224/0.5))]" />
            <div className="flex flex-col gap-5 px-5 pb-5 sm:px-6 lg:flex-row lg:items-end">
              <div className="-mt-7 flex items-end gap-4">
                <span className="gm-story-ring shrink-0 !p-[3px]">
                  <span className="grid size-16 place-items-center rounded-full border-[3px] border-[var(--surface-base)] bg-[#0f0b0d]">
                    <Image src="/brand/genesis-n.png" alt="" width={306} height={500} className="h-8 w-auto" />
                  </span>
                </span>
                <span className="pb-1 leading-tight">
                  <span className="flex items-center gap-1.5 text-small font-semibold text-bone">
                    genesis.influence
                    <svg viewBox="0 0 24 24" className="size-4" aria-label="Verified">
                      <path fill="#ffc516" d="m12 1.5 2.6 2 3.2-.3.9 3.1 2.8 1.6-1 3.1 1 3.1-2.8 1.6-.9 3.1-3.2-.3-2.6 2-2.6-2-3.2.3-.9-3.1L2.5 14l1-3.1-1-3.1 2.8-1.6.9-3.1 3.2.3 2.6-2Z" />
                      <path d="m8 12.2 2.7 2.6L16.2 9" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="mt-1 block text-[0.75rem] text-faint">
                    {services.items[0].caption}
                  </span>
                </span>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-y-4 md:grid-cols-4 lg:ml-6">
                {stats.map((stat, index) => {
                  const Icon = STAT_ICONS[index] ?? Globe;
                  return (
                    <div
                      key={stat.label}
                      className={cnJoin(
                        "flex flex-col items-center text-center",
                        index > 0 ? "md:border-l md:border-white/10" : "",
                      )}
                    >
                      <span className="gm-ramp-text gm-ramp-text--full text-h3 font-semibold leading-none tracking-tight">
                        {stat.value}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] leading-tight text-ash">
                        <Icon className="size-3.5 text-brand-ink" aria-hidden />
                        {stat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
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
        <Reveal delay={0.15} className="mt-5 flex flex-nowrap gap-2 sm:flex-wrap sm:gap-3">
          <GlassButton
            href="/#contact"
            quickContact="influence:plan-a-campaign"
            variant="brand"
            size="lg"
            arrow
            className={MOBILE_CTA}
          >
            Plan Influencer Campaign
          </GlassButton>
          <GlassButton
            href="/#case-studies"
            variant="glass"
            size="lg"
            arrow
            className={MOBILE_CTA}
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
