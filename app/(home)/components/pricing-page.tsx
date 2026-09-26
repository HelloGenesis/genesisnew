import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { WorkGrid } from "@/components/genesis/work-grid";
import { services } from "@/lib/home-content";
import {
  bookingHref,
  enquiryHref,
  joinHref,
  pricingCommon,
  pricingPath,
  verticals,
  type OneTimeProduct,
  type VerticalPricing,
} from "@/lib/pricing";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { expandToClips, work } from "@/lib/work";
import { Breadcrumbs } from "./service-page";

/**
 * One vertical's membership and one-time products — the MRR model.
 *
 * FOUR PAGES, ONE LAYOUT. Influence, AI Labs, Studios and Brand & Design each
 * get a route of their own (/pricing/<slug>) so each can carry its own Book a
 * Call and its own join link, but they are the same argument in the same
 * order, so they share this view and differ only in the data from
 * lib/pricing.
 *
 * THE ORDER IS THE BRIEF'S: the membership first, then the one-time products,
 * then Genesis Unlimited and Enterprise for the brief that does not fit, then
 * how a membership runs and the questions. The 15-minute call is the site
 * footer's now — "all the footers will have a 15 min calendar book below".
 *
 * NO COPY IS WRITTEN HERE. Every sentence on the page comes from lib/pricing,
 * which is Genesis's document verbatim; this file only arranges it.
 */

const ENQUIRY_BUTTON =
  "max-sm:h-10 max-sm:gap-1.5 max-sm:px-4 max-sm:text-[0.8125rem]";

