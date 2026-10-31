import {
  BadgeIndianRupee,
  BellRing,
  Bot,
  CalendarClock,
  Check,
  ClipboardCheck,
  Contact,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  FolderUp,
  Inbox,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Megaphone,
  Palette,
  ReceiptIndianRupee,
  Send,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";

/*
 * NOVA, FEATURE BY FEATURE (Genesis, 31 Oct 2026: "the Nova website isn't
 * feature-driven; finalise and fix that"). Grouped the way an agency works,
 * from winning a client to getting paid. Every line is something the CRM does
 * today; what needs a bigger plan says so (lib/crm-plans), and NOVA AI is an
 * add-on on credits (lib/crm/nova-ai).
 */

type Feature = { icon: LucideIcon; title: string; line: string; points: string[]; plan?: string };
type Group = { id: string; label: string; title: string; line: string; features: Feature[] };

const GROUPS: Group[] = [
  {
    id: "win",
    label: "Win work",
    title: "From the first message to a signed proposal",
    line: "Every lead, brief and proposal in one pipeline, so nothing waits in someone's inbox.",
    features: [
      { icon: TrendingUp, title: "Leads & pipeline", line: "Drag leads from New to Won, with every follow-up on time.", points: ["Every source tracked: website, calls, WhatsApp, referrals, ChatGPT", "Follow-up dates and reminders", "The leads heating up, on your dashboard"] },
      { icon: Inbox, title: "An inbox that reads briefs", line: "Connect Gmail and Drive; a client's brief becomes a lead by itself.", points: ["The brief attached to the lead", "The right person told", "Client and vendor details picked up too"], plan: "Growth & Scale" },
      { icon: ClipboardCheck, title: "Briefs", line: "Objective, audience, deliverables, platforms, budget, duration and deadline in one place.", points: ["Linked to the lead or client", "Marked Quoted as soon as you send a proposal", "Turned into a project when you win"] },
      { icon: FileText, title: "Proposals, quotes & plans", line: "Proposal, pricing and influencer plan on one link and a PDF.", points: ["Send them together or each on its own", "GST worked out: CGST and SGST, or IGST", "Email it from Nova with the PDF, or as a draft in your Gmail", "The client approves on the link"] },
    ],
  },
  {
    id: "influence",
    label: "Influencer campaigns",
    title: "Creators, plans and reach-outs without ten spreadsheets",
    line: "One influencer database, plans that cost themselves, and every rate request tracked.",
    features: [
      { icon: Contact, title: "Influencer database", line: "Import any Excel or Google Sheet, then filter and pick.", points: ["Filter by platform, tier, niche, city and followers at once", "Duplicates merged on import", "Private: you choose who sees it"] },
      { icon: FileSpreadsheet, title: "Influencer plans", line: "Tick creators and the plan is made, with fees, totals and your margin.", points: ["An internal sheet with costs and profit", "A clean external one for the brand", "Live in Google Sheets, kept in step"], plan: "Live Sheets on Growth & Scale" },
      { icon: Send, title: "Costing in one tap", line: "Ask creators for their rates over WhatsApp or email from a saved template.", points: ["Personalised for each creator", "Every reply and rate tracked", "Who hasn't answered, at a glance"], plan: "Growth & Scale" },
      { icon: Megaphone, title: "Campaign reports", line: "Views, reach and posts live for every creator and client.", points: ["Views delivered on the dashboard", "A report per campaign to share", "Creator fees against the results"] },
    ],
  },
  {
    id: "deliver",
    label: "Deliver",
    title: "Run the work, stage by stage",
    line: "Projects, files, approvals, freelancers and tasks, with everyone seeing only what's theirs.",
    features: [
      { icon: FolderKanban, title: "Projects & stages", line: "Your own stages, a producer and a due date for every project.", points: ["One click to move to the next stage", "A timeline of everything that happened", "Ongoing projects on your dashboard"] },
      { icon: FolderUp, title: "Files by stage", line: "Brief, assets, scripts, raw footage, cuts and finals, each in its folder.", points: ["Huge uploads that pick up where they stopped", "Genesis, client and vendors ticked or crossed on every file", "Only the producer can delete"] },
      { icon: ListChecks, title: "Approvals", line: "Internal review with your producer first, then the client.", points: ["On every stage, not just the final cut", "The client approves or sends one round of changes", "Everyone on the project told"] },
      { icon: Users, title: "Client portal", line: "Brands approve work, send requests, follow projects and download invoices.", points: ["Their own login", "Only their projects and files", "No more chasing on email"], plan: "Growth & Scale" },
      { icon: Truck, title: "Vendors & freelancers", line: "Freelancers and crews take jobs, upload their work and send invoices.", points: ["Offered a job, they accept it", "They see only their folders", "Their invoices come back to you"] },
      { icon: CalendarClock, title: "Tasks", line: "A sheet of tasks you edit in place, for you and for your team.", points: ["For me, and I've assigned", "Due dates, priority, notes and links", "Overdue ones in red"] },
    ],
  },
  {
    id: "money",
    label: "Get paid",
    title: "Invoices, spend and GST, in one view",
    line: "Bill clients properly and see where the money goes.",
    features: [
      { icon: ReceiptIndianRupee, title: "GST invoices", line: "Tax invoices with the GST worked out, ready to sign and send.", points: ["Your GSTIN, address and bank details on them", "A supporting document attached", "Unpaid and overdue ones flagged"] },
      { icon: Wallet, title: "Expenses & salaries", line: "Every expense, salary and software subscription, with reminders before they're due.", points: ["Monthly and yearly subscriptions", "Who spent what, by category", "Due dates on your calendar"] },
      { icon: BadgeIndianRupee, title: "GST at a glance", line: "What you've billed and the GST due, from your own invoices.", points: ["Month by month", "CGST, SGST and IGST split", "Ready for your accountant"], plan: "With a plan" },
      { icon: LayoutDashboard, title: "A dashboard you arrange", line: "Your numbers on top, then the sections you want, in your order.", points: ["Drag, resize, hide or add sections", "Pipeline, money in, projects, reviews", "Views delivered and leads heating up"] },
    ],
  },
  {
    id: "team",
    label: "AI & team",
    title: "Your team, your brand, and an AI that does the busywork",
    line: "Everyone gets their own login; NOVA AI handles the typing.",
    features: [
      { icon: Bot, title: "NOVA AI", line: "Ask in plain words: it makes quotes and plans, adds leads and tasks, and finds creators.", points: ["From screenshots, Excel or PDFs", "5 free requests to start", "Then credits you top up"], plan: "Add-on" },
      { icon: UserCog, title: "Team & roles", line: "Roles for sales, delivery and finance; people see their own work.", points: ["Up to 5, 15 or 50 users, by plan", "Access to the influencer database by person", "Owners see everything"] },
      { icon: Palette, title: "Your brand on it", line: "Your logo on Nova, your quotes and your invoices.", points: ["Your logo on Growth", "Your own domain on Scale", "Your name on every email"], plan: "Growth & Scale" },
      { icon: BellRing, title: "Gmail, Drive & Calendar", line: "Connect your Google once; Nova works with what's already there.", points: ["Your calendar on the dashboard", "Drafts in your Gmail when you want them", "Notifications for what needs you"] },
    ],
  },
];

export function NovaFeatures() {
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-24">
      <Reveal>
        <SectionLabel dot tone="brand">Features</SectionLabel>
        <h2 id="features-heading" className="mt-6 max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
          Everything your agency runs on, in one place
        </h2>
        <p className="mt-5 max-w-3xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
          From the first brief to the paid invoice: leads, proposals, influencer plans, projects, approvals, files, invoices and your team.
        </p>
        {/* Jump to a part. */}
        <nav aria-label="Feature groups" className="mt-8 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <a key={g.id} href={`#features-${g.id}`} className="rounded-full border border-[var(--glass-border)] px-4 py-2 text-small text-ash transition-colors hover:border-[#ffc516]/60 hover:text-bone">
              {g.label} <span className="text-faint">· {g.features.length}</span>
            </a>
          ))}
        </nav>
      </Reveal>

      <div className="mt-14 space-y-20">
        {GROUPS.map((g) => (
          <div key={g.id} id={`features-${g.id}`} className="grid scroll-mt-28 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <p className="micro-label text-[#ffc516]">{g.label}</p>
              <h3 className="mt-3 text-balance text-[1.5rem] font-semibold leading-snug text-bone">{g.title}</h3>
              <p className="mt-3 text-pretty text-small leading-relaxed text-ash">{g.line}</p>
            </Reveal>
            <RevealGroup className="grid gap-4 sm:grid-cols-2">
              {g.features.map((f) => (
                <RevealItem key={f.title} className="glass glass-lit flex flex-col rounded-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ac84fe] via-[#f06144] to-[#ffaf18] text-white shadow-[0_10px_24px_-10px_rgb(240_97_68/0.7)]">
                      <f.icon className="size-5" aria-hidden />
                    </span>
                    {f.plan && <span className="rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[0.6875rem] text-ash">{f.plan}</span>}
                  </div>
                  <h4 className="mt-5 text-body font-semibold leading-snug text-bone">{f.title}</h4>
                  <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{f.line}</p>
                  <ul className="mt-4 space-y-2 border-t border-[var(--glass-border)] pt-4">
                    {f.points.map((pt) => (
                      <li key={pt} className="flex gap-2 text-small leading-snug text-ash">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#ffc516]" aria-hidden />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        ))}
      </div>
    </section>
  );
}
