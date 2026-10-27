import "server-only";

import { z } from "zod";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Platform } from "@/lib/generated/prisma/enums";

import { tierFor } from "./catalog";
import { contactVisibility } from "./creator-privacy";
import { tidyNiches } from "./niches";
import { appUrl } from "./notify";
import { amount, handleFrom } from "./plan-import";
import { makePlanSheets } from "./plan-sheets";
import { SheetEditedError } from "./plan-sync";
import { newToken, refreshTotals } from "./quotes";
import { quoteRef, termsByKey } from "./quote-templates";
import { tidyEmails, tidyPhones } from "./creator-contacts";
import { lastReaches, recordReach, syncPlanContacts } from "./reachout";
import { REACH_STATUSES } from "./reachout-status";
import { creatorAccess, creatorScope, quoteScope, seesCreators, seesQuoteContact } from "./scope";
import { can, type Viewer } from "./session";

/**
 * THE CRM'S TOOLS FOR CHATGPT AND CLAUDE (Genesis, 27 Oct 2026: "a chatbox
 * AI… where I can add screenshots or upload an Excel sheet or agency roster
 * PDFs and they'll be arranged and updated, in sync both ways, so influencer
 * plans are accurate just by giving prompts… from my ChatGPT so I don't have
 * to pay extra").
 *
 * The AI reads the screenshots, sheets and PDFs itself and calls these to
 * find creators in the database and to make and update plans, creators,
 * contacts, rates and reach-outs. Each call runs as the person whose link it
 * is, with the same rules as the CRM's own pages; it can add and update but
 * never delete, and never sends anything to anyone.
 */

/** How to use the tools well: sent to ChatGPT / Claude on connecting, and the CRM's own assistant's brief (lib/crm/assistant). */
export const CRM_INSTRUCTIONS = `You are connected to Genesis Media's CRM: its influencer database and influencer plans.
- To build or update a plan from screenshots, an Excel/CSV, a Google Sheet or an agency roster PDF: read every row yourself, then call create_plan or update_plan with one row per creator. Keep every detail: name, handle or profile link (write links as plain URLs), followers, avg views, ER, category, city, phone, email, agency, the creator's costs (reel_cost / story_cost / dl_cost) and, separately, client prices (reel_price / story_price / dl_price), reach-out status, remarks. Anything else goes in "columns" under its own heading (e.g. "Tentative Cost", "Deliverables"). Words or ranges in a money cell ("Awaiting quote", "₹50K–75K") go in remarks or a column, never as a number.
- Before adding a creator, search_influencers to reuse the CRM's entry; check last_reach_out so nobody is contacted twice. Record reach-outs with log_reachout.
- Agency rosters: save_influencers with source like "Agency roster · <agency>, <month>" and the agency in "agency".
- After changing a plan, update_plan_sheets keeps its Google Sheets in step. Always give the user the plan's link.
- Rupee amounts are plain numbers (180000 for ₹1.8L). Nothing can be deleted through these tools.`;

type Tool = { name: string; description: string; input: z.ZodType; readOnly?: boolean; run: (viewer: Viewer, args: never) => Promise<unknown> };

const r = (paise: number | null | undefined) => (paise === null || paise === undefined ? null : paise / 100);
const toPaise = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : amount(v);
  return n === null ? null : Math.round(n * 100);
};
const count = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : amount(v);
  return n === null ? null : Math.round(n);
};
const PLATFORMS = ["INSTAGRAM", "YOUTUBE", "LINKEDIN", "X", "FACEBOOK", "MOJ", "JOSH", "SNAPCHAT", "OTHER"] as const;
const platformOf = (p: string | null | undefined, url: string | null | undefined): Platform => {
  const up = (p ?? "").toUpperCase();
  if ((PLATFORMS as readonly string[]).includes(up)) return up as Platform;
  return url && /youtube/i.test(url) ? "YOUTUBE" : "INSTAGRAM";
};
const planLink = (id: string) => appUrl(`/admin/quotes/${id}`);

/* --- Shapes the AI reads ---------------------------------------------------- */

