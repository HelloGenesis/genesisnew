import "server-only";

import { z } from "zod";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { AccountKind, AccountStatus, ActivityKind, Division, LeadSource, LeadStatus, Priority } from "@/lib/generated/prisma/enums";
import { sanitizeHtml } from "@/lib/rich-text";

import { LEAD_STATUS } from "./catalog";
import { appUrl } from "./notify";
import { amount } from "./plan-import";
import { winLead } from "./projects";
import { newToken, refreshTotals } from "./quotes";
import { docRef, termsByKey, termsFor } from "./quote-templates";
import { refWhere, versionsOf } from "./quote-revise";
import { accountScope, isSuperAdmin, leadScope, projectScope, quoteScope, seesQuoteContact } from "./scope";
import { can, type Viewer } from "./session";
import { queueSheet } from "./sheets";
import { notifyAssignee } from "./task-notify";

/**
 * THE REST OF THE CRM FOR THE AI (Genesis, 27 Oct 2026: "make quotes and
 * plans and proposals and other things on the CRM AI assistant … make and do
 * any changes in the CRM"). Price quotes with their line items and proposal,
 * leads, clients / agencies / vendors, notes and calls, and tasks: found,
 * made and changed with the same rules as the CRM's own pages. Like the
 * influencer tools (lib/crm/mcp-tools), nothing is deleted and nothing is
 * sent to a client: quotes stay drafts until someone sends them from the CRM.
 */

type Tool = { name: string; description: string; input: z.ZodType; readOnly?: boolean; run: (viewer: Viewer, args: never) => Promise<unknown> };

const DIVISIONS = ["AI_LAB", "STUDIOS", "BRAND_DESIGN", "INFLUENCE"] as const;
const LEAD_STATUSES = Object.keys(LEAD_STATUS) as LeadStatus[];
const LEAD_SOURCES = ["WEBSITE_FORM", "CHECKOUT", "WHATSAPP", "CALL", "REFERRAL", "PARTNER", "INSTAGRAM", "LINKEDIN", "EVENT", "OUTBOUND", "CHATGPT", "CALENDAR_BOOKING", "EMAIL", "GOOGLE_DRIVE", "SHEET_IMPORT", "OTHER"] as const;

const rupees = (p: number | null | undefined) => (p === null || p === undefined ? null : p / 100);
const toPaise = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : amount(v);
  return n === null ? null : Math.round(n * 100);
};
const money = z.union([z.number(), z.string()]).optional();
const day = (v: string | null | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00.000Z`) : null);
const quoteLink = (id: string) => appUrl(`/admin/quotes/${id}`);

/** The AI writes plain text or Markdown-ish lists; the proposal keeps rich text. Kept as HTML when it already is. */
function html(text: string | null | undefined): string | null {
  const t = (text ?? "").trim();
  if (!t) return null;
  if (/<(p|ul|ol|li|h[1-6]|strong|em|br|div|table)\b/i.test(t)) return sanitizeHtml(t) || null;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(`<ul>${list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const line of t.split(/\n/)) {
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) list.push(bullet[1]!);
    else {
      flush();
      if (line.trim()) out.push(`<p>${esc(line.trim())}</p>`);
    }
  }
  flush();
  return sanitizeHtml(out.join("")) || null;
}
const plain = (h: string | null | undefined) => (h ?? "").replace(/<li>/g, "\n- ").replace(/<\/(p|h\d)>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\n{3,}/g, "\n\n").trim() || null;

/** A staff member by email or name, for owners and assignees. */
async function person(who: string | null | undefined) {
  const w = (who ?? "").trim();
  if (!w) return null;
  const u = await getPrisma().user.findFirst({ where: { staffRoles: { some: {} }, OR: [{ email: { equals: w.toLowerCase() } }, { name: { contains: w, mode: "insensitive" } }] }, select: { id: true, name: true, email: true } });
  if (!u) throw new Error(`No one on the team called "${w}".`);
  return u;
}

/* --- Quotes and proposals ------------------------------------------------------ */

const lineIn = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  details: z.union([z.array(z.string().max(500)), z.string().max(4000)]).optional().describe("What's included: one bullet per item."),
  note: z.string().max(1000).optional().describe("Small print under the bullets."),
  qty: z.number().int().min(1).max(10000).optional(),
  unit_price: money.describe("The client's price for one, in rupees, before GST. Leave out to use cost + markup."),
  cost: money.describe("What it costs Genesis (a vendor's price), in rupees for one. With markup_percent, makes the client's price. Not shown to the client."),
  division: z.enum(DIVISIONS).optional(),
});
type LineIn = z.infer<typeof lineIn>;

