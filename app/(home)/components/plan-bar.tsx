import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { price, quarterlySaving } from "@/lib/money";
import { homePlans } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

/**
 * THE PRODUCT, AT THE FOOT OF EACH DIVISION ON THE HOMEPAGE.
 *
 * The four sections were built as a portfolio — the work, then "start a
 * project" — before Genesis became a set of memberships. This bar is where
 * each one turns into the thing a visitor can buy: the product's name, its
 * promise, where the price starts, and three ways on — the plans, a direct
 * start (the payment link once it is set), and the work, quietest of the three.
 *
 * One component for all four, so the sections read as one offer.
 */
export function PlanBar({ vertical, className }: { vertical: VerticalKey; className?: string }) {
  const plan = homePlans[vertical];
  return (
    <Reveal delay={0.12} className={cn("mt-[var(--block-gap)] w-full", className)}>
      <div className="glass glass-strong glass-lit flex flex-col gap-5 rounded-panel p-5 text-left sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="micro-label !text-brand-ink">{plan.product}</p>
          <p className="mt-2 font-sans text-lead leading-snug text-bone">{plan.promise}</p>
          <p className="mt-2 text-small text-ash">
            {plan.rate ? (
              <>
                From <span className="text-bone">{price(plan.rate)}</span> per month
                <span className="text-brand-ink"> · {quarterlySaving}</span>
              </>
            ) : (
              <span className="text-bone">{plan.priceLine}</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <span data-track={`home-plan:${vertical}:plans`}>
            <GlassButton href={plan.plans.href} variant="brand" arrow className="max-sm:h-10 max-sm:px-4 max-sm:text-small">
              {plan.plans.label}
            </GlassButton>
          </span>
          <span data-track={`home-plan:${vertical}:start`}>
            <GlassButton href={plan.start.href} variant="glass" arrow className="max-sm:h-10 max-sm:px-4 max-sm:text-small">
              {plan.start.label}
            </GlassButton>
          </span>
          <GlassButton
            href="#library"
            selectsFilter={plan.work.filter}
            variant="ghost"
            className="max-sm:h-10 max-sm:px-3 max-sm:text-small"
          >
            {plan.work.label}
          </GlassButton>
        </div>
      </div>
    </Reveal>
  );
}
