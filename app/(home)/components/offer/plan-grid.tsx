"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Minus, Plus, TableProperties } from "lucide-react";
import { useId, useState } from "react";

import { GlassButton } from "@/components/genesis/glass-button";
import { Overlay } from "@/components/genesis/overlay";
import { Reveal } from "@/components/genesis/reveal";
import { monthlyListFigure, price, quarterlySaving } from "@/lib/money";
import { planGlossary, planTerms } from "@/lib/pricing";
import type { Plan, PlanGrid as PlanGridData } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { CheckList, SectionHead } from "./parts";

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
  showCompare = true,
}: {
  data: PlanGridData;
  id?: string;
  compact?: boolean;
  /** /pricing leaves it out: the cards themselves say what each plan includes. */
  showCompare?: boolean;
}) {
  /*
    QUARTERLY BY DEFAULT — Genesis's rule: a visitor first sees the quarterly
    rate (paid upfront for three months), and switching to monthly shows the
    10% higher figure. See lib/money.
  */
  const [billing, setBilling] = useState<Billing>("quarterly");
  const [includedOpen, setIncludedOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
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
  const compare = showCompare ? data.compare : undefined;
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
            <PlanCard plan={plan} billing={billing} showInclusions={perCard && includedOpen} />
          </Reveal>
        ))}
      </ul>

      {/* Lines for the whole grid, under it rather than inside one card. */}
      {notes.map((note) => (
        <p key={note} className="mt-5 text-center text-body text-ash">
          {note}
        </p>
      ))}

      {data.footnote && <p className="mt-4 text-small text-faint">{data.footnote}</p>}

      {(data.included || compare) && (
        <div className={cn("mt-6 grid gap-3", compare && "md:grid-cols-[1fr_auto]")}>
          {data.included && (
            <div className="glass glass-lit rounded-panel">
              <button
                type="button"
                aria-expanded={includedOpen}
                aria-controls={perCard ? undefined : includedId}
                onClick={() => setIncludedOpen((open) => !open)}
                className="flex w-full items-center gap-4 rounded-panel p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-card border border-white/12 text-brand-ink">
                  <Plus
                    className={cn("size-4 transition-transform duration-300", includedOpen && "rotate-45")}
                    aria-hidden
                  />
                </span>
                <span className="flex-1">
                  <span className="block text-body text-bone">{data.included.heading}</span>
                  {(data.included.sub ?? data.included.lead) && (
                    <span className="mt-0.5 block text-small text-ash">
                      {data.included.sub ?? data.included.lead}
                    </span>
                  )}
                </span>
                <span className="hidden items-center gap-1.5 text-small text-ash sm:flex">
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
                    <div className="border-t border-white/10 p-5">
                      {data.included.sub && data.included.lead && (
                        <p className="micro-label mb-4">{data.included.lead}</p>
                      )}
                      <CheckList
                        items={data.included.items}
                        className="grid gap-x-8 gap-y-2.5 space-y-0 sm:grid-cols-2 lg:grid-cols-3"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {compare && (
            <button
              type="button"
              data-track="compare-plans"
              onClick={() => setCompareOpen(true)}
              className="glass glass-lit flex items-center gap-4 self-start rounded-panel p-4 text-left transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-card border border-white/12 text-brand-ink">
                <TableProperties className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-body text-bone">Compare Plans</span>
                <span className="mt-0.5 block text-small text-ash">See the detailed side-by-side comparison.</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-ash" aria-hidden />
            </button>
          )}
        </div>
      )}

      {/* The terms and the words, together — see planTerms / planGlossary. */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {planTerms.map((term) => (
            <li key={term} className="flex items-center gap-2 text-small text-faint">
              <span aria-hidden className="size-1 rounded-full bg-brand" />
              {term}
            </li>
          ))}
        </ul>
        <details className="group shrink-0 text-small lg:max-w-md">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-ash transition-colors hover:text-bone [&::-webkit-details-marker]:hidden">
            What these terms mean
            <ChevronDown aria-hidden className="size-4 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <dl className="mt-3 space-y-3 rounded-card border border-white/10 p-4">
            {planGlossary.map((entry) => (
              <div key={entry.term}>
                <dt className="text-bone">{entry.term}</dt>
                <dd className="mt-0.5 text-pretty leading-relaxed text-ash">{entry.meaning}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>

      {compare && (
        <Overlay open={compareOpen} label="Compare plans" onClose={() => setCompareOpen(false)}>
          <div className="overflow-y-auto p-5 sm:p-8" data-lenis-prevent>
            <p className="micro-label">{data.label}</p>
            <h3 className="mt-3 text-h3 font-normal tracking-tight text-bone">Compare Plans</h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-small">
                <thead>
                  <tr>
                    <th scope="col" className="w-[28%] border-b border-white/12 py-3 pr-4 font-normal text-faint">
                      <span className="sr-only">Feature</span>
                    </th>
                    {data.plans.map((plan) => (
                      <th
                        key={plan.name}
                        scope="col"
                        className={cn(
                          "border-b border-white/12 px-3 py-3 font-normal",
                          plan.featured ? "text-brand-ink" : "text-bone",
                        )}
                      >
                        <span className="font-display text-lead">{plan.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Quarterly (per month)", values: data.plans.map((plan) => price(plan.rate)) },
                    { label: "Monthly (per month)", values: data.plans.map((plan) => price(monthlyListFigure(plan.rate))) },
                    ...compare.rows,
                  ].map((row) => (
                    <tr key={row.label} className="align-top">
                      <th scope="row" className="border-b border-white/8 py-3 pr-4 font-normal text-ash">
                        {row.label}
                      </th>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.label}-${index}`}
                          className={cn(
                            "border-b border-white/8 px-3 py-3 text-bone",
                            data.plans[index]?.featured && "bg-brand/[0.04]",
                          )}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {compare.footnote && <p className="mt-4 text-small text-faint">{compare.footnote}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              {data.plans.map((plan) => (
                <GlassButton
                  key={plan.name}
                  href={plan.cta.href}
                  variant={plan.featured ? "brand" : "glass"}
                  arrow
                >
                  {plan.cta.label}
                </GlassButton>
              ))}
            </div>
          </div>
        </Overlay>
      )}
    </div>
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
                    "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.625rem] uppercase tracking-[0.08em]",
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
      <p className="text-small text-brand-ink">{quarterlySaving}</p>
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
}: {
  plan: Plan;
  billing: Billing;
  showInclusions: boolean;
}) {
  return (
    <article
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-panel p-6 sm:p-7",
        plan.featured
          ? "glass glass-strong glass-lit border border-brand/60 shadow-[0_0_0_1px_rgb(255_197_22/0.15),0_24px_64px_-24px_rgb(255_197_22/0.35)]"
          : "glass glass-lit",
      )}
    >
      {plan.featured && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <h3 className="font-display text-h3 font-normal leading-none tracking-tight text-bone">{plan.name}</h3>
        {plan.badge && (
          <span className="rounded-full bg-brand px-3 py-1 text-micro uppercase tracking-[0.14em] text-on-brand">
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
      </div>

      <CheckList items={plan.features} className="relative mt-6" />

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
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="micro-label">What&rsquo;s included</p>
              <ul className="mt-3 space-y-2">
                {plan.inclusions.map(({ item, included }) => (
                  <li key={item} className="flex items-start gap-3 text-small leading-snug">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                        included ? "bg-brand/20 text-brand-ink" : "bg-white/5 text-faint",
                      )}
                    >
                      {included ? <Check className="size-2.5" strokeWidth={3} /> : <Minus className="size-2.5" strokeWidth={3} />}
                    </span>
                    <span className={included ? "text-bone" : "text-faint line-through decoration-white/20"}>
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
        <GlassButton
          href={plan.cta.href}
          variant={plan.featured ? "brand" : "glass"}
          arrow
          className="w-full"
        >
          {plan.cta.label}
        </GlassButton>
      </div>
    </article>
  );
}
