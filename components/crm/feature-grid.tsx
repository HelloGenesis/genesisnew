"use client";

import { LayoutGrid, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { iconFor } from "./crm-rail";

export type Feature = { href: string; label: string; area: string; body: string | null; count?: number };

/*
 * ALL FEATURES (Genesis, 27 Oct 2026, after Vitra's home: "I want the CRM
 * dashboard to have these features"). The CRM's main tools as large cards,
 * each with a small picture of what it does; the rest by area as compact
 * cards. Search and the area filter narrow both. Only what this person can
 * open is here (lib/crm/nav).
 */

/** The main tools, in this order, when this person has them. */
const FEATURED = ["/admin/assistant", "/admin/quotes?type=quotes", "/admin/quotes?type=plans", "/admin/creators", "/admin/leads", "/admin/reachout", "/admin/projects", "/admin/invoices"];

const bar = (w: string, tone = "bg-[var(--crm-line)]") => <span className={`block h-1.5 rounded-full ${tone}`} style={{ width: w }} />;

/** A small picture of each main tool, drawn in CSS. */
function Vignette({ href }: { href: string }) {
  const frame = "relative mx-auto flex h-full w-[86%] flex-col gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--crm-card)] p-3 shadow-[0_10px_30px_-18px_rgb(0_0_0/0.6)]";
  switch (href) {
    case "/admin/assistant":
      return (
        <div className={`${frame} items-center justify-center`}>
          <span className="size-14 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff7d6,#ffc516_30%,#f472b6_60%,#c084fc_80%,transparent_82%)] blur-[0.5px]" />
          <span className="absolute left-3 top-3 rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.5625rem] text-ash">Make a quote</span>
          <span className="absolute bottom-3 right-3 rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.5625rem] text-ash">Find creators</span>
          <span className="mt-2 w-3/4 rounded-full border border-[var(--glass-border)] px-2 py-1 text-[0.5625rem] text-faint">Ask anything…</span>
        </div>
      );
    case "/admin/quotes?type=quotes":
      return (
        <div className={frame}>
          <div className="flex items-center justify-between"><span className="text-[0.625rem] font-semibold text-bone">Price Quote #0000049</span><span className="rounded-full bg-[#ffc516]/20 px-1.5 text-[0.5625rem] text-[#ffc516]">Draft</span></div>
          {["68%", "52%", "60%"].map((w, i) => <div key={i} className="flex items-center justify-between">{bar(w)}<span className="text-[0.5625rem] text-ash">₹{(i + 1) * 60},000</span></div>)}
          <div className="mt-auto flex items-center justify-between border-t border-[var(--glass-border)] pt-1.5"><span className="text-[0.5625rem] text-ash">Total + GST</span><span className="text-[0.6875rem] font-semibold text-bone">₹4,24,800</span></div>
        </div>
      );
    case "/admin/creators":
      return (
        <div className={`${frame} grid grid-cols-4 content-center gap-2`}>
          {["#f472b6", "#ffc516", "#60a5fa", "#34d399", "#c084fc", "#fb923c", "#f87171", "#a3e635"].map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="size-7 rounded-full" style={{ background: `linear-gradient(135deg, ${c}, transparent 140%)` }} />
              {bar(`${50 + ((i * 13) % 40)}%`)}
            </div>
          ))}
        </div>
      );
    case "/admin/quotes?type=plans":
      return (
        <div className={frame}>
          <div className="flex items-center justify-between"><span className="text-[0.625rem] font-semibold text-bone">Influencer plan · 31</span><span className="rounded-full bg-[#16a34a]/25 px-1.5 text-[0.5625rem] text-[#4ade80]">Sheets</span></div>
          {[["#f472b6", "Micro", "₹25K"], ["#60a5fa", "Nano", "₹8K"], ["#ffc516", "Mid", "₹60K"]].map(([c, t, p]) => (
            <div key={t} className="flex items-center gap-2"><span className="size-4 shrink-0 rounded-full" style={{ background: c }} />{bar("45%")}<span className="ml-auto text-[0.5rem] text-ash">{t}</span><span className="w-8 text-right text-[0.5625rem] text-bone">{p}</span></div>
          ))}
        </div>
      );
    case "/admin/leads":
      return (
        <div className={`${frame} grid grid-cols-3 gap-1.5`}>
          {[["New", 3], ["Proposal", 2], ["Won", 1]].map(([t, n]) => (
            <div key={t} className="flex flex-col gap-1 rounded-lg bg-[var(--hover-wash)] p-1.5">
              <span className="text-[0.5625rem] text-ash">{t}</span>
              {Array.from({ length: Number(n) }, (_, i) => <span key={i} className={`h-4 rounded-md ${t === "Won" ? "bg-[#16a34a]/40" : "bg-[var(--crm-card)]"}`} />)}
            </div>
          ))}
        </div>
      );
    case "/admin/reachout":
      return (
        <div className={`${frame} justify-center`}>
          <span className="w-3/4 rounded-xl rounded-bl-sm bg-[var(--hover-wash)] px-2 py-1.5 text-[0.5625rem] text-ash">Hi Riya! We&apos;re planning a skincare campaign…</span>
          <span className="ml-auto w-1/2 rounded-xl rounded-br-sm bg-[#16a34a]/30 px-2 py-1.5 text-[0.5625rem] text-bone">Reel ₹25K, story ₹8K</span>
          <div className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#16a34a]" /><span className="text-[0.5625rem] text-ash">WhatsApp · Costing received</span></div>
        </div>
      );
    case "/admin/projects":
      return (
        <div className={`${frame} justify-center`}>
          {[["Script", "100%"], ["Shoot", "70%"], ["Edit", "35%"], ["Review", "10%"]].map(([t, w]) => (
            <div key={t} className="flex items-center gap-2"><span className="w-10 text-[0.5625rem] text-ash">{t}</span><span className="h-1.5 flex-1 rounded-full bg-[var(--crm-line)]"><span className="block h-full rounded-full bg-[#ffc516]" style={{ width: w }} /></span></div>
          ))}
        </div>
      );
    case "/admin/inbox":
      return (
        <div className={`${frame} justify-center`}>
          {[["FW: Creative brief", "Brief"], ["Re: Quote #0000044", "Reply"], ["New file in Drive", "Drive"]].map(([t, k]) => (
            <div key={t} className="flex items-center gap-2 rounded-lg bg-[var(--hover-wash)] px-2 py-1"><span className="size-1.5 shrink-0 rounded-full bg-[#ffc516]" /><span className="min-w-0 flex-1 truncate text-[0.5625rem] text-bone">{t}</span><span className="text-[0.5rem] text-ash">{k}</span></div>
          ))}
        </div>
      );
    case "/admin/invoices":
      return (
        <div className={frame}>
          <span className="text-[0.625rem] font-semibold text-bone">Tax invoice</span>
          {bar("70%")}
          {bar("55%")}
          <div className="mt-auto space-y-0.5 text-[0.5625rem] text-ash">
            <div className="flex justify-between"><span>CGST 9%</span><span>₹21,600</span></div>
            <div className="flex justify-between"><span>SGST 9%</span><span>₹21,600</span></div>
            <div className="flex justify-between font-semibold text-bone"><span>Total</span><span>₹2,83,200</span></div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function FeatureGrid({ features }: { features: Feature[] }) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const areas = [...new Set(features.map((f) => f.area))];
  const fits = (f: Feature) => (!area || f.area === area) && (!q.trim() || `${f.label} ${f.body ?? ""} ${f.area}`.toLowerCase().includes(q.trim().toLowerCase()));
  const shown = features.filter(fits);
  const featured = FEATURED.map((h) => shown.find((f) => f.href === h)).filter((f): f is Feature => Boolean(f));
  const rest = shown.filter((f) => !FEATURED.includes(f.href));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <span className="sr-only">Search features</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search features…" className="crm-input !pl-9" />
        </label>
        <label className="relative">
          <LayoutGrid className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <span className="sr-only">Area</span>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="crm-input w-auto !pl-9 !pr-8">
            <option value="">All areas</option>
            {areas.map((a) => <option key={a} value={a}>{a === "Today" ? "Home" : a}</option>)}
          </select>
        </label>
      </div>

      {featured.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((f) => (
            <li key={f.href}>
              <Link href={f.href} className="group block h-full overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--crm-card)] transition-[transform,border-color] hover:-translate-y-0.5 hover:border-[#ffc516]/60">
                <div className="h-40 bg-[radial-gradient(120%_90%_at_50%_0%,rgb(255_197_22/0.10),transparent_70%)] p-4">
                  <Vignette href={f.href} />
                </div>
                <div className="border-t border-[var(--glass-border)] p-4">
                  <p className="flex items-center justify-between gap-2 text-[1.0625rem] font-semibold text-bone">
                    {f.label}
                    {f.count ? <span className="rounded-full bg-[#ffc516] px-1.5 text-[0.6875rem] leading-5 text-[#141216]">{f.count}</span> : null}
                  </p>
                  {f.body && <p className="mt-1 line-clamp-2 text-[0.875rem] leading-snug text-ash">{f.body}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {areas.map((a) => {
        const items = rest.filter((f) => f.area === a);
        if (!items.length) return null;
        return (
          <div key={a}>
            <p className="mb-2.5 text-[1rem] font-semibold text-bone">{a === "Today" ? "Home" : a}</p>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((f) => {
                const Icon = iconFor(f.href);
                return (
                  <li key={f.href}>
                    <Link href={f.href} className="flex h-full items-start gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--crm-card)] p-3.5 transition-colors hover:border-[#ffc516]/60">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffc516]/12 text-[#ffc516]"><Icon className="size-5" aria-hidden /></span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[0.9375rem] font-medium text-bone">{f.label}{f.count ? <span className="rounded-full bg-[#ffc516] px-1.5 text-[0.6875rem] leading-5 text-[#141216]">{f.count}</span> : null}</span>
                        {f.body && <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] leading-snug text-ash">{f.body}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {!shown.length && <p className="text-[0.875rem] text-ash">Nothing matches “{q}”.</p>}
    </div>
  );
}
