import { ArrowUpRight, Bell, Bot, CalendarDays, Check, Contact, FileSpreadsheet, FolderUp, Mail, MessageCircle, Phone, Users } from "lucide-react";
import Link from "next/link";

import { ViewDemoButton } from "@/components/genesis/nova-live";
import { Reveal, RevealGroup, RevealItem } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { siteConfig } from "@/lib/site-config";

/*
 * NOVA'S STORY, SECTION BY SECTION (Genesis, 31 Oct 2026: "think about this
 * page strategically, like a website strategist: we're solving a big industry
 * problem, your entire agency operation at your fingertips"). The promise,
 * then what's connected, what NOVA AI does on its own, how approvals work, and
 * where to get help. Everything here is in Nova today; what isn't yet says so.
 */

const H2 = "mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2";
const LEAD = "mt-5 max-w-3xl text-pretty text-body leading-relaxed text-ash sm:text-lead";
const BTN = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-body font-medium transition-transform hover:scale-[1.02]";
const TILE = "grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ac84fe] via-[#f06144] to-[#ffaf18] text-white shadow-[0_10px_24px_-10px_rgb(240_97_68/0.7)]";

/** Under the NOVA word: the promise in one line, and the two ways in. */
export function NovaPromise() {
  return (
    <div className="relative z-[2] mx-auto -mt-4 flex max-w-3xl flex-col items-center px-6 pb-16 text-center">
      <span className="rounded-full border border-[#ffc516]/40 bg-[#ffc516]/10 px-3 py-1 text-[0.75rem] font-medium uppercase tracking-[0.18em] text-[#ffc516]">Beta</span>
      <p className="mt-5 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-normal leading-[1.1] tracking-tight text-bone">Your entire agency, at your fingertips</p>
      <p className="mt-4 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
        Leads, quotes, influencer plans, projects, approvals, invoices and your team in one place, synced with your Google Workspace and run with NOVA AI.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="#trial" className={`${BTN} bg-[#ffc516] text-[#141216] shadow-[0_10px_30px_-10px_rgb(255_197_22/0.6)]`}>Start your free trial</Link>
        <ViewDemoButton className={`${BTN} border border-[var(--glass-border)] text-bone hover:border-[#ffc516]/60`}>View demo</ViewDemoButton>
      </div>
      <p className="mt-4 text-small text-faint">14 days free · no card to start</p>
    </div>
  );
}

const GOOGLE = [
  { icon: Mail, name: "Gmail", what: "Briefs in your mail become leads, with the brief attached; quote drafts land in your Drafts." },
  { icon: FolderUp, name: "Drive", what: "Every project gets its own folder, one per stage, and every upload goes there." },
  { icon: FileSpreadsheet, name: "Sheets", what: "Influencer plans as live Google Sheets: one with your costs, one for the brand." },
  { icon: CalendarDays, name: "Calendar", what: "Your week on the dashboard, next to your tasks and follow-ups." },
  { icon: Contact, name: "Contacts", what: "Creators, clients and vendors kept in your Google Contacts." },
];

/** Connect your workspace once; everything stays in step. */
export function NovaConnected() {
  return (
    <section id="connected" aria-labelledby="connected-heading" className="scroll-mt-24">
      <Reveal>
        <SectionLabel dot tone="brand">Connected</SectionLabel>
        <h2 id="connected-heading" className={H2}>Connect your workspace once. Everything stays in sync.</h2>
        <p className={LEAD}>One click to connect your Google Workspace, and your mail, files, sheets and calendar work with Nova: data, quotes and emails, all in one place.</p>
      </Reveal>
      <RevealGroup className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GOOGLE.map((g) => (
          <RevealItem key={g.name} className="glass glass-lit flex gap-4 rounded-card p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ac84fe] via-[#f06144] to-[#ffaf18] text-white"><g.icon className="size-[1.125rem]" aria-hidden /></span>
            <div className="min-w-0">
              <h3 className="text-body font-semibold text-bone">{g.name === "Gmail" ? "Gmail" : `Google ${g.name}`}</h3>
              <p className="mt-1 text-pretty text-small leading-relaxed text-ash">{g.what}</p>
            </div>
          </RevealItem>
        ))}
        <RevealItem className="flex flex-col justify-center rounded-card border border-dashed border-[var(--glass-border)] p-5">
          <h3 className="text-body font-semibold text-bone">Microsoft 365</h3>
          <p className="mt-2 text-pretty text-small leading-relaxed text-ash">Outlook, OneDrive and Teams calendars are coming. Tell us if your agency is on Microsoft and we&apos;ll bring you in first.</p>
          <span className="mt-4 w-fit rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[0.6875rem] text-ash">Coming soon</span>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}


