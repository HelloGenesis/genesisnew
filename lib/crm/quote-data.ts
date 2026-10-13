import "server-only";

import { getPrisma } from "@/lib/db";

import { CATALOG, TERMS } from "./quote-templates";

/** A client or lead the quote can be for: picking one fills the contact (Genesis, 13 Oct 2026). */
export type BuilderClient = { key: string; kind: "client" | "agency" | "lead"; accountId: string | null; leadId: string | null; company: string; contactName: string; email: string; phone: string | null };

/** What the quote builder needs from the server: the catalogue, the terms templates, the influencer pool and the clients. */
export async function builderData() {
  const prisma = getPrisma();
  const [pool, accounts, leads] = await Promise.all([
    prisma.creator.findMany({ where: { blacklisted: false }, orderBy: { followers: "desc" }, take: 1000 }),
    prisma.account.findMany({ where: { kind: { in: ["BRAND", "AGENCY"] } }, orderBy: { name: "asc" }, take: 1000, include: { members: { include: { user: { select: { name: true, email: true } } }, take: 1 } } }),
    prisma.lead.findMany({ where: { status: { notIn: ["LOST"] } }, orderBy: { createdAt: "desc" }, take: 1000, select: { id: true, name: true, company: true, email: true, phone: true, accountId: true } }),
  ]);
  const clients: BuilderClient[] = [
    ...accounts.map((a) => ({ key: `a:${a.id}`, kind: a.kind === "AGENCY" ? ("agency" as const) : ("client" as const), accountId: a.id, leadId: null, company: a.legalName || a.name, contactName: a.members[0]?.user.name ?? "", email: a.email ?? a.members[0]?.user.email ?? "", phone: a.phone })),
    ...leads.map((l) => ({ key: `l:${l.id}`, kind: "lead" as const, accountId: l.accountId, leadId: l.id, company: l.company || l.name, contactName: l.name, email: l.email ?? "", phone: l.phone })),
  ];
  return {
    clients,
    catalog: CATALOG.map((c) => ({ ...c })),
    terms: TERMS.map((t) => ({ key: t.key, label: t.label, notes: t.notes, terms: [...t.terms] })),
    pool: pool.map((c) => ({ id: c.id, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, reel: c.reelRatePaise ? c.reelRatePaise / 100 : null, story: c.storyRatePaise ? c.storyRatePaise / 100 : null, dl: c.dlRatePaise ? c.dlRatePaise / 100 : null, contact: [c.phone, c.email, c.managedBy].filter(Boolean).join(" · ") || null })),
  };
}
