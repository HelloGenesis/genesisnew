import Image from "next/image";

import { WorkHead, WorkWarp } from "@/components/genesis/work-warp";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { mediaUrl } from "@/lib/media-url";
import { servicePage } from "@/lib/services";
import {
  brandBuild,
  designClosing,
  designHero,
  designHowItWorks,
  designIncluded,
  designOverview,
} from "@/lib/verticals/brand-design";
import { cn } from "@/lib/utils";
import { BrandingDesign, BrandingStack } from "../branding-design";
import { ProductCards } from "./design-products";
import { OneTimeProducts } from "../offer/starter-pack";
import { SubscriptionOnly, WorkMode } from "../offer/work-mode";
import { ClosingBand, StepsBlock } from "../offer/blocks";
import { IconTile } from "../offer/icons";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { OfferSection, PlanBand, SectionHead } from "../offer/parts";
import { divisionMenu } from "@/lib/home-content";
import { PlugHeadline } from "../offer/plug-headline";
import { VerticalHero } from "../offer/vertical-hero";
import { VerticalCtas } from "../offer/vertical-ctas";
import { BuySteps } from "../offer/buy-steps";
import { PricingHead } from "../offer/pricing-head";
import { VerticalPage } from "../offer/vertical-page";

const page = servicePage("brand-design");

/**
 * /brand-design — Genesis Brand & Design, in the brief's nine sections, plus
 * the logo row and the case study it asks for.
 */
export function BrandDesignPageView() {
  return (
    <VerticalPage page={page} current="brand-design"
      jump={[
        { id: "pricing", label: "Plans" },
        { id: "included", label: "What's included", mode: "membership" },
        { id: "how-it-works", label: "How it works" },
        { id: "overview", label: "Compare plans", mode: "membership" },
        { id: "case-studies", label: "Case studies" },
      ]}>
      <VerticalHero
        label={designHero.label}
        heading={<PlugHeadline division="Brand & Design" services={divisionMenu("/brand-design")} className="mt-5" />}
        strip={divisionMenu("/brand-design")}
        images={designHero.images.map((src) => ({ src }))}
        /* The homepage section's three folders, in place of the logo collage. */
        visual={<BrandingStack />}
      />

      {/* SECTION 2: the division's work, in the curved rail every page shares (Genesis, 4 Oct 2026). */}
      <section className="pb-[var(--section-pad)]">
        <WorkHead />
        {/* The motion graphics pieces with the identity work (Genesis, 5 Oct 2026: "put these content pieces here"). */}
        <WorkWarp divisions={["Brand & Design", "Creatives"]} />
      </section>

      {/*
        THE DIVISION'S HOMEPAGE SECTION, under the hero, without its header
        or plan bar (Genesis, 2 Oct 2026) — see `onPage`.
      */}
      <BrandingDesign onPage />

      <LogoStrip />

      {/* SECTION 02 — TWO WAYS TO WORK WITH US */}
      <PlanBand>
      <OfferSection id="pricing" labelledBy="products-heading">
        <PricingHead id="products-heading" />
        {/* The same "one-time or membership" switch as /pricing (Genesis, 28 Sep 2026). */}
        <WorkMode
          oneTime={<OneTimeProducts vertical="brand-design" bare />}
          membership={<ProductCards />}
        />
        {/* How it works, from paying to publishing, under the cards (Genesis, 2 Oct 2026). */}
        <BuySteps className="mt-10" />
      </OfferSection>
      </PlanBand>

      {/*
        SECTION 03 — WHAT'S INCLUDED, as a bento of what Always-On covers.
        It and the plan overview below are the subscription's details, so
        they show only on the Subscriptions side (Genesis, 2 Oct 2026).
      */}
      <SubscriptionOnly>
      <OfferSection id="included" labelledBy="included-heading">
        <SectionHead
          id="included-heading"
          label={designIncluded.label}
          heading={designIncluded.heading}
          body={designIncluded.body}
        />
        <IncludedBento />
      </OfferSection>
      </SubscriptionOnly>

      {/* SECTION 04 — HOW IT WORKS */}
      <StepsBlock data={designHowItWorks} id="how-it-works" />

      {/* SECTION 05 + 06 — PLAN OVERVIEW, with the turnaround directly below it */}
      <SubscriptionOnly>
        <PlanOverview />
      </SubscriptionOnly>

      {/*
        SECTION 08 — BRAND BUILD, OFF FOR NOW (Genesis, 2 Oct 2026: "remove
        this as of now"). Turn SHOW_BRAND_BUILD back on to restore it, and
        its "Brand Build" link in the jump bar above. Brand Build is still
        sold as a pay-per-project product.
      */}
      {SHOW_BRAND_BUILD && <BrandBuild />}

      {/*
        "add case study" — as the homepage's Case Studies section, Brand &
        Design and motion graphics only. It replaced a separate written-study
        row above it, which read "Case studies" twice in a row once this
        section took that name (Genesis, 28 Sep 2026).
      */}
      <WorkSection
        verticals={["Brand & Design", "Motion Graphics"]}
        showFilters
        filters={["All", "Brand & Design", "Motion Graphics"]}
      />

      {/* SECTION 09 — FINAL CTA */}
      <ClosingBand data={designClosing} images={brandBuild.images} />
    </VerticalPage>
  );
}

