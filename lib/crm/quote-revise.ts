import "server-only";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

import { docRef } from "./quote-templates";
import { newToken, refreshTotals } from "./quotes";

type Full = Prisma.QuoteGetPayload<{ include: { lines: true; creators: true } }>;

/** A row without its own id and parent quote, to copy onto another quote. */
function omitIds<T extends { id: string; quoteId: string }>(row: T): Omit<T, "id" | "quoteId"> {
  const copy: Partial<T> = { ...row };
  delete copy.id;
  delete copy.quoteId;
  return copy as Omit<T, "id" | "quoteId">;
}

/** A copy of a quote or plan with a new number and client link; `creators: false` leaves its creator rows out. */
export async function copyQuote(q: Full, actorId: string, revision: { revisionOfId?: string; baseNumber?: number; revision?: number }, opts: { creators?: boolean } = {}) {
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
      ...(opts.creators === false ? {} : { creators: { create: q.creators.map((c) => ({ ...omitIds(c), extra: (c.extra ?? {}) as Prisma.InputJsonValue })) } }),
    },
  });
  await refreshTotals(copy.id);
  return copy;
}

/**
 * A REVISED PLAN (Genesis, 29 Oct 2026: "a revised copy of the existing plan
 * which will be saved differently"): the next revision, R1, R2…, of a quote
 * or plan (whichever version it's made from); every version stays as it was.
 * Used by the Revise button and by Genesis Copilot / ChatGPT (revise_plan).
 */
export async function makeRevision(id: string, actorId: string, opts: { creators?: boolean } = {}) {
  const prisma = getPrisma();
  const q = await prisma.quote.findUniqueOrThrow({ where: { id }, include: { lines: true, creators: true } });
  const rootId = q.revisionOfId ?? q.id;
  const last = await prisma.quote.aggregate({ where: { OR: [{ id: rootId }, { revisionOfId: rootId }] }, _max: { revision: true } });
  const copy = await copyQuote(q, actorId, { revisionOfId: rootId, baseNumber: q.baseNumber ?? q.number, revision: (last._max.revision ?? 0) + 1 }, opts);
  await recordAuditLog({ action: "quote.revised", entity: "quote", entityId: copy.id, actorId, metadata: { from: q.id, revision: copy.revision } });
  return copy;
}

/**
 * A quote or plan by what people call it: its id, its number (#0000048), or a
 * revision (#0000048 R2).
 */
export function refWhere(ref: string): Prisma.QuoteWhereInput {
  const s = ref.trim();
  const rev = /^#?0*(\d+)\s*[-·]?\s*R(\d+)$/i.exec(s);
  if (rev) return { OR: [{ baseNumber: Number(rev[1]), revision: Number(rev[2]) }, ...(rev[2] === "0" ? [{ number: Number(rev[1]) }] : [])] };
  const n = /^#?0*(\d+)$/.exec(s);
  if (n && Number(n[1]) > 0) return { number: Number(n[1]) };
  return { id: s };
}

/** Every version of a quote or plan (the first, then R1, R2…), for the AI to see which is latest. */
export async function versionsOf(q: { id: string; revisionOfId: string | null }) {
  const rootId = q.revisionOfId ?? q.id;
  const rows = await getPrisma().quote.findMany({ where: { OR: [{ id: rootId }, { revisionOfId: rootId }] }, orderBy: { revision: "asc" }, select: { id: true, number: true, baseNumber: true, revision: true, status: true, title: true } });
  return rows.map((v) => ({ id: v.id, number: docRef(v), title: v.title, status: v.status }));
}
