/**
 * AN INFLUENCER PLAN AS ROWS, the one source for both Google Sheets and the
 * Excel downloads (Genesis, 12–13 Oct 2026, after the IndusInd Nippon Life
 * plan). EXTERNAL, for the client: a Summary and the Influencer Plan by tier,
 * client prices only. INTERNAL, for the team: reach-out, YouTube, the
 * creators' own costs, contact, profit, the client prices, remarks, email.
 *
 * Columns removed in the builder are left out of both; columns added there
 * come after the standard ones, in both.
 */

export type Cell = string | number | null;
/**
 * `boxes`: the standard proposal boxes removed from this document (tg, problems, objectives, influencers, ideas).
 * `order`: the proposal boxes' order (lib/crm/proposal-order).
 * `intOnly`: added columns kept to the internal sheet, off the external sheet and the client view (Genesis, 26 Oct 2026).
 */
export type PlanColumns = { hidden?: string[]; custom?: string[]; share?: "table" | "sheet" | "both"; extPrices?: boolean; feesInTotal?: boolean; sheetUrl?: string; boxes?: string[]; intOnly?: string[]; order?: string[] };

/** The sheet link the brand gets: one pasted in the builder, else the CRM's external sheet. */
export function brandSheetLink(c: PlanColumns | null | undefined, extSheetId: string | null | undefined): string | null {
  const own = c?.sheetUrl?.trim();
  if (own && /^https:\/\/[^\s]+$/i.test(own)) return own;
  return extSheetId ? `https://docs.google.com/spreadsheets/d/${extSheetId}/edit?usp=sharing` : null;
}

/**
 * The brand's prices on the external sheet and the client view, or a SAMPLE
 * with no costing at all (Genesis, 13 Oct 2026: "sometimes we give a sample
 * sheet, so the costing part is optional"). Creator costs, profit and
 * internal notes are never on anything the brand sees.
 */
export const showsBrandPrices = (c: PlanColumns | null | undefined) => c?.extPrices !== false;

/** How the brand gets the creator list (Genesis, 13 Oct 2026): in the proposal, as the external Google Sheet, or both. */
export const sharesSheet = (c: PlanColumns | null | undefined) => c?.share === "sheet" || c?.share === "both";
export const sharesTable = (c: PlanColumns | null | undefined) => c?.share !== "sheet";
export type PlanCreator = {
  name: string;
  handle: string;
  platform: string;
  profileUrl?: string | null;
  followers: number;
  avgViews?: number | null;
  er?: number | null;
  niches: string[];
  city?: string | null;
  reelCost?: number | null;
  storyCost?: number | null;
  dlCost?: number | null;
  reelPrice?: number | null;
  storyPrice?: number | null;
  dlPrice?: number | null;
  reachout?: string | null;
  /** Numbers and emails, each ", "-separated (lib/crm/contacts). */
  phone?: string | null;
  email?: string | null;
  /** Set by hand on the plan; else by followers. */
  tier?: string | null;
  remarks?: string | null;
  yt?: string | null;
  extra?: Record<string, string>;
};
export type PlanInput = { title: string; brand: string; terms: string | null; planBudget: string | null; columns: PlanColumns; creators: PlanCreator[] };

/** The builder's columns that can be removed (Name always stays). */
export const PLAN_COLUMNS: [key: string, label: string][] = [
  ["tier", "Tier"], ["category", "Category"], ["ig", "IG link"], ["followers", "Followers"], ["avgViews", "Avg views"], ["er", "ER %"], ["location", "Location"], ["reachout", "Reach-out"],
  ["reelCost", "Cost: 1 IG Reel"], ["storyCost", "Cost: Story + LIB"], ["dlCost", "Cost: DL (1 month)"], ["reelPrice", "Price: 1 IG Reel"], ["storyPrice", "Price: Story + LIB"], ["dlPrice", "Price: DL (1 month)"],
  ["profit", "Profit"], ["phone", "Phone"], ["email", "Email"], ["remarks", "Remarks"],
];

export const DEFAULT_NOTES = [
  "The cost is inclusive of the basic production, which will be taken care of by the creator's team, creatively managed by Genesis Media.",
  "Based on the costs shared, one round of changes has been accounted for. Beyond that, each round will be charged additionally.",
  "This idea breakout & rights is with Genesis Media; using this idea or reaching out to influencers without approval is strictly prohibited.",
  "If there is any additional requirement, a revised estimate will be shared. A sales order corresponding to the estimate has to be submitted to commence work.",
  "The product has to be provided and delivered by the client.",
  "Any content shot by the influencers falls under the purview of the ASCI guidelines (14 June 2021).",
  "The mentioned cost is exclusive of GST.",
  "Payment terms: 50% advance and 50% before the video/deliverables go live.",
];

