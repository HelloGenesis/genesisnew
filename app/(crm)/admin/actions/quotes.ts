"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit";
import { archiveQuote, archiveLater } from "@/lib/crm/archive";
import { contactVisibility } from "@/lib/crm/creator-privacy";
import { proposalOrder } from "@/lib/crm/proposal-order";
import { describeChanges, quoteSnap } from "@/lib/crm/quote-history";
import { recordReach, setCreatorContacts } from "@/lib/crm/reachout";
import { sameList, tidyEmails, tidyPhones } from "@/lib/crm/creator-contacts";
import { SheetEditedError } from "@/lib/crm/plan-sync";
import { DriveNotConnected } from "@/lib/crm/drive";
import { makePlanSheets } from "@/lib/crm/plan-sheets";
import { sanitizeHtml } from "@/lib/rich-text";
import { tidyNiches } from "@/lib/crm/niches";
import { getPrisma } from "@/lib/db";
import { type ActionState, fail, ok, text } from "@/lib/crm/form-state";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Platform } from "@/lib/generated/prisma/enums";
import { tierFor } from "@/lib/crm/catalog";
import { newToken, openFor, refreshTotals, sendQuote } from "@/lib/crm/quotes";
import { termsByKey } from "@/lib/crm/quote-templates";
import { creatorScope, quoteScope, seesCreators, seesQuoteContact } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { RazorpayError, razorpay } from "@/lib/razorpay";

/** The quote builder's server side. Sales and owners. */

const DIVISIONS = ["AI_LAB", "STUDIOS", "BRAND_DESIGN", "INFLUENCE"] as const;
const rupees = z.coerce.number().min(0).max(10_000_000);

const payload = z.object({
  id: z.string().optional(),
  kind: z.enum(["QUOTE", "INFLUENCER_PLAN"]),
  title: z.string().trim().max(200),
  division: z.enum(DIVISIONS).nullable().optional(),
  accountId: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  /* A draft saves with gaps (Genesis, 13 Oct 2026); the email is checked when it is sent. */
  contactName: z.string().trim().max(120),
  contactEmail: z.string().trim().max(200),
  contactPhone: z.string().trim().max(30).nullable().optional(),
  company: z.string().trim().max(160).nullable().optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(6000).nullable().optional(),
  terms: z.string().max(12000).nullable().optional(),
  addGst: z.boolean(),
  gstPercent: z.coerce.number().min(0).max(28).transform(Math.round),
  igst: z.boolean().optional(),
  proposalPlatforms: z.array(z.string().max(40)).max(12).optional(),
  proposalProblems: z.string().max(60000).nullable().optional(),
  proposalObjectives: z.string().max(60000).nullable().optional(),
  proposalInfluencers: z.string().max(60000).nullable().optional(),
  proposalTg: z.string().max(60000).nullable().optional(),
  proposalSections: z.array(z.object({ title: z.string().max(120), html: z.string().max(60000) })).max(20).optional(),
  parts: z.array(z.enum(["proposal", "plan", "pricing"])).max(3).optional(),
  planColumns: z.object({ hidden: z.array(z.string().max(40)).max(40).optional(), custom: z.array(z.string().trim().max(60)).max(20).optional(), share: z.enum(["table", "sheet", "both"]).optional(), extPrices: z.boolean().optional(), feesInTotal: z.boolean().optional(), sheetUrl: z.string().trim().max(500).optional(), boxes: z.array(z.enum(["tg", "problems", "objectives", "influencers", "ideas"])).max(5).optional(), intOnly: z.array(z.string().trim().max(60)).max(20).optional(), order: z.array(z.string().max(20)).max(60).optional() }).optional(),
  markupPercent: z.coerce.number().min(0).max(1000).transform(Math.round).optional(),
  planBudget: z.string().max(120).nullable().optional(),
  discount: rupees,
  lines: z
    .array(
      z.object({
        kind: z.string().max(20),
        productId: z.string().max(120).nullable().optional(),
        division: z.enum(DIVISIONS).nullable().optional(),
        title: z.string().trim().max(200),
        subtitle: z.string().max(300).nullable().optional(),
        details: z.string().max(4000).nullable().optional(),
        note: z.string().max(1000).nullable().optional(),
        qty: z.coerce.number().min(0).max(10000).transform((v) => Math.max(1, Math.round(v))),
        unit: rupees,
      }),
    )
    .max(60),
  creators: z
    .array(
      z.object({
        creatorId: z.string().nullable().optional(),
        name: z.string().max(200),
        handle: z.string().max(120),
        platform: z.string().max(20),
        profileUrl: z.string().max(1000).nullable().optional(),
        followers: z.coerce.number().min(0).transform(Math.round),
        avgViews: z.coerce.number().min(0).transform(Math.round).nullable().optional(),
        niches: z.array(z.string().max(120)).max(30),
        city: z.string().max(200).nullable().optional(),
        deliverables: z.string().max(1000).nullable().optional(),
        fee: rupees.nullable().optional(),
        er: z.coerce.number().min(0).max(1000).nullable().optional(),
        reelCost: rupees.nullable().optional(),
        storyCost: rupees.nullable().optional(),
        dlCost: rupees.nullable().optional(),
        reelPrice: rupees.nullable().optional(),
        storyPrice: rupees.nullable().optional(),
        dlPrice: rupees.nullable().optional(),
        reachout: z.string().max(120).nullable().optional(),
        phone: z.string().max(1000).nullable().optional(),
        email: z.string().max(1000).nullable().optional(),
        tier: z.string().max(40).nullable().optional(),
        remarks: z.string().max(1000).nullable().optional(),
        extra: z.record(z.string().max(80), z.string().max(1000)).optional(),
      }),
    )
    .max(200),
});

