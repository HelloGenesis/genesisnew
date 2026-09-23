"use client";

import { useState, type CSSProperties } from "react";

import { Sparkles } from "lucide-react";

import { AutomationSources } from "@/components/genesis/automation-diagram";
import { AutomationCtas } from "@/components/genesis/automation-ctas";
import { AvatarFan } from "@/components/genesis/avatar-fan";
import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { GlassButton } from "@/components/genesis/glass-button";
import { pagerFor } from "@/components/genesis/overlay";
import { WarpRail, type WarpItem } from "@/components/genesis/warp-rail";
import type { CaseStudy } from "@/lib/case-studies";
import { caseStudyForClip, caseStudyPathForClip } from "@/lib/case-study-pages";
import { expandToClips, reelClip, reelPoster, work } from "@/lib/work";
import { Reveal } from "@/components/genesis/reveal";
import { aiContent, services } from "@/lib/home-content";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { SectionShell } from "./section-shell";

/*
  ON A PHONE THE TWO CALLS TO ACTION SHARE ONE LINE, smaller: the same
  treatment Genesis asked for on Influence ("buttons on same line - reduce
  size"), for the same pair of buttons here. Larger screens are untouched.
*/
const MOBILE_CTA =
  "max-sm:h-10 max-sm:gap-1.5 max-sm:px-3 max-sm:text-[0.78125rem] max-sm:[&>svg:last-child]:hidden";

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
type AiCard = Omit<WarpItem, "onOpen"> & { study?: CaseStudy };

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
    };
  });

