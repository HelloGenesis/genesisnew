import "server-only";

import { getPrisma } from "@/lib/db";

import type { LastReach } from "./reachout-status";

/**
 * EACH CREATOR'S REACH-OUTS, ACROSS PLANS (Genesis, 27 Oct 2026: "some
 * reach-outs are done by Ayaan manually; how do we add and track those, and
 * make sure the same influencer is not reached out again and again").
 *
 * Whenever a status is set — by Get costing on WhatsApp, an email from the
 * CRM, or the dropdown by hand on any plan or in the database — it's logged,
 * and the creator keeps the latest: status, when, who, which plan. Every
 * place a creator shows has that line, and contacting one reached in the
 * last 30 days asks first (lib/crm/reachout-status).
 */
export async function recordReach(input: { creatorId?: string | null; quoteId?: string | null; name: string; handle: string; status: string | null; byId: string }) {
  const status = (input.status ?? "").trim().slice(0, 60);
  if (!status) return;
  const prisma = getPrisma();
  await prisma.reachout.create({ data: { creatorId: input.creatorId ?? null, quoteId: input.quoteId ?? null, name: input.name.slice(0, 120), handle: input.handle.slice(0, 80), status, byId: input.byId } });
  if (input.creatorId) {
    await prisma.creator.updateMany({ where: { id: input.creatorId }, data: { reachStatus: status, reachAt: new Date(), reachById: input.byId, reachQuoteId: input.quoteId ?? null } });
  }
}

/** The latest reach-out of each creator, with who and which plan, by creator id. */
export async function lastReaches(creatorIds: (string | null | undefined)[]): Promise<Record<string, LastReach>> {
  const ids = [...new Set(creatorIds.filter((x): x is string => Boolean(x)))];
  if (!ids.length) return {};
  const prisma = getPrisma();
  const rows = await prisma.creator.findMany({ where: { id: { in: ids }, reachAt: { not: null } }, select: { id: true, reachStatus: true, reachAt: true, reachById: true, reachQuoteId: true } });
  const [people, plans] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: rows.map((r) => r.reachById).filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true, email: true } }),
    prisma.quote.findMany({ where: { id: { in: rows.map((r) => r.reachQuoteId).filter((x): x is string => Boolean(x)) } }, select: { id: true, company: true, title: true } }),
  ]);
  return Object.fromEntries(
    rows.map((r) => {
      const who = people.find((p) => p.id === r.reachById);
      const plan = plans.find((p) => p.id === r.reachQuoteId);
      return [r.id, { status: r.reachStatus ?? "", at: r.reachAt!.toISOString(), by: who ? (who.name ?? who.email ?? null)?.split(" ")[0] ?? null : null, plan: plan ? (plan.company || plan.title) : null, planId: plan?.id ?? null }];
    }),
  );
}

/*
 * A CREATOR'S NUMBER AND EMAIL, THE SAME EVERYWHERE (Genesis, 27 Oct 2026:
 * "the same reflects in the database and the influencer plan when updated
 * here or there"). A plan row keeps them in its contact line, with anything
 * else there (an agency, a manager); the database keeps them in phone and
 * email. A change on either side is written to the other.
 */
const PHONE = /(?:\+?\d[\d\s-]{7,}\d)/g;
const EMAIL = /[^\s@·,]+@[^\s@·,]+\.[a-z]{2,}/gi;

/** The contact line with this phone and email in place of the old ones; the rest kept. */
export function mergeContact(old: string | null | undefined, phone: string | null, email: string | null) {
  const rest = (old ?? "")
    .replace(EMAIL, "")
    .replace(PHONE, "")
    .split(/\s*[·,|]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [phone?.trim(), email?.trim().toLowerCase(), ...rest].filter(Boolean).join(" · ") || null;
}

/** After the database's phone or email changed: every plan row of that creator follows. */
export async function syncPlanContacts(creatorId: string) {
  const prisma = getPrisma();
  const c = await prisma.creator.findUnique({ where: { id: creatorId }, select: { phone: true, email: true } });
  if (!c) return;
  const rows = await prisma.quoteCreator.findMany({ where: { creatorId }, select: { id: true, contact: true } });
  for (const r of rows) {
    const next = mergeContact(r.contact, c.phone, c.email);
    if (next !== r.contact) await prisma.quoteCreator.update({ where: { id: r.id }, data: { contact: next } });
  }
}