const paise = (r: number) => Math.round(r * 100);
const rich = (html: string | null | undefined) => (html ? sanitizeHtml(html) || null : null);
const p = (r: number | null | undefined) => (typeof r === "number" ? paise(r) : null);

type Viewer = Awaited<ReturnType<typeof requireStaff>>;
type Persisted = { ok: true; id: string; created: boolean; creators: number; version: string } | { ok: false; message: string; conflict?: boolean };

/** Writes the builder's state: a new draft, or the changes to an existing quote. */
async function persist(viewer: Viewer, raw: string, autosave = false): Promise<Persisted> {
  const failed = (message: string) => ({ ok: false as const, message });
  let json: unknown;
  try {
    json = JSON.parse(raw || "{}");
  } catch {
    return failed("Couldn't read the quote.");
  }
  /* The version the editor loaded (the quote's last save), and whether to overwrite a newer one on purpose. */
  const meta = (json ?? {}) as { version?: unknown; force?: unknown };
  const version = typeof meta.version === "string" ? new Date(meta.version) : null;
  const force = meta.force === true;
  const parsed = payload.safeParse(json);
  if (!parsed.success) return failed(`Check the quote: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
  const q = parsed.data;
  if (q.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.contactEmail)) {
    if (!autosave) return failed("That email doesn't look right; fix it or leave it blank for now.");
    q.contactEmail = "";
  }
  const prisma = getPrisma();
  const data = {
    kind: q.kind,
    title: q.title || `${q.company || q.contactName || "Untitled"} ${q.kind === "INFLUENCER_PLAN" ? "influencer plan" : "quote"}`,
    division: q.division ?? null,
    accountId: q.accountId || null,
    leadId: q.leadId || null,
    requestId: q.requestId || null,
    contactName: q.contactName,
    contactEmail: q.contactEmail.toLowerCase(),
    contactPhone: q.contactPhone || null,
    company: q.company || null,
    expiresAt: new Date(`${q.expiresAt}T23:59:59+05:30`),
    notes: q.notes || null,
    terms: q.terms || null,
    addGst: q.addGst,
    gstPercent: q.gstPercent,
    igst: q.igst ?? false,
    discountPaise: paise(q.discount),
    proposalPlatforms: q.proposalPlatforms ?? [],
    /* Rich text, cleaned: only formatting, links, images and known embeds are kept. */
    proposalProblems: rich(q.proposalProblems),
    proposalObjectives: rich(q.proposalObjectives),
    proposalInfluencers: rich(q.proposalInfluencers),
    proposalTg: rich(q.proposalTg),
    proposalSections: (q.proposalSections ?? []).map((x) => ({ title: x.title.trim(), html: sanitizeHtml(x.html) })).filter((x) => x.title || x.html) as Prisma.InputJsonValue,
    planColumns: { hidden: q.planColumns?.hidden ?? [], custom: [...new Set((q.planColumns?.custom ?? []).filter(Boolean))], share: q.planColumns?.share ?? "table", extPrices: q.planColumns?.extPrices ?? true, feesInTotal: q.planColumns?.feesInTotal ?? false, sheetUrl: /^https:\/\/\S+$/i.test(q.planColumns?.sheetUrl ?? "") ? q.planColumns!.sheetUrl : "", boxes: [...new Set(q.planColumns?.boxes ?? [])], intOnly: (q.planColumns?.intOnly ?? []).filter((c) => (q.planColumns?.custom ?? []).includes(c)), order: proposalOrder(q.planColumns?.order, (q.proposalSections ?? []).filter((x) => x.title.trim() !== "Content ideas" && (x.title.trim() || x.html)).length) } as Prisma.InputJsonValue,
    markupPercent: q.markupPercent ?? 30,
    planBudget: q.planBudget || null,
    parts: q.parts ?? [],
  };
  const lines = q.lines.filter((l) => l.title || l.unit > 0 || l.details).map((l, i) => ({ position: i, kind: l.kind, productId: l.productId ?? null, division: l.division ?? null, title: l.title || "Untitled line", subtitle: l.subtitle || null, details: l.details || null, note: l.note || null, qty: l.qty, unitPaise: paise(l.unit) }));
  /* A row added by hand and left empty isn't kept. */
  q.creators = q.creators.filter((c) => c.creatorId || c.name.trim() || c.handle.trim());
  /*
   * Influencers added by link or by hand join the influencer database too
   * (Genesis, 12 Oct 2026) — on Save, not while saving automatically, so a
   * half-typed handle never becomes a creator.
   */
  for (const c of q.creators) {
    if (autosave || c.creatorId || !c.handle) continue;
    const platform = (["INSTAGRAM", "YOUTUBE", "LINKEDIN", "X", "FACEBOOK", "MOJ", "JOSH", "SNAPCHAT", "OTHER"].includes(c.platform) ? c.platform : "INSTAGRAM") as Platform;
    const handle = c.handle.replace(/^@/, "").toLowerCase();
    /* One per handle in this CRM (Genesis's, or the agency's own list). */
    const creator = (await prisma.creator.findFirst({ where: { platform, handle } })) ?? await prisma.creator.create({
      data: { name: c.name.trim() || handle, handle, platform, profileUrl: c.profileUrl ?? null, followers: c.followers || 0, tier: tierFor(c.followers || 0), niches: tidyNiches(c.niches), city: c.city ?? null, reelRatePaise: c.fee ? paise(c.fee) : null, notes: "Added from a quote.", source: "Added on a plan", createdById: viewer.id },
    });
    c.creatorId = creator.id;
  }
  const creators = q.creators.map((c, i) => ({ position: i, creatorId: c.creatorId ?? null, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl ?? null, followers: c.followers, avgViews: c.avgViews ?? null, niches: c.niches, city: c.city ?? null, deliverables: c.deliverables || null,
    /* The client's total for a creator is the sum of the priced deliverables, when they're priced one by one. */
    feePaise: [c.reelPrice, c.storyPrice, c.dlPrice].some((v) => typeof v === "number") ? paise((c.reelPrice ?? 0) + (c.storyPrice ?? 0) + (c.dlPrice ?? 0)) : c.fee === null || c.fee === undefined ? null : paise(c.fee),
    engagementRate: c.er ?? null, reelCostPaise: p(c.reelCost), storyCostPaise: p(c.storyCost), dlCostPaise: p(c.dlCost), reelPricePaise: p(c.reelPrice), storyPricePaise: p(c.storyPrice), dlPricePaise: p(c.dlPrice),
    reachout: c.reachout || null, phone: tidyPhones(c.phone), email: tidyEmails(c.email), tier: c.tier?.trim() || null, remarks: c.remarks || null, extra: (c.extra ?? {}) as Prisma.InputJsonValue }));

  let id = q.id;
  /* The quote as it was, for its change history (lib/crm/quote-history). */
  const beforeSnap = id ? await quoteSnap(id) : null;
  /* The rows as they were, to see which reach-outs and contacts changed (lib/crm/reachout). */
  const previous = id ? await prisma.quoteCreator.findMany({ where: { quoteId: id }, select: { creatorId: true, handle: true, reachout: true, phone: true, email: true } }) : [];
  if (id) {
    const before = await prisma.quote.findFirst({ where: { id, ...quoteScope(viewer) } });
    if (!before) return failed("That quote isn't yours, or no longer exists.");
    if (before.status === "PAID") return failed("This quote is paid; duplicate it to change it.");
    /* Automatic saving is for drafts; a sent quote changes when you press Save. */
    if (autosave && before.status !== "DRAFT") return failed("Sent: changes save when you press Save changes.");
    /*
     * TWO PEOPLE, ONE QUOTE (Genesis, 14 Oct 2026: "whatever the other user
     * changed and saved isn't reflecting with me"). A page opened before
     * someone else saved must not write its older copy over theirs: the save
     * stops and says who changed it, unless "Keep mine" was chosen.
     */
    if (version && !Number.isNaN(version.getTime()) && before.updatedAt.getTime() > version.getTime() + 1000 && !force && before.updatedById !== viewer.id) {
      const who = before.updatedById ? await prisma.user.findUnique({ where: { id: before.updatedById }, select: { name: true, email: true } }) : null;
      const at = before.updatedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
      return { ok: false, conflict: true, message: `${who?.name ?? who?.email ?? "Someone else"} saved changes to this quote at ${at}, after you opened it.` };
    }
    /* Someone who can't see the client's contact details can't change them either (lib/crm/scope seesQuoteContact). */
    const lead = before.leadId ? await prisma.lead.findUnique({ where: { id: before.leadId }, select: { ownerId: true, createdById: true } }) : null;
    if (!seesQuoteContact(viewer, { createdById: before.createdById, lead })) Object.assign(data, { contactName: before.contactName, contactEmail: before.contactEmail, contactPhone: before.contactPhone, leadId: before.leadId, accountId: before.accountId });
    /* Creators' contacts this person can't see came to the page blank: keep what was saved (lib/crm/creator-privacy). */
    const visible = await contactVisibility(viewer, before, creators.map((c) => c.creatorId));
    const saved = await prisma.quoteCreator.findMany({ where: { quoteId: id }, select: { creatorId: true, handle: true, phone: true, email: true } });
    for (const c of creators) {
      if (visible(c)) continue;
      const was = saved.find((s) => (c.creatorId && s.creatorId === c.creatorId) || (s.handle && s.handle === c.handle));
      c.phone = was?.phone ?? null;
      c.email = was?.email ?? null;
    }
    await prisma.$transaction([
      prisma.quoteLine.deleteMany({ where: { quoteId: id } }),
      prisma.quoteCreator.deleteMany({ where: { quoteId: id } }),
      prisma.quote.update({ where: { id }, data: { ...data, updatedById: viewer.id, lines: { create: lines }, creators: { create: creators } } }),
    ]);
  } else {
    const created = await prisma.quote.create({ data: { ...data, token: newToken(), createdById: viewer.id, updatedById: viewer.id, lines: { create: lines }, creators: { create: creators } } });
    id = created.id;
  }
  await refreshTotals(id);
  const afterSnap = await quoteSnap(id);
  const changes = beforeSnap && afterSnap ? describeChanges(beforeSnap, afterSnap) : [];
  if (!beforeSnap || changes.length) await recordAuditLog({ action: beforeSnap ? "quote.saved" : "quote.created", entity: "quote", entityId: id, actorId: viewer.id, metadata: { changes } });
  /*
   * REACH-OUTS AND CONTACTS FROM THE PLAN (Genesis, 27 Oct 2026): a status set
   * here is logged on the creator, with who and which plan; a number or email
   * changed in a row goes to the influencer database and the creator's other
   * plans. Contacts only where this person may see them.
   */
  const rowsNow = await prisma.quoteCreator.findMany({ where: { quoteId: id }, select: { creatorId: true, name: true, handle: true, reachout: true, phone: true, email: true } });
  const quoteFor = await prisma.quote.findUniqueOrThrow({ where: { id }, select: { createdById: true } });
  const mayContact = await contactVisibility(viewer, quoteFor, rowsNow.map((c) => c.creatorId));
  for (const c of rowsNow) {
    const was = previous.find((p) => (c.creatorId && p.creatorId === c.creatorId) || p.handle === c.handle);
    if (c.reachout && c.reachout !== was?.reachout) await recordReach({ creatorId: c.creatorId, quoteId: id, name: c.name, handle: c.handle, status: c.reachout, byId: viewer.id });
    /* Numbers or emails changed here: the database and the creator's other plans follow (lib/crm/reachout). */
    if (c.creatorId && mayContact(c)) {
      const next = { ...(!sameList(c.phone, was?.phone, "phone") ? { phone: c.phone } : {}), ...(!sameList(c.email, was?.email, "email") ? { email: c.email } : {}) };
      if (Object.keys(next).length) await setCreatorContacts(c.creatorId, next);
    }
  }
  const saved = await prisma.quote.findUniqueOrThrow({ where: { id }, select: { updatedAt: true } });
  return { ok: true, id, created: !q.id, creators: q.creators.length, version: saved.updatedAt.toISOString() };
}

/** The quote's last save, for an open editor to notice someone else's changes. */
export async function quoteVersion(id: string): Promise<{ version: string; by: string | null } | null> {
  const viewer = await requireStaff("plans");
  const q = await getPrisma().quote.findFirst({ where: { id, ...quoteScope(viewer) }, select: { updatedAt: true, updatedById: true } });
  if (!q) return null;
  const who = q.updatedById && q.updatedById !== viewer.id ? await getPrisma().user.findUnique({ where: { id: q.updatedById }, select: { name: true, email: true } }) : null;
  return { version: q.updatedAt.toISOString(), by: who ? (who.name ?? who.email) : null };
}

/** Creates or updates a quote from the builder (the form posts its state as JSON). */
export async function saveQuote(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("plans");
  const result = await persist(viewer, String(form.get("payload") ?? "{}"));
  if (!result.ok) return fail(result.message);
  const id = result.id;
  /* "Save & make Google Sheets": the internal and external sheets, right after saving (in the maker's own Drive when they can). */
  let sheets = "";
  /*
   * Save changes keeps the plan's Google Sheets in step (Genesis, 13 Oct 2026:
   * "whenever we hit save changes it also reflects in the internal and
   * external sheets"): rewritten whenever the plan already has them. Excel is
   * always made from the saved plan, so it's current by itself.
   */
  const hasSheets = Boolean((await getPrisma().quote.findUnique({ where: { id }, select: { extSheetId: true } }))?.extSheetId);
  /* "Send Google Sheet to client" with no link of its own: Save makes the external sheet, so the quote and PDF carry its link. */
  const cols = ((await getPrisma().quote.findUnique({ where: { id }, select: { planColumns: true } }))?.planColumns ?? {}) as { share?: string; sheetUrl?: string };
  const wantsSheet = (cols.share === "sheet" || cols.share === "both") && !cols.sheetUrl?.trim();
  /* "Overwrite the Google Sheets": replaces sheets edited in Google Sheets too (lib/crm/plan-sync). */
  const overwrite = form.get("then") === "overwrite";
  if ((form.get("then") === "sheets" || overwrite || hasSheets || wantsSheet) && result.creators > 0) {
    try {
      const made = await makePlanSheets(id, viewer.email, viewer.id, viewer, { force: overwrite });
      sheets = made.own ? " Both Google Sheets are in your Drive." : ` Both Google Sheets are up to date (in ${made.account}'s Drive).`;
    } catch (error) {
      sheets = error instanceof SheetEditedError ? ` ${error.message}` : ` The Google Sheets didn't update: ${(error as Error).message.slice(0, 160)}`;
    }
  }
  revalidatePath("/admin", "layout");
  if (result.created) redirect(`/admin/quotes/${id}?saved=1${sheets ? `&sheets=${encodeURIComponent(sheets.trim())}` : ""}`);
  return ok(`Saved.${sheets}`);
}

