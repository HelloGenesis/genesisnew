"use client";

import { useState } from "react";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { monthlyListFigure, price } from "@/lib/money";
import { designProducts } from "@/lib/verticals/brand-design";
import { cn } from "@/lib/utils";
import { IconTile } from "../offer/icons";
import { CheckList } from "../offer/parts";
import { BillingToggle, type Billing } from "../offer/plan-grid";

/**
 * Brand & Design's two products as a pair of plans: Always-On (the Creative
 * Desk membership) and Brand Build (the one-time identity project).
 *
 * THE SAME BONES AS EVERY OTHER PLAN ON THE SITE — a name, a badge saying
 * what kind of purchase it is, the price set large with a small "/-", and on
 * the membership the same Quarterly / Monthly switch as AI Labs and Studios,
 * quarterly first. The two cards share one structure so they read as a
 * choice rather than as two different kinds of object.
 *
 * Used on /brand-design and in the Brand & Design tab on /pricing.
 */
export function ProductCards() {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Reveal as="li" className="flex min-w-0">
        <DeskCard />
      </Reveal>
      <Reveal as="li" delay={0.06} className="flex min-w-0">
        <BuildCard />
      </Reveal>
    </ul>
  );
}

function DeskCard() {
  const desk = designProducts.desk;
  const [billing, setBilling] = useState<Billing>("quarterly");
  const figure = price(billing === "quarterly" ? desk.rate : monthlyListFigure(desk.rate));

  return (
    <article className="glass glass-strong glass-lit relative flex w-full min-w-0 flex-col overflow-hidden rounded-panel border border-brand/60 p-6 shadow-[0_24px_64px_-24px_rgb(255_197_22/0.35)] sm:p-8">
      <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand/15 blur-3xl" />

      <Head eyebrow={desk.eyebrow} name={desk.name} badge={desk.badge} tagline={desk.tagline} featured />
      <p className="relative mt-3 max-w-xl text-pretty text-small leading-relaxed text-ash sm:text-body">{desk.body}</p>

      {/* Price and billing, side by side from sm — the decision in one row. */}
      <div className="relative mt-7 flex flex-col gap-5 rounded-card border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Price figure={figure} suffix="per month + GST" />
        </div>
        <BillingToggle value={billing} onChange={setBilling} align="start" />
      </div>

      <ul className="relative mt-6 grid gap-2 sm:grid-cols-2">
        {desk.highlights.map((row, index) => (
          <li
            key={row.label}
            className={cn(
              "flex items-center gap-3 rounded-card border border-white/8 bg-white/[0.02] p-3",
              index === desk.highlights.length - 1 && desk.highlights.length % 2 === 1 && "sm:col-span-2",
            )}
          >
            <IconTile name={row.icon} className="size-9" />
            <span className="min-w-0">
              <span className="block text-[0.6875rem] uppercase tracking-[0.16em] text-faint">{row.label}</span>
              <span className="block text-small leading-snug text-bone">{row.value}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto pt-8" data-track="plan:Always-On">
        <GlassButton href={desk.cta.href} variant="brand" size="lg" arrow>
          {desk.cta.label}
        </GlassButton>
      </div>
    </article>
  );
}

function BuildCard() {
  const build = designProducts.build;
  return (
    <article className="glass glass-lit relative flex w-full min-w-0 flex-col overflow-hidden rounded-panel p-6 sm:p-8">
      <Head eyebrow={build.eyebrow} name={build.name} badge={build.badge} tagline={build.tagline} />
      <p className="mt-3 text-pretty text-small leading-relaxed text-ash sm:text-body">{build.body}</p>

      <div className="mt-7 rounded-card border border-white/10 bg-white/[0.03] p-5">
        <Price prefix="From" figure={build.from} suffix="+ GST" />
        <p className="mt-2 text-small text-faint">{build.facts.join(" · ")}</p>
      </div>

      <CheckList items={build.points} className="mt-6" />

      <div className="mt-auto pt-8" data-track="plan:Brand Build">
        <GlassButton href={build.cta.href} variant="glass" size="lg" arrow>
          {build.cta.label}
        </GlassButton>
      </div>
    </article>
  );
}

function Head({
  eyebrow,
  name,
  badge,
  tagline,
  featured = false,
}: {
  eyebrow: string;
  name: string;
  badge: string;
  tagline: string;
  featured?: boolean;
}) {
  return (
    <div className="relative">
      <p className="micro-label !text-brand-ink">{eyebrow}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-h2 font-normal leading-none tracking-tight text-bone">{name}</h3>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-micro uppercase tracking-[0.14em]",
            featured ? "bg-brand text-on-brand" : "border border-white/20 text-ash",
          )}
        >
          {badge}
        </span>
      </div>
      <p className="mt-3 font-sans text-lead leading-snug text-bone">{tagline}</p>
    </div>
  );
}

/** A price set the house way: the figure large, the "/-" small beside it. */
function Price({ prefix, figure, suffix }: { prefix?: string; figure: string; suffix: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {prefix && <span className="text-small text-ash">{prefix}</span>}
      <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">
        {figure.replace(/\/-$/, "")}
      </span>
      <span className="-ml-1.5 text-lead text-ash">/-</span>
      <span className="text-small text-ash">{suffix}</span>
    </p>
  );
}
