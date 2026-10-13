import "server-only";

import { getPrisma } from "@/lib/db";
import { getSheets, isSheetsConfigured } from "@/lib/google-sheets";
import type { Division, ExpenseCategory, Platform } from "@/lib/generated/prisma/enums";

import { mapColumns } from "./ai";
import { tierFor, todayIst } from "./catalog";
import { EXPENSE_CATEGORY } from "./company";
import { google } from "./google";
import { cleanNiches } from "./niches";

/**
 * GOOGLE SHEETS INTO THE CRM (Genesis, 12 Oct 2026: "integrate our current
 * data … Google Sheets … clients, vendors details"). Paste a sheet's link, say
 * what it holds, and its rows become leads, clients, vendors, influencers,
 * expenses or briefs. The AI matches the columns (with a plain-name fallback);
 * re-running adds new rows and fills gaps, never duplicates. Leads, clients,
 * vendors and influencers can be kept in sync daily.
 *
 * Read as the person who imports it (their connected Google), or by the site's
 * service account when the sheet is shared with it.
 */

export const IMPORT_KINDS: Record<string, { label: string; fields: Record<string, string>; sync: boolean }> = {
  leads: {
    label: "Leads",
    sync: true,
    fields: { name: "contact name", email: "email", phone: "phone", company: "company / brand", designation: "job title", interest: "what they want", division: "division or service area", budget: "budget or deal value in rupees", followUp: "next follow-up date", notes: "notes / remarks / status" },
  },
  clients: {
    label: "Clients",
    sync: true,
    fields: { name: "brand or company name", legalName: "legal / billing name", email: "email", phone: "phone", gstin: "GSTIN", address: "billing address", city: "city", website: "website", industry: "industry / category", contact: "contact person", notes: "notes" },
  },
  vendors: {
    label: "Vendors & crew",
    sync: true,
    fields: { name: "vendor or person name", email: "email", phone: "phone", skills: "services / skills / category", rates: "rates / pricing", city: "city", gstin: "GSTIN", payout: "bank / UPI / payout details", notes: "notes" },
  },
  influencers: {
    label: "Influencers",
    sync: true,
    fields: { name: "creator name", handle: "handle / username", platform: "platform", profileUrl: "profile link", followers: "followers", avgViews: "average views", engagementRate: "engagement rate %", niches: "niche / category", city: "city / location", languages: "languages", gender: "gender", reelRate: "1 IG reel rate (₹)", storyRate: "story + link in bio rate (₹)", dlRate: "DL / digital licensing, 1 month (₹)", postRate: "post / video rate (₹)", youtubeUrl: "YouTube link", email: "email", phone: "phone", managedBy: "agency / manager", notes: "notes" },
  },
  expenses: {
    label: "Expenses / bills",
    sync: false,
    fields: { date: "date", description: "what it was for", category: "category", payee: "paid to / vendor", amount: "amount (₹)", gst: "GST (₹)", reference: "invoice number / reference", paidVia: "paid via" },
  },
  briefs: {
    label: "Briefs",
    sync: false,
    fields: { title: "brief or campaign title", company: "brand / company", email: "contact email", objective: "objective", deliverables: "deliverables", budget: "budget (₹)", deadline: "deadline", notes: "notes / details" },
  },
};

/** The spreadsheet id from a link (or the id itself). */
export const spreadsheetIdFrom = (input: string) => input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/)?.[1] ?? (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim()) ? input.trim() : null);

