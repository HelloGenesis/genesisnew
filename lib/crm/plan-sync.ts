import "server-only";

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

import { companyToken, personFileToken } from "./google";
import { refreshTotals } from "./quotes";

/**
 * A PLAN'S GOOGLE SHEETS AND THE CRM, BOTH WAYS (Genesis, 26 Oct 2026: "when
 * we make changes on a dedicated sheet I want these changes to reflect on the
 * CRM backend quote as well… don't touch this one, I have shared it with the
 * client").
 *
 * The CRM remembers the sheet's Drive "modified" time each time it writes it.
 *  - Sheet → CRM: a sheet modified since (edited in Google Sheets) is read
 *    back into the quote — names, IG links, followers, costs and prices,
 *    location, and any other column as an added column. On opening the
 *    plan, and every five minutes.
 *  - CRM → Sheet: Save rewrites a sheet only while the CRM was the last to
 *    write it. Once someone has edited it in Google Sheets it's theirs: Save
 *    leaves it alone, and only "Overwrite the Google Sheets" replaces it.
 * Sheets made before this (no record): rewritten as before, unless a tab
 * the CRM writes is gone (renamed by hand), which marks it as edited.
 */

const API = "https://sheets.googleapis.com/v4/spreadsheets";
type Rec = { written?: string; pulled?: string; checked?: number };
const KEY = (id: string) => `plan-sheet:${id}`;

async function rec(id: string): Promise<Rec> {
  const row = await getPrisma().appSetting.findUnique({ where: { key: KEY(id) } });
  return row ? (JSON.parse(row.value) as Rec) : {};
}
async function store(id: string, patch: Rec) {
  const value = JSON.stringify({ ...(await rec(id)), ...patch });
  await getPrisma().appSetting.upsert({ where: { key: KEY(id) }, create: { key: KEY(id), value }, update: { value } });
}

async function get<T>(token: string, url: string): Promise<T> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok) throw new Error(json.error?.message ?? `Google ${r.status}`);
  return json;
}

export async function modifiedTime(token: string, id: string) {
  return (await get<{ modifiedTime: string }>(token, `https://www.googleapis.com/drive/v3/files/${id}?fields=modifiedTime&supportsAllDrives=true`)).modifiedTime;
}

/** After the CRM writes a sheet: its modified time, so a later edit in Google Sheets can be told apart. */
export async function markWritten(token: string, id: string) {
  const t = await modifiedTime(token, id);
  await store(id, { written: t, pulled: t });
}

export class SheetEditedError extends Error {
  constructor() {
    super("The Google Sheets were edited in Google Sheets, so Save didn't overwrite them; their changes come into the CRM by themselves. To replace them with this version, use Export → Overwrite the Google Sheets.");
    this.name = "SheetEditedError";
  }
}

/* The CRM's own write, give or take the few seconds Google takes to stamp it. */
const ours = (mod: string, written: string | undefined) => Boolean(written) && new Date(mod).getTime() <= new Date(written!).getTime() + 15_000;

/** May Save rewrite this sheet? Only if the CRM wrote it last (see above); once read back from Google Sheets, never. */
export async function mayOverwrite(token: string, id: string, tabs: string[], titles: string[]) {
  const r = await rec(id);
  if (r.written || r.pulled) return ours(await modifiedTime(token, id), r.written) && (!r.pulled || r.pulled === r.written);
  return tabs.every((t) => titles.includes(t));
}

/* --- Reading a sheet back ------------------------------------------------- */

type GridCell = { formattedValue?: string; hyperlink?: string; effectiveValue?: { numberValue?: number; stringValue?: string } };
type Grid = { sheets: { properties: { title: string }; data?: { rowData?: { values?: GridCell[] }[] }[] }[] };
type Cellv = { text: string; num: number | null; link: string | null };

