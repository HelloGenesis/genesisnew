"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { saveQuote } from "@/app/(crm)/admin/actions/quotes";

export type BuilderLine = { kind: string; productId?: string | null; division?: string | null; title: string; subtitle?: string | null; details?: string | null; note?: string | null; qty: number; unit: number };
export type BuilderCreator = { creatorId?: string | null; name: string; handle: string; platform: string; profileUrl?: string | null; followers: number; avgViews?: number | null; niches: string[]; city?: string | null; deliverables?: string | null; fee?: number | null };
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
  discount: number;
  lines: BuilderLine[];
  creators: BuilderCreator[];
};
type CatalogItem = { id: string; kind: string; group: string; division: string; title: string; subtitle?: string; details: string; note?: string; price: number };
type PoolCreator = { id: string; name: string; handle: string; platform: string; profileUrl: string | null; followers: number; avgViews: number | null; niches: string[]; city: string | null; reel: number | null };
type Terms = { key: string; label: string; notes: string; terms: string[] };

const DIVISIONS: [string, string][] = [["AI_LAB", "AI Lab"], ["STUDIOS", "Studios"], ["BRAND_DESIGN", "Brand & Design"], ["INFLUENCE", "Influence"]];
const inr = (r: number) => `₹${r.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n);

/**
 * THE QUOTE BUILDER — Genesis's Price Quote, assembled on screen: the
 * standard catalogue (plans, products, their add-ons) or custom lines, an
 * influencer plan's creator list from the database, notes and terms from a
 * template, and live totals. Saves as a draft; sending is a separate step.
 */
export function QuoteBuilder({ initial, catalog, terms, pool }: { initial: BuilderQuote; catalog: CatalogItem[]; terms: Terms[]; pool: PoolCreator[] }) {
  const [q, setQ] = useState<BuilderQuote>(initial);
  const [pick, setPick] = useState("");
  const [search, setSearch] = useState("");
  const [state, action, pending] = useActionState(saveQuote, null);
  const set = <K extends keyof BuilderQuote>(k: K, v: BuilderQuote[K]) => setQ((x) => ({ ...x, [k]: v }));
  const setLine = (i: number, patch: Partial<BuilderLine>) => setQ((x) => ({ ...x, lines: x.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const setCreator = (i: number, patch: Partial<BuilderCreator>) => setQ((x) => ({ ...x, creators: x.creators.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const move = (i: number, d: number) =>
    setQ((x) => {
      const lines = [...x.lines];
      const j = i + d;
      if (j < 0 || j >= lines.length) return x;
      [lines[i], lines[j]] = [lines[j]!, lines[i]!];
      return { ...x, lines };
    });

  const totals = useMemo(() => {
    const lines = q.lines.reduce((s, l) => s + l.qty * l.unit, 0);
    const creators = q.creators.reduce((s, c) => s + (c.fee ?? 0), 0);
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

  const plan = q.kind === "INFLUENCER_PLAN";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(q)} />

      <section className="crm-card crm-pad space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["QUOTE", "INFLUENCER_PLAN"] as const).map((k) => (
            <button key={k} type="button" onClick={() => set("kind", k)} aria-current={q.kind === k ? "page" : undefined} className="crm-nav-link !min-h-9">
              {k === "QUOTE" ? "Price quote" : "Influencer plan (with creator list)"}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <label><span className="crm-label">Title (as on the quote)</span><input value={q.title} onChange={(e) => set("title", e.target.value)} required className="crm-input" placeholder="Primezen + Sensinova — Premium UGC Product Content" /></label>
          <label><span className="crm-label">Division</span>
            <select value={q.division ?? ""} onChange={(e) => set("division", e.target.value || null)} className="crm-input"><option value="">—</option>{DIVISIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <label><span className="crm-label">Valid until</span><input type="date" value={q.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className="crm-input" /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className="crm-label">Client / brand</span><input value={q.company ?? ""} onChange={(e) => set("company", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">Contact name *</span><input value={q.contactName} onChange={(e) => set("contactName", e.target.value)} required className="crm-input" /></label>
          <label><span className="crm-label">Email *</span><input type="email" value={q.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} required className="crm-input" /></label>
          <label><span className="crm-label">Phone</span><input value={q.contactPhone ?? ""} onChange={(e) => set("contactPhone", e.target.value)} className="crm-input" /></label>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[1.125rem] text-bone">Product or service</h2>
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
              <label><span className="crm-label">{l.kind === "custom" ? "Custom line" : l.kind === "addon" ? "Add-on" : l.kind === "plan" ? "Plan" : "Product"}</span><input value={l.title} onChange={(e) => setLine(i, { title: e.target.value })} required className="crm-input font-medium" placeholder="Premium UGC Content Production | 10 Videos" /></label>
              <label><span className="crm-label">Qty</span><input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, Number(e.target.value) || 1) })} className="crm-input" /></label>
              <label><span className="crm-label">Price (₹)</span><input type="number" min={0} step="0.01" value={l.unit} onChange={(e) => setLine(i, { unit: Number(e.target.value) || 0 })} className="crm-input" /></label>
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

      <section className={`space-y-3 ${plan ? "" : "opacity-90"}`}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[1.125rem] text-bone">Creators {plan ? "on this plan" : "(optional)"}</h2>
          <span className="text-[0.8125rem] text-ash">{q.creators.length} creators · {inr(totals.creators)} fees</span>
        </div>
        <div className="crm-card crm-pad space-y-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the influencer database: name, @handle, niche, city" className="crm-input" />
          {search && (
            <ul className="divide-y divide-[var(--glass-border)]">
              {matches.length === 0 && <li className="py-2 text-ash">No match.</li>}
              {matches.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 truncate"><span className="text-bone">{c.name}</span> <span className="text-[0.8125rem] text-ash">@{c.handle} · {c.platform.toLowerCase()} · {compact(c.followers)} · {c.niches.join(", ")} {c.city ? `· ${c.city}` : ""}</span></span>
                  <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setQ((x) => ({ ...x, creators: [...x.creators, { creatorId: c.id, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, deliverables: "1 reel + 2 stories", fee: c.reel }] }))}>Add</button>
                </li>
              ))}
            </ul>
          )}
          {q.creators.length > 0 && (
            <div className="overflow-x-auto">
              <table className="crm-table !min-w-[640px]">
                <thead><tr><th>Creator</th><th>Followers</th><th>Deliverables</th><th>Fee (₹)</th><th /></tr></thead>
                <tbody>
                  {q.creators.map((c, i) => (
                    <tr key={`${c.handle}-${i}`}>
                      <td className="text-bone">{c.name}<span className="block text-[0.75rem] text-ash">@{c.handle} · {c.platform.toLowerCase()}</span></td>
                      <td className="tabular-nums">{compact(c.followers)}</td>
                      <td><input value={c.deliverables ?? ""} onChange={(e) => setCreator(i, { deliverables: e.target.value })} className="crm-input !min-h-9" /></td>
                      <td><input type="number" min={0} value={c.fee ?? ""} onChange={(e) => setCreator(i, { fee: e.target.value === "" ? null : Number(e.target.value) })} className="crm-input !min-h-9 w-28" /></td>
                      <td><button type="button" aria-label="Remove creator" onClick={() => setQ((x) => ({ ...x, creators: x.creators.filter((_, j) => j !== i) }))} className="text-ash hover:text-[#dc2626]"><X className="size-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
            <dd><input type="number" min={0} value={q.discount} onChange={(e) => set("discount", Number(e.target.value) || 0)} className="crm-input !min-h-8 w-32 text-right" /></dd>
            <dt className="text-ash"><label className="flex items-center gap-2"><input type="checkbox" checked={q.addGst} onChange={(e) => set("addGst", e.target.checked)} /> Add GST at <input type="number" min={0} max={28} value={q.gstPercent} onChange={(e) => set("gstPercent", Number(e.target.value) || 0)} className="crm-input !min-h-8 w-16" />%</label></dt>
            <dd className="tabular-nums">{inr(totals.tax)}</dd>
            <dt className="border-t border-[var(--glass-border)] pt-2 font-semibold text-bone">Total price</dt>
            <dd className="border-t border-[var(--glass-border)] pt-2 text-[1.25rem] font-semibold tabular-nums text-bone">{inr(totals.total)}</dd>
          </dl>
          <p className="text-[0.75rem] text-faint">The sample quote states prices exclusive of GST; untick to show the total without it.</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="crm-btn crm-btn-primary" disabled={pending}>{pending ? "Saving…" : q.id ? "Save changes" : "Save draft"}</button>
            {state?.message && <span className={`text-[0.8125rem] ${state.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} role={state.ok ? "status" : "alert"}>{state.message}</span>}
          </div>
        </section>
      </div>
    </form>
  );
}
