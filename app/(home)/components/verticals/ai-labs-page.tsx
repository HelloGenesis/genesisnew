import Image from "next/image";

import { Reveal } from "@/components/genesis/reveal";
import { mediaUrl } from "@/lib/media-url";
import { servicePage } from "@/lib/services";
import {
  aiClosing,
  aiCreatives,
  aiEveryVideo,
  aiFaqs,
  aiFormats,
  aiHero,
  aiHowItWorks,
  aiPlans,
  aiTurnaround,
  aiVideoTiers,
} from "@/lib/verticals/ai-labs";
import { ClosingBand, FaqBlock, IconCards, StepsBlock, TurnaroundBlock, VideoTiers } from "../offer/blocks";
import { FormatShowcase } from "../offer/format-showcase";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { PlanDetails, OfferSection, PlanBand, SectionHead } from "../offer/parts";
import { PlanGrid } from "../offer/plan-grid";
import { OneTimeProducts } from "../offer/starter-pack";
import { SubscriptionOnly, WorkMode } from "../offer/work-mode";
import { divisionMenu } from "@/lib/home-content";
import { AiContent, AiLabDiagram } from "../ai-content";
import { PlugHeadline } from "../offer/plug-headline";
import { VerticalHero } from "../offer/vertical-hero";
import { VideoRail } from "../offer/video-rail";
import { BuySteps } from "../offer/buy-steps";
import { PricingHead } from "../offer/pricing-head";
import { VerticalPage } from "../offer/vertical-page";

const page = servicePage("ai-content-automation");

/**
 * /ai-content-automation — Genesis AI Labs, the AI Content Studio, in the
 * brief's nine sections plus its FAQs: hero, the formats, the memberships,
 * what every video includes, campaign creatives, how it works, turnaround,
 * the one-time products, the work, the closing band.
 */
export function AiLabsPageView() {
  return (
    <VerticalPage page={page} current="ai-labs"
      jump={[
        { id: "formats", label: "Formats" },
        { id: "pricing", label: "Plans" },
        { id: "included", label: "Every video", mode: "membership" },
        { id: "video-types", label: "Video types", mode: "membership" },
        { id: "how-it-works", label: "How it works" },
        { id: "library", label: "Work" },
        { id: "faq", label: "FAQs" },
      ]}>
      <VerticalHero
        label={aiHero.label}
        heading={<PlugHeadline division="AI Lab" services={divisionMenu("/ai-content-automation")} className="mt-5" />}
        strip={divisionMenu("/ai-content-automation")}
        images={aiHero.images}
        /* A rail of Genesis's own AI clips in place of the photo collage. */
        visual={
          <div>
            <p aria-hidden className="mb-4 -rotate-2 font-serif text-lead italic text-bone/80">
              {aiHero.note}
            </p>
            <VideoRail videos={aiHero.videos} />
          </div>
        }
      />

      {/*
        THE DIVISION'S HOMEPAGE SECTION, under the hero, without its header
        or plan bar (Genesis, 2 Oct 2026) — see `onPage`.
      */}
      <AiContent onPage />

      <LogoStrip />

      {/* The AI Lab diagram, under the logos (Genesis, 2 Oct 2026). */}
      <OfferSection className="pt-0">
        <AiLabDiagram />
      </OfferSection>

      {/* SECTION 2 — SHOW THE OUTPUT */}
      <OfferSection id="formats" labelledBy="formats-heading">
        <FormatShowcase
          label={aiFormats.label}
          items={aiFormats.items}
          headerSlot={
            <SectionHead
              id="formats-heading"
              label={aiFormats.label}
              heading={aiFormats.heading}
              accent={aiFormats.headingAccent}
              body={aiFormats.body}
              align="left"
            />
          }
        />
      </OfferSection>

      {/*
        SECTION 3 — PRICING, with what the plans buy folded underneath:
        what every video includes and what separates the video types.
      */}
      <PlanBand>
        <OfferSection>
          {/*
            "CHOOSE HOW YOU WANT TO WORK" — the same switch as /pricing
            (Genesis, 28 Sep 2026): memberships on one side, the division's
            one-time products on the other. The anchor sits on the wrapper so
            "#pricing" lands here whichever side is showing.
          */}
          {/* "View Pricing" lands on the head, so it is inside the anchor. */}
          <div id="pricing" className="scroll-mt-24">
            <PricingHead />
            <WorkMode
              oneTime={<OneTimeProducts vertical="ai-labs" bare />}
              membership={
                <>
                  <PlanGrid data={aiPlans} vertical="ai-labs" />
                  <PlanDetails id="included" title="What every video includes" summary={`${aiEveryVideo.heading} ${aiEveryVideo.body}`}>
                    <IconCards items={aiEveryVideo.items} />
                  </PlanDetails>
                  <PlanDetails id="video-types" title={aiVideoTiers.heading}>
                    <VideoTiers data={aiVideoTiers} bare />
                  </PlanDetails>
                </>
              }
            />
            {/* How it works, from paying to publishing, under the cards (Genesis, 2 Oct 2026). */}
            <BuySteps className="mt-10" />
          </div>
        </OfferSection>
      </PlanBand>

      {/* SECTION 5 — CAMPAIGN CREATIVES */}
      <OfferSection labelledBy="creatives-heading">
        <SectionHead
          id="creatives-heading"
          label={aiCreatives.label}
          heading={aiCreatives.heading}
          accent={aiCreatives.headingAccent}
          body={[aiCreatives.body, aiCreatives.support]}
        />
        <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {aiCreatives.items.map((item, index) => (
            <Reveal as="li" key={item.title} delay={0.04 * index}>
              <div className="group relative aspect-square overflow-hidden rounded-card border border-[var(--glass-border)] bg-ink">
                <Image
                  src={mediaUrl(item.image)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 12rem, (min-width: 768px) 30vw, 45vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="font-sans mt-3 text-body leading-snug text-bone">{item.title}</h3>
              <p className="mt-1 text-pretty text-small leading-relaxed text-ash">{item.body}</p>
            </Reveal>
          ))}
        </ul>
        {/* What each plan carries a month: a subscription detail, so only on that side. */}
        <SubscriptionOnly>
        <Reveal className="glass-chip mt-8 inline-flex flex-wrap items-center gap-x-5 gap-y-2 rounded-full px-5 py-2.5">
          <span className="text-small text-faint">{aiCreatives.monthlyLabel}</span>
          {aiCreatives.monthly.map((row) => (
            <span key={row.plan} className="flex items-baseline gap-2 text-small text-ash">
              {row.plan}
              <span className="font-display text-lead text-bone">{row.value}</span>
            </span>
          ))}
        </Reveal>
        </SubscriptionOnly>
      </OfferSection>

      {/* SECTION 6 — HOW IT WORKS */}
      <StepsBlock data={aiHowItWorks} id="how-it-works" />

      {/* SECTION 7 — TURNAROUND */}
      <TurnaroundBlock data={aiTurnaround} />

      <WorkSection verticals={["AI Lab"]} />

      {/* SECTION 9 — FINAL CTA */}
      <ClosingBand
        data={aiClosing}
        images={["/work/posters/ai-lab-tanvi-uiiui.jpg", "/avatars/diya.jpg", "/work/posters/36.jpg"]}
      />

      <FaqBlock heading={aiFaqs.heading} items={aiFaqs.items} />
    </VerticalPage>
  );
}