async function readTab(token: string, id: string, tab: string): Promise<Cellv[][]> {
  const range = encodeURIComponent(`'${tab.replace(/'/g, "''")}'!A1:AD600`);
  const g = await get<Grid>(token, `${API}/${id}?ranges=${range}&fields=sheets(properties(title),data(rowData(values(formattedValue,hyperlink,effectiveValue))))`);
  const rows = g.sheets[0]?.data?.[0]?.rowData ?? [];
  return rows.map((r) => (r.values ?? []).map((c) => ({ text: (c.formattedValue ?? "").trim(), num: typeof c.effectiveValue?.numberValue === "number" ? c.effectiveValue.numberValue : null, link: c.hyperlink ?? null })));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim();
const handleOf = (url: string | null | undefined) => (url ? url.match(/(?:instagram\.com|youtube\.com)\/(?:@)?([A-Za-z0-9._-]+)/i)?.[1]?.toLowerCase() ?? null : null);
const count = (c: Cellv) => {
  if (c.num !== null) return Math.round(c.num);
  const m = c.text.replace(/,/g, "").match(/([\d.]+)\s*(k|m|cr|l|lakh)?/i);
  if (!m) return null;
  const n = Number(m[1]);
  const mult = { k: 1e3, m: 1e6, cr: 1e7, l: 1e5, lakh: 1e5 }[(m[2] ?? "").toLowerCase() as "k"] ?? 1;
  return Number.isFinite(n) ? Math.round(n * mult) : null;
};
/* Money cells: a number, or "₹18,00,000"; words ("Awaiting quote") are no price. */
const paise = (c: Cellv) => {
  if (c.num !== null) return Math.round(c.num * 100);
  const digits = c.text.replace(/[₹,\s]/g, "");
  return /^\d+(\.\d+)?$/.test(digits) ? Math.round(Number(digits) * 100) : null;
};

/* The CRM's own column names; anything else is an added column. */
const FIELD: Record<string, string> = {
  name: "name", "ig link": "ig", "instagram link": "ig", "profile link": "ig", category: "category", followers: "followers", "avg views": "avgViews", er: "er",
  location: "city", city: "city", "reachout status": "reachout", "reach out": "reachout", contact: "contact", remarks: "remarks",
};
const MONEY: Record<string, "reel" | "story" | "dl"> = { "1 ig reel": "reel", "story + lib": "story", "story lib": "story", "dl 1 month": "dl" };
const SKIP = new Set(["tier", "yt link", "youtube link", "profit", "email", "s no", "sr no"]);

type Row = { [key: string]: unknown; extra: Record<string, string> };

/** The plan tab's rows: from the header row that has "Name", until the disclaimer or totals. */
function parse(grid: Cellv[][], kind: "ext" | "int") {
  const h = grid.findIndex((r, i) => i < 6 && r.some((c) => norm(c.text) === "name"));
  if (h < 0) return null;
  const header = grid[h]!;
  /* The internal sheet's group row above ("Creator cost" / "Client price") says which money columns are which. */
  const groups: ("cost" | "price" | null)[] = [];
  let g: "cost" | "price" | null = null;
  header.forEach((_, i) => {
    const above = norm(grid[h - 1]?.[i]?.text ?? "");
    if (above) g = above.includes("cost") ? "cost" : above.includes("price") ? "price" : null;
    groups[i] = kind === "ext" ? "price" : g;
  });
  const cols = header.map((c, i) => {
    const n = norm(c.text);
    if (!n || SKIP.has(n)) return null;
    if (MONEY[n] && groups[i]) return { key: `${MONEY[n]}${groups[i] === "cost" ? "Cost" : "Price"}`, money: true, header: c.text };
    if (FIELD[n]) return { key: FIELD[n]!, money: false, header: c.text };
    return { key: `x:${c.text}`, money: false, header: c.text };
  });
  const nameAt = cols.findIndex((c) => c?.key === "name");
  const rows: Row[] = [];
  for (const r of grid.slice(h + 1)) {
    const name = r[nameAt]?.text ?? "";
    if (/^(disclaimer|total)/i.test(name) || /^(disclaimer|total)\b/i.test(r[0]?.text ?? "")) break;
    if (!name) {
      if (r.every((c) => !c.text)) break;
      continue;
    }
    const row: Row = { extra: {} };
    cols.forEach((col, i) => {
      if (!col) return;
      const c = r[i] ?? { text: "", num: null, link: null };
      if (col.key.startsWith("x:")) row.extra[col.key.slice(2)] = c.text;
      else if (col.money) row[col.key] = paise(c);
      else if (col.key === "ig") row.ig = c.link ?? (c.text || null);
      else if (col.key === "followers" || col.key === "avgViews") row[col.key] = count(c);
      else if (col.key === "er") row.er = c.num !== null ? (c.num < 1 && c.text.includes("%") ? c.num * 100 : c.num) : Number(c.text.replace("%", "")) || null;
      else row[col.key] = c.text;
    });
    rows.push(row);
  }
  return { rows, custom: cols.filter((c): c is NonNullable<typeof c> => Boolean(c?.key.startsWith("x:"))).map((c) => c.header) };
}

type QC = Prisma.QuoteCreatorGetPayload<object>;

/** The sheet's rows onto the quote's creators: matched by IG handle, else name; new rows added; rows gone removed. */
function apply(existing: QC[], parsed: NonNullable<ReturnType<typeof parse>>) {
  const keyOf = (name: string, url: string | null | undefined) => handleOf(url) ?? `n:${name.trim().toLowerCase()}`;
  const byKey = new Map(existing.map((c) => [keyOf(c.name, c.profileUrl ?? `instagram.com/${c.handle}`), c]));
  const byName = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c]));
  return parsed.rows.map((r, position) => {
    const name = String(r.name ?? "").trim();
    const url = (r.ig as string | null) ?? null;
    const was = byKey.get(keyOf(name, url)) ?? byName.get(name.toLowerCase());
    const has = (k: string) => k in r;
    const handle = handleOf(url) ?? was?.handle ?? name.toLowerCase().replace(/[^a-z0-9._]+/g, "");
    return {
      creatorId: was?.creatorId ?? null,
      position,
      name: name || was?.name || handle,
      handle,
      platform: was?.platform ?? (url && /youtube/i.test(url) ? "YOUTUBE" : "INSTAGRAM"),
      profileUrl: url ?? was?.profileUrl ?? null,
      followers: has("followers") ? Number(r.followers ?? 0) : (was?.followers ?? 0),
      avgViews: has("avgViews") ? ((r.avgViews as number | null) ?? null) : (was?.avgViews ?? null),
      niches: has("category") ? String(r.category ?? "").split(/\s*(?:&|,)\s*/).filter(Boolean) : (was?.niches ?? []),
      city: has("city") ? String(r.city ?? "") || null : (was?.city ?? null),
      deliverables: has("deliverables") ? String(r.deliverables ?? "") || null : (was?.deliverables ?? null),
      feePaise: was?.feePaise ?? null,
      reelCostPaise: has("reelCost") ? (r.reelCost as number | null) : (was?.reelCostPaise ?? null),
      storyCostPaise: has("storyCost") ? (r.storyCost as number | null) : (was?.storyCostPaise ?? null),
      dlCostPaise: has("dlCost") ? (r.dlCost as number | null) : (was?.dlCostPaise ?? null),
      reelPricePaise: has("reelPrice") ? (r.reelPrice as number | null) : (was?.reelPricePaise ?? null),
      storyPricePaise: has("storyPrice") ? (r.storyPrice as number | null) : (was?.storyPricePaise ?? null),
      dlPricePaise: has("dlPrice") ? (r.dlPrice as number | null) : (was?.dlPricePaise ?? null),
      engagementRate: has("er") ? ((r.er as number | null) ?? null) : (was?.engagementRate ?? null),
      reachout: has("reachout") ? String(r.reachout ?? "") || null : (was?.reachout ?? null),
      contact: has("contact") ? String(r.contact ?? "") || null : (was?.contact ?? null),
      remarks: has("remarks") ? String(r.remarks ?? "") || null : (was?.remarks ?? null),
      extra: { ...((was?.extra ?? {}) as Record<string, string>), ...(r.extra ?? {}) },
    };
  });
}