/** Tiers as Genesis groups them on a plan. */
export const tierOf = (followers: number) => (followers < 100_000 ? "Nano & Micro\n5k–100k" : "Macro & Mega\n100k+");
const k = (n: number) => (n >= 1e5 ? `${Math.round(n / 1e4) / 10 >= 10 ? Math.round(n / 1e5) * 100 : Math.round(n / 1e3)}k` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const sum = (xs: (number | null | undefined)[]) => xs.reduce<number>((s, v) => s + (v ?? 0), 0);

type Row = Omit<PlanCreator, "tier"> & { tier: string; category: string; ig: string; cost: (number | null)[]; price: (number | null)[]; profit: number };
export type Col = { key: string; header: string; width: number; money?: boolean; group?: "cost" | "price"; value: (r: Row) => Cell };

const cols = (xs: Col[]) => xs;

export function planTables(p: PlanInput) {
  const hidden = new Set(p.columns.hidden ?? []);
  const prices = showsBrandPrices(p.columns);
  const custom = (p.columns.custom ?? []).filter(Boolean);
  const rows: Row[] = [...p.creators]
    .sort((a, b) => a.followers - b.followers)
    .map((c) => {
      const cost = [c.reelCost ?? null, c.storyCost ?? null, c.dlCost ?? null];
      const price = [c.reelPrice ?? null, c.storyPrice ?? null, c.dlPrice ?? null];
      return { ...c, tier: c.tier?.trim() || tierOf(c.followers), category: c.niches.join(" & "), ig: c.profileUrl ?? (c.platform === "INSTAGRAM" ? `https://www.instagram.com/${c.handle}` : ""), cost, price, profit: sum(price) - sum(cost) };
    });
  const show = (key: string) => !hidden.has(key);
  const extras: Col[] = custom.map((name) => ({ key: `x:${name}`, header: name, width: 160, value: (r) => r.extra?.[name] ?? "" }));
  const pct = (r: Row) => (r.er === null || r.er === undefined ? null : `${r.er}%`);

  const extCols: Col[] = cols([
    { key: "tier", header: "Tier", width: 130, value: (r) => r.tier },
    { key: "name", header: "Name", width: 190, value: (r) => r.name },
    { key: "category", header: "Category", width: 190, value: (r) => r.category },
    { key: "ig", header: "IG Link", width: 260, value: (r) => r.ig },
    { key: "followers", header: "Followers", width: 90, value: (r) => r.followers },
    { key: "avgViews", header: "Avg Views", width: 90, value: (r) => r.avgViews ?? null },
    { key: "er", header: "ER", width: 60, value: pct },
    { key: "reelPrice", header: "1 IG Reel", width: 100, money: true, value: (r) => r.price[0]! },
    { key: "storyPrice", header: "Story + LIB", width: 100, money: true, value: (r) => r.price[1]! },
    { key: "dlPrice", header: "DL (1 month)", width: 110, money: true, value: (r) => r.price[2]! },
    { key: "location", header: "Location", width: 120, value: (r) => r.city ?? "" },
  ]).filter((c) => c.key === "name" || (show(c.key) && (prices || !c.money)));
  const intOnly = new Set(p.columns.intOnly ?? []);
  extCols.push(...extras.filter((c) => !intOnly.has(c.header)));

  const intCols: Col[] = cols([
    { key: "reachout", header: "Reachout Status", width: 130, value: (r) => r.reachout ?? "" },
    { key: "name", header: "Name", width: 190, value: (r) => r.name },
    { key: "category", header: "Category", width: 170, value: (r) => r.category },
    { key: "ig", header: "IG Link", width: 240, value: (r) => r.ig },
    { key: "yt", header: "YT Link", width: 200, value: (r) => r.yt ?? "" },
    { key: "followers", header: "Followers", width: 90, value: (r) => r.followers },
    { key: "avgViews", header: "Avg Views", width: 90, value: (r) => r.avgViews ?? null },
    { key: "er", header: "ER", width: 60, value: pct },
    { key: "reelCost", header: "1 IG Reel", width: 100, money: true, group: "cost", value: (r) => r.cost[0]! },
    { key: "storyCost", header: "Story + LIB", width: 100, money: true, group: "cost", value: (r) => r.cost[1]! },
    { key: "dlCost", header: "DL (1 month)", width: 110, money: true, group: "cost", value: (r) => r.cost[2]! },
    { key: "phone", header: "Phone", width: 160, value: (r) => r.phone ?? "" },
    { key: "email", header: "Email", width: 220, value: (r) => r.email ?? "" },
    { key: "location", header: "Location", width: 120, value: (r) => r.city ?? "" },
    { key: "profit", header: "Profit", width: 100, money: true, value: (r) => r.profit },
    { key: "reelPrice", header: "1 IG Reel", width: 100, money: true, group: "price", value: (r) => r.price[0]! },
    { key: "storyPrice", header: "Story + LIB", width: 100, money: true, group: "price", value: (r) => r.price[1]! },
    { key: "dlPrice", header: "DL (1 month)", width: 110, money: true, group: "price", value: (r) => r.price[2]! },
    { key: "remarks", header: "Remarks", width: 200, value: (r) => r.remarks ?? "" },
  ]).filter((c) => ["name", "yt"].includes(c.key) || show(c.key));
  intCols.push(...extras);

  const extHeader: Cell[] = extCols.map((c) => c.header);
  const extRows: Cell[][] = rows.map((r) => extCols.map((c) => c.value(r)));
  const intHeader1: Cell[] = intCols.map((c, i) => (c.group && intCols[i - 1]?.group !== c.group ? (c.group === "cost" ? "Creator cost" : "Client price") : ""));
  const intHeader: Cell[] = intCols.map((c) => c.header);
  const intRows: Cell[][] = rows.map((r) => intCols.map((c) => c.value(r)));
  const intTotals: Cell[] = intCols.map((c, i) => (i === 0 ? "Total" : c.key === "name" ? `${rows.length} creators` : c.money ? sum(rows.map((r) => c.value(r) as number | null)) : ""));
  const groups = (["cost", "price"] as const)
    .map((g) => ({ g, start: intCols.findIndex((c) => c.group === g), end: intCols.length - [...intCols].reverse().findIndex((c) => c.group === g) }))
    .filter((x) => x.start >= 0);

  const disclaimer: Cell[][] = prices
    ? [[], ["Disclaimer:"], ["*These are tentative costs; final costs will be confirmed after creator confirmation."], ["*This idea breakout & rights is with Genesis Media; using this idea or reaching out to influencers without approval is strictly prohibited."], ["*The total outlay for this execution will be the creator costs above + 15% agency fee + GST."]]
    : [[], ["Disclaimer:"], ["*A sample of creators for this brief; availability and costs are confirmed on approval."], ["*This idea breakout & rights is with Genesis Media; using this idea or reaching out to influencers without approval is strictly prohibited."]];
  const cities = [...new Set(rows.map((r) => r.city).filter(Boolean))] as string[];
  const categories = [...new Set(rows.flatMap((r) => r.niches))].filter(Boolean);
  const followers = rows.map((r) => r.followers).filter((n) => n > 0);
  const notes = (p.terms ?? "").split("\n").map((t) => t.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  /*
   * THE SUMMARY, AS GENESIS LAYS IT OUT (Genesis, 26 Oct 2026, the Sun Pharma
   * plan): an Overview table, then "Please Note - Terms & Conditions",
   * numbered. Label in column B, value in C; the sheet adds the logo above.
   */
  const overview: Cell[][] = [
    [null, "Overview"],
    [null, "Project Name:", p.title],
    [null, "Number of influencers/Talent:", rows.length],
    [null, "Follower Range:", followers.length ? `${k(Math.min(...followers))} - ${k(Math.max(...followers))}` : ""],
    [null, "Region:", cities.join(", ")],
    [null, "Category of Influencers:", categories.slice(0, 10).join(", ")],
    [null, "Budget:", p.planBudget ?? "As per Brand"],
    ...(prices ? [[null, "*The total outlay for this execution will be 15% Agency fee + GST*"] as Cell[]] : []),
  ];
  const terms: Cell[][] = [[null, "Please Note - Terms & Conditions"], ...(notes.length ? notes : DEFAULT_NOTES).map((n, i) => [null, `${i + 1}. ${n}`] as Cell[])];
  const summary: Cell[][] = [...overview, [], [], ...terms];
  const summaryLayout = { overview: overview.length, termsStart: overview.length + 2, terms: terms.length };
  return { rows, summary, summaryLayout, ext: { cols: extCols, header: extHeader, rows: extRows, disclaimer }, int: { cols: intCols, header1: intHeader1, header: intHeader, rows: intRows, totals: intTotals, groups } };
}

/** The two workbooks as sheets of rows (for the Excel downloads). */
export function planWorkbooks(p: PlanInput) {
  const t = planTables(p);
  return {
    ext: [
      { name: "Summary", rows: [[], ...t.summary] as Cell[][] },
      { name: "Influencer Plan", rows: [t.ext.header, ...t.ext.rows, ...t.ext.disclaimer] },
    ],
    int: [
      { name: "INT", rows: [t.int.cols.map((c) => (c.group ? `${c.group === "cost" ? "Cost" : "Price"}: ${c.header}` : c.header)), ...t.int.rows, t.int.totals] },
      { name: "EXT", rows: [t.ext.header, ...t.ext.rows] },
    ],
  };
}
