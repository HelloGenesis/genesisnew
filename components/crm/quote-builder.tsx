"use client";

import { ArrowDown, ArrowUp, ChevronDown, Columns3, ExternalLink, FileSpreadsheet, Maximize2, Minimize2, Plus, Sheet, Trash2, Upload, X } from "lucide-react";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";

import { importCreatorsForPlan, matchUploadColumns } from "@/app/(crm)/admin/actions/imports";
import { quoteVersion, saveQuote } from "@/app/(crm)/admin/actions/quotes";
import { readSheetFile } from "@/lib/sheet-file";
import { PLAN_COLUMNS } from "@/lib/crm/plan-tables";

import { planTargets, TARGET_LABEL } from "@/lib/crm/plan-import";
import { proposalOrder, SECTION } from "@/lib/crm/proposal-order";
import { isRecent, type LastReach, reachLine, reachOptions } from "@/lib/crm/reachout-status";

import { GrowText } from "./grow-text";
import { NichePicker } from "./niche-picker";
import { RichText } from "./rich-text";

export type BuilderLine = { kind: string; productId?: string | null; division?: string | null; title: string; subtitle?: string | null; details?: string | null; note?: string | null; qty: number; unit: number };
export type BuilderCreator = {
  creatorId?: string | null; name: string; handle: string; platform: string; profileUrl?: string | null; followers: number; avgViews?: number | null; niches: string[]; city?: string | null; deliverables?: string | null; fee?: number | null;
  /* The plan's columns: the creator's cost to us and the client's price, per deliverable (Genesis, 12 Oct 2026). */
  er?: number | null; reelCost?: number | null; storyCost?: number | null; dlCost?: number | null; reelPrice?: number | null; storyPrice?: number | null; dlPrice?: number | null;
  reachout?: string | null; contact?: string | null; remarks?: string | null;
  /* Values of the columns added in the builder, by column name. */
  extra?: Record<string, string>;
  /* The creator's latest reach-out from any plan (shown, not saved; lib/crm/reachout). */
  last?: LastReach | null;
};
export type ProposalSection = { title: string; html: string };
export type PlanColumnsState = { hidden?: string[]; custom?: string[]; share?: "table" | "sheet" | "both"; extPrices?: boolean; feesInTotal?: boolean; sheetUrl?: string; boxes?: string[]; intOnly?: string[]; order?: string[] };
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
  parts?: ("proposal" | "plan" | "pricing")[];
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
const CONTENT_IDEAS = "Content ideas";
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
const BOX_LABELS: Record<string, string> = { tg: "TG (target group)", problems: "Problems we'll solve", objectives: "Objectives", influencers: "Influencer/Talent", ideas: "Content ideas" };

