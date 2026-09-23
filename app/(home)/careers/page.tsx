import type { Metadata } from "next";

import { GenesisForm } from "@/components/genesis/genesis-form";
import { JsonLd } from "@/components/genesis/json-ld";
import { GlowWord } from "@/components/genesis/glow-word";
import { Atmosphere } from "@/components/genesis/atmosphere";
import { Reveal, RevealGroup, RevealItem } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { careersPage } from "@/lib/page-content";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  /*
    NOT "A GEN Z CREATIVE AGENCY" — the last place on the site still saying
    it. Genesis's note is explicit: "do not position Genesis only as a Gen
    Z-led full-service agency, because the business is broader now." The
    homepage, the footer and siteConfig.description were all rewritten to the
    full offering; this title was missed because it is metadata rather than
    copy on a page, and it is what Google prints beside the careers link.
  */
  title: "Careers at a Creative Company in Mumbai",
  description:
    "Work at Genesis Media in Mumbai. We hire in content production, editing, creative direction, strategy, influencer partnerships, design, AI and engineering.",
  path: "/careers",
});

/**
 * /careers — the application, on the page's own ground.
 *
 * WHY THE BOTANICAL SCENE IS GONE. This page painted its own world: a mint-fog
 * bank, forty-six SVG stems silhouetted against it and twenty-six drifting
 * motes, all held inside `scene-dark bg-void`. It was built to a reference and
 * it was the only page on the site that did this.
 *
 * Two things were wrong with it and they have the same cause. The colours
 * belonged to no part of the identity — recolouring the fog to brand tokens
 * helped and did not fix it, because a bespoke scene is bespoke whatever hue
 * it is. And `scene-dark` PINS the dark tokens for the subtree, so the theme
 * toggle did nothing here: Genesis switched to light and got a black page with
 * a light switch on it.
 *
 * `Atmosphere` is what every other section on this site stands on. It follows
 * the theme, it carries the brand wash, and it is one line. The page loses a
 * scene it did not need and gains a light mode it should always have had.
 */
export default function CareersPage() {
  return (
    <Atmosphere
      tone="brand"
      origin="top"
      intensity={0.2}
      className="relative isolate min-h-dvh overflow-hidden"
      /*
        The compact ground, not the page-wide one. See globals.css: the seven
        stop 168deg ramp is written for the homepage and unrolls over many
        screens; squeezed into this page's 1355px its warm middle stops land
        directly behind the form, which is the mud Genesis kept pointing at.
      */
      style={{ background: "var(--page-ground-compact)" }}
    >
      <JsonLd data={breadcrumbJsonLd([{ name: "Careers", path: "/careers" }])} />
      <div className="relative z-[2] mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
        <Reveal>
          <SectionLabel dot tone="brand" className="justify-center">
            {careersPage.label}
          </SectionLabel>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-8 text-balance text-h2 font-normal leading-[1.15] tracking-tight text-bone sm:text-h1 lg:text-h1">
            {careersPage.heading}
          </h1>
        </Reveal>

        {/*
          THE CAPSULE IS BACK, and this time it survives the light theme.

          I replaced GlowWord with plain serif italic because on light it
          rendered pale cream on near-white and vanished — the glow IS the
          letterform there, and a glow needs something dark to glow against.
          Genesis wants the capsule, and they are right that it is the one
          piece of character this page has.

          So GlowWord reads its colours from tokens now rather than carrying
          light-on-dark values in its own file. On dark it is unchanged. On
          light the word takes --brand-ink's dark gold, the halo becomes a warm
          bloom BEHIND dark type instead of a light source, and the capsule
          gets an edge you can see against paper.
        */}
        <Reveal delay={0.12}>
          <GlowWord tone="warm" className="mt-6 text-h2 sm:text-h1 lg:text-h1">
            {careersPage.headingAccent}
          </GlowWord>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mt-12 max-w-lg text-pretty text-small leading-relaxed text-ash sm:text-body">
            {careersPage.body}
          </p>
        </Reveal>

        <Reveal delay={0.24} className="mt-12 w-full max-w-xl">
          {/*
            The full application, not the four-field waitlist this was.
            Name/email/message could not tell you what someone applied FOR —
            every application arrived as prose that a human had to read to
            find the discipline. The `career` spec asks for the position as a
            field, so it sorts in the sheet.
          */}
          <GenesisForm kind="career" source="/careers" compact />
        </Reveal>

        {/* TODO(copy): confirm before launch — this is a scarcity claim. */}
        <Reveal delay={0.3}>
          <p className="mt-6 text-small text-faint">
            We open roles in batches. Only a few spots each round.
          </p>
        </Reveal>

        <div className="mt-16">
          <Reveal>
            <p className="micro-label">Disciplines we hire for</p>
          </Reveal>
          <RevealGroup className="mt-6 flex flex-wrap justify-center gap-3">
            {careersPage.disciplines.map((discipline) => (
              <RevealItem key={discipline}>
                <span className="glass-chip rounded-full px-4 py-2 text-small text-ash">
                  {discipline}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </Atmosphere>
  );
}