/**
 * A DRAFT PLAN STRAIGHT FROM THE INFLUENCER DATABASE (Genesis, 13 Oct 2026:
 * "add internal and external buttons on the influencer database; it should
 * also save it to draft"). The ticked creators, their rates as our cost and
 * +30% as the client's price; optionally with both Google Sheets made.
 */
/* `then`: "sheets" makes both Google Sheets; "reachout" opens Reach out on the new plan (Genesis, 23 Oct 2026). */
export async function draftFromCreators(ids: string[], then?: "sheets" | "reachout") {
  const viewer = await requireStaff("plans");
  if (!seesCreators(viewer)) return { ok: false, message: "Only people with access to the influencer database can do this." };
  const prisma = getPrisma();
  const picked = await prisma.creator.findMany({ where: { id: { in: ids.slice(0, 200) }, ...creatorScope(viewer) }, orderBy: { followers: "asc" } });
  if (picked.length === 0) return { ok: false, message: "Tick some creators first." };
  const terms = termsByKey("influencer");
  const up = (v: number | null) => (v === null ? null : Math.round(v * 1.3));
  const created = await prisma.quote.create({
    data: {
      kind: "INFLUENCER_PLAN", title: `Influencer plan · ${picked.length} creators`, division: "INFLUENCE", contactName: "", contactEmail: "",
      expiresAt: new Date(Date.now() + 14 * 864e5), notes: terms?.notes ?? null, terms: terms?.terms.join("\n") ?? null, addGst: true, gstPercent: 18, igst: false, discountPaise: 0,
      proposalPlatforms: ["Instagram"], markupPercent: 30, planBudget: "As per Brand", token: newToken(), createdById: viewer.id,
      creators: {
        create: picked.map((c, i) => {
          const prices = [up(c.reelRatePaise), up(c.storyRatePaise), up(c.dlRatePaise)];
          return {
            position: i, creatorId: c.id, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city,
            deliverables: "1 IG Reel + Story & link in bio", engagementRate: c.engagementRate, reelCostPaise: c.reelRatePaise, storyCostPaise: c.storyRatePaise, dlCostPaise: c.dlRatePaise,
            reelPricePaise: prices[0], storyPricePaise: prices[1], dlPricePaise: prices[2], feePaise: prices.some((x) => x !== null) ? prices.reduce<number>((s, x) => s + (x ?? 0), 0) : null,
            phone: tidyPhones(c.phone), email: tidyEmails(c.email), remarks: c.managedBy ? `Managed by ${c.managedBy}` : null,
          };
        }),
      },
    },
  });
  await refreshTotals(created.id);
  let note = "";
  if (then === "sheets") {
    try {
      const made = await makePlanSheets(created.id, viewer.email, viewer.id, viewer);
      note = made.own ? "Both Google Sheets are in your Drive." : `Both Google Sheets are made (in ${made.account}'s Drive).`;
    } catch (error) {
      note = `The Google Sheets didn't make: ${(error as Error).message.slice(0, 160)}`;
    }
  }
  revalidatePath("/admin", "layout");
  if (then === "reachout") redirect(`/admin/reachout?plan=${created.id}`);
  redirect(`/admin/quotes/${created.id}?saved=1${note ? `&sheets=${encodeURIComponent(note)}` : ""}`);
}

