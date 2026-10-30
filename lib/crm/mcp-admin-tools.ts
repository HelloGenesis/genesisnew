import "server-only";

import { z } from "zod";

import { getPrisma } from "@/lib/db";

import { LEAD_STATUS } from "./catalog";
import { novaAiBalance } from "./nova-ai";
import { prettyBytes, storageUsed } from "./nova-pro";
import { appUrl } from "./notify";
import { usesAi } from "./scope";
import type { Viewer } from "./session";

/**
 * NOVA COPILOT OVER EVERY CRM (Genesis, 31 Oct 2026: "the internal one is Nova
 * Copilot, the super super admin which has access to all"). Genesis's owners,
 * in Genesis's own CRM, see every agency's CRM from one chat: who's on a
 * trial or paying, how much each uses, and any lead, client, quote, project
 * or invoice in any of them. Read only: changes inside an agency's CRM are
 * made there, from "Viewing". NOVA AI in an agency's CRM never gets these
 * tools (lib/crm/assistant), and each checks again who's asking.
 *
 * Every query names its CRMs (workspaceId) itself, so lib/db's filter to
 * this request's CRM (Genesis's) steps aside for it.
 */

type Tool = { name: string; description: string; input: z.ZodType; readOnly?: boolean; ownerOnly?: boolean; run: (viewer: Viewer, args: never) => Promise<unknown> };

const rupees = (p: number | null | undefined) => (p === null || p === undefined ? null : p / 100);
const OPEN_LEAD = Object.keys(LEAD_STATUS).filter((s) => s !== "WON" && s !== "LOST") as (keyof typeof LEAD_STATUS)[];
const day = (d: Date | null | undefined) => d?.toISOString().slice(0, 10) ?? null;

function owners(viewer: Viewer) {
  if (!usesAi(viewer)) throw new Error("Only Genesis's owners can look across every CRM.");
}

async function agencies() {
  return getPrisma().account.findMany({
    where: { crmWorkspace: true, workspaceId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, city: true, createdAt: true, trialState: true, trialPlan: true, trialStartedAt: true, trialCardDueAt: true, trialEndsAt: true, _count: { select: { crmTeam: true } } },
  });
}

/** Counts per CRM, one query a model. */
async function countsBy(ids: string[]) {
  const prisma = getPrisma();
  const ws = { workspaceId: { in: ids } };
  const [leads, openLeads, quotes, projects, unpaid, lastLead] = await Promise.all([
    prisma.lead.groupBy({ by: ["workspaceId"], where: ws, _count: true }),
    prisma.lead.groupBy({ by: ["workspaceId"], where: { ...ws, status: { in: OPEN_LEAD } }, _count: true }),
    prisma.quote.groupBy({ by: ["workspaceId"], where: ws, _count: true }),
    prisma.project.groupBy({ by: ["workspaceId"], where: { ...ws, status: "ACTIVE" }, _count: true }),
    prisma.invoice.groupBy({ by: ["workspaceId"], where: { ...ws, status: "SENT" }, _count: true, _sum: { totalPaise: true } }),
    prisma.lead.groupBy({ by: ["workspaceId"], where: ws, _max: { updatedAt: true } }),
  ]);
  const of = <T extends { workspaceId: string | null }>(rows: T[], id: string) => rows.find((r) => r.workspaceId === id);
  return (id: string) => ({
    leads: of(leads, id)?._count ?? 0,
    open_leads: of(openLeads, id)?._count ?? 0,
    quotes_and_plans: of(quotes, id)?._count ?? 0,
    active_projects: of(projects, id)?._count ?? 0,
    unpaid_invoices: of(unpaid, id)?._count ?? 0,
    unpaid_amount: rupees(of(unpaid, id)?._sum.totalPaise ?? 0),
    last_lead_change: day(of(lastLead, id)?._max.updatedAt),
  });
}

/** An agency CRM by its name (or part of it) or id. */
async function agencyNamed(name: string) {
  const n = name.trim();
  const list = await agencies();
  return list.find((a) => a.id === n) ?? list.find((a) => a.name.toLowerCase() === n.toLowerCase()) ?? list.find((a) => a.name.toLowerCase().includes(n.toLowerCase())) ?? null;
}

