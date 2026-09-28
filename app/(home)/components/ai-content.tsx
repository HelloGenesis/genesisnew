"use client";

import { useState } from "react";


import { AutomationSources } from "@/components/genesis/automation-diagram";
import { AvatarFan } from "@/components/genesis/avatar-fan";
import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { pagerFor } from "@/components/genesis/overlay";
import { WarpRail, type WarpItem } from "@/components/genesis/warp-rail";
import { VideoDialog, type OpenVideo } from "@/components/genesis/video-dialog";
import type { CaseStudy } from "@/lib/case-studies";
import {
  caseStudyForClip,
  caseStudyPathForClip,
  uniqueStudies,
} from "@/lib/case-study-pages";
import { expandToClips, reelClip, reelPoster, work } from "@/lib/work";
import { Reveal } from "@/components/genesis/reveal";
import { aiContent, services } from "@/lib/home-content";
import { GlassButton } from "@/components/genesis/glass-button";
import { DivisionCtas } from "./division-ctas";
import { PlanBar } from "./plan-bar";
import { inr } from "@/lib/money";
import { productsFor } from "@/lib/products";

/* The avatar product — the natural next step under the avatar roster (lib/products). */
const avatarProduct = productsFor("ai-labs")[0];
import { SectionShell } from "./section-shell";


/**
 * Section — AI-generated content.
 *
 * Spec: "AI tools, Image Generations, AI Avatars, Video Generations… Some AI
 * content can be showcased. Ai Avatars: Adi, Diya, Ivaanat, Shivam, Tanvi."
 *
 * The avatars are dealt as a fanned hand of cards, from the deck's own AI Lab
 * board. Real avatar stills replace the placeholder grounds when they land.
 */

/**
 * THE AI PORTFOLIO THE WARP RAIL PLAYS.
 *
 * Every clip the catalogue files under AI Lab, one card each, in the order
 * the catalogue holds them. `expandToClips` is what turns four engagements
 * into the dozen cards a corridor needs — a rail of four pieces is a row, not
 * a corridor, and the division's whole argument is volume.
 *
 * A CARD IS A LINK ONLY WHERE THERE IS A STUDY BEHIND IT. Most of this work
 * has one; the SiNet film and the Activ Yuva explainers do not yet, and they
 * ride the rail as footage rather than as targets. Write one and they become
 * clickable with no change here.
 *
 * Computed at module scope: it is derived from static data and would
 * otherwise be rebuilt on every render of a client component that re-renders
 * whenever the dialog opens.
 */
type AiCard = Omit<WarpItem, "onOpen"> & {
  study?: CaseStudy;
  /** The clip itself, for the video window a card with no study opens. */
  clipId: string;
};

const AI_WORK: AiCard[] = expandToClips(
  work.filter((item) => item.vertical === "AI Lab"),
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
      clipId: clip,
    };
  });

/** The distinct studies the rail covers, for the window's pager. */
const AI_STUDIES = uniqueStudies(AI_WORK.map((card) => card.study));

/*
  THE CARDS WITH NO STUDY, in rail order — each opens its own clip in the
  video window, and the window's arrows walk these.
*/
const AI_VIDEOS: OpenVideo[] = AI_WORK.filter((card) => !card.study).map((card) => ({
  id: card.clipId,
  label: card.label,
}));