const proposalIn = z
  .object({
    platforms: z.array(z.string().max(40)).max(12).optional(),
    target_group: z.string().max(20000).optional().describe("Who it's for (the TG). Plain text; '- ' lines become bullets."),
    problems: z.string().max(20000).optional(),
    objectives: z.string().max(20000).optional(),
    influencers: z.string().max(20000).optional().describe("The influencer approach, for a proposal with creators."),
    sections: z.array(z.object({ title: z.string().max(120), text: z.string().max(20000) })).max(20).optional().describe("More boxes after the standard ones, e.g. 'Concept', 'Timeline', 'Deliverables'. Replaces the existing extra boxes."),
  })
  .optional();
type ProposalIn = z.infer<typeof proposalIn>;

const quoteFields = {
  title: z.string().max(200).optional(),
  client: z.string().max(160).optional().describe("Client or agency name (an existing one is linked), or a lead's name."),
  contact_name: z.string().max(120).optional(),
  contact_email: z.string().max(200).optional(),
  contact_phone: z.string().max(30).optional(),
  division: z.enum(DIVISIONS).optional(),
  markup_percent: z.number().min(0).max(1000).optional().describe("Added on line costs to make client prices (e.g. 50)."),
  discount: money.describe("A discount off the subtotal, rupees."),
  add_gst: z.boolean().optional(),
  gst_percent: z.number().min(0).max(28).optional(),
  igst: z.boolean().optional().describe("Client outside Maharashtra."),
  notes: z.string().max(6000).optional().describe("Notes on the quote (shoot location, timelines…), one a line."),
  terms: z.string().max(12000).optional().describe("Terms, one a line. Leave out for the division's standard terms."),
  valid_days: z.number().int().min(1).max(365).optional(),
  proposal: proposalIn,
  parts: z.array(z.enum(["proposal", "plan", "pricing"])).optional().describe("What the client sees: the proposal, the influencer plan, the pricing. Default: all it has."),
};

const lineRows = (lines: LineIn[], markup: number) =>
  lines.map((l, i) => {
    const cost = toPaise(l.cost);
    const unit = toPaise(l.unit_price) ?? (cost === null ? 0 : Math.round(cost * (1 + markup / 100)));
    const details = Array.isArray(l.details) ? l.details.join("\n") : (l.details ?? null);
    return { position: i, kind: "custom", division: l.division ?? null, title: l.title.slice(0, 200), subtitle: l.subtitle ?? null, details: details?.split("\n").map((d) => d.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean).join("\n") || null, note: l.note ?? null, qty: l.qty ?? 1, unitPaise: unit };
  });

/** The client: an existing account or lead by name, linked; else just the name on the quote. */
async function clientOf(viewer: Viewer, name: string | null | undefined) {
  const n = (name ?? "").trim();
  if (!n) return { accountId: null, leadId: null, company: null as string | null, contactName: null as string | null, contactEmail: null as string | null, contactPhone: null as string | null };
  const prisma = getPrisma();
  const account = await prisma.account.findFirst({ where: { AND: [accountScope(viewer), { kind: { in: ["BRAND", "AGENCY"] } }, { OR: [{ name: { equals: n, mode: "insensitive" } }, { legalName: { equals: n, mode: "insensitive" } }, { name: { contains: n, mode: "insensitive" } }] }] }, include: { members: { include: { user: { select: { name: true, email: true } } }, take: 1 } } });
  if (account) return { accountId: account.id, leadId: null, company: account.legalName || account.name, contactName: account.members[0]?.user.name ?? null, contactEmail: account.email ?? account.members[0]?.user.email ?? null, contactPhone: account.phone };
  const lead = await prisma.lead.findFirst({ where: { AND: [leadScope(viewer), { OR: [{ company: { contains: n, mode: "insensitive" } }, { name: { contains: n, mode: "insensitive" } }] }] }, orderBy: { updatedAt: "desc" } });
  if (lead) return { accountId: lead.accountId, leadId: lead.id, company: lead.company || lead.name, contactName: lead.name, contactEmail: lead.email, contactPhone: lead.phone };
  return { accountId: null, leadId: null, company: n, contactName: null, contactEmail: null, contactPhone: null };
}

async function quoteFor(viewer: Viewer, ref: string) {
  if (!can(viewer, "plans")) throw new Error("You don't have access to quotes.");
  const q = await getPrisma().quote.findFirst({ where: { AND: [quoteScope(viewer), refWhere(ref)] } });
  if (!q) throw new Error("No quote with that id or number that you can open.");
  return q;
}

