import { GlassButton } from "@/components/genesis/glass-button";
import { MembershipCard } from "@/components/genesis/membership-card";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { homeHero, pricingHub } from "@/lib/pricing";

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
          THE WORDS ON THE LEFT, THE CARD ON THE RIGHT (Genesis, 29 Sep 2026:
          "move all text on left, move card on right"). Label, heading and
          standfirst read as one column; the card sits beside them, centred.
        */}
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div>
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
            <p className="mt-6 max-w-md text-pretty text-body leading-relaxed text-ash">{pricingHub.body}</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <MembershipCard size="lg" tilt={-8} />
          </div>
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

        {/*
          THE WAYS ON, NO PRICE CARDS (Genesis, 29 Sep 2026: "remove the pricing
          part from here, just keep" the three hero buttons). The same three as
          the hero, from homeHero, so the two can never disagree.
        */}
        <div className="relative mt-8 flex flex-col items-stretch gap-2 min-[480px]:items-start sm:flex-row sm:flex-wrap sm:gap-3">
          {homeHero.ctas.map((cta, index) => (
            <span key={cta.href} data-track={`home-memberships:cta-${index}`}>
              <GlassButton
                href={cta.href}
                pageLink
                variant={index === 0 ? "brand" : "glass"}
                arrow
                className="max-sm:h-11 max-sm:w-full max-sm:px-5 max-sm:text-[0.8125rem]"
              >
                {cta.label}
              </GlassButton>
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