/** Emails the quotation (with a payment link when asked) — see lib/crm/quotes sendQuote. */
export async function sendQuoteAction(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("plans");
  const id = text(form, "id");
  if (!id) return fail("Save the quote first.");
  const q = await getPrisma().quote.findFirst({ where: { id, ...quoteScope(viewer) } });
  if (!q) return fail("That quote isn't yours, or no longer exists.");
  if (q.status === "PAID") return fail("Already paid.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.contactEmail)) return fail("Add the client's email to the quote (and save) before sending.");
  try {
    const view = (["both", "proposal", "pricing", "plan", "proposal-plan"] as const).find((v) => v === text(form, "view")) ?? "both";
    const { paymentUrl } = await sendQuote(id, viewer.id, text(form, "message", 2000), form.get("payment") === "on" && (view === "both" || view === "pricing"), view);
    archiveLater("quote", id);
    await recordAuditLog({ action: "quote.sent", entity: "quote", entityId: id, actorId: viewer.id });
    revalidatePath("/admin", "layout");
    return ok(`Sent to ${q.contactEmail}${paymentUrl ? " with a payment link" : ""}.`);
  } catch (error) {
    console.error("[crm] quote send failed", error);
    return fail(error instanceof RazorpayError ? "Razorpay couldn't make the payment link. Check the total, or send without one." : "Couldn't send. Try again.");
  }
}

/** Staff record the client's answer when it came by phone or email. */
export async function setQuoteStatus(form: FormData) {
  const viewer = await requireStaff("plans");
  const id = text(form, "id");
  const status = text(form, "status");
  if (!id || !status) return;
  const prisma = getPrisma();
  const q = await prisma.quote.findFirst({ where: { id, ...quoteScope(viewer) } });
  if (!q || q.status === "PAID") return;
  if (status === "ACCEPTED" || status === "DECLINED") await recordAuditLog({ action: "quote.status", entity: "quote", entityId: id, actorId: viewer.id, metadata: { status } });
  if (status === "ACCEPTED") {
    await prisma.quote.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedBy: `Recorded by ${viewer.name ?? viewer.email}` } });
    archiveLater("quote", id);
    const projectId = await openFor(id);
    revalidatePath("/admin", "layout");
    redirect(`/admin/projects/${projectId}`);
  }
  if (status === "DECLINED") {
    if (q.razorpayLinkId) await razorpay(`payment_links/${q.razorpayLinkId}/cancel`, {}).catch(() => undefined);
    await prisma.quote.update({ where: { id }, data: { status: "DECLINED" } });
    if (q.leadId) await prisma.activity.create({ data: { leadId: q.leadId, kind: "STATUS", actorId: viewer.id, body: `Quote #${q.number} declined.` } });
  }
  revalidatePath("/admin", "layout");
}