/** The sheet's tabs and title, as this person (or the service account). */
export async function sheetInfo(userId: string, spreadsheetId: string): Promise<{ title: string; tabs: string[] }> {
  const conn = await getPrisma().googleConnection.findUnique({ where: { userId }, select: { status: true } });
  if (conn?.status === "ACTIVE") {
    const body = await google<{ properties: { title: string }; sheets: { properties: { title: string } }[] }>(userId, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`);
    return { title: body.properties.title, tabs: body.sheets.map((s) => s.properties.title) };
  }
  if (!isSheetsConfigured()) throw new Error("Connect your Google first (Inbox → Connect Google).");
  const res = await getSheets().spreadsheets.get({ spreadsheetId, fields: "properties.title,sheets.properties.title" });
  return { title: res.data.properties?.title ?? "Sheet", tabs: (res.data.sheets ?? []).map((s) => s.properties?.title ?? "").filter(Boolean) };
}

async function readRows(userId: string, spreadsheetId: string, tab: string): Promise<string[][]> {
  const range = `'${tab.replace(/'/g, "''")}'!A1:AZ5000`;
  const conn = await getPrisma().googleConnection.findUnique({ where: { userId }, select: { status: true } });
  if (conn?.status === "ACTIVE") {
    const body = await google<{ values?: string[][] }>(userId, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`);
    return body.values ?? [];
  }
  const res = await getSheets().spreadsheets.values.get({ spreadsheetId, range, majorDimension: "ROWS" });
  return (res.data.values ?? []) as string[][];
}

/* --- Matching columns ----------------------------------------------------- */

const SYNONYMS: Record<string, RegExp> = {
  name: /^(full )?name|contact( person)?$|creator|influencer name|vendor/i,
  email: /e-?mail/i,
  phone: /phone|mobile|contact (no|number)|whatsapp/i,
  company: /company|brand|organi[sz]ation|client/i,
  designation: /designation|title|role|position/i,
  interest: /interest|service|requirement|looking for|enquiry/i,
  budget: /budget|value|deal|amount/i,
  followUp: /follow.?up|next (date|step)/i,
  notes: /notes?|remark|comment|status|detail/i,
  legalName: /legal|billing name|registered/i,
  gstin: /gst/i,
  address: /address/i,
  city: /city|location|place/i,
  website: /website|url|site/i,
  industry: /industry|category|sector/i,
  skills: /skill|service|category|expertise/i,
  rates: /rate|price|pricing|charges|fee/i,
  handle: /handle|username|insta(gram)? id|@/i,
  platform: /platform/i,
  profileUrl: /profile|link|url/i,
  followers: /followers|subs/i,
  avgViews: /avg|average|views/i,
  engagementRate: /engagement|\ber\b/i,
  niches: /niche|genre|category/i,
  languages: /language/i,
  gender: /gender/i,
  reelRate: /reel/i,
  dlRate: /\b(dl|dr)\b|licens|usage|digital rights/i,
  youtubeUrl: /yt|youtube/i,
  storyRate: /story/i,
  postRate: /post|video rate|yt/i,
  managedBy: /manag|agency/i,
  date: /date/i,
  description: /description|particular|item|for|purpose/i,
  category: /category|head|type/i,
  payee: /payee|vendor|paid to|party/i,
  amount: /amount|total|value/i,
  gst: /gst|tax/i,
  reference: /invoice|bill no|ref/i,
  paidVia: /mode|paid via|method/i,
  title: /title|campaign|project|brief/i,
  objective: /objective|goal/i,
  deliverables: /deliverable|scope/i,
  deadline: /deadline|due|launch/i,
  payout: /bank|upi|account no|ifsc|payout/i,
  contact: /contact person|poc/i,
};

function guessMapping(kind: string, headers: string[]): Record<string, string> {
  const fields = Object.keys(IMPORT_KINDS[kind]!.fields);
  const used = new Set<string>();
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const field = fields.find((f) => !used.has(f) && SYNONYMS[f]?.test(header));
    if (field) {
      mapping[header] = field;
      used.add(field);
    }
  }
  return mapping;
}

/** Reads the header row and matches the columns: the AI first, plain names as a fallback. */
export async function planImport(userId: string, spreadsheetId: string, tab: string, kind: string) {
  const rows = await readRows(userId, spreadsheetId, tab);
  const headerIndex = rows.findIndex((r) => r.filter((c) => String(c ?? "").trim()).length >= 2);
  if (headerIndex < 0) throw new Error("That tab looks empty.");
  const headers = rows[headerIndex]!.map((h) => String(h ?? "").trim());
  const sample = rows.slice(headerIndex + 1, headerIndex + 6);
  return { headers, mapping: await mapHeaders(kind, headers, sample), rowCount: Math.max(0, rows.length - headerIndex - 1), sample };
}

/** Matches a header row to the CRM's fields: the AI first, plain names as a fallback. */
export async function mapHeaders(kind: string, headers: string[], sample: string[][]) {
  const ai = await mapColumns(IMPORT_KINDS[kind]!.label, IMPORT_KINDS[kind]!.fields, headers.filter(Boolean), sample).catch(() => ({}));
  return Object.keys(ai).length ? ai : guessMapping(kind, headers);
}

/* --- Bringing rows in ---------------------------------------------------- */

const num = (v?: string) => {
  if (!v) return null;
  const s = String(v).replace(/[₹,\s]/g, "").toLowerCase();
  const m = s.match(/^([\d.]+)(k|l|lac|lakh|lakhs|m|cr|crore)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  const mult = { k: 1e3, l: 1e5, lac: 1e5, lakh: 1e5, lakhs: 1e5, m: 1e6, cr: 1e7, crore: 1e7 }[m[2] ?? ""] ?? 1;
  return Number.isFinite(n) ? n * mult : null;
};
const paise = (v?: string) => {
  const n = num(v);
  return n === null ? null : Math.round(n * 100);
};
const day = (v?: string) => {
  if (!v) return null;
  const s = String(v).trim();
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  const d = dmy ? new Date(Date.UTC(Number(dmy[3]!.length === 2 ? `20${dmy[3]}` : dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};
const list = (v?: string) => (v ? String(v).split(/[,/|;]+/).map((x) => x.trim()).filter(Boolean).slice(0, 12) : []);
const email = (v?: string) => (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? v.trim().toLowerCase() : null);
const PLATFORM: Record<string, Platform> = { instagram: "INSTAGRAM", insta: "INSTAGRAM", ig: "INSTAGRAM", youtube: "YOUTUBE", yt: "YOUTUBE", linkedin: "LINKEDIN", x: "X", twitter: "X", facebook: "FACEBOOK", fb: "FACEBOOK", moj: "MOJ", josh: "JOSH", snapchat: "SNAPCHAT" };
const DIVISION: [RegExp, Division][] = [[/influenc|ugc|creator/i, "INFLUENCE"], [/\bai\b|avatar|automation/i, "AI_LAB"], [/brand|design|logo|packag|website/i, "BRAND_DESIGN"], [/shoot|studio|film|event|production/i, "STUDIOS"]];

/** Imports (or re-syncs) a sheet. Returns how many rows were added and updated. */
export async function runImport(importId: string) {
  const prisma = getPrisma();
  const job = await prisma.sheetImport.findUniqueOrThrow({ where: { id: importId } });
  const rows = await readRows(job.userId, job.spreadsheetId, job.sheetName);
  const headerIndex = rows.findIndex((r) => r.filter((c) => String(c ?? "").trim()).length >= 2);
  if (headerIndex < 0) return { added: 0, updated: 0 };
  const headers = rows[headerIndex]!.map((h) => String(h ?? "").trim());
  const result = await importRows(job.kind, job.userId, headers, rows.slice(headerIndex + 1), job.mapping as Record<string, string>);
  await prisma.sheetImport.update({ where: { id: importId }, data: { lastRunAt: new Date(), lastError: null, rowsImported: { increment: result.added } } });
  return result;
}

/** Brings rows in as leads, clients, vendors, influencers, expenses or briefs: from a Google Sheet, or an uploaded Excel / CSV file. */
export async function importRows(kind: string, userId: string, headers: string[], body: unknown[][], mapping: Record<string, string>) {
  const prisma = getPrisma();
  const job = { kind, userId };
  const records = body.map((row) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      const field = mapping[h];
      const value = String(row[i] ?? "").trim();
      if (field && value) rec[field] = value;
    });
    return rec;
  });
  let added = 0;
  let updated = 0;
  /* The influencers this import touched, new or already there (a plan adds them straight away). */
  const ids: string[] = [];
  /* Only fills what's empty: a sheet never overwrites what the team has edited in the CRM. */
  const fill = <T extends Record<string, unknown>>(current: T, next: Partial<T>) =>
    Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== null && v !== undefined && v !== "" && (current[k] === null || current[k] === undefined || current[k] === "" || (Array.isArray(current[k]) && (current[k] as unknown[]).length === 0))));

  for (const r of records) {
    try {
      if (job.kind === "leads") {
        if (!r.name && !r.company && !r.email) continue;
        const mail = email(r.email);
        const existing = mail ? await prisma.lead.findFirst({ where: { email: mail } }) : await prisma.lead.findFirst({ where: { name: r.name ?? r.company!, company: r.company ?? null } });
        const data = {
          name: (r.name ?? r.company ?? mail!).slice(0, 120),
          email: mail,
          phone: r.phone?.slice(0, 30) ?? null,
          company: r.company?.slice(0, 160) ?? null,
          designation: r.designation?.slice(0, 120) ?? null,
          interest: r.interest?.slice(0, 200) ?? null,
          division: DIVISION.find(([re]) => re.test(`${r.division ?? ""} ${r.interest ?? ""}`))?.[1] ?? null,
          valuePaise: paise(r.budget) ?? 0,
          nextFollowUp: day(r.followUp),
          notes: r.notes ?? null,
        };
        if (existing) {
          const patch = fill(existing as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
          if (Object.keys(patch).length) {
            await prisma.lead.update({ where: { id: existing.id }, data: patch });
            updated += 1;
          }
        } else {
          await prisma.lead.create({ data: { ...data, source: "SHEET_IMPORT", ownerId: job.userId, createdById: job.userId, nextFollowUp: data.nextFollowUp ?? new Date(todayIst()) } });
          added += 1;
        }
      } else if (job.kind === "clients" || job.kind === "vendors") {
        if (!r.name) continue;
        const kind = job.kind === "clients" ? "BRAND" : "VENDOR";
        const mail = email(r.email);
        const existing =
          (mail ? await prisma.account.findFirst({ where: { email: mail } }) : null) ??
          (await prisma.account.findFirst({ where: { name: { equals: r.name, mode: "insensitive" }, kind } }));
        const data = {
          name: r.name.slice(0, 160),
          kind: kind as "BRAND" | "VENDOR",
          email: mail,
          phone: r.phone?.slice(0, 30) ?? null,
          gstin: r.gstin?.toUpperCase().slice(0, 15) ?? null,
          city: r.city?.slice(0, 80) ?? null,
          ...(job.kind === "clients"
            ? { legalName: r.legalName ?? null, billingAddress: r.address ?? null, website: r.website ?? null, industry: r.industry ?? null, notes: [r.contact && `Contact: ${r.contact}`, r.notes].filter(Boolean).join("\n") || null }
            : { vendorSkills: list(r.skills), vendorRateNote: r.rates ?? null, payoutNote: r.payout ?? null, notes: r.notes ?? null }),
        };
        if (existing) {
          const patch = fill(existing as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
          delete patch.kind;
          if (Object.keys(patch).length) {
            await prisma.account.update({ where: { id: existing.id }, data: patch });
            updated += 1;
          }
        } else {
          await prisma.account.create({ data: { ...data, status: job.kind === "clients" ? "ACTIVE" : "ACTIVE" } });
          added += 1;
        }
      } else if (job.kind === "influencers") {
        const fromUrl = r.profileUrl?.match(/(?:instagram\.com|youtube\.com\/@?|x\.com|twitter\.com|linkedin\.com\/in)\/?@?([A-Za-z0-9._-]+)/i)?.[1];
        const handle = (r.handle ?? fromUrl ?? "").replace(/^@/, "").trim().toLowerCase();
        if (!handle) continue;
        const platform = PLATFORM[(r.platform ?? (r.profileUrl?.includes("youtube") ? "youtube" : "instagram")).toLowerCase().trim()] ?? "INSTAGRAM";
        const followers = Math.round(num(r.followers) ?? 0);
        /* The sheet's categories in the standard names; anything else is kept in the notes. */
        const sorted = cleanNiches([r.niches ?? ""]);
        const data = {
          name: (r.name ?? handle).slice(0, 120),
          profileUrl: r.profileUrl ?? null,
          followers,
          avgViews: num(r.avgViews) === null ? null : Math.round(num(r.avgViews)!),
          engagementRate: num(r.engagementRate?.replace("%", "")),
          tier: tierFor(followers),
          niches: sorted.niches,
          languages: list(r.languages),
          city: r.city ?? null,
          gender: r.gender ?? null,
          reelRatePaise: paise(r.reelRate),
          storyRatePaise: paise(r.storyRate),
          postRatePaise: paise(r.postRate),
          dlRatePaise: paise(r.dlRate),
          youtubeUrl: r.youtubeUrl && /^https?:\/\//.test(r.youtubeUrl) ? r.youtubeUrl : null,
          email: email(r.email),
          phone: r.phone ? String(r.phone).replace(/(\d)\.0+(?!\d)/g, "$1").trim() : null,
          managedBy: r.managedBy ?? null,
          notes: [r.notes, sorted.other.length ? `Categories in the sheet: ${sorted.other.join(", ")}` : null].filter(Boolean).join("\n") || null,
        };
        const existing = await prisma.creator.findUnique({ where: { platform_handle: { platform, handle } } });
        if (existing) {
          ids.push(existing.id);
          const patch = fill(existing as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
          /* Followers and rates move: the sheet's newer numbers win. */
          if (followers > 0 && followers !== existing.followers) Object.assign(patch, { followers, tier: tierFor(followers) });
          if (Object.keys(patch).length) {
            await prisma.creator.update({ where: { id: existing.id }, data: patch });
            updated += 1;
          }
        } else {
          ids.push((await prisma.creator.create({ data: { ...data, handle, platform } })).id);
          added += 1;
        }
      } else if (job.kind === "expenses") {
        const amount = paise(r.amount);
        if (!amount) continue;
        const when = day(r.date) ?? new Date(todayIst());
        const description = (r.description ?? r.payee ?? "Imported expense").slice(0, 200);
        const category = (Object.entries(EXPENSE_CATEGORY).find(([k, v]) => r.category && (k.toLowerCase() === r.category.toLowerCase() || v.toLowerCase().includes(r.category.toLowerCase())))?.[0] ?? (/salar/i.test(`${r.category} ${description}`) ? "SALARY" : "OTHER")) as ExpenseCategory;
        if (await prisma.expense.findFirst({ where: { date: when, amountPaise: amount, description } })) continue;
        await prisma.expense.create({ data: { date: when, category, description, payee: r.payee ?? null, amountPaise: amount, gstPaise: paise(r.gst) ?? 0, reference: r.reference ?? null, paidVia: r.paidVia ?? null, createdById: job.userId } });
        added += 1;
      } else if (job.kind === "briefs") {
        if (!r.title && !r.company) continue;
        const title = (r.title ?? `${r.company} brief`).slice(0, 200);
        const mail = email(r.email);
        const lead = mail ? await prisma.lead.findFirst({ where: { email: mail } }) : r.company ? await prisma.lead.findFirst({ where: { company: { equals: r.company, mode: "insensitive" } } }) : null;
        if (await prisma.brief.findFirst({ where: { title, leadId: lead?.id ?? null } })) continue;
        const leadId =
          lead?.id ??
          (await prisma.lead.create({ data: { name: (r.company ?? title).slice(0, 120), company: r.company ?? null, email: mail, source: "SHEET_IMPORT", ownerId: job.userId, createdById: job.userId, nextFollowUp: new Date(todayIst()), valuePaise: paise(r.budget) ?? 0 } })).id;
        await prisma.brief.create({ data: { title, leadId, objective: r.objective ?? null, deliverables: r.deliverables ?? null, budgetPaise: paise(r.budget), deadline: day(r.deadline), notes: r.notes ?? null, createdById: job.userId } });
        added += 1;
      }
    } catch (error) {
      console.error("[crm] sheet row skipped", (error as Error).message);
    }
  }
  return { added, updated, ids };
}

/** Daily: sheets marked "keep in sync" are read again (only new rows and empty fields change). */
export async function syncSheetImports() {
  const prisma = getPrisma();
  const due = await prisma.sheetImport.findMany({ where: { autoSync: true, OR: [{ lastRunAt: null }, { lastRunAt: { lt: new Date(Date.now() - 24 * 3600_000) } }] }, take: 3 });
  const report: Record<string, unknown> = {};
  for (const job of due) {
    try {
      report[job.title] = await runImport(job.id);
    } catch (error) {
      const message = String((error as Error).message).slice(0, 300);
      await prisma.sheetImport.update({ where: { id: job.id }, data: { lastError: message, lastRunAt: new Date() } });
      report[job.title] = { error: message };
    }
  }
  return report;
}

/* --- Influencer sheets found in Drive ------------------------------------- */

/** A tab is an influencer list when its header row names followers and a handle, profile or platform. */
const looksLikeInfluencers = (headers: string[]) => {
  const h = headers.map((x) => String(x ?? "").toLowerCase());
  return h.some((x) => /follower|subscriber|subs\b/.test(x)) && h.some((x) => /handle|username|insta|profile|link|youtube|channel|platform|@/.test(x));
};

/**
 * THE INFLUENCER DATA, IN ONE PLACE (Genesis, 12 Oct 2026: "it's all over the
 * place in Google Sheets, mostly with me and Tanvi"). Once a day for each
 * person who connected Google: every spreadsheet in their Drive that holds an
 * influencer list — by its name or its columns, however old — is brought into
 * the influencer database and kept in sync daily. They and the super admins
 * are told what came in.
 */
export async function scanInfluencerSheets(userId: string) {
  const prisma = getPrisma();
  const marker = `influencer-scan:${userId}`;
  const last = await prisma.appSetting.findUnique({ where: { key: marker } });
  if (last && Date.now() - new Date(last.value).getTime() < 24 * 3600_000) return { skipped: "scanned today" };
  const fields = encodeURIComponent("files(id,name,modifiedTime)");
  const named = `mimeType='application/vnd.google-apps.spreadsheet' and trashed = false and (name contains 'nfluencer' or name contains 'reator' or name contains 'alent' or name contains 'KOL' or name contains 'logger' or name contains 'UGC' or name contains 'ugc')`;
  const recent = `mimeType='application/vnd.google-apps.spreadsheet' and trashed = false`;
  const [a, b] = await Promise.all([
    google<{ files?: { id: string; name: string }[] }>(userId, `https://www.googleapis.com/drive/v3/files?pageSize=60&orderBy=modifiedTime desc&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=allDrives&q=${encodeURIComponent(named)}&fields=${fields}`),
    google<{ files?: { id: string; name: string }[] }>(userId, `https://www.googleapis.com/drive/v3/files?pageSize=40&orderBy=modifiedTime desc&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=allDrives&q=${encodeURIComponent(recent)}&fields=${fields}`),
  ]);
  const files = [...new Map([...(a.files ?? []), ...(b.files ?? [])].map((f) => [f.id, f])).values()];
  const found: { title: string; added: number; updated: number }[] = [];
  for (const file of files) {
    let tabs: string[] = [];
    try {
      const meta = await google<{ sheets: { properties: { title: string } }[] }>(userId, `https://sheets.googleapis.com/v4/spreadsheets/${file.id}?fields=sheets.properties.title`);
      tabs = meta.sheets.map((s) => s.properties.title).slice(0, 8);
    } catch {
      continue;
    }
    for (const tab of tabs) {
      if (await prisma.sheetImport.findUnique({ where: { spreadsheetId_sheetName_kind: { spreadsheetId: file.id, sheetName: tab, kind: "influencers" } }, select: { id: true } })) continue;
      let head: string[][] = [];
      try {
        const range = encodeURIComponent(`'${tab.replace(/'/g, "''")}'!A1:AZ6`);
        head = (await google<{ values?: string[][] }>(userId, `https://sheets.googleapis.com/v4/spreadsheets/${file.id}/values/${range}`)).values ?? [];
      } catch {
        continue;
      }
      const headerRow = head.find((r) => r.filter((c) => String(c ?? "").trim()).length >= 2) ?? [];
      if (!looksLikeInfluencers(headerRow)) continue;
      try {
        const plan = await planImport(userId, file.id, tab, "influencers");
        if (!Object.values(plan.mapping).includes("handle") && !Object.values(plan.mapping).includes("profileUrl")) continue;
        const job = await prisma.sheetImport.create({ data: { userId, spreadsheetId: file.id, sheetName: tab, title: `${file.name} · ${tab}`, kind: "influencers", mapping: plan.mapping, autoSync: true } });
        const result = await runImport(job.id);
        found.push({ title: job.title, ...result });
      } catch (error) {
        console.error("[crm] influencer sheet skipped", file.id, tab, (error as Error).message);
      }
    }
  }
  await prisma.appSetting.upsert({ where: { key: marker }, create: { key: marker, value: new Date().toISOString() }, update: { value: new Date().toISOString() } });
  if (found.length) {
    const { adminIds, notify } = await import("./notifications");
    const added = found.reduce((s, f) => s + f.added, 0);
    await notify([userId, ...(await adminIds())], {
      title: `Influencer sheets synced: ${added} creators added`,
      body: found.map((f) => `${f.title}: ${f.added} added, ${f.updated} updated`).join("\n"),
      href: "/admin/creators",
    });
  }
  return { sheets: found.length, added: found.reduce((s, f) => s + f.added, 0) };
}
