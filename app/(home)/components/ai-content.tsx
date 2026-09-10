import type { CSSProperties } from "react";

import { Sparkles } from "lucide-react";

import { AutomationSources } from "@/components/genesis/automation-diagram";
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
    <SectionShell
      id="ai-lab"
      division={{
        name: "AI Lab",
        tagline: services.items[3].caption,
        ramp: services.items[3].ramp,
      }}
      /*
        NO `body` HERE. The section's copy used to sit in the header beside
        the lockup; Genesis asked for it below the avatars and above the
        buttons, which is where it now renders — see further down. Passing it
        here as well would print it twice.
      */
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
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
            {aiContent.avatarsIntro.lead}
          </p>

          {/*
            The second claim, a step down from the first. It was the h1 here
            and is now a sub-heading, which is the demotion that lets the line
            above it read as the section's title.
          */}
          <p className="mt-10 text-balance text-h3 font-medium leading-tight tracking-tight text-bone">
            {aiContent.avatarsIntro.promise}
          </p>
          <p className="mt-3 text-body leading-relaxed text-ash sm:text-lead">
            {aiContent.avatarsIntro.line}
          </p>
        </div>

        <AvatarFan avatars={aiContent.avatars} className="mt-10 sm:mt-12" />
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
      <Reveal delay={0.12} className="mt-20">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--glass-border)] bg-[var(--surface-raised)] px-6 py-14 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)] sm:px-10 sm:py-16 lg:py-20">
          <div className="mx-auto w-full max-w-5xl text-center">
            <h3 className="text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
              {aiContent.automation.heading}
            </h3>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
              {aiContent.automation.body}
            </p>

            <figure className="mx-auto mt-12 max-w-[52rem] sm:mt-16">
              <AutomationSources />
            </figure>
          </div>
        </div>
      </Reveal>

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
      <Reveal delay={0.1} className="mt-12 flex flex-nowrap justify-center gap-2 sm:flex-wrap sm:gap-3">
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
        <GlassButton href="/#library" variant="glass" arrow className={MOBILE_CTA}>
          View AI Content
        </GlassButton>
      </Reveal>
    </SectionShell>
  );
}
