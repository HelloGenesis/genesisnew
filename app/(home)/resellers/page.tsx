import type { Metadata } from "next";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GenesisForm } from "@/components/genesis/genesis-form";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal, RevealGroup, RevealItem } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Genesis CRM for Agencies & Resellers",
  description:
    "The CRM Genesis Media runs on — leads, influencer plans, quotes, GST invoices and an AI inbox — for your agency, under your brand. Resell it and earn a commission.",
  path: "/resellers",
});

/**
 * /resellers — THE GENESIS CRM, OFFERED TO OTHERS (Genesis, 13 Oct 2026: "sell
 * this entire backend to clients at a cost and a commission … they can just
 * use the backend for their agencies. Even brands can give this to their
 * agencies"). White-label is optional.
 *
 * Every feature named here is one the CRM has today. No prices: agencies pay a
 * monthly cost and resellers earn a commission, and both are agreed on the
 * call. The form lands as a PARTNER lead in Leads & pipeline.
 */

const AUDIENCES = [
  {
    title: "Resellers",
    body: "Offer the CRM to the agencies you work with. They pay a monthly cost; you earn a commission on every agency you bring, for as long as they stay.",
  },
  {
    title: "Agencies",
    body: "Run your own clients, creators, quotes and invoices on it. One place for the team instead of ten sheets and a WhatsApp group.",
  },
  {
    title: "Brands",
    body: "Give it to your agencies so every plan, quote and invoice for your brand is made the same way, and you can see where things stand.",
  },
] as const;

const FEATURES = [
  {
    title: "Leads & pipeline",
    body: "Drag leads across stages. Every source tracked, from website forms and calendar bookings to ChatGPT, WhatsApp and referrals. Follow-ups with Google Calendar.",
  },
  {
    title: "An inbox that reads briefs",
    body: "Connect Gmail and Drive. AI spots a client brief in an email, turns it into a lead with the brief attached, and tells the right person.",
  },
  {
    title: "Influencer database",
    body: "Import creators from Excel or Google Sheets. Filter by platform, tier, niche, city and followers at once, then tick the ones you want and make a plan.",
  },
  {
    title: "Proposals, quotes & plans",
    body: "Proposal, pricing and influencer plan, sent together or separately as a link or PDF. Internal and client Google Sheets made for every plan.",
  },
  {
    title: "Get costing in one tap",
    body: "Message creators for rates over WhatsApp or email from a saved template, personalised with each creator's name.",
  },
  {
    title: "GST invoices",
    body: "Tax invoices with CGST + SGST or IGST worked out, a supporting document, and a space to sign. Upload the signed copy and finance is told.",
  },
  {
    title: "Team & access",
    body: "Roles for sales, delivery and finance. Admins see everything; everyone else sees their own work plus what they're given.",
  },
  {
    title: "Money in one view",
    body: "Expenses, salaries, software subscriptions and GST due dates, with reminders before anything is late.",
  },
  {
    title: "Live Google Sheets",
    body: "Leads, creators, quotes and invoices kept in Google Sheets as they change, and every list exports to Excel.",
  },
] as const;

const STEPS = [
  { title: "Apply", body: "Tell us who you are and how you'd use it." },
  { title: "Walkthrough", body: "A call to show you the CRM on real work, and agree the cost and commission." },
  { title: "Set up", body: "Your logo if you want it, your team invited, and your existing sheets imported." },
  { title: "Go live", body: "Your team works in it from day one. Resellers start earning with their first agency." },
] as const;

const FAQS = [
  {
    question: "How do resellers earn?",
    answer: "Each agency pays a monthly cost for the CRM, and you earn a commission on every agency you bring. The cost and the commission are agreed on the walkthrough call.",
  },
  {
    question: "Can it carry our brand?",
    answer: "Yes, if you want it to. It can run under your agency's name and logo, or co-branded with Genesis. You choose per client.",
  },
  {
    question: "Do we need Genesis to deliver the work?",
    answer: "No. The CRM is yours to run your own business. If you also want Genesis's influencer, production, AI or design teams on a project, that's a separate conversation.",
  },
  {
    question: "Can we bring our existing data?",
    answer: "Yes. Leads, clients, vendors, creators, expenses and briefs come in from Excel, CSV or Google Sheets, with the columns matched for you.",
  },
] as const;

export default function ResellersPage() {
  return (
    <main>
      <JsonLd data={breadcrumbJsonLd([{ name: "Resellers", path: "/resellers" }])} />

      <Atmosphere tone="brand" origin="top" intensity={0.2}>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pb-12 pt-32 sm:pt-40">
          <Reveal>
            <SectionLabel dot tone="brand">
              Genesis CRM · for agencies & resellers
            </SectionLabel>
            <h1 className="mt-6 max-w-4xl text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
              Run your agency on the system{" "}
              <span className="font-serif font-normal italic text-brand-ink">we run on.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
              The CRM behind Genesis Media: leads, influencer plans, quotes, GST invoices and an inbox that reads briefs. Use it for your agency, under your brand, or resell it and earn on every agency you bring.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="mt-8 flex flex-wrap gap-3">
            <GlassButton href="#apply" variant="brand" size="lg" arrow>
              Apply to partner
            </GlassButton>
            <GlassButton href="#inside" variant="glass" size="lg" arrow>
              See what&apos;s inside
            </GlassButton>
          </Reveal>
        </div>
      </Atmosphere>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-[var(--section-pad)] sm:gap-24">
        <section aria-labelledby="who-heading">
          <Reveal>
            <SectionLabel dot tone="brand">Who it&apos;s for</SectionLabel>
            <h2 id="who-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              One backend, three ways in
            </h2>
          </Reveal>
          <RevealGroup className="mt-8 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((a) => (
              <RevealItem key={a.title} className="glass glass-lit rounded-card p-6">
                <h3 className="text-body font-semibold leading-snug text-bone">{a.title}</h3>
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash sm:text-body">{a.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
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
            {FEATURES.map((f) => (
              <RevealItem key={f.title} className="glass glass-lit rounded-card p-6">
                <h3 className="text-body font-semibold leading-snug text-bone">{f.title}</h3>
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{f.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <section aria-labelledby="how-heading">
          <Reveal>
            <SectionLabel dot tone="brand">How it works</SectionLabel>
            <h2 id="how-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              From application to live in four steps
            </h2>
          </Reveal>
          <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <RevealItem key={s.title} className="glass glass-lit rounded-card p-6">
                <p className="micro-label">Step {i + 1}</p>
                <h3 className="mt-3 text-body font-semibold leading-snug text-bone">{s.title}</h3>
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{s.body}</p>
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
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="text-body font-semibold leading-snug text-bone">{faq.question}</dt>
                <dd className="mt-2 text-pretty text-body leading-relaxed text-ash">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="apply" aria-labelledby="apply-heading" className="mx-auto w-full max-w-2xl scroll-mt-24">
          <Reveal>
            <h2 id="apply-heading" className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
              Apply to partner
            </h2>
            <p className="mt-4 text-pretty text-body leading-relaxed text-ash">
              Resellers, agencies and brands. We reply within two working days.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="mt-8">
            <GenesisForm kind="partner" source="/resellers" compact />
          </Reveal>
        </section>
      </div>
    </main>
  );
}