async function quoteOut(viewer: Viewer, id: string) {
  const q = await getPrisma().quote.findUniqueOrThrow({ where: { id }, include: { lines: { orderBy: { position: "asc" } }, lead: { select: { ownerId: true, createdById: true } }, _count: { select: { creators: true } } } });
  const showClient = seesQuoteContact(viewer, q);
  const sections = (Array.isArray(q.proposalSections) ? q.proposalSections : []) as { title: string; html: string }[];
  return {
    id: q.id, number: docRef(q), kind: q.kind === "INFLUENCER_PLAN" ? "influencer plan" : "price quote", status: q.status, title: q.title, client: q.company,
    versions: await versionsOf(q),
    contact: showClient ? { name: q.contactName, email: q.contactEmail, phone: q.contactPhone } : "private",
    division: q.division, valid_until: q.expiresAt.toISOString().slice(0, 10),
    lines: q.lines.map((l) => ({ title: l.title, subtitle: l.subtitle, details: l.details?.split("\n") ?? [], note: l.note, qty: l.qty, unit_price: rupees(l.unitPaise), amount: rupees(l.unitPaise * l.qty) })),
    discount: rupees(q.discountPaise), gst: q.addGst ? `${q.gstPercent}%${q.igst ? " IGST" : ""}` : "none",
    subtotal: rupees(q.subtotalPaise), tax: rupees(q.taxPaise), total: rupees(q.totalPaise),
    creators_on_plan: q._count.creators,
    proposal: { platforms: q.proposalPlatforms, target_group: plain(q.proposalTg), problems: plain(q.proposalProblems), objectives: plain(q.proposalObjectives), influencers: plain(q.proposalInfluencers), sections: sections.map((s) => ({ title: s.title, text: plain(s.html) })) },
    notes: q.notes, terms: q.terms, parts: q.parts,
    link: quoteLink(q.id), client_view: appUrl(`/quote/${q.token}`),
  };
}

const proposalData = (p: ProposalIn) =>
  p
    ? {
        ...(p.platforms ? { proposalPlatforms: p.platforms } : {}),
        ...(p.target_group !== undefined ? { proposalTg: html(p.target_group) } : {}),
        ...(p.problems !== undefined ? { proposalProblems: html(p.problems) } : {}),
        ...(p.objectives !== undefined ? { proposalObjectives: html(p.objectives) } : {}),
        ...(p.influencers !== undefined ? { proposalInfluencers: html(p.influencers) } : {}),
        ...(p.sections ? { proposalSections: p.sections.map((s) => ({ title: s.title.trim(), html: html(s.text) ?? "" })).filter((s) => s.title || s.html) as Prisma.InputJsonValue } : {}),
      }
    : {};

type QuoteArgs = { title?: string; client?: string; contact_name?: string; contact_email?: string; contact_phone?: string; division?: Division; markup_percent?: number; discount?: number | string; add_gst?: boolean; gst_percent?: number; igst?: boolean; notes?: string; terms?: string; valid_days?: number; proposal?: ProposalIn; parts?: string[] };

/* --- Leads, clients, notes, tasks ---------------------------------------------- */

const leadOut = (l: Prisma.LeadGetPayload<{ include: { owner: { select: { name: true; email: true } } } }>) => ({
  id: l.id, name: l.name, company: l.company, designation: l.designation, email: l.email, phone: l.phone, status: LEAD_STATUS[l.status]?.label ?? l.status, source: l.source, division: l.division, interest: l.interest,
  value: rupees(l.valuePaise), owner: l.owner?.name ?? l.owner?.email ?? null, next_follow_up: l.nextFollowUp?.toISOString().slice(0, 10) ?? null, notes: l.notes, link: appUrl(`/admin/leads/${l.id}`),
});

const accountOut = (a: Prisma.AccountGetPayload<object>) => ({
  id: a.id, kind: a.kind, status: a.status, name: a.name, legal_name: a.legalName, gstin: a.gstin, billing_address: a.billingAddress, city: a.city, state: a.state, website: a.website, industry: a.industry,
  email: a.email, phone: a.phone, tags: a.tags, vendor_skills: a.vendorSkills, vendor_rates: a.vendorRateNote, notes: a.notes, link: appUrl(`/admin/accounts/${a.id}`),
});

/* --- The tools ----------------------------------------------------------------- */

