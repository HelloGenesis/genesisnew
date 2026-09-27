"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Plus, TableProperties } from "lucide-react";
import { useId, useState } from "react";

import { GlassButton } from "@/components/genesis/glass-button";
import { Overlay } from "@/components/genesis/overlay";
import { Reveal } from "@/components/genesis/reveal";
import { planGlossary, planTerms, quarterlyLine } from "@/lib/pricing";
import type { Plan, PlanGrid as PlanGridData } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { CheckList, SectionHead } from "./parts";

type Billing = "monthly" | "quarterly";

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
}: {
  data: PlanGridData;
  id?: string;
  compact?: boolean;
}) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [includedOpen, setIncludedOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const includedId = useId();
  const headingId = useId();

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
            <PlanCard plan={plan} billing={billing} />
          </Reveal>
        ))}
      </ul>

      {data.footnote && <p className="mt-4 text-small text-faint">{data.footnote}</p>}

      {(data.included || data.compare) && (
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          {data.included && (
            <div className="glass glass-lit rounded-panel">
              <button
                type="button"
                aria-expanded={includedOpen}
                aria-controls={includedId}
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
                  View What&rsquo;s Included
                  <ChevronDown
                    className={cn("size-4 transition-transform duration-300", includedOpen && "rotate-180")}
                    aria-hidden
                  />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {includedOpen && (
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
          {data.compare && (
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

      {data.compare && (
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
                  {data.compare.rows.map((row) => (
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
            {data.compare.footnote && <p className="mt-4 text-small text-faint">{data.compare.footnote}</p>}
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
  note,
}: {
  value: Billing;
  onChange: (value: Billing) => void;
  note?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <div className="flex items-center gap-3">
        <span className="text-small text-faint">Billing</span>
        <div role="radiogroup" aria-label="Billing" className="glass-chip flex rounded-full p-1">
          {(["monthly", "quarterly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              data-track={`billing:${option}`}
              aria-checked={value === option}
              onClick={() => onChange(option)}
              className={cn(
                "h-9 rounded-full px-4 text-small capitalize transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                value === option ? "bg-brand text-on-brand" : "text-ash hover:text-bone",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {note && (
        <p className={cn("text-small text-faint transition-opacity", value === "quarterly" ? "opacity-100" : "opacity-60")}>
          {value === "quarterly" ? "Billed every 3 months" : note}
        </p>
      )}
    </div>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
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
      <div className={cn("relative", plan.tagline ? "lg:min-h-[8.75rem]" : "lg:min-h-[4.25rem]")}>
        {plan.tagline && <p className="mt-3 text-body text-bone">{plan.tagline}</p>}
        <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{plan.description}</p>
      </div>

      <div className="relative mt-6 min-h-[4.5rem]">
        {billing === "monthly" ? (
          <p className="flex items-baseline gap-2">
            <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">
              {plan.price}
            </span>
            <span className="text-small text-ash">{plan.period}</span>
          </p>
        ) : (
          <>
            <p className="flex items-baseline gap-1">
              <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">
                {plan.price}
              </span>
              <span className="text-small text-ash">/mo</span>
            </p>
            <p className="mt-2 text-small text-brand-ink">{quarterlyLine(plan.monthly)}</p>
          </>
        )}
      </div>

      <CheckList items={plan.features} className="relative mt-6" />

      <div className="relative mt-auto pt-8" data-track={`plan:${plan.name}`}>
        <GlassButton
          href={plan.cta.href}
          variant={plan.featured ? "brand" : "glass"}
          arrow
          className="w-full"
        >
          {plan.cta.label}
        </GlassButton>
        {plan.note && <p className="mt-3 text-center text-small text-faint">{plan.note}</p>}
      </div>
    </article>
  );
}
