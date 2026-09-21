import type { Metadata } from "next";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { drip } from "@/lib/home-content";
import { pageMetadata } from "@/lib/seo";

/**
 * GenesisDrip — the nightlife and event IP, with its own door.
 *
 * WHAT GENESIS ASKED FOR, EXACTLY: "we can also have a simple GenesisDrip
 * page/section on the website. That page can briefly explain what GenesisDrip
 * is and then link/redirect users to the GenesisDrip Instagram page for
 * current events and content. Keep it visually aligned with Genesis Media
 * while still giving GenesisDrip its own identity."
 *
 * SO IT IS DELIBERATELY ONE SCREEN. The brief is "briefly explain, then hand
 * over" — anything longer competes with the feed it exists to send people to,
 * and a page about a live events series that is not itself live goes stale
 * the week it ships. The Instagram account is the content; this is the
 * introduction to it.
 *
 * ITS OWN IDENTITY, WITHIN THE SYSTEM. The page wears the site's own
 * atmosphere, type and glass — the alignment half of the instruction — and
 * takes its distinctness from the one thing that is genuinely Drip's: the
 * tag row. Inventing a second colour system for a page with no artwork yet
 * would be making up a brand rather than expressing one.
 *
 * TODO(assets): "use strong GenesisDrip visuals where available." None have
 * been shared. The page is typographic and built to take a poster or a reel
 * the day one arrives.
 */
export const metadata: Metadata = pageMetadata({
  title: "GenesisDrip | Nightlife & Event IP",
  description:
    "GenesisDrip is Genesis's own nightlife and event IP: a series built with artists, venues and the community that turns up for it.",
  path: "/genesisdrip",
});

export default function GenesisDripPage() {
  /*
    THE HANDOVER, OR THE FORM. Genesis named the account but not its URL, and
    a button pointing at a guessed handle is a button pointing at somebody
    else's Instagram. Until `drip.instagram` is set the page offers the
    enquiry form instead — the same degradation the WhatsApp button and the
    footer's avatar link already use, and the same reason: a control that
    goes nowhere is worse than one that goes somewhere else useful.
  */
  const feed = drip.instagram || undefined;

  return (
    <Atmosphere
      tone="brand"
      origin="center"
      intensity={0.2}
      className="relative flex min-h-dvh items-center overflow-hidden py-[calc(var(--section-pad)*2)] pt-[calc(var(--section-pad)*3.4)]"
    >
      <div className="mx-auto w-full max-w-3xl px-6 text-center">
        <Reveal>
          <SectionLabel dot tone="brand">
            {drip.label}
          </SectionLabel>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-6 text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
            {drip.heading}{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              {drip.headingAccent}
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
            {drip.body}
          </p>
        </Reveal>

        {/*
          THE TAGS GENESIS SUPPLIED — Events, IP, Nightlife, Experiential,
          Community. They are the same five the case study carries, read from
          one place, so the page and the card cannot describe the same thing
          differently.
        */}
        <Reveal delay={0.14}>
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {drip.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] px-3.5 py-1.5 text-micro font-medium uppercase tracking-[0.1em] text-ash"
              >
                {tag}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {feed ? (
              /* GlassButton detects an http(s) href and opens it in its own
                 tab with the usual rel tokens — no flag needed here. */
              <GlassButton href={feed} variant="brand" size="lg" arrow magnetic>
                Follow on Instagram
              </GlassButton>
            ) : (
              <GlassButton
                href="/#contact"
                quickContact="genesisdrip:work-with-us"
                variant="brand"
                size="lg"
                arrow
                magnetic
              >
                Work with GenesisDrip
              </GlassButton>
            )}
            {/*
              BACK INTO THE PORTFOLIO, filtered to the events work. A page
              that only leaves the site is a dead end for anyone who arrived
              here from the footer and wants to see what Genesis makes.
            */}
            <GlassButton href="/#events" variant="glass" size="lg" arrow>
              See our event work
            </GlassButton>
          </div>
        </Reveal>
      </div>
    </Atmosphere>
  );
}