export const CRM_TOOLS: Tool[] = [
  {
    name: "search_crm",
    readOnly: true,
    description: "Search the CRM's leads, clients/agencies/vendors, projects, tasks and quotes/plans by text (name, company, email, title). Returns ids and links to use with the other tools.",
    input: z.object({ query: z.string().max(200).optional(), types: z.array(z.enum(["leads", "clients", "vendors", "projects", "tasks", "quotes"])).optional(), limit: z.number().int().min(1).max(30).optional() }),
    run: async (viewer, a: { query?: string; types?: string[]; limit?: number }) => {
      const prisma = getPrisma();
      const want = (t: string) => !a.types?.length || a.types.includes(t);
      const take = a.limit ?? 10;
      const q = a.query?.trim();
      const text = (fields: string[]) => (q ? { OR: fields.map((f) => ({ [f]: { contains: q, mode: "insensitive" } })) } : {});
      const out: Record<string, unknown> = {};
      if (want("leads") && can(viewer, "sales")) out.leads = (await prisma.lead.findMany({ where: { AND: [leadScope(viewer), text(["name", "company", "email", "phone"])] }, orderBy: { updatedAt: "desc" }, take, include: { owner: { select: { name: true, email: true } } } })).map(leadOut);
      if ((want("clients") || want("vendors")) && can(viewer, "sales")) {
        const kinds: AccountKind[] = [...(want("clients") ? (["BRAND", "AGENCY"] as const) : []), ...(want("vendors") ? (["VENDOR"] as const) : [])];
        out.accounts = (await prisma.account.findMany({ where: { AND: [accountScope(viewer), { kind: { in: kinds } }, text(["name", "legalName", "email", "city"])] }, orderBy: { updatedAt: "desc" }, take })).map(accountOut);
      }
      if (want("projects")) out.projects = (await prisma.project.findMany({ where: { AND: [projectScope(viewer), text(["name"])] }, orderBy: { updatedAt: "desc" }, take, select: { id: true, name: true, status: true, dueDate: true } })).map((p) => ({ ...p, link: appUrl(`/admin/projects/${p.id}`) }));
      if (want("tasks")) out.tasks = (await prisma.task.findMany({ where: { AND: [isSuperAdmin(viewer) ? {} : { OR: [{ ownerId: viewer.id }, { createdById: viewer.id }] }, text(["title", "details"])] }, orderBy: [{ status: "asc" }, { dueDate: "asc" }], take, include: { owner: { select: { name: true, email: true } } } })).map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, due: t.dueDate?.toISOString().slice(0, 10) ?? null, owner: t.owner?.name ?? t.owner?.email ?? null, link: appUrl("/admin/tasks") }));
      if (want("quotes") && can(viewer, "plans")) out.quotes = (await prisma.quote.findMany({ where: { AND: [quoteScope(viewer), text(["title", "company"])] }, orderBy: { updatedAt: "desc" }, take, select: { id: true, number: true, baseNumber: true, revision: true, kind: true, title: true, company: true, status: true, totalPaise: true } })).map((x) => ({ id: x.id, number: docRef(x), kind: x.kind === "INFLUENCER_PLAN" ? "influencer plan" : "price quote", title: x.title, client: x.company, status: x.status, total: rupees(x.totalPaise), link: quoteLink(x.id) }));
      return out;
    },
  },
  {
    name: "get_quote",
    readOnly: true,
    description: "A price quote or plan by id or number (e.g. #0000046): its line items, totals, GST, proposal (TG, problems, objectives, boxes), notes, terms and links.",
    input: z.object({ quote: z.string() }),
    run: async (viewer, a: { quote: string }) => quoteOut(viewer, (await quoteFor(viewer, a.quote)).id),
  },
  {
    name: "create_quote",
    description:
      "Make a new price quote (a draft): line items (title, bullets of what's included, qty, the client's unit price, or a vendor cost plus markup_percent), GST, discount, notes, terms and optionally a proposal (target group, problems, objectives, extra boxes). For a vendor's costing '+50%', give each line's cost and markup_percent 50. The division's standard notes and terms are used unless given. Never sent to the client: someone sends it from the CRM. Returns the quote with its link.",
    input: z.object({ ...quoteFields, title: z.string().min(1).max(200), lines: z.array(lineIn).max(60) }),
    run: async (viewer, a: QuoteArgs & { title: string; lines: LineIn[] }) => {
      if (!can(viewer, "plans")) throw new Error("You don't have access to quotes.");
      const client = await clientOf(viewer, a.client);
      const tpl = a.division ? termsFor(a.division) : termsByKey("production-ugc");
      const markup = a.markup_percent ?? 0;
      const q = await getPrisma().quote.create({
        data: {
          kind: "QUOTE", title: a.title, division: a.division ?? null, accountId: client.accountId, leadId: client.leadId, company: client.company,
          contactName: a.contact_name ?? client.contactName ?? "", contactEmail: (a.contact_email ?? client.contactEmail ?? "").toLowerCase(), contactPhone: a.contact_phone ?? client.contactPhone ?? null,
          expiresAt: new Date(Date.now() + (a.valid_days ?? 14) * 864e5), notes: a.notes ?? tpl?.notes ?? null, terms: a.terms ?? tpl?.terms.join("\n") ?? null,
          addGst: a.add_gst ?? true, gstPercent: a.gst_percent ?? 18, igst: a.igst ?? false, discountPaise: toPaise(a.discount) ?? 0, markupPercent: Math.round(markup),
          token: newToken(), createdById: viewer.id, updatedById: viewer.id, parts: a.parts ?? [], ...proposalData(a.proposal),
          lines: { create: lineRows(a.lines, markup) },
        },
      });
      await refreshTotals(q.id);
      await recordAuditLog({ action: "ai.create_quote", entity: "quote", entityId: q.id, actorId: viewer.id, metadata: { lines: a.lines.length } });
      return quoteOut(viewer, q.id);
    },
  },
  {
    name: "update_quote",
    description:
      "Change a price quote or an influencer plan's quote parts: title, client, contact, GST, discount, notes, terms, validity, proposal boxes, and the line items. 'lines' REPLACES all line items with the ones given (send the full list); 'add_lines' appends. A paid quote can't be changed. To change a plan's creators use update_plan.",
    input: z.object({ quote: z.string().describe("Quote id, or number like #0000046."), ...quoteFields, lines: z.array(lineIn).max(60).optional(), add_lines: z.array(lineIn).max(60).optional() }),
    run: async (viewer, a: QuoteArgs & { quote: string; lines?: LineIn[]; add_lines?: LineIn[] }) => {
      const q = await quoteFor(viewer, a.quote);
      if (q.status === "PAID") throw new Error("This quote is paid; duplicate it in the CRM to change it.");
      const prisma = getPrisma();
      const client = a.client ? await clientOf(viewer, a.client) : null;
      const markup = a.markup_percent ?? q.markupPercent;
      const showClient = seesQuoteContact(viewer, { createdById: q.createdById, lead: q.leadId ? await prisma.lead.findUnique({ where: { id: q.leadId }, select: { ownerId: true, createdById: true } }) : null });
      const data: Prisma.QuoteUpdateInput = {
        ...(a.title ? { title: a.title } : {}),
        ...(client && showClient ? { company: client.company, account: client.accountId ? { connect: { id: client.accountId } } : { disconnect: true }, lead: client.leadId ? { connect: { id: client.leadId } } : { disconnect: true } } : {}),
        ...(showClient && a.contact_name !== undefined ? { contactName: a.contact_name } : {}),
        ...(showClient && a.contact_email !== undefined ? { contactEmail: a.contact_email.toLowerCase() } : {}),
        ...(showClient && a.contact_phone !== undefined ? { contactPhone: a.contact_phone } : {}),
        ...(a.division ? { division: a.division } : {}),
        ...(a.markup_percent !== undefined ? { markupPercent: Math.round(a.markup_percent) } : {}),
        ...(a.discount !== undefined ? { discountPaise: toPaise(a.discount) ?? 0 } : {}),
        ...(a.add_gst !== undefined ? { addGst: a.add_gst } : {}),
        ...(a.gst_percent !== undefined ? { gstPercent: Math.round(a.gst_percent) } : {}),
        ...(a.igst !== undefined ? { igst: a.igst } : {}),
        ...(a.notes !== undefined ? { notes: a.notes } : {}),
        ...(a.terms !== undefined ? { terms: a.terms } : {}),
        ...(a.valid_days ? { expiresAt: new Date(Date.now() + a.valid_days * 864e5) } : {}),
        ...(a.parts ? { parts: a.parts } : {}),
        ...proposalData(a.proposal),
        updatedById: viewer.id,
      };
      await prisma.$transaction(async (tx) => {
        await tx.quote.update({ where: { id: q.id }, data });
        if (a.lines) {
          await tx.quoteLine.deleteMany({ where: { quoteId: q.id } });
          await tx.quoteLine.createMany({ data: lineRows(a.lines, markup).map((l) => ({ ...l, quoteId: q.id })) });
        }
        if (a.add_lines?.length) {
          const start = await tx.quoteLine.count({ where: { quoteId: q.id } });
          await tx.quoteLine.createMany({ data: lineRows(a.add_lines, markup).map((l) => ({ ...l, position: l.position + start, quoteId: q.id })) });
        }
      });
      await refreshTotals(q.id);
      await recordAuditLog({ action: "ai.update_quote", entity: "quote", entityId: q.id, actorId: viewer.id });
      return quoteOut(viewer, q.id);
    },
  },
  {
    name: "save_lead",
    description: `Add a lead, or change one (give its id): name, company, designation, email, phone, division, interest, source, status (${LEAD_STATUSES.join(", ")}), deal value in rupees, owner (a teammate's name or email), next follow-up (YYYY-MM-DD) and notes. A status change is logged; Won opens the client and project.`,
    input: z.object({
      id: z.string().optional(),
      name: z.string().max(120).optional(),
      company: z.string().max(160).optional(),
      designation: z.string().max(100).optional(),
      email: z.string().max(200).optional(),
      phone: z.string().max(30).optional(),
      division: z.enum(DIVISIONS).optional(),
      interest: z.string().max(200).optional(),
      source: z.enum(LEAD_SOURCES).optional(),
      status: z.enum(LEAD_STATUSES as [LeadStatus, ...LeadStatus[]]).optional(),
      value: money,
      owner: z.string().max(200).optional(),
      next_follow_up: z.string().optional(),
      lost_reason: z.string().max(500).optional(),
      notes: z.string().max(6000).optional(),
    }),
    run: async (viewer, a: { id?: string; name?: string; company?: string; designation?: string; email?: string; phone?: string; division?: Division; interest?: string; source?: LeadSource; status?: LeadStatus; value?: number | string; owner?: string; next_follow_up?: string; lost_reason?: string; notes?: string }) => {
      if (!can(viewer, "sales")) throw new Error("You don't have access to leads.");
      const prisma = getPrisma();
      const owner = a.owner ? await person(a.owner) : null;
      const fields = {
        ...(a.name ? { name: a.name } : {}), ...(a.company !== undefined ? { company: a.company } : {}), ...(a.designation !== undefined ? { designation: a.designation } : {}),
        ...(a.email !== undefined ? { email: a.email.toLowerCase() || null } : {}), ...(a.phone !== undefined ? { phone: a.phone || null } : {}), ...(a.division ? { division: a.division } : {}),
        ...(a.interest !== undefined ? { interest: a.interest } : {}), ...(a.source ? { source: a.source } : {}), ...(a.value !== undefined ? { valuePaise: toPaise(a.value) ?? 0 } : {}),
        ...(owner ? { ownerId: owner.id } : {}), ...(a.next_follow_up ? { nextFollowUp: day(a.next_follow_up) } : {}), ...(a.notes !== undefined ? { notes: a.notes } : {}),
      };
      if (!a.id) {
        if (!a.name) throw new Error("A new lead needs a name.");
        const lead = await prisma.lead.create({ data: { name: a.name, ...fields, status: a.status ?? "NEW", source: a.source ?? "OTHER", ownerId: owner?.id ?? viewer.id, nextFollowUp: day(a.next_follow_up) ?? new Date(), createdById: viewer.id } });
        await queueSheet("leads", lead.id).catch(() => undefined);
        await recordAuditLog({ action: "ai.create_lead", entity: "lead", entityId: lead.id, actorId: viewer.id });
        return leadOut((await prisma.lead.findUniqueOrThrow({ where: { id: lead.id }, include: { owner: { select: { name: true, email: true } } } })));
      }
      const before = await prisma.lead.findFirst({ where: { id: a.id, ...leadScope(viewer) } });
      if (!before) throw new Error("No lead with that id that's yours.");
      const status = a.status ?? before.status;
      await prisma.lead.update({ where: { id: a.id }, data: { ...fields, status, ...(status === "WON" || status === "LOST" ? { nextFollowUp: null } : {}), ...(status === "LOST" && a.lost_reason ? { lostReason: a.lost_reason } : {}) } });
      if (status !== before.status) {
        await prisma.activity.create({ data: { leadId: a.id, kind: "STATUS", actorId: viewer.id, body: `${LEAD_STATUS[before.status].label} → ${LEAD_STATUS[status].label}` } });
        if (status === "WON") await winLead(a.id, viewer.id, "Lead won (Nova Copilot).");
      }
      await queueSheet("leads", a.id).catch(() => undefined);
      await recordAuditLog({ action: "ai.update_lead", entity: "lead", entityId: a.id, actorId: viewer.id });
      return leadOut(await prisma.lead.findUniqueOrThrow({ where: { id: a.id }, include: { owner: { select: { name: true, email: true } } } }));
    },
  },
  {
    name: "save_client",
    description: "Add a client, agency or vendor (kind BRAND, AGENCY or VENDOR), or change one (give its id): name, legal name, GSTIN, billing address, city, state, website, industry, email, phone, tags, notes, status (PROSPECT, ACTIVE, PAUSED, CHURNED); vendors' skills and rates.",
    input: z.object({
      id: z.string().optional(),
      kind: z.enum(["BRAND", "AGENCY", "VENDOR"]).optional(),
      status: z.enum(["PROSPECT", "ACTIVE", "PAUSED", "CHURNED"]).optional(),
      name: z.string().max(160).optional(),
      legal_name: z.string().max(200).optional(),
      gstin: z.string().max(20).optional(),
      billing_address: z.string().max(600).optional(),
      city: z.string().max(80).optional(),
      state: z.string().max(80).optional(),
      website: z.string().max(300).optional(),
      industry: z.string().max(120).optional(),
      email: z.string().max(200).optional(),
      phone: z.string().max(30).optional(),
      tags: z.array(z.string().max(40)).max(20).optional(),
      vendor_skills: z.array(z.string().max(60)).max(20).optional(),
      vendor_rates: z.string().max(400).optional(),
      notes: z.string().max(6000).optional(),
    }),
    run: async (viewer, a: { id?: string; kind?: AccountKind; status?: AccountStatus; name?: string; legal_name?: string; gstin?: string; billing_address?: string; city?: string; state?: string; website?: string; industry?: string; email?: string; phone?: string; tags?: string[]; vendor_skills?: string[]; vendor_rates?: string; notes?: string }) => {
      if (!can(viewer, "sales")) throw new Error("You don't have access to clients.");
      const prisma = getPrisma();
      const data = {
        ...(a.kind ? { kind: a.kind } : {}), ...(a.status ? { status: a.status } : {}), ...(a.name ? { name: a.name } : {}), ...(a.legal_name !== undefined ? { legalName: a.legal_name } : {}),
        ...(a.gstin !== undefined ? { gstin: a.gstin.toUpperCase() } : {}), ...(a.billing_address !== undefined ? { billingAddress: a.billing_address } : {}), ...(a.city !== undefined ? { city: a.city } : {}),
        ...(a.state !== undefined ? { state: a.state } : {}), ...(a.website !== undefined ? { website: a.website } : {}), ...(a.industry !== undefined ? { industry: a.industry } : {}),
        ...(a.email !== undefined ? { email: a.email.toLowerCase() || null } : {}), ...(a.phone !== undefined ? { phone: a.phone || null } : {}), ...(a.tags ? { tags: a.tags } : {}),
        ...(a.vendor_skills ? { vendorSkills: a.vendor_skills } : {}), ...(a.vendor_rates !== undefined ? { vendorRateNote: a.vendor_rates } : {}), ...(a.notes !== undefined ? { notes: a.notes } : {}),
      };
      if (!a.id) {
        if (!a.name) throw new Error("A new client needs a name.");
        const made = await prisma.account.create({ data: { name: a.name, ...data, managerId: viewer.id } });
        await queueSheet("accounts", made.id).catch(() => undefined);
        await recordAuditLog({ action: "ai.create_account", entity: "account", entityId: made.id, actorId: viewer.id });
        return accountOut(made);
      }
      const before = await prisma.account.findFirst({ where: { id: a.id, ...accountScope(viewer) } });
      if (!before) throw new Error("No client with that id that you can change.");
      const saved = await prisma.account.update({ where: { id: a.id }, data });
      await queueSheet("accounts", a.id).catch(() => undefined);
      await recordAuditLog({ action: "ai.update_account", entity: "account", entityId: a.id, actorId: viewer.id });
      return accountOut(saved);
    },
  },
  {
    name: "log_note",
    description: "Add a note, call, meeting, email or WhatsApp to a lead, client or project's timeline (give one of their ids); optionally move the lead's next follow-up (YYYY-MM-DD).",
    input: z.object({ body: z.string().min(1).max(6000), kind: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "WHATSAPP"]).optional(), lead_id: z.string().optional(), client_id: z.string().optional(), project_id: z.string().optional(), next_follow_up: z.string().optional() }),
    run: async (viewer, a: { body: string; kind?: ActivityKind; lead_id?: string; client_id?: string; project_id?: string; next_follow_up?: string }) => {
      const prisma = getPrisma();
      if (!a.lead_id && !a.client_id && !a.project_id) throw new Error("Say which lead, client or project it's for.");
      if (a.lead_id && !(await prisma.lead.findFirst({ where: { id: a.lead_id, ...leadScope(viewer) }, select: { id: true } }))) throw new Error("That lead isn't yours.");
      if (a.client_id && !(await prisma.account.findFirst({ where: { id: a.client_id, ...accountScope(viewer) }, select: { id: true } }))) throw new Error("That client isn't one you can see.");
      if (a.project_id && !(await prisma.project.findFirst({ where: { id: a.project_id, ...projectScope(viewer) }, select: { id: true } }))) throw new Error("That project isn't one you can see.");
      const made = await prisma.activity.create({ data: { kind: a.kind ?? "NOTE", body: a.body, leadId: a.lead_id ?? null, accountId: a.client_id ?? null, projectId: a.project_id ?? null, actorId: viewer.id } });
      const follow = day(a.next_follow_up);
      if (a.lead_id && follow) await prisma.lead.update({ where: { id: a.lead_id }, data: { nextFollowUp: follow } });
      return { ok: true, id: made.id };
    },
  },
  {
    name: "save_task",
    description: "Add a task, or change one (give its id): title, details, due date (YYYY-MM-DD), priority (LOW, NORMAL, HIGH), owner (a teammate's name or email; they're emailed), what it's about (lead, client or project id), links, and done true/false.",
    input: z.object({
      id: z.string().optional(),
      title: z.string().max(200).optional(),
      details: z.string().max(6000).optional(),
      due: z.string().optional(),
      priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
      owner: z.string().max(200).optional(),
      lead_id: z.string().optional(),
      client_id: z.string().optional(),
      project_id: z.string().optional(),
      links: z.array(z.string().max(500)).max(10).optional(),
      done: z.boolean().optional(),
    }),
    run: async (viewer, a: { id?: string; title?: string; details?: string; due?: string; priority?: Priority; owner?: string; lead_id?: string; client_id?: string; project_id?: string; links?: string[]; done?: boolean }) => {
      const prisma = getPrisma();
      const owner = a.owner ? await person(a.owner) : null;
      const data = {
        ...(a.title ? { title: a.title } : {}), ...(a.details !== undefined ? { details: a.details } : {}), ...(a.due ? { dueDate: day(a.due) } : {}), ...(a.priority ? { priority: a.priority } : {}),
        ...(owner ? { ownerId: owner.id } : {}), ...(a.lead_id ? { leadId: a.lead_id } : {}), ...(a.client_id ? { accountId: a.client_id } : {}), ...(a.project_id ? { projectId: a.project_id } : {}),
        ...(a.links ? { links: a.links.filter((l) => /^https?:\/\//i.test(l)) } : {}),
        ...(a.done !== undefined ? (a.done ? { status: "DONE" as const, completedAt: new Date() } : { status: "OPEN" as const, completedAt: null }) : {}),
      };
      if (!a.id) {
        if (!a.title) throw new Error("A new task needs a title.");
        const t = await prisma.task.create({ data: { title: a.title, ...data, ownerId: owner?.id ?? viewer.id, createdById: viewer.id } });
        await notifyAssignee(t.id, viewer.id);
        return { id: t.id, title: t.title, owner: owner?.name ?? owner?.email ?? "you", link: appUrl("/admin/tasks") };
      }
      const before = await prisma.task.findUnique({ where: { id: a.id } });
      if (!before || (!isSuperAdmin(viewer) && before.ownerId !== viewer.id && before.createdById !== viewer.id)) throw new Error("No task with that id that's yours.");
      const t = await prisma.task.update({ where: { id: a.id }, data });
      if (owner && owner.id !== before.ownerId) await notifyAssignee(t.id, viewer.id);
      return { id: t.id, title: t.title, status: t.status, link: appUrl("/admin/tasks") };
    },
  },
  {
    name: "save_subscription",
    description:
      "Add one of the company's own subscriptions (a tool Genesis pays for: ChatGPT, Canva, Adobe…) to Our subscriptions, or change one (give its id): name, vendor, category, amount in rupees per cycle (0 for a free trial), cycle (MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY), next due date (YYYY-MM-DD: when it renews or a free trial ends), auto-renew, payment method, notes, active. Finance gets a reminder before it renews. Finance access only.",
    input: z.object({
      id: z.string().optional(),
      name: z.string().max(120).optional(),
      vendor: z.string().max(120).optional(),
      category: z.string().max(60).optional(),
      amount: money,
      cycle: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]).optional(),
      next_due_date: z.string().optional(),
      auto_renew: z.boolean().optional(),
      payment_method: z.string().max(80).optional(),
      notes: z.string().max(1000).optional(),
      active: z.boolean().optional(),
    }),
    run: async (viewer, a: { id?: string; name?: string; vendor?: string; category?: string; amount?: number | string; cycle?: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY"; next_due_date?: string; auto_renew?: boolean; payment_method?: string; notes?: string; active?: boolean }) => {
      if (!can(viewer, "finance") || viewer.workspaceId) throw new Error("Only Genesis's finance team can change the company's subscriptions.");
      const prisma = getPrisma();
      const due = day(a.next_due_date);
      const data = {
        ...(a.name ? { name: a.name } : {}), ...(a.vendor !== undefined ? { vendor: a.vendor } : {}), ...(a.category !== undefined ? { category: a.category } : {}),
        ...(a.amount !== undefined ? { amountPaise: toPaise(a.amount) ?? 0 } : {}), ...(a.cycle ? { cycle: a.cycle } : {}), ...(due ? { nextDueDate: due } : {}),
        ...(a.auto_renew !== undefined ? { autoRenew: a.auto_renew } : {}), ...(a.payment_method !== undefined ? { paymentMethod: a.payment_method } : {}),
        ...(a.notes !== undefined ? { notes: a.notes } : {}), ...(a.active !== undefined ? { active: a.active } : {}),
      };
      const saved = a.id
        ? await prisma.companySubscription.update({ where: { id: a.id }, data })
        : await (async () => {
            if (!a.name || !due) throw new Error("A new subscription needs a name and its next due date (when it renews or the trial ends).");
            return prisma.companySubscription.create({ data: { name: a.name, amountPaise: toPaise(a.amount) ?? 0, nextDueDate: due, ownerId: viewer.id, ...data } });
          })();
      await recordAuditLog({ action: a.id ? "ai.update_subscription" : "ai.create_subscription", entity: "company_subscription", entityId: saved.id, actorId: viewer.id });
      return { id: saved.id, name: saved.name, amount: rupees(saved.amountPaise), cycle: saved.cycle, next_due: saved.nextDueDate.toISOString().slice(0, 10), active: saved.active, link: appUrl("/admin/expenses/subscriptions") };
    },
  },
];