export function AiContent() {
  /*
    WHICH STUDY IS OPEN OVER THE PAGE. Same window the Studios stage cards and
    the case-study posters use — Genesis's rule is that a study opens where
    the reader already is, and this rail is the third way into one.
  */
  const [study, setStudy] = useState<CaseStudy | null>(null);
  /*
    Undefined when there is no number in site-config, exactly as the floating
    button handles it. The button falls back to the enquiry form rather than
    disappearing: "Create Your AI Avatar" is the section's primary action, and
    a section whose main CTA vanishes because a phone number is unset is worse
    than one that routes the same intent through the form.
  */
  const avatarChat = whatsappLink(siteConfig.avatarWhatsappMessage);

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
      <Reveal variant="scene" className="relative left-1/2 mt-10 w-screen -translate-x-1/2">
        <div
          style={
            {
              /*
                BIGGER AND TALLER THAN THE FIRST PASS. The cards were 15vw at
                3:4 and Genesis's read was that the whole thing looked mid
                next to the reference — half of that was the projection (see
                WarpRail) and half was simply scale. A 5:8 card at this width
                is the proportion the reference uses, and the frame is tall
                enough to hold it with the turned ones tucked behind.
              */
              /*
                THE CARD IS THE BIGGEST IT HAS BEEN, and it can be now that
                nothing comes forward: the middle card renders at exactly this
                width and every other one is smaller, so the number is a
                ceiling rather than a starting point. The cylinder versions
                had to be sized small because their edge panels were
                magnified past it.
              */
              "--warp-card": "clamp(8.5rem, 15vw, 14rem)",
              /*
                And the frame only has to hold the largest card plus a little
                air, for the same reason.
              */
              "--warp-h": "clamp(14rem, 24vw, 22rem)",
            } as CSSProperties
          }
        >
          <WarpRail
            items={AI_WORK.map((card) => ({
              ...card,
              onOpen: card.study ? () => setStudy(card.study ?? null) : undefined,
            }))}
          />
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
        <div className="mx-auto max-w-3xl px-6 text-center">
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
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
            {aiContent.avatarsIntro.lead}
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
      {/*
        THE TWO BUTTONS GENESIS SPECIFIED. "Build with AI" opened the popup
        form; they asked for the primary action to go straight to WhatsApp
        with a message already written — see siteConfig.avatarWhatsappMessage —
        which
        for an enquiry this specific is a shorter route to a human than a form
        that has to be triaged.

        The form is the fallback, not a third button: `quickContact` only
        applies when there is no chat link to give.
      */}
      <Reveal delay={0.1} className="mt-[var(--block-gap)] flex flex-nowrap justify-center gap-2 sm:flex-wrap sm:gap-3">
        <GlassButton
          href={avatarChat ?? "/#contact"}
          quickContact={avatarChat ? undefined : "ai-labs:create-an-avatar"}
          variant="brand"
          icon={<Sparkles className="size-4" />}
          arrow
          className={MOBILE_CTA}
        >
          Create Your AI Avatar
        </GlassButton>
        {/*
          Into the library, filtered — the same treatment Influence's second
          button gets. It went to /our-work unfiltered, which is "view AI
          content" landing on everything Genesis has ever made.
        */}
        {/*
          A BARE "#library", NOT "/#library", and the difference is the whole
          feature. The routed form is a client navigation to the same page:
          the section tree re-renders, the work grid comes back with its
          filter at its initial "All", and the chip this button just asked
          for is thrown away before the reader arrives. A bare hash is
          handled by SmoothScroll on capture — no navigation, so the grid
          keeps the state it was handed.
        */}
        <GlassButton
          href="#library"
          selectsFilter="AI Lab"
          variant="glass"
          arrow
          className={MOBILE_CTA}
        >
          Explore AI Work
        </GlassButton>
      </Reveal>
    </SectionShell>

      {/*
        AUTOMATION IS ITS OWN SECTION NOW, and the reason is measurement
        rather than taste. With the roster and this in one, AI Lab stood
        1734 points tall on a phone and 1968 on a laptop — two and a half
        screens, against a brief of one section to a screen, and Genesis's
        instruction was exactly that ("ek pura section ek hi page pe dikhe").
        No content moved and nothing was cut: the two halves were always two
        arguments, the avatars and the workflow, and they now get a screen
        each.
      */}
      <SectionShell id="ai-automation" tone="brand" origin="center" intensity={0.12}>
      {/*
        NO TRANSITION LINE. "AI beyond content." stood here as a hand-off into
        the automation block, on the reasoning that everything above it is
        content a brand publishes and this is software running inside a
        brand's operations. Genesis has taken it off.

        The block does not need it any more either: the heading under it
        already says "Automate the work behind your business", which names the
        turn in the same breath as the offer, where the hinge was saying it
        twice.
      */}
      <Reveal delay={0.06}>
        <div className="overflow-hidden rounded-[2rem] border border-[var(--glass-border)] bg-[var(--surface-raised)] px-5 py-[calc(var(--section-pad)*1.6)] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)] sm:px-10">
          <div className="mx-auto w-full max-w-5xl text-center">
            <h3 className="text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
              {aiContent.automation.heading}
            </h3>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
              {aiContent.automation.body}
            </p>
            {/*
              THE DIAGRAM IS CAPPED NARROWER THAN THE CARD, at 40rem rather
              than 52. An SVG scales with its width, so every rem of measure
              costs height too — 12 of them were 100 points of section that
              nothing was drawn in. See the note on this section's split.
            */}
            {/* 46rem, not 40: the board grew wider so its strands could
                read, and capping it at the old measure would only scale the
                whole thing down again. */}
            <figure className="mx-auto mt-6 max-w-[46rem] sm:mt-10">
              <AutomationSources />
            </figure>

            {/*
              THE THREE-BEAT CLOSE, MOVED UNDER THE PICTURE.

              It sat directly below the paragraph, which made the block open
              with three pieces of prose in a row before anything was shown —
              and put the section's most quotable line where a reader was
              still being told what the service is. Genesis asked for it
              between the diagram and the buttons, which is the right slot for
              what it actually is: not an introduction but a CONCLUSION. The
              diagram demonstrates the workflow, this says what the workflow
              buys, and the buttons ask for the meeting.
            */}
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-body font-medium leading-relaxed text-bone sm:mt-8 sm:text-lead">
              {aiContent.automation.kicker}
            </p>

            <AutomationCtas className="mt-6 sm:mt-8" />
          </div>
        </div>
      </Reveal>

      </SectionShell>

      {/*
        THE STUDY, OVER THE PAGE. The pager walks the rail's own cards in rail
        order, so "next" from a piece is the piece beside it rather than
        whatever is next in the case-study ordering. Cards with no study are
        not stops on that walk.
      */}
      <CaseStudyDialog
        study={study}
        onClose={() => setStudy(null)}
        pager={pagerFor(
          AI_WORK.map((card) => card.study).filter(
            (entry): entry is CaseStudy => Boolean(entry),
          ),
          AI_WORK.filter((card) => card.study).findIndex(
            (card) => card.study?.slug === study?.slug,
          ),
          (entry) => setStudy(entry),
          (entry) => entry.client,
        )}
      />
    </>
  );
}