export function PricingPageView({ vertical }: { vertical: VerticalPricing }) {
  const { membership } = vertical;
  const path = pricingPath(vertical.slug);
  const ramp = services.items.find((item) => item.short === vertical.short)?.ramp;
  const book = bookingHref(vertical.division);
  const join = joinHref(membership);

  return (
    <main>
      <JsonLd data={[breadcrumbJsonLd([{ name: vertical.division, path }])]} />

      {/* ─── Hero: the membership, its price, and the three ways in ─── */}
      <Atmosphere tone="brand" origin="top" intensity={0.2}>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pb-12 pt-32 sm:pt-40">
          <Reveal>
            <Breadcrumbs trail={[{ name: vertical.division, path }]} />
            <VerticalSwitcher current={vertical.slug} className="mt-8" />
          </Reveal>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <Reveal>
              <SectionLabel dot tone="brand">
                {vertical.division}
              </SectionLabel>
              <h1
                className="mt-6 w-fit text-balance bg-clip-text text-h2 font-normal leading-[1.05] tracking-tight text-transparent sm:text-h1"
                style={{ backgroundImage: ramp ?? "linear-gradient(90deg,#ffc516,#ffdc72)" }}
              >
                {membership.name}
              </h1>
              <p className="mt-6 max-w-2xl text-balance text-h3 font-normal leading-[1.15] tracking-tight text-bone">
                {membership.tagline}
              </p>
              <p className="mt-5 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
                {membership.description}
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <PriceCard vertical={vertical} />
            </Reveal>
          </div>

          <Reveal delay={0.12} className="mt-10 flex flex-wrap gap-3">
            <GlassButton href={join} variant="brand" size="lg" arrow className={ENQUIRY_BUTTON}>
              {membership.cta}
            </GlassButton>
            <GlassButton href={book} variant="glass" size="lg" arrow className={ENQUIRY_BUTTON}>
              {pricingCommon.booking.cta}
            </GlassButton>
            <GlassButton href="#work" variant="ghost" size="lg" arrow className={ENQUIRY_BUTTON}>
              View Work
            </GlassButton>
          </Reveal>
        </div>
      </Atmosphere>

      <MembershipsIntro />

      {/* ─── The membership in full ─── */}
      <section
        id="membership"
        aria-labelledby="membership-heading"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 pb-[var(--section-pad)]"
      >
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Reveal className="glass glass-lit rounded-panel p-6 sm:p-10">
            <p className="micro-label">{vertical.division}</p>
            <h2
              id="membership-heading"
              className="mt-4 text-h3 font-normal leading-[1.1] tracking-tight text-bone"
            >
              {membership.name}{" "}
              <span className="whitespace-nowrap text-brand-ink">
                {membership.price}{" "}
                <span className="text-small text-ash">{membership.period}</span>
              </span>
            </h2>

            {vertical.credits && <Credits credits={vertical.credits} />}

            {membership.includedLead && (
              <CheckList items={membership.includedLead} className="mt-8" strong />
            )}

            <h3 className="mt-8 font-sans text-body text-bone">
              {membership.includedHeading}
            </h3>
            <CheckList items={membership.included} columns className="mt-4" />
          </Reveal>

          <Reveal delay={0.08} className="flex flex-col gap-6">
            {membership.turnaround && (
              <Panel title={membership.turnaround.heading}>
                <dl className="flex flex-col gap-3">
                  {membership.turnaround.rows.map((row) => (
                    <div key={row.label}>
                      <dt className="text-small text-ash">{row.label}</dt>
                      <dd className="text-body text-bone">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {membership.turnaround.notes?.map((note) => (
                  <p key={note} className="mt-3 text-small leading-relaxed text-faint">
                    {note}
                  </p>
                ))}
              </Panel>
            )}

            {membership.revisions && (
              <Panel title="Revisions">
                {membership.revisions.map((line) => (
                  <p key={line} className="text-small leading-relaxed text-ash [&+&]:mt-2">
                    {line}
                  </p>
                ))}
              </Panel>
            )}

            {vertical.addOns?.map((addOn) => (
              <Panel key={addOn.name} title={addOn.name}>
                <p className="text-body text-brand-ink">{addOn.price}</p>
                {addOn.body?.map((line) => (
                  <p key={line} className="mt-2 text-small leading-relaxed text-ash">
                    {line}
                  </p>
                ))}
              </Panel>
            ))}

            {membership.notIncluded && (
              <Panel title="Not included">
                <p className="text-small leading-relaxed text-ash">{membership.notIncluded}</p>
              </Panel>
            )}

            <div className="flex flex-col gap-3">
              <GlassButton href={join} variant="brand" arrow className="w-full">
                {membership.cta}
              </GlassButton>
              <GlassButton href={book} variant="glass" arrow className="w-full">
                {pricingCommon.booking.cta}
              </GlassButton>
            </div>
          </Reveal>
        </div>
      </section>

      <VerticalWork vertical={vertical} />

      {/* ─── One-time products ─── */}
      <section
        id="one-time"
        aria-labelledby="one-time-heading"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]"
      >
        <Reveal>
          <h2
            id="one-time-heading"
            className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2"
          >
            {vertical.oneTimeHeading}
          </h2>
        </Reveal>
        <ul
          className={cn(
            "mt-10 grid gap-4 sm:grid-cols-2",
            vertical.oneTime.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
          )}
        >
          {vertical.oneTime.map((product, index) => (
            <Reveal as="li" key={product.name} delay={0.05 * index} className="flex">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </ul>
      </section>

      <UnlimitedAndEnterprise />
      <HowMembershipsWork />
      <Faq />
      <Closing current={vertical.slug} href="#membership" />
    </main>
  );
}

/**
 * THIS VERTICAL'S WORK, ALL OF IT, ON THE PAGE — "View Work" scrolls here
 * rather than leaving. Genesis asked for it "jaise homepage par hai": the
 * homepage portfolio's own grid and two-row rail, given only this
 * vertical's pieces, featured first. No filter chips — there is only one
 * vertical to filter to.
 */
function VerticalWork({ vertical }: { vertical: VerticalPricing }) {
  const items = work.filter((item) => item.vertical === vertical.short);
  if (items.length === 0) return null;
  const ordered = [...items.filter((i) => i.featured), ...items.filter((i) => !i.featured)];
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="relative isolate scroll-mt-24 overflow-hidden py-[var(--section-pad)]"
    >
      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <SectionLabel dot tone="brand">
            Explore our work
          </SectionLabel>
          <h2
            id="work-heading"
            className="mt-4 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2"
          >
            {vertical.division}{" "}
            <span className="font-serif italic text-brand-ink">work.</span>
          </h2>
        </Reveal>
        <Reveal variant="scene" className="fit-window mt-[var(--block-gap)]">
          <WorkGrid items={expandToClips(ordered)} showFilters={false} rail />
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Sections shared by the vertical pages and the /pricing hub ─── */

export function MembershipsIntro() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-[var(--section-pad)]">
      <Reveal className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-12">
        <div>
          <SectionLabel dot tone="brand">
            {pricingCommon.intro.label}
          </SectionLabel>
          <h2 className="mt-6 text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
            {pricingCommon.intro.heading}{" "}
            <span className="font-serif italic text-brand-ink">
              {pricingCommon.intro.headingAccent}
            </span>
          </h2>
        </div>
        <div>
          <p className="text-pretty text-body leading-relaxed text-ash">
            {pricingCommon.intro.body}
          </p>
          <CheckList items={pricingCommon.intro.points} className="mt-5" />
          <p className="mt-5 text-small text-faint">{pricingCommon.intro.gst}</p>
        </div>
      </Reveal>
    </section>
  );
}

export function UnlimitedAndEnterprise() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-[var(--section-pad)] lg:grid-cols-2">
      <Reveal className="glass glass-lit flex flex-col rounded-panel p-6 sm:p-10">
        <p className="micro-label">{pricingCommon.unlimited.label}</p>
        <h2 className="mt-4 text-h3 font-normal leading-[1.1] tracking-tight text-bone">
          {pricingCommon.unlimited.name}
        </h2>
        <p className="mt-2 text-lead text-brand-ink">
          {pricingCommon.unlimited.price}
        </p>
        <p className="mt-4 text-body leading-relaxed text-ash">{pricingCommon.unlimited.body}</p>
        <p className="mt-5 text-small text-bone">
          {pricingCommon.unlimited.accessLabel}
        </p>
        <CheckList items={pricingCommon.unlimited.access} className="mt-3" />
        <p className="mt-3 text-small leading-relaxed text-ash">
          {pricingCommon.unlimited.accessNote}
        </p>
        <p className="mt-4 text-small leading-relaxed text-faint">
          {pricingCommon.unlimited.footnote}
        </p>
        <div className="mt-auto pt-8">
          <GlassButton
            href={enquiryHref(pricingCommon.unlimited.name)}
            variant="brand"
            arrow
            className={ENQUIRY_BUTTON}
          >
            {pricingCommon.unlimited.cta}
          </GlassButton>
        </div>
      </Reveal>

      <Reveal delay={0.08} className="glass glass-lit flex flex-col rounded-panel p-6 sm:p-10">
        <p className="micro-label">{pricingCommon.enterprise.label}</p>
        <h2 className="mt-4 text-h3 font-normal leading-[1.1] tracking-tight text-bone">
          {pricingCommon.enterprise.heading}
        </h2>
        <p className="mt-4 text-lead leading-snug text-bone">{pricingCommon.enterprise.lead}</p>
        <p className="mt-4 text-body leading-relaxed text-ash">{pricingCommon.enterprise.body}</p>
        <div className="mt-auto pt-8">
          <GlassButton
            href={enquiryHref("Genesis Enterprise")}
            variant="glass"
            arrow
            className={ENQUIRY_BUTTON}
          >
            {pricingCommon.enterprise.cta}
          </GlassButton>
        </div>
      </Reveal>
    </section>
  );
}

export function HowMembershipsWork() {
  return (
    <section
      aria-labelledby="steps-heading"
      className="mx-auto w-full max-w-6xl px-6 py-[var(--section-pad)]"
    >
      <Reveal>
        <h2
          id="steps-heading"
          className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2"
        >
          {pricingCommon.steps.heading}
        </h2>
      </Reveal>
      <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {pricingCommon.steps.items.map((step, index) => (
          <Reveal
            as="li"
            key={step.n}
            delay={0.04 * index}
            className="border-t border-white/12 pt-6"
          >
            <span className="block font-display text-h2 font-normal leading-none tracking-tight text-brand-ink">
              {step.n}
            </span>
            <h3 className="mt-6 font-sans text-lead leading-snug text-bone">{step.title}</h3>
            <p className="mt-2 text-pretty text-small leading-relaxed text-ash sm:text-body">
              {step.body}
            </p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

export function Faq() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-6xl px-6 py-[var(--section-pad)]"
    >
      <Reveal>
        <h2
          id="faq-heading"
          className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2"
        >
          {pricingCommon.faq.heading}
        </h2>
      </Reveal>
      <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
        {pricingCommon.faq.items.map((faq) => (
          <div key={faq.q}>
            <dt className="text-body leading-snug text-bone">{faq.q}</dt>
            {faq.a.map((line) => (
              <dd key={line} className="mt-2 text-pretty text-body leading-relaxed text-ash">
                {line}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Closing({ current, href }: { current?: string; href: string }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-[var(--section-pad)] text-center">
      <Reveal>
        <h2 className="mx-auto max-w-4xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
          {pricingCommon.closing.heading}{" "}
          <span className="font-serif italic text-brand-ink">
            {pricingCommon.closing.headingAccent}
          </span>
        </h2>
        <p className="mt-5 text-lead text-ash">{pricingCommon.closing.sub}</p>
        <div className="mt-8 flex justify-center">
          <GlassButton href={href} variant="brand" size="lg" arrow className={ENQUIRY_BUTTON}>
            {pricingCommon.closing.cta}
          </GlassButton>
        </div>
        <VerticalSwitcher current={current} className="mt-8 justify-center" />
      </Reveal>
    </section>
  );
}

/** Monthly and quarterly side by side, with the GST line under them. */
function PriceCard({ vertical }: { vertical: VerticalPricing }) {
  const { membership } = vertical;
  return (
    <div className="glass glass-strong glass-lit rounded-panel p-6 sm:p-8">
      <p className="micro-label">{membership.name}</p>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="text-h2 font-normal leading-none tracking-tight text-bone">
          {membership.price}
        </span>
        <span className="text-small text-ash">{membership.period}</span>
      </p>
      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-small text-ash">Quarterly</p>
        <p className="mt-1 text-lead text-brand-ink">{membership.quarterly.price}</p>
        {membership.quarterly.note && (
          <p className="mt-2 text-small leading-relaxed text-ash">{membership.quarterly.note}</p>
        )}
      </div>
      <p className="mt-5 text-small text-faint">{pricingCommon.intro.gst}</p>
    </div>
  );
}

export function ProductCard({ product }: { product: OneTimeProduct }) {
  return (
    <article className="glass glass-lit flex w-full flex-col rounded-panel p-6 sm:p-8">
      <h3 className="font-sans text-lead leading-snug text-bone">{product.name}</h3>
      <p className="mt-3 text-h3 font-normal leading-none tracking-tight text-brand-ink">
        {product.price}
      </p>
      {product.lead && (
        <p className="mt-4 text-body leading-relaxed text-bone">{product.lead}</p>
      )}
      {product.body?.map((line) => (
        <p key={line} className="mt-4 text-pretty text-body leading-relaxed text-ash">
          {line}
        </p>
      ))}
      {product.includes && (
        <>
          <p className="mt-5 text-small text-bone">{product.includesLabel}</p>
          <CheckList items={product.includes} className="mt-3" />
        </>
      )}
      <div className="mt-auto pt-8">
        <GlassButton href={enquiryHref(product.name)} variant="glass" arrow className={ENQUIRY_BUTTON}>
          {product.cta}
        </GlassButton>
      </div>
    </article>
  );
}

function Credits({ credits }: { credits: NonNullable<VerticalPricing["credits"]> }) {
  return (
    <div className="mt-8">
      <h3 className="font-sans text-lead leading-snug text-bone">{credits.heading}</h3>
      <p className="mt-1 text-body text-ash">{credits.sub}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {credits.tiers.map((tier) => (
          <li key={tier.credits} className="rounded-card border border-white/10 p-4">
            <p className="text-small tracking-wide text-brand-ink">{tier.credits}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {tier.items.map((item) => (
                <li key={item} className="text-small leading-snug text-ash">
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-card border border-white/10 p-5">
        <p className="text-small text-bone">Example</p>
        <p className="mt-2 text-small text-ash">You could use 24 credits for:</p>
        {credits.examples.map((example, index) => (
          <p key={example} className="mt-2 text-small leading-snug text-bone">
            {index > 0 && <span className="mr-2 text-faint">or</span>}
            {example}
          </p>
        ))}
        <p className="mt-2 text-small text-ash">{credits.examplesOutro}</p>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass rounded-card p-6">
      <p className="micro-label">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function CheckList({
  items,
  columns = false,
  strong = false,
  className,
}: {
  items: readonly string[];
  columns?: boolean;
  strong?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-x-8 gap-y-2.5", columns && "sm:grid-cols-2", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check aria-hidden className="mt-[0.2em] size-4 shrink-0 text-brand-ink" />
          <span
            className={cn(
              "text-small leading-snug first-letter:uppercase sm:text-body",
              strong ? "text-bone" : "text-ash",
            )}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The four vertical pages, one pill each — so a reader can compare. */
export function VerticalSwitcher({ current, className }: { current?: string; className?: string }) {
  return (
    <nav aria-label="Memberships" className={cn("flex flex-wrap gap-2", className)}>
      {verticals.map((vertical) => {
        const active = vertical.slug === current;
        return (
          <Link
            key={vertical.slug}
            href={pricingPath(vertical.slug)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-small transition-colors",
              active
                ? "bg-brand text-on-brand"
                : "border border-white/12 text-ash hover:border-white/25 hover:text-bone",
            )}
          >
            {vertical.division.replace(/^Genesis /, "")}
          </Link>
        );
      })}
    </nav>
  );
}