/** Tokens that can open this quote's sheets: its maker's, then the company account's. */
async function tokensFor(createdById: string | null) {
  const out: string[] = [];
  const own = await personFileToken(createdById).catch(() => null);
  if (own) out.push(own.token);
  const company = await companyToken().catch(() => null);
  if (company && !out.includes(company)) out.push(company);
  return out;
}

/**
 * Brings a plan's sheet edits into the CRM, when there are any. `throttle`
 * (ms): skip if checked that recently (opening the plan page).
 */
export async function pullPlanSheets(quoteId: string, throttle = 0): Promise<{ pulled: string[] }> {
  const prisma = getPrisma();
  const q = await prisma.quote.findUnique({ where: { id: quoteId }, select: { id: true, extSheetId: true, intSheetId: true, createdById: true, planColumns: true } });
  if (!q?.extSheetId && !q?.intSheetId) return { pulled: [] };
  const pulled: string[] = [];
  const tokens = await tokensFor(q.createdById);
  /* Internal first (costs), then external (what the client sees), so the client's sheet has the last word on shared fields. */
  for (const [id, kind] of [[q.intSheetId, "int"], [q.extSheetId, "ext"]] as const) {
    if (!id) continue;
    const r = await rec(id);
    if (throttle && r.checked && Date.now() - r.checked < throttle) continue;
    for (const token of tokens) {
      let mod: string;
      try {
        mod = await modifiedTime(token, id);
      } catch {
        continue;
      }
      await store(id, { checked: Date.now() });
      /* Unchanged since the CRM wrote it or last read it. A sheet from before this, never edited since: recorded, not read. */
      if (ours(mod, r.written) || mod === r.pulled) break;
      if (!r.written && !r.pulled) {
        const meta = await get<{ sheets: { properties: { title: string } }[] }>(token, `${API}/${id}?fields=sheets.properties.title`);
        const titles = meta.sheets.map((s) => s.properties.title);
        const ours = kind === "ext" ? ["Summary", "Influencer Plan"] : ["INT", "EXT"];
        if (ours.every((t) => titles.includes(t))) {
          await store(id, { written: mod, pulled: mod });
          break;
        }
      }
      const meta = await get<{ sheets: { properties: { title: string } }[] }>(token, `${API}/${id}?fields=sheets.properties.title`);
      const titles = meta.sheets.map((s) => s.properties.title);
      const preferred = kind === "ext" ? "Influencer Plan" : "INT";
      const order = [preferred, ...titles.filter((t) => t !== preferred && t !== "Summary" && !(kind === "int" && t === "EXT"))].filter((t) => titles.includes(t));
      let parsed: ReturnType<typeof parse> = null;
      for (const tab of order) {
        parsed = parse(await readTab(token, id, tab), kind);
        if (parsed && parsed.rows.length) break;
      }
      if (parsed && parsed.rows.length) {
        const existing = await prisma.quoteCreator.findMany({ where: { quoteId }, orderBy: { position: "asc" } });
        const next = apply(existing, parsed);
        const cols = (q.planColumns ?? {}) as { custom?: string[] };
        const custom = [...new Set([...(cols.custom ?? []), ...parsed.custom])];
        await prisma.$transaction([
          prisma.quoteCreator.deleteMany({ where: { quoteId } }),
          prisma.quoteCreator.createMany({ data: next.map((c) => ({ ...c, quoteId, extra: c.extra as Prisma.InputJsonValue })) }),
          prisma.quote.update({ where: { id: quoteId }, data: { planColumns: { ...(q.planColumns as object), custom } as Prisma.InputJsonValue } }),
        ]);
        await refreshTotals(quoteId);
        pulled.push(kind);
      }
      await store(id, { pulled: mod });
      break;
    }
  }
  return { pulled };
}

/** The five-minute job: plans with sheets, touched in the last 60 days, a few at a time. */
export async function pullRecentPlanSheets() {
  const quotes = await getPrisma().quote.findMany({
    where: { kind: "INFLUENCER_PLAN", OR: [{ extSheetId: { not: null } }, { intSheetId: { not: null } }], updatedAt: { gt: new Date(Date.now() - 60 * 864e5) } },
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: { id: true },
  });
  const report: Record<string, string[] | string> = {};
  for (const q of quotes) {
    try {
      const r = await pullPlanSheets(q.id, 4 * 60_000);
      if (r.pulled.length) report[q.id] = r.pulled;
    } catch (error) {
      report[q.id] = (error as Error).message.slice(0, 160);
    }
  }
  return report;
}

/** For tests: reading a sheet's rows, and applying them to a plan's creators. */
export const planSheetInternals = { parse, apply };
