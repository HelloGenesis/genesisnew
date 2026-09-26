import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal } from "@/components/genesis/reveal";
import { services } from "@/lib/home-content";
import {
  enquiryHref,
  joinHref,
  pricingHub,
  pricingPath,
  verticals,
  type VerticalPricing,
} from "@/lib/pricing";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
  CheckList,
  Closing,
  Faq,
  HowMembershipsWork,
  MembershipsIntro,
  ProductCard,
  UnlimitedAndEnterprise,
} from "./pricing-page";
import { PricingTabs } from "./pricing-tabs";
import { Breadcrumbs } from "./service-page";

/**
 * /pricing — the brief's "Pricing page": all four memberships side by side,
 * the one-time products under tabs, then Unlimited, Enterprise, how a
 * membership runs and the questions. Each card leads to its vertical's own
 * page (/pricing/<slug>) for the full membership.
 *
 * Every word comes from lib/pricing, which is the brief verbatim.
 */

/** How many inclusions a card shows; the rest are on the vertical's page. */
const CARD_ITEMS = 6;

export function PricingHubView() {
  return (
    <main>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Pricing", path: "/pricing" }])]} />

      <Atmosphere tone="brand" origin="top" intensity={0.2}>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pb-12 pt-32 sm:pt-40">
          <Reveal>
            <Breadcrumbs trail={[{ name: "Pricing", path: "/pricing" }]} />
            <h1 className="mt-8 max-w-4xl text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
              {pricingHub.heading}{" "}
              <span className="font-serif italic text-brand-ink">{pricingHub.headingAccent}</span>
            </h1>
            {pricingHub.body.map((line) => (
              <p
                key={line}
                className="mt-4 max-w-2xl text-pretty text-body leading-relaxed text-ash first-of-type:mt-6 sm:text-lead"
              >
                {line}
              </p>
            ))}
          </Reveal>
          <Reveal delay={0.08} className="mt-8 flex flex-wrap gap-3">
            <GlassButton href="#memberships" variant="brand" size="lg" arrow>
              {pricingHub.explore}
            </GlassButton>
            <GlassButton href="#one-time" variant="glass" size="lg" arrow>
              {pricingHub.oneTime}
            </GlassButton>
            <GlassButton href={enquiryHref("a Genesis membership")} variant="ghost" size="lg" arrow>
              {pricingHub.talk}
            </GlassButton>
          </Reveal>
        </div>
      </Atmosphere>

      <MembershipsIntro />

      <section
        id="memberships"
        aria-label="Memberships"
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-6 pb-[var(--section-pad)]"
      >
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {verticals.map((vertical, index) => (
            <Reveal as="li" key={vertical.slug} delay={0.05 * index} className="flex">
              <MembershipCard vertical={vertical} />
            </Reveal>
          ))}
        </ul>
      </section>

      <section
        id="one-time"
        aria-labelledby="one-time-heading"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]"
      >
        <Reveal>
          <h2
            id="one-time-heading"
            className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2"
          >
            One-Time Projects
          </h2>
        </Reveal>
        <Reveal delay={0.06} className="mt-8">
          <PricingTabs
            tabs={verticals.map((vertical) => ({
              label: vertical.division.replace(/^Genesis /, ""),
              content: (
                <>
                  <h3 className="font-sans text-lead text-bone">{vertical.oneTimeHeading}</h3>
                  <ul
                    className={cn(
                      "mt-6 grid gap-4 sm:grid-cols-2",
                      vertical.oneTime.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
                    )}
                  >
                    {vertical.oneTime.map((product) => (
                      <li key={product.name} className="flex">
                        <ProductCard product={product} />
                      </li>
                    ))}
                  </ul>
                </>
              ),
            }))}
          />
        </Reveal>
      </section>

      <UnlimitedAndEnterprise />
      <HowMembershipsWork />
      <Faq />
      <Closing href="#memberships" />
    </main>
  );
}

function MembershipCard({ vertical }: { vertical: VerticalPricing }) {
  const { membership } = vertical;
  const ramp = services.items.find((item) => item.short === vertical.short)?.ramp;
  const page = pricingPath(vertical.slug);
  return (
    <article className="glass glass-lit relative flex w-full flex-col overflow-hidden rounded-panel p-6">
      {/* The division's own colour, as a hairline across the top of the card. */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ backgroundImage: ramp }} />
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-sans text-lead leading-snug text-bone">{vertical.division}</h2>
        <Link
          href={page}
          aria-label={`${vertical.division} — ${membership.name}`}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 text-bone transition-colors hover:border-white/30 hover:bg-white/5"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="micro-label mt-6">{membership.name}</p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-h3 font-normal leading-none tracking-tight text-bone">
          {membership.price}
        </span>
        <span className="text-small text-ash">{membership.period}</span>
      </p>
      <p className="mt-4 text-body leading-snug text-bone">{membership.tagline}</p>
      <p className="mt-3 text-small leading-relaxed text-ash">{membership.description}</p>
      <CheckList
        items={(membership.includedLead ?? []).concat(membership.included).slice(0, CARD_ITEMS)}
        className="mt-5"
      />
      <div className="mt-auto flex flex-col gap-2 pt-8">
        <GlassButton href={joinHref(membership)} variant="brand" arrow className="w-full">
          {membership.cta}
        </GlassButton>
      </div>
    </article>
  );
}
