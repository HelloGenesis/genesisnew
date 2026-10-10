import { servicePage } from "@/lib/services";
import { WorkHead } from "@/components/genesis/work-warp";
import {
  aiFaqs,
  aiHowItWorks,
  aiHero,
} from "@/lib/verticals/ai-labs";
import { StepsBlock } from "../offer/blocks";
import { FaqBlock } from "../offer/blocks";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { divisionMenu } from "@/lib/home-content";
import { AiContent, AiLabDiagram } from "../ai-content";
import { PlugHeadline } from "../offer/plug-headline";
import { VerticalHero } from "../offer/vertical-hero";
import { PricingHead } from "../offer/pricing-head";
import { PlanBar } from "../plan-bar";
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
        visual={<AiLabDiagram fit interactive className="lg:-ml-4 lg:-mr-[clamp(2.5rem,calc((100vw-80rem)/2+1.5rem),5rem)]" />}
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
      {/*
        THE HOMEPAGE'S PLAN BOX IN PLACE OF THE PRICING SECTION (Genesis, 6 Oct
        2026: "add this same section, replacing the pricing section on all
        verticals"): the plans and products, the case studies and how it
        works, in one box. The details each plan carries are in its pop-up.
      */}
      {/* Full width, the column inside: the page paints each section only within its own box, so a narrow section cut the plan box's glow (Genesis, 6 Oct 2026: "fix glow"). */}
      <section id="pricing" aria-labelledby="pricing-heading" className="w-full scroll-mt-24 py-[var(--section-pad)]">
        <div className="mx-auto w-full max-w-7xl px-6">
        <PricingHead id="pricing-heading" />
        <PlanBar vertical="ai-labs" onPage />
        </div>
      </section>

      {/* How it works, back as a bento of its own under the plans (Genesis, 6 Oct 2026). */}
      <StepsBlock data={aiHowItWorks} id="how-it-works" />

      {/* Turnaround is in each plan's pricing pop-up, so not repeated here (Genesis, 5 Oct 2026). */}

      <WorkSection verticals={["AI Lab"]} />

      <FaqBlock heading={aiFaqs.heading} items={aiFaqs.items} />
    </VerticalPage>
  );
}
