import "server-only";

import { getPrisma } from "@/lib/db";
import { briefScope, invoiceScope, leadScope, projectScope, quoteScope } from "./scope";
import type { Viewer } from "./session";

/*
 * LEAD TO MONEY, ONE ROW PER BRIEF (Genesis, 17 Nov 2026: "a tracker for each new lead, each new brief from
 * a new lead as well as from existing clients … like the projects timeline"). Every stage is read from the
 * records themselves, nothing to tick by hand: a brief or a new lead, its quote, the client's yes, the
 * project, the invoice, and the money. A brief finds its quote by its lead (or, for an existing client, its
 * client), the first one made from the day before the brief on that no other brief has taken.
 */
export const DEAL_STAGES = ["Brief in", "Quote made", "Quote sent", "Accepted", "Delivery", "Invoiced", "Invoice sent", "Paid"] as const;

export type DealRow = { id: string; href: string; ref: string; name: string; client: string; start: Date; due: Date | null; stage: number; active: boolean; note: string };

const DAY = 864e5;

export async function dealRows(viewer: Viewer, limit = 60): Promise<DealRow[]> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - 180 * DAY);
  const [briefs, leads] = await Promise.all([
    prisma.brief.findMany({ where: { ...briefScope(viewer), createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, number: true, title: true, leadId: true, accountId: true, deadline: true, createdAt: true } }),
    prisma.lead.findMany({ where: { ...leadScope(viewer), createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, name: true, company: true, status: true, createdAt: true } }),
  ]);
  const leadIds = [...new Set([...leads.map((l) => l.id), ...briefs.map((b) => b.leadId).filter((x): x is string => Boolean(x))])];
  const accountIds = [...new Set(briefs.map((b) => b.accountId).filter((x): x is string => Boolean(x)))];
  const [quotes, accounts, briefLeads] = await Promise.all([
    prisma.quote.findMany({ where: { ...quoteScope(viewer), OR: [{ leadId: { in: leadIds } }, { accountId: { in: accountIds } }] }, orderBy: { createdAt: "asc" }, select: { id: true, number: true, leadId: true, accountId: true, status: true, createdAt: true, sentAt: true, expiresAt: true } }),
    prisma.account.findMany({ where: { id: { in: accountIds } }, select: { id: true, name: true } }),
    prisma.lead.findMany({ where: { id: { in: briefs.map((b) => b.leadId).filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true, company: true, status: true } }),
  ]);
  const quoteIds = quotes.map((q) => q.id);
  const [projects, invoices] = await Promise.all([
    prisma.project.findMany({ where: { ...projectScope(viewer), quoteId: { in: quoteIds } }, select: { quoteId: true, status: true, dueDate: true } }),
    prisma.invoice.findMany({ where: { ...invoiceScope(viewer), quoteId: { in: quoteIds }, status: { not: "CANCELLED" } }, select: { quoteId: true, status: true } }),
  ]);

  const taken = new Set<string>();
  const quoteFor = (leadId: string | null, accountId: string | null, after: Date) => {
    const q = quotes.find((x) => !taken.has(x.id) && x.createdAt.getTime() >= after.getTime() - DAY && (leadId ? x.leadId === leadId : x.accountId === accountId));
    if (q) taken.add(q.id);
    return q ?? null;
  };
  /* Which stage it's on, and whether it's still moving. */
  const progress = (q: (typeof quotes)[number] | null, lost: boolean) => {
    if (!q) return { stage: 1, active: !lost, note: lost ? "Lost" : "No quote yet" };
    const sent = q.status !== "DRAFT";
    const yes = q.status === "ACCEPTED" || q.status === "PAID";
    const project = projects.find((p) => p.quoteId === q.id);
    const invoice = invoices.find((i) => i.quoteId === q.id);
    const paid = q.status === "PAID" && !invoice ? true : invoice?.status === "PAID";
    const done = [true, true, sent, yes, project ? project.status === "DELIVERED" : paid, Boolean(invoice) || (q.status === "PAID" && !invoice), invoice ? invoice.status !== "DRAFT" : q.status === "PAID", paid];
    const stage = done.findIndex((d) => !d);
    const dead = lost || q.status === "DECLINED" || q.status === "EXPIRED";
    return { stage: stage === -1 ? DEAL_STAGES.length - 1 : stage, active: stage !== -1 && !dead, note: stage === -1 ? "Money in" : dead ? (q.status === "EXPIRED" ? "Quote expired" : q.status === "DECLINED" ? "Declined" : "Lost") : `Quote #${String(q.number).padStart(7, "0")}`, due: project?.dueDate ?? null };
  };

  const rows: DealRow[] = [];
  for (const b of briefs) {
    const lead = briefLeads.find((l) => l.id === b.leadId);
    const q = quoteFor(b.leadId, b.accountId, b.createdAt);
    const p = progress(q, lead?.status === "LOST");
    rows.push({ id: `b:${b.id}`, href: `/admin/briefs/${b.id}`, ref: `Brief ${b.number}`, name: b.title, client: accounts.find((a) => a.id === b.accountId)?.name ?? lead?.company ?? lead?.name ?? "—", start: b.createdAt, due: b.deadline ?? ("due" in p ? p.due : null) ?? null, stage: p.stage, active: p.active, note: `${b.accountId && !b.leadId ? "Existing client · " : ""}${p.note}` });
  }
  /* A new lead with no brief yet still gets its row. */
  const briefed = new Set(briefs.map((b) => b.leadId));
  for (const l of leads) {
    if (briefed.has(l.id)) continue;
    const q = quoteFor(l.id, null, l.createdAt);
    const p = progress(q, l.status === "LOST");
    rows.push({ id: `l:${l.id}`, href: `/admin/leads/${l.id}`, ref: "New lead", name: l.company || l.name, client: l.name, start: l.createdAt, due: ("due" in p ? p.due : null) ?? null, stage: p.stage, active: p.active, note: p.note });
  }
  /* Moving ones first, newest first. */
  return rows.sort((a, b) => Number(b.active) - Number(a.active) || b.start.getTime() - a.start.getTime()).slice(0, limit);
}
