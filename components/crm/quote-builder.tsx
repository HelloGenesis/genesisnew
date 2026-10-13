"use client";

import { ArrowDown, ArrowUp, Columns3, ExternalLink, FileSpreadsheet, Plus, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";

import { saveQuote } from "@/app/(crm)/admin/actions/quotes";
import { PLAN_COLUMNS } from "@/lib/crm/plan-tables";

import { RichText } from "./rich-text";

export type BuilderLine = { kind: string; productId?: string | null; division?: string | null; title: string; subtitle?: string | null; details?: string | null; note?: string | null; qty: number; unit: number };
export type BuilderCreator = {
  creatorId?: string | null; name: string; handle: string; platform: string; profileUrl?: string | null; followers: number; avgViews?: number | null; niches: string[]; city?: string | null; deliverables?: string | null; fee?: number | null;
  /* The plan's columns: the creator's cost to us and the client's price, per deliverable (Genesis, 12 Oct 2026). */
  er?: number | null; reelCost?: number | null; storyCost?: number | null; dlCost?: number | null; reelPrice?: number | null; storyPrice?: number | null; dlPrice?: number | null;
  reachout?: string | null; contact?: string | null; remarks?: string | null;
  /* Values of the columns added in the builder, by column name. */
  extra?: Record<string, string>;
};
export type ProposalSection = { title: string; html: string };
export type PlanColumnsState = { hidden?: string[]; custom?: string[] };
export type BuilderQuote = {
  id?: string;
  kind: "QUOTE" | "INFLUENCER_PLAN";
  title: string;
  division?: string | null;
  accountId?: string | null;
  leadId?: string | null;
  requestId?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  company?: string | null;
  expiresAt: string;
  notes?: string | null;
  terms?: string | null;
  addGst: boolean;
  gstPercent: number;
  igst?: boolean;
  discount: number;
  proposalPlatforms?: string[];
  proposalProblems?: string | null;
  proposalObjectives?: string | null;
  proposalInfluencers?: string | null;
  proposalTg?: string | null;
  proposalSections?: ProposalSection[];
  planColumns?: PlanColumnsState;
  markupPercent?: number;
  planBudget?: string | null;
  lines: BuilderLine[];
  creators: BuilderCreator[];
};
type CatalogItem = { id: string; kind: string; group: string; division: string; title: string; subtitle?: string; details: string; note?: string; price: number };
type PoolCreator = { id: string; name: string; handle: string; platform: string; profileUrl: string | null; followers: number; avgViews: number | null; niches: string[]; city: string | null; reel: number | null; story: number | null; dl: number | null; contact: string | null };
type Terms = { key: string; label: string; notes: string; terms: string[] };
type Client = { key: string; kind: "client" | "agency" | "lead"; accountId: string | null; leadId: string | null; company: string; contactName: string; email: string; phone: string | null };

const DIVISIONS: [string, string][] = [["AI_LAB", "AI Lab"], ["STUDIOS", "Studios"], ["BRAND_DESIGN", "Brand & Design"], ["INFLUENCE", "Influence"]];
const inr = (r: number) => `₹${r.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n);
const PLATFORMS = ["Instagram", "YouTube", "LinkedIn", "Facebook", "X", "Snapchat", "Moj / Josh", "Website", "OTT / TV", "Events"];

/** A creator's total to the client: the priced deliverables when priced one by one, else the single fee. */
const priced = (c: BuilderCreator) => [c.reelPrice, c.storyPrice, c.dlPrice].some((v) => typeof v === "number");
const creatorTotal = (c: BuilderCreator) => (priced(c) ? (c.reelPrice ?? 0) + (c.storyPrice ?? 0) + (c.dlPrice ?? 0) : (c.fee ?? 0));
const creatorCost = (c: BuilderCreator) => (c.reelCost ?? 0) + (c.storyCost ?? 0) + (c.dlCost ?? 0);
const REACHOUT = ["", "WhatsApp", "Email", "Agency/Freelancer", "Hashfame", "Awaiting reply", "Costs received", "Confirmed", "Not relevant", "Declined"];
const MONEY = ["reelCost", "storyCost", "dlCost", "reelPrice", "storyPrice", "dlPrice"] as const;
type MoneyKey = (typeof MONEY)[number];
const MONEY_LABEL: Record<MoneyKey, string> = { reelCost: "Cost: 1 IG Reel", storyCost: "Cost: Story + LIB", dlCost: "Cost: DL (1 month)", reelPrice: "Price: 1 IG Reel", storyPrice: "Price: Story + LIB", dlPrice: "Price: DL (1 month)" };

/** A creator from a profile link: the platform and handle it names (Genesis, 12 Oct 2026: "link + add more influencer"). */
function fromLink(url: string): BuilderCreator | null {
  const m = url.trim().match(/^(?:https?:\/\/)?(?:www\.|m\.)?(instagram\.com|youtube\.com|youtu\.be|linkedin\.com\/in|x\.com|twitter\.com|facebook\.com|snapchat\.com\/add)\/@?([A-Za-z0-9._-]+)/i);
  if (!m) return null;
  const host = m[1]!.toLowerCase();
  const platform = host.startsWith("instagram") ? "INSTAGRAM" : host.startsWith("youtu") ? "YOUTUBE" : host.startsWith("linkedin") ? "LINKEDIN" : host.startsWith("x.") || host.startsWith("twitter") ? "X" : host.startsWith("facebook") ? "FACEBOOK" : "SNAPCHAT";
  const handle = m[2]!.replace(/^@/, "");
  if (["p", "reel", "reels", "watch", "channel", "c", "user", "shorts", "stories"].includes(handle.toLowerCase())) return null;
  return { creatorId: null, name: handle, handle, platform, profileUrl: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`, followers: 0, avgViews: null, niches: [], city: null, deliverables: "1 reel + 2 stories", fee: null };
}

