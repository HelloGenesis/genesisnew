import { Check } from "lucide-react";

import { BENTO_WIDE } from "@/lib/bento";
import { CRM_PLAN_PRICES } from "@/lib/crm-plans";
import { CrmPricing } from "./crm-pricing";
import { CrmTour } from "./crm-tour";
import { GlassButton } from "./glass-button";
import { Reveal } from "./reveal";
import { SectionLabel } from "./section-label";

/**
 * GENESIS MEDIA CRM ON THE HOMEPAGE (Genesis, 14 Oct 2026: "add a Genesis
 * Media CRM simple section with a dashboard, copy and a CTA for CRM for
 * Agencies, Brands & Freelancers… Checkout CRM… you can add the reseller
 * dashboard"). The same sample-data tour as /resellers, which it leads to.
 * In a bento panel like the divisions above it, with the three plans paid
 * straight through Razorpay (Genesis, 14 Oct 2026), above the Work section.
 */

const POINTS = [
  "Leads, briefs and pipeline, with an AI inbox that reads Gmail & Drive",
  "Influencer database, plans and quotes as a link, PDF, Excel or Google Sheet",
  "GST invoices, Razorpay payments and a client portal for your brands",
] as const;

const FOR = ["Agencies", "Brands", "Freelancers"] as const;

export function CrmHomeSection() {
  return (
    <section id="crm" aria-labelledby="crm-heading" className="scroll-mt-24 py-[var(--section-pad)]">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className={BENTO_WIDE}>
        <Reveal>
          <SectionLabel dot tone="brand">Genesis Media CRM</SectionLabel>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <h2 id="crm-heading" className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
                The CRM for Agencies, Brands &amp; <span className="font-serif italic text-brand-ink">Freelancers.</span>
              </h2>
              <p className="mt-5 max-w-xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
                The platform Genesis Media runs on, ready for your business: every lead, plan, quote and invoice in one place. From ₹{CRM_PLAN_PRICES[0].rate.toLocaleString("en-IN")} a month.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Built for">
                {FOR.map((f) => (
                  <li key={f} className="rounded-full border border-[var(--glass-border)] px-3 py-1 text-small text-bone">{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <ul className="space-y-2.5">
                {POINTS.map((p) => (
                  <li key={p} className="flex gap-2.5 text-small text-ash">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#ffc516]" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {/* Two equal buttons side by side on a phone; their own width from sm. */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <GlassButton href="/resellers" variant="brand" size="lg" arrow className="w-full justify-center gap-2 px-3 text-small sm:w-auto sm:gap-3 sm:px-7 sm:text-body">
                  Checkout CRM
                </GlassButton>
                <GlassButton href="#crm-plans" variant="glass" size="lg" arrow className="w-full justify-center gap-2 px-3 text-small sm:w-auto sm:gap-3 sm:px-7 sm:text-body">
                  See pricing
                </GlassButton>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="mt-10">
          <CrmTour />
        </div>
        <div id="crm-plans" className="mt-12 scroll-mt-28">
          <h3 className="text-lead text-bone">Plans for every size of team</h3>
          <div className="mt-4">
            <CrmPricing compact />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