type CreatorRow = Prisma.CreatorGetPayload<object>;
function creatorOut(c: CreatorRow, showContact: boolean, last?: { status: string; at: string; by: string | null; plan: string | null }) {
  return {
    id: c.id, name: c.name, handle: c.handle, platform: c.platform, profile_url: c.profileUrl, followers: c.followers, avg_views: c.avgViews, er: c.engagementRate,
    tier: c.tier, category: c.niches, languages: c.languages, city: c.city, gender: c.gender,
    rates: { reel: r(c.reelRatePaise), story: r(c.storyRatePaise), dl_1_month: r(c.dlRatePaise), post: r(c.postRatePaise) },
    phone: showContact ? c.phone : undefined, email: showContact ? c.email : undefined,
    agency: c.managedBy, poc_name: showContact ? c.pocName : undefined, poc_contact: showContact ? c.pocContact : undefined,
    source: c.source, last_reach_out: last ?? null,
    link: appUrl(`/admin/creators/${c.id}`),
  };
}

/* --- Inputs ---------------------------------------------------------------- */

const money = z.union([z.number(), z.string()]).nullable().optional();
const influencerInput = z.object({
  id: z.string().optional().describe("The CRM id, to update a known creator."),
  name: z.string().min(1).max(120),
  handle: z.string().max(80).optional().describe("Instagram/YouTube handle, without @."),
  profile_url: z.string().max(300).optional(),
  platform: z.string().optional(),
  followers: z.union([z.number(), z.string()]).optional().describe("A number, or like 84K / 1.2M."),
  avg_views: z.union([z.number(), z.string()]).optional(),
  er: z.number().optional().describe("Engagement rate in percent, e.g. 3.4."),
  category: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  city: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().max(300).optional().describe("Phone number(s); more than one comma-separated. Added to the ones already saved."),
  email: z.string().max(500).optional().describe("Email(s); more than one comma-separated. Added to the ones already saved."),
  agency: z.string().max(160).optional().describe("Agency or manager who represents them."),
  poc_name: z.string().max(120).optional(),
  poc_contact: z.string().max(160).optional(),
  reel_rate: money.describe("The creator's own rate (our cost) in rupees."),
  story_rate: money,
  dl_rate: money.describe("Digital licensing, 1 month, in rupees."),
  source: z.string().max(160).optional().describe("Where they came from, e.g. 'Agency roster PDF · Collective, Oct 2026'."),
  notes: z.string().max(2000).optional(),
});
type InfluencerIn = z.infer<typeof influencerInput>;

const planRow = z.object({
  name: z.string().min(1).max(120),
  handle: z.string().max(80).optional(),
  profile_url: z.string().max(300).optional(),
  platform: z.string().optional(),
  followers: z.union([z.number(), z.string()]).optional(),
  avg_views: z.union([z.number(), z.string()]).optional(),
  er: z.number().optional(),
  category: z.union([z.array(z.string()), z.string()]).optional(),
  city: z.string().optional(),
  deliverables: z.string().max(300).optional(),
  reel_cost: money.describe("Creator's cost to us, rupees."),
  story_cost: money,
  dl_cost: money,
  reel_price: money.describe("Client's price, rupees. Left empty: cost + the plan's markup."),
  story_price: money,
  dl_price: money,
  reach_out: z.string().max(60).optional().describe(`Status: ${REACH_STATUSES.join(", ")}.`),
  phone: z.string().max(300).optional().describe("Phone number(s); more than one comma-separated. Added to the ones already saved."),
  email: z.string().max(500).optional().describe("Email(s); more than one comma-separated. Added to the ones already saved."),
  contact: z.string().max(300).optional().describe("Anything else about reaching them, e.g. the agency; goes into the remarks."),
  remarks: z.string().max(2000).optional(),
  columns: z.record(z.string(), z.string()).optional().describe("Values for the plan's own added columns, by column name (e.g. 'Tentative Cost', 'Deliverables')."),
});
type PlanRowIn = z.infer<typeof planRow>;

/* --- Creators -------------------------------------------------------------- */

