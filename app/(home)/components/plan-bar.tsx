import Image from "next/image";

import { BuySteps } from "./offer/buy-steps";
import { PlanCaseStudies } from "@/components/genesis/plan-case-studies";
import { Reveal } from "@/components/genesis/reveal";
import { homePlans, verticalCard } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

import { DivisionCtas } from "./division-ctas";
import { DivisionOffers } from "./offer-slider";

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
/* The division mark files and their sizes (public/brand/divisions/mark), as DivisionLockup's MARK set. */
const MARK: Record<VerticalKey, { slug: string; width: number; height: number }> = {
  influence: { slug: "influence", width: 688, height: 165 },
  studios: { slug: "studios", width: 571, height: 168 },
  "ai-labs": { slug: "ai-lab", width: 492, height: 167 },
  "brand-design": { slug: "brand-design", width: 803, height: 120 },
};

/* The catalogue's name for each division, for its case studies. */
const VERTICAL_NAME: Record<VerticalKey, string> = {
  influence: "Influence",
  "ai-labs": "AI Lab",
  studios: "Studios",
  "brand-design": "Brand & Design",
};

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
        className="relative flex flex-col gap-5 rounded-panel bg-ink p-5 text-left sm:p-6 lg:min-h-[48.5rem]"
        style={{
          backgroundImage:
            "radial-gradient(120% 140% at 0% 100%, rgb(245 146 62 / 0.22), transparent 45%), radial-gradient(120% 140% at 100% 0%, rgb(180 92 224 / 0.22), transparent 45%)",
        }}
      >
        <div className="flex flex-col gap-x-8 gap-y-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {/*
              THE LOGO AND THE DIVISION, FIRST (Genesis, 2 Oct 2026): the
              yellow N beside the division's name in its gradient — the mark
              set, as the division's own heading uses — so the bar says whose
              offers these are before it names the product.
            */}
            {/* The N mark and the division, as the other three boxes carry it (Genesis, 4 Oct 2026: "add the other logo"). */}
            <Image
              src={`/brand/divisions/mark/${MARK[vertical].slug}.png`}
              alt={`Genesis ${verticalCard(vertical).short}`}
              width={MARK[vertical].width}
              height={MARK[vertical].height}
              sizes="240px"
              className="mb-4 h-7 w-auto sm:h-8"
            />
            <p className="micro-label !text-brand-ink">{plan.product}</p>
            {/* No promise line here (Genesis, 4 Oct 2026: "remove this"). */}
          </div>
          {/* No "Subscriptions from …" line (Genesis, 2 Oct 2026): the cards below carry every price. */}
          {/*
            ONE BUTTON, INSIDE THE BOX (Genesis, 4 Oct 2026: "remove this and
            move the other button inside the box"): "View …" up here; the call
            and case-studies buttons that sat under the box are gone — the
            case studies have their own column now.
          */}
          <DivisionCtas vertical={vertical} size="sm" primaryOnly className="shrink-0 lg:self-center" />
        </div>
        {/* What this division sells, card by card: a Subscriptions | Pay-per-project switch over its plans and products. */}
        {/*
          TWO COLUMNS INSIDE THE BOX (Genesis, 4 Oct 2026): the offers on the
          left, two to a row, and the division's case studies on the right,
          four portrait cards a page with a way on to the rest.
        */}
        <div className="grid gap-8 border-t border-[var(--glass-border)] pt-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
          <div className="flex min-w-0 flex-col">
            <DivisionOffers vertical={vertical} grid />
            {/* How it works, in the space under the cards (Genesis, 4 Oct 2026: "add a small explainer like this in each section"). */}
            <BuySteps className="mt-auto pt-6 lg:grid-cols-4 [&_li]:p-3 [&_li]:text-small" />
          </div>
          <PlanCaseStudies vertical={VERTICAL_NAME[vertical]} className="lg:border-l lg:border-[var(--glass-border)] lg:pl-8 lg:pt-1" />
        </div>
      </div>
      </div>

    </Reveal>
  );
}
