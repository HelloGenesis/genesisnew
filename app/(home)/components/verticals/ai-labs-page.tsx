import Image from "next/image";

import { Reveal } from "@/components/genesis/reveal";
import { mediaUrl } from "@/lib/media-url";
import { servicePage } from "@/lib/services";
import {
  aiAddOns,
  aiClosing,
  aiCreatives,
  aiEveryVideo,
  aiFaqs,
  aiFormats,
  aiHero,
  aiHowItWorks,
  aiPlans,
  aiTurnaround,
} from "@/lib/verticals/ai-labs";
import { AddOnsBlock } from "../offer/add-ons";
import { ClosingBand, FaqBlock, IconCards, StepsBlock, TurnaroundBlock } from "../offer/blocks";
import { MediaRail } from "../offer/media-rail";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { CollapsibleSection, OfferSection, PlanBand, SectionHead } from "../offer/parts";
import { PlanGrid } from "../offer/plan-grid";
import { VerticalHero } from "../offer/vertical-hero";
import { VerticalPage } from "../offer/vertical-page";

const page = servicePage("ai-content-automation");

/**
 * /ai-content-automation — Genesis AI Labs, the AI Content Studio, in the
 * brief's nine sections plus its FAQs: hero, the formats, the memberships,
 * what every video includes, campaign creatives, how it works, turnaround,
 * add-ons, the work, the closing band.
 */
export function AiLabsPageView() {
  return (
    <VerticalPage page={page} current="ai-labs"
      primary={{ label: "See plans", href: "#pricing" }}
      jump={[
        { id: "formats", label: "Formats" },
        { id: "pricing", label: "Plans" },
        { id: "included", label: "Every video" },
        { id: "how-it-works", label: "How it works" },
        { id: "library", label: "Work" },
        { id: "faq", label: "FAQs" },
      ]}>
      <VerticalHero
        label={aiHero.label}
        lines={[aiHero.heading]}
        accent={aiHero.headingAccent}
        lead={aiHero.lead}
        body={aiHero.body}
        primary={{ label: aiHero.primary, href: "#pricing" }}
        secondary={{ label: aiHero.secondary, href: "#library" }}
        strip={aiHero.trust}
        images={aiHero.images}
        note={aiHero.note}
      />

      <LogoStrip />

      {/* SECTION 2 — SHOW THE OUTPUT */}
      <OfferSection id="formats" labelledBy="formats-heading">
        <MediaRail
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

      {/* SECTION 3 — PRICING */}
      <PlanBand>
        <OfferSection>
          <PlanGrid data={aiPlans} id="pricing" />
        </OfferSection>
      </PlanBand>

      {/* SECTION 4 — WHAT EVERY VIDEO INCLUDES, opened on demand */}
      <CollapsibleSection
        id="included"
        label={aiEveryVideo.label}
        heading={aiEveryVideo.heading}
        body={aiEveryVideo.body}
      >
        <IconCards items={aiEveryVideo.items} />
      </CollapsibleSection>

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
        <Reveal className="glass-chip mt-8 inline-flex flex-wrap items-center gap-x-5 gap-y-2 rounded-full px-5 py-2.5">
          <span className="text-small text-faint">{aiCreatives.monthlyLabel}</span>
          {aiCreatives.monthly.map((row) => (
            <span key={row.plan} className="flex items-baseline gap-2 text-small text-ash">
              {row.plan}
              <span className="font-display text-lead text-bone">{row.value}</span>
            </span>
          ))}
        </Reveal>
      </OfferSection>

      {/* SECTION 6 — HOW IT WORKS */}
      <StepsBlock data={aiHowItWorks} id="how-it-works" />

      {/* SECTION 7 — TURNAROUND */}
      <TurnaroundBlock data={aiTurnaround} />

      {/* SECTION 8 — ADD-ONS */}
      <OfferSection>
        <AddOnsBlock data={aiAddOns} />
      </OfferSection>

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
