import type { CSSProperties } from "react";

import { Sparkles } from "lucide-react";

import { AutomationSources } from "@/components/genesis/automation-diagram";
import { AvatarFan } from "@/components/genesis/avatar-fan";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { aiContent, services } from "@/lib/home-content";
import { siteConfig, whatsappLink } from "@/lib/site-config";
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
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h3
            className="ramp-text text-balance text-h2 font-normal leading-[1.05] tracking-tight sm:text-h1"
            style={{ "--ramp": "var(--ramp-avatars)" } as CSSProperties}
          >
            {aiContent.avatarsHeading} {aiContent.avatarsAccent}
          </h3>
          {/*
            PLAIN, NOT A SECOND GRADIENT. This ran --ramp-avatars-soft, which
            is the avatar ramp with the saturation taken out — a muted
            lavender-to-tan that on the dark ground reads as grey, directly
            under a heading wearing the bright version of the same gradient.
            Two gradients stacked is where the block stopped having a
            hierarchy. The heading keeps the colour; its subtitle is simply
            legible.
          */}
          <p className="mt-4 text-lead leading-relaxed text-bone/85">
            {aiContent.avatarsBody}
          </p>
        </div>

        <AvatarFan avatars={aiContent.avatars} className="mt-10 sm:mt-12" />
      </Reveal>

      {/*
        THE SECTION'S COPY, below the roster and above the buttons, where
        Genesis asked for it. It reads better here than it did in the header:
        above the fan it was a claim made before anything was shown, and here
        it is the caption on seven faces the reader has just looked at.
      */}
      <Reveal delay={0.05} className="mt-6">
        <p className="mx-auto max-w-2xl text-pretty text-center text-body leading-relaxed text-ash sm:text-lead">
          {aiContent.body}
        </p>
      </Reveal>

      {/*
        THE SECOND CLAIM, set as its own small block rather than run into the
        paragraph above. The two are different promises — what the avatars are,
        then what the service does month after month — and joined into one
        paragraph the second disappeared into the first.
      */}
      <Reveal delay={0.08} className="mt-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-h3 font-medium leading-tight tracking-tight text-bone">
            {aiContent.promise.heading}
          </p>
          <p className="mt-2 text-body leading-relaxed text-ash">
            {aiContent.promise.line}
          </p>
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
        AI-POWERED AUTOMATION — the third and largest claim in this section.

        ONE DIAGRAM, NOT TWO. Genesis supplied two references and asked for
        both; they have since asked for the workflow graph — Brief, Generate,
        Human review, Adapt, Publish — to come out. So the converging-sources
        picture stands alone, which is the half that says what the automation
        is FED, and the copy above it carries the rest.

        The panel keeps its own ground and border because it is still an
        exhibit rather than a loose graphic; what it no longer needs is the
        divider that separated the pair.
      */}
      <Reveal delay={0.12} className="mt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-balance text-h3 font-medium leading-tight tracking-tight text-bone sm:text-h2">
            {aiContent.automation.heading}
          </h3>
          <p className="mt-4 text-pretty text-body leading-relaxed text-ash sm:text-lead">
            {aiContent.automation.body}
          </p>
        </div>

        <div className="glass glass-lit mx-auto mt-10 max-w-3xl overflow-hidden rounded-panel">
          <figure className="px-4 pb-7 pt-7 sm:px-9 sm:pb-9 sm:pt-9">
            <AutomationSources />
            <figcaption className="mt-3 text-center text-small text-ash">
              {aiContent.automation.sourcesCaption}
            </figcaption>
          </figure>
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
      <Reveal delay={0.1} className="mt-12 flex flex-wrap justify-center gap-3">
        <GlassButton
          href={avatarChat ?? "/#contact"}
          quickContact={avatarChat ? undefined : "ai-labs:create-an-avatar"}
          variant="brand"
          icon={<Sparkles className="size-4" />}
          arrow
        >
          Create Your AI Avatar
        </GlassButton>
        {/*
          Into the library, filtered — the same treatment Influence's second
          button gets. It went to /our-work unfiltered, which is "view AI
          content" landing on everything Genesis has ever made.
        */}
        <GlassButton href="/our-work?filter=AI+Content" variant="glass" arrow>
          View AI Content
        </GlassButton>
      </Reveal>
    </SectionShell>
  );
}
