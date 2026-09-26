import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { services } from "@/lib/home-content";
import {
  enquiryHref,
  findVertical,
  homeMemberships,
  pricingCommon,
  pricingPath,
  verticals,
} from "@/lib/pricing";

/**
 * Genesis Memberships, on the homepage — the MRR model, after the four
 * verticals have each had their say.
 *
 * THE BRIEF'S ORDER, INSIDE ONE SECTION: the four vertical cards with their
 * "Membership from" buttons, then "How Genesis Memberships Work" in four
 * steps (the DesignJoy-style block the brief asks for), then the one-time
 * projects for anyone who does not want a subscription, then Enterprise for
 * the brief too big for one. The hero's "Explore Memberships" lands here.
 *
 * Every word is lib/pricing, which is the brief verbatim.
 */
export function Memberships() {
  return (
    <section
      id="memberships"
      aria-labelledby="memberships-heading"
      className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]"
    >
      <Reveal className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-12">
        <div>
          <SectionLabel dot tone="brand">
            {pricingCommon.intro.label}
          </SectionLabel>
          <h2
            id="memberships-heading"
            className="mt-6 text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2"
          >
            {pricingCommon.intro.heading}{" "}
            <span className="font-serif italic text-brand-ink">
              {pricingCommon.intro.headingAccent}
            </span>
          </h2>
        </div>
        <p className="text-pretty text-body leading-relaxed text-ash">{pricingCommon.intro.body}</p>
      </Reveal>

      {/* ─── The four vertical cards ─── */}
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {verticals.map((vertical, index) => {
          const ramp = services.items.find((item) => item.short === vertical.short)?.ramp;
          return (
            <Reveal as="li" key={vertical.slug} delay={0.05 * index} className="flex">
              <Link
                href={pricingPath(vertical.slug)}
                className="glass glass-lit group relative flex w-full flex-col overflow-hidden rounded-panel p-6 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ backgroundImage: ramp }} />
                <h3
                  className="w-fit bg-clip-text text-h3 font-normal leading-[1.1] tracking-tight text-transparent"
                  style={{ backgroundImage: ramp }}
                >
                  {vertical.division.replace(/^Genesis /, "")}
                </h3>
                <p className="mt-3 text-pretty text-small leading-relaxed text-ash sm:text-body">
                  {vertical.home.blurb}
                </p>
                <span className="mt-auto pt-6">
                  <span className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand/40 bg-brand/10 px-4 text-small font-medium text-brand-ink transition-colors group-hover:border-brand/70 group-hover:bg-brand/20">
                    {vertical.home.from}
                    <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                  </span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>

      {/* ─── How Genesis Memberships Work ─── */}
      <Reveal className="mt-[calc(var(--section-pad)*1.5)]">
        <h2 className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
          {homeMemberships.steps.heading}
        </h2>
      </Reveal>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {homeMemberships.steps.items.map((step, index) => (
          <Reveal as="li" key={step.title} delay={0.05 * index} className="glass rounded-card p-6">
            <span className="grid size-10 place-items-center rounded-full bg-brand text-small font-semibold text-on-brand">
              {index + 1}
            </span>
            <h3 className="mt-5 text-lead font-semibold leading-snug text-bone">{step.title}</h3>
            <p className="mt-2 text-pretty text-small leading-relaxed text-ash sm:text-body">
              {step.body}
            </p>
          </Reveal>
        ))}
      </ol>

      {/* ─── One-time projects ─── */}
      <Reveal className="mt-[calc(var(--section-pad)*1.5)]">
        <h2 className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
          {homeMemberships.oneTime.heading}
        </h2>
        <ul className="mt-8 flex flex-wrap gap-2 sm:gap-3">
          {homeMemberships.oneTime.items.map((item) => (
            <li key={item.label}>
              <Link
                href={`${pricingPath(item.slug)}#one-time`}
                aria-label={`${item.label} — ${findVertical(item.slug)?.division}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/12 px-4 text-small text-bone transition-colors hover:border-white/30 hover:bg-white/5 sm:h-11 sm:px-5 sm:text-body"
              >
                {item.label}
                <ArrowUpRight className="size-3.5 shrink-0 text-ash" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* ─── Enterprise ─── */}
      <Reveal className="glass glass-strong glass-lit mt-[calc(var(--section-pad)*1.5)] flex flex-col gap-6 rounded-panel p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="micro-label">{homeMemberships.enterprise.label}</p>
          <h2 className="mt-4 text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone">
            {homeMemberships.enterprise.heading}
          </h2>
        </div>
        <GlassButton
          href={enquiryHref("Genesis Enterprise")}
          variant="brand"
          size="lg"
          arrow
          className="self-start max-sm:h-11 max-sm:px-6 max-sm:text-small lg:self-auto"
        >
          {homeMemberships.enterprise.cta}
        </GlassButton>
      </Reveal>
    </section>
  );
}
