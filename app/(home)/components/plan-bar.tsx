import { Reveal } from "@/components/genesis/reveal";
import { DivisionCtas } from "./division-ctas";
import { price } from "@/lib/money";
import { homePlans } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

/**
 * THE PRODUCT, AT THE FOOT OF EACH DIVISION ON THE HOMEPAGE.
 *
 * The four sections were built as a portfolio before Genesis became a set of
 * memberships. This bar is where each one names what a visitor can buy — the
 * product, its promise, where subscriptions start — and the division's
 * three ways on (Genesis, 29 Sep 2026): View Page, Explore Pricing (a menu of
 * its pricing models) and Case Studies (the homepage's own, filtered to the
 * division). See DivisionCtas.
 *
 * NO OFFERS HERE. "Save 10%" lives only in the billing switch on the plans
 * themselves; on the homepage the price is said the premium way.
 *
 */
export function PlanBar({ vertical, className }: { vertical: VerticalKey; className?: string }) {
  const plan = homePlans[vertical];
  return (
    <Reveal delay={0.12} className={cn("mt-[var(--block-gap)] w-full", className)}>
      {/*
        STACKED, NOT SIDE BY SIDE. Four buttons beside the copy left the copy a
        column one word wide ("Subscriptions / from / ₹94,999/- / per /
        month"). The product and its price read first; the ways on sit under.
      */}
      {/*
        THE GRADIENT EDGE (Genesis, 29 Sep 2026): the palette's amber → coral →
        violet as a 1px frame with a soft glow at each end, the bar itself dark
        inside it — the same family as the plan cards and the stats bar.
      */}
      <div
        className="rounded-panel p-px shadow-[-24px_18px_60px_-30px_rgb(245_146_62/0.55),24px_18px_60px_-30px_rgb(180_92_224/0.55)]"
        style={{ background: "linear-gradient(100deg, #f5923e 0%, #f2607e 40%, #6b4fd8 75%, #c05ce0 100%)" }}
      >
      <div
        className="relative flex flex-col gap-5 rounded-panel bg-ink p-5 text-left sm:p-6"
        style={{
          backgroundImage:
            "radial-gradient(120% 140% at 0% 100%, rgb(245 146 62 / 0.22), transparent 45%), radial-gradient(120% 140% at 100% 0%, rgb(180 92 224 / 0.22), transparent 45%)",
        }}
      >
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
        <DivisionCtas vertical={vertical} size="sm" opens="up" />
      </div>
      </div>
    </Reveal>
  );
}
