import Image from "next/image";

import { GlassButton } from "@/components/genesis/glass-button";
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
  studiosTwoWays,
} from "@/lib/verticals/studios";
import { cn } from "@/lib/utils";
import { ClosingBand, IconCards, StepsBlock, TurnaroundBlock } from "../offer/blocks";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { CheckList, OfferSection, PlanBand, PlanDetails, SectionHead } from "../offer/parts";
import { PlanGrid, ShootChip } from "../offer/plan-grid";
import { OneTimeProducts } from "../offer/starter-pack";
import { WorkMode } from "../offer/work-mode";
import { VerticalHero } from "../offer/vertical-hero";
import { VideoRail } from "../offer/video-rail";
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
      primary={{ label: "See plans", href: "#pricing" }}
      jump={[
        { id: "pricing", label: "Monthly plans" },
        { id: "included", label: "Every video" },
        { id: "how-it-works", label: "How it works" },
        { id: "case-studies", label: "Case studies" },
        { id: "shoot", label: "Content shoot" },
        { id: "library", label: "Work" },
      ]}>
      <VerticalHero
        label={studiosHero.label}
        lines={[studiosHero.heading]}
        accent={studiosHero.headingAccent}
        lead={studiosHero.lead}
        body={studiosHero.body}
        primary={{ label: studiosHero.primary, href: "#pricing" }}
        secondary={{ label: studiosHero.secondary, href: "#shoot" }}
        strip={studiosHero.strip}
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

      <LogoStrip />

      {/* "A small work content slider gallery here, which will only have shoot work." */}
      <WorkSection
        id="shoot-work"
        verticals={SHOOT_WORK}
        label="Shoot work"
        heading=""
        cta={false}
      />

      {/* SECTION 02 — TWO WAYS TO CREATE */}
      <OfferSection labelledBy="two-ways-heading">
        <SectionHead
          id="two-ways-heading"
          label={studiosTwoWays.label}
          heading={studiosTwoWays.heading}
          body={studiosTwoWays.body}
        />
        <ul className="mt-10 grid gap-4 lg:grid-cols-2">
          {studiosTwoWays.items.map((item, index) => (
            <Reveal as="li" key={item.name} delay={0.06 * index} className="flex">
              <article
                className={cn(
                  "relative grid w-full overflow-hidden rounded-panel sm:grid-cols-[1.2fr_0.8fr]",
                  item.featured ? "glass glass-strong glass-lit border border-brand/50" : "glass glass-lit",
                )}
              >
                <div className="relative z-[1] flex flex-col p-6 sm:p-8">
                  <p className="font-display text-lead text-brand-ink">{item.index}</p>
                  <h3 className="mt-3 font-display text-h3 font-normal leading-tight tracking-tight text-bone">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-body text-bone">{item.tagline}</p>
                  {item.body.map((line) => (
                    <p key={line} className="mt-3 text-pretty text-small leading-relaxed text-ash">
                      {line}
                    </p>
                  ))}
                  <CheckList items={item.points} className="mt-5" />
                  <p className="mt-6 font-display text-lead text-bone">{item.from}</p>
                  {"inPerson" in item && item.inPerson && <ShootChip className="mt-2 self-start" />}
                  <div className="mt-6">
                    <GlassButton href={item.cta.href} variant={item.featured ? "brand" : "glass"} arrow>
                      {item.cta.label}
                    </GlassButton>
                  </div>
                </div>
                {/*
                  GENESIS'S ILLUSTRATIONS, in place of the photographs (28 Sep
                  2026) — drawn in the site's own palette, so they sit on the
                  card's ground over a soft violet-to-amber glow rather than
                  in a cropped photo frame. First on a phone, where the
                  photo column used to disappear altogether.
                */}
                <div
                  aria-hidden
                  className="relative order-first flex min-h-[15rem] items-center justify-center overflow-hidden p-6 sm:order-none sm:min-h-full"
                >
                  <span
                    className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
                    style={{
                      background:
                        "radial-gradient(circle, rgb(255 179 92 / 0.45) 0%, rgb(247 120 143 / 0.28) 40%, rgb(139 92 246 / 0.22) 65%, transparent 75%)",
                    }}
                  />
                  <Image
                    src={item.art.src}
                    alt=""
                    width={item.art.width}
                    height={item.art.height}
                    sizes="(min-width: 1024px) 18rem, (min-width: 640px) 40vw, 70vw"
                    className="relative h-auto max-h-[22rem] w-full max-w-[18rem] object-contain drop-shadow-[0_24px_40px_rgb(0_0_0/0.45)]"
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </OfferSection>

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
          <div id="pricing" className="scroll-mt-24">
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

