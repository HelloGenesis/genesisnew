"use client";

import { useState } from "react";

import { AddToCart } from "@/components/genesis/cart";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { monthlyListFigure, price } from "@/lib/money";
import { productId } from "@/lib/cart";
import { designProducts } from "@/lib/verticals/brand-design";
import { cn } from "@/lib/utils";
import { IconTile } from "../offer/icons";
import { CheckList } from "../offer/parts";
import { tierGlow, tierGradient } from "../offer/tier-colors";
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
    /*
      THE MEMBERSHIP, IN THE PRICING PALETTE — the same gradient-edged card as
      the AI and Studios plans, in the warm variation (see tier-colors), so
      every subscription on the site reads as one family.
    */
    <div
      className="flex w-full min-w-0 rounded-panel p-px shadow-[0_30px_80px_-30px_var(--tier-glow)]"
      style={{ background: tierGradient(1), ["--tier-glow" as string]: tierGlow(1) }}
    >
    <article className="relative flex w-full min-w-0 flex-col overflow-hidden rounded-panel bg-ink p-6 sm:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full blur-3xl"
        style={{ background: tierGlow(1) }}
      />

      <Head eyebrow={desk.eyebrow} name={desk.name} badge={desk.badge} tagline={desk.tagline} gradient={tierGradient(1)} />
      <p className="relative mt-3 max-w-xl text-pretty text-small leading-relaxed text-ash sm:text-body">{desk.body}</p>

      {/* Price and billing, side by side from sm — the decision in one row. */}
      <div className="relative mt-7 flex flex-col gap-5 rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] p-5 sm:flex-row sm:items-end sm:justify-between">
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
              "flex items-center gap-3 rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] p-3",
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
        <AddToCart
          id={productId("brand-design", "membership", desk.name)}
          billing={billing}
          purchase
          variant="brand"
          className="max-w-md [&>*]:min-w-[9rem]"
        />
      </div>
    </article>
    </div>
  );
}

function BuildCard() {
  const build = designProducts.build;
  return (
    <article className="glass glass-lit relative flex w-full min-w-0 flex-col overflow-hidden rounded-panel p-6 sm:p-8">
      <Head eyebrow={build.eyebrow} name={build.name} badge={build.badge} tagline={build.tagline} />
      <p className="mt-3 text-pretty text-small leading-relaxed text-ash sm:text-body">{build.body}</p>

      <div className="mt-7 rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] p-5">
        <Price prefix="From" figure={build.from} suffix="+ GST" />
        <p className="mt-2 text-small text-faint">{build.facts.join(" · ")}</p>
      </div>

      <CheckList items={build.points} className="mt-6" />

      <div className="mt-auto pt-8" data-track="plan:Brand Build">
        <div className="flex flex-wrap gap-2">
          <GlassButton href={build.cta.href} variant="glass" arrow>
            {build.cta.label}
          </GlassButton>
          <AddToCart id={productId("brand-design", "one-time", build.name)} />
        </div>
      </div>
    </article>
  );
}

function Head({
  eyebrow,
  name,
  badge,
  tagline,
  gradient,
}: {
  eyebrow: string;
  name: string;
  badge: string;
  tagline: string;
  /** A subscription's palette gradient, for its name and badge. */
  gradient?: string;
}) {
  return (
    <div className="relative">
      <p className="micro-label !text-brand-ink">{eyebrow}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h3
          className={cn(
            "font-display text-h2 font-normal leading-none tracking-tight",
            gradient ? "bg-clip-text text-transparent" : "text-bone",
          )}
          style={gradient ? { backgroundImage: gradient } : undefined}
        >
          {name}
        </h3>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-micro uppercase tracking-[0.14em]",
            gradient ? "text-white" : "border border-[var(--glass-border)] text-ash",
          )}
          style={gradient ? { background: gradient } : undefined}
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
