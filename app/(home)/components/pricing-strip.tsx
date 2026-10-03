import { MembershipCard } from "@/components/genesis/membership-card";
import { PaymentOptions } from "@/components/genesis/payment-options";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { pricingHub } from "@/lib/pricing";

import { BuySteps } from "./offer/buy-steps";
import { OfferSlider } from "./offer-slider";

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

        {/*
          WHAT THERE IS TO BUY, ABOVE HOW IT WORKS (Genesis, 30 Sep 2026): a
          Memberships | One-time Products switch and a row of small cards.
        */}
        <div className="relative mt-10">
          <OfferSlider />
        </div>

        {/*
          THE FOUR STEPS, AS ICONS AND NAMES (Genesis, 30 Sep 2026: "remove the
          one-liner text and numbers, add icons related to these"). The order
          still reads left to right; the icon says what each step is.
        */}
        <BuySteps className="relative mt-8" />

        {/* How you can pay — the flexibility few agencies offer (Genesis, 2 Oct 2026). */}
        <PaymentOptions className="relative mt-6" />
      </Reveal>
    </section>
  );
}