/** What NOVA AI does from one message, on its own. */
export function NovaAiExample() {
  return (
    <section id="nova-ai" aria-labelledby="nova-ai-heading" className="scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <Reveal>
          <SectionLabel dot tone="brand">NOVA AI</SectionLabel>
          <h2 id="nova-ai-heading" className={H2}>Hand it the busywork</h2>
          <p className={LEAD}>Ask in plain words. NOVA AI makes quotes, influencer plans and invoices, adds leads, clients and tasks, finds creators and logs expenses, inside your Nova, with your permissions.</p>
          <ul className="mt-6 space-y-2">
            {["Quotes, proposals and influencer plans from screenshots, Excel or PDFs", "Invoices, expenses and subscriptions logged as you say them", "Creators found by category, city, followers and who you haven't contacted"].map((x) => (
              <li key={x} className="flex gap-2 text-small text-ash"><Check className="mt-0.5 size-4 shrink-0 text-[#ffc516]" aria-hidden />{x}</li>
            ))}
          </ul>
          <p className="mt-6 text-small text-faint">5 free requests to start, then credits you top up. It adds and updates; it never deletes or messages anyone.</p>
        </Reveal>
        {/* The real NOVA AI screen; a click opens it in the live demo (Genesis, 31 Oct 2026). */}
        <Reveal>
          <ViewDemoButton path="/admin/assistant" className="group relative block w-full overflow-hidden rounded-[1.25rem] border border-[var(--glass-border)] text-left shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/nova/nova-ai-screen.webp" alt="NOVA AI in Nova: a message asking for an influencer plan from screenshots" width={2636} height={1618} loading="lazy" className="block w-full transition-transform duration-500 group-hover:scale-[1.02]" />
            <span className="absolute bottom-4 right-4 rounded-full bg-[#ffc516] px-4 py-2 text-small font-medium text-[#141216] shadow-lg">Try NOVA AI in the demo →</span>
          </ViewDemoButton>
          <p className="mt-4 text-small text-ash">
            <strong className="text-bone">One message, about two minutes:</strong> it reads the screenshots and Excel, adds the 42 creators, builds the plan with fees and your margin, makes both Google Sheets, creates the lead and sets Friday&apos;s follow-up.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const SIDES = [
  {
    icon: Users,
    title: "Clients approve in one place",
    line: "First cuts, final cuts, quotes and proposals go to the client with an email and a link. They watch, approve or ask for one round of changes, and you see it on your dashboard.",
    points: ["An email the moment it's ready", "Approve or ask for changes in their portal", "Quotes approved on the link, with the PDF"],
  },
  {
    icon: Bot,
    title: "Vendors and crew in the same flow",
    line: "Editors, designers and production crews get their own portal on the projects they're on. They upload, your producer reviews internally, and only then does the client see it.",
    points: ["Their own login, only their folders", "Internal review before the client", "Their invoices come back to you"],
  },
];

/** Approvals with clients and with the people doing the work. */
export function NovaApprovals() {
  return (
    <section id="approvals" aria-labelledby="approvals-heading" className="scroll-mt-24">
      <Reveal>
        <SectionLabel dot tone="brand">Approvals</SectionLabel>
        <h2 id="approvals-heading" className={H2}>No more approvals on WhatsApp</h2>
        <p className={LEAD}>Every cut, every quote and every change request is recorded, with an email to the right person at each step.</p>
      </Reveal>
      <RevealGroup className="mt-8 grid gap-4 lg:grid-cols-2">
        {SIDES.map((s) => (
          <RevealItem key={s.title} className="glass glass-lit rounded-card p-7">
            <span className={TILE}><s.icon className="size-5" aria-hidden /></span>
            <h3 className="mt-5 text-[1.25rem] font-semibold leading-snug text-bone">{s.title}</h3>
            <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{s.line}</p>
            <ul className="mt-4 space-y-2 border-t border-[var(--glass-border)] pt-4">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2 text-small text-ash"><Check className="mt-0.5 size-4 shrink-0 text-[#ffc516]" aria-hidden />{p}</li>
              ))}
            </ul>
          </RevealItem>
        ))}
      </RevealGroup>
      <p className="mt-5 flex items-center gap-2 text-small text-faint"><Bell className="size-4" aria-hidden /> Everyone working on a project is notified of what moves on it.</p>
    </section>
  );
}

/** Nova is in Beta: help is a message away. */
export function NovaSupport() {
  const wa = `https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Genesis, I have a question about Nova.")}`;
  return (
    <section id="support" aria-labelledby="support-heading" className="scroll-mt-24">
      <Reveal className="glass glass-lit rounded-card p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <span className="rounded-full border border-[#ffc516]/40 bg-[#ffc516]/10 px-3 py-1 text-[0.75rem] font-medium uppercase tracking-[0.18em] text-[#ffc516]">Beta</span>
            <h2 id="support-heading" className="mt-5 text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone">Real people, a message away</h2>
            <p className="mt-4 max-w-xl text-pretty text-body leading-relaxed text-ash">Nova is in Beta: new features arrive every week and we set up every agency with them. Ask us anything, ask for a feature, or tell us what broke.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className={`${BTN} bg-[#25d366] text-white`}><MessageCircle className="size-4" aria-hidden /> WhatsApp us</a>
            <a href={`mailto:hello@genesismedia.co?subject=${encodeURIComponent("Nova support")}`} className={`${BTN} border border-[var(--glass-border)] text-bone hover:border-[#ffc516]/60`}><Mail className="size-4" aria-hidden /> Email</a>
            <a href={`tel:${siteConfig.whatsapp.replace(/\s/g, "")}`} className={`${BTN} border border-[var(--glass-border)] text-bone hover:border-[#ffc516]/60`}><Phone className="size-4" aria-hidden /> Call <ArrowUpRight className="size-4" aria-hidden /></a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
