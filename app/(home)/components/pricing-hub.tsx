import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { services } from "@/lib/home-content";
import {
  bookingHref,
  enquiryHref,
  oneTimeProjects,
  pricingHub,
  verticalCard,
  verticalCards,
} from "@/lib/pricing";
import { breadcrumbJsonLd } from "@/lib/seo";
import { aiAddOns, aiEveryVideo, aiPlans, aiTab, aiTurnaround } from "@/lib/verticals/ai-labs";
import { designAddOns, designTab, designTurnaround } from "@/lib/verticals/brand-design";
import { builtFor, campaignPricing } from "@/lib/verticals/influence";
import { studiosAddOns, studiosPlans, studiosShoot, studiosTab, studiosTurnaround } from "@/lib/verticals/studios";
import type { VerticalKey } from "@/lib/verticals/types";
import { AddOnsBlock } from "./offer/add-ons";
import { IconChips, StepsBlock, TurnaroundStrip } from "./offer/blocks";
import { IconTile } from "./offer/icons";
import { MediaRail } from "./offer/media-rail";
import { LogoStrip } from "./offer/page-furniture";
import { SectionHead } from "./offer/parts";
import { PlanGrid } from "./offer/plan-grid";
import { PlanTabs, type PlanTab } from "./offer/plan-tabs";
import { Breadcrumbs } from "./service-page";
import { ProductCards } from "./verticals/brand-design-page";
import { Figure } from "./verticals/influence-page";

/**
 * /pricing — the vertical-pages brief's pricing page.
 *
 * THE VIBE FIRST: "One team. One monthly fee." over the four vertical cards,
 * exactly the block the brief screenshots and says the page should feel like.
 * THEN THE SLIDER: "Choose your creative team." — the four verticals' packages
 * behind tabs, one at a time. Then the client row, then the one-time projects
 * the brief asks for "as of now", until its final pricing page arrives.
 *
 * Each vertical's full detail stays on its own page; a tab carries the plans
 * and the essentials and links through.
 */
