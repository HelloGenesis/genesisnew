/**
 * AN EXCEL OR CSV STRAIGHT ONTO A PLAN, COLUMN FOR COLUMN (Genesis, 27 Oct
 * 2026: "when any Excel sheet is uploaded it misses out on some things; make
 * sure it adds the correct data in the correct column").
 *
 * The influencer database's matching (the AI, or plain names) says which
 * columns are the creator's details; on top of that, each column is placed on
 * the plan: creator cost or client price (told apart by words like "cost",
 * "rate", "client", "price"), reach-out, remarks, contact, and every other
 * column as an added plan column, so nothing in the file is lost. The plan
 * row takes the file's values; the database only fills what the file leaves
 * empty. Pure: used by the import action and its tests.
 */

export type PlanTarget =
  | "name" | "handle" | "profileUrl" | "platform" | "followers" | "avgViews" | "er" | "niches" | "city"
  | "reelCost" | "storyCost" | "dlCost" | "reelPrice" | "storyPrice" | "dlPrice"
  | "reachout" | "remarks" | "contact" | "skip" | `col:${string}`;

export const TARGET_LABEL: Record<string, string> = {
  name: "Name", handle: "Handle", profileUrl: "IG link", platform: "Platform", followers: "Followers", avgViews: "Avg views", er: "ER %", niches: "Category", city: "Location",
  reelCost: "Cost: 1 IG Reel", storyCost: "Cost: Story + LIB", dlCost: "Cost: DL", reelPrice: "Price: 1 IG Reel", storyPrice: "Price: Story + LIB", dlPrice: "Price: DL",
  reachout: "Reach-out", remarks: "Remarks", contact: "Contact", skip: "Not used",
};
export const targetLabel = (t: string) => (t.startsWith("col:") ? `New column "${t.slice(4)}"` : (TARGET_LABEL[t] ?? t));

/* The influencer database's fields → the plan's. */
const FROM_DB: Record<string, PlanTarget> = {
  name: "name", handle: "handle", profileUrl: "profileUrl", platform: "platform", followers: "followers", avgViews: "avgViews", engagementRate: "er", niches: "niches", city: "city",
  reelRate: "reelCost", storyRate: "storyCost", dlRate: "dlCost", phone: "contact", email: "contact", managedBy: "contact", pocName: "contact", pocContact: "contact", notes: "remarks",
};

