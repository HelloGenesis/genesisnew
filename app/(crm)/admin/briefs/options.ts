import "server-only";

import { accountScope, leadScope } from "@/lib/crm/scope";
import type { Viewer } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

/** The lead and client choices for a brief: only the ones this person may see (leads are confidential). */
export async function briefOptions(viewer: Viewer) {
  const prisma = getPrisma();
  const [leads, accounts] = await Promise.all([
    prisma.lead.findMany({ where: { ...leadScope(viewer), status: { notIn: ["WON", "LOST"] } }, orderBy: { createdAt: "desc" }, take: 300, select: { id: true, name: true, company: true } }),
    prisma.account.findMany({ where: { ...accountScope(viewer), kind: { in: ["BRAND", "AGENCY"] } }, orderBy: { name: "asc" }, take: 500, select: { id: true, name: true } }),
  ]);
  return {
    leads: leads.map((l) => [l.id, l.company ? `${l.company} · ${l.name}` : l.name] as [string, string]),
    accounts: accounts.map((a) => [a.id, a.name] as [string, string]),
  };
}
