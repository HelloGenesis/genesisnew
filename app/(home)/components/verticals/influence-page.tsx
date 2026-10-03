import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { GlassButton } from "@/components/genesis/glass-button";
import { PlatformMark } from "@/components/genesis/platform-icons";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { divisionMenu } from "@/lib/home-content";
import { mediaUrl } from "@/lib/media-url";
import { enquiryHref } from "@/lib/pricing";
import { servicePage } from "@/lib/services";
import {
  builtFor,
  campaignPricing,
  influenceClosing,
  influenceProcess,
  influenceServices,
} from "@/lib/verticals/influence";
import { InfluencerMarketing } from "../influencer-marketing";
import { OneTimeProducts } from "../offer/starter-pack";
import { WorkMode } from "../offer/work-mode";
import { IconChips, StepsBlock } from "../offer/blocks";
import { IconTile } from "../offer/icons";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { OfferSection, PlanBand } from "../offer/parts";
import { PlugHeadline } from "../offer/plug-headline";
import { ServiceStrip } from "../offer/vertical-hero";
import { VerticalCtas } from "../offer/vertical-ctas";
import { BuySteps } from "../offer/buy-steps";
import { PricingHead } from "../offer/pricing-head";
import { VerticalPage } from "../offer/vertical-page";

const page = servicePage("influencer-marketing");
const planHref = enquiryHref("an influencer campaign");

/**
 * /influencer-marketing — Genesis Influence, in the brief's running order:
 * tabs, the homepage's Influence section, one line of logos, the campaign
 * pricing, who it is built for, the services, how a campaign runs, the
 * influencer work, and the closing band. The calendar is the footer's.
 */
export function InfluencePageView() {
  return (
    <VerticalPage page={page} current="influence"
      jump={[
        { id: "pricing", label: "Pricing" },
        { id: "services", label: "Services" },
        { id: "process", label: "Process" },
        { id: "case-studies", label: "Case studies" },
        { id: "library", label: "Work" },
      ]}>
      {/* The division's homepage section, unchanged — the brief's own screenshot. */}
      {/*
        THE PAGE'S HEADLINE, the same sentence as the other three (Genesis,
        2 Oct 2026): "Plug Genesis.Influence into your brand. Whenever you
        need …", with the division's services under it. Then the homepage's
        Influence section, as before.
      */}
      {/*
        LEFT-ALIGNED, ALL OF IT, ON ONE EDGE (Genesis, 2 Oct 2026: "keep it
        left aligned only"): the headline, the line under it and the services
        start where the section below starts.
      */}
      <Reveal className="mx-auto w-full max-w-7xl px-6 pt-10 lg:pt-14">
        <PlugHeadline division="Influence" services={divisionMenu("/influencer-marketing")} className="max-w-5xl" />
        <ServiceStrip items={divisionMenu("/influencer-marketing")} className="mt-8" />
      </Reveal>
      <InfluencerMarketing onPage />

      <LogoStrip heading={false} />

      {/*
        THE SAME SWITCH AS THE OTHER DIVISIONS (Genesis, 2 Oct 2026): the UGC
        packs and campaign management to buy once on one side, the managed
        campaign (15% commission) on the other.
      */}
      <PlanBand>
        <OfferSection>
          {/* "View Pricing" lands on the head, so it is inside the anchor. */}
          <div id="pricing" className="scroll-mt-24">
            <PricingHead />
            <WorkMode
              oneTime={<OneTimeProducts vertical="influence" bare />}
              membership={<CampaignPricing />}
            />
            {/* How it works, from paying to publishing, under the cards (Genesis, 2 Oct 2026). */}
            <BuySteps className="mt-10" />
          </div>
        </OfferSection>
      </PlanBand>

      <OfferSection className="pt-0">
        <Reveal className="glass glass-lit rounded-panel p-5 sm:p-6">
          <SectionLabel dot tone="brand">
            {builtFor.label}
          </SectionLabel>
          <IconChips items={builtFor.items} className="mt-5" />
        </Reveal>
      </OfferSection>

      <Services />

      <StepsBlock data={influenceProcess} id="process" />
      <Reveal className="mx-auto -mt-6 w-full max-w-6xl px-6 pb-[var(--section-pad)]">
        <VerticalCtas />
      </Reveal>

      <WorkSection verticals={["Influence"]} />

      <Closing />
    </VerticalPage>
  );
}

