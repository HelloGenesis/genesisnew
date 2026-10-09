"use client";


import { GlassIcon } from "@/components/genesis/glass-icon";
import { LogoMarquee } from "@/components/genesis/logo-marquee";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { PlanCaseStudies } from "@/components/genesis/plan-case-studies";
import { findCopy } from "@/lib/case-study-copy";
import { BENTO_WIDE as BENTO } from "@/lib/bento";
import { DivisionServices } from "@/components/genesis/division-services";
import { DIVISION_PROCESS, ProcessIcons } from "@/components/genesis/process-icons";
import { cn } from "@/lib/utils";

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
import { aiContent } from "@/lib/home-content";
import { DivisionCtas } from "./division-ctas";
import { PlanBar } from "./plan-bar";

/* The avatar product — the natural next step under the avatar roster (lib/products). */
import { SectionShell } from "./section-shell";
import { FitScale } from "@/components/genesis/fit-scale";
import { AiLabBurst } from "@/components/genesis/ai-lab-burst";
import { PhoneDivisionCtas } from "./division-ctas";




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

/**
 * THE AI LAB DIAGRAM — the tools on either side wired into the AI Lab mark,
 * and its closing line. In the homepage section above the avatars; on the AI
 * Labs page, under the client logos (Genesis, 2 Oct 2026: "move this section
 * below logos on AI Labs page").
 */
/**
 * `fit`: in the AI Lab hero, where on a phone the diagram takes whatever
 * height the screen has left, so the opening is one screen on any phone.
 */
