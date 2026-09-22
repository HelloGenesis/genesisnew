import type { CSSProperties } from "react";

import { Sparkles } from "lucide-react";

import { AutomationSources } from "@/components/genesis/automation-diagram";
import { AutomationCtas } from "@/components/genesis/automation-ctas";
import { AvatarFan } from "@/components/genesis/avatar-fan";
import { GlassButton } from "@/components/genesis/glass-button";
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

export function AiContent() {
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
          <h3
            className="ramp-text text-balance text-h2 font-normal leading-[1.05] tracking-tight sm:text-h1"
            style={{ "--ramp": "var(--ramp-avatars)" } as CSSProperties}
          >
            {aiContent.avatarsIntro.heading}
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
          THE LINE SITS UNDER THE ROSTER, at Genesis's request. Above it, it
          was a third line of introduction before anything had been shown;
          under the faces it reads as the caption to them, which is the job
          that sentence is doing — the same move Brand & Design's standfirst
          made for the same reason.
        */}
        <p className="mx-auto mt-4 max-w-2xl px-6 text-center text-body leading-relaxed text-ash sm:text-lead">
          {aiContent.avatarsIntro.line}
        </p>
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
          View AI Work
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
        "AI BEYOND CONTENT." — the hinge, and the reason this block reads as
        part of AI Lab rather than as a service that wandered in.

        Everything above it is content a brand publishes; this is software
        running inside a brand's operations, and without a sentence marking
        the turn a reader has to work out for themselves why the two are
        filed together. Genesis asked for a transition rather than a second
        heading, so it is set small and quiet above the card — a hand-off,
        not a title.
      */}
      <Reveal className="mb-6 text-center sm:mb-8">
        <p className="text-balance text-lead font-normal italic text-brand-ink sm:text-h3">
          {aiContent.automation.transition}
        </p>
      </Reveal>
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
    </>
  );
}