const PRICE_WORDS = /\b(client|brand|price|selling|quoted|quote|sp)\b/i;
const COST_WORDS = /\b(cost|rate|creator|payout|commercial|charges?|fees?)\b/i;
const kindOf = (h: string): "reel" | "story" | "dl" | null => (/\breels?\b|\bpost\b|\bvideo\b/i.test(h) ? "reel" : /\bstor(y|ies)\b|\blib\b|link in bio/i.test(h) ? "story" : /\bdl\b|licen[cs]|usage|rights/i.test(h) ? "dl" : null);
const SKIP = /^(s\.?\s*no\.?|sr\.?\s*no\.?|#|no\.?|tier|profit|total|margin)$/i;
/* The usual names for a creator's details, so a file is read right even without the AI (and the CRM's own Excel always is). */
const BASIC: [RegExp, PlanTarget][] = [
  [/^(creator|influencer|talent|celebrity|full)?\s*name$/i, "name"],
  [/^(ig|insta(gram)?|yt|youtube)?\s*(handle|username|user\s*name|@)$/i, "handle"],
  [/^((ig|insta(gram)?|profile|yt|youtube|channel)\s*)?(link|url|profile)$/i, "profileUrl"],
  [/^platform$/i, "platform"],
  [/^(followers?|follower count|subscribers?|reach)$/i, "followers"],
  [/^(avg\.?|average)\s*views?$/i, "avgViews"],
  [/^(er|engagement)(\s*rate)?\s*%?$/i, "er"],
  [/^(category|categories|niche|niches|genre|vertical)$/i, "niches"],
  [/^(location|city|region|state)$/i, "city"],
];

/** Where each column of the file goes on the plan. `db` is the influencer-database mapping (header → field). */
export function planTargets(headers: string[], db: Record<string, string>): Record<string, PlanTarget> {
  const out: Record<string, PlanTarget> = {};
  const taken = new Set<string>();
  for (const raw of headers) {
    const h = raw.trim();
    if (!h) continue;
    let t: PlanTarget | undefined;
    const kind = kindOf(h);
    /* Money for a deliverable: a client price, or the creator's cost. */
    if (/reach\s*-?\s*out/i.test(h)) t = "reachout";
    else if (kind && PRICE_WORDS.test(h) && !/\bcost\b/i.test(h)) t = `${kind}Price` as PlanTarget;
    else if (kind && (COST_WORDS.test(h) || db[raw] === `${kind}Rate`)) t = `${kind}Cost` as PlanTarget;
    /* A money column for no deliverable in particular ("Tentative Cost"): its own column, text kept; plain "Rate" / "Commercials" is the reel cost. */
    else if (BASIC.some(([re]) => re.test(h))) t = BASIC.find(([re]) => re.test(h))![1];
    else if (/Rate$/.test(db[raw] ?? "") && !/^(rate|rates|cost|commercials?|charges?|fees?|creator (rate|cost))$/i.test(h)) t = `col:${h.slice(0, 60)}` as PlanTarget;
    else if (db[raw] && FROM_DB[db[raw]!]) t = FROM_DB[db[raw]!];
    else if (/reach\s*-?\s*out|status/i.test(h)) t = "reachout";
    else if (/remark|comment|note/i.test(h)) t = "remarks";
    else if (/^(contact|phone|mobile|whats\s*app|e-?mail|manager|agency|poc)/i.test(h)) t = "contact";
    else if (SKIP.test(h)) t = "skip";
    else if (kind && !db[raw]) t = `${kind}Cost` as PlanTarget;
    /* Two columns for one field (two "Contact"s): contact and remarks gather, the rest take the first. */
    if (t && !t.startsWith("col:") && t !== "contact" && t !== "remarks" && t !== "skip" && taken.has(t)) t = undefined;
    out[raw] = t ?? (`col:${h.slice(0, 60)}` as PlanTarget);
    if (t) taken.add(t);
  }
  return out;
}

/** "₹18,00,000 +++", "1.2L", "45K", "2,50,000/-": a number; "Awaiting quote" or a range: none. */
export function amount(v: string | null | undefined): number | null {
  if (!v) return null;
  const s = String(v).replace(/[₹,\s]/g, "").toLowerCase();
  const m = s.match(/^(?:rs\.?|inr)?([\d]+(?:\.\d+)?)(k|l|lac|lakh|lakhs|m|mn|cr|crore|crores)?(?![a-z])/);
  if (!m) return null;
  /* A range or two amounts ("₹50,000–₹75,000"): kept as words, not cut to the first. */
  if (/\d/.test(s.slice(m[0].length))) return null;
  const n = Number(m[1]);
  const mult = { k: 1e3, l: 1e5, lac: 1e5, lakh: 1e5, lakhs: 1e5, m: 1e6, mn: 1e6, cr: 1e7, crore: 1e7, crores: 1e7 }[m[2] ?? ""] ?? 1;
  return Number.isFinite(n) ? n * mult : null;
}

export const handleFrom = (url?: string | null, handle?: string | null) =>
  ((handle ?? "").replace(/^@/, "").trim() || url?.match(/(?:instagram\.com|youtube\.com\/@?|x\.com|twitter\.com|linkedin\.com\/in)\/?@?([A-Za-z0-9._-]+)/i)?.[1] || "").toLowerCase();

export type FileRow = {
  name: string; handle: string; platform: string; profileUrl: string | null;
  followers: number | null; avgViews: number | null; er: number | null; niches: string[] | null; city: string | null;
  reelCost: number | null; storyCost: number | null; dlCost: number | null; reelPrice: number | null; storyPrice: number | null; dlPrice: number | null;
  reachout: string | null; remarks: string | null; contact: string | null; extra: Record<string, string>;
};

/** Each row of the file as a plan row, in the file's order. Rows with no name, handle or link are left out. */
export function fileRows(headers: string[], rows: string[][], targets: Record<string, PlanTarget>): FileRow[] {
  const out: FileRow[] = [];
  for (const r of rows) {
    const get = (t: PlanTarget) => headers.map((h, i) => (targets[h] === t ? String(r[i] ?? "").trim() : "")).filter(Boolean);
    const one = (t: PlanTarget) => get(t)[0] ?? null;
    const url = one("profileUrl");
    const handle = handleFrom(url, one("handle"));
    const name = one("name") ?? (handle || null);
    if (!name) continue;
    const money = (t: PlanTarget) => amount(one(t));
    const count = (t: PlanTarget) => {
      const n = amount(one(t));
      return n === null ? null : Math.round(n);
    };
    const er = one("er");
    /* Words in a cost or price cell ("Awaiting quote", "Included in ₹75K package"): kept in the remarks, not lost. */
    const notes = (["reelCost", "storyCost", "dlCost", "reelPrice", "storyPrice", "dlPrice"] as const)
      .map((t) => [t, one(t)] as const)
      .filter(([, v]) => v && amount(v) === null)
      .map(([t, v]) => `${TARGET_LABEL[t]}: ${v}`);
    const extra: Record<string, string> = {};
    headers.forEach((h, i) => {
      const t = targets[h];
      if (t?.startsWith("col:")) extra[t.slice(4)] = String(r[i] ?? "").trim();
    });
    out.push({
      name,
      handle: handle || name.toLowerCase().replace(/[^a-z0-9._]+/g, ""),
      platform: (one("platform") ?? (url && /youtube/i.test(url) ? "youtube" : "instagram")).toUpperCase().includes("YOU") ? "YOUTUBE" : "INSTAGRAM",
      profileUrl: url && /^https?:\/\//i.test(url) ? url : url ? `https://${url.replace(/^\/+/, "")}` : null,
      followers: count("followers"),
      avgViews: count("avgViews"),
      er: er ? Number(er.replace(/%/g, "").trim()) || null : null,
      niches: one("niches") ? one("niches")!.split(/\s*(?:,|&|\/|\|)\s*/).filter(Boolean).slice(0, 12) : null,
      city: one("city"),
      reelCost: money("reelCost"), storyCost: money("storyCost"), dlCost: money("dlCost"),
      reelPrice: money("reelPrice"), storyPrice: money("storyPrice"), dlPrice: money("dlPrice"),
      reachout: one("reachout"),
      remarks: [...get("remarks"), ...notes].join(" · ") || null,
      contact: get("contact").join(" · ") || null,
      extra,
    });
  }
  return out;
}