const SHOW_BRAND_BUILD = false;

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
            <p className="mt-2 text-small text-ash">{designOverview.monthlyNote}</p>
            <VerticalCtas size="md" className="mt-6" />
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

      {/* Turnaround is in each plan's pricing pop-up, so not repeated here (Genesis, 5 Oct 2026). */}
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
          <VerticalCtas />
        </div>
      </Reveal>
    </OfferSection>
  );
}

/*
  THE BENTO. Every deliverable Always-On covers, grouped the brief's way, as
  chips in cells of different sizes — Social & Digital, the most-asked-for,
  takes the big cell. The last row is what the plan does NOT cover and where
  each of those lives instead, so the grid answers "can you do X?" either way.
*/
const BENTO_SPAN: Record<string, string> = {
  "Social & Digital": "lg:col-span-2 lg:row-span-2",
  "Performance Creative": "lg:col-span-2",
  "Campaign Design": "lg:col-span-2",
};

function IncludedBento() {
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {designIncluded.groups.map((group, index) => {
        const big = group.title === "Social & Digital";
        return (
          <Reveal
            key={group.title}
            delay={0.03 * index}
            className={cn(
              "glass glass-lit flex flex-col rounded-panel p-5",
              BENTO_SPAN[group.title],
              big && "justify-between p-6 sm:p-7",
            )}
          >
            <div className="flex items-center gap-3">
              <IconTile name={group.icon} />
              <h3 className={cn("font-sans leading-snug text-bone", big ? "text-h3" : "text-body")}>{group.title}</h3>
            </div>
            {group.lead && <p className="mt-3 text-small text-ash">{group.lead}</p>}
            {big && <SocialFrames />}
            <ul className={cn("flex flex-wrap gap-2", big ? "mt-8" : "mt-4")}>
              {group.items.map((item) => (
                <li
                  key={item}
                  className={cn(
                    "rounded-full border border-dashed border-white/20 text-ash",
                    big ? "px-4 py-2 text-body text-bone" : "px-3 py-1.5 text-small",
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        );
      })}
      <Reveal className="rounded-panel border border-dashed border-white/15 p-5 sm:col-span-2 lg:col-span-4">
        <p className="micro-label">{designIncluded.elsewhere.heading}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {designIncluded.elsewhere.items.map((entry) => (
            <li
              key={entry.what}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-small"
            >
              <span className="text-bone">{entry.what}</span>
              <span aria-hidden className="text-faint">→</span>
              <span className={entry.where === "Not included" ? "text-faint" : "text-brand-ink"}>{entry.where}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}

/*
  THE SOCIAL FORMATS, DRAWN. The big cell had nothing between its title and
  its chips; these are the shapes that work actually ships in — square, feed
  portrait, story and landscape — as outlined frames, which says "social"
  faster than another line of type.
*/
const FRAMES = [
  { ratio: "1 / 1", label: "1:1", width: "22%" },
  { ratio: "4 / 5", label: "4:5", width: "22%" },
  { ratio: "9 / 16", label: "9:16", width: "18%" },
  { ratio: "16 / 9", label: "16:9", width: "34%" },
];

function SocialFrames() {
  return (
    <div aria-hidden className="mt-8 flex items-end gap-3">
      {FRAMES.map((frame, index) => (
        <div
          key={frame.label}
          className={cn(
            "relative grid place-items-center rounded-card border",
            index === 2 ? "border-brand/60 bg-brand/[0.08]" : "border-white/15 bg-white/[0.03]",
          )}
          style={{ aspectRatio: frame.ratio, width: frame.width }}
        >
          <span className={cn("text-small", index === 2 ? "text-brand-ink" : "text-faint")}>{frame.label}</span>
        </div>
      ))}
    </div>
  );
}
