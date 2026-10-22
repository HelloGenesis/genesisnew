import "server-only";

import { getPrisma } from "@/lib/db";

import { creatorAccess, creatorScope } from "./scope";
import type { Viewer } from "./session";

/**
 * INFLUENCERS' NUMBERS AND EMAILS ARE CONFIDENTIAL TOO (Genesis, 22 Oct 2026:
 * "any confidential data like numbers, emails… should not leak to other
 * users"). On a plan, a creator's contact shows to someone with all
 * influencer data; otherwise only for creators in their own access, and, for
 * a row typed by hand, only to the plan's maker. Returns a test per row.
 */
export async function contactVisibility(viewer: Viewer, quote: { createdById: string | null }, creatorIds: (string | null)[]) {
  if (creatorAccess(viewer) === "all") return () => true;
  const ids = creatorIds.filter((x): x is string => Boolean(x));
  const mine = creatorAccess(viewer) === "none" || ids.length === 0 ? new Set<string>() : new Set((await getPrisma().creator.findMany({ where: { id: { in: ids }, ...creatorScope(viewer) }, select: { id: true } })).map((c) => c.id));
  return (row: { creatorId: string | null }) => (row.creatorId ? mine.has(row.creatorId) : quote.createdById === viewer.id);
}