export function AiLabDiagram({
  className,
  fit = false,
  kicker = true,
  interactive = false,
}: {
  className?: string;
  fit?: boolean;
  /** "Less manual work. Smarter workflows. Faster growth." under it — off on the homepage panel. */
  kicker?: boolean;
  /** Each tool lights its strand and names itself on hover; the rest step back. */
  interactive?: boolean;
}) {
  return (
    <Reveal delay={0.06} className={cn(fit && "max-lg:flex max-lg:h-full max-lg:min-h-0 max-lg:flex-col", className)}>
      <div className={cn("mx-auto w-full max-w-6xl text-center", fit && "max-lg:flex max-lg:h-full max-lg:min-h-0 max-lg:flex-col")}>
        {/*
          THE DESKTOP DESIGN ON A PHONE AND TABLET TOO (Genesis, 6 Oct 2026),
          on the homepage panel: the wide diagram and what comes out of the
          Lab, laid out at a laptop's width and scaled down as one picture.
        */}
        {/* The AI Lab page's hero too (Genesis, 6 Oct 2026: "not updated here"). */}
        {interactive && (
          <div className="lg:hidden">
            <FitScale width={800}>
              <figure className="relative">
                <AutomationSources interactive wide />
              </figure>
            </FitScale>
            {/* What comes out of the Lab, readable, in a group under it on a phone (Genesis, 6 Oct 2026). */}
            <AiLabBurst row className="mt-4" />
            {/* The page and a call under what the Lab makes, on a phone (Genesis, 6 Oct 2026). */}
            {!fit && <PhoneDivisionCtas vertical="ai-labs" className="mt-6" />}
          </div>
        )}
        <figure className={cn("relative mx-auto max-w-[60rem]", fit && "max-lg:flex max-lg:min-h-0 max-lg:w-full max-lg:flex-1 max-lg:justify-center", /* Below lg the scaled copy above stands in; `max-lg:hidden` so the fit layout's max-lg:flex cannot bring this one back. */ interactive && "max-lg:hidden")}>
          <AutomationSources interactive={interactive} className={fit ? "max-lg:mx-auto max-lg:h-full max-lg:max-h-full max-lg:w-auto max-lg:max-w-full" : undefined} />
          {/* What comes out of the Lab, around its pill (homepage panel). */}
          {interactive && <AiLabBurst />}
        </figure>
        {kicker && (
          <p className={cn("mx-auto mt-6 max-w-2xl text-pretty text-body font-medium leading-relaxed text-bone sm:mt-8 sm:text-lead", fit && "max-lg:mt-2 max-sm:whitespace-nowrap max-sm:text-[0.75rem] sm:max-lg:text-small")}>
            {aiContent.automation.kicker}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/**
 * `onPage`: the section on its own division's page, under the page's hero
 * (Genesis, 2 Oct 2026). Without its header — the page's hero already names
 * the division — and without its plan bar: the page's own pricing section,
 * further down, is the one place to buy.
 */
export function AiContent({ onPage = false }: { onPage?: boolean } = {}) {
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
      {/* Not on the AI Labs page itself, which has its own buttons (Genesis, 2 Oct 2026). */}
      {/*
        ONE BLOCK, TEXT LEFT AND THE AI LAB DIAGRAM RIGHT (Genesis, 4 Oct
        2026: "merge these together — text on the left, AI element on the
        right, in one section"). The diagram's pill names the division, so
        there is no separate lockup; the claim, the process, the services and
        the buttons sit beside it. Stacked on a phone, the words first.
      */}
      {!onPage && (
        <div className={BENTO}>
          {/*
            ONE COLUMN, THE LAB IN THE MIDDLE (Genesis, 4 Oct 2026: "merge this
            into this … the main element goes into the circle, the process
            below; keep everything visible, no overlaps, enough spacing"): the
            mark, the claim, then the diagram large and centred with what the
            Lab makes around it, the services under it, the proof, the process
            and the way on.
          */}
          {/* No separate mark: the diagram's pill is the AI Lab logo, and the panel has to fit one screen (Genesis, 4 Oct 2026). */}
          {/* The AI Lab mark over the heading on every screen, as the other divisions' sections open (Genesis, 6 Oct 2026: "AI Lab logo is missing"). */}
          <Reveal className="mb-4 flex justify-center sm:mb-6">
            <DivisionLockup name="AI Lab" tagline="" ramp="linear-gradient(100deg, #ff8fb8 0%, #ffa25c 100%)" />
          </Reveal>
          <Reveal className="text-center">
            <h2 className="text-balance text-h3 font-normal leading-[1.06] tracking-tight text-bone sm:text-h2">
              {aiContent.heading}{" "}
              <span className="font-serif font-normal italic text-brand-ink">{aiContent.headingAccent}</span>
            </h2>
          </Reveal>
          {/* Not on a phone (Genesis, 6 Oct 2026: "remove this from phone"); a tablet keeps it. */}
          <Reveal delay={0.06} className="hidden sm:block lg:hidden">
            <p className="mx-auto mt-4 max-w-xl text-center text-pretty text-body leading-relaxed text-ash">{aiContent.bodyPhone}</p>
          </Reveal>

          {/* On a phone, what the Lab does sits above the diagram (Genesis, 6 Oct 2026: "put this above the element"). */}
          <div className="mt-5 rounded-panel border border-[var(--glass-border)] bg-white/[0.03] px-3 py-3.5 text-center sm:hidden">
            <p className="micro-label !text-brand-ink">What the Lab does</p>
            {/* Small, one line each, wrapping as a cluster (Genesis, 6 Oct 2026: "minimise this"). */}
            <DivisionServices
              division="AI Lab"
              chips
              className="!mt-2.5 [&_li]:gap-1.5 [&_li]:whitespace-nowrap [&_li]:py-1 [&_li]:pl-1.5 [&_li]:pr-2.5 [&_li]:!text-[0.6875rem] [&_svg]:!size-5 [&_ul]:!flex [&_ul]:flex-wrap [&_ul]:justify-center [&_ul]:!gap-1.5"
            />
          </div>

          {/* THE MAIN ELEMENT. */}
          <AiLabDiagram className="mx-auto mt-6 w-full max-w-[min(60rem,calc((100svh-21rem)*2.2))] lg:mt-12" kicker={false} interactive />


        </div>
      )}
      {/*
        THE SERVICES AND THE PROCESS, A PANEL OF THEIR OWN (Genesis, 4 Oct
        2026: "make these a different bento, make these like these"), set as
        the dark glass chips that come out of the Lab above.
      */}
      {!onPage && (
        <div className="mt-6 grid gap-10 sm:rounded-panel sm:border sm:border-transparent sm:p-8 sm:shadow-[-24px_18px_60px_-30px_rgb(245_146_62/0.55),24px_18px_60px_-30px_rgb(180_92_224/0.55)] sm:[background:radial-gradient(120%_140%_at_0%_100%,rgb(245_146_62/0.22),transparent_45%)_padding-box,radial-gradient(120%_140%_at_100%_0%,rgb(180_92_224/0.22),transparent_45%)_padding-box,linear-gradient(rgb(13_13_14),rgb(13_13_14))_padding-box,linear-gradient(100deg,#f5923e_0%,#f2607e_40%,#6b4fd8_75%,#c05ce0_100%)_border-box] lg:-mx-16 lg:grid-cols-[minmax(0,1fr)_34rem] lg:items-stretch lg:gap-12 lg:p-10">
          {/*
          IN THE PRICE BOXES' GRADIENT FRAME from sm (Genesis, 6 Oct 2026: "make
          this entire bento a gradient like the other price sections"): the
          palette as a 1px edge on the dark, glowing ground. A phone keeps its
          own layout.
        */}
          {/*
            ONE PANEL, TWO SIDES (Genesis, 4 Oct 2026: "think and merge this
            section together"): what the Lab does, how it runs, the proof and
            the way on, on the left; its case studies on the right.
          */}
          {/*
            THE LEFT SIDE AS TWO CARDS OF ITS OWN (Genesis, 4 Oct 2026: "add the
            tags within the box and one more card on the right, complete the
            bento"): the services in one, the way on in the other.
          */}
          {/* Heading on top, the services under it, the button in the bottom corner (Genesis, 5 Oct 2026). */}
          <div className="flex min-w-0 flex-col gap-6 text-center sm:text-left">
            {/* No icon, just the line, centred on a phone and left from sm (Genesis, 6 Oct 2026). */}
            <h3 className="text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone max-sm:hidden sm:text-h2">
              Your content engine, <span className="font-serif italic text-brand-ink">built once.</span>
            </h3>
            {/* No box inside the panel (Genesis, 6 Oct 2026: "remove the bento inside a bento"). */}
            <div className="max-sm:hidden">
              <p className="micro-label !text-brand-ink">What the Lab does</p>
              <DivisionServices division="AI Lab" chips className="mt-4 sm:[&_ul]:flex sm:[&_ul]:flex-wrap sm:[&_ul]:justify-start" />
            </div>
            <DivisionCtas vertical="ai-labs" align="center" size="sm" primaryOnly className="justify-center max-sm:hidden sm:mt-auto sm:justify-end" />
          </div>
          {/* Two cards, not four, so the box is shorter (Genesis, 5 Oct 2026: "remove these 2 cards"). */}
          {/* On a phone, in the plan boxes' gradient frame and dark ground (Genesis, 6 Oct 2026). */}
          <div className="min-w-0 max-sm:rounded-panel max-sm:bg-[linear-gradient(100deg,#f5923e_0%,#f2607e_40%,#6b4fd8_75%,#c05ce0_100%)] max-sm:p-px max-sm:shadow-[-24px_18px_60px_-30px_rgb(245_146_62/0.55),24px_18px_60px_-30px_rgb(180_92_224/0.55)]">
            <PlanCaseStudies
              vertical="AI Lab"
              perPage={2}
              /* Bigger, 3:4 cards here (Genesis, 6 Oct 2026). */
              cardClassName="lg:aspect-[3/4] lg:h-auto"
              className="min-w-0 max-sm:rounded-panel max-sm:bg-ink max-sm:p-4 max-sm:[background-image:radial-gradient(120%_140%_at_0%_100%,rgb(245_146_62/0.22),transparent_45%),radial-gradient(120%_140%_at_100%_0%,rgb(180_92_224/0.22),transparent_45%)]"
            />
          </div>
        </div>
      )}

      {/* The curved rail of AI work lives on the AI Lab page only, not the homepage (Genesis, 4 Oct 2026). */}
      {onPage && (
      <Reveal variant="scene" className="relative left-1/2 mt-10 w-screen -translate-x-1/2 lg:mt-16">
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
        {/* BIGGER CARDS from sm (Genesis, 4 Oct 2026), bigger again ("make these cards bigger"). */}
        <div className="[--warp-card:78vw] [--warp-h:calc(78vw*1.6)] sm:[--warp-card:clamp(11rem,22vw,20rem)] sm:[--warp-h:calc(var(--warp-card)*1.6+1.75rem)]">
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
              stats: card.study?.copy !== undefined ? findCopy(card.study.copy)?.outcome ?? undefined : undefined,
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
      )}



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
          {/* The avatar copy as a process on a desktop (Genesis, 4 Oct 2026). */}
          <ProcessIcons steps={DIVISION_PROCESS["AI Avatars"]} label={aiContent.avatarsIntro.lead} className="mt-8" />
          {/* On a phone too, the process as a row of chips, as on the website (Genesis, 4 Oct 2026). */}
          {/* A smooth, steady loop rather than a row to swipe (Genesis, 6 Oct 2026: "auto scroll a little fast and smooth"). */}
          <p className="sr-only">{aiContent.avatarsIntro.lead}</p>
          <LogoMarquee
            className="-mx-6 mt-5 lg:hidden"
            speedSeconds={22}
            gapClassName="gap-2"
            fadePercent={6}
            items={DIVISION_PROCESS["AI Avatars"].map((step) => (
              <span key={step.label} aria-hidden className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-[rgb(20_18_22/0.72)] py-1.5 pl-1.5 pr-3.5 text-small text-bone">
                <GlassIcon name={step.icon} className="size-6" />
                {step.label}
              </span>
            ))}
          />

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
        {aiContent.avatarsIntro.line && (() => {
          /*
            STRAIGHT AND QUIET, NOT ON ARCS (Genesis, 5 Oct 2026: "this looks
            ugly"): the first sentence as the caption, the second as a small
            note under it, centred under the fan on every screen.
          */
          const [lead, ...rest] = aiContent.avatarsIntro.line.split(/(?<=\.)\s+/);
          return (
            <>
            {/* One line on a phone, both thoughts merged (Genesis, 6 Oct 2026). */}
            <p className="mx-auto mt-5 max-w-sm px-6 text-center text-pretty text-body leading-snug text-bone sm:hidden">
              Real people and virtual faces, built as AI avatars for brands like{" "}
              <span className="whitespace-nowrap text-brand-ink">Aditya Birla Capital.</span>
            </p>
            <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-3 px-6 text-center max-sm:hidden">
              <p className="text-balance text-body leading-snug text-bone sm:text-lead">{lead}</p>
              {rest.length ? (
                <p className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-white/[0.04] px-4 py-1.5 text-[0.8125rem] leading-snug text-ash">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" />
                  {rest.join(" ")}
                </p>
              ) : null}
            </div>
            </>
          );
        })()}
        {/*
          The "Build Your AI Avatar · one-time · Buy Now" strip came off here
          (Genesis, 2 Oct 2026): the avatar is the first card in the AI Lab
          bar below, with its price and its way on.
        */}
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
      {!onPage && <PhoneDivisionCtas vertical="ai-labs" className="mt-6" />}
      {!onPage && <PlanBar vertical="ai-labs" className="lg:!-mx-16 lg:!w-auto" />}
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