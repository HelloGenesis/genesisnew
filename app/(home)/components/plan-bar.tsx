import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { price } from "@/lib/money";
import { bookingHref, homePlans } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

/**
 * THE PRODUCT, AT THE FOOT OF EACH DIVISION ON THE HOMEPAGE.
 *
 * The four sections were built as a portfolio before Genesis became a set of
 * memberships. This bar is where each one names what a visitor can buy — the
 * product, its promise, where subscriptions start — and gives four ways on,
 * in Genesis's words and order (28 Sep 2026): see what the division does,
 * see its work and case studies (both on the division's own page), book a
 * 15-minute call, or send a brief.
 *
 * NO OFFERS HERE. "Save 10%" lives only in the billing switch on the plans
 * themselves; on the homepage the price is said the premium way.
 *
 */
export function PlanBar({ vertical, className }: { vertical: VerticalKey; className?: string }) {
  const plan = homePlans[vertical];
  const small = "max-sm:h-10 max-sm:px-4 max-sm:text-small";
  return (
    <Reveal delay={0.12} className={cn("mt-[var(--block-gap)] w-full", className)}>
      {/*
        STACKED, NOT SIDE BY SIDE. Four buttons beside the copy left the copy a
        column one word wide ("Subscriptions / from / ₹94,999/- / per /
        month"). The product and its price read first; the ways on sit under.
      */}
      <div className="glass glass-strong glass-lit flex flex-col gap-5 rounded-panel p-5 text-left sm:p-6">
        <div className="flex flex-col gap-x-8 gap-y-2 lg:flex-row lg:items-baseline lg:justify-between">
          <div className="min-w-0">
            <p className="micro-label !text-brand-ink">{plan.product}</p>
            <p className="mt-2 font-sans text-lead leading-snug text-bone">{plan.promise}</p>
          </div>
          <p className="shrink-0 text-small text-ash">
            {plan.rate ? (
              <>
                Subscriptions from <span className="text-bone">{price(plan.rate)}</span> per month
              </>
            ) : (
              <span className="text-bone">{plan.priceLine}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span data-track={`home-plan:${vertical}:more`}>
            <GlassButton href={plan.page} pageLink variant="brand" arrow className={small}>
              View more
            </GlassButton>
          </span>
          <span data-track={`home-plan:${vertical}:work`}>
            <GlassButton href={plan.work} pageLink variant="glass" arrow className={small}>
              View work &amp; case studies
            </GlassButton>
          </span>
          <span data-track={`home-plan:${vertical}:book`}>
            <GlassButton href={bookingHref(plan.product)} variant="glass" arrow className={small}>
              Book a 15-min call
            </GlassButton>
          </span>
          <span data-track={`home-plan:${vertical}:brief`}>
            <GlassButton href="/#contact" quickContact={`${vertical}:brief`} variant="ghost" arrow className={small}>
              Send us a brief
            </GlassButton>
          </span>
        </div>
      </div>
    </Reveal>
  );
}
