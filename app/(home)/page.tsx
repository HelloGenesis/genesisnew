import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
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

/*
  THE TITLE WAS THE TAGLINE — 91 characters, so every result showed "Genesis
  Media · Empowering brands with influencer marketing, creative co…" and cut
  off before saying what the agency is or where. Brand first, then the three
  things people search for, then the city, inside 60.
*/
export const metadata: Metadata = pageMetadata({
  title: "Genesis Media | Influencer, Content & AI Agency in Mumbai",
  absoluteTitle: true,
  /*
    THE FULL OFFERING, NOT THE OLD POSITIONING. This said "a Gen Z-led agency
    in Mumbai for influencer marketing, UGC, video production, AI avatars and
    brand design" — a description of the company as it was two divisions ago.
    Genesis asked for it replaced: the business is broader now, and events,
    automation, games and apps were all invisible to anyone reading this in a
    result.

    Mumbai stays. It is the one thing in here that is a ranking signal rather
    than a claim, and the address in siteConfig backs it.
  */
  description:
    "Genesis Media is a creative company in Mumbai: influencer marketing, content production, AI content and avatars, branding and design, automation, games, apps and events.",
  /*
    WHAT A PERSON READS WHEN THE LINK IS FORWARDED — Genesis's own tagline,
    which is also the line on the share card itself.

    The description above is written for a search result: it names the ten
    things the business sells, because that is what a query is matched
    against. In a WhatsApp preview it is given about sixty characters and cut
    at "influencer marketing,…", so what a forwarded link actually said was
    the beginning of a list. Genesis: "Empowering brands wala jo tha na pehle
    woh chahiye." It is theirs, it is one sentence, and it survives the
    truncation.
  */
  shareDescription: siteConfig.tagline,
  path: "/",
});

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
        02 — WORK THAT MOVED A NUMBER, DIRECTLY UNDER THE ORB.

        The strongest thing the page has to say, and it now says it first. It
        carries the figures bar at its foot, so the block reads as a single
        argument: here is the work, here is the scale it was done at.
      */}
      <CaseStudies />

      {/*
        03 — AND THEN WHO IT WAS FOR.

        The client wall used to sit above the case studies, on the reasoning
        that a visitor wants to know somebody has hired Genesis before they
        read another word. Genesis has since put it below, and that is the
        better order for the same reason the case studies lead: a logo wall
        answers "is this a real company", which is a smaller question than
        "can they do the thing", and the posters answer the bigger one. Read
        after the work, thirty marks stop being a credential asking to be
        taken on trust and become the client list behind what was just shown.

        The sector strip stays under the marks, so the categories are a key
        to the rail rather than a footnote to it.
      */}
      <ClientLogos />

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
