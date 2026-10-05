import Image from "next/image";
import { ChevronDown } from "lucide-react";

import { BuySteps } from "./offer/buy-steps";
import { PlanCaseStudies } from "@/components/genesis/plan-case-studies";
import { Reveal } from "@/components/genesis/reveal";
import { homePlans, verticalCard } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

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

/** `onPage`: on the division's own page, where a button to that page would go nowhere. */
/* The plan box's frame: the palette as a 1px gradient edge with a soft glow at each end, the box dark inside it. */
const FRAME =
  "min-w-0 rounded-panel p-px shadow-[-24px_18px_60px_-30px_rgb(245_146_62/0.55),24px_18px_60px_-30px_rgb(180_92_224/0.55)]";
const EDGE = "linear-gradient(100deg, #f5923e 0%, #f2607e 40%, #6b4fd8 75%, #c05ce0 100%)";
const GROUND =
  "radial-gradient(120% 140% at 0% 100%, rgb(245 146 62 / 0.22), transparent 45%), radial-gradient(120% 140% at 100% 0%, rgb(180 92 224 / 0.22), transparent 45%)";

/** `plansOnly`: the plans and how it works, without the case-studies column — under a case study, which is already one. */
export function PlanBar({ vertical, className, plansOnly = false }: { vertical: VerticalKey; className?: string; /** Kept for callers; the box no longer carries a button to the page. */
  onPage?: boolean; plansOnly?: boolean }) {
  const plan = homePlans[vertical];
  return (
    <Reveal delay={0.12} className={cn("mt-[var(--block-gap)] w-full", className)}>
      {/*
        TWO BENTOS SIDE BY SIDE, NOT ONE WITH TWO INSIDE (Genesis, 6 Oct 2026:
        "separate the bento grid, remove the bento inside a bento, all across"):
        each its own gradient frame on the dark, glowing ground — the plans and
        how it works on the left, the division's case studies on the right.
        A phone keeps its own layout: the plans box, then the case studies box
        under it (below).
      */}
      <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5", !plansOnly && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")}>
        <div className={FRAME} style={{ background: EDGE }}>
          <div className="relative flex h-full flex-col gap-5 rounded-panel bg-ink p-5 text-left sm:p-6" style={{ backgroundImage: GROUND }}>
            <div className="min-w-0">
              {/* The N mark and the division, then what it sells. */}
              <Image
                src={`/brand/divisions/mark/${MARK[vertical].slug}.png`}
                alt={`Genesis ${verticalCard(vertical).short}`}
                width={MARK[vertical].width}
                height={MARK[vertical].height}
                sizes="240px"
                className="mb-4 h-7 w-auto sm:h-8"
              />
              <p className="micro-label !text-brand-ink">{plan.product}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <DivisionOffers vertical={vertical} grid />
              {/* How it works under the cards; on a phone, folded into a dropdown. */}
              <BuySteps row className={cn("mt-auto pt-4 max-sm:mx-0 max-sm:grid max-sm:grid-cols-1 max-sm:gap-2 max-sm:overflow-visible max-sm:px-0 max-sm:[&_li]:whitespace-nowrap max-sm:[&_li]:gap-3 max-sm:[&_li]:py-2.5 max-sm:[&_li>:first-child]:size-8 max-sm:[&_li>:first-child]:shrink-0 max-sm:[&_li>span:last-child]:text-[0.8125rem] max-sm:[&_li>span:last-child]:leading-tight [&_li]:p-3 lg:[&_li]:gap-2 lg:[&_li>:first-child]:size-7 lg:[&_li>:first-child]:shrink-0 lg:[&_li>span:last-child]:text-[0.8125rem] lg:[&_li>span:last-child]:leading-tight", "max-sm:hidden")} />
              <details className="group/how mt-auto pt-4 sm:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-card border border-[var(--glass-border)] bg-white/[0.03] px-4 py-3 text-small text-bone [&::-webkit-details-marker]:hidden">
                  How it works
                  <ChevronDown className="size-4 transition-transform duration-300 group-open/how:rotate-180" aria-hidden />
                </summary>
                <BuySteps row className="mt-2 max-sm:mx-0 max-sm:grid max-sm:grid-cols-1 max-sm:gap-2 max-sm:overflow-visible max-sm:px-0 max-sm:[&_li]:whitespace-nowrap max-sm:[&_li]:gap-3 max-sm:[&_li]:py-2.5 max-sm:[&_li>:first-child]:size-8 max-sm:[&_li>:first-child]:shrink-0 max-sm:[&_li>span:last-child]:text-[0.8125rem] max-sm:[&_li>span:last-child]:leading-tight [&_li]:p-3 lg:[&_li]:gap-2 lg:[&_li>:first-child]:size-7 lg:[&_li>:first-child]:shrink-0 lg:[&_li>span:last-child]:text-[0.8125rem] lg:[&_li>span:last-child]:leading-tight" />
              </details>
            </div>
          </div>
        </div>

        {!plansOnly && (
          <div className={cn(FRAME, "max-sm:hidden")} style={{ background: EDGE }}>
            <div className="relative flex h-full flex-col gap-4 rounded-panel bg-ink p-5 sm:p-6" style={{ backgroundImage: GROUND }}>
              {/* The "View …" button lives in the division's own section, under its picture (Genesis, 6 Oct 2026), not in the box. */}
              {/* Two cards at a time, tall, filling the panel (Genesis, 6 Oct 2026). */}
              <PlanCaseStudies vertical={VERTICAL_NAME[vertical]} perPage={2} className="min-h-0 flex-1" />
            </div>
          </div>
        )}
      </div>

      {/* On a phone the case studies are a box of their own under the plans, two cards at a time. */}
      {!plansOnly && (
        <div className={cn(FRAME, "mt-4 sm:hidden")} style={{ background: EDGE }}>
          <PlanCaseStudies vertical={VERTICAL_NAME[vertical]} perPage={2} className="rounded-panel bg-ink p-4" style={{ backgroundImage: GROUND }} />
        </div>
      )}
    </Reveal>
  );
}
