import { servicePage } from "@/lib/services";
import { WorkHead } from "@/components/genesis/work-warp";
import {
  aiEveryVideo,
  aiFaqs,
  aiHero,
  aiHowItWorks,
  aiPlans,
  aiTurnaround,
  aiVideoTiers,
} from "@/lib/verticals/ai-labs";
import { FaqBlock, IconCards, StepsBlock, TurnaroundBlock, VideoTiers } from "../offer/blocks";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { PlanDetails, OfferSection, PlanBand } from "../offer/parts";
import { BillingProvider, PlanGrid, SharedBillingNote, SharedBillingToggle } from "../offer/plan-grid";
import { OneTimeProducts } from "../offer/starter-pack";
import { WorkMode } from "../offer/work-mode";
import { divisionMenu } from "@/lib/home-content";
import { AiContent, AiLabDiagram } from "../ai-content";
import { PlugHeadline } from "../offer/plug-headline";
import { VerticalHero } from "../offer/vertical-hero";
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
        { id: "pricing", label: "Plans" },
        { id: "included", label: "Every video", mode: "membership" },
        { id: "video-types", label: "Video types", mode: "membership" },
        { id: "how-it-works", label: "How it works" },
        { id: "library", label: "Work" },
        { id: "faq", label: "FAQs" },
      ]}>
      <VerticalHero
        label={aiHero.label}
        heading={<PlugHeadline division="AI Lab" services={divisionMenu("/ai-content-automation")} className="mt-5 max-sm:mt-0" />}
        strip={divisionMenu("/ai-content-automation")}
        images={aiHero.images}
        /*
          THE AI LAB DIAGRAM, the tools plugged into the lab, in place of the
          clip rail (Genesis, 4 Oct 2026: "add this element replacing the
          gallery/slider on this section"); it no longer sits under the logos.
        */
        /* A bit bigger (Genesis, 4 Oct 2026): it reaches past the column into the margin. */
        fitPhone
        visual={<AiLabDiagram fit className="lg:-ml-4 lg:-mr-[clamp(2.5rem,calc((100vw-80rem)/2+1.5rem),5rem)]" />}
      />

      {/*
        THE DIVISION'S HOMEPAGE SECTION, under the hero, without its header
        or plan bar (Genesis, 2 Oct 2026) — see `onPage`.
      */}
      {/* Section 2's head, as on every division page (Genesis, 4 Oct 2026). */}
      <WorkHead />
      <AiContent onPage />

      {/* The formats, the creatives and the closing band are gone (Genesis, 4 Oct 2026: "remove these"). */}
      <LogoStrip />

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
            {/* The billing switch beside the work-mode switch, centred (Genesis, 4 Oct 2026). */}
            <BillingProvider>
            <WorkMode
              controls={<SharedBillingToggle />}
              note={<SharedBillingNote />}
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
            </BillingProvider>
            {/* How it works, from paying to publishing, under the cards (Genesis, 2 Oct 2026). */}
            <BuySteps className="mt-10" />
          </div>
        </OfferSection>
      </PlanBand>

      {/* SECTION 6 — HOW IT WORKS */}
      <StepsBlock data={aiHowItWorks} id="how-it-works" />

      {/* SECTION 7 — TURNAROUND */}
      <TurnaroundBlock data={aiTurnaround} />

      <WorkSection verticals={["AI Lab"]} />

      <FaqBlock heading={aiFaqs.heading} items={aiFaqs.items} />
    </VerticalPage>
  );
}
