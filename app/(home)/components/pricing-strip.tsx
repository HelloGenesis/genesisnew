import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { GlassButton } from "@/components/genesis/glass-button";
import { MembershipCard } from "@/components/genesis/membership-card";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { bookingHref, entryPrice, pricingHub, verticalCards } from "@/lib/pricing";

/**
 * HOW GENESIS WORKS, ON THE HOMEPAGE — after the four divisions, before the
 * portfolio.
 *
 * The first pricing brief's full Memberships section came off the homepage at
 * Genesis's request; a one-line strip replaced it. Genesis then asked for the
 * homepage to "convey what we've built the website into" and to point more
 * often at memberships and payment. So the model is said once, plainly, in
 * the /pricing page's own words: one team, one monthly fee, a moving queue;
 * the four steps; where each division starts; and two ways on.
 */
export function PricingStrip() {
  return (
    <section
      id="memberships"
      aria-labelledby="memberships-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]"
    >
      <Reveal className="glass glass-strong glass-lit relative overflow-hidden rounded-panel p-6 sm:p-10">
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/15 blur-3xl" />

        {/*
          THE CARD ON THE LEFT, ABOVE THE HEADING; THE STANDFIRST ON THE RIGHT,
          at reading width and aligned to the heading's foot (Genesis, 28 Sep
          2026). The card had been squeezing the paragraph into a column a
          few words wide.
        */}
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <div>
            <MembershipCard size="md" tilt={-8} className="mb-8 ml-2" />
            <SectionLabel dot tone="brand">
              {pricingHub.label}
            </SectionLabel>
            <h2
              id="memberships-heading"
              className="mt-5 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2"
            >
              {pricingHub.heading}{" "}
              <span className="block font-serif italic text-brand-ink">{pricingHub.headingAccent}</span>
            </h2>
          </div>
          <p className="max-w-md text-pretty text-body leading-relaxed text-ash lg:pb-1">{pricingHub.body}</p>
        </div>

        {/* The four steps. */}
        <ol className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pricingHub.steps.items.map((step, index) => (
            <li key={step.title} className="rounded-card border border-white/10 bg-white/[0.03] p-4">
              <span className="font-display text-h3 font-normal leading-none text-brand-ink">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 font-sans text-body text-bone">{step.title}</p>
              <p className="mt-1 text-pretty text-small leading-relaxed text-ash">{step.body}</p>
            </li>
          ))}
        </ol>

        {/* Where each division starts — each opens /pricing on its own tab. */}
        <ul className="relative mt-6 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {verticalCards.map((card) => (
            <li key={card.key}>
              <Link
                href={`/pricing?v=${card.key}#plans`}
                data-track={`home-memberships:${card.key}`}
                className="group flex h-full items-start justify-between gap-2 rounded-card border border-white/10 px-4 py-3 transition-colors hover:border-brand/50 hover:bg-brand/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span>
                  <span className="block text-small text-bone">{card.key === "ai-labs" ? "AI Labs" : card.short}</span>
                  <span className="mt-1 block text-small text-ash">{card.from}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-faint transition-colors group-hover:text-brand-ink" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <div className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-ash">
            Subscriptions from <span className="text-bone">{verticalCards.find((card) => card.key === "brand-design")?.from}</span>
            {" · "}AI content from <span className="text-bone">{entryPrice}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <span data-track="home-memberships:pricing">
              <GlassButton href="/pricing" variant="brand" arrow>
                Explore Memberships
              </GlassButton>
            </span>
            <span data-track="home-memberships:book">
              <GlassButton href={bookingHref("Genesis memberships")} variant="glass" arrow>
                Book a 15-min Call
              </GlassButton>
            </span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
