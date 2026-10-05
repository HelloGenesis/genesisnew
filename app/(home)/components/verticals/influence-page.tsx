import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { PlatformMark } from "@/components/genesis/platform-icons";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { divisionMenu } from "@/lib/home-content";
import { mediaUrl } from "@/lib/media-url";
import { servicePage } from "@/lib/services";
import {
  builtFor,
  influenceClosing,
  influenceProcess,
  influenceServices,
} from "@/lib/verticals/influence";
import { InfluenceNetworkCard } from "../influencer-marketing";
import { InfluenceShowcase } from "@/components/genesis/influence-showcase";
import { WorkHead, WorkWarp } from "@/components/genesis/work-warp";
import { IconChips, StepsBlock } from "../offer/blocks";
import { IconTile } from "../offer/icons";
import { LogoStrip, WorkSection } from "../offer/page-furniture";
import { OfferSection } from "../offer/parts";
import { PlugHeadline } from "../offer/plug-headline";
import { VerticalHero } from "../offer/vertical-hero";
import { VerticalCtas } from "../offer/vertical-ctas";
import { PricingHead } from "../offer/pricing-head";
import { PlanBar } from "../plan-bar";
import { FaqBlock } from "../offer/blocks";
import { VerticalPage } from "../offer/vertical-page";

const page = servicePage("influencer-marketing");

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
      {/*
        THE SAME OPENING AS THE OTHER THREE DIVISIONS (Genesis, 4 Oct 2026:
        "align the Influence vertical page like the others"): the headline,
        the services, the 1,00,000+ card and the buttons on the left, the
        work rail on the right. Then section 2, the curved rail of its work.
      */}
      <VerticalHero
        label="Genesis Influence"
        heading={<PlugHeadline division="Influence" services={divisionMenu("/influencer-marketing")} className="mt-5" />}
        strip={divisionMenu("/influencer-marketing")}
        images={[]}
        extra={<InfluenceNetworkCard />}
        /* The two Influence posters, as on the homepage, in place of the reel gallery (Genesis, 5 Oct 2026). */
        visual={<InfluenceShowcase />}
      />

      {/* SECTION 2: the division's work, in the curved rail every page shares. */}
      <section className="pb-[var(--section-pad)]">
        <WorkHead />
        <WorkWarp divisions={["Influence"]} />
      </section>

      <LogoStrip heading={false} />

      {/*
        THE SAME SWITCH AS THE OTHER DIVISIONS (Genesis, 2 Oct 2026): the UGC
        packs and campaign management to buy once on one side, the managed
        campaign (15% commission) on the other.
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
        <PlanBar vertical="influence" onPage />
        </div>
      </section>

      <OfferSection className="pt-0">
        <Reveal className="glass glass-lit rounded-panel p-5 sm:p-6 lg:-mx-16">
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
      {/* The division's questions (Genesis, 6 Oct 2026: "FAQs are missing on the vertical pages"). */}
      <FaqBlock heading="Genesis Influence: FAQs" items={page.faqs.map((faq) => ({ q: faq.question, a: [faq.answer] }))} />
    </VerticalPage>
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
            className="mt-5 text-balance text-h2 font-normal leading-[1.02] tracking-tight text-bone"
          >
            {influenceServices.heading}{" "}
            <span className="block font-serif italic text-brand-ink">{influenceServices.headingAccent}</span>
          </h2>
          {influenceServices.body.map((line) => (
            <p key={line} className="mt-3 text-pretty text-body leading-relaxed text-ash first-of-type:mt-5 [&:not(:first-of-type)]:hidden">
              {line}
            </p>
          ))}
          <VerticalCtas size="md" className="mt-6" />
          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
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
                <div aria-hidden className="relative h-24 shrink-0 overflow-hidden">
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
                  <h3 className="font-sans mt-3 text-body leading-snug text-bone">{card.title}</h3>
                  <p className="mb-4 mt-1.5 line-clamp-3 text-pretty text-[0.8125rem] leading-snug text-ash">{card.body}</p>
                  <a
                    href="#case-studies"
                    aria-label={`${card.title}: case studies`}
                    className="mt-auto grid size-8 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand"
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>

      <Reveal className="mt-6">
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
      <Reveal className="glass glass-strong glass-lit relative flex flex-col gap-8 overflow-hidden rounded-panel p-6 sm:p-10 lg:-mx-16 lg:flex-row lg:items-center lg:justify-between lg:p-12">
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