/** A row without its own id and parent quote, to copy onto another quote. */
function omitIds<T extends { id: string; quoteId: string }>(row: T): Omit<T, "id" | "quoteId"> {
  const copy: Partial<T> = { ...row };
  delete copy.id;
  delete copy.quoteId;
  return copy as Omit<T, "id" | "quoteId">;
}

/** A copy to edit and re-send — a new number and link; the original stays as it was. */
export async function duplicateQuote(form: FormData) {
  const viewer = await requireStaff("plans");
  const id = text(form, "id");
  if (!id) return;
  const q = await getPrisma().quote.findFirst({ where: { id, ...quoteScope(viewer) }, include: { lines: true, creators: true } });
  if (!q) return;
  const copy = await copyQuote(q, viewer.id, {});
  redirect(`/admin/quotes/${copy.id}`);
}

/**
 * A REVISED PLAN (Genesis, 29 Oct 2026: "a revised copy of the existing plan
 * which will be saved differently"): a copy to change and send again, as
 * many times as it takes, numbered R1, R2… after the first version. Every
 * version stays as it was, with its own client link.
 */
export async function reviseQuote(form: FormData) {
  const viewer = await requireStaff("plans");
  const id = text(form, "id");
  if (!id) return;
  const prisma = getPrisma();
  const q = await prisma.quote.findFirst({ where: { id, ...quoteScope(viewer) }, include: { lines: true, creators: true } });
  if (!q) return;
  const rootId = q.revisionOfId ?? q.id;
  const last = await prisma.quote.aggregate({ where: { OR: [{ id: rootId }, { revisionOfId: rootId }] }, _max: { revision: true } });
  const copy = await copyQuote(q, viewer.id, { revisionOfId: rootId, baseNumber: q.baseNumber ?? q.number, revision: (last._max.revision ?? 0) + 1 });
  await recordAuditLog({ action: "quote.revised", entity: "quote", entityId: copy.id, actorId: viewer.id, metadata: { from: q.id, revision: copy.revision } });
  redirect(`/admin/quotes/${copy.id}`);
}

