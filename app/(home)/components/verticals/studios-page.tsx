import Image from "next/image";

import { Reveal } from "@/components/genesis/reveal";
import { mediaUrl } from "@/lib/media-url";
import { servicePage } from "@/lib/services";
import {
  studiosClosing,
  studiosEveryVideo,
  studiosHero,
  studiosHowItWorks,
  studiosPlans,
  studiosStarter,
  studiosTurnaround,
} from "@/lib/verticals/studios";
import { ClosingBand, IconCards, StepsBlock, TurnaroundBlock } from "../offer/blocks";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { CheckList, OfferSection, PlanBand, PlanDetails } from "../offer/parts";
import { PlanGrid } from "../offer/plan-grid";
import { OneTimeProducts } from "../offer/starter-pack";
import { WorkMode } from "../offer/work-mode";
import { divisionMenu } from "@/lib/home-content";
import { Studios } from "../studios";
import { PlugHeadline } from "../offer/plug-headline";
import { VerticalHero } from "../offer/vertical-hero";
import { VideoRail } from "../offer/video-rail";
import { BuySteps } from "../offer/buy-steps";
import { PricingHead } from "../offer/pricing-head";
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
        /* The same video rail as AI Labs, with Studios' shoot work. */
        visual={
          <div>
            <p aria-hidden className="mb-4 -rotate-2 font-serif text-lead italic text-bone/80">
              {studiosHero.note}
            </p>
            <VideoRail videos={studiosHero.videos} label="Genesis Studios work" />
          </div>
        }
      />

      {/*
        THE DIVISION'S HOMEPAGE SECTION, under the hero, without its header
        or plan bar (Genesis, 2 Oct 2026) — see `onPage`.
      */}
      <Studios onPage />

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
              oneTime={<OneTimeProducts vertical="studios" bare />}
              membership={
                <>
                  <PlanGrid data={studiosPlans} vertical="studios" />
                  <PlanDetails id="included" title="What every video includes" summary={`${studiosEveryVideo.heading} ${studiosEveryVideo.body.join(" ")}`}>
                    <IconCards items={studiosEveryVideo.items} columns={3} />
                  </PlanDetails>
                  <PlanDetails title={`${studiosStarter.heading} ${studiosStarter.headingAccent}`} summary={studiosStarter.body[0]}>
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                      <IconCards items={studiosStarter.items} columns={3} className="lg:grid-cols-3" />
                      <Reveal className="glass glass-lit relative overflow-hidden rounded-panel p-6">
                        <Image
                          src={mediaUrl(studiosStarter.image)}
                          alt=""
                          fill
                          sizes="20rem"
                          className="object-cover opacity-25"
                        />
                        <div className="relative">
                          <p className="micro-label">{studiosStarter.includesHeading}</p>
                          <p className="mt-3 font-display text-lead text-bone">{studiosStarter.includesLead}</p>
                          <p className="mt-1 text-small text-ash">{studiosStarter.includesSub}</p>
                          <CheckList items={studiosPlans.included?.items ?? []} className="mt-4 [&_li]:text-small" />
                        </div>
                      </Reveal>
                    </div>
                  </PlanDetails>
                </>
              }
            />
            {/* How it works, from paying to publishing, under the cards (Genesis, 2 Oct 2026). */}
            <BuySteps className="mt-10" />
          </div>
        </OfferSection>
      </PlanBand>

      {/* SECTION 06 — HOW IT WORKS */}
      <StepsBlock data={studiosHowItWorks} id="how-it-works" />

      {/* SECTION 07 — TURNAROUND */}
      <TurnaroundBlock data={studiosTurnaround} />

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
    </VerticalPage>
  );
}