export const ADMIN_TOOLS: Tool[] = [
  {
    name: "all_crms",
    readOnly: true,
    ownerOnly: true,
    description:
      "Genesis's owners only: every agency CRM on Nova, with its trial or plan (TRIAL, CARD_ADDED, ACTIVE, CANCELLED, ENDED), trial dates, team size, leads (open and all), quotes and plans, active projects, unpaid invoices, storage used and NOVA AI credits left. Use for questions across agencies: who's on a trial, who's paying, who's active, who's about to lapse.",
    input: z.object({}),
    run: async (viewer) => {
      owners(viewer);
      const list = await agencies();
      const counts = await countsBy(list.map((a) => a.id));
      const rows = await Promise.all(
        list.map(async (a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          city: a.city,
          joined: day(a.createdAt),
          plan: a.trialPlan,
          state: a.trialState ?? "SET UP BY GENESIS",
          trial_started: day(a.trialStartedAt),
          card_due: day(a.trialCardDueAt),
          trial_ends: day(a.trialEndsAt),
          team: a._count.crmTeam,
          ...counts(a.id),
          storage_used: prettyBytes(await storageUsed(a.id)),
          nova_ai_credits: await novaAiBalance(a.id).catch(() => null),
        })),
      );
      return { agencies: rows, total: rows.length };
    },
  },
  {
    name: "crm_details",
    readOnly: true,
    ownerOnly: true,
    description:
      "Genesis's owners only: one agency's CRM in full, by its name or id: its team (names, emails, admin or member), trial and plan, and its latest leads, clients/brands, quotes and plans, projects and invoices.",
    input: z.object({ crm: z.string().min(1).max(160), limit: z.number().int().min(1).max(30).optional() }),
    run: async (viewer, a: { crm: string; limit?: number }) => {
      owners(viewer);
      const agency = await agencyNamed(a.crm);
      if (!agency) return { error: `No agency CRM called "${a.crm}". Use all_crms for the list.` };
      const prisma = getPrisma();
      const ws = { workspaceId: agency.id };
      const take = a.limit ?? 10;
      const [team, leads, accounts, quotes, projects, invoices] = await Promise.all([
        prisma.user.findMany({ where: { workspaceId: agency.id }, select: { name: true, email: true, workspaceRole: true } }),
        prisma.lead.findMany({ where: ws, orderBy: { updatedAt: "desc" }, take, select: { name: true, company: true, status: true, updatedAt: true } }),
        prisma.account.findMany({ where: ws, orderBy: { updatedAt: "desc" }, take, select: { name: true, kind: true, status: true, city: true } }),
        prisma.quote.findMany({ where: ws, orderBy: { updatedAt: "desc" }, take, select: { title: true, company: true, kind: true, status: true, totalPaise: true, updatedAt: true } }),
        prisma.project.findMany({ where: ws, orderBy: { updatedAt: "desc" }, take, select: { name: true, status: true, dueDate: true } }),
        prisma.invoice.findMany({ where: ws, orderBy: { updatedAt: "desc" }, take, select: { number: true, status: true, totalPaise: true, dueDate: true, paidAt: true } }),
      ]);
      const counts = (await countsBy([agency.id]))(agency.id);
      return {
        crm: { id: agency.id, name: agency.name, email: agency.email, plan: agency.trialPlan, state: agency.trialState ?? "SET UP BY GENESIS", trial_ends: day(agency.trialEndsAt), storage_used: prettyBytes(await storageUsed(agency.id)), nova_ai_credits: await novaAiBalance(agency.id).catch(() => null), ...counts },
        team: team.map((u) => ({ name: u.name, email: u.email, role: u.workspaceRole ?? "MEMBER" })),
        latest_leads: leads.map((l) => ({ name: l.name, company: l.company, status: LEAD_STATUS[l.status]?.label ?? l.status, updated: day(l.updatedAt) })),
        clients: accounts,
        latest_quotes_and_plans: quotes.map((q) => ({ title: q.title, client: q.company, kind: q.kind === "INFLUENCER_PLAN" ? "influencer plan" : "price quote", status: q.status, total: rupees(q.totalPaise), updated: day(q.updatedAt) })),
        projects: projects.map((p) => ({ ...p, dueDate: day(p.dueDate) })),
        invoices: invoices.map((i) => ({ number: i.number, status: i.status, total: rupees(i.totalPaise), due: day(i.dueDate), paid: day(i.paidAt) })),
        open_it: appUrl("/admin"),
        note: `To change anything in ${agency.name}'s CRM, pick it under "Viewing" at the top of the CRM.`,
      };
    },
  },
  {
    name: "search_all_crms",
    readOnly: true,
    ownerOnly: true,
    description:
      "Genesis's owners only: search every agency's CRM at once for a lead, client/brand, quote or plan, or project by text (name, company, email, title). Each result says which agency's CRM it's in. For Genesis's own CRM use search_crm.",
    input: z.object({ query: z.string().min(1).max(200), limit: z.number().int().min(1).max(30).optional() }),
    run: async (viewer, a: { query: string; limit?: number }) => {
      owners(viewer);
      const list = await agencies();
      const name = new Map(list.map((x) => [x.id, x.name]));
      const ws = { workspaceId: { in: list.map((x) => x.id) } };
      const q = a.query.trim();
      const take = a.limit ?? 10;
      const text = (fields: string[]) => ({ OR: fields.map((f) => ({ [f]: { contains: q, mode: "insensitive" as const } })) });
      const prisma = getPrisma();
      const [leads, accounts, quotes, projects] = await Promise.all([
        prisma.lead.findMany({ where: { ...ws, ...text(["name", "company", "email", "phone"]) }, orderBy: { updatedAt: "desc" }, take, select: { workspaceId: true, name: true, company: true, email: true, status: true } }),
        prisma.account.findMany({ where: { ...ws, ...text(["name", "legalName", "email", "city"]) }, orderBy: { updatedAt: "desc" }, take, select: { workspaceId: true, name: true, kind: true, email: true, city: true } }),
        prisma.quote.findMany({ where: { ...ws, ...text(["title", "company"]) }, orderBy: { updatedAt: "desc" }, take, select: { workspaceId: true, title: true, company: true, status: true, totalPaise: true } }),
        prisma.project.findMany({ where: { ...ws, ...text(["name"]) }, orderBy: { updatedAt: "desc" }, take, select: { workspaceId: true, name: true, status: true, dueDate: true } }),
      ]);
      const crm = (r: { workspaceId: string | null }) => name.get(r.workspaceId ?? "") ?? "?";
      return {
        leads: leads.map(({ workspaceId, ...l }) => ({ crm: crm({ workspaceId }), ...l, status: LEAD_STATUS[l.status]?.label ?? l.status })),
        clients: accounts.map(({ workspaceId, ...x }) => ({ crm: crm({ workspaceId }), ...x })),
        quotes_and_plans: quotes.map(({ workspaceId, totalPaise, ...x }) => ({ crm: crm({ workspaceId }), ...x, total: rupees(totalPaise) })),
        projects: projects.map(({ workspaceId, dueDate, ...x }) => ({ crm: crm({ workspaceId }), ...x, due: day(dueDate) })),
      };
    },
  },
];