async function copyQuote(q: Prisma.QuoteGetPayload<{ include: { lines: true; creators: true } }>, actorId: string, revision: { revisionOfId?: string; baseNumber?: number; revision?: number }) {
  const copy = await getPrisma().quote.create({
    data: {
      ...revision,
      kind: q.kind, title: q.title, division: q.division, accountId: q.accountId, leadId: q.leadId, requestId: q.requestId,
      contactName: q.contactName, contactEmail: q.contactEmail, contactPhone: q.contactPhone, company: q.company,
      expiresAt: new Date(Date.now() + 14 * 864e5), notes: q.notes, terms: q.terms, addGst: q.addGst, gstPercent: q.gstPercent, igst: q.igst, discountPaise: q.discountPaise,
      proposalPlatforms: q.proposalPlatforms, proposalProblems: q.proposalProblems, proposalObjectives: q.proposalObjectives, proposalInfluencers: q.proposalInfluencers, proposalTg: q.proposalTg,
      proposalSections: (q.proposalSections ?? []) as Prisma.InputJsonValue, parts: q.parts, planColumns: (q.planColumns ?? {}) as Prisma.InputJsonValue, markupPercent: q.markupPercent, planBudget: q.planBudget,
      token: newToken(), createdById: actorId,
      lines: { create: q.lines.map((l) => omitIds(l)) },
      creators: { create: q.creators.map((c) => ({ ...omitIds(c), extra: (c.extra ?? {}) as Prisma.InputJsonValue })) },
    },
  });
  await refreshTotals(copy.id);
  return copy;
}

