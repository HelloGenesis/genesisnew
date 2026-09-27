import Image from "next/image";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { mediaUrl } from "@/lib/media-url";
import { servicePage } from "@/lib/services";
import {
  studiosAddOns,
  studiosClosing,
  studiosEveryVideo,
  studiosHero,
  studiosHowItWorks,
  studiosPlans,
  studiosShoot,
  studiosStarter,
  studiosTurnaround,
  studiosTwoWays,
} from "@/lib/verticals/studios";
import { cn } from "@/lib/utils";
import { AddOnsBlock } from "../offer/add-ons";
import { ClosingBand, IconCards, StepsBlock, TurnaroundBlock } from "../offer/blocks";
import { CaseStudiesRow, LogoStrip, WorkSection } from "../offer/page-furniture";
import { CheckList, CollapsibleSection, OfferSection, PlanBand, SectionHead } from "../offer/parts";
import { PlanGrid } from "../offer/plan-grid";
import { VerticalHero } from "../offer/vertical-hero";
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
                  <div className="mt-6">
                    <GlassButton href={item.cta.href} variant={item.featured ? "brand" : "glass"} arrow>
                      {item.cta.label}
                    </GlassButton>
                  </div>
                </div>
                <div aria-hidden className="relative hidden min-h-full sm:block">
                  <Image src={mediaUrl(item.image)} alt="" fill sizes="16rem" className="object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-raised)] to-transparent" />
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </OfferSection>

      {/* SECTION 03 — CONTENT MONTHLY */}
      <PlanBand>
        <OfferSection>
          <PlanGrid data={studiosPlans} id="pricing" />
        </OfferSection>
      </PlanBand>

      {/* SECTION 04 — EVERY VIDEO, opened on demand */}
      <CollapsibleSection
        id="included"
        label={studiosEveryVideo.label}
        heading={studiosEveryVideo.heading}
        body={studiosEveryVideo.body}
      >
        <IconCards items={studiosEveryVideo.items} columns={3} />
      </CollapsibleSection>

      {/* SECTION 05 — STARTER BREAKDOWN, opened on demand */}
      <CollapsibleSection
        label={studiosStarter.label}
        heading={studiosStarter.heading}
        accent={studiosStarter.headingAccent}
        body={studiosStarter.body}
      >
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
      </CollapsibleSection>

      {/* SECTION 06 — HOW IT WORKS */}
      <StepsBlock data={studiosHowItWorks} id="how-it-works" />

      {/* SECTION 07 — TURNAROUND */}
      <TurnaroundBlock data={studiosTurnaround} />

      {/* Case studies, between the plans and the shoot — "Add case studies section in between". */}
      <CaseStudiesRow slugs={page.proof} heading="Content production case studies" />

      {/* SECTION 08 + 09 — CONTENT SHOOT and what every shoot includes */}
      <ContentShoot />

      {/* SECTION 10 — ADD-ONS */}
      <OfferSection>
        <AddOnsBlock data={studiosAddOns} />
      </OfferSection>

      {/* The work section — the whole library, filterable, as on the homepage. */}
      <WorkSection verticals={["All"]} showFilters />

      {/* SECTION 11 — FINAL CTA */}
      <ClosingBand data={studiosClosing} images={[...studiosHero.thumbs]} />
    </VerticalPage>
  );
}

function ContentShoot() {
  return (
    <OfferSection id="shoot" labelledBy="shoot-heading">
      <SectionHead
        id="shoot-heading"
        label={studiosShoot.label}
        heading={studiosShoot.heading}
        accent={studiosShoot.headingAccent}
        body={[studiosShoot.lead, studiosShoot.body]}
      />
      <ul className="mt-10 grid gap-4 lg:grid-cols-3">
        {studiosShoot.packages.map((pack, index) => {
          const featured = "featured" in pack && pack.featured;
          return (
            <Reveal as="li" key={pack.name} delay={0.05 * index} className="flex">
              <article
                className={cn(
                  "relative flex w-full flex-col rounded-panel p-6 sm:p-7",
                  featured
                    ? "glass glass-strong glass-lit border border-brand/60 shadow-[0_24px_64px_-24px_rgb(255_197_22/0.35)]"
                    : "glass glass-lit",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-h3 font-normal leading-none tracking-tight text-bone">{pack.name}</h3>
                  {"badge" in pack && pack.badge && (
                    <span className="rounded-full bg-brand px-3 py-1 text-micro uppercase tracking-[0.14em] text-on-brand">
                      {pack.badge}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-body text-bone">{pack.tagline}</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">{pack.price}</span>
                  <span className="text-small text-ash">{pack.gst}</span>
                </p>
                <CheckList items={pack.features} className="mt-6" />
                {"delivery" in pack && pack.delivery && (
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="micro-label">Delivery</p>
                    {pack.delivery.map((line) => (
                      <p key={line} className="mt-2 text-small text-ash">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-8">
                  <GlassButton href={pack.cta.href} variant={featured ? "brand" : "glass"} arrow className="w-full">
                    {pack.cta.label}
                  </GlassButton>
                </div>
              </article>
            </Reveal>
          );
        })}
      </ul>

      <Reveal className="glass glass-lit mt-6 flex flex-col gap-4 rounded-panel p-5 sm:p-6 lg:flex-row lg:items-center">
        <p className="shrink-0 text-body text-bone lg:max-w-44">{studiosShoot.inclusionsHeading}</p>
        <ul className="flex flex-wrap gap-2">
          {studiosShoot.inclusions.map((item) => (
            <li key={item} className="glass-chip rounded-full px-3.5 py-1.5 text-small text-ash">
              {item}
            </li>
          ))}
        </ul>
      </Reveal>
    </OfferSection>
  );
}