/**
 * CLIENT / BRAND, WITH THE ONES ALREADY IN THE CRM (Genesis, 13 Oct 2026:
 * "a drop-down where the already added client and brand names can be seen,
 * and it should fill up on its own"). Type to filter; picking one fills the
 * contact, email and phone, links the quote to that client or lead, and
 * names the quote if it has no title yet. Any new name can still be typed.
 */
function ClientPicker({ value, clients, onType, onPick }: { value: string; clients: Client[]; onType: (v: string) => void; onPick: (c: Client) => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const shown = useMemo(() => {
    const s = value.trim().toLowerCase();
    const list = s ? clients.filter((c) => `${c.company} ${c.contactName} ${c.email}`.toLowerCase().includes(s)) : clients;
    return list.slice(0, 40);
  }, [clients, value]);
  return (
    <div ref={box} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onType(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="crm-input"
        placeholder="Pick a client or type a new one"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {open && shown.length > 0 && (
        <ul className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-1 shadow-[var(--shadow-float)]" data-lenis-prevent role="listbox" id={listId}>
          {shown.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => {
                  onPick(c);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[var(--hover-wash)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[0.875rem] text-bone">{c.company}</span>
                  <span className="block truncate text-[0.75rem] text-ash">{[c.contactName !== c.company ? c.contactName : "", c.email].filter(Boolean).join(" · ") || "No contact yet"}</span>
                </span>
                <span className="shrink-0 rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.6875rem] text-ash">{c.kind === "lead" ? "Lead" : c.kind === "agency" ? "Agency" : "Client"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * THE QUOTE BUILDER — Genesis's Price Quote, assembled on screen. In the
 * order the client reads it (Genesis, 13 Oct 2026: "proposal should come
 * above costing; costing below everything"): the proposal, the influencer
 * plan, the price lines, then notes, terms and totals. Saves as a draft with
 * gaps; sending is a separate step.
 */
export function QuoteBuilder({ initial, catalog, terms, pool, clients = [], sheets }: { initial: BuilderQuote; catalog: CatalogItem[]; terms: Terms[]; pool: PoolCreator[]; clients?: Client[]; sheets?: { ext: string | null; int: string | null } }) {
  const [q, setQ] = useState<BuilderQuote>({ ...initial, proposalSections: initial.proposalSections ?? [], planColumns: initial.planColumns ?? {} });
  const [pick, setPick] = useState("");
  const [search, setSearch] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showColumns, setShowColumns] = useState(false);
  const [newColumn, setNewColumn] = useState("");
  const [download, setDownload] = useState<string | null>(null);
  const [state, action, pending] = useActionState(saveQuote, null);
  /* Which parts this document holds (shown in the builder; the send step picks which go). */
  const [parts, setParts] = useState({
    proposal: Boolean(initial.proposalProblems || initial.proposalObjectives || initial.proposalInfluencers || initial.proposalTg || initial.proposalPlatforms?.length || initial.proposalSections?.length) || initial.kind === "QUOTE",
    pricing: initial.kind === "QUOTE" || initial.lines.length > 0,
    plan: initial.kind === "INFLUENCER_PLAN" || initial.creators.length > 0,
  });
  const set = <K extends keyof BuilderQuote>(k: K, v: BuilderQuote[K]) => setQ((x) => ({ ...x, [k]: v }));
  const setLine = (i: number, patch: Partial<BuilderLine>) => setQ((x) => ({ ...x, lines: x.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const setCreator = (i: number, patch: Partial<BuilderCreator>) => setQ((x) => ({ ...x, creators: x.creators.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const setSection = (i: number, patch: Partial<ProposalSection>) => setQ((x) => ({ ...x, proposalSections: (x.proposalSections ?? []).map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const move = (i: number, d: number) =>
    setQ((x) => {
      const lines = [...x.lines];
      const j = i + d;
      if (j < 0 || j >= lines.length) return x;
      [lines[i], lines[j]] = [lines[j]!, lines[i]!];
      return { ...x, lines };
    });
  const moveSection = (i: number) =>
    setQ((x) => {
      const list = [...(x.proposalSections ?? [])];
      if (i > 0) [list[i - 1], list[i]] = [list[i]!, list[i - 1]!];
      return { ...x, proposalSections: list };
    });

  const hidden = new Set(q.planColumns?.hidden ?? []);
  const custom = q.planColumns?.custom ?? [];
  const shows = (key: string) => !hidden.has(key);
  const toggleColumn = (key: string) =>
    setQ((x) => {
      const now = x.planColumns?.hidden ?? [];
      return { ...x, planColumns: { ...x.planColumns, hidden: now.includes(key) ? now.filter((k) => k !== key) : [...now, key] } };
    });
  const addColumn = () => {
    const name = newColumn.trim().slice(0, 60);
    setNewColumn("");
    if (!name || custom.includes(name) || PLAN_COLUMNS.some(([, l]) => l.toLowerCase() === name.toLowerCase())) return;
    setQ((x) => ({ ...x, planColumns: { ...x.planColumns, custom: [...(x.planColumns?.custom ?? []), name] } }));
  };
  const removeColumn = (name: string) => {
    if (!window.confirm(`Remove the “${name}” column and what's in it?`)) return;
    setQ((x) => ({ ...x, planColumns: { ...x.planColumns, custom: (x.planColumns?.custom ?? []).filter((c) => c !== name) }, creators: x.creators.map((c) => ({ ...c, extra: Object.fromEntries(Object.entries(c.extra ?? {}).filter(([k]) => k !== name)) })) }));
  };

  const totals = useMemo(() => {
    const lines = q.lines.reduce((s, l) => s + l.qty * l.unit, 0);
    const creators = q.creators.reduce((s, c) => s + creatorTotal(c), 0);
    const subtotal = lines + creators;
    const taxable = Math.max(0, subtotal - q.discount);
    const tax = q.addGst ? Math.round(taxable * q.gstPercent) / 100 : 0;
    return { subtotal, creators, tax, total: taxable + tax };
  }, [q]);

  const groups = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const c of catalog) map.set(c.group, [...(map.get(c.group) ?? []), c]);
    return [...map.entries()];
  }, [catalog]);

  const matches = useMemo(() => {
    const s = search.trim().toLowerCase().replace(/^@/, "");
    const chosen = new Set(q.creators.map((c) => c.creatorId));
    return pool.filter((c) => !chosen.has(c.id) && (!s || c.name.toLowerCase().includes(s) || c.handle.includes(s) || c.niches.some((n) => n.toLowerCase().includes(s)) || (c.city ?? "").toLowerCase().includes(s))).slice(0, 8);
  }, [pool, search, q.creators]);

  function addFromCatalog(id: string) {
    const c = catalog.find((x) => x.id === id);
    if (!c) return;
    setQ((x) => ({ ...x, division: x.division ?? c.division, lines: [...x.lines, { kind: c.kind, productId: c.id, division: c.division, title: c.title, subtitle: c.subtitle ?? null, details: c.details, note: c.note ?? null, qty: 1, unit: c.price }] }));
    setPick("");
  }

  function loadTerms(key: string) {
    const t = terms.find((x) => x.key === key);
    if (t) setQ((x) => ({ ...x, notes: t.notes, terms: t.terms.join("\n") }));
  }

  function pickClient(c: Client) {
    setQ((x) => ({
      ...x,
      company: c.company,
      contactName: c.contactName || x.contactName,
      contactEmail: c.email || x.contactEmail,
      contactPhone: c.phone || x.contactPhone,
      accountId: c.accountId ?? x.accountId ?? null,
      leadId: c.leadId ?? x.leadId ?? null,
      title: x.title.trim() ? x.title : `${c.company} — ${x.kind === "INFLUENCER_PLAN" ? "Influencer plan" : "Proposal"}`,
    }));
  }

  /* Excel, internal or external, from the plan as it is on screen (no need to save first). */
  async function excel(which: "ext" | "int") {
    setDownload(which);
    try {
      const r = await fetch(`/api/crm/plan-xlsx?which=${which}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
      if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? `Error ${r.status}`);
      const name = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "Influencer plan.xlsx";
      const url = URL.createObjectURL(await r.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      window.alert(`Couldn't make the Excel: ${(e as Error).message}`);
    }
    setDownload(null);
  }

  const costTotal = q.creators.reduce((s, c) => s + creatorCost(c), 0);
  const sum = (k: MoneyKey) => q.creators.reduce((s, c) => s + (c[k] ?? 0), 0);

  const proposalBox = (label: string, hint: string, value: string | null | undefined, onChange: (v: string) => void, placeholder: string) => (
    <div className="space-y-1.5 rounded-xl border border-[var(--glass-border)] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.9375rem] text-bone">{label}</span>
        <span className="text-[0.75rem] text-faint">{hint}</span>
      </div>
      <RichText label={label} value={value ?? ""} onChange={onChange} placeholder={placeholder} />
    </div>
  );

  return (
    <form action={action} noValidate className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(q)} />

      <section className="crm-card crm-pad space-y-4">
        {/*
          TOGETHER OR SEPARATE (Genesis, 12 Oct 2026: "influencer plan, proposal
          and other quotes should be together or separate, give the option").
          Tick what this document holds; when sending, choose which parts go.
        */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.875rem] text-ash">This document has:</span>
          {([["proposal", "Proposal"], ["plan", "Influencer plan"], ["pricing", "Price lines"]] as const).map(([k, label]) => {
            const on = parts[k];
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const next = { ...parts, [k]: !on };
                  if (!next.proposal && !next.pricing && !next.plan) return;
                  setParts(next);
                  set("kind", next.plan && !next.pricing ? "INFLUENCER_PLAN" : "QUOTE");
                }}
                className={`rounded-full border px-3 py-1.5 text-[0.875rem] ${on ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-ash hover:text-bone"}`}
              >
                {on ? "✓ " : ""}{label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.6fr_1fr_1fr]">
          <label><span className="crm-label">Client / brand</span><ClientPicker value={q.company ?? ""} clients={clients} onType={(v) => setQ((x) => ({ ...x, company: v }))} onPick={pickClient} /></label>
          <label><span className="crm-label">Title (as on the quote)</span><input value={q.title} onChange={(e) => set("title", e.target.value)} className="crm-input" placeholder="Fills in when you pick the client" /></label>
          <label><span className="crm-label">Division</span>
            <select value={q.division ?? ""} onChange={(e) => set("division", e.target.value || null)} className="crm-input"><option value="">—</option>{DIVISIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <label><span className="crm-label">Valid until</span><input type="date" value={q.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className="crm-input" /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className="crm-label">Contact name</span><input value={q.contactName} onChange={(e) => set("contactName", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">Email</span><input type="email" value={q.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="crm-input" placeholder="Needed only to send" /></label>
          <label><span className="crm-label">Phone</span><input value={q.contactPhone ?? ""} onChange={(e) => set("contactPhone", e.target.value)} className="crm-input" /></label>
        </div>
      </section>

      {/* THE PROPOSAL (Genesis, 12–13 Oct 2026): first, one box after another, each with its own formatting tools. */}
      <section className={`crm-card crm-pad space-y-4 ${parts.proposal ? "" : "hidden"}`}>
        <div>
          <h2 className="text-[1.125rem] text-bone">Proposal</h2>
          <p className="text-[0.8125rem] text-ash">Comes first on the document. When sending you can send the proposal on its own, the pricing on its own, or both.</p>
        </div>
        <fieldset>
          <legend className="crm-label">Platforms</legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => {
              const on = (q.proposalPlatforms ?? []).includes(p);
              return (
                <button key={p} type="button" aria-pressed={on} onClick={() => set("proposalPlatforms", on ? (q.proposalPlatforms ?? []).filter((x) => x !== p) : [...(q.proposalPlatforms ?? []), p])} className={`rounded-full border px-3 py-1 text-[0.8125rem] ${on ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-ash hover:text-bone"}`}>
                  {p}
                </button>
              );
            })}
          </div>
        </fieldset>
        {proposalBox("TG (target group)", "Who the campaign speaks to", q.proposalTg, (v) => set("proposalTg", v), "Women 25–40, SEC A/B, Tier-1 & Tier-2 cities, into fitness and wellness")}
        {proposalBox("Problems we'll solve", "One point a line", q.proposalProblems, (v) => set("proposalProblems", v), "Low awareness in Tier-2 cities. No creator content for the launch.")}
        {proposalBox("Objectives", "What success looks like", q.proposalObjectives, (v) => set("proposalObjectives", v), "10k app installs in 30 days. 2M+ views.")}
        {proposalBox("Influencers", "The mix of creators", q.proposalInfluencers, (v) => set("proposalInfluencers", v), "15 fitness & food creators, 50k–500k followers. Mumbai, Pune, Bengaluru.")}
        {(q.proposalSections ?? []).map((s, i) => (
          <div key={i} className="space-y-1.5 rounded-xl border border-[var(--glass-border)] p-3">
            <div className="flex items-center gap-2">
              <input value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} className="crm-input !min-h-9 flex-1" placeholder="Section title: Big idea, Content pillars, Timeline, Deliverables…" />
              <button type="button" aria-label="Move section up" onClick={() => moveSection(i)} className="text-ash hover:text-bone"><ArrowUp className="size-4" /></button>
              <button type="button" aria-label="Remove section" onClick={() => window.confirm("Remove this section?") && setQ((x) => ({ ...x, proposalSections: (x.proposalSections ?? []).filter((_, j) => j !== i) }))} className="text-ash hover:text-[#dc2626]"><Trash2 className="size-4" /></button>
            </div>
            <RichText label={s.title || `Section ${i + 1}`} value={s.html} onChange={(v) => setSection(i, { html: v })} placeholder="Write, format, add images, links or an embedded video, reel or deck." />
          </div>
        ))}
        <button type="button" onClick={() => set("proposalSections", [...(q.proposalSections ?? []), { title: "", html: "" }])} className="crm-btn crm-btn-secondary crm-btn-sm"><Plus className="size-4" /> Add a section</button>
      </section>

      <section className={`space-y-3 ${parts.plan ? "" : "hidden"}`}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[1.125rem] text-bone">Influencer plan</h2>
          <span className="text-[0.8125rem] text-ash">{q.creators.length} creators · {inr(totals.creators)} to the client</span>
        </div>
        <div className="crm-card crm-pad space-y-3">
          {/*
            THE PLAN AS SHEETS (Genesis, 13 Oct 2026: "export as Excel and Google
            Sheet, internal and external, here"): Excel from what's on screen;
            Google Sheets save the plan and make both in your own Drive.
          */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--hover-wash)] px-3 py-2">
            <span className="mr-1 text-[0.8125rem] text-ash">Sheets:</span>
            <button type="button" disabled={!q.creators.length || download !== null} onClick={() => excel("ext")} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-40"><FileSpreadsheet className="size-4" aria-hidden /> {download === "ext" ? "Making…" : "Excel · external (client)"}</button>
            <button type="button" disabled={!q.creators.length || download !== null} onClick={() => excel("int")} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-40"><FileSpreadsheet className="size-4" aria-hidden /> {download === "int" ? "Making…" : "Excel · internal (team)"}</button>
            <button name="then" value="sheets" disabled={!q.creators.length || pending} className="crm-btn crm-btn-primary crm-btn-sm disabled:opacity-40">{pending ? "Saving…" : sheets?.ext ? "Save & update Google Sheets" : "Save & make Google Sheets"}</button>
            {sheets?.ext && <a href={`https://docs.google.com/spreadsheets/d/${sheets.ext}/edit`} target="_blank" rel="noreferrer" className="crm-link text-[0.8125rem]">External sheet <ExternalLink className="inline size-3.5" aria-hidden /></a>}
            {sheets?.int && <a href={`https://docs.google.com/spreadsheets/d/${sheets.int}/edit`} target="_blank" rel="noreferrer" className="crm-link text-[0.8125rem]">Internal sheet <ExternalLink className="inline size-3.5" aria-hidden /></a>}
            {state?.message && <span className={`text-[0.8125rem] ${state.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} role={state.ok ? "status" : "alert"}>{state.message}</span>}
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the influencer database: name, @handle, niche, city" className="crm-input" />
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setLinkError(null);
              }}
              placeholder="…or paste a profile link: instagram.com/handle, youtube.com/@channel"
              className="crm-input min-w-[16rem] flex-1"
            />
            <button
              type="button"
              className="crm-btn crm-btn-secondary crm-btn-sm"
              onClick={() => {
                const added = link
                  .split(/[\s,]+/)
                  .filter(Boolean)
                  .map(fromLink)
                  .filter((c): c is BuilderCreator => c !== null)
                  .filter((c) => !q.creators.some((x) => x.handle.toLowerCase() === c.handle.toLowerCase() && x.platform === c.platform));
                if (added.length === 0) return setLinkError("That doesn't look like a profile link.");
                setQ((x) => ({ ...x, creators: [...x.creators, ...added] }));
                setLink("");
              }}
            >
              <Plus className="size-4" /> Add by link
            </button>
            {linkError && <span className="text-[0.8125rem] text-[#dc2626]">{linkError}</span>}
          </div>
          <p className="text-[0.75rem] text-faint">Several links at once work too. New creators are added to the influencer database when you save.</p>
          {search && (
            <ul className="divide-y divide-[var(--glass-border)]">
              {matches.length === 0 && <li className="py-2 text-ash">No match.</li>}
              {matches.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 truncate"><span className="text-bone">{c.name}</span> <span className="text-[0.8125rem] text-ash">@{c.handle} · {c.platform.toLowerCase()} · {compact(c.followers)} · {c.niches.join(", ")} {c.city ? `· ${c.city}` : ""}</span></span>
                  <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setQ((x) => ({ ...x, creators: [...x.creators, { creatorId: c.id, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, deliverables: "1 IG Reel + Story & link in bio", fee: null, reelCost: c.reel, storyCost: c.story, dlCost: c.dl, reelPrice: c.reel === null ? null : Math.round(c.reel * (1 + (x.markupPercent ?? 30) / 100)), storyPrice: c.story === null ? null : Math.round(c.story * (1 + (x.markupPercent ?? 30) / 100)), dlPrice: c.dl === null ? null : Math.round(c.dl * (1 + (x.markupPercent ?? 30) / 100)), contact: c.contact }] }))}>Add</button>
                </li>
              ))}
            </ul>
          )}
          {q.creators.length > 0 && (
            <>
              {/* MARKUP: the client's price is the creator's cost plus this, rounded (Genesis's plans: cost → price → profit). */}
              <div className="flex flex-wrap items-center gap-2 text-[0.875rem] text-ash">
                <span>Client price = creator cost +</span>
                <input type="number" step="any" min={0} value={q.markupPercent ?? 30} onChange={(e) => set("markupPercent", Number(e.target.value) || 0)} className="crm-input !min-h-8 !w-20" />
                <span>%</span>
                <button
                  type="button"
                  className="crm-btn crm-btn-secondary crm-btn-sm"
                  onClick={() => {
                    const m = 1 + (q.markupPercent ?? 30) / 100;
                    const up = (v?: number | null) => (typeof v === "number" ? Math.round(v * m) : v);
                    setQ((x) => ({ ...x, creators: x.creators.map((c) => ({ ...c, reelPrice: up(c.reelCost), storyPrice: up(c.storyCost), dlPrice: up(c.dlCost) })) }));
                  }}
                >
                  Apply to every price
                </button>
                <button type="button" aria-expanded={showColumns} onClick={() => setShowColumns((s) => !s)} className="crm-btn crm-btn-secondary crm-btn-sm"><Columns3 className="size-4" aria-hidden /> Add / remove columns</button>
                <span className="ml-auto flex items-center gap-2">Budget line <input value={q.planBudget ?? ""} onChange={(e) => set("planBudget", e.target.value)} className="crm-input !min-h-8 !w-44" placeholder="As per Brand" /></span>
              </div>
              {/* ADD AND REMOVE COLUMNS (Genesis, 13 Oct 2026). Removed ones leave the client view and both sheets; added ones appear in all three. */}
              {showColumns && (
                <div className="space-y-2 rounded-xl border border-[var(--glass-border)] p-3">
                  <p className="text-[0.8125rem] text-ash">Tap a column to remove it (tap again to bring it back). Removed columns are left out of the client view and both sheets.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLAN_COLUMNS.map(([key, label]) => (
                      <button key={key} type="button" aria-pressed={shows(key)} onClick={() => toggleColumn(key)} className={`rounded-full border px-2.5 py-1 text-[0.75rem] ${shows(key) ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-faint line-through"}`}>{label}</button>
                    ))}
                    {custom.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1 rounded-full border border-[#ffc516] px-2.5 py-1 text-[0.75rem] text-bone">
                        {name}
                        <button type="button" aria-label={`Remove the ${name} column`} onClick={() => removeColumn(name)} className="text-ash hover:text-[#dc2626]"><X className="size-3.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addColumn();
                        }
                      }}
                      placeholder="New column: Language, Gender, Go-live date…"
                      className="crm-input !min-h-8 max-w-xs"
                    />
                    <button type="button" onClick={addColumn} className="crm-btn crm-btn-secondary crm-btn-sm"><Plus className="size-4" /> Add column</button>
                  </div>
                </div>
              )}
              {/* THE PLAN AS GENESIS'S SHEET (Genesis, 12 Oct 2026: "fields are still missing"); scrolls sideways, the name stays put. */}
              <div className="-mx-1 overflow-x-auto pb-2">
                <table className="crm-table !min-w-max text-[0.8125rem] [&_td]:!px-1.5 [&_th]:!px-1.5 [&_th]:whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-[var(--surface-panel)]">Name</th>
                      {shows("tier") && <th>Tier</th>}
                      {shows("category") && <th>Category</th>}
                      {shows("ig") && <th>IG link</th>}
                      {shows("followers") && <th>Followers</th>}
                      {shows("avgViews") && <th>Avg views</th>}
                      {shows("er") && <th>ER %</th>}
                      {shows("location") && <th>Location</th>}
                      {shows("reachout") && <th>Reach-out</th>}
                      {MONEY.filter(shows).map((k) => <th key={k} className={k.endsWith("Cost") ? "bg-[var(--hover-wash)]" : ""}>{MONEY_LABEL[k]}</th>)}
                      {shows("profit") && <th>Profit</th>}
                      {shows("contact") && <th>Contact</th>}
                      {shows("remarks") && <th>Remarks</th>}
                      {custom.map((name) => <th key={name}>{name}</th>)}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {q.creators.map((c, i) => {
                      const profit = creatorTotal(c) - creatorCost(c);
                      return (
                        <tr key={`${c.handle}-${i}`}>
                          <td className="sticky left-0 z-10 min-w-[11rem] bg-[var(--surface-panel)] text-bone">{c.name}<span className="block text-[0.75rem] text-ash">@{c.handle}</span></td>
                          {shows("tier") && <td className="whitespace-nowrap">{c.followers < 10_000 ? "Nano" : c.followers < 100_000 ? "Micro" : c.followers < 500_000 ? "Mid" : c.followers < 1_000_000 ? "Macro" : "Mega"}</td>}
                          {shows("category") && <td><input value={c.niches.join(", ")} onChange={(e) => setCreator(i, { niches: e.target.value.split(",").map((n) => n.trim()).filter(Boolean) })} className="crm-input !min-h-8 !w-40 !px-2" /></td>}
                          {shows("ig") && <td>{c.profileUrl ? <a href={c.profileUrl} target="_blank" rel="noreferrer" className="crm-link">Profile ↗</a> : "—"}</td>}
                          {shows("followers") && <td className="tabular-nums whitespace-nowrap">{compact(c.followers)}</td>}
                          {shows("avgViews") && <td><input type="number" step="any" min={0} value={c.avgViews ?? ""} onChange={(e) => setCreator(i, { avgViews: e.target.value === "" ? null : Number(e.target.value) })} className="crm-input !min-h-8 !w-24 !px-2" /></td>}
                          {shows("er") && <td><input type="number" step="any" min={0} value={c.er ?? ""} onChange={(e) => setCreator(i, { er: e.target.value === "" ? null : Number(e.target.value) })} className="crm-input !min-h-8 !w-16 !px-2" /></td>}
                          {shows("location") && <td><input value={c.city ?? ""} onChange={(e) => setCreator(i, { city: e.target.value })} className="crm-input !min-h-8 !w-32 !px-2" /></td>}
                          {shows("reachout") && <td><select value={c.reachout ?? ""} onChange={(e) => setCreator(i, { reachout: e.target.value || null })} className="crm-input !min-h-8 !w-36 !px-2">{REACHOUT.map((r) => <option key={r} value={r}>{r || "—"}</option>)}</select></td>}
                          {MONEY.filter(shows).map((k) => (
                            <td key={k} className={k.endsWith("Cost") ? "bg-[var(--hover-wash)]" : ""}><input type="number" step="any" min={0} value={c[k] ?? ""} onChange={(e) => setCreator(i, { [k]: e.target.value === "" ? null : Number(e.target.value) } as Partial<BuilderCreator>)} className="crm-input !min-h-8 !w-28 !px-2 text-right" placeholder="₹" /></td>
                          ))}
                          {shows("profit") && <td className={`whitespace-nowrap tabular-nums ${profit < 0 ? "text-[#dc2626]" : "text-bone"}`}>{inr(profit)}</td>}
                          {shows("contact") && <td><input value={c.contact ?? ""} onChange={(e) => setCreator(i, { contact: e.target.value })} className="crm-input !min-h-8 !w-44 !px-2" placeholder="+91… / email / agency" /></td>}
                          {shows("remarks") && <td><input value={c.remarks ?? ""} onChange={(e) => setCreator(i, { remarks: e.target.value })} className="crm-input !min-h-8 !w-48 !px-2" /></td>}
                          {custom.map((name) => (
                            <td key={name}><input value={c.extra?.[name] ?? ""} onChange={(e) => setCreator(i, { extra: { ...(c.extra ?? {}), [name]: e.target.value } })} className="crm-input !min-h-8 !w-40 !px-2" /></td>
                          ))}
                          <td><button type="button" aria-label="Remove creator" onClick={() => setQ((x) => ({ ...x, creators: x.creators.filter((_, j) => j !== i) }))} className="text-ash hover:text-[#dc2626]"><X className="size-4" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="text-bone">
                      <td className="sticky left-0 z-10 bg-[var(--surface-panel)]">{q.creators.length} creators</td>
                      {["tier", "category", "ig", "followers", "avgViews", "er", "location", "reachout"].filter(shows).map((k) => <td key={k} />)}
                      {MONEY.filter(shows).map((k) => <td key={k} className="whitespace-nowrap tabular-nums">{inr(sum(k))}</td>)}
                      {shows("profit") && <td className="whitespace-nowrap tabular-nums">{inr(totals.creators - costTotal)}</td>}
                      {shows("contact") && <td />}
                      {shows("remarks") && <td />}
                      {custom.map((name) => <td key={name} />)}
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      <section className={`space-y-3 ${parts.pricing ? "" : "hidden"}`}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[1.125rem] text-bone">Costing: products & services</h2>
          <div className="flex flex-wrap gap-2">
            <select value={pick} onChange={(e) => addFromCatalog(e.target.value)} className="crm-input w-auto max-w-[22rem]" aria-label="Add from plans, products and add-ons">
              <option value="">＋ Plans, products & add-ons…</option>
              {groups.map(([g, items]) => (
                <optgroup key={g} label={g}>
                  {items.map((c) => <option key={c.id} value={c.id}>{c.title} · {inr(c.price)}</option>)}
                </optgroup>
              ))}
            </select>
            <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setQ((x) => ({ ...x, lines: [...x.lines, { kind: "custom", title: "", qty: 1, unit: 0, division: x.division ?? null }] }))}>
              <Plus className="size-4" /> Custom line
            </button>
          </div>
        </div>
        {q.lines.length === 0 && <p className="rounded-xl border border-dashed border-[var(--glass-border)] px-4 py-6 text-center text-ash">Add a plan, a product or a custom line.</p>}
        {q.lines.map((l, i) => (
          <div key={i} className="crm-card crm-pad space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_6rem_9rem_9rem_auto] sm:items-end">
              <label><span className="crm-label">{l.kind === "custom" ? "Custom line" : l.kind === "addon" ? "Add-on" : l.kind === "plan" ? "Plan" : "Product"}</span><input value={l.title} onChange={(e) => setLine(i, { title: e.target.value })} className="crm-input font-medium" placeholder="Premium UGC Content Production | 10 Videos" /></label>
              <label><span className="crm-label">Qty</span><input type="number" step="any" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, Number(e.target.value) || 1) })} className="crm-input" /></label>
              <label><span className="crm-label">Price (₹)</span><input type="number" step="any" min={0} value={l.unit} onChange={(e) => setLine(i, { unit: Number(e.target.value) || 0 })} className="crm-input" /></label>
              <p className="pb-2.5 text-right tabular-nums text-bone"><span className="crm-label">Line total</span>{inr(l.qty * l.unit)}</p>
              <span className="flex gap-1 pb-2">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="text-ash hover:text-bone"><ArrowUp className="size-4" /></button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="text-ash hover:text-bone"><ArrowDown className="size-4" /></button>
                <button type="button" aria-label="Remove line" onClick={() => setQ((x) => ({ ...x, lines: x.lines.filter((_, j) => j !== i) }))} className="text-ash hover:text-[#dc2626]"><Trash2 className="size-4" /></button>
              </span>
            </div>
            <label className="block"><span className="crm-label">Subtitle</span><input value={l.subtitle ?? ""} onChange={(e) => setLine(i, { subtitle: e.target.value })} className="crm-input" placeholder="Professional UGC Production Shoot" /></label>
            <div className="grid gap-3 md:grid-cols-2">
              <label><span className="crm-label">What&apos;s included (one bullet per line)</span><textarea value={l.details ?? ""} onChange={(e) => setLine(i, { details: e.target.value })} className="crm-input !min-h-28" /></label>
              <label><span className="crm-label">Small print under it</span><textarea value={l.note ?? ""} onChange={(e) => setLine(i, { note: e.target.value })} className="crm-input !min-h-28" placeholder="Shoot location and schedule to be mutually finalised." /></label>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="crm-card crm-pad space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-[1.125rem] text-bone">Notes & legal terms</h2>
            <select defaultValue="" onChange={(e) => e.target.value && loadTerms(e.target.value)} className="crm-input w-auto" aria-label="Load a terms template">
              <option value="">Load a template…</option>
              {terms.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <label className="block"><span className="crm-label">Notes</span><textarea value={q.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="crm-input !min-h-32" /></label>
          <label className="block"><span className="crm-label">Legal terms (one per line)</span><textarea value={q.terms ?? ""} onChange={(e) => set("terms", e.target.value)} className="crm-input !min-h-56" /></label>
        </section>
        <section className="crm-card crm-pad space-y-3 self-start">
          <h2 className="text-[1.125rem] text-bone">Totals</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[0.9375rem]">
            <dt className="text-ash">Subtotal</dt><dd className="tabular-nums">{inr(totals.subtotal)}</dd>
            <dt className="text-ash"><label className="flex items-center gap-2">Discount (₹)</label></dt>
            <dd><input type="number" step="any" min={0} value={q.discount} onChange={(e) => set("discount", Number(e.target.value) || 0)} className="crm-input !min-h-8 w-32 text-right" /></dd>
            <dt className="text-ash"><label className="flex items-center gap-2"><input type="checkbox" checked={q.addGst} onChange={(e) => set("addGst", e.target.checked)} /> Add GST at <input type="number" step="any" min={0} max={28} value={q.gstPercent} onChange={(e) => set("gstPercent", Number(e.target.value) || 0)} className="crm-input !min-h-8 w-16" />%</label></dt>
            <dd className="tabular-nums">{inr(totals.tax)}</dd>
            {q.addGst && (
              <>
                <dt className="col-span-2 -mt-1"><label className="flex items-center gap-2 text-[0.8125rem] text-ash"><input type="checkbox" checked={Boolean(q.igst)} onChange={(e) => set("igst", e.target.checked)} /> Client outside Maharashtra (IGST)</label></dt>
                {q.igst ? (
                  <><dt className="pl-6 text-[0.875rem] text-ash">IGST {q.gstPercent}%</dt><dd className="text-[0.875rem] tabular-nums">{inr(totals.tax)}</dd></>
                ) : (
                  <>
                    <dt className="pl-6 text-[0.875rem] text-ash">CGST {q.gstPercent / 2}%</dt><dd className="text-[0.875rem] tabular-nums">{inr(Math.round(totals.tax * 50) / 100)}</dd>
                    <dt className="pl-6 text-[0.875rem] text-ash">SGST {q.gstPercent / 2}%</dt><dd className="text-[0.875rem] tabular-nums">{inr(totals.tax - Math.round(totals.tax * 50) / 100)}</dd>
                  </>
                )}
              </>
            )}
            <dt className="border-t border-[var(--glass-border)] pt-2 font-semibold text-bone">Total price</dt>
            <dd className="border-t border-[var(--glass-border)] pt-2 text-[1.25rem] font-semibold tabular-nums text-bone">{inr(totals.total)}</dd>
          </dl>
          <p className="text-[0.75rem] text-faint">The sample quote states prices exclusive of GST; untick to show the total without it.</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="crm-btn crm-btn-primary" disabled={pending}>{pending ? "Saving…" : q.id ? "Save changes" : "Save draft"}</button>
            {state?.message && <span className={`text-[0.8125rem] ${state.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} role={state.ok ? "status" : "alert"}>{state.message}</span>}
          </div>
          <p className="text-[0.75rem] text-faint">A draft saves with anything missing; the client&apos;s email is needed only to send.</p>
        </section>
      </div>
    </form>
  );
}
