import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";
import { AiContent } from "./components/ai-content";
import { BrandingDesign } from "./components/branding-design";
import { CaseStudies } from "./components/case-studies";
import { ClientLogos } from "./components/client-logos";
import { FooterCta } from "./components/footer-cta";
import { InfluencerMarketing } from "./components/influencer-marketing";
import { Portfolio } from "./components/portfolio";
import { Services } from "./components/services";
import { Studios } from "./components/studios";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} · ${siteConfig.tagline}`,
  },
  description: siteConfig.description,
};

/**
 * Homepage — the Genesis ecosystem, in the order the brief asks for.
 *
 * THE BRAIN IS THE HERO. The old opening was a lit room with a standing
 * figure and a headline over it: a picture of nobody, in front of nothing,
 * saying what Genesis does in words. It has been removed. The first thing a
 * visitor now meets is the orb with the four verticals around it, which says
 * the same thing as a diagram and lets them click straight into whichever
 * part they came for.
 *
 * WORK IS SECOND, and that is the point of the whole reorder. The old page
 * spent its first three screens explaining Genesis before showing anything it
 * had made. A visitor deciding whether to hire a creative company is looking
 * for the work; everything else is a caption on it.
 *
 * THE FOUR VERTICALS ARE THE SPINE. Influence, Studios, AI Labs and Brand &
 * Design each get their own block with their own work and their own call to
 * action, so the site reads as one ecosystem with four parts rather than as
 * fifteen unrelated services.
 *
 * WHAT LEFT THE PAGE.
 *   - The Journal teaser. There are no published articles, and a "coming
 *     soon" editorial shelf makes a launch look unfinished. The route still
 *     exists; it comes back when there is a pipeline behind it.
 *   - The Insider teaser. Genesis Insider is an internal operating system and
 *     it was interrupting the agency story. It is a Client Login in the
 *     footer now, which is where a staff door belongs.
 *   - The creative-process board. It describes how production runs, which
 *     makes it part of Studios rather than a section of its own; it moves
 *     into the Studios block when that block is built.
 *
 * ALL FOUR VERTICALS NOW HAVE A SECTION. Studios was the gap for as long as
 * there was no footage to put in it — it is the division whose whole argument
 * is showing the work, and thirteen service names in a grid is the least
 * convincing thing a page about making films could say. The masters have
 * since been transcoded, so it leads with the reel wall.
 */
export default function HomePage() {
  return (
    <main>
      {/* 01 — the Brain. Four verticals, one system, and the way in. */}
      <Services />

      {/*
        02-03 — WHO THE WORK WAS FOR, DIRECTLY UNDER THE ORB.

        Genesis has given the page's running order and the client wall is
        second in it. That is the credential, and a credential is worth
        nothing on screen seven: a visitor who has just met a diagram of four
        divisions wants to know whether anyone has actually hired them before
        they read another word. The sector strip leads and the marks follow,
        so the categories are a key to the rail rather than a footnote to it.
      */}
      <ClientLogos />

      {/*
        04 — WORK THAT MOVED A NUMBER. The strongest thing the page has to
        say, and it sits directly above the divisions: the result first, then
        the four explanations of how it was got.
      */}
      <CaseStudies />

      {/* 05-08 — the four verticals, in the brief's order. AI Lab carries the
          automation picture inside its own block. */}
      <InfluencerMarketing />
      <Studios />
      <AiContent />
      <BrandingDesign />

      {/*
        09 — THE PORTFOLIO, once every division has had its say.

        It was merged into the client wall for a round. Genesis's order splits
        them again, and at these two depths that is right: the wall answers
        "should I keep reading" and the grid answers "show me everything",
        which only lands after a visitor knows what the four divisions are.
      */}
      <Portfolio />

      {/* 10 — let's build something iconic. */}
      <FooterCta />
    </main>
  );
}
