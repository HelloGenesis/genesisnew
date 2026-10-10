"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { type ActionState, fail, ok, text } from "@/lib/crm/form-state";
import { newToken, openFor, refreshTotals, sendQuote } from "@/lib/crm/quotes";
import { requireStaff } from "@/lib/crm/session";
import { RazorpayError, razorpay } from "@/lib/razorpay";

/** The quote builder's server side. Sales and owners. */

const DIVISIONS = ["AI_LAB", "STUDIOS", "BRAND_DESIGN", "INFLUENCE"] as const;
const rupees = z.coerce.number().min(0).max(10_000_000);

const payload = z.object({
  id: z.string().optional(),
  kind: z.enum(["QUOTE", "INFLUENCER_PLAN"]),
  title: z.string().trim().min(1).max(200),
  division: z.enum(DIVISIONS).nullable().optional(),
  accountId: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  contactName: z.string().trim().min(1).max(120),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().max(30).nullable().optional(),
  company: z.string().trim().max(160).nullable().optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(6000).nullable().optional(),
  terms: z.string().max(12000).nullable().optional(),
  addGst: z.boolean(),
  gstPercent: z.coerce.number().int().min(0).max(28),
  discount: rupees,
  lines: z
    .array(
      z.object({
        kind: z.string().max(20),
        productId: z.string().max(120).nullable().optional(),
        division: z.enum(DIVISIONS).nullable().optional(),
        title: z.string().trim().min(1).max(200),
        subtitle: z.string().max(300).nullable().optional(),
        details: z.string().max(4000).nullable().optional(),
        note: z.string().max(1000).nullable().optional(),
        qty: z.coerce.number().int().min(1).max(10000),
        unit: rupees,
      }),
    )
    .max(60),
  creators: z
    .array(
      z.object({
        creatorId: z.string().nullable().optional(),
        name: z.string().max(120),
        handle: z.string().max(80),
        platform: z.string().max(20),
        profileUrl: z.string().max(300).nullable().optional(),
        followers: z.coerce.number().int().min(0),
        avgViews: z.coerce.number().int().min(0).nullable().optional(),
        niches: z.array(z.string().max(40)).max(10),
        city: z.string().max(80).nullable().optional(),
        deliverables: z.string().max(300).nullable().optional(),
        fee: rupees.nullable().optional(),
      }),
    )
    .max(200),
});

const paise = (r: number) => Math.round(r * 100);

/** Creates or updates a quote from the builder (the form posts its state as JSON). */
export async function saveQuote(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  const parsed = payload.safeParse(JSON.parse(String(form.get("payload") ?? "{}")));
  if (!parsed.success) return fail(`Check the quote: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
  const q = parsed.data;
  if (q.lines.length === 0 && q.creators.length === 0) return fail("Add at least one line.");
  const prisma = getPrisma();
  const data = {
    kind: q.kind,
    title: q.title,
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
    discountPaise: paise(q.discount),
  };
  const lines = q.lines.map((l, i) => ({ position: i, kind: l.kind, productId: l.productId ?? null, division: l.division ?? null, title: l.title, subtitle: l.subtitle || null, details: l.details || null, note: l.note || null, qty: l.qty, unitPaise: paise(l.unit) }));
  const creators = q.creators.map((c, i) => ({ position: i, creatorId: c.creatorId ?? null, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl ?? null, followers: c.followers, avgViews: c.avgViews ?? null, niches: c.niches, city: c.city ?? null, deliverables: c.deliverables || null, feePaise: c.fee === null || c.fee === undefined ? null : paise(c.fee) }));

  let id = q.id;
  if (id) {
    const before = await prisma.quote.findUnique({ where: { id } });
    if (!before) return fail("That quote no longer exists.");
    if (before.status === "PAID") return fail("This quote is paid; duplicate it to change it.");
    await prisma.$transaction([
      prisma.quoteLine.deleteMany({ where: { quoteId: id } }),
      prisma.quoteCreator.deleteMany({ where: { quoteId: id } }),
      prisma.quote.update({ where: { id }, data: { ...data, lines: { create: lines }, creators: { create: creators } } }),
    ]);
  } else {
    const created = await prisma.quote.create({ data: { ...data, token: newToken(), createdById: viewer.id, lines: { create: lines }, creators: { create: creators } } });
    id = created.id;
  }
  await refreshTotals(id);
  revalidatePath("/admin", "layout");
  if (!q.id) redirect(`/admin/quotes/${id}?saved=1`);
  return ok("Saved.");
}

/** Emails the quotation (with a payment link when asked) — see lib/crm/quotes sendQuote. */
export async function sendQuoteAction(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  if (!id) return fail("Save the quote first.");
  const q = await getPrisma().quote.findUnique({ where: { id } });
  if (!q) return fail("That quote no longer exists.");
  if (q.status === "PAID") return fail("Already paid.");
  try {
    const { paymentUrl } = await sendQuote(id, viewer.id, text(form, "message", 2000), form.get("payment") === "on");
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
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  const status = text(form, "status");
  if (!id || !status) return;
  const prisma = getPrisma();
  const q = await prisma.quote.findUnique({ where: { id } });
  if (!q || q.status === "PAID") return;
  if (status === "ACCEPTED") {
    await prisma.quote.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedBy: `Recorded by ${viewer.name ?? viewer.email}` } });
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
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  if (!id) return;
  const q = await getPrisma().quote.findUnique({ where: { id }, include: { lines: true, creators: true } });
  if (!q) return;
  const copy = await getPrisma().quote.create({
    data: {
      kind: q.kind, title: q.title, division: q.division, accountId: q.accountId, leadId: q.leadId, requestId: q.requestId,
      contactName: q.contactName, contactEmail: q.contactEmail, contactPhone: q.contactPhone, company: q.company,
      expiresAt: new Date(Date.now() + 14 * 864e5), notes: q.notes, terms: q.terms, addGst: q.addGst, gstPercent: q.gstPercent, discountPaise: q.discountPaise,
      token: newToken(), createdById: viewer.id,
      lines: { create: q.lines.map((l) => omitIds(l)) },
      creators: { create: q.creators.map((c) => omitIds(c)) },
    },
  });
  await refreshTotals(copy.id);
  redirect(`/admin/quotes/${copy.id}`);
}

export async function deleteQuote(form: FormData) {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  if (!id) return;
  const q = await getPrisma().quote.findUnique({ where: { id } });
  if (!q || q.status === "PAID" || q.status === "ACCEPTED") return;
  if (q.razorpayLinkId) await razorpay(`payment_links/${q.razorpayLinkId}/cancel`, {}).catch(() => undefined);
  await getPrisma().order.deleteMany({ where: { quoteId: id, status: "PENDING" } });
  await getPrisma().quote.delete({ where: { id } });
  await recordAuditLog({ action: "quote.deleted", entity: "quote", entityId: id, actorId: viewer.id });
  redirect("/admin/quotes");
}
