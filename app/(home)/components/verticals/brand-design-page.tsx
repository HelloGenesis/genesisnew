import Image from "next/image";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { mediaUrl } from "@/lib/media-url";
import { servicePage } from "@/lib/services";
import {
  brandBuild,
  deskHref,
  designAddOns,
  designClosing,
  designHero,
  designHowItWorks,
  designIncluded,
  designOverview,
  designProducts,
  designTurnaround,
} from "@/lib/verticals/brand-design";
import { cn } from "@/lib/utils";
import { AddOnsBlock } from "../offer/add-ons";
import { ClosingBand, StepsBlock, TurnaroundStrip } from "../offer/blocks";
import { IconTile } from "../offer/icons";
import { CaseStudiesRow, LogoStrip, WorkSection } from "../offer/page-furniture";
import { CheckList, OfferSection, PlanBand, SectionHead } from "../offer/parts";
import { VerticalHero } from "../offer/vertical-hero";
import { VerticalPage } from "../offer/vertical-page";

const page = servicePage("brand-design");

/**
 * /brand-design — Genesis Brand & Design, in the brief's nine sections, plus
 * the logo row and the case study it asks for.
 */
export function BrandDesignPageView() {
  return (
    <VerticalPage page={page} current="brand-design"
      primary={{ label: "See plans", href: "#pricing" }}
      jump={[
        { id: "pricing", label: "Plans" },
        { id: "included", label: "What's included" },
        { id: "how-it-works", label: "How it works" },
        { id: "overview", label: "Plan overview" },
        { id: "brand-build", label: "Brand Build" },
        { id: "case-studies", label: "Case studies" },
      ]}>
      <VerticalHero
        label={designHero.label}
        lines={[designHero.heading, designHero.headingLine2]}
        accent={designHero.headingAccent}
        lead={designHero.lead}
        body={designHero.body}
        primary={{ label: designHero.primary, href: deskHref }}
        secondary={{ label: designHero.secondary, href: "#brand-build" }}
        strip={designHero.strip}
        images={designHero.images.map((src) => ({ src }))}
      />

      <LogoStrip />

      {/* SECTION 02 — TWO WAYS TO WORK WITH US */}
      <PlanBand>
      <OfferSection id="pricing" labelledBy="products-heading">
        <SectionHead
          id="products-heading"
          label={designProducts.label}
          heading={designProducts.heading}
          body={designProducts.body}
        />
        <ProductCards />
      </OfferSection>
      </PlanBand>

      {/* SECTION 03 — WHAT'S INCLUDED */}
      <OfferSection id="included" labelledBy="included-heading">
        <SectionHead
          id="included-heading"
          label={designIncluded.label}
          heading={designIncluded.heading}
          body={designIncluded.body}
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {designIncluded.groups.map((group, index) => (
            <Reveal as="li" key={group.title} delay={0.04 * index} className="flex">
              <div className="glass glass-lit w-full rounded-panel p-5">
                <div className="flex items-center gap-3">
                  <IconTile name={group.icon} />
                  <h3 className="font-sans text-body leading-snug text-bone">{group.title}</h3>
                </div>
                {group.lead && <p className="mt-4 text-small text-ash">{group.lead}</p>}
                <ul className="mt-4 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2 text-small text-ash">
                      <span aria-hidden className="text-brand-ink">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ul>
      </OfferSection>

      {/* SECTION 04 — HOW IT WORKS */}
      <StepsBlock data={designHowItWorks} id="how-it-works" />

      {/* SECTION 05 + 06 — PLAN OVERVIEW, with the turnaround directly below it */}
      <PlanOverview />

      {/* SECTION 07 — ADD-ONS */}
      <OfferSection>
        <AddOnsBlock data={designAddOns} />
      </OfferSection>

      {/* SECTION 08 — BRAND BUILD */}
      <BrandBuild />

      {/* "add case study" */}
      <CaseStudiesRow slugs={page.proof} heading="Brand & Design case studies" />
      <WorkSection verticals={["Brand & Design", "Creatives"]} />

      {/* SECTION 09 — FINAL CTA */}
      <ClosingBand data={designClosing} images={brandBuild.images} />
    </VerticalPage>
  );
}

export function ProductCards() {
  return (
    <ul className="mt-10 grid gap-4 lg:grid-cols-2">
      {designProducts.items.map((item, index) => (
        <Reveal as="li" key={item.label} delay={0.06 * index} className="flex">
          <article
            className={cn(
              "relative flex w-full flex-col overflow-hidden rounded-panel p-6 sm:p-8",
              item.featured
                ? "glass glass-strong glass-lit border border-brand/60 shadow-[0_24px_64px_-24px_rgb(255_197_22/0.35)]"
                : "glass glass-lit",
            )}
          >
            {item.featured && (
              <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand/15 blur-3xl" />
            )}
            <p className="micro-label relative !text-brand-ink">{item.label}</p>
            <h3 className="relative mt-4 text-balance font-display text-h3 font-normal leading-tight tracking-tight text-bone">
              {item.heading}
            </h3>
            <p className="relative mt-3 text-pretty text-body leading-relaxed text-ash">{item.body}</p>
            <p className="relative mt-6 flex flex-wrap items-baseline gap-2">
              {item.pricePrefix && <span className="text-small text-ash">{item.pricePrefix}</span>}
              <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">{item.price}</span>
              <span className="text-small text-ash">{item.priceSuffix}</span>
            </p>
            <CheckList items={item.points} className="relative mt-6" />
            <div className="relative mt-auto pt-8">
              <GlassButton href={item.cta.href} variant={item.featured ? "brand" : "glass"} arrow>
                {item.cta.label}
              </GlassButton>
            </div>
          </article>
        </Reveal>
      ))}
    </ul>
  );
}

function PlanOverview() {
  return (
    <OfferSection id="overview" labelledBy="overview-heading">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <Reveal>
          <SectionLabel dot tone="brand">
            {designOverview.label}
          </SectionLabel>
          <h2
            id="overview-heading"
            className="mt-5 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2"
          >
            {designOverview.heading}
          </h2>
          {designOverview.body.map((line) => (
            <p key={line} className="text-body leading-relaxed text-ash first-of-type:mt-4">
              {line}
            </p>
          ))}
          <div className="glass glass-strong glass-lit mt-8 rounded-panel border border-brand/40 p-6">
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">
                {designOverview.price}
              </span>
              <span className="text-small text-ash">{designOverview.priceSuffix}</span>
            </p>
            <GlassButton href={deskHref} variant="brand" arrow className="mt-6">
              {designOverview.cta}
            </GlassButton>
          </div>
        </Reveal>

        <Reveal delay={0.06} className="glass glass-lit overflow-hidden rounded-panel">
          <table className="w-full border-collapse text-left text-small">
            <tbody>
              {designOverview.rows.map((row) => (
                <tr key={row.label} className="border-b border-white/8">
                  <th scope="row" className="w-[42%] px-5 py-3 font-normal text-ash">
                    {row.label}
                  </th>
                  <td className={cn("px-5 py-3", row.value === "Included" ? "text-brand-ink" : "text-bone")}>
                    {row.value}
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="px-5 py-3 align-top font-normal text-ash">
                  {designOverview.notIncludedLabel}
                </th>
                <td className="px-5 py-3 text-faint">{designOverview.notIncluded.join(" · ")}</td>
              </tr>
            </tbody>
          </table>
        </Reveal>
      </div>

      <div className="mt-[var(--section-pad)]">
        <SectionHead label={designTurnaround.label} heading={designTurnaround.heading} align="left" />
        <TurnaroundStrip data={designTurnaround} className="mt-8" />
        {designTurnaround.notes?.map((note) => (
          <p key={note} className="mt-5 max-w-3xl text-pretty text-small leading-relaxed text-faint">
            {note}
          </p>
        ))}
      </div>
    </OfferSection>
  );
}

function BrandBuild() {
  return (
    <OfferSection id="brand-build" labelledBy="brand-build-heading">
      <Reveal className="glass glass-strong glass-lit relative overflow-hidden rounded-panel p-6 sm:p-10 lg:p-12">
        <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <SectionLabel dot tone="brand">
              {brandBuild.label}
            </SectionLabel>
            <h2
              id="brand-build-heading"
              className="mt-5 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2"
            >
              {brandBuild.heading}{" "}
              <span className="block font-serif italic text-brand-ink">{brandBuild.headingAccent}</span>
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-body leading-relaxed text-ash">{brandBuild.body}</p>
          </div>
          {/* Sketch to mark — Activ Health's logo redesign, left to right. */}
          <div aria-hidden className="grid grid-cols-3 gap-3">
            {brandBuild.images.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-card bg-white">
                <Image src={mediaUrl(src)} alt="" fill sizes="10rem" className="object-contain p-3" />
              </div>
            ))}
          </div>
        </div>

        <ul className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brandBuild.groups.map((group) => (
            <li key={group.title} className="rounded-card border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-sans text-body text-bone">{group.title}</h3>
              {"lead" in group && group.lead && <p className="mt-2 text-small text-ash">{group.lead}</p>}
              <ul className="mt-3 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-small text-ash">
                    <span aria-hidden className="text-brand-ink">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="relative mt-10 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-h3 font-normal tracking-tight text-bone">{brandBuild.price}</p>
            <p className="mt-2 text-small text-ash">{brandBuild.facts.join(" · ")}</p>
          </div>
          <GlassButton href={brandBuild.cta.href} variant="brand" size="lg" arrow magnetic>
            {brandBuild.cta.label}
          </GlassButton>
        </div>
      </Reveal>
    </OfferSection>
  );
}