export function AiContent() {
  /*
    WHICH STUDY IS OPEN OVER THE PAGE. Same window the Studios stage cards and
    the case-study posters use — Genesis's rule is that a study opens where
    the reader already is, and this rail is the third way into one.
  */
  const [study, setStudy] = useState<CaseStudy | null>(null);
  /* Which clip the study opens on — the card that was clicked. */
  const [studyClip, setStudyClip] = useState<string | undefined>(undefined);
  /*
    AND WHICH CLIP, for a card with no study behind it: the video alone.
    Every card opens something.
  */
  const [video, setVideo] = useState<OpenVideo | null>(null);

  return (
    <>
    <SectionShell
      id="ai-lab"
      division={{
        name: "AI Lab",
        tagline: services.items[3].caption,
        ramp: services.items[3].ramp,
      }}
      /*
        THE UMBRELLA CLAIM, OVER THE WHOLE DIVISION.

        This header carried the lockup and nothing else, and Genesis's read
        of the result is the reason for the change: avatars, multilingual
        content, games, apps and automation "can otherwise feel
        disconnected", so the section needs one message that is true of all
        of them before the blocks start. It is the mark, then the claim, then
        the scope — and only then the roster.

        The avatar copy further down is untouched and is now doing the job it
        was written for: introducing the AVATARS, rather than standing in as
        the section's only heading.
      */
      heading={aiContent.heading}
      headingAccent={aiContent.headingAccent}
      body={aiContent.body}
      bodyPhone={aiContent.bodyPhone}
      /*
        TWO LINES ON A DESKTOP — "isko bhi two lines me karo". At the shell's
        default 42rem it ran to three. Measured, it sets in two from 820px;
        53rem leaves room for the font to load a hair wider, and `balance`
        splits it into two even lines rather than a full one and a stub.
      */
      bodyTextClassName="lg:max-w-[53rem] lg:text-balance"
      /*
        THE COPY UNDER THE MARK STEPS BACK — "uske niche ka copy usse chota."

        NO PER-SECTION LOCKUP HEIGHT ANY MORE. AI Lab briefly carried its own,
        and Genesis's follow-up settled it: every vertical's mark is the same
        size, and they are all bigger now. That is one number in globals.css
        (--lockup-h), not a prop here — see the note on it.

        WHAT STAYS IS THE HALF THAT WAS ABOUT THIS SECTION. A larger mark over
        an unchanged section heading is two things competing to be the
        announcement, and the mark loses because the heading is longer. A step
        down for the heading and the tagline lets the picture say which
        division and the sentence say what it is for.
      */
      headingClassName="text-h3 sm:text-h2 lg:text-h2"
      taglineClassName="text-small sm:text-body"
      tone="brand"
      origin="center"
      intensity={0.14}
      /*
        CENTRED, AND THIS IS THE PATTERN NOW. The lockup is the mark, alone,
        in the middle of the section. It was `split` — lockup left, prose
        right — which was the fix for a worse arrangement, but the mark is
        artwork rather than a heading and artwork wants the middle of the
        frame. The reading follows the showcase rather than crowding it.
      */
      align="center"
    >
      {/*
        FULL-BLEED. The fan runs edge to edge and clips at both sides, the
        way the board does — a hand of cards floating with air either side of
        it reads as a widget dropped into the section instead of a roster
        being dealt to you.
      */}
      {/*
        Full-bleed, and a plain clip again. This was a horizontal scroller
        below 640, because the fan is 775px wide by construction and a phone
        would otherwise amputate the outer avatar on each side. AvatarFan no
        longer fans at that width — it lays the same seven cards out as two
        centred rows — so there is nothing left to scroll and a scroller with
        no overflow only invites a sideways drag that goes nowhere.
      */}
      {/*
        THE WORK, BEFORE THE AVATARS — and full-bleed, because a corridor that
        stops at the container's edge is a box with pictures in it.

        Genesis's order for this section: the mark, the claim, then the
        portfolio, then the avatars. That is the right way round for the
        argument it makes. "Created with AI. Built for your brand." is a
        claim about OUTPUT, and the avatars are one of the tools; showing the
        output first means the roster underneath reads as the explanation
        rather than as the pitch.

        --warp-card and --warp-h are set here rather than in the component
        because they are this composition's proportions: the card is a share
        of the viewport so the corridor holds its shape from a phone to a
        wide display, and the frame is tall enough to fit the card's 3:4 plus
        the room the turned ones need as they scale back.
      */}
      {/*
        THE WAYS ON, BETWEEN THE COPY AND THE WORK (Genesis, 29 Sep 2026):
        View Page, Explore Pricing and Case Studies — see DivisionCtas.
      */}
      <DivisionCtas vertical="ai-labs" align="center" className="mt-6 sm:mt-8" />

      <Reveal variant="scene" className="relative left-1/2 mt-10 w-screen -translate-x-1/2">
        {/*
          BIGGER AND TALLER THAN THE FIRST PASS. The cards were 15vw at 3:4
          and Genesis's read was that the whole thing looked mid next to the
          reference — half of that was the projection (see WarpRail) and half
          was simply scale. A 5:8 card is the proportion the reference uses.
          The middle card renders at exactly --warp-card and every other one
          is smaller, so the number is a ceiling rather than a starting point;
          --warp-h holds the largest card plus a little air.

          LARGER STILL ON A PHONE (Genesis, 28 Sep 2026: "make this card a
          little larger … just for phone"): 11.5rem where the clamp's floor
          gave 8.5rem, about 35% bigger, with the frame grown to match. From
          sm up the viewport-relative sizes are unchanged.
        */}
        <div className="[--warp-card:11.5rem] [--warp-h:19.5rem] sm:[--warp-card:clamp(8.5rem,15vw,14rem)] sm:[--warp-h:clamp(14rem,24vw,22rem)]">
          {/*
            EVERY CARD OPENS SOMETHING, which is the fix Genesis reported
            twice — "these videos are still not interactive".

            Only nine of these twenty-three clips have a written case study.
            The other fourteen are the ten Genesis Estate property films, the
            two Activ Yuva explainers, the SiNet film and Shivam's avatar
            cuts, and none of them has a write-up anywhere on the site. The
            rail was rendering those as plain footage — correct, in that a
            link to a study that does not exist is worse than no link, and
            useless, in that it is the front of the rail and the first five
            cards a reader sees are all in that group.

            SO THE FALLBACK IS THE WORK ITSELF. A card with no study opens the
            portfolio's own window on the piece it came from: the film at full
            size, the rest of that engagement's cuts, and the route on to the
            case study when one is eventually written. The same window the
            portfolio grid opens, so it is a pattern the reader has already
            met rather than a second one invented here.

            NOTHING IS CLAIMED THAT IS NOT TRUE. The work window prints only
            the fields the catalogue holds and omits the rest — no invented
            brief, no invented result — which is what makes this honest where
            pointing the card at somebody else's study would not be.
          */}
          <WarpRail
            items={AI_WORK.map((card) => ({
              ...card,
              onOpen: card.study
                ? () => {
                    setStudy(card.study ?? null);
                    setStudyClip(card.clipId);
                  }
                : () => setVideo({ id: card.clipId, label: card.label }),
            }))}
          />
        </div>
      </Reveal>

      {/*
        THE AI LAB DIAGRAM, ABOVE THE AVATARS (Genesis, 29 Sep 2026: "remove
        this copy and just keep the AI Lab whole element and move it above
        Build Your Own AI Avatar"). It was its own section, headed "Automate
        the work behind your business" with a paragraph under it; the heading
        and paragraph are gone, and the picture, its closing line and its two
        buttons now sit between the work and the avatars.
      */}
      {/*
        JUST THE ELEMENT (Genesis, 29 Sep 2026: "remove this black background
        and the buttons — it's just an element to represent the AI Lab"): the
        diagram and its line, on the section's own ground.
      */}
      <Reveal delay={0.06} className="mt-[var(--block-gap)]">
        <div className="mx-auto w-full max-w-6xl text-center">
          <figure className="mx-auto max-w-[60rem]">
            <AutomationSources />
          </figure>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-body font-medium leading-relaxed text-bone sm:mt-8 sm:text-lead">
            {aiContent.automation.kicker}
          </p>
        </div>
      </Reveal>

      <Reveal
        variant="scene"
        className="relative left-1/2 mt-12 w-screen -translate-x-1/2 overflow-hidden"
      >
        {/*
          GENESIS'S COPY, ABOVE THE ROSTER, in the slot the old "AI Avatars &
          Realism" heading had. Three parts, in their order: who it is for,
          the claim, and what the claim means.

          THE GRADIENT GOES ON THE MIDDLE LINE, which is the one that
          replaces the old heading. Putting it on the first line instead
          would wear the ramp on a 100-character sentence, and a gradient
          clipped to that much text stops reading as a colour and starts
          reading as a printing fault.

          PLAIN EVERYWHERE ELSE, NOT A SECOND GRADIENT. The subtitle here
          used to run --ramp-avatars-soft, the same ramp desaturated, which
          on the dark ground reads as grey directly under the bright version
          of itself. Two gradients stacked is where the block stopped having
          a hierarchy.
        */}
        <div className="mx-auto max-w-3xl px-6 text-center lg:max-w-none">
          {/*
            THE HEADLINE IS "AI CONTENT & AVATARS", which Genesis identified
            as the main line. It wears the AI Lab ramp; the qualification
            under it is plain, because two gradients stacked is where a block
            stops having a hierarchy.
          */}
          {/*
            SET LIKE THE SECTION'S OWN HEADING, not in the avatars ramp.

            Genesis asked for "the same colour scheme as Create more. Without
            creating everything from scratch" — which is bone with the accent
            in serif italic brand. It used to wear --ramp-avatars, and with
            the warp rail now sitting between the two headings that was the
            problem: a gradient headline under a plain one read as a
            different section starting rather than as the second half of this
            one. Matching them is what holds AI Lab together as one block.
          */}
          <h3 className="text-balance text-h3 font-normal leading-[1.06] tracking-tight text-bone sm:text-h2">
            {aiContent.avatarsIntro.heading}{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              {aiContent.avatarsIntro.headingAccent}
            </span>
          </h3>
          {/*
            TWO LINES ON A LAPTOP AND UP — "this in two lines only please".
            It is three sentences, about 2,100px of text at this size, so two
            lines need a 70rem measure; that fits from xl. Below xl there is
            not the width for two, so it balances into three even lines
            rather than two full ones and a stub. The heading above stays at
            its own width; only the copy widens.
          */}
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead lg:max-w-[60rem] lg:text-balance xl:max-w-[70rem]">
            <span className="sm:hidden">{aiContent.avatarsIntro.leadPhone}</span>
            <span className="hidden sm:inline">{aiContent.avatarsIntro.lead}</span>
          </p>

          {/*
            "One Setup. Real-Time. Every Time" stood here and is gone at
            Genesis's request. The section had three claims stacked before a
            single face was shown; the line that survives it now sits under
            the roster instead.
          */}
        </div>

        <AvatarFan avatars={aiContent.avatars} className="mt-5 sm:mt-6" />

        {/*
          THE CAPTION UNDER THE ROSTER, WHERE THERE IS ONE.

          It used to be "create realistic AI avatars and turn them into
          consistent content", and Genesis's new copy opens the block with
          that same sentence — so printed here as well the section would
          introduce the avatars, show them, and introduce them again. The
          field is empty rather than deleted because the slot is still the
          right one for a caption, and rendering nothing is one condition
          rather than a component change the day another line arrives.
        */}
        {aiContent.avatarsIntro.line && (
          <p className="mx-auto mt-4 max-w-2xl px-6 text-center text-body leading-relaxed text-ash sm:text-lead">
            {aiContent.avatarsIntro.line}
          </p>
        )}
        {/*
          THE WAY IN, UNDER THE AVATARS — "Build Your AI Avatar", the first of
          Genesis's one-time AI products (28 Sep 2026): a brand not ready to
          subscribe can have its own avatar made. It opens the product on the
          AI Labs page, where it can be bought.
        */}
        <div className="mx-auto mt-6 flex max-w-fit flex-col items-center gap-3 rounded-panel border border-brand/40 bg-brand/[0.06] px-5 py-3 text-center sm:flex-row sm:gap-5 sm:rounded-full sm:py-2 sm:pl-6 sm:pr-2">
          <p className="text-small text-ash">
            <span className="text-bone">{avatarProduct.name}</span> · one-time{" "}
            <span className="text-brand-ink">{inr(avatarProduct.price!)}</span>
          </p>
          <span data-track="home-plan:ai-labs:avatar">
            <GlassButton href="/ai-content-automation#ai-labs-one-time" pageLink variant="brand" size="sm" arrow>
              Buy Now
            </GlassButton>
          </span>
        </div>
      </Reveal>

      {/*
        THE TOOL STACK AND THE CAPABILITY CHIPS ARE GONE from the homepage.
        With the roster, the stack, a chip row and a button this section ran
        to 2.28 screens — the worst offender on the page by some way, in a
        brief that asks for one section to a screen. The avatars are the
        argument; the tooling is a detail for the division's own page.
      */}
      {/*
        AI-POWERED AUTOMATION, AS A BENTO CARD WITH EDGES YOU CAN SEE.

        IT WAS FULL BLEED WITH A HAIRLINE TOP AND BOTTOM and Genesis reported
        the borders as not showing. They were not. `--glass-border` is a 12%
        white over a near-black ground, which across the whole width of the
        viewport reads as a faint change of tone rather than as an edge — and
        with nothing down the sides there were no corners to give the shape
        away. A band the width of the screen has no edges to see.

        SO IT IS A CARD AGAIN, which is what "bento" asked for in the first
        place: held to the page's own measure, rounded, bordered on all four
        sides, and sitting on --surface-raised so the panel is a step above
        the page rather than a wash over it. The border is doubled up — the
        token plus an inset highlight — because one hairline on a dark panel
        against a dark page is exactly the thing that failed before.

        THE HEADING KEEPS ITS SECTION SIZE. Genesis asked for this to be big
        and it stays big; what changed is that the big thing now has an
        outline. The diagram keeps its own generous measure so the labels and
        the node are read rather than squinted at.
      */}
      <PlanBar vertical="ai-labs" />
    </SectionShell>


      {/*
        THE STUDY, OVER THE PAGE. The pager walks the rail's own cards in rail
        order, so "next" from a piece is the piece beside it rather than
        whatever is next in the case-study ordering. Cards with no study are
        not stops on that walk.
      */}
      <CaseStudyDialog
        study={study}
        startClip={studyClip}
        onClose={() => setStudy(null)}
        /* Deduped — see the note in Influence and `uniqueStudies`. */
        pager={pagerFor(
          AI_STUDIES,
          AI_STUDIES.findIndex((entry) => entry.slug === study?.slug),
          (entry) => {
            setStudy(entry);
            setStudyClip(undefined);
          },
          (entry) => entry.client,
        )}
      />

      {/*
        THE VIDEO ALONE, for the cards with no study — "jiska nahi hai uski
        sirf video play ho". Its arrows walk the rail's other studyless cards.
      */}
      <VideoDialog
        video={video}
        onClose={() => setVideo(null)}
        pager={pagerFor(
          AI_VIDEOS,
          AI_VIDEOS.findIndex((entry) => String(entry.id) === String(video?.id)),
          (entry) => setVideo(entry),
          (entry) => entry.label,
        )}
      />
    </>
  );
}