export async function deleteQuote(form: FormData) {
  const viewer = await requireStaff("plans");
  const id = text(form, "id");
  if (!id) return;
  const q = await getPrisma().quote.findFirst({ where: { id, ...quoteScope(viewer) } });
  if (!q || q.status === "PAID" || q.status === "ACCEPTED") return;
  if (q.razorpayLinkId) await razorpay(`payment_links/${q.razorpayLinkId}/cancel`, {}).catch(() => undefined);
  await getPrisma().order.deleteMany({ where: { quoteId: id, status: "PENDING" } });
  await getPrisma().quote.delete({ where: { id } });
  await recordAuditLog({ action: "quote.deleted", entity: "quote", entityId: id, actorId: viewer.id });
  redirect("/admin/quotes");
}

/** "Save to Google Drive now": files this quote's PDF in the client's "Quotes & plans" folder straight away. */
export async function archiveQuoteNow(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("plans");
  const id = text(form, "id");
  const q = id ? await getPrisma().quote.findFirst({ where: { id, ...quoteScope(viewer) }, select: { id: true } }) : null;
  if (!q) return fail("That quote isn't yours.");
  try {
    await archiveQuote(q.id);
    revalidatePath(`/admin/quotes/${q.id}`);
    return ok("Saved to Google Drive.");
  } catch (error) {
    return fail(error instanceof DriveNotConnected ? error.message : `Couldn't save to Drive: ${(error as Error).message.slice(0, 140)}`);
  }
}
