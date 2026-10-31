import { Check, X } from "lucide-react";
import type { Metadata } from "next";

import { Accordion } from "@/components/genesis/accordion";
import { Atmosphere } from "@/components/genesis/atmosphere";
import { CrmPricing, SavingsCalculator } from "@/components/genesis/crm-pricing";
import { GenesisForm } from "@/components/genesis/genesis-form";
import { JsonLd } from "@/components/genesis/json-ld";
import { NovaFeatures } from "@/components/genesis/nova-features";
import { NovaAiExample, NovaApprovals, NovaConnected, NovaPromise, NovaSupport } from "@/components/genesis/nova-story";
import { NovaHero } from "@/components/genesis/nova-hero";
import { NovaLive } from "@/components/genesis/nova-live";
import { NovaTrialForm } from "@/components/genesis/nova-trial-form";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { crmSoftwareJsonLd, faqJsonLd } from "@/lib/geo";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Nova by Genesis: one platform for your agency, brands and partners",
  description:
    "The CRM Genesis Media runs on: leads, influencer plans, quotes, GST invoices, client portal and an AI inbox, for your team, your brands and your partner agencies. From ₹4,999 a month.",
  path: "/resellers",
});

/**
 * /resellers — THE GENESIS CRM AS A PRODUCT (Genesis, 13 Oct 2026: "redesign
 * this page… show the real dashboard, what it does, how you can give it to
 * customers, brands, partner agencies, all at one place… how it helps save
 * time and money… add pricing, three options, monthly and annual").
 *
 * Every feature named here is one the CRM has today. The tour redraws its
 * screens with sample data (no real client on a public page); the savings
 * figure is the visitor's own estimate, never a promise. Choosing a plan opens
 * the application with it filled in; it lands as a PARTNER lead.
 */


const BEFORE_AFTER = [
  ["Briefs sit in someone's inbox until they remember", "A brief in Gmail or Drive becomes a lead, with the brief attached, and the right person is told"],
  ["Influencer lists in ten different sheets", "One influencer database: import any Excel or Google Sheet, filter, tick and make a plan"],
  ["Plans copied by hand into a client sheet, costs hidden by deleting columns", "One plan, two sheets: internal with costs and profit, external for the brand, kept in step"],
  ["Quotes in Word, GST worked out on a calculator", "Proposal, plan and pricing on one link and PDF, with CGST/SGST or IGST done for you"],
  ["“Did they pay?” on WhatsApp", "GST invoices tracked, unpaid and overdue ones flagged, finance told when a signed copy comes back"],
] as const;




const FAQS = [
  ["What does Beta mean?", "Nova is live and agencies run on it every day, and it's still growing: new features arrive every week. As a Beta agency you get them first, we set them up with you, and what you ask for shapes what we build next. Your data is safe and yours either way."],
  ["How does the free trial work?", "Start with no card and use everything for 14 days. From day 3 you choose a plan and add a card, and pay ₹0 that day: the card is first charged on day 14, when the trial ends, then monthly. Cancel any time before day 14 and you aren't charged. We email you before every step."],
  ["How does billing work?", "Pick annual (the lowest price, paid for the year upfront) or monthly (10% more, paid month by month). Prices exclude 18% GST. You pay through Razorpay by card, UPI AutoPay or netbanking; monthly plans can be cancelled any time. The free trial continues on a monthly plan."],
  ["How do resellers earn?", "Bring agencies to the CRM and earn 20% of every payment they make for their first 12 months, paid out monthly."],
  ["Is our data separate from everyone else's?", "Yes. Each agency works in its own workspace with its own team, brands and logins."],
  ["Can it carry our brand?", "On Growth and Scale, your logo goes on it; on Scale it can run on your own domain."],
  ["Do we need Genesis to deliver the work?", "No. The CRM runs your own business. If you'd also like Genesis's creators, production, AI or design teams, that's a separate conversation."],
  ["Can we bring our existing data?", "Yes: leads, clients, vendors, creators, expenses and briefs from Excel, CSV or Google Sheets, with the columns matched for you."],
] as const;

const PLAN_KEYS = ["Starter", "Growth", "Scale"];