export function PricingHubView() {
  return (
    <main>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Pricing", path: "/pricing" }])]} />

      <Atmosphere tone="brand" origin="top" intensity={0.2}>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pb-[var(--section-pad)] pt-32 sm:pt-40">
          <Breadcrumbs trail={[{ name: "Pricing", path: "/pricing" }]} />
          <SectionHead
            as="h1"
            className="mt-8"
            label={pricingHub.label}
            heading={pricingHub.heading}
            accent={pricingHub.headingAccent}
            body={pricingHub.body}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {verticalCards.map((card, index) => (
              <Reveal as="li" key={card.key} delay={0.05 * index} className="flex">
                <VerticalCard vertical={card.key} />
              </Reveal>
            ))}
          </ul>
        </div>
      </Atmosphere>

      <section id="plans" aria-labelledby="plans-heading" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]">
        <Reveal className="glass glass-lit relative overflow-hidden rounded-panel p-5 sm:p-8 lg:p-10">
          <span aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-brand/10 blur-3xl" />
          <div className="relative">
            <SectionLabel dot tone="brand">
              {pricingHub.plans.label}
            </SectionLabel>
            <h2
              id="plans-heading"
              className="mt-4 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2"
            >
              {pricingHub.plans.heading}
            </h2>
            {/*
              PICK THE MODEL BEFORE THE PRICE. Genesis charges three ways, and a
              reader who opens Influence expecting a membership meets a
              commission instead. The three are set out first, each with who
              it is for and where it starts.
            */}
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {pricingHub.models.map((model) => (
                <li key={model.label} className="flex">
                  <a
                    href={model.tab ? "#plans" : "#one-time"}
                    data-plan-tab={model.tab ?? undefined}
                    data-track={`model:${model.label}`}
                    className="group flex w-full flex-col rounded-panel border border-white/12 bg-white/[0.03] p-5 transition-colors hover:border-brand/50 hover:bg-brand/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-lead text-bone">{model.label}</span>
                      <ArrowRight className="size-4 text-faint transition-colors group-hover:text-brand-ink" aria-hidden />
                    </span>
                    <span className="mt-1 text-small text-ash">Best for: {model.bestFor}</span>
                    <span className="mt-4 text-lead text-brand-ink">{model.price}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <PlanTabs tabs={tabs()} initial="ai-labs" />
            </div>
          </div>
        </Reveal>
      </section>

      <StepsBlock
        id="how-memberships-work"
        data={{
          label: "Memberships",
          heading: pricingHub.steps.heading,
          steps: pricingHub.steps.items.map((step, index) => ({
            ...step,
            icon: (["queue", "create", "review", "repeat"] as const)[index],
          })),
          note: pricingHub.steps.note,
        }}
      />

      <LogoStrip heading={false} />

      <section aria-labelledby="one-time-heading" id="one-time" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]">
        <MediaRail
          label={pricingHub.oneTime.heading}
          aspect="1/1"
          cardClassName="lg:w-[calc((100%-4rem)/5)]"
          headerSlot={
            <SectionHead
              id="one-time-heading"
              label={pricingHub.oneTime.label}
              heading={pricingHub.oneTime.heading}
              body={pricingHub.oneTime.body}
              align="left"
            />
          }
          items={oneTimeProjects.map((project) => ({
            title: project.name,
            body: project.body,
            image: project.image,
            foot: (
              <a
                href={enquiryHref(project.name)}
                {...(enquiryHref(project.name).startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="mt-3 inline-flex items-center gap-1.5 text-small text-ash transition-colors hover:text-bone"
              >
                From <span className="text-brand-ink">{project.from}</span>
                <ArrowRight className="size-3.5 text-brand-ink" aria-hidden />
              </a>
            ),
          }))}
        />
      </section>
    </main>
  );
}

/** One of the four "vibe" cards: the division's name artwork, its line, its price. */
function VerticalCard({ vertical }: { vertical: VerticalKey }) {
  const card = verticalCard(vertical);
  const ramp = services.items.find((item) => item.short === card.short)?.ramp ?? "";
  return (
    <a
      href="#plans"
      data-plan-tab={card.key}
      className="glass glass-lit group relative flex w-full flex-col overflow-hidden rounded-panel p-6 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px opacity-80" style={{ backgroundImage: ramp }} />
      <DivisionLockup name={card.short} tagline="" ramp={ramp} as="h3" nameOnly height={34} taglineClassName="hidden" />
      <p className="mb-6 mt-5 text-pretty text-small leading-relaxed text-ash">{card.blurb}</p>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-5">
        <p>
          <span className="block text-micro uppercase tracking-[0.2em] text-faint">{card.fromLabel}</span>
          <span className="mt-2 block text-lead leading-none tracking-tight text-bone">{card.from}</span>
        </p>
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-bone transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </a>
  );
}

/** A tab's own opening: the vertical, the product, one line, and the way to its page. */
function TabHead({
  vertical,
  label,
  heading,
  sub,
  body,
}: {
  vertical: VerticalKey;
  label: string;
  heading: string;
  sub?: string;
  body?: string;
}) {
  const card = verticalCard(vertical);
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="micro-label !text-brand-ink">{label}</p>
        <h3 className="mt-3 font-display text-h3 font-normal leading-tight tracking-tight text-bone">{heading}</h3>
        {sub && <p className="mt-1 text-lead text-bone">{sub}</p>}
        {body && <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{body}</p>}
      </div>
      <Link href={card.href} className="inline-flex items-center gap-1.5 text-small text-ash transition-colors hover:text-bone">
        See the full {card.name} page
        <ArrowRight className="size-4 text-brand-ink" aria-hidden />
      </Link>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="font-sans mb-4 mt-10 text-body text-bone">{children}</h4>;
}

function tabs(): PlanTab[] {
  return [
    {
      key: "ai-labs",
      label: "AI Labs",
      icon: "sparkles",
      content: (
        <>
          <TabHead vertical="ai-labs" {...aiTab} />
          <PlanGrid data={aiPlans} compact />
          <SubHeading>Every AI Video Includes</SubHeading>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {aiEveryVideo.items.map((item) => (
              <li key={item.title} className="glass-chip flex flex-col items-center gap-2 rounded-card p-3 text-center">
                <IconTile name={item.icon} className="size-9" />
                <span className="text-small text-bone">{item.label?.split("— ")[1] ?? item.title}</span>
                <span className="text-[0.6875rem] leading-snug tracking-normal text-faint">{item.title}</span>
              </li>
            ))}
          </ul>
          <SubHeading>Typical turnaround</SubHeading>
          <TurnaroundStrip data={aiTurnaround} />
          <div className="mt-10">
            <AddOnsBlock data={aiAddOns} compact />
          </div>
        </>
      ),
    },
    {
      key: "influence",
      label: "Influence",
      icon: "users",
      content: (
        <>
          <TabHead
            vertical="influence"
            label="Genesis Influence"
            heading={`${campaignPricing.heading} ${campaignPricing.headingAccent}`}
            body={campaignPricing.body}
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex items-center gap-6 rounded-panel border border-brand/40 bg-brand/[0.06] p-6">
              <p className="font-display text-[4rem] font-normal leading-none tracking-tight text-brand-ink">
                <Figure value={campaignPricing.figure} />
              </p>
              <span aria-hidden className="h-14 w-px bg-brand/40" />
              <p>
                <span className="block text-lead text-bone">{campaignPricing.figureLabel}</span>
                <span className="mt-1 block text-small text-ash">{campaignPricing.figureSub}</span>
              </p>
            </div>
            <div className="glass-chip flex items-start gap-4 rounded-panel p-6">
              <IconTile name="users" />
              <p>
                <span className="micro-label !text-brand-ink">{campaignPricing.includesLabel}</span>
                <span className="mt-2 block text-pretty text-body leading-relaxed text-bone">{campaignPricing.includes}</span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-small text-faint">{campaignPricing.example}</p>
          <SubHeading>{builtFor.label}</SubHeading>
          <IconChips items={builtFor.items} />
          <div className="mt-8 flex flex-wrap gap-3">
            <GlassButton href={enquiryHref("an influencer campaign")} variant="brand" arrow>
              {campaignPricing.cta}
            </GlassButton>
            <GlassButton href={bookingHref("Genesis Influence")} variant="glass" arrow>
              Book a 15-min Call
            </GlassButton>
          </div>
        </>
      ),
    },
    {
      key: "studios",
      label: "Studios",
      icon: "camera",
      content: (
        <>
          <TabHead vertical="studios" {...studiosTab} />
          <PlanGrid data={studiosPlans} compact />
          <SubHeading>{studiosShoot.label}</SubHeading>
          <ul className="grid gap-3 md:grid-cols-3">
            {studiosShoot.packages.map((pack) => (
              <li key={pack.name} className="glass-chip flex items-center justify-between gap-4 rounded-panel p-5">
                <span>
                  <span className="block text-body text-bone">{pack.name}</span>
                  <span className="mt-0.5 block text-small text-ash">{pack.tagline}</span>
                </span>
                <span className="font-display text-lead text-bone">
                  {pack.price} <span className="text-small text-ash">{pack.gst}</span>
                </span>
              </li>
            ))}
          </ul>
          <SubHeading>Typical turnaround</SubHeading>
          <TurnaroundStrip data={studiosTurnaround} />
          <div className="mt-10">
            <AddOnsBlock data={studiosAddOns} compact />
          </div>
        </>
      ),
    },
    {
      key: "brand-design",
      label: "Brand & Design",
      icon: "palette",
      content: (
        <>
          <TabHead vertical="brand-design" {...designTab} />
          <div className="-mt-4">
            <ProductCards />
          </div>
          <SubHeading>Typical turnaround</SubHeading>
          <TurnaroundStrip data={designTurnaround} />
          <div className="mt-10">
            <AddOnsBlock data={designAddOns} compact />
          </div>
        </>
      ),
    },
  ];
}