/** Finds or makes the database entry for a creator, as this person may. Fills what's given; `overwrite` replaces what's there. */
async function saveCreator(viewer: Viewer, x: InfluencerIn | (PlanRowIn & { id?: string }), overwrite: boolean): Promise<{ id: string | null; action: "created" | "updated" | "unchanged" | "skipped"; reason?: string }> {
  const access = creatorAccess(viewer);
  if (access === "none") return { id: null, action: "skipped", reason: "No access to the influencer database." };
  const prisma = getPrisma();
  const url = x.profile_url?.trim() || null;
  const handle = handleFrom(url, x.handle) || null;
  const platform = platformOf(x.platform, url);
  const existing = x.id
    ? await prisma.creator.findFirst({ where: { id: x.id } })
    : handle
      ? await prisma.creator.findFirst({ where: { platform, handle } })
      : await prisma.creator.findFirst({ where: { name: { equals: x.name.trim(), mode: "insensitive" } } });
  const followers = count(x.followers);
  const niches = Array.isArray(x.category) ? x.category : typeof x.category === "string" ? x.category.split(/\s*[,&/|]\s*/) : undefined;
  const isInfluencer = "reel_rate" in x || "agency" in x || "source" in x || "notes" in x;
  const inf = x as InfluencerIn;
  const data: Prisma.CreatorUncheckedUpdateInput = {
    name: x.name.trim().slice(0, 120),
    ...(url ? { profileUrl: /^https?:\/\//i.test(url) ? url : `https://${url}` } : {}),
    ...(followers !== null ? { followers, tier: tierFor(followers) } : {}),
    ...(count(x.avg_views) !== null ? { avgViews: count(x.avg_views) } : {}),
    ...(typeof x.er === "number" ? { engagementRate: x.er } : {}),
    ...(niches?.length ? { niches: tidyNiches(niches) } : {}),
    ...(x.city ? { city: x.city } : {}),
    /* Added to the numbers and emails already saved, never replacing them (lib/crm/contacts). */
    ...(tidyPhones(x.phone) ? { phone: tidyPhones([existing?.phone, x.phone].filter(Boolean).join(", ")) } : {}),
    ...(tidyEmails(x.email) ? { email: tidyEmails([existing?.email, x.email].filter(Boolean).join(", ")) } : {}),
    ...(isInfluencer && inf.languages?.length ? { languages: inf.languages } : {}),
    ...(isInfluencer && inf.gender ? { gender: inf.gender } : {}),
    ...(isInfluencer && inf.agency ? { managedBy: inf.agency } : {}),
    ...(isInfluencer && inf.poc_name ? { pocName: inf.poc_name } : {}),
    ...(isInfluencer && inf.poc_contact ? { pocContact: inf.poc_contact } : {}),
    ...(isInfluencer && toPaise(inf.reel_rate) !== null ? { reelRatePaise: toPaise(inf.reel_rate) } : {}),
    ...(isInfluencer && toPaise(inf.story_rate) !== null ? { storyRatePaise: toPaise(inf.story_rate) } : {}),
    ...(isInfluencer && toPaise(inf.dl_rate) !== null ? { dlRatePaise: toPaise(inf.dl_rate) } : {}),
    ...(isInfluencer && inf.notes ? { notes: inf.notes } : {}),
  };
  if (existing) {
    /* Someone with "only what they add" may update only their own. */
    if (access === "own" && existing.createdById !== viewer.id) return { id: existing.id, action: "skipped", reason: "Added by someone else; you can't change it." };
    const patch = overwrite
      ? data
      : Object.fromEntries(Object.entries(data).filter(([k]) => {
          const cur = (existing as Record<string, unknown>)[k];
          /* Filling gaps; followers and contacts always take the newer value. */
          return ["followers", "tier", "phone", "email"].includes(k) || cur === null || cur === undefined || cur === "" || (Array.isArray(cur) && cur.length === 0);
        }).filter(([k, v]) => k !== "name" && v !== undefined));
    if (!Object.keys(patch).length) return { id: existing.id, action: "unchanged" };
    await prisma.creator.update({ where: { id: existing.id }, data: patch });
    if ("phone" in patch || "email" in patch) await syncPlanContacts(existing.id);
    return { id: existing.id, action: "updated" };
  }
  const made = await prisma.creator.create({
    data: {
      ...(data as Prisma.CreatorUncheckedCreateInput),
      name: x.name.trim().slice(0, 120),
      handle: handle ?? x.name.toLowerCase().replace(/[^a-z0-9._]+/g, "").slice(0, 80),
      platform,
      followers: followers ?? 0,
      tier: tierFor(followers ?? 0),
      source: (isInfluencer && inf.source) || "Added from ChatGPT",
      createdById: viewer.id,
    },
  });
  return { id: made.id, action: "created" };
}

/* --- Plans ----------------------------------------------------------------- */

async function planFor(viewer: Viewer, ref: string) {
  if (!can(viewer, "plans")) throw new Error("You don't have access to plans.");
  const n = Number(ref.replace(/^#?0*/, ""));
  const q = await getPrisma().quote.findFirst({ where: { AND: [quoteScope(viewer), Number.isInteger(n) && n > 0 && /^#?\d+$/.test(ref) ? { number: n } : { id: ref }] }, include: { creators: { orderBy: { position: "asc" } } } });
  if (!q) throw new Error("No plan with that id or number that you can open.");
  return q;
}

async function planOut(viewer: Viewer, id: string) {
  const prisma = getPrisma();
  const q = await prisma.quote.findUniqueOrThrow({ where: { id }, include: { creators: { orderBy: { position: "asc" } }, lead: { select: { ownerId: true, createdById: true } } } });
  const visible = await contactVisibility(viewer, q, q.creators.map((c) => c.creatorId));
  const showClient = seesQuoteContact(viewer, q);
  const cols = (q.planColumns ?? {}) as { custom?: string[]; intOnly?: string[] };
  const lasts = await lastReaches(q.creators.map((c) => c.creatorId));
  return {
    id: q.id, number: quoteRef(q.number), kind: q.kind, title: q.title, status: q.status, company: q.company,
    client_contact: showClient ? { name: q.contactName, email: q.contactEmail, phone: q.contactPhone } : "private",
    markup_percent: q.markupPercent, budget_line: q.planBudget, added_columns: cols.custom ?? [], internal_only_columns: cols.intOnly ?? [],
    link: planLink(q.id), client_view: appUrl(`/quote/${q.token}`),
    google_sheets: { external: q.extSheetId ? `https://docs.google.com/spreadsheets/d/${q.extSheetId}/edit` : null, internal: q.intSheetId ? `https://docs.google.com/spreadsheets/d/${q.intSheetId}/edit` : null },
    total_to_client: r(q.totalPaise),
    creators: q.creators.map((c) => ({
      name: c.name, handle: c.handle, platform: c.platform, profile_url: c.profileUrl, followers: c.followers, avg_views: c.avgViews, er: c.engagementRate, category: c.niches, city: c.city,
      cost: { reel: r(c.reelCostPaise), story: r(c.storyCostPaise), dl: r(c.dlCostPaise) },
      price: { reel: r(c.reelPricePaise), story: r(c.storyPricePaise), dl: r(c.dlPricePaise) },
      reach_out: c.reachout, phone: visible(c) ? c.phone : "private", email: visible(c) ? c.email : "private", tier: c.tier, remarks: c.remarks, columns: c.extra,
      in_database: Boolean(c.creatorId), last_reach_out: c.creatorId ? (lasts[c.creatorId] ?? null) : null,
    })),
  };
}

/** Rows onto a plan: matched by handle, else name, and updated; the rest added. Nothing is removed. */
async function writeRows(viewer: Viewer, quoteId: string, rows: PlanRowIn[]) {
  const prisma = getPrisma();
  const q = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { creators: { orderBy: { position: "asc" } } } });
  const visible = await contactVisibility(viewer, q, q.creators.map((c) => c.creatorId));
  const up = (cost: number | null) => (cost === null ? null : Math.round(cost * (1 + (q.markupPercent ?? 30) / 100)));
  const custom = new Set(((q.planColumns ?? {}) as { custom?: string[] }).custom ?? []);
  let added = 0;
  let updated = 0;
  const notes: string[] = [];
  let position = q.creators.length;
  for (const row of rows) {
    const handle = handleFrom(row.profile_url, row.handle);
    const was = q.creators.find((c) => (handle && c.handle.toLowerCase() === handle) || c.name.trim().toLowerCase() === row.name.trim().toLowerCase());
    /* The influencer database too: what's added on a plan is saved there. */
    const saved = await saveCreator(viewer, row, false);
    if (saved.reason) notes.push(`${row.name}: ${saved.reason}`);
    const cost = { reel: toPaise(row.reel_cost), story: toPaise(row.story_cost), dl: toPaise(row.dl_cost) };
    const price = { reel: toPaise(row.reel_price), story: toPaise(row.story_price), dl: toPaise(row.dl_price) };
    const niches = Array.isArray(row.category) ? row.category : row.category ? row.category.split(/\s*[,&/|]\s*/) : undefined;
    for (const k of Object.keys(row.columns ?? {})) custom.add(k);
    const mayContact = was ? visible(was) : true;
    const data = {
      name: row.name.trim().slice(0, 120),
      ...(handle ? { handle } : {}),
      ...(row.profile_url ? { profileUrl: row.profile_url } : {}),
      ...(count(row.followers) !== null ? { followers: count(row.followers)! } : {}),
      ...(count(row.avg_views) !== null ? { avgViews: count(row.avg_views) } : {}),
      ...(typeof row.er === "number" ? { engagementRate: row.er } : {}),
      ...(niches?.length ? { niches } : {}),
      ...(row.city ? { city: row.city } : {}),
      ...(row.deliverables ? { deliverables: row.deliverables } : {}),
      ...(cost.reel !== null ? { reelCostPaise: cost.reel } : {}),
      ...(cost.story !== null ? { storyCostPaise: cost.story } : {}),
      ...(cost.dl !== null ? { dlCostPaise: cost.dl } : {}),
      ...(price.reel !== null || cost.reel !== null ? { reelPricePaise: price.reel ?? up(cost.reel) } : {}),
      ...(price.story !== null || cost.story !== null ? { storyPricePaise: price.story ?? up(cost.story) } : {}),
      ...(price.dl !== null || cost.dl !== null ? { dlPricePaise: price.dl ?? up(cost.dl) } : {}),
      ...(row.reach_out ? { reachout: row.reach_out.slice(0, 60) } : {}),
      ...(row.remarks || row.contact ? { remarks: [row.remarks ?? was?.remarks, row.contact].filter(Boolean).join(" · ") } : {}),
      /* Numbers and emails added to the row's (and so to the database's: saveCreator above), where this person may see them. */
      ...(tidyPhones(row.phone) && mayContact ? { phone: tidyPhones([was?.phone, row.phone].filter(Boolean).join(", ")) } : {}),
      ...(tidyEmails(row.email) && mayContact ? { email: tidyEmails([was?.email, row.email].filter(Boolean).join(", ")) } : {}),
    };
    if (was) {
      await prisma.quoteCreator.update({ where: { id: was.id }, data: { ...data, creatorId: was.creatorId ?? saved.id, extra: { ...((was.extra ?? {}) as Record<string, string>), ...(row.columns ?? {}) } } });
      updated += 1;
    } else {
      /* A creator the database already has a number or email for: those come onto the plan (where this person may see them). */
      const known = saved.id ? await prisma.creator.findUnique({ where: { id: saved.id }, select: { phone: true, email: true } }) : null;
      if (known && (known.phone || known.email) && (await contactVisibility(viewer, q, [saved.id]))({ creatorId: saved.id })) Object.assign(data, { phone: known.phone ?? ("phone" in data ? data.phone : null), email: known.email ?? ("email" in data ? data.email : null) });
      await prisma.quoteCreator.create({
        data: {
          quoteId, position: position++, creatorId: saved.id, platform: platformOf(row.platform, row.profile_url), handle: handle || row.name.toLowerCase().replace(/[^a-z0-9._]+/g, ""), followers: 0,
          deliverables: "1 IG Reel + Story & link in bio", ...data, extra: row.columns ?? {},
        },
      });
      added += 1;
    }
    if (row.reach_out && row.reach_out !== was?.reachout) await recordReach({ creatorId: was?.creatorId ?? saved.id, quoteId, name: row.name, handle: handle || row.name, status: row.reach_out, byId: viewer.id });
  }
  await prisma.quote.update({ where: { id: quoteId }, data: { planColumns: { ...((q.planColumns ?? {}) as object), custom: [...custom] } as Prisma.InputJsonValue, updatedById: viewer.id } });
  await refreshTotals(quoteId);
  return { added, updated, notes };
}

/* --- The tools ------------------------------------------------------------- */

export const TOOLS: Tool[] = [
  {
    name: "search_influencers",
    readOnly: true,
    description: "Search Genesis's influencer database. Filter by text (name, handle, city, niche), category, city, platform, followers, whether they have a phone/email, and reach-out status. Returns profiles with rates, contacts (where allowed), agency/POC, source and their last reach-out.",
    input: z.object({
      query: z.string().optional(),
      category: z.array(z.string()).optional(),
      city: z.string().optional(),
      platform: z.string().optional(),
      min_followers: z.number().optional(),
      max_followers: z.number().optional(),
      has_contact: z.boolean().optional().describe("Only those with a phone or email."),
      reach: z.enum(["not_contacted", "contacted_last_30_days", "any"]).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    run: async (viewer, a: { query?: string; category?: string[]; city?: string; platform?: string; min_followers?: number; max_followers?: number; has_contact?: boolean; reach?: string; limit?: number }) => {
      if (!seesCreators(viewer)) throw new Error("You don't have access to the influencer database.");
      const has = (f: "phone" | "email") => ({ AND: [{ [f]: { not: null } }, { NOT: { [f]: "" } }] });
      const where: Prisma.CreatorWhereInput = {
        AND: [
          creatorScope(viewer),
          a.query ? { OR: [{ name: { contains: a.query, mode: "insensitive" } }, { handle: { contains: a.query.replace(/^@/, ""), mode: "insensitive" } }, { city: { contains: a.query, mode: "insensitive" } }, { niches: { has: a.query } }] } : {},
          a.category?.length ? { niches: { hasSome: a.category } } : {},
          a.city ? { city: { contains: a.city, mode: "insensitive" } } : {},
          a.platform ? { platform: platformOf(a.platform, null) } : {},
          a.min_followers || a.max_followers ? { followers: { ...(a.min_followers ? { gte: a.min_followers } : {}), ...(a.max_followers ? { lte: a.max_followers } : {}) } } : {},
          a.has_contact ? { OR: [has("phone"), has("email")] } : {},
          a.reach === "not_contacted" ? { reachAt: null } : a.reach === "contacted_last_30_days" ? { reachAt: { gte: new Date(Date.now() - 30 * 864e5) } } : {},
        ],
      };
      const prisma = getPrisma();
      const [rows, total] = await Promise.all([prisma.creator.findMany({ where, orderBy: { followers: "desc" }, take: a.limit ?? 25 }), prisma.creator.count({ where })]);
      const lasts = await lastReaches(rows.map((c) => c.id));
      return { total_matching: total, showing: rows.length, results: rows.map((c) => creatorOut(c, true, lasts[c.id])) };
    },
  },
  {
    name: "get_influencer",
    readOnly: true,
    description: "One influencer by CRM id or handle: full profile, rates, contacts (where allowed), the plans they're on, and their reach-out history.",
    input: z.object({ id: z.string().optional(), handle: z.string().optional() }),
    run: async (viewer, a: { id?: string; handle?: string }) => {
      if (!seesCreators(viewer)) throw new Error("You don't have access to the influencer database.");
      const prisma = getPrisma();
      const c = await prisma.creator.findFirst({ where: { AND: [creatorScope(viewer), a.id ? { id: a.id } : { handle: (a.handle ?? "").replace(/^@/, "").toLowerCase() }] } });
      if (!c) throw new Error("Not found, or not one you can see.");
      const [plans, history, lasts] = await Promise.all([
        prisma.quoteCreator.findMany({ where: { creatorId: c.id, quote: quoteScope(viewer) }, select: { reachout: true, quote: { select: { id: true, number: true, title: true, company: true } } } }),
        prisma.reachout.findMany({ where: { creatorId: c.id }, orderBy: { createdAt: "desc" }, take: 15, select: { status: true, createdAt: true, quoteId: true } }),
        lastReaches([c.id]),
      ]);
      return { ...creatorOut(c, true, lasts[c.id]), plans: plans.map((p) => ({ plan: `${quoteRef(p.quote.number)} ${p.quote.company ?? p.quote.title}`, reach_out: p.reachout, link: planLink(p.quote.id) })), reach_out_history: history };
    },
  },
  {
    name: "save_influencers",
    description: "Add influencers to the database, or update them (matched by id, else platform + handle/profile link, else exact name). Use for agency rosters (PDF), screenshots and sheets: name, handle/link, followers, avg views, ER, category, city, phone, email, agency, POC, rates and source. New details fill gaps; set overwrite to replace existing values with these.",
    input: z.object({ influencers: z.array(influencerInput).min(1).max(100), overwrite: z.boolean().optional() }),
    run: async (viewer, a: { influencers: InfluencerIn[]; overwrite?: boolean }) => {
      const results = [];
      for (const x of a.influencers) results.push({ name: x.name, ...(await saveCreator(viewer, x, Boolean(a.overwrite))) });
      await recordAuditLog({ action: "mcp.save_influencers", entity: "creator", actorId: viewer.id, metadata: { count: a.influencers.length } });
      return { created: results.filter((x) => x.action === "created").length, updated: results.filter((x) => x.action === "updated").length, results };
    },
  },
  {
    name: "list_plans",
    readOnly: true,
    description: "Influencer plans (and quotes) you can open, newest first; filter by text (title, brand).",
    input: z.object({ query: z.string().optional(), include_quotes: z.boolean().optional(), limit: z.number().int().min(1).max(50).optional() }),
    run: async (viewer, a: { query?: string; include_quotes?: boolean; limit?: number }) => {
      if (!can(viewer, "plans")) throw new Error("You don't have access to plans.");
      const rows = await getPrisma().quote.findMany({
        where: { AND: [quoteScope(viewer), a.include_quotes ? {} : { kind: "INFLUENCER_PLAN" }, a.query ? { OR: [{ title: { contains: a.query, mode: "insensitive" } }, { company: { contains: a.query, mode: "insensitive" } }] } : {}] },
        orderBy: { updatedAt: "desc" },
        take: a.limit ?? 20,
        select: { id: true, number: true, title: true, company: true, status: true, updatedAt: true, _count: { select: { creators: true } } },
      });
      return rows.map((q) => ({ id: q.id, number: quoteRef(q.number), title: q.title, brand: q.company, status: q.status, creators: q._count.creators, updated: q.updatedAt, link: planLink(q.id) }));
    },
  },
  {
    name: "get_plan",
    readOnly: true,
    description: "A plan by id or number (e.g. #0000046): every creator row with costs, client prices, reach-out, contact (where allowed), remarks and added columns, plus links to the plan, the client view and its Google Sheets.",
    input: z.object({ plan: z.string().describe("Plan id, or number like #0000046.") }),
    run: async (viewer, a: { plan: string }) => planOut(viewer, (await planFor(viewer, a.plan)).id),
  },
  {
    name: "create_plan",
    description: "Make a new influencer plan (a draft) with creator rows. Client prices left empty are the cost plus the markup (default 30%). Every creator is also saved to the influencer database. Add 'columns' per row for the plan's own columns (e.g. Tentative Cost, Deliverables). Returns the plan with its link.",
    input: z.object({
      title: z.string().min(1).max(200),
      brand: z.string().max(160).optional(),
      contact_name: z.string().max(120).optional(),
      contact_email: z.string().max(200).optional(),
      markup_percent: z.number().min(0).max(500).optional(),
      budget_line: z.string().max(120).optional(),
      creators: z.array(planRow).max(300),
    }),
    run: async (viewer, a: { title: string; brand?: string; contact_name?: string; contact_email?: string; markup_percent?: number; budget_line?: string; creators: PlanRowIn[] }) => {
      if (!can(viewer, "plans")) throw new Error("You don't have access to plans.");
      const terms = termsByKey("influencer");
      const q = await getPrisma().quote.create({
        data: {
          kind: "INFLUENCER_PLAN", title: a.title, company: a.brand ?? null, division: "INFLUENCE", contactName: a.contact_name ?? "", contactEmail: (a.contact_email ?? "").toLowerCase(),
          expiresAt: new Date(Date.now() + 14 * 864e5), notes: terms?.notes ?? null, terms: terms?.terms.join("\n") ?? null, addGst: true, gstPercent: 18, igst: false, discountPaise: 0,
          proposalPlatforms: ["Instagram"], markupPercent: a.markup_percent ?? 30, planBudget: a.budget_line ?? "As per Brand", token: newToken(), createdById: viewer.id, updatedById: viewer.id,
          parts: ["plan"],
        },
      });
      const result = await writeRows(viewer, q.id, a.creators);
      await recordAuditLog({ action: "mcp.create_plan", entity: "quote", entityId: q.id, actorId: viewer.id, metadata: { creators: a.creators.length } });
      return { ...result, plan: await planOut(viewer, q.id) };
    },
  },
  {
    name: "update_plan",
    description: "Update a plan: its title, brand, markup or budget line, and creator rows — each row is matched to the plan by handle/profile link, else name, and updated with the values given; rows not on the plan are added. Nothing is removed. Values left out stay as they are.",
    input: z.object({
      plan: z.string().describe("Plan id, or number like #0000046."),
      title: z.string().max(200).optional(),
      brand: z.string().max(160).optional(),
      markup_percent: z.number().min(0).max(500).optional(),
      budget_line: z.string().max(120).optional(),
      creators: z.array(planRow).max(300).optional(),
    }),
    run: async (viewer, a: { plan: string; title?: string; brand?: string; markup_percent?: number; budget_line?: string; creators?: PlanRowIn[] }) => {
      const q = await planFor(viewer, a.plan);
      if (q.status === "PAID") throw new Error("This plan is paid; it can't be changed.");
      await getPrisma().quote.update({ where: { id: q.id }, data: { ...(a.title ? { title: a.title } : {}), ...(a.brand ? { company: a.brand } : {}), ...(a.markup_percent !== undefined ? { markupPercent: a.markup_percent } : {}), ...(a.budget_line ? { planBudget: a.budget_line } : {}), updatedById: viewer.id } });
      const result = a.creators?.length ? await writeRows(viewer, q.id, a.creators) : { added: 0, updated: 0, notes: [] };
      await recordAuditLog({ action: "mcp.update_plan", entity: "quote", entityId: q.id, actorId: viewer.id, metadata: { rows: a.creators?.length ?? 0 } });
      return { ...result, plan: await planOut(viewer, q.id) };
    },
  },
  {
    name: "update_plan_sheets",
    description: "Make or update the plan's internal and external Google Sheets from the plan as it is now. A sheet someone has edited in Google Sheets is not overwritten (its edits come into the CRM by themselves).",
    input: z.object({ plan: z.string() }),
    run: async (viewer, a: { plan: string }) => {
      const q = await planFor(viewer, a.plan);
      try {
        const made = await makePlanSheets(q.id, viewer.email, viewer.id, viewer);
        return { external: made.ext, internal: made.int, in_drive_of: made.account };
      } catch (error) {
        if (error instanceof SheetEditedError) return { not_overwritten: error.message };
        throw error;
      }
    },
  },
  {
    name: "log_reachout",
    description: `Record a reach-out to an influencer, e.g. one done by hand on WhatsApp or by an agency, so nobody contacts them again by mistake. Status: ${REACH_STATUSES.join(", ")}. Give the plan to set it on that plan's row too.`,
    input: z.object({ influencer: z.string().describe("CRM id or handle."), status: z.string().min(1).max(60), plan: z.string().optional() }),
    run: async (viewer, a: { influencer: string; status: string; plan?: string }) => {
      const prisma = getPrisma();
      const c = await prisma.creator.findFirst({ where: { AND: [creatorScope(viewer), { OR: [{ id: a.influencer }, { handle: a.influencer.replace(/^@/, "").toLowerCase() }] }] } });
      const q = a.plan ? await planFor(viewer, a.plan) : null;
      const row = q?.creators.find((x) => (c && x.creatorId === c.id) || x.handle.toLowerCase() === a.influencer.replace(/^@/, "").toLowerCase());
      if (!c && !row) throw new Error("No influencer with that id or handle that you can see.");
      if (row) await prisma.quoteCreator.update({ where: { id: row.id }, data: { reachout: a.status } });
      await recordReach({ creatorId: c?.id ?? row?.creatorId ?? null, quoteId: q?.id ?? null, name: c?.name ?? row!.name, handle: c?.handle ?? row!.handle, status: a.status, byId: viewer.id });
      return { ok: true, influencer: c?.name ?? row?.name, status: a.status };
    },
  },
];