export default async function ResellersPage({ searchParams }: { searchParams: Promise<{ plan?: string; billing?: string }> }) {
  const p = await searchParams;
  const plan = PLAN_KEYS.includes(p.plan ?? "") ? p.plan! : undefined;
  const billing = p.billing === "annual" ? "Annual" : p.billing === "monthly" ? "Monthly" : undefined;

  return (
    <main data-nova-page>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Nova by Genesis", path: "/resellers" }]), crmSoftwareJsonLd(), faqJsonLd(FAQS, "/resellers")]} />

      {/* THE OPENING (Genesis, 31 Oct 2026): centred, the orb with Nova at its core and who it connects round it (components/genesis/nova-hero). */}
      <Atmosphere tone="brand" origin="top" intensity={0.28}>
        <NovaHero />
        <NovaPromise />
      </Atmosphere>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-[var(--section-pad)] sm:gap-28">
        {/* Straight after NOVA, the real dashboard, live and usable (components/genesis/nova-live; Genesis, 31 Oct 2026). */}
        <section id="demo" aria-labelledby="tour-heading" className="scroll-mt-28">
          <h2 id="tour-heading" className="sr-only">The Nova dashboard, live</h2>
          <NovaLive />
        </section>

        <section aria-labelledby="save-heading">
          <Reveal>
            <SectionLabel dot tone="brand">The problem</SectionLabel>
            <h2 id="save-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              An agency runs on a dozen tools and a hundred WhatsApp threads
            </h2>
            <p className="mt-5 max-w-3xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
              Leads in DMs, briefs buried in inboxes, plans in ten spreadsheets, quotes in Word, approvals on WhatsApp and invoices chased by phone. The hours go into moving things between tools. Nova puts the whole operation in one place.
            </p>
          </Reveal>
          {/* A window, like the demo's (Genesis, 31 Oct 2026: "fill in colours in the window like a real one"): red for today, green for Nova. */}
          <div className="mt-8 overflow-hidden rounded-[1.25rem] border border-[var(--glass-border)] bg-[#141216] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] [color-scheme:dark]">
            <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[0.75rem] text-white/45">your week, before and after</span>
            </div>
            <div className="hidden grid-cols-2 text-[0.75rem] uppercase tracking-[0.16em] sm:grid">
              <span className="bg-[#ff5f57]/[0.08] px-6 py-3 text-[#ff8a80]">Without it</span>
              <span className="bg-[#28c840]/[0.08] px-6 py-3 text-[#6ee787]">With Nova</span>
            </div>
            <ul className="divide-y divide-white/5">
              {BEFORE_AFTER.map(([before, after]) => (
                <li key={before} className="grid sm:grid-cols-2">
                  <p className="flex gap-3 bg-[#ff5f57]/[0.05] px-6 py-4 text-small text-white/45">
                    <X className="mt-0.5 size-4 shrink-0 text-[#ff5f57]" aria-hidden />
                    <span className="line-through decoration-white/20">{before}</span>
                  </p>
                  <p className="flex gap-3 bg-[#28c840]/[0.05] px-6 py-4 text-small text-white/90">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#28c840]" aria-hidden />
                    <span>{after}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <h3 className="mt-12 text-lead text-bone">What it could save you</h3>
          <p className="mt-1 text-small text-ash">Your numbers, your estimate.</p>
          <div className="mt-6">
            <SavingsCalculator />
          </div>
        </section>

        {/* What it does, feature by feature, straight after seeing it (Genesis, 31 Oct 2026: "feature-driven"). */}
        <NovaFeatures />

        <NovaConnected />

        <NovaAiExample />

        <NovaApprovals />




        <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-24">
          <Reveal>
            <SectionLabel dot tone="brand">Pricing</SectionLabel>
            <h2 id="pricing-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Three plans. Monthly or annual.
            </h2>
          </Reveal>
          <div className="mt-8">
            <CrmPricing />
          </div>
        </section>

        <section id="trial" aria-labelledby="trial-heading" className="scroll-mt-28">
          <NovaTrialForm />
        </section>


        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-28">
          <Reveal>
            <h2 id="faq-heading" className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Questions we get asked
            </h2>
          </Reveal>
          <Accordion items={FAQS} name="nova-faq" openFirst className="mt-10" />
        </section>

        <NovaSupport />

        <section id="apply" aria-labelledby="apply-heading" className="mx-auto w-full max-w-2xl scroll-mt-24">
          <h2 id="apply-heading" className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
            {plan ? `Start with ${plan}` : "Book a walkthrough"}
          </h2>
          <p className="mt-4 text-pretty text-body leading-relaxed text-ash">
            Agencies, brands and resellers. We reply within two working days, set up your workspace on a short call, and send the Razorpay subscription link.
          </p>
          <div className="mt-8">
            <GenesisForm kind="partner" source={`/resellers${plan ? `?plan=${plan}` : ""}`} compact defaults={{ ...(plan ? { plan } : {}), ...(billing ? { billing } : {}) }} />
          </div>
        </section>
      </div>
    </main>
  );
}