/* `contactHidden`: someone else's client: their contact name, email and phone stay private (lib/crm/scope seesQuoteContact). */
export function QuoteBuilder({ initial, catalog, terms, pool, clients = [], sheets, version, contactHidden = false }: { initial: BuilderQuote; catalog: CatalogItem[]; terms: Terms[]; pool: PoolCreator[]; clients?: Client[]; sheets?: { ext: string | null; int: string | null }; version?: string; contactHidden?: boolean }) {
  const [q, setQ] = useState<BuilderQuote>({ ...initial, proposalSections: initial.proposalSections ?? [], planColumns: initial.planColumns ?? {} });
  const [pick, setPick] = useState("");
  const [search, setSearch] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showColumns, setShowColumns] = useState(false);
  const [newColumn, setNewColumn] = useState("");
  const [download, setDownload] = useState<string | null>(null);
  const exportMenu = useRef<HTMLDetailsElement>(null);
  const closeExport = () => exportMenu.current?.removeAttribute("open");
  useEffect(() => {
    const close = (e: MouseEvent) => exportMenu.current?.open && !exportMenu.current.contains(e.target as Node) && closeExport();
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  /* IMPORT AN EXCEL OF INFLUENCERS INTO THE PLAN (Genesis, 13 Oct 2026); they're saved to the influencer database too. */
  const importPicker = useRef<HTMLInputElement>(null);
  /* `targets`: where each column of the file goes on the plan (lib/crm/plan-import), shown and changeable before adding. */
  const [sheet, setSheet] = useState<{ name: string; headers: string[]; rows: string[][]; mapping: Record<string, string>; targets: Record<string, string> } | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  async function readImport(file: File | undefined) {
    if (!file) return;
    setImportNote("Reading the file…");
    setSheet(null);
    try {
      const tabs = await readSheetFile(file);
      const tab = tabs.find((t) => t.rows.some((r) => r.filter((c) => c.trim()).length >= 2));
      if (!tab) throw new Error("The file looks empty.");
      const at = tab.rows.findIndex((r) => r.filter((c) => c.trim()).length >= 2);
      const headers = tab.rows[at]!.map((h) => h.trim());
      const rows = tab.rows.slice(at + 1).filter((r) => r.some((c) => c.trim()));
      setImportNote("Matching the columns…");
      const mapping = await matchUploadColumns("influencers", headers, rows.slice(0, 5));
      const targets = planTargets(headers, mapping);
      const placed = Object.values(targets);
      if (!placed.includes("name") && !placed.includes("handle") && !placed.includes("profileUrl")) throw new Error("Couldn't find a name, handle or profile-link column. Check the first row has headings.");
      setSheet({ name: file.name, headers, rows, mapping, targets });
      setImportNote(null);
    } catch (e) {
      setImportNote((e as Error).message);
    }
  }
  async function runImport() {
    if (!sheet) return;
    const m = 1 + (q.markupPercent ?? 30) / 100;
    const up = (v: number | null) => (v === null ? null : Math.round(v * m));
    let added = 0;
    let updated = 0;
    const found: BuilderCreator[] = [];
    try {
      for (let i = 0; i < sheet.rows.length; i += 250) {
        setImportNote(`Saving ${Math.min(i + 250, sheet.rows.length)} of ${sheet.rows.length} to the influencer database…`);
        const result = await importCreatorsForPlan(sheet.name, sheet.headers, sheet.rows.slice(i, i + 250), sheet.mapping, sheet.targets);
        added += result.added;
        updated += result.updated;
        /* The file's own values, column for column; prices from the file, else cost + the markup. */
        for (const c of result.rows)
          found.push({
            creatorId: c.creatorId, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers ?? 0, avgViews: c.avgViews, niches: c.niches ?? [], city: c.city, er: c.er,
            deliverables: "1 IG Reel + Story & link in bio", fee: null,
            reelCost: c.reelCost, storyCost: c.storyCost, dlCost: c.dlCost,
            reelPrice: c.reelPrice ?? up(c.reelCost), storyPrice: c.storyPrice ?? up(c.storyCost), dlPrice: c.dlPrice ?? up(c.dlCost),
            reachout: c.reachout, contact: c.contact, remarks: c.remarks, extra: c.extra,
          });
      }
      const newCols = [...new Set(Object.values(sheet.targets).filter((t) => t.startsWith("col:")).map((t) => t.slice(4)))];
      let refreshed = 0;
      setQ((x) => {
        const same = (a: BuilderCreator, b: BuilderCreator) => (a.creatorId && a.creatorId === b.creatorId) || (a.handle && a.handle.toLowerCase() === b.handle.toLowerCase() && a.platform === b.platform);
        /* Already on the plan: the file's values replace what's there (blanks in the file leave it). */
        const creators = x.creators.map((c) => {
          const f = found.find((n) => same(c, n));
          if (!f) return c;
          refreshed += 1;
          const keep = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)));
          return { ...c, ...keep, extra: { ...(c.extra ?? {}), ...(f.extra ?? {}) } } as BuilderCreator;
        });
        const fresh = found.filter((n, i) => !x.creators.some((c) => same(c, n)) && found.findIndex((o) => same(o, n)) === i);
        const custom = [...new Set([...(x.planColumns?.custom ?? []), ...newCols])];
        return { ...x, creators: [...creators, ...fresh], planColumns: { ...(x.planColumns ?? {}), custom } };
      });
      setSheet(null);
      setImportNote(`Done: ${found.length} creators from the sheet (${added} new to the database, ${updated} updated)${refreshed ? `; ${refreshed} already on the plan were updated from the file` : ""}. Press Save to keep it.`);
    } catch (e) {
      setImportNote(`Stopped: ${(e as Error).message.slice(0, 160)}. Try again; creators already saved aren't duplicated.`);
    }
  }
  /*
   * SAVED WHEN YOU PRESS SAVE (Genesis, 14 Oct 2026: "remove the auto save
   * option and keep it manual; once it is saved it's visible to the others").
   * Nothing is written while you type; Save draft / Save changes writes it for
   * everyone, and leaving the page with unsaved changes asks first.
   */
  const snapshot = (x: BuilderQuote) => JSON.stringify({ ...x, id: undefined });
  const idRef = useRef<string | undefined>(initial.id);
  const [lastSaved, setLastSaved] = useState(() => snapshot({ ...initial, proposalSections: initial.proposalSections ?? [], planColumns: initial.planColumns ?? {} }));
  const unsavedRef = useRef(false);
  const forceRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [ver, setVer] = useState<string | undefined>(version);
  const [force, setForce] = useState(false);
  const versionRef = useRef<string | undefined>(version);
  useEffect(() => {
    versionRef.current = ver;
  }, [ver]);
  const [conflict, setConflict] = useState<string | null>(null);
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof saveQuote>>, form: FormData) => {
    const sent = String(form.get("payload") ?? "{}");
    if (forceRef.current) form.set("payload", JSON.stringify({ ...JSON.parse(sent), force: true }));
    const result = await saveQuote(prev, form);
    if (result?.ok) {
      forceRef.current = false;
      setForce(false);
      setConflict(null);
      setLastSaved(snapshot({ ...JSON.parse(sent), version: undefined, force: undefined }));
      if (idRef.current) {
        const v = await quoteVersion(idRef.current).catch(() => null);
        if (v?.version) setVer(v.version);
      }
    }
    return result;
  }, null);
  const qRef = useRef(q);
  useEffect(() => {
    qRef.current = q;
  }, [q]);
  useEffect(() => {
    const check = async () => {
      if (!idRef.current || document.visibilityState !== "visible") return;
      const v = await quoteVersion(idRef.current).catch(() => null);
      if (!v?.by || !versionRef.current || new Date(v.version).getTime() <= new Date(versionRef.current).getTime() + 1000) return;
      const typing = document.activeElement?.matches("input, textarea, select, [contenteditable=true]");
      if (!unsavedRef.current && !typing) return window.location.reload();
      setConflict(`${v.by} saved changes to this quote at ${new Date(v.version).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}, after you opened it.`);
    };
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = window.setInterval(onVisible, 20_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(timer);
    };
  }, []);
  const unsaved = snapshot(q) !== lastSaved;
  useEffect(() => {
    unsavedRef.current = unsaved;
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
  /*
   * THE CLIENT VIEW / PDF SHOWS WHAT'S SAVED (Genesis, 26 Oct 2026: moved
   * sections "not reflecting on the pdf"). Opening it with unsaved changes
   * saves first, then opens it, so it always matches the builder.
   */
  const openAfterSave = useRef<{ win: Window | null; href: string } | null>(null);
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="/quote/"]') as HTMLAnchorElement | null;
      if (!link || !unsavedRef.current || !formRef.current) return;
      e.preventDefault();
      openAfterSave.current = { win: window.open("about:blank", "_blank"), href: link.href };
      formRef.current.requestSubmit();
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, []);
  useEffect(() => {
    const waiting = openAfterSave.current;
    if (pending || !waiting) return;
    openAfterSave.current = null;
    if (!state?.ok) {
      waiting.win?.close();
      return;
    }
    if (waiting.win) waiting.win.location.href = waiting.href;
    else window.open(waiting.href, "_blank");
  }, [pending, state]);
  /* Which parts this document holds (shown in the builder; the send step picks which go). */
  const [parts, setParts] = useState(initial.parts?.length ? { proposal: initial.parts.includes("proposal"), pricing: initial.parts.includes("pricing"), plan: initial.parts.includes("plan") } : {
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
  const setContentIdeas = (html: string) =>
    setQ((x) => {
      const list = x.proposalSections ?? [];
      const at = list.findIndex((s) => s.title === CONTENT_IDEAS);
      return { ...x, proposalSections: at >= 0 ? list.map((s, j) => (j === at ? { ...s, html } : s)) : [{ title: CONTENT_IDEAS, html }, ...list] };
    });
  /*
   * EVERY PROPOSAL BOX MOVES (Genesis, 26 Oct 2026: "this entire section should
   * be movable"): the standard boxes and added sections share one order
   * (lib/crm/proposal-order); the client view and PDF follow it.
   */
  const customAt = (q.proposalSections ?? []).map((sec, i) => (sec.title === CONTENT_IDEAS ? -1 : i)).filter((i) => i >= 0);
  const tokens = proposalOrder(q.planColumns?.order, customAt.length);
  /* The places on screen (a removed standard box takes none). */
  const shownAt = tokens.map((t, pos) => (t !== SECTION && (q.planColumns?.boxes ?? []).includes(t) ? -1 : pos)).filter((pos) => pos >= 0);
  const sectionOf = (pos: number) => customAt[tokens.slice(0, pos).filter((t) => t === SECTION).length]!;
  const moveBox = (pos: number, dir: -1 | 1) => {
    const at = shownAt.indexOf(pos);
    const other = shownAt[at + dir];
    if (other === undefined) return;
    if (tokens[pos] === SECTION && tokens[other] === SECTION) {
      /* Two added sections: swap the sections themselves. */
      const i = sectionOf(pos);
      const j = sectionOf(other);
      setQ((x) => {
        const list = [...(x.proposalSections ?? [])];
        [list[i], list[j]] = [list[j]!, list[i]!];
        return { ...x, proposalSections: list };
      });
      return;
    }
    const next = [...tokens];
    [next[pos], next[other]] = [next[other]!, next[pos]!];
    setQ((x) => ({ ...x, planColumns: { ...(x.planColumns ?? {}), order: next } }));
  };
  const removeSection = (pos: number) => {
    const i = sectionOf(pos);
    const next = tokens.filter((_, k) => k !== pos);
    setQ((x) => ({ ...x, proposalSections: (x.proposalSections ?? []).filter((_, j) => j !== i), planColumns: { ...(x.planColumns ?? {}), order: next } }));
  };
  const arrows = (pos: number, label: string) => (
    <>
      <button type="button" aria-label={`Move ${label} up`} title="Move up" disabled={pos === shownAt[0]} onClick={() => moveBox(pos, -1)} className="grid size-8 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone disabled:opacity-30"><ArrowUp className="size-4" /></button>
      <button type="button" aria-label={`Move ${label} down`} title="Move down" disabled={pos === shownAt.at(-1)} onClick={() => moveBox(pos, 1)} className="grid size-8 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone disabled:opacity-30"><ArrowDown className="size-4" /></button>
    </>
  );

  const hidden = new Set(q.planColumns?.hidden ?? []);
  const custom = q.planColumns?.custom ?? [];
  /* Added columns kept internal: on the internal sheet only, not the external sheet or the client view (Genesis, 26 Oct 2026). */
  const intOnly = new Set(q.planColumns?.intOnly ?? []);
  const toggleIntOnly = (name: string) =>
    setQ((x) => {
      const now = x.planColumns?.intOnly ?? [];
      return { ...x, planColumns: { ...x.planColumns, intOnly: now.includes(name) ? now.filter((c) => c !== name) : [...now, name] } };
    });
  /*
   * INTERNAL OR EXTERNAL (Genesis, 13 Oct 2026: "give an option: what are you
   * editing, internal or external"). External shows the plan as the brand
   * gets it: no creator costs, profit, reach-out, contact or remarks (and no
   * prices on a sample). Internal shows everything.
   */
  const [editing, setEditing] = useState<"internal" | "external">("internal");
  /* THE PLAN FULL SCREEN (Genesis, 27 Oct 2026: "a full-screen view of this … more clearly visible, across all devices"): the same table, the whole window, Esc to leave. */
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = was;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);
  /* The added columns on screen: all of them internally, the client's ones when editing external. */
  const customShown = custom.filter((name) => editing === "internal" || !intOnly.has(name));
  const INTERNAL_ONLY = ["reachout", "reelCost", "storyCost", "dlCost", "profit", "contact", "remarks"];
  const shows = (key: string) =>
    !hidden.has(key) && (editing === "internal" || (!INTERNAL_ONLY.includes(key) && (q.planColumns?.extPrices !== false || !["reelPrice", "storyPrice", "dlPrice"].includes(key))));
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
    setQ((x) => ({ ...x, planColumns: { ...x.planColumns, custom: (x.planColumns?.custom ?? []).filter((c) => c !== name), intOnly: (x.planColumns?.intOnly ?? []).filter((c) => c !== name) }, creators: x.creators.map((c) => ({ ...c, extra: Object.fromEntries(Object.entries(c.extra ?? {}).filter(([k]) => k !== name)) })) }));
  };

  const totals = useMemo(() => {
    const lines = q.lines.reduce((s, l) => s + l.qty * l.unit, 0);
    const creators = q.creators.reduce((s, c) => s + creatorTotal(c), 0);
    /* Creator fees count towards the total only when asked (Genesis, 13 Oct 2026), and never on a sample. */
    const subtotal = lines + (q.planColumns?.feesInTotal && q.planColumns?.extPrices !== false ? creators : 0);
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

  /*
   * The standard boxes can be removed too (Genesis, 26 Oct 2026): their text is
   * cleared, so it's off the document, and "Add back" brings the box back.
   */
  const removed = new Set<string>(q.planColumns?.boxes ?? []);
  const setBoxes = (next: Set<string>) => setQ((x) => ({ ...x, planColumns: { ...(x.planColumns ?? {}), boxes: [...next] } }));
  const proposalBox = (key: string, label: string, hint: string, value: string | null | undefined, onChange: (v: string) => void, placeholder: string, controls?: React.ReactNode) => removed.has(key) ? null : (
    <div key={key} className="space-y-1.5 rounded-xl border border-[var(--glass-border)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.9375rem] text-bone">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-[0.75rem] text-faint">{hint}</span>
          {controls}
          <button
            type="button"
            aria-label={`Remove ${label}`}
            title="Remove this box"
            onClick={() => {
              if (!window.confirm(`Remove "${label}" from this document?${value ? " Its text is deleted." : ""}`)) return;
              onChange("");
              setBoxes(new Set([...removed, key]));
            }}
            className="grid size-8 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-[#dc2626]"
          >
            <Trash2 className="size-4" />
          </button>
        </span>
      </div>
      <RichText label={label} value={value ?? ""} onChange={onChange} placeholder={placeholder} />
    </div>
  );

  return (
    <form ref={formRef} action={action} noValidate className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify({ ...q, version: ver, force })} />
      {(conflict || state?.message?.includes("after you opened it")) && (
        <div role="alert" className="sticky top-[4.75rem] z-40 flex flex-wrap items-center gap-3 rounded-2xl border border-[#f59e0b] bg-[var(--surface-float)] px-4 py-3 shadow-[var(--shadow-float)]">
          <p className="min-w-0 flex-1 text-[0.875rem] text-bone">{conflict ?? state?.message} Your changes since then aren&apos;t saved yet.</p>
          <button type="button" onClick={() => window.location.reload()} className="crm-btn crm-btn-primary crm-btn-sm">Get the latest</button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Save your version over theirs? Their changes since you opened the quote will be replaced.")) return;
              forceRef.current = true;
              setForce(true);
              setConflict(null);
              formRef.current?.requestSubmit();
            }}
            className="crm-btn crm-btn-secondary crm-btn-sm"
          >
            Keep mine
          </button>
        </div>
      )}

      <section className="crm-card crm-pad space-y-4">
        {/*
          TOGETHER OR SEPARATE (Genesis, 12 Oct 2026: "influencer plan, proposal
          and other quotes should be together or separate, give the option").
          Tick what this document holds; when sending, choose which parts go.
        */}
        <div className="flex flex-wrap items-center gap-2">
          {unsaved && !pending && <span className="order-last ml-auto text-[0.8125rem] text-[#f59e0b]" role="status">Unsaved changes. Press Save to share them with the team.</span>}
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
                  /* Remembered with the quote: the client view and the PDF show only these parts (Genesis, 13 Oct 2026). */
                  setQ((x) => ({ ...x, kind: next.plan && !next.pricing ? "INFLUENCER_PLAN" : "QUOTE", parts: (["proposal", "plan", "pricing"] as const).filter((p) => next[p]) }));
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
        {contactHidden ? (
          <p className="crm-notice">The client&apos;s contact details are private to whoever made this {q.kind === "INFLUENCER_PLAN" ? "plan" : "quote"} and the lead&apos;s owner. You can still edit and send it.</p>
        ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className="crm-label">Contact name</span><input value={q.contactName} onChange={(e) => set("contactName", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">Email</span><input type="email" value={q.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="crm-input" placeholder="Needed only to send" /></label>
          <label><span className="crm-label">Phone</span><input value={q.contactPhone ?? ""} onChange={(e) => set("contactPhone", e.target.value)} className="crm-input" /></label>
        </div>
        )}
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
        {tokens.map((t, pos) => {
          if (t === "tg") return proposalBox("tg", "TG (target group)", "Who the campaign speaks to", q.proposalTg, (v) => set("proposalTg", v), "Women 25–40, SEC A/B, Tier-1 & Tier-2 cities, into fitness and wellness", arrows(pos, "TG"));
          if (t === "problems") return proposalBox("problems", "Problems we'll solve", "One point a line", q.proposalProblems, (v) => set("proposalProblems", v), "Low awareness in Tier-2 cities. No creator content for the launch.", arrows(pos, "Problems"));
          if (t === "objectives") return proposalBox("objectives", "Objectives", "What success looks like", q.proposalObjectives, (v) => set("proposalObjectives", v), "10k app installs in 30 days. 2M+ views.", arrows(pos, "Objectives"));
          if (t === "influencers") return proposalBox("influencers", "Influencer/Talent", "The mix of creators and talent", q.proposalInfluencers, (v) => set("proposalInfluencers", v), "15 fitness & food creators, 50k–500k followers. Mumbai, Pune, Bengaluru.", arrows(pos, "Influencer/Talent"));
          /* CONTENT IDEAS (Genesis, 13 Oct 2026): a standard box, kept with the sections as "Content ideas". */
          if (t === "ideas") return proposalBox("ideas", "Content ideas", "Hooks, formats, reel concepts", (q.proposalSections ?? []).find((x) => x.title === CONTENT_IDEAS)?.html, setContentIdeas, "Day-in-the-life reels with the product, a 7-day glow-up challenge, before/after transitions, myth vs fact carousels.", arrows(pos, "Content ideas"));
          const i = sectionOf(pos);
          const sec = (q.proposalSections ?? [])[i];
          if (!sec) return null;
          return (
            <div key={`section-${i}`} className="space-y-1.5 rounded-xl border border-[var(--glass-border)] p-3">
              <div className="flex items-center gap-2">
                <input value={sec.title} onChange={(e) => setSection(i, { title: e.target.value })} className="crm-input !min-h-9 flex-1" placeholder="Section title: Big idea, Content pillars, Timeline, Deliverables…" />
                {arrows(pos, sec.title || "section")}
                <button type="button" aria-label="Remove section" onClick={() => window.confirm("Remove this section?") && removeSection(pos)} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--hover-wash)] text-ash hover:text-[#dc2626]"><Trash2 className="size-4" /></button>
              </div>
              <RichText label={sec.title || `Section ${i + 1}`} value={sec.html} onChange={(v) => setSection(i, { html: v })} placeholder="Write, format, add images, links or an embedded video, reel or deck." />
            </div>
          );
        })}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => set("proposalSections", [...(q.proposalSections ?? []), { title: "", html: "" }])} className="crm-btn crm-btn-secondary crm-btn-sm"><Plus className="size-4" /> Add a section</button>
          {[...removed].map((key) => (
            <button key={key} type="button" onClick={() => setBoxes(new Set([...removed].filter((k) => k !== key)))} className="crm-btn crm-btn-secondary crm-btn-sm">
              <Plus className="size-4" /> Add back: {BOX_LABELS[key] ?? key}
            </button>
          ))}
        </div>
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
          {/* EXPORT, ONE BUTTON (Genesis, 13 Oct 2026: "merge these into an icon and export, in a drop-down"). */}
          <div className="flex flex-wrap items-center gap-2">
            <details className="relative" ref={exportMenu}>
              <summary className={`crm-btn crm-btn-secondary crm-btn-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden ${q.creators.length ? "" : "pointer-events-none opacity-40"}`}>
                <FileSpreadsheet className="size-4" aria-hidden /> {download ? "Making…" : pending ? "Saving…" : "Export"} <ChevronDown className="size-4" aria-hidden />
              </summary>
              <div className="absolute left-0 z-30 mt-1 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-1 shadow-[var(--shadow-float)]">
                <button type="button" disabled={download !== null} onClick={() => { closeExport(); void excel("ext"); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[0.875rem] text-bone hover:bg-[var(--hover-wash)]"><FileSpreadsheet className="size-4 text-ash" aria-hidden /> Excel · external (client)</button>
                <button type="button" disabled={download !== null} onClick={() => { closeExport(); void excel("int"); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[0.875rem] text-bone hover:bg-[var(--hover-wash)]"><FileSpreadsheet className="size-4 text-ash" aria-hidden /> Excel · internal (team)</button>
                <button name="then" value="sheets" disabled={pending} onClick={closeExport} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[0.875rem] text-bone hover:bg-[var(--hover-wash)]"><Sheet className="size-4 text-ash" aria-hidden /> {sheets?.ext ? "Save & update Google Sheets" : "Save & make Google Sheets (internal + external)"}</button>
                {/* Replaces sheets edited in Google Sheets too (lib/crm/plan-sync); asks first, as it can't be undone from the CRM. */}
                {sheets?.ext && (
                  <button name="then" value="overwrite" disabled={pending} onClick={(e) => { if (!window.confirm("Replace both Google Sheets with this version? Anything changed in Google Sheets since the CRM last wrote them is lost (it's still in the sheet's version history).")) e.preventDefault(); else closeExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[0.875rem] text-[#dc2626] hover:bg-[var(--hover-wash)]"><Sheet className="size-4" aria-hidden /> Overwrite the Google Sheets with this version</button>
                )}
                {sheets?.ext && <a href={`https://docs.google.com/spreadsheets/d/${sheets.ext}/edit`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.875rem] text-bone hover:bg-[var(--hover-wash)]"><ExternalLink className="size-4 text-ash" aria-hidden /> Open external sheet (client)</a>}
                {sheets?.int && <a href={`https://docs.google.com/spreadsheets/d/${sheets.int}/edit`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.875rem] text-bone hover:bg-[var(--hover-wash)]"><ExternalLink className="size-4 text-ash" aria-hidden /> Open internal sheet (team)</a>}
              </div>
            </details>
            {state?.message && <span className={`text-[0.8125rem] ${state.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} role={state.ok ? "status" : "alert"}>{state.message}</span>}
          </div>
          {/*
            HOW THE BRAND GETS THE CREATORS (Genesis, 13 Oct 2026): the list in the
            proposal itself, the external Google Sheet (a view-only link in the
            proposal and the email, plus an Excel download), or both.
          */}
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Send the creator list to the brand as">
            <span className="mr-1 text-[0.8125rem] text-ash">Send the creators to the brand as:</span>
            {([["table", "List in the proposal"], ["sheet", "Send Google Sheet to client"], ["both", "Both"]] as const).map(([value, label]) => {
              const on = (q.planColumns?.share ?? "table") === value;
              return (
                <button key={value} type="button" role="radio" aria-checked={on} onClick={() => setQ((x) => ({ ...x, planColumns: { ...x.planColumns, share: value } }))} className={`rounded-full border px-3 py-1 text-[0.8125rem] ${on ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-ash hover:text-bone"}`}>
                  {label}
                </button>
              );
            })}
            <span className="ml-2 mr-1 text-[0.8125rem] text-ash">Brand sees:</span>
            {([[true, "Prices"], [false, "Sample (no costing)"]] as const).map(([value, label]) => {
              const on = (q.planColumns?.extPrices ?? true) === value;
              return (
                <button key={label} type="button" role="radio" aria-checked={on} onClick={() => setQ((x) => ({ ...x, planColumns: { ...x.planColumns, extPrices: value } }))} className={`rounded-full border px-3 py-1 text-[0.8125rem] ${on ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-ash hover:text-bone"}`}>
                  {label}
                </button>
              );
            })}
            {(q.planColumns?.share === "sheet" || q.planColumns?.share === "both") && (
              <span className="flex w-full flex-wrap items-center gap-2">
                {/* THE SHEET LINK ON THE QUOTE AND ITS PDF (Genesis, 13 Oct 2026): any Google Sheet you paste, else the CRM's external sheet. */}
                <input
                  value={q.planColumns?.sheetUrl ?? ""}
                  onChange={(e) => setQ((x) => ({ ...x, planColumns: { ...x.planColumns, sheetUrl: e.target.value } }))}
                  placeholder="Google Sheet link for the brand (optional): paste one, or leave blank to use the external sheet"
                  className="crm-input !min-h-8 min-w-0 flex-1 basis-72 text-[0.8125rem]"
                  aria-label="Google Sheet link for the brand"
                />
                <span className="text-[0.75rem] text-faint">{q.planColumns?.sheetUrl?.trim() ? "This link goes on the quote, its PDF and the email. Set it to “anyone with the link can view” in Google." : sheets?.ext ? "The external sheet's link goes on the quote, its PDF and the email (view only for anyone with the link)." : "Leave blank and the external sheet is made and linked when you send, or now with Save & make Google Sheets."}</span>
              </span>
            )}
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
              className="crm-input min-w-0 flex-1 basis-56"
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
            {/* A creator typed in by hand (Genesis, 13 Oct 2026: "add a creator line"): name, handle and followers in the row. */}
            <button
              type="button"
              className="crm-btn crm-btn-secondary crm-btn-sm"
              onClick={() => setQ((x) => ({ ...x, creators: [...x.creators, { creatorId: null, name: "", handle: "", platform: "INSTAGRAM", profileUrl: null, followers: 0, avgViews: null, niches: [], city: null, deliverables: "1 IG Reel + Story & link in bio", fee: null }] }))}
            >
              <Plus className="size-4" /> Add creator
            </button>
            <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => importPicker.current?.click()}>
              <Upload className="size-4" /> Import Excel / CSV
            </button>
            <input ref={importPicker} type="file" accept=".xlsx,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void readImport(e.target.files?.[0]); e.target.value = ""; }} />
            {linkError && <span className="text-[0.8125rem] text-[#dc2626]">{linkError}</span>}
          </div>
          {/* WHERE EACH COLUMN GOES (Genesis, 27 Oct 2026: "make sure it adds the correct data in the correct column"): checked, and changed if need be, before adding. */}
          {sheet && (
            <div className="space-y-3 rounded-xl border border-[#ffc516] p-3 text-[0.8125rem]">
              <p><span className="text-bone">{sheet.name}</span> <span className="text-ash">· {sheet.rows.length} rows. Check where each column goes:</span></p>
              <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {sheet.headers.filter(Boolean).map((h) => (
                  <label key={h} className="flex items-center justify-between gap-2">
                    <span className="truncate text-bone" title={h}>{h}</span>
                    <select
                      value={sheet.targets[h] ?? "skip"}
                      onChange={(e) => setSheet((x) => (x ? { ...x, targets: { ...x.targets, [h]: e.target.value } } : x))}
                      className="crm-input !min-h-8 !w-48 !py-1 text-[0.8125rem]"
                    >
                      {Object.entries(TARGET_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      <option value={`col:${h.slice(0, 60)}`}>New column &ldquo;{h.slice(0, 30)}&rdquo;</option>
                    </select>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={runImport} className="crm-btn crm-btn-primary crm-btn-sm">Add {sheet.rows.length} creators</button>
                <button type="button" onClick={() => setSheet(null)} className="text-ash hover:text-bone">Cancel</button>
              </div>
            </div>
          )}
          {importNote && <p className="text-[0.8125rem] text-ash" role="status">{importNote}</p>}
          <p className="text-[0.75rem] text-faint">Several links at once work too. Creators added by link, by hand or from a sheet are saved to the influencer database.</p>
          {search && (
            <ul className="max-h-72 divide-y divide-[var(--glass-border)] overflow-y-auto rounded-xl border border-[var(--glass-border)] px-3" data-lenis-prevent>
              {matches.length === 0 && <li className="py-2 text-ash">No match.</li>}
              {matches.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 truncate"><span className="text-bone">{c.name}</span> <span className="text-[0.8125rem] text-ash">@{c.handle} · {c.platform.toLowerCase()} · {compact(c.followers)} · {c.niches.join(", ")} {c.city ? `· ${c.city}` : ""}</span></span>
                  <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm shrink-0" onClick={() => setQ((x) => ({ ...x, creators: [...x.creators, { creatorId: c.id, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, deliverables: "1 IG Reel + Story & link in bio", fee: null, reelCost: c.reel, storyCost: c.story, dlCost: c.dl, reelPrice: c.reel === null ? null : Math.round(c.reel * (1 + (x.markupPercent ?? 30) / 100)), storyPrice: c.story === null ? null : Math.round(c.story * (1 + (x.markupPercent ?? 30) / 100)), dlPrice: c.dl === null ? null : Math.round(c.dl * (1 + (x.markupPercent ?? 30) / 100)), contact: c.contact }] }))}>Add</button>
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
                  <p className="text-[0.8125rem] text-ash">Tap a column to remove it (tap again to bring it back). Removed columns are left out of the client view and both sheets. Tap a column you added to keep it <b className="text-bone">internal only</b>: on the internal sheet, off the external sheet and the client view; × deletes it.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLAN_COLUMNS.map(([key, label]) => (
                      <button key={key} type="button" aria-pressed={shows(key)} onClick={() => toggleColumn(key)} className={`rounded-full border px-2.5 py-1 text-[0.75rem] ${shows(key) ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-faint line-through"}`}>{label}</button>
                    ))}
                    {custom.map((name) => (
                      <span key={name} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.75rem] ${intOnly.has(name) ? "border-dashed border-[var(--glass-border)] text-ash" : "border-[#ffc516] text-bone"}`}>
                        <button type="button" aria-pressed={!intOnly.has(name)} title={intOnly.has(name) ? "Internal only: tap to show it to the client too" : "Tap to keep it internal (off the external sheet and client view)"} onClick={() => toggleIntOnly(name)} className="hover:underline">
                          {name}
                          {intOnly.has(name) && <span className="ml-1 text-faint">· internal only</span>}
                        </button>
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
              <div className={full ? "fixed inset-0 z-[80] flex flex-col bg-[var(--surface-panel)]" : "contents"} {...(full ? { role: "dialog", "aria-modal": true, "aria-label": "Influencer plan, full screen" } : {})}>
              <div className={`flex flex-wrap items-center gap-2 ${full ? "border-b border-[var(--glass-border)] px-3 py-2 sm:px-5 sm:py-3" : ""}`}>
                {full && <span className="mr-auto min-w-0 truncate text-[0.9375rem] text-bone sm:mr-3">{q.title || "Influencer plan"} <span className="text-ash">· {q.creators.length} creators</span></span>}
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Editing the internal or the external plan">
                <span className="text-[0.8125rem] text-ash">Editing:</span>
                {([["internal", "Internal (team)"], ["external", "External (client)"]] as const).map(([value, label]) => (
                  <button key={value} type="button" role="radio" aria-checked={editing === value} onClick={() => setEditing(value)} className={`rounded-full border px-3 py-1 text-[0.8125rem] ${editing === value ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-ash hover:text-bone"}`}>
                    {label}
                  </button>
                ))}
                <span className={`text-[0.75rem] text-faint ${full ? "max-lg:hidden" : ""}`}>{editing === "internal" ? "Everything: creator costs, profit, reach-out, contact and remarks." : `What the brand sees${q.planColumns?.extPrices === false ? " (a sample, no prices)" : ", client prices only"}; costs, profit and notes stay internal.`}</span>
              </div>
                <button type="button" onClick={() => setFull((f) => !f)} className={`crm-btn crm-btn-secondary crm-btn-sm ${full ? "" : "ml-auto"}`} aria-label={full ? "Leave full screen" : "Full screen"} title={full ? "Leave full screen (Esc)" : "Full screen"}>
                  {full ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />} <span className="max-sm:hidden">{full ? "Exit full screen" : "Full screen"}</span>
                </button>
              </div>
              {/* THE PLAN AS GENESIS'S SHEET (Genesis, 12 Oct 2026: "fields are still missing"); scrolls sideways, the name stays put. */}
              {/* The creators in their own scrolling box: headings stay at the top, names at the left (Genesis, 13 Oct 2026). */}
              <div className={full ? "min-h-0 flex-1 overflow-auto overscroll-contain pb-2" : "-mx-1 max-h-[36rem] overflow-auto rounded-xl border border-[var(--glass-border)] pb-2"} data-lenis-prevent>
                <table className={`crm-table !min-w-max ${full ? "text-[0.875rem] [&_td]:!py-2 sm:[&_td]:!px-2.5 sm:[&_th]:!px-2.5" : "text-[0.8125rem]"} [&_td]:!px-1.5 [&_th]:!px-1.5 [&_th]:whitespace-nowrap [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-[var(--surface-panel)]`}>
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
                      {customShown.map((name) => <th key={name}>{name}</th>)}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {q.creators.map((c, i) => {
                      const profit = creatorTotal(c) - creatorCost(c);
                      return (
                        <tr key={`${c.handle}-${i}`}>
                          <td className="sticky left-0 z-10 min-w-[11rem] bg-[var(--surface-panel)] text-bone max-sm:min-w-[8.5rem]">
                            {c.creatorId ? (
                              <span className="flex flex-col gap-1">
                                <input value={c.name} onChange={(e) => setCreator(i, { name: e.target.value })} className="crm-input !min-h-8 !w-40 !px-2 max-sm:!w-32" placeholder="Name" aria-label="Creator name" />
                                <span className="text-[0.75rem] text-ash">@{c.handle}</span>
                              </span>
                            ) : (
                              <span className="flex flex-col gap-1">
                                <input value={c.name} onChange={(e) => setCreator(i, { name: e.target.value })} className="crm-input !min-h-8 !w-40 !px-2 max-sm:!w-32" placeholder="Name" aria-label="Creator name" />
                                <input
                                  value={c.handle}
                                  onChange={(e) => {
                                    const handle = e.target.value.replace(/^@/, "").replace(/\s+/g, "");
                                    setCreator(i, { handle, profileUrl: handle && c.platform === "INSTAGRAM" ? `https://www.instagram.com/${handle}` : c.profileUrl });
                                  }}
                                  className="crm-input !min-h-8 !w-40 !px-2 max-sm:!w-32"
                                  placeholder="@handle"
                                  aria-label="Instagram handle"
                                />
                              </span>
                            )}
                            {/* Cut to the name's width, so one long line can't widen the frozen column over the others (Genesis, 27 Oct 2026). */}
                            {c.last && <span className={`mt-1 block max-w-[10rem] truncate text-[0.6875rem] max-sm:max-w-[8rem] ${isRecent(c.last) ? "text-[#f59e0b]" : "text-faint"}`} title={`Latest reach-out, from any plan: ${reachLine(c.last)}`}>Last: {reachLine(c.last)}</span>}
                          </td>
                          {shows("tier") && <td className="whitespace-nowrap">{c.followers < 10_000 ? "Nano" : c.followers < 100_000 ? "Micro" : c.followers < 500_000 ? "Mid" : c.followers < 1_000_000 ? "Macro" : "Mega"}</td>}
                          {/* Pick any number of categories, or add your own (components/crm/niche-picker). */}
                          {shows("category") && <td><NichePicker compact value={c.niches} onChange={(next) => setCreator(i, { niches: next })} label="Category" /></td>}
                          {/* The profile link is editable on every plan (Genesis, 22 Oct 2026), with a way to open it. */}
                          {shows("ig") && (
                            <td>
                              <span className="flex items-center gap-1">
                                <input value={c.profileUrl ?? ""} onChange={(e) => setCreator(i, { profileUrl: e.target.value.trim() || null })} className="crm-input !min-h-8 !w-44 !px-2" placeholder="Profile link" aria-label="Profile link" />
                                {c.profileUrl && <a href={/^https?:\/\//i.test(c.profileUrl) ? c.profileUrl : `https://${c.profileUrl}`} target="_blank" rel="noreferrer" className="crm-link shrink-0 text-[0.8125rem]" aria-label="Open profile">↗</a>}
                              </span>
                            </td>
                          )}
                          {shows("followers") && (
                            <td className="tabular-nums whitespace-nowrap">
                              {<input type="number" step="any" min={0} value={c.followers || ""} onChange={(e) => setCreator(i, { followers: Math.max(0, Math.round(Number(e.target.value) || 0)) })} className="crm-input !min-h-8 !w-28 !px-2" placeholder="Followers" />}
                            </td>
                          )}
                          {shows("avgViews") && <td><input type="number" step="any" min={0} value={c.avgViews ?? ""} onChange={(e) => setCreator(i, { avgViews: e.target.value === "" ? null : Number(e.target.value) })} className="crm-input !min-h-8 !w-24 !px-2" /></td>}
                          {shows("er") && <td><input type="number" step="any" min={0} value={c.er ?? ""} onChange={(e) => setCreator(i, { er: e.target.value === "" ? null : Number(e.target.value) })} className="crm-input !min-h-8 !w-16 !px-2" /></td>}
                          {shows("location") && <td><GrowText value={c.city ?? ""} onChange={(e) => setCreator(i, { city: e.target.value })} className="crm-input !min-h-8 !w-32 !px-2" /></td>}
                          {shows("reachout") && <td><select value={c.reachout ?? ""} onChange={(e) => setCreator(i, { reachout: e.target.value || null })} className="crm-input !min-h-8 !w-36 !px-2">{reachOptions(c.reachout).map((r) => <option key={r} value={r}>{r || "Not contacted"}</option>)}</select></td>}
                          {MONEY.filter(shows).map((k) => (
                            <td key={k} className={k.endsWith("Cost") ? "bg-[var(--hover-wash)]" : ""}><input type="number" step="any" min={0} value={c[k] ?? ""} onChange={(e) => setCreator(i, { [k]: e.target.value === "" ? null : Number(e.target.value) } as Partial<BuilderCreator>)} className="crm-input !min-h-8 !w-28 !px-2 text-right" placeholder="₹" /></td>
                          ))}
                          {shows("profit") && <td className={`whitespace-nowrap tabular-nums ${profit < 0 ? "text-[#dc2626]" : "text-bone"}`}>{inr(profit)}</td>}
                          {shows("contact") && <td><GrowText value={c.contact ?? ""} onChange={(e) => setCreator(i, { contact: e.target.value })} className="crm-input !min-h-8 !w-44 !px-2" placeholder="+91… / email / agency" /></td>}
                          {shows("remarks") && <td><GrowText value={c.remarks ?? ""} onChange={(e) => setCreator(i, { remarks: e.target.value })} className="crm-input !min-h-8 !w-48 !px-2" /></td>}
                          {customShown.map((name) => (
                            <td key={name}><GrowText value={c.extra?.[name] ?? ""} onChange={(e) => setCreator(i, { extra: { ...(c.extra ?? {}), [name]: e.target.value } })} className="crm-input !min-h-8 !w-40 !px-2" /></td>
                          ))}
                          <td><button type="button" aria-label="Remove creator" onClick={() => setQ((x) => ({ ...x, creators: x.creators.filter((_, j) => j !== i) }))} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--hover-wash)] text-ash hover:text-[#dc2626]"><X className="size-4" /></button></td>
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
                      {customShown.map((name) => <td key={name} />)}
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
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
              <label><span className="crm-label">{l.kind === "custom" ? "Custom line" : l.kind === "addon" ? "Add-on" : l.kind === "plan" ? "Plan" : "Product"}</span><GrowText value={l.title} onChange={(e) => setLine(i, { title: e.target.value })} className="w-full font-medium" placeholder="Premium UGC Content Production | 10 Videos" /></label>
              <label><span className="crm-label">Qty</span><input type="number" step="any" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, Number(e.target.value) || 1) })} className="crm-input" /></label>
              <label><span className="crm-label">Price (₹)</span><input type="number" step="any" min={0} value={l.unit} onChange={(e) => setLine(i, { unit: Number(e.target.value) || 0 })} className="crm-input" /></label>
              <p className="pb-2.5 text-right tabular-nums text-bone"><span className="crm-label">Line total</span>{inr(l.qty * l.unit)}</p>
              <span className="flex gap-0.5 pb-1">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--hover-wash)] text-ash hover:text-bone"><ArrowUp className="size-4" /></button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--hover-wash)] text-ash hover:text-bone"><ArrowDown className="size-4" /></button>
                <button type="button" aria-label="Remove line" onClick={() => setQ((x) => ({ ...x, lines: x.lines.filter((_, j) => j !== i) }))} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--hover-wash)] text-ash hover:text-[#dc2626]"><Trash2 className="size-4" /></button>
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
            {q.creators.length > 0 && (
              <dt className="col-span-2">
                <label className="flex items-center gap-2 text-[0.875rem] text-ash">
                  <input type="checkbox" checked={Boolean(q.planColumns?.feesInTotal)} disabled={q.planColumns?.extPrices === false} onChange={(e) => setQ((x) => ({ ...x, planColumns: { ...x.planColumns, feesInTotal: e.target.checked } }))} />
                  Add the creators&apos; fees ({inr(totals.creators)}) to the total{q.planColumns?.extPrices === false ? " (off for a sample)" : ""}
                </label>
              </dt>
            )}
            <dt className="text-ash">Subtotal</dt><dd className="tabular-nums">{inr(totals.subtotal)}</dd>
            <dt className="text-ash"><label className="flex items-center gap-2">Discount (₹)</label></dt>
            <dd><input type="number" step="any" min={0} value={q.discount} onChange={(e) => set("discount", Number(e.target.value) || 0)} className="crm-input !min-h-8 w-32 text-right" /></dd>
            <dt className="text-ash"><label className="flex flex-wrap items-center gap-2 whitespace-nowrap"><input type="checkbox" checked={q.addGst} onChange={(e) => set("addGst", e.target.checked)} /> Add GST at <span className="inline-flex items-center gap-1"><input type="number" step="any" min={0} max={28} value={q.gstPercent} onChange={(e) => set("gstPercent", Number(e.target.value) || 0)} className="crm-input !min-h-8 !w-16 text-right" aria-label="GST percent" />%</span></label></dt>
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
            <button className="crm-btn crm-btn-primary" disabled={pending}>{pending ? "Saving…" : q.id ? (sheets?.ext ? "Save changes & update sheets" : "Save changes") : "Save draft"}</button>
            {state?.message && <span className={`text-[0.8125rem] ${state.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} role={state.ok ? "status" : "alert"}>{state.message}</span>}
          </div>
          <p className="text-[0.75rem] text-faint">A draft saves with anything missing; the client&apos;s email is needed only to send.</p>
        </section>
      </div>
    </form>
  );
}
