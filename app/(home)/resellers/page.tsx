import type { Metadata } from "next";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { CrmPricing, SavingsCalculator } from "@/components/genesis/crm-pricing";
import { CrmTour } from "@/components/genesis/crm-tour";
import { GenesisForm } from "@/components/genesis/genesis-form";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal, RevealGroup, RevealItem } from "@/components/genesis/reveal";
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

const ROLES = [
  {
    title: "Your team",
    body: "Leads, briefs, quotes, influencer plans, invoices, tasks and money, in one admin. Everyone sees their own work; owners see everything.",
  },
  {
    title: "Your brands",
    body: "A client portal: they approve work, send briefs, follow every project and download invoices, instead of chasing you on email.",
  },
  {
    title: "Partner agencies & resellers",
    body: "Agencies run their own clients on it under their own logo. Resellers bring agencies and earn on every payment.",
  },
  {
    title: "Creators & vendors",
    body: "Creators get costing requests on WhatsApp or email from a template; vendors get briefs and send invoices back into the same place.",
  },
] as const;

const BEFORE_AFTER = [
  ["Briefs sit in someone's inbox until they remember", "A brief in Gmail or Drive becomes a lead, with the brief attached, and the right person is told"],
  ["Influencer lists in ten different sheets", "One influencer database: import any Excel or Google Sheet, filter, tick and make a plan"],
  ["Plans copied by hand into a client sheet, costs hidden by deleting columns", "One plan, two sheets: internal with costs and profit, external for the brand, kept in step"],
  ["Quotes in Word, GST worked out on a calculator", "Proposal, plan and pricing on one link and PDF, with CGST/SGST or IGST done for you"],
  ["“Did they pay?” on WhatsApp", "Razorpay links on quotes, invoices tracked, finance told when a signed copy comes back"],
] as const;

const FEATURES = [
  ["Leads & pipeline", "Drag leads across stages. Every source tracked, from website forms and calendar bookings to ChatGPT, WhatsApp and referrals."],
  ["An inbox that reads briefs", "Connect Gmail and Drive. AI spots a client brief, turns it into a lead with the brief attached, and tells the right person."],
  ["Influencer database", "Import from Excel or Google Sheets. Filter by platform, tier, niche, city and followers at once, then tick and plan."],
  ["Proposals, quotes & plans", "TG, objectives, content ideas, creators and pricing: together or separately, as a link or a PDF."],
  ["Get costing in one tap", "Message creators for their rates over WhatsApp or email from a saved template, personalised for each."],
  ["GST invoices", "Tax invoices with the GST worked out, a supporting document and a space to sign."],
  ["Client portal", "Brands approve work, send requests, follow projects and download invoices."],
  ["Team & access", "Roles for sales, delivery and finance; people see their own work plus what they're given."],
  ["Money in one view", "Expenses, salaries, software subscriptions and GST due dates, with reminders."],
] as const;

const STEPS = [
  ["Pick a plan", "Monthly or annual; tell us about your team."],
  ["Walkthrough", "A short call on your real work, and your workspace set up."],
  ["Bring your data", "Your sheets imported, your team and brands invited, your logo on it."],
  ["Go live", "Billed by Razorpay; resellers start earning with their first agency."],
] as const;

