"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarX, Check, ChevronDown, CirclePause, MapPin, Minus, Plus, ReceiptIndianRupee } from "lucide-react";
import { useId, useState } from "react";

import { AddToCart } from "@/components/genesis/cart";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { productId } from "@/lib/cart";
import { monthlyListFigure, price } from "@/lib/money";
import { planGlossary, planTerms } from "@/lib/pricing";
import { shootNote } from "@/lib/regions";
import type { Plan, PlanGrid as PlanGridData, VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { CheckList, SectionHead } from "./parts";
import { PLANS_GRADIENT, tierGlow, tierGradient } from "./tier-colors";

/** An icon for each of the three terms, in planTerms order: stop, pause, GST. */
const TERM_ICONS = [CalendarX, CirclePause, ReceiptIndianRupee];

export type Billing = "monthly" | "quarterly";

/**
 * A vertical's monthly plans: the billing switch, three cards, and the two
 * compact actions under them.
 *
 * THE BRIEF'S RULE FOR THIS BLOCK: "I would NOT immediately show a giant
 * feature matrix here." The cards carry the headline lines only; what every
 * plan includes opens in place, and the side-by-side opens in a window —
 * "only for users who actually want the detail".
 *
 * `compact` is the same grid inside a /pricing tab, where the section head
 * belongs to the tab rather than to the grid.
 */
export function PlanGrid({
  data,
  id,
  compact = false,
  vertical,
}: {
  data: PlanGridData;
  /** Whose plans — the cards' Purchase / Add to cart put that membership in the cart. */
  vertical?: VerticalKey;
  id?: string;
  compact?: boolean;
}) {
  /*
    QUARTERLY BY DEFAULT — Genesis's rule: a visitor first sees the quarterly
    rate (paid upfront for three months), and switching to monthly shows the
    10% higher figure. See lib/money.
  */
  const [billing, setBilling] = useState<Billing>("quarterly");
  const [includedOpen, setIncludedOpen] = useState(false);
  const includedId = useId();
  const headingId = useId();
  /*
    WHAT'S INCLUDED, INSIDE EACH CARD. When the plans carry their own
    inclusions, "View What's Included" opens a list in every card — what that
    plan includes and what it does not — instead of one shared list beneath
    them, so a reader compares by reading across the cards they are already
    looking at.
  */
  const perCard = data.plans.some((plan) => plan.inclusions);
  const notes = [...new Set(data.plans.map((plan) => plan.note).filter(Boolean))] as string[];

  const toggle = data.billing ? (
    <BillingToggle value={billing} onChange={setBilling} note={data.billingNote} />
  ) : null;

  return (
    <div id={id} className="scroll-mt-24">
      {compact ? (
        toggle && <div className="flex justify-end">{toggle}</div>
      ) : (
        <SectionHead
          id={headingId}
          label={data.label}
          heading={data.heading}
          accent={data.headingAccent}
          body={data.body}
          aside={toggle && <div className="mt-6 flex lg:justify-end">{toggle}</div>}
        />
      )}

      <ul className={cn("grid gap-4 lg:grid-cols-3", compact ? "mt-6" : "mt-10")}>
        {data.plans.map((plan, index) => (
          <Reveal as="li" key={plan.name} delay={0.05 * index} className="flex">
            <PlanCard plan={plan} tier={index} billing={billing} showInclusions={perCard && includedOpen} vertical={vertical} />
          </Reveal>
        ))}
      </ul>

      {/* Lines for the whole grid, under it rather than inside one card. */}
      {data.plans.some((plan) => plan.inPerson) && (
        <p className="mt-5 text-center text-small text-ash">{shootNote}</p>
      )}
      {notes.map((note) => (
        <p key={note} className="mt-5 text-center text-body text-ash">
          {note}
        </p>
      ))}

      {data.footnote && <p className="mt-4 text-small text-faint">{data.footnote}</p>}

      {/*
        THE PLANS' FOOTING, IN THE PLANS' PALETTE (Genesis, 28 Sep 2026: "make
        this in the same colour palette as it's a part of the above box …
        remove compare plans"). "View What's Included" is a gradient-edged
        card like the plans; the three terms are a bento beneath it, and what
        the plan words mean opens below them. The side-by-side comparison is
        gone — the cards already say what each plan includes.
      */}
      {data.included && (
        <div className="mt-6 rounded-panel p-px" style={{ background: PLANS_GRADIENT }}>
          <div className="rounded-panel bg-ink">
            <button
              type="button"
              aria-expanded={includedOpen}
              aria-controls={perCard ? undefined : includedId}
              onClick={() => setIncludedOpen((open) => !open)}
              className="flex w-full items-center gap-4 rounded-panel p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-5"
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-card text-white"
                style={{ background: PLANS_GRADIENT }}
              >
                <Plus
                  className={cn("size-4 transition-transform duration-300", includedOpen && "rotate-45")}
                  aria-hidden
                />
              </span>
              <span className="flex-1">
                <span className="block text-body text-bone">{data.included.heading}</span>
                {(data.included.sub ?? data.included.lead) && (
                  <span className="mt-0.5 block text-small text-ash">{data.included.sub ?? data.included.lead}</span>
                )}
              </span>
              <span className="hidden items-center gap-1.5 text-small text-bone sm:flex">
                {includedOpen ? "Hide details" : "View What\u2019s Included"}
                <ChevronDown
                  className={cn("size-4 transition-transform duration-300", includedOpen && "rotate-180")}
                  aria-hidden
                />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {includedOpen && !perCard && (
                <motion.div
                  id={includedId}
                  key="included"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[var(--glass-border)] p-5">
                    {data.included.sub && data.included.lead && <p className="micro-label mb-4">{data.included.lead}</p>}
                    <CheckList
                      items={data.included.items}
                      className="grid gap-x-8 gap-y-2.5 space-y-0 sm:grid-cols-2 lg:grid-cols-3"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* The terms, as a bento — the first cell the widest. See planTerms. */}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        {planTerms.map((term, index) => {
          const Icon = TERM_ICONS[index % TERM_ICONS.length];
          return (
            <li
              key={term}
              className={cn(
                "relative flex items-start gap-4 overflow-hidden rounded-panel border border-[var(--glass-border)] bg-ink p-4 sm:p-5",
                index === 0 && "sm:col-span-2 lg:col-span-1",
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full blur-2xl"
                style={{ background: tierGlow(index) }}
              />
              <span
                className="relative grid size-10 shrink-0 place-items-center rounded-card text-white"
                style={{ background: tierGradient(index) }}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="relative text-pretty text-small leading-relaxed text-bone">{term}</span>
            </li>
          );
        })}
      </ul>

      {/* What the plan words mean — below the terms. See planGlossary. */}
      <details className="group mt-3 rounded-panel border border-[var(--glass-border)] bg-ink">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-small text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-5 [&::-webkit-details-marker]:hidden">
          What these terms mean
          <ChevronDown aria-hidden className="size-4 text-ash transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <dl className="grid gap-x-8 gap-y-4 border-t border-[var(--glass-border)] p-4 text-small sm:grid-cols-2 sm:px-5">
          {planGlossary.map((entry) => (
            <div key={entry.term}>
              <dt className="text-bone">{entry.term}</dt>
              <dd className="mt-0.5 text-pretty leading-relaxed text-ash">{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

/** "Mumbai only, for now" — on anything that needs a physical shoot. See SHOOT_CITY. */
export function ShootChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-ash",
        className,
      )}
      title={shootNote}
    >
      <MapPin className="size-3 text-brand-ink" aria-hidden />
      Mumbai only, for now
    </span>
  );
}

export function BillingToggle({
  value,
  onChange,
  align = "end",
}: {
  value: Billing;
  onChange: (value: Billing) => void;
  /** Kept for the copy files; the toggle now writes its own line. */
  note?: string;
  /** "start" inside a card; "end" beside a section heading. */
  align?: "start" | "end";
}) {
  return (
    <div className={cn("flex flex-col items-start gap-2", align === "end" && "lg:items-end")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-small text-faint">Billing</span>
        <div role="radiogroup" aria-label="Billing" className="glass-chip flex rounded-full p-1">
          {(["quarterly", "monthly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              data-track={`billing:${option}`}
              aria-checked={value === option}
              onClick={() => onChange(option)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-small capitalize transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                value === option ? "bg-brand text-on-brand" : "text-ash hover:text-bone",
              )}
            >
              {option}
              {option === "quarterly" && (
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.6875rem] uppercase tracking-[0.06em]",
                    value === option ? "bg-black/15" : "bg-brand/15 text-brand-ink",
                  )}
                >
                  Save 10%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <p className="text-small text-faint">
        {value === "quarterly" ? "Paid upfront for 3 months." : "Billed month to month."}
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  showInclusions,
  vertical,
  tier,
}: {
  plan: Plan;
  /** Its place in the grid — which of the three tier gradients it wears. */
  tier: number;
  billing: Billing;
  showInclusions: boolean;
  vertical?: VerticalKey;
}) {
  const gradient = tierGradient(tier);
  /*
    DRAWN LIKE THE ONE-TIME CARD, EACH TIER IN ITS OWN GRADIENT (Genesis, 28
    Sep 2026: "make this according to image 2 … 3 different gradients"): a
    1px gradient edge, a solid card, a glow, the name and badge in the tier's
    colours and its points as the tier's dots. Theme tokens throughout, so it
    holds on the light theme as well as the dark.
  */
  return (
    <div
      className={cn(
        "flex w-full rounded-panel p-px",
        plan.featured ? "shadow-[0_30px_80px_-30px_var(--tier-glow)]" : "shadow-[0_24px_60px_-36px_var(--tier-glow)]",
      )}
      style={{ background: gradient, ["--tier-glow" as string]: tierGlow(tier) }}
    >
    <article className="relative flex w-full flex-col overflow-hidden rounded-panel bg-ink p-6 sm:p-7">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full blur-3xl"
        style={{ background: tierGlow(tier) }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <h3
          className="bg-clip-text font-display text-h3 font-normal leading-none tracking-tight text-transparent"
          style={{ backgroundImage: gradient }}
        >
          {plan.name}
        </h3>
        {plan.badge && (
          <span
            className="rounded-full px-3 py-1 text-micro uppercase tracking-[0.14em] text-white"
            style={{ background: gradient }}
          >
            {plan.badge}
          </span>
        )}
      </div>
      {/* A fixed height from lg, so the three prices sit on one line whatever the copy above them runs to. */}
      <div className={cn("relative", plan.tagline ? "lg:min-h-[8.75rem]" : "lg:min-h-[5rem]")}>
        {plan.tagline && <p className="mt-3 text-body text-bone">{plan.tagline}</p>}
        <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{plan.description}</p>
      </div>

      <div className="relative mt-6">
        <p className="flex flex-wrap items-baseline gap-x-2">
          {/*
            THE "/-" SET SMALL. Mont's slash goes to the fallback face (see
            app/layout), which at display size drew a heavy stroke beside a
            hairline figure. At the unit's size it reads as the suffix it is.
          */}
          <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">
            {price(billing === "quarterly" ? plan.rate : monthlyListFigure(plan.rate)).replace(/\/-$/, "")}
          </span>
          <span className="-ml-1.5 text-lead text-ash">/-</span>
          <span className="text-small text-ash">per month</span>
        </p>
        {plan.inPerson && <ShootChip className="mt-3" />}
      </div>

      <ul className="relative mt-6 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-body leading-snug text-bone">
            <span aria-hidden className="mt-[0.5em] size-1.5 shrink-0 rounded-full" style={{ background: gradient }} />
            {feature}
          </li>
        ))}
      </ul>

      <AnimatePresence initial={false}>
        {showInclusions && plan.inclusions && (
          <motion.div
            key="inclusions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
          >
            <div className="mt-6 border-t border-[var(--glass-border)] pt-5">
              <p className="micro-label">What&rsquo;s included</p>
              <ul className="mt-3 space-y-2">
                {plan.inclusions.map(({ item, included }) => (
                  <li key={item} className="flex items-start gap-3 text-small leading-snug">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                        included ? "bg-brand/20 text-brand-ink" : "bg-[var(--hover-wash)] text-faint",
                      )}
                    >
                      {included ? <Check className="size-2.5" strokeWidth={3} /> : <Minus className="size-2.5" strokeWidth={3} />}
                    </span>
                    <span className={included ? "text-bone" : "text-faint line-through decoration-[var(--glass-border)]"}>
                      {typeof included === "string" ? `${item}: ${included}` : item}
                      <span className="sr-only">{included ? " — included" : " — not included"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mt-auto pt-8" data-track={`plan:${plan.name}`}>
        {/*
          PURCHASE OR ADD TO CART (Genesis, 28 Sep 2026) — with the billing the
          grid's switch shows. Without a vertical (nothing to buy) the plan's
          own button stays.
        */}
        {vertical ? (
          <AddToCart
            id={productId(vertical, "membership", plan.name)}
            billing={billing}
            purchase
            variant={plan.featured ? "brand" : "glass"}
            className="[&>*]:min-w-[8.5rem]"
          />
        ) : (
          <GlassButton href={plan.cta.href} variant={plan.featured ? "brand" : "glass"} arrow className="w-full">
            {plan.cta.label}
          </GlassButton>
        )}
      </div>
    </article>
    </div>
  );
}
