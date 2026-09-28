import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { DivisionName } from "@/components/genesis/division-lockup";
import { GlassButton } from "@/components/genesis/glass-button";
import { MembershipCard } from "@/components/genesis/membership-card";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { services } from "@/lib/home-content";
import { bookingHref, enquiryHref, pricingHub, verticalCard, verticalCards } from "@/lib/pricing";
import { breadcrumbJsonLd } from "@/lib/seo";
import { aiEveryVideo, aiPlans, aiTab, aiTurnaround, aiVideoTiers } from "@/lib/verticals/ai-labs";
import { designTab, designTurnaround } from "@/lib/verticals/brand-design";
import { builtFor, campaignPricing, influenceTab } from "@/lib/verticals/influence";
import { studiosPlans, studiosTab, studiosTurnaround } from "@/lib/verticals/studios";
import type { VerticalKey } from "@/lib/verticals/types";
import { IconChips, StepsBlock, TierTag, TurnaroundStrip, VideoTiers } from "./offer/blocks";
import { IconTile } from "./offer/icons";
import { AddToCartIcon, IncludedList } from "@/components/genesis/cart";
import { productId } from "@/lib/cart";
import { inr } from "@/lib/money";
import { products } from "@/lib/products";
import { LogoStrip } from "./offer/page-furniture";
import { PlanDetails, SectionHead } from "./offer/parts";
import { PlanGrid } from "./offer/plan-grid";
import { PlanTabs, type PlanTab } from "./offer/plan-tabs";
import { OneTimeProducts } from "./offer/starter-pack";
import { ONE_TIME_GRADIENT, TIER_GLOWS, TIER_GRADIENTS } from "./offer/tier-colors";
import { WorkMode, WorkModeProvider } from "./offer/work-mode";
import { Breadcrumbs } from "./service-page";
import { ProductCards } from "./verticals/design-products";
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
          {/*
            THE WORDS ON THE LEFT, THE CARD ON THE RIGHT (Genesis, 29 Sep 2026:
            the heading "a little above", the paragraph "below that", the card
            larger). Label, heading and standfirst read as one block down the
            left; the card, now the page's picture, takes the right and sits
            centred against them rather than hanging below.
          */}
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <SectionHead
                as="h1"
                align="left"
                label={pricingHub.label}
                heading={pricingHub.heading}
                accent={pricingHub.headingAccent}
              />
              <Reveal delay={0.08}>
                <p className="mt-6 max-w-xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
                  {pricingHub.body}
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.12} className="flex justify-center lg:justify-end">
              <MembershipCard size="xl" tilt={-6} />
            </Reveal>
          </div>
        </div>
      </Atmosphere>

      <section
        id="plans"
        aria-labelledby="plans-heading"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]"
      >
        <Reveal className="glass glass-lit relative overflow-hidden rounded-panel p-5 sm:p-8 lg:p-10">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-brand/10 blur-3xl"
          />
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
            <div className="mt-8">
              {/* One "one-time or membership" choice for every tab — see WorkMode. */}
              <WorkModeProvider>
                <PlanTabs tabs={tabs()} initial="ai-labs" />
              </WorkModeProvider>
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

      {/*
        EVERY ONE-TIME PRODUCT, AT A GLANCE — Genesis's fifteen (lib/products),
        by division. Each division's tab above has the full card; this is the
        index a "one-time project" reader lands on, with the same Add, and a
        call for the one priced by campaign.
      */}
      <section
        aria-labelledby="one-time-heading"
        id="one-time"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]"
      >
        <SectionHead
          id="one-time-heading"
          label={pricingHub.oneTime.label}
          heading={pricingHub.oneTime.heading}
          body={pricingHub.oneTime.body}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {verticalCards.map((card, index) => (
            /*
              GRADIENT CARDS (Genesis, 29 Sep 2026) — each division in its own
              variation of the palette, the same family as the plan cards: a
              1px gradient edge, a dark card, a glow in the card's colour.
            */
            <Reveal key={card.key} className="flex">
              <div
                className="flex w-full rounded-panel p-px"
                style={{
                  background: INDEX_GRADIENTS[index % INDEX_GRADIENTS.length],
                  boxShadow: `0 24px 60px -34px ${INDEX_GLOWS[index % INDEX_GLOWS.length]}`,
                }}
              >
                <div className="relative flex w-full flex-col overflow-hidden rounded-panel bg-ink p-5">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full blur-3xl"
                    style={{ background: INDEX_GLOWS[index % INDEX_GLOWS.length] }}
                  />
                  <DivisionName name={verticalCard(card.key).short} height={24} className="self-start" />
                  <ul className="mt-4 flex flex-1 flex-col divide-y divide-[var(--glass-border)]">
                    {products
                      .filter((product) => product.vertical === card.key)
                      .map((product) => (
                        <li key={product.name} className="py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block text-small leading-snug text-bone">{product.name}</span>
                              <span className="mt-0.5 block text-[0.75rem] text-ash">
                                {product.price ? inr(product.price) : product.priceLabel}
                              </span>
                            </span>
                            {product.cta === "buy" ? (
                              <AddToCartIcon id={productId(product.vertical, "one-time", product.name)} />
                            ) : (
                              <a
                                href={bookingHref(product.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-9 shrink-0 items-center text-small text-brand-ink hover:underline"
                              >
                                Book a call
                              </a>
                            )}
                          </div>
                          {/* What it includes, opened on demand — Genesis, 28 Sep 2026. */}
                          <IncludedList items={product.includes} className="mt-1.5" />
                        </li>
                      ))}
                  </ul>
                  <Link
                    href={`/pricing?v=${card.key}#plans`}
                    data-plan-tab={card.key}
                    data-work-mode="one-time"
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-small text-ash transition-colors hover:text-bone"
                  >
                    See them in full
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

/** The one-time index's four cards — the plan tiers' colours plus the one-time sweep. */
const INDEX_GRADIENTS = [...TIER_GRADIENTS, ONE_TIME_GRADIENT];
const INDEX_GLOWS = [...TIER_GLOWS, "rgb(247 120 143 / 0.26)"];

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
  /* The division's own gradient — the one on its name artwork in the tab above. */
  const ramp = services.items.find((item) => item.short === card.short)?.ramp;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="micro-label !text-brand-ink">{label}</p>
        <h3 className="mt-3 font-display text-h3 font-normal leading-tight tracking-tight text-bone sm:text-h2">
          <span
            className="bg-clip-text text-transparent [-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
            style={ramp ? { backgroundImage: ramp } : undefined}
          >
            {heading}
          </span>
        </h3>
        {sub && <p className="mt-1 text-lead text-bone">{sub}</p>}
        {body && <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{body}</p>}
      </div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="font-sans mb-4 mt-10 text-body text-bone">{children}</h4>;
}

function tabs(): PlanTab[] {
  /* In Genesis's order for the four — the same as verticalCards. */
  const order = verticalCards.map((card) => card.key);
  const art = (key: VerticalKey) => <DivisionName name={verticalCard(key).short} height={30} />;
  const list: PlanTab[] = [
    {
      key: "ai-labs",
      label: "AI Labs",
      icon: "sparkles",
      content: (
        <>
          {/*
            THE SWITCH FIRST, THEN THE WORDS (Genesis, 29 Sep 2026: "put the
            toggle bar above the written content"): how you want to work, the
            billing under it, then the tab's own heading, then the plans — and
            what every AI video includes BELOW them.
          */}
          <WorkMode
            oneTime={
              <>
                <TabHead vertical="ai-labs" {...aiTab} />
                <div className="mt-8">
                  <OneTimeProducts vertical="ai-labs" bare />
                </div>
              </>
            }
            membership={
              <>
                <PlanGrid
                  data={aiPlans}
                  vertical="ai-labs"
                  compact
                  centered
                  intro={<TabHead vertical="ai-labs" {...aiTab} />}
                />
                <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                  {aiEveryVideo.items.map((item) => (
                    <li
                      key={item.title}
                      className="glass-chip flex flex-col items-center gap-2 rounded-card p-3 text-center"
                    >
                      <IconTile name={item.icon} className="size-9" />
                      <span className="text-small text-bone">{item.label?.split("— ")[1] ?? item.title}</span>
                      <span className="text-[0.6875rem] leading-snug tracking-normal text-faint">{item.title}</span>
                      {item.tier && <TierTag className="mt-1 text-center">{item.tier}</TierTag>}
                    </li>
                  ))}
                </ul>
                <PlanDetails id="video-types" title={aiVideoTiers.heading} summary={aiVideoTiers.body}>
                  <VideoTiers data={aiVideoTiers} bare />
                </PlanDetails>
              </>
            }
          />
          <SubHeading>Typical turnaround</SubHeading>
          <TurnaroundStrip data={aiTurnaround} />
        </>
      ),
    },
    {
      key: "influence",
      label: "Influence",
      icon: "users",
      content: (
        <>
          <div className="mt-10">
            <TabHead vertical="influence" {...influenceTab} />
          </div>
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
                <span className="mt-2 block text-pretty text-body leading-relaxed text-bone">
                  {campaignPricing.includes}
                </span>
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
          <OneTimeProducts vertical="influence" />
        </>
      ),
    },
    {
      key: "studios",
      label: "Studios",
      icon: "camera",
      content: (
        <>
          <WorkMode
            oneTime={
              <>
                <TabHead vertical="studios" {...studiosTab} />
                <div className="mt-8">
                  <OneTimeProducts vertical="studios" bare />
                </div>
              </>
            }
            membership={
              <PlanGrid
                data={studiosPlans}
                vertical="studios"
                compact
                centered
                intro={<TabHead vertical="studios" {...studiosTab} />}
              />
            }
          />
          <SubHeading>Typical turnaround</SubHeading>
          <TurnaroundStrip data={studiosTurnaround} />
        </>
      ),
    },
    {
      key: "brand-design",
      label: "Brand & Design",
      icon: "palette",
      content: (
        <>
          <WorkMode
            oneTime={
              <>
                <TabHead vertical="brand-design" {...designTab} />
                <div className="mt-8">
                  <OneTimeProducts vertical="brand-design" bare />
                </div>
              </>
            }
            membership={
              <>
                <TabHead vertical="brand-design" {...designTab} />
                <ProductCards />
              </>
            }
          />
          <SubHeading>Typical turnaround</SubHeading>
          <TurnaroundStrip data={designTurnaround} />
        </>
      ),
    },
  ];
  /*
    THE TABS ARE THE DIVISION CARDS (Genesis, 28 Sep 2026) — the four cards
    that used to open the page now pick the tab: name, one line, and "Learn
    more about Genesis …" to the division's own page, in place of a price.
  */
  return list
    .map((tab) => {
      const card = verticalCard(tab.key);
      return {
        ...tab,
        art: art(tab.key),
        card: {
          blurb: card.blurb,
          href: card.href,
          linkLabel: `Learn more about ${card.name}`,
          ramp: services.items.find((item) => item.short === card.short)?.ramp,
        },
      };
    })
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}
