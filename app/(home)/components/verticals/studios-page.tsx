
import { WorkHead, WorkWarp } from "@/components/genesis/work-warp";
import { servicePage } from "@/lib/services";
import {
  studiosClosing,
  studiosHero,
  studiosHowItWorks,
} from "@/lib/verticals/studios";
import { ClosingBand, StepsBlock } from "../offer/blocks";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { divisionMenu } from "@/lib/home-content";
import { PlugHeadline } from "../offer/plug-headline";
import { VerticalHero } from "../offer/vertical-hero";
import { StudiosPipeline } from "@/components/genesis/studios-pipeline";
import { PricingHead } from "../offer/pricing-head";
import { PlanBar } from "../plan-bar";
import { FaqBlock } from "../offer/blocks";
import { VerticalPage } from "../offer/vertical-page";

const page = servicePage("content-production");

/** Studios' shoot work: its own films and the event films it shot. */
const SHOOT_WORK = ["Studios", "Events"];

/**
 * /content-production — Genesis Studios, in the brief's eleven sections, with
 * the three additions it asks for around them: the logo row, a small slider
 * of shoot work only, and the case studies and work sections.
 */
export function StudiosPageView() {
  return (
    <VerticalPage page={page} current="studios"
      jump={[
        { id: "pricing", label: "Monthly plans" },
        { id: "included", label: "Every video", mode: "membership" },
        { id: "how-it-works", label: "How it works" },
        { id: "case-studies", label: "Case studies" },
        { id: "shoot", label: "Content shoot" },
        { id: "library", label: "Work" },
      ]}>
      <VerticalHero
        label={studiosHero.label}
        heading={<PlugHeadline division="Studios" services={divisionMenu("/content-production")} className="mt-5" />}
        strip={divisionMenu("/content-production")}
        images={[
          { src: studiosHero.image },
          ...studiosHero.thumbs.map((src) => ({ src })),
        ]}
        note={studiosHero.note}
        /*
          THE BRIEF-TO-FINAL-CUT STAGES BESIDE THE HEADLINE, IN A GLASS CARD
          (Genesis, 4 Oct 2026: "replace this element from section 2 to
          section one, the gallery I asked you to remove; put it inside a
          bento grid"). The gallery is gone; the stages are the picture.
        */
        visual={
          <div className="rounded-panel border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 shadow-[var(--shadow-panel)] backdrop-blur-[14px] sm:p-5">
            <p aria-hidden className="mb-3 font-serif text-lead italic text-bone/80">
              From brief to <span className="text-brand-ink">final cut.</span>
            </p>
            <StudiosPipeline bare />
          </div>
        }
      />

      {/* SECTION 2: the division's work, in the curved rail every page shares (Genesis, 4 Oct 2026). */}
      <section className="pb-[var(--section-pad)]">
        <WorkHead />
        <WorkWarp divisions={["Studios", "Events"]} />
      </section>

      <LogoStrip />

      {/* "A small work content slider gallery here, which will only have shoot work." */}
      <WorkSection
        id="shoot-work"
        verticals={SHOOT_WORK}
        label="Shoot work"
        heading=""
        cta={false}
      />

      {/*
        SECTION 03 — CONTENT MONTHLY, with what the plans buy folded under
        them: what every video includes and the Starter breakdown.
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
        <PlanBar vertical="studios" onPage />
        </div>
      </section>

      {/* SECTION 06 — HOW IT WORKS */}
      <StepsBlock data={studiosHowItWorks} id="how-it-works" />

      {/* Turnaround is in each plan's pricing pop-up, so not repeated here (Genesis, 5 Oct 2026). */}

      {/*
        Case studies, between the plans and the shoot — "Add case studies
        section in between". Now the homepage's own section, the whole
        library with its division filters (Genesis, 28 Sep 2026: "add the
        homepage case studies section over here"), moved up from the foot of
        the page rather than shown twice.
      */}
      <WorkSection verticals={["All"]} showFilters />

      {/* SECTION 11 — FINAL CTA */}
      <ClosingBand data={studiosClosing} images={[...studiosHero.thumbs]} />
      {/* The division's questions (Genesis, 6 Oct 2026: "FAQs are missing on the vertical pages"). */}
      <FaqBlock heading="Genesis Studios: FAQs" items={page.faqs.map((faq) => ({ q: faq.question, a: [faq.answer] }))} />
    </VerticalPage>
  );
}