/** "Influencer & UGC Campaigns — Creator fees + 15% Agency Commission." */
function CampaignPricing() {
  return (
    <section aria-labelledby="campaign-pricing-heading">
      <Reveal className="glass glass-strong glass-lit relative overflow-hidden rounded-panel">
        <div className="relative grid lg:grid-cols-[1fr_0.9fr]">
          <div className="relative z-[1] p-6 sm:p-10 lg:p-12">
            <p className="micro-label flex items-center gap-3">
              {campaignPricing.label}
              <span aria-hidden className="h-px w-16 bg-gradient-to-r from-brand/70 to-transparent" />
            </p>
            <h2
              id="campaign-pricing-heading"
              className="mt-5 text-balance text-h2 font-normal leading-[1.02] tracking-tight text-bone sm:text-h1"
            >
              {campaignPricing.heading}{" "}
              <span className="block font-serif italic text-brand-ink">{campaignPricing.headingAccent}</span>
            </h2>
            <p className="mt-4 max-w-md text-pretty text-body leading-relaxed text-ash">{campaignPricing.body}</p>

            <div className="mt-8 flex max-w-md items-center gap-6 rounded-panel border border-brand/40 bg-brand/[0.06] p-5 sm:p-6">
              <p className="font-display text-[3.5rem] font-normal leading-none tracking-tight text-brand-ink sm:text-[4.5rem]">
                <Figure value={campaignPricing.figure} />
              </p>
              <span aria-hidden className="h-14 w-px bg-brand/40" />
              <p>
                <span className="block text-lead text-bone">{campaignPricing.figureLabel}</span>
                <span className="mt-1 block text-small text-ash">{campaignPricing.figureSub}</span>
              </p>
            </div>

            <p className="mt-3 max-w-md text-small text-faint">{campaignPricing.example}</p>

            <GlassButton href={planHref} variant="brand" size="lg" arrow magnetic className="mt-8">
              {campaignPricing.cta}
            </GlassButton>
          </div>
          <div aria-hidden className="relative min-h-64 lg:min-h-0">
            <Image
              src={mediaUrl(campaignPricing.image)}
              alt=""
              fill
              sizes="(min-width: 1024px) 32rem, 100vw"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[var(--surface-base)] via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>
        </div>
        <div className="relative z-[1] flex items-start gap-4 border-t border-white/10 p-5 sm:px-10 sm:py-6">
          <IconTile name="users" />
          <p>
            <span className="micro-label !text-brand-ink">{campaignPricing.includesLabel}</span>
            <span className="mt-2 block text-pretty text-body leading-relaxed text-bone">
              {campaignPricing.includes}
            </span>
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/** Influencer marketing services — copy and figures left, the four services right. */
function Services() {
  return (
    <OfferSection id="services" labelledBy="services-heading">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <Reveal>
          <SectionLabel dot tone="brand">
            {influenceServices.label}
          </SectionLabel>
          <h2
            id="services-heading"
            className="mt-5 text-balance text-h2 font-normal leading-[1.02] tracking-tight text-bone sm:text-h1"
          >
            {influenceServices.heading}{" "}
            <span className="block font-serif italic text-brand-ink">{influenceServices.headingAccent}</span>
          </h2>
          {influenceServices.body.map((line) => (
            <p key={line} className="mt-3 text-pretty text-body leading-relaxed text-ash first-of-type:mt-6">
              {line}
            </p>
          ))}
          <VerticalCtas size="md" className="mt-8" />
          <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {influenceServices.stats.map((stat) => (
              <div key={stat.label} className="border-l border-white/12 pl-4">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-h3 font-normal leading-none tracking-tight text-bone">{stat.value}</dd>
                <dd className="mt-2 text-small leading-snug text-ash">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <ul className="grid gap-3 sm:grid-cols-2">
          {influenceServices.cards.map((card, index) => (
            <Reveal as="li" key={card.title} delay={0.05 * index} className="flex">
              <article className="glass glass-lit group relative flex w-full flex-col overflow-hidden rounded-panel">
                <div aria-hidden className="relative h-36 shrink-0 overflow-hidden">
                  <Image
                    src={mediaUrl(card.image)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                    className="object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[var(--surface-raised)] via-[var(--surface-raised)]/20 to-transparent" />
                </div>
                <div className="relative z-[1] -mt-8 flex flex-1 flex-col px-5 pb-5">
                  <IconTile name={card.icon} className="bg-[var(--surface-raised)]" />
                  <h3 className="font-sans mt-4 text-lead leading-snug text-bone">{card.title}</h3>
                  <p className="mb-5 mt-2 text-pretty text-small leading-relaxed text-ash">{card.body}</p>
                  <a
                    href="#case-studies"
                    aria-label={`${card.title}: case studies`}
                    className="mt-auto grid size-10 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand"
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>

      <Reveal className="mt-8">
        <p className="sr-only">Platforms</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-white/10 pt-6 lg:justify-end">
          {influenceServices.platforms.map((platform) => (
            <li key={platform.label} className="flex items-center gap-2 text-small text-ash">
              <PlatformMark name={platform.icon} className="size-4 text-bone" />
              {platform.label}
            </li>
          ))}
        </ul>
      </Reveal>
    </OfferSection>
  );
}

function Closing() {
  return (
    <OfferSection>
      <Reveal className="glass glass-strong glass-lit relative flex flex-col gap-8 overflow-hidden rounded-panel p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12">
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 size-80 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative">
          <p className="micro-label">{influenceClosing.label}</p>
          <h2 className="mt-5 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
            {influenceClosing.heading}{" "}
            <span className="block font-serif italic text-brand-ink">{influenceClosing.headingAccent}</span>
          </h2>
          <p className="mt-4 text-pretty text-body leading-relaxed text-ash">{influenceClosing.body}</p>
        </div>
        <VerticalCtas stacked className="relative" />
      </Reveal>
    </OfferSection>
  );
}

/*
  "15%" IN MONT'S HAIRLINE. The demo cut has no %, so the sign falls through
  to the next font in the stack — which has no hairline weight and printed a
  heavy % beside a thin 15. The sign is set on its own in the system face at
  its lightest, which is close enough to Mont ExtraLight to read as one word.
*/
export function Figure({ value }: { value: string }) {
  const [number, sign] = [value.replace(/%$/, ""), value.endsWith("%") ? "%" : ""];
  return (
    <>
      {number}
      {sign && <span className="font-[system-ui] font-extralight">{sign}</span>}
    </>
  );
}