const FAQS = [
  ["How does billing work?", "Pick annual (the lowest price, paid for the year upfront) or monthly (10% more, paid month by month). Prices exclude 18% GST. You pay through Razorpay by card, UPI AutoPay or netbanking; monthly plans can be cancelled any time."],
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
    <main>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Nova by Genesis", path: "/resellers" }]), crmSoftwareJsonLd(), faqJsonLd(FAQS, "/resellers")]} />

      <Atmosphere tone="brand" origin="top" intensity={0.2}>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pb-10 pt-32 sm:pt-40">
          {/* The opening shows straight away (no fade): it's the first thing anyone sees. */}
          <SectionLabel dot tone="brand">
            Nova by Genesis · one platform
          </SectionLabel>
          <h1 className="mt-6 max-w-4xl text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
            Your agency, your brands and your partners,{" "}
            <span className="font-serif font-normal italic text-brand-ink">in one place.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
            Nova by Genesis is the CRM Genesis Media runs on, ready for yours: leads and briefs, influencer plans, quotes, GST invoices and a client portal, so your team stops living in spreadsheets and WhatsApp. From ₹4,999 a month.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GlassButton href="#pricing" variant="brand" size="lg" arrow>
              See plans & pricing
            </GlassButton>
            <GlassButton href="#apply" variant="glass" size="lg" arrow>
              Book a walkthrough
            </GlassButton>
          </div>
        </div>
      </Atmosphere>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-[var(--section-pad)] sm:gap-28">
        <section aria-labelledby="tour-heading">
          <h2 id="tour-heading" className="sr-only">See it working</h2>
          <CrmTour />
        </section>

        <section aria-labelledby="who-heading">
          <Reveal>
            <SectionLabel dot tone="brand">Who&apos;s in it</SectionLabel>
            <h2 id="who-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Everyone you work with, on one platform
            </h2>
            <p className="mt-5 max-w-3xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
              One login for each person, and each sees only what&apos;s theirs: your team, the brands you serve, the agencies you partner with, and the creators and vendors who deliver.
            </p>
          </Reveal>
          <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <RevealItem key={r.title} className="glass glass-lit rounded-card p-6">
                <h3 className="text-body font-semibold leading-snug text-bone">{r.title}</h3>
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{r.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <section aria-labelledby="save-heading">
          <Reveal>
            <SectionLabel dot tone="brand">Time & money</SectionLabel>
            <h2 id="save-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Where the hours go today, and where they stop going
            </h2>
          </Reveal>
          <div className="mt-8 overflow-hidden rounded-card border border-[var(--glass-border)]">
            <div className="hidden grid-cols-2 bg-[var(--hover-wash)] px-6 py-3 text-[0.75rem] uppercase tracking-[0.16em] text-faint sm:grid">
              <span>Without it</span>
              <span>With Nova</span>
            </div>
            <ul className="divide-y divide-[var(--glass-border)]">
              {BEFORE_AFTER.map(([before, after]) => (
                <li key={before} className="grid gap-2 px-6 py-4 sm:grid-cols-2 sm:gap-6">
                  <p className="text-small text-faint line-through decoration-white/20">{before}</p>
                  <p className="text-small text-bone">{after}</p>
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

        <section id="inside" aria-labelledby="inside-heading" className="scroll-mt-24">
          <Reveal>
            <SectionLabel dot tone="brand">What&apos;s inside</SectionLabel>
            <h2 id="inside-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Everything an influencer and content agency runs on
            </h2>
            <p className="mt-5 max-w-3xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
              Built for Genesis&apos;s own team first, and used every day on real campaigns.
            </p>
          </Reveal>
          <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, body]) => (
              <RevealItem key={title} className="glass glass-lit rounded-card p-6">
                <h3 className="text-body font-semibold leading-snug text-bone">{title}</h3>
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

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

        <section aria-labelledby="how-heading">
          <Reveal>
            <SectionLabel dot tone="brand">How it works</SectionLabel>
            <h2 id="how-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Live in four steps
            </h2>
          </Reveal>
          <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, body], i) => (
              <RevealItem key={title} className="glass glass-lit rounded-card p-6">
                <p className="micro-label">Step {i + 1}</p>
                <h3 className="mt-3 text-body font-semibold leading-snug text-bone">{title}</h3>
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <section aria-labelledby="faq-heading">
          <Reveal>
            <h2 id="faq-heading" className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Questions we get asked
            </h2>
          </Reveal>
          <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FAQS.map(([q, a]) => (
              <div key={q}>
                <dt className="text-body font-semibold leading-snug text-bone">{q}</dt>
                <dd className="mt-2 text-pretty text-body leading-relaxed text-ash">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

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
