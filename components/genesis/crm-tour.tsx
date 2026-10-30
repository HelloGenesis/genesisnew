"use client";

import { useState } from "react";

import { ProductWordmark } from "./product-wordmark";

/**
 * THE GENESIS CRM, SHOWN (Genesis, 13 Oct 2026: "show the real dashboard, what
 * it does"). The CRM's own screens, redrawn with sample data — no real
 * client's details on a public page. Each tab is one part of the product.
 */

const TABS = [
  ["dashboard", "Dashboard"],
  ["leads", "Leads"],
  ["plan", "Influencer plan"],
  ["quote", "Quote & PDF"],
  ["invoice", "GST invoice"],
  ["portal", "Client portal"],
] as const;
type Tab = (typeof TABS)[number][0];

const NAV = ["Dashboard", "Inbox · Gmail & Drive", "Tasks", "Leads & pipeline", "Briefs", "Quotes & plans", "Invoices", "Clients & agencies", "Projects", "Influencer database"];
const NAV_FOR: Record<Tab, string> = { dashboard: "Dashboard", leads: "Leads & pipeline", plan: "Quotes & plans", quote: "Quotes & plans", invoice: "Invoices", portal: "Projects" };

function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "good" | "warn" | "muted" | "brand" }) {
  const c = { good: "bg-[#16a34a]/15 text-[#4ade80]", warn: "bg-[#f59e0b]/15 text-[#fbbf24]", muted: "bg-white/5 text-ash", brand: "bg-[#ffc516] text-[#141216]" }[tone];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.6875rem] ${c}`}>{children}</span>;
}

function Panel({ tab }: { tab: Tab }) {
  if (tab === "dashboard")
    return (
      <div className="space-y-3">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-faint">Today</p>
          <p className="mt-1 text-[1.125rem] text-bone">Hi Riya · Head of Partnerships</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[["Open leads", "24"], ["Briefs this week", "6"], ["Quotes out", "₹18.4L"], ["Invoices due", "3"]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/[0.04] p-3">
              <p className="text-[0.6875rem] text-faint">{k}</p>
              <p className="mt-1 text-[1.125rem] tabular-nums text-bone">{v}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1.3fr_1fr]">
          <div className="rounded-xl bg-white/[0.04] p-3">
            <p className="mb-2 text-[0.75rem] text-ash">My tasks</p>
            {[["Send Aurum the reel plan", "Today", "warn"], ["Follow up Kaya Foods (proposal)", "Tomorrow", "muted"], ["Book creator shoot · Northlight", "Fri", "muted"]].map(([t, d, tone]) => (
              <div key={t} className="flex items-center justify-between gap-2 border-t border-white/5 py-1.5 text-[0.8125rem] first:border-0">
                <span className="truncate text-bone">{t}</span>
                <Pill tone={tone as "warn" | "muted"}>{d}</Pill>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3">
            <p className="mb-2 text-[0.75rem] text-ash">New in your inbox</p>
            {[["Brief", "Kaya Foods · festive campaign"], ["Invoice", "Lumen Studio · ₹42,000"], ["Brief", "Orbit Fitness · app launch"]].map(([k, t]) => (
              <div key={t} className="flex items-center gap-2 border-t border-white/5 py-1.5 text-[0.8125rem] first:border-0">
                <Pill tone={k === "Brief" ? "good" : "warn"}>{k}</Pill>
                <span className="truncate text-bone">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  if (tab === "leads")
    return (
      <div className="space-y-3">
        <p className="text-[1.125rem] text-bone">Leads & pipeline</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            ["New", [["Orbit Fitness", "ChatGPT"], ["Paperboat", "Website"]]],
            ["Call booked", [["Kaya Foods", "Referral"]]],
            ["Proposal sent", [["Aurum Skincare", "Email"], ["Lumen Studio", "Instagram"]]],
            ["Won", [["Northlight", "Partner"]]],
          ].map(([stage, cards]) => (
            <div key={stage as string} className="rounded-xl bg-white/[0.04] p-2">
              <p className="mb-2 px-1 text-[0.75rem] text-ash">{stage as string}</p>
              <div className="space-y-1.5">
                {(cards as string[][]).map(([n, s]) => (
                  <div key={n} className="rounded-lg bg-white/[0.06] p-2">
                    <p className="text-[0.8125rem] text-bone">{n}</p>
                    <p className="text-[0.6875rem] text-faint">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[0.75rem] text-faint">Drag a card to move it. A brief in Gmail becomes a lead here on its own.</p>
      </div>
    );
  if (tab === "plan")
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[1.125rem] text-bone">Kaya Foods · influencer plan</p>
          <span className="flex gap-1.5"><Pill>Excel · external</Pill><Pill>Excel · internal</Pill><Pill tone="brand">Google Sheets</Pill></span>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white/[0.04]">
          <table className="w-full min-w-[520px] text-left text-[0.75rem]">
            <thead className="text-faint">
              <tr>{["Creator", "Tier", "Category", "Followers", "Cost", "Client price", "Profit"].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="text-bone">
              {[["Ananya K", "Micro", "Food", "84K", "₹18,000", "₹23,400", "₹5,400"], ["Rahul Eats", "Mid", "Food & Travel", "310K", "₹55,000", "₹71,500", "₹16,500"], ["The Thali Diaries", "Micro", "Food", "62K", "₹14,000", "₹18,200", "₹4,200"]].map((r) => (
                <tr key={r[0]} className="border-t border-white/5">{r.map((c, i) => <td key={i} className={`px-3 py-2 ${i >= 4 ? "tabular-nums" : ""} ${i === 6 ? "text-[#4ade80]" : ""}`}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[0.75rem] text-faint">Costs, profit and contacts stay internal. The brand gets the external sheet, or a sample with no prices.</p>
      </div>
    );
  if (tab === "quote")
    return (
      <div className="grid gap-3 sm:grid-cols-[1fr_1.1fr]">
        <div className="space-y-2">
          <p className="text-[1.125rem] text-bone">Proposal & quote</p>
          {["TG (target group)", "Problems we'll solve", "Objectives", "Content ideas"].map((t) => (
            <div key={t} className="rounded-xl bg-white/[0.04] p-2.5">
              <p className="text-[0.6875rem] text-faint">{t}</p>
              <div className="mt-1.5 h-2 w-4/5 rounded bg-white/10" />
              <div className="mt-1 h-2 w-3/5 rounded bg-white/10" />
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-[#f8fafc] p-3 text-[#0f172a]">
          <div className="flex items-start justify-between">
            <span className="text-[0.75rem] font-semibold">YOUR AGENCY</span>
            <span className="text-right text-[0.625rem] text-[#64748b]">Price Quote #0000128<br />Valid until 30 Nov</span>
          </div>
          <p className="mt-3 text-[0.8125rem] font-semibold">Kaya Foods · Festive campaign</p>
          <div className="mt-2 space-y-1 text-[0.6875rem]">
            {[["12 creator reels", "₹2,40,000"], ["Content production", "₹85,000"], ["CGST 9% + SGST 9%", "₹58,500"]].map(([a, b]) => (
              <div key={a} className="flex justify-between border-b border-[#e2e8f0] pb-1"><span>{a}</span><span>{b}</span></div>
            ))}
          </div>
          <div className="mt-2 flex justify-between rounded-lg bg-[#eef2ff] px-2 py-1.5 text-[0.75rem] font-semibold"><span>Total</span><span>₹3,83,500</span></div>
          <p className="mt-2 text-[0.625rem] text-[#64748b]">Approve online · pay by Razorpay · download PDF</p>
        </div>
      </div>
    );
  if (tab === "invoice")
    return (
      <div className="grid gap-3 sm:grid-cols-[1fr_1.1fr]">
        <div className="space-y-2">
          <p className="text-[1.125rem] text-bone">GST tax invoices</p>
          {[["#110214 · Aurum Skincare", "Paid", "good"], ["#110215 · Kaya Foods", "Sent", "warn"], ["#110216 · Northlight", "Draft", "muted"]].map(([t, s, tone]) => (
            <div key={t} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-[0.8125rem]">
              <span className="truncate text-bone">{t}</span>
              <Pill tone={tone as "good" | "warn" | "muted"}>{s}</Pill>
            </div>
          ))}
          <p className="text-[0.75rem] text-faint">CGST + SGST or IGST worked out, a supporting document, a space to sign. Upload the signed copy and finance is told.</p>
        </div>
        <div className="rounded-xl bg-[#f8fafc] p-3 text-[#0f172a]">
          <p className="text-center text-[0.75rem] font-semibold tracking-[0.12em]">TAX INVOICE</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[0.625rem] text-[#334155]">
            <span>GSTIN 27ABCDE1234F1Z5<br />Place of supply: Maharashtra</span>
            <span className="text-right">Invoice #110215<br />Due in 15 days</span>
          </div>
          <div className="mt-2 space-y-1 text-[0.6875rem]">
            {[["Influencer campaign · SAC 998361", "₹3,25,000"], ["CGST 9%", "₹29,250"], ["SGST 9%", "₹29,250"]].map(([a, b]) => (
              <div key={a} className="flex justify-between border-b border-[#e2e8f0] pb-1"><span>{a}</span><span>{b}</span></div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[0.75rem] font-semibold"><span>Total</span><span>₹3,83,500</span></div>
        </div>
      </div>
    );
  return (
    <div className="space-y-3">
      <p className="text-[1.125rem] text-bone">Aurum Skincare · client portal</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {[["Projects", "2 live · 1 in review"], ["Approvals", "3 reels waiting for you"], ["Invoices", "1 due · download PDFs"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/[0.04] p-3">
            <p className="text-[0.75rem] text-ash">{k}</p>
            <p className="mt-1 text-[0.875rem] text-bone">{v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/[0.04] p-3">
        <p className="mb-2 text-[0.75rem] text-ash">Review work</p>
        {[["Reel 1 · Ananya K", "Approve", "good"], ["Reel 2 · Rahul Eats", "Changes asked", "warn"]].map(([t, s, tone]) => (
          <div key={t} className="flex items-center justify-between border-t border-white/5 py-1.5 text-[0.8125rem] first:border-0">
            <span className="text-bone">{t}</span>
            <Pill tone={tone as "good" | "warn"}>{s}</Pill>
          </div>
        ))}
      </div>
      <p className="text-[0.75rem] text-faint">Your brands sign in to approve work, send briefs, follow projects and download invoices. No more email threads.</p>
    </div>
  );
}

export function CrmTour() {
  const [tab, setTab] = useState<Tab>("dashboard");
  return (
    <div>
      <div role="tablist" aria-label="Parts of the CRM" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] md:justify-center">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} className={`shrink-0 rounded-full border px-4 py-2 text-small transition-colors ${tab === id ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-ash hover:text-bone"}`}>
            {label}
          </button>
        ))}
      </div>
      {/* The window: the CRM's sidebar and the chosen screen. */}
      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[var(--glass-border)] bg-[#141216] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] [color-scheme:dark]">
        <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate text-[0.75rem] text-faint">nova.genesismedia.co/{tab === "portal" ? "portal" : "admin"}</span>
          <span className="ml-auto text-[0.6875rem] text-faint">Sample data</span>
        </div>
        <div className="grid min-h-[22rem] lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/5 p-3 lg:block">
            <div className="px-2 pb-3 pt-1 [--logo-invert:0]"><ProductWordmark product="nova" className="h-[18px]" /></div>
            {NAV.map((n) => (
              <p key={n} className={`rounded-lg px-2 py-1.5 text-[0.75rem] ${NAV_FOR[tab] === n ? "bg-[#ffc516] text-[#141216]" : "text-ash"}`}>{n}</p>
            ))}
          </aside>
          <div role="tabpanel" className="min-w-0 p-4 sm:p-5 [&_.text-ash]:text-white/60 [&_.text-bone]:text-white/90 [&_.text-faint]:text-white/40">
            <Panel tab={tab} />
          </div>
        </div>
      </div>
    </div>
  );
}
