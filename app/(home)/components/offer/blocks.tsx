import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";

import { Reveal } from "@/components/genesis/reveal";
import { mediaUrl } from "@/lib/media-url";
import type { Closing, Faq, IconCard, Steps, Turnaround } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { IconTile, OfferIcon } from "./icons";
import { CheckList, OfferSection, SectionHead } from "./parts";
import { VerticalCtas } from "./vertical-ctas";

/**
 * The repeating blocks of the four vertical pages. Each takes a slice of a
 * lib/verticals copy file and lays it out; none holds copy of its own.
 */

/** "Every video includes" — compact icon cards, four or three across. */
export function IconCards({
  items,
  columns = 4,
  className,
}: {
  items: readonly IconCard[];
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <Reveal as="li" key={item.title} delay={0.03 * index} className="flex">
          <div className="glass glass-lit flex w-full items-start gap-4 rounded-card p-4 sm:p-5">
            <IconTile name={item.icon} />
            <div className="min-w-0">
              {item.label && <p className="micro-label !tracking-[0.18em]">{item.label}</p>}
              <h3 className={cn("font-sans text-body leading-snug text-bone", item.label && "mt-2")}>{item.title}</h3>
              {item.body && <p className="mt-1 text-pretty text-small leading-relaxed text-ash">{item.body}</p>}
              {item.tier && <TierTag className="mt-3">{item.tier}</TierTag>}
            </div>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

/** Which tiers get an item, as a small outlined label. */
export function TierTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-brand/40 px-2.5 py-0.5 text-[0.6875rem] leading-snug text-brand-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

type VideoTier = {
  name: string;
  length: string;
  plans: string;
  lead?: string;
  includes: readonly string[];
  excludes?: readonly string[];
  turnaround?: string;
  featured?: boolean;
};

/**
 * Standard, Premium or Advanced — what separates the three kinds of video the
 * AI plans count. Three columns, each building on the last.
 */
export function VideoTiers({
  data,
  compact = false,
  bare = false,
}: {
  data: { label: string; heading: string; body: string; tiers: readonly VideoTier[] };
  compact?: boolean;
  /** No heading at all — the fold it sits in already names it. */
  bare?: boolean;
}) {
  return (
    <div>
      {bare ? null : compact ? (
        <h4 className="mb-4 font-sans text-body text-bone">{data.heading}</h4>
      ) : (
        <SectionHead label={data.label} heading={data.heading} body={data.body} />
      )}
      <ul className={cn("grid gap-3 md:grid-cols-3", !compact && !bare && "mt-10")}>
        {data.tiers.map((tier, index) => (
          <Reveal as="li" key={tier.name} delay={0.05 * index} className="flex">
            <article
              className={cn(
                "flex w-full flex-col rounded-panel p-5 sm:p-6",
                tier.featured ? "glass glass-strong glass-lit border border-brand/50" : "glass glass-lit",
              )}
            >
              <h3 className="font-sans text-lead leading-snug text-bone">{tier.name}</h3>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-h3 font-normal leading-none tracking-tight text-brand-ink">
                  {tier.length}
                </span>
              </p>
              <p className="mt-2 text-small text-faint">In: {tier.plans}</p>
              {tier.lead && <p className="mt-5 text-small text-bone">{tier.lead}</p>}
              <CheckList items={tier.includes} className={tier.lead ? "mt-3" : "mt-5"} />
              {tier.excludes && (
                <p className="mt-4 text-pretty text-small leading-relaxed text-faint">
                  Not included: {tier.excludes.join(", ")}
                </p>
              )}
              {tier.turnaround && (
                <>
                  {/* Pins the turnaround to the card's foot, never closer than 20px to the list. */}
                  <span aria-hidden className="min-h-5 flex-1" />
                  <p className="border-t border-white/10 pt-4 text-small text-ash">
                    Typical turnaround: <span className="text-bone">{tier.turnaround}</span>
                  </p>
                </>
              )}
            </article>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

/** How it works — numbered steps joined by arrows, then the capacity note. */
export function StepsBlock({ data, id }: { data: Steps; id?: string }) {
  const count = data.steps.length;
  return (
    <OfferSection id={id} labelledBy={`${id ?? "steps"}-heading`}>
      <SectionHead
        id={`${id ?? "steps"}-heading`}
        label={data.label}
        heading={data.heading}
        accent={data.headingAccent}
        body={data.body}
      />
      <ol
        className={cn(
          "mt-10 grid gap-4 sm:grid-cols-2",
          count >= 6 ? "lg:grid-cols-3 xl:grid-cols-6" : count === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
        )}
      >
        {data.steps.map((step, index) => (
          <Reveal as="li" key={step.title} delay={0.05 * index} className="relative flex">
            <div className="glass glass-lit flex w-full flex-col rounded-panel p-5">
              <div className="flex items-center justify-between gap-3">
                {step.icon ? <IconTile name={step.icon} /> : <span />}
                <span className="font-display text-h3 font-normal leading-none tracking-tight text-brand-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-sans mt-5 text-body leading-snug text-bone">{step.title}</h3>
              <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{step.body}</p>
            </div>
            {index < count - 1 && (
              <ArrowRight
                aria-hidden
                className="absolute -right-3.5 top-1/2 z-[1] hidden size-4 -translate-y-1/2 text-brand-ink lg:block"
              />
            )}
          </Reveal>
        ))}
      </ol>
      {(data.capacity || data.note) && (
        <Reveal className="mt-6 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
          {data.capacity && (
            <div className="glass-chip flex flex-wrap items-center gap-2 rounded-panel p-3">
              <span className="px-2 text-small text-faint">{data.capacity.heading}</span>
              {data.capacity.rows.map((row, index) => (
                <span
                  key={row}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-small",
                    index === 0 ? "bg-brand/15 text-brand-ink" : "bg-white/5 text-bone",
                  )}
                >
                  {row}
                </span>
              ))}
            </div>
          )}
          {data.note && <p className="text-pretty text-small leading-relaxed text-ash">{data.note}</p>}
        </Reveal>
      )}
    </OfferSection>
  );
}

/** Turnaround — one horizontal strip of three tiers, the first lit. */
export function TurnaroundBlock({ data, id }: { data: Turnaround; id?: string }) {
  return (
    <OfferSection id={id} labelledBy="turnaround-heading">
      <SectionHead id="turnaround-heading" label={data.label} heading={data.heading} body={data.body} />
      <TurnaroundStrip data={data} className="mt-10" />
      {data.notes?.map((note) => (
        <p key={note} className="mt-3 max-w-3xl text-pretty text-small leading-relaxed text-faint first-of-type:mt-5">
          {note}
        </p>
      ))}
    </OfferSection>
  );
}

export function TurnaroundStrip({
  data,
  className,
  stacked = false,
}: {
  data: Turnaround;
  className?: string;
  /** One card above another — a narrow column, such as beside a product's price. */
  stacked?: boolean;
}) {
  return (
    <ul className={cn("grid gap-3", !stacked && "md:grid-cols-3", className)}>
      {data.tiers.map((tier, index) => (
        <Reveal as="li" key={tier.time} delay={0.05 * index} className="flex">
          <div
            className={cn(
              "flex w-full items-start gap-4 rounded-panel p-5",
              index === 0 ? "glass glass-strong glass-lit border border-brand/40" : "glass glass-lit",
            )}
          >
            {tier.icon && <IconTile name={tier.icon} />}
            <div>
              <p className="font-display text-lead leading-tight text-bone">{tier.time}</p>
              <p className="mt-1 text-small text-brand-ink">{tier.title}</p>
              {tier.items && (
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{tier.items.join(" · ")}</p>
              )}
              {tier.detail && (
                <details className="group/tier mt-2">
                  <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-full text-small text-bone/80 transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
                    {tier.detail.label}
                    <ChevronDown aria-hidden className="size-3.5 transition-transform duration-300 group-open/tier:rotate-180" />
                  </summary>
                  {tier.detail.lead && <span className="mt-2 block text-small text-faint">{tier.detail.lead}</span>}
                  <ul className="mt-2.5 space-y-1.5">
                    {tier.detail.items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-small leading-snug text-bone/90">
                        <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-brand-ink" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {tier.note && (
                <p className="mt-2 border-t border-[var(--glass-border)] pt-2 text-pretty text-[0.75rem] leading-relaxed text-faint">
                  {tier.note}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

/**
 * The closing band — the dark hero-like panel every page ends on before the
 * footer, with a small collage of the vertical's own work beside the copy.
 */
export function ClosingBand({
  data,
  images = [],
}: {
  data: Closing;
  images?: readonly string[];
}) {
  return (
    <OfferSection>
      <Reveal className="glass glass-strong glass-lit relative overflow-hidden rounded-panel">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/15 blur-3xl"
        />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-14">
          <div>
            <p className="micro-label">{data.label}</p>
            <h2 className="mt-5 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
              {data.heading}{" "}
              {data.headingAccent && (
                <span className="block font-serif italic text-brand-ink">{data.headingAccent}</span>
              )}
            </h2>
            {data.body.map((line) => (
              <p key={line} className="mt-3 max-w-xl text-pretty text-body leading-relaxed text-ash first-of-type:mt-5">
                {line}
              </p>
            ))}
            <VerticalCtas className="mt-8" />
            {data.footnote && (
              <p className="mt-8 text-small text-faint">{data.footnote.join(" ")}</p>
            )}
          </div>
          {images.length > 0 && (
            <div aria-hidden className="relative hidden h-80 lg:block">
              {images.slice(0, 3).map((src, index) => (
                <div
                  key={src}
                  className="absolute overflow-hidden rounded-panel border border-white/15 shadow-[var(--shadow-float)]"
                  style={{
                    width: index === 1 ? "46%" : "38%",
                    aspectRatio: "4 / 5",
                    left: ["0%", "28%", "60%"][index],
                    top: ["14%", "0%", "18%"][index],
                    rotate: ["-6deg", "0deg", "7deg"][index],
                    zIndex: index === 1 ? 2 : 1,
                  }}
                >
                  <Image src={mediaUrl(src)} alt="" fill sizes="16rem" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </OfferSection>
  );
}

/** Questions and answers, each one a native disclosure — no script needed to read them. */
export function FaqBlock({ heading, items }: { heading: string; items: readonly Faq[] }) {
  return (
    <OfferSection id="faq" labelledBy="faq-heading">
      <SectionHead id="faq-heading" label="FAQs" heading={heading} align="left" />
      <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
        {items.map((item) => (
          <details key={item.q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-body text-bone marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown aria-hidden className="size-4 shrink-0 text-ash transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="pb-5 pr-10">
              {item.a.map((line) => (
                <p key={line} className="mt-2 text-pretty text-body leading-relaxed text-ash first:mt-0">
                  {line}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </OfferSection>
  );
}

/** A row of labelled chips with icons — category strips, "Built for". */
export function IconChips({
  items,
  className,
}: {
  items: readonly { label: string; icon?: IconCard["icon"] }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="glass-chip inline-flex h-10 items-center gap-2 rounded-full px-4 text-small text-bone"
        >
          {item.icon && <OfferIcon name={item.icon} className="size-4 text-brand-ink" />}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
