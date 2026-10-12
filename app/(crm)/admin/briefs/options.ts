import "server-only";

import { getPrisma } from "@/lib/db";

/** The lead and client choices for a brief. */
export async function briefOptions() {
  const prisma = getPrisma();
  const [leads, accounts] = await Promise.all([
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] } }, orderBy: { createdAt: "desc" }, take: 300, select: { id: true, name: true, company: true } }),
    prisma.account.findMany({ where: { kind: { in: ["BRAND", "AGENCY"] } }, orderBy: { name: "asc" }, take: 500, select: { id: true, name: true } }),
  ]);
  return {
    leads: leads.map((l) => [l.id, l.company ? `${l.company} · ${l.name}` : l.name] as [string, string]),
    accounts: accounts.map((a) => [a.id, a.name] as [string, string]),
  };
}
