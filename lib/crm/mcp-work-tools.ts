import "server-only";

import { z } from "zod";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { Division, ExpenseCategory, ProjectStatus, RequestStatus } from "@/lib/generated/prisma/enums";

import { projectRef, todayIst } from "./catalog";
import { assignSignatory, HOME_STATE, newInvoiceToken, nextNumber, refreshInvoice, stateFromGstin } from "./invoices";
import { appUrl } from "./notify";
import { amount } from "./plan-import";
import { openProject } from "./projects";
import { quoteRef } from "./quote-templates";
import { accountScope, invoiceScope, isSuperAdmin, leadScope, projectScope, quoteScope, through } from "./scope";
import { can, type Viewer } from "./session";
import { queueSheet } from "./sheets";
import { stagesOf } from "./stages";

/**
 * THE REST OF THE CRM'S WORK FOR THE AI (Genesis, 28 Oct 2026: "I want the
 * AI to do it all, everything across the website, with a single prompt…
 * check all the features and make sure Genesis AI does everything in and out
 * of the CRM"). Projects and their stages and dates, invoices, expenses,
 * briefs, client requests, vendor jobs, and the numbers. Same rules as the
 * pages: each person only what their role opens; nothing deleted, nothing
 * emailed to a client or vendor (invoices stay drafts until sent from the CRM).
 */

type Tool = { name: string; description: string; input: z.ZodType; readOnly?: boolean; run: (viewer: Viewer, args: never) => Promise<unknown> };

const DIVISIONS = ["AI_LAB", "STUDIOS", "BRAND_DESIGN", "INFLUENCE"] as const;
const money = z.union([z.number(), z.string()]).optional();
const toPaise = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : amount(v);
  return n === null ? null : Math.round(n * 100);
};
const rupees = (p: number | null | undefined) => (p === null || p === undefined ? null : p / 100);
const day = (v: string | null | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00.000Z`) : null);
const iso = (d: Date | null | undefined) => d?.toISOString().slice(0, 10) ?? null;

async function person(who: string | null | undefined) {
  const w = (who ?? "").trim();
  if (!w) return null;
  const u = await getPrisma().user.findFirst({ where: { staffRoles: { some: {} }, OR: [{ email: { equals: w.toLowerCase() } }, { name: { contains: w, mode: "insensitive" } }] }, select: { id: true, name: true, email: true } });
  if (!u) throw new Error(`No one on the team called "${w}".`);
  return u;
}

/** A client or vendor by id or name, as this person may see. */
async function accountFor(viewer: Viewer, ref: string, kinds: ("BRAND" | "AGENCY" | "VENDOR")[]) {
  const a = await getPrisma().account.findFirst({ where: { AND: [accountScope(viewer), { kind: { in: kinds } }, { OR: [{ id: ref }, { name: { equals: ref, mode: "insensitive" } }, { legalName: { equals: ref, mode: "insensitive" } }, { name: { contains: ref, mode: "insensitive" } }] }] } });
  if (!a) throw new Error(`No ${kinds.includes("VENDOR") && kinds.length === 1 ? "vendor" : "client"} called "${ref}" that you can see. Add it first (save_client).`);
  return a;
}

/** A project by id, or number like P-0004. */
async function projectFor(viewer: Viewer, ref: string) {
  const n = Number(ref.replace(/^P-?0*/i, ""));
  const p = await getPrisma().project.findFirst({ where: { AND: [projectScope(viewer), /^P-?\d+$/i.test(ref) && n > 0 ? { number: n } : { id: ref }] }, include: { account: { select: { name: true } }, manager: { select: { name: true, email: true } } } });
  if (!p) throw new Error("No project with that id or number that you can open.");
  return p;
}

const projectOut = (p: Awaited<ReturnType<typeof projectFor>>) => ({
  id: p.id, number: projectRef(p.number), name: p.name, client: p.account.name, division: p.division, status: p.status,
  stage: stagesOf(p)[p.stage] ?? null, stages: stagesOf(p), start: iso(p.startDate), due: iso(p.dueDate), producer: p.manager?.name ?? p.manager?.email ?? null, brief: p.brief,
  link: appUrl(`/admin/projects/${p.id}`),
});

const invoiceOut = async (id: string) => {
  const i = await getPrisma().invoice.findUniqueOrThrow({ where: { id }, include: { lines: { orderBy: { position: "asc" } } } });
  return {
    id: i.id, number: i.number, status: i.status, bill_to: i.billToName, gstin: i.billToGstin, issue_date: iso(i.issueDate), due_date: iso(i.dueDate),
    lines: i.lines.map((l) => ({ description: l.description, qty: l.qty, unit_price: rupees(l.unitPaise) })),
    subtotal: rupees(i.subtotalPaise), gst: rupees(i.cgstPaise + i.sgstPaise + i.igstPaise), total: rupees(i.totalPaise), link: appUrl(`/admin/invoices/${i.id}`),
  };
};

export const WORK_TOOLS: Tool[] = [
  {
    name: "crm_overview",
    readOnly: true,
    description: "The numbers at a glance for this person (or everyone, for a super admin): open pipeline and follow-ups due, quotes out with clients, active and late projects, open client requests, unpaid invoices, overdue tasks, and this month's expenses.",
    input: z.object({}),
    run: async (viewer) => {
      const prisma = getPrisma();
      const today = new Date(todayIst());
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const [pipeline, due, quotesOut, active, late, requests, unpaid, tasks, spend] = await Promise.all([
        can(viewer, "sales") ? prisma.lead.aggregate({ where: { ...leadScope(viewer), status: { notIn: ["WON", "LOST", "NURTURE"] } }, _sum: { valuePaise: true }, _count: true }) : null,
        can(viewer, "sales") ? prisma.lead.count({ where: { ...leadScope(viewer), status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: today } } }) : null,
        can(viewer, "plans") ? prisma.quote.aggregate({ where: { ...quoteScope(viewer), status: { in: ["SENT", "VIEWED"] } }, _sum: { totalPaise: true }, _count: true }) : null,
        prisma.project.count({ where: { ...projectScope(viewer), status: "ACTIVE" } }),
        prisma.project.count({ where: { ...projectScope(viewer), status: "ACTIVE", dueDate: { lt: today } } }),
        prisma.request.count({ where: { ...through("account", accountScope(viewer)), status: { in: ["OPEN", "IN_PROGRESS"] } } }),
        can(viewer, "sales") || can(viewer, "finance") ? prisma.invoice.aggregate({ where: { ...invoiceScope(viewer), status: "SENT" }, _sum: { totalPaise: true }, _count: true }) : null,
        prisma.task.count({ where: { status: "OPEN", ownerId: viewer.id, dueDate: { lt: today } } }),
        can(viewer, "finance") && !viewer.workspaceId ? prisma.expense.aggregate({ where: { date: { gte: monthStart } }, _sum: { amountPaise: true } }) : null,
      ]);
      return {
        ...(pipeline ? { open_pipeline: { leads: pipeline._count, value: rupees(pipeline._sum.valuePaise ?? 0), follow_ups_due: due } } : {}),
        ...(quotesOut ? { quotes_out_with_clients: { count: quotesOut._count, value: rupees(quotesOut._sum.totalPaise ?? 0) } } : {}),
        projects: { active, late },
        open_client_requests: requests,
        ...(unpaid ? { unpaid_invoices: { count: unpaid._count, value: rupees(unpaid._sum.totalPaise ?? 0) } } : {}),
        your_overdue_tasks: tasks,
        ...(spend ? { expenses_this_month: rupees(spend._sum.amountPaise ?? 0) } : {}),
      };
    },
  },
  {
    name: "save_project",
    description:
      "Open a project for a client (client, name, division AI_LAB / STUDIOS / BRAND_DESIGN / INFLUENCE, optional due date, producer, brief, and the quote it came from), or change one (id or number like P-0004): name, start or due date (YYYY-MM-DD), producer (teammate's name or email), brief, status (ACTIVE, ON_HOLD, DELIVERED, CANCELLED), or its stage — by name, or \"next\". Moving stages here doesn't email the client.",
    input: z.object({
      project: z.string().optional().describe("Id or number, to change one."),
      client: z.string().max(160).optional(),
      name: z.string().max(200).optional(),
      division: z.enum(DIVISIONS).optional(),
      quote: z.string().optional().describe("The quote it came from (number like #0000049)."),
      start_date: z.string().optional(),
      due_date: z.string().optional(),
      producer: z.string().max(200).optional(),
      brief: z.string().max(10000).optional(),
      status: z.enum(["ACTIVE", "ON_HOLD", "DELIVERED", "CANCELLED"]).optional(),
      stage: z.string().max(120).optional(),
    }),
    run: async (viewer, a: { project?: string; client?: string; name?: string; division?: Division; quote?: string; start_date?: string; due_date?: string; producer?: string; brief?: string; status?: ProjectStatus; stage?: string }) => {
      if (!can(viewer, "delivery") && !can(viewer, "sales")) throw new Error("You don't have access to projects.");
      const prisma = getPrisma();
      const producer = a.producer ? await person(a.producer) : null;
      if (!a.project) {
        if (!a.client || !a.name || !a.division) throw new Error("A new project needs the client, a name and the division.");
        const client = await accountFor(viewer, a.client, ["BRAND", "AGENCY"]);
        const quote = a.quote ? await prisma.quote.findFirst({ where: { AND: [quoteScope(viewer), { number: Number(a.quote.replace(/^#?0*/, "")) || -1 }] }, select: { id: true } }) : null;
        const made = await openProject({ accountId: client.id, name: a.name, division: a.division, quoteId: quote?.id ?? null, managerId: producer?.id ?? viewer.id, brief: a.brief ?? null, dueDate: day(a.due_date), why: "Opened by Genesis Copilot.", actorId: viewer.id });
        await recordAuditLog({ action: "ai.create_project", entity: "project", entityId: made.id, actorId: viewer.id });
        return projectOut(await projectFor(viewer, made.id));
      }
      const p = await projectFor(viewer, a.project);
      const stages = stagesOf(p);
      let stage = p.stage;
      if (a.stage) {
        const want = a.stage.trim().toLowerCase();
        stage = want === "next" ? Math.min(stages.length - 1, p.stage + 1) : stages.findIndex((s) => s.toLowerCase() === want || s.toLowerCase().includes(want));
        if (stage < 0) throw new Error(`No stage "${a.stage}". Its stages: ${stages.join(", ")}.`);
      }
      const status = a.status ?? (stage === stages.length - 1 && stage !== p.stage ? "DELIVERED" : p.status);
      await prisma.project.update({
        where: { id: p.id },
        data: { ...(a.name ? { name: a.name } : {}), ...(day(a.start_date) ? { startDate: day(a.start_date) } : {}), ...(day(a.due_date) ? { dueDate: day(a.due_date) } : {}), ...(producer ? { managerId: producer.id } : {}), ...(a.brief !== undefined ? { brief: a.brief } : {}), stage, status },
      });
      if (stage !== p.stage || status !== p.status) await prisma.activity.create({ data: { projectId: p.id, kind: "STATUS", actorId: viewer.id, body: `${stages[p.stage]} → ${stages[stage]}${status !== p.status ? ` · ${status.toLowerCase()}` : ""} (Genesis Copilot)` } });
      await queueSheet("projects", p.id).catch(() => undefined);
      await recordAuditLog({ action: "ai.update_project", entity: "project", entityId: p.id, actorId: viewer.id });
      return projectOut(await projectFor(viewer, p.id));
    },
  },
  {
    name: "create_invoice",
    description:
      "Make a draft GST tax invoice (never sent: someone sends it from the CRM). Either from a quote (its number: lines, client and billing details come from it) or with a client and lines (description, qty, unit price in rupees before GST). Optional: bill-to name, email, GSTIN (sets CGST+SGST or IGST), address, issue date (default today), payment terms in days (default 15), PO number, notes. Sales or finance only.",
    input: z.object({
      quote: z.string().optional(),
      client: z.string().max(160).optional(),
      lines: z.array(z.object({ description: z.string().min(1).max(500), qty: z.number().int().min(1).max(100000).optional(), unit_price: money, sac: z.string().max(10).optional() })).max(60).optional(),
      bill_to_name: z.string().max(200).optional(),
      bill_to_email: z.string().max(200).optional(),
      gstin: z.string().max(20).optional(),
      address: z.string().max(600).optional(),
      issue_date: z.string().optional(),
      payment_days: z.number().int().min(0).max(180).optional(),
      po_number: z.string().max(60).optional(),
      discount: money,
      notes: z.string().max(4000).optional(),
    }),
    run: async (viewer, a: { quote?: string; client?: string; lines?: { description: string; qty?: number; unit_price?: number | string; sac?: string }[]; bill_to_name?: string; bill_to_email?: string; gstin?: string; address?: string; issue_date?: string; payment_days?: number; po_number?: string; discount?: number | string; notes?: string }) => {
      if (!can(viewer, "sales") && !can(viewer, "finance")) throw new Error("You don't have access to invoices.");
      const prisma = getPrisma();
      const q = a.quote ? await prisma.quote.findFirst({ where: { AND: [quoteScope(viewer), { number: Number(a.quote.replace(/^#?0*/, "")) || -1 }] }, include: { lines: { orderBy: { position: "asc" } }, account: true } }) : null;
      if (a.quote && !q) throw new Error("No quote with that number that you can open.");
      const account = a.client ? await accountFor(viewer, a.client, ["BRAND", "AGENCY"]) : (q?.account ?? null);
      const lines = a.lines?.length
        ? a.lines.map((l, i) => ({ position: i, description: l.description, sac: l.sac || "998361", qty: l.qty ?? 1, unit: "NOS", unitPaise: toPaise(l.unit_price) ?? 0 }))
        : (q?.lines ?? []).map((l, i) => ({ position: i, description: [l.title, l.subtitle].filter(Boolean).join(" · "), sac: "998361", qty: l.qty, unit: "NOS", unitPaise: l.unitPaise }));
      if (!lines.length) throw new Error("Give the lines, or the quote it's for.");
      const gstin = (a.gstin ?? account?.gstin ?? "").toUpperCase() || null;
      if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(gstin)) throw new Error("That GSTIN doesn't look right (15 characters).");
      const place = stateFromGstin(gstin) ?? HOME_STATE;
      const issue = day(a.issue_date) ?? new Date(`${todayIst()}T00:00:00Z`);
      const terms = a.payment_days ?? 15;
      const data = {
        accountId: account?.id ?? null, quoteId: q?.id ?? null,
        billToName: a.bill_to_name ?? account?.legalName ?? account?.name ?? q?.company ?? q?.contactName ?? "Client",
        billToEmail: (a.bill_to_email ?? account?.email ?? q?.contactEmail ?? "").toLowerCase() || null,
        billToGstin: gstin, billToAddress: a.address ?? account?.billingAddress ?? null, placeOfSupply: place, igst: place !== HOME_STATE,
        issueDate: issue, dueDate: new Date(issue.getTime() + terms * 864e5), paymentTermDays: terms, discountPaise: toPaise(a.discount) ?? 0,
        notes: a.notes ?? null, poNumber: a.po_number ?? null, quotationRef: q ? quoteRef(q.number) : null, quotationDate: q?.issuedAt ?? null, billToPan: gstin ? gstin.slice(2, 12) : null,
      };
      let id: string | null = null;
      for (let attempt = 0; attempt < 3 && !id; attempt += 1) {
        const n = await nextNumber(issue);
        try {
          id = (await prisma.invoice.create({ data: { ...data, ...n, token: newInvoiceToken(), createdById: viewer.id, lines: { create: lines } } })).id;
        } catch (error) {
          if (attempt === 2) throw error;
        }
      }
      await refreshInvoice(id!);
      await assignSignatory(id!);
      await recordAuditLog({ action: "ai.create_invoice", entity: "invoice", entityId: id!, actorId: viewer.id });
      return invoiceOut(id!);
    },
  },
  {
    name: "add_expense",
    description: "Record a company expense (finance only): date (YYYY-MM-DD, default today), category (SALARY, FREELANCER, SOFTWARE, RENT, UTILITIES, MARKETING, PRODUCTION, TRAVEL, EQUIPMENT, PROFESSIONAL_FEES, TAXES, OTHER), description, payee, amount in rupees, GST in rupees, paid via, reference, and the project it was for.",
    input: z.object({
      date: z.string().optional(),
      category: z.enum(["SALARY", "FREELANCER", "SOFTWARE", "RENT", "UTILITIES", "MARKETING", "PRODUCTION", "TRAVEL", "EQUIPMENT", "PROFESSIONAL_FEES", "TAXES", "OTHER"]),
      description: z.string().min(1).max(500),
      payee: z.string().max(160).optional(),
      amount: z.union([z.number(), z.string()]),
      gst: money,
      paid_via: z.string().max(80).optional(),
      reference: z.string().max(120).optional(),
      project: z.string().optional(),
      notes: z.string().max(1000).optional(),
    }),
    run: async (viewer, a: { date?: string; category: ExpenseCategory; description: string; payee?: string; amount: number | string; gst?: number | string; paid_via?: string; reference?: string; project?: string; notes?: string }) => {
      if (!can(viewer, "finance") || viewer.workspaceId) throw new Error("Only Genesis's finance team can record expenses.");
      const value = toPaise(a.amount);
      if (!value) throw new Error("The amount, please.");
      const project = a.project ? await projectFor(viewer, a.project) : null;
      const e = await getPrisma().expense.create({ data: { date: day(a.date) ?? new Date(`${todayIst()}T00:00:00Z`), category: a.category, description: a.description, payee: a.payee ?? null, amountPaise: value, gstPaise: toPaise(a.gst) ?? 0, paidVia: a.paid_via ?? null, reference: a.reference ?? null, notes: a.notes ?? null, projectId: project?.id ?? null, createdById: viewer.id } });
      await recordAuditLog({ action: "ai.create_expense", entity: "expense", entityId: e.id, actorId: viewer.id });
      return { id: e.id, date: iso(e.date), category: e.category, amount: rupees(e.amountPaise), link: appUrl("/admin/expenses") };
    },
  },
  {
    name: "save_brief",
    description: "Write down a client's brief, or change one (give its id): title, the lead or client it's for, division, services, objective, audience, deliverables, platforms, budget in rupees, deadline (YYYY-MM-DD), reference links, notes, status (NEW, IN_PROGRESS, QUOTED, DONE).",
    input: z.object({
      id: z.string().optional(),
      title: z.string().max(200).optional(),
      lead_id: z.string().optional(),
      client: z.string().max(160).optional(),
      division: z.enum(DIVISIONS).optional(),
      services: z.array(z.string().max(80)).max(20).optional(),
      objective: z.string().max(6000).optional(),
      audience: z.string().max(4000).optional(),
      deliverables: z.string().max(6000).optional(),
      platforms: z.array(z.string().max(40)).max(12).optional(),
      budget: money,
      deadline: z.string().optional(),
      references: z.array(z.string().max(500)).max(20).optional(),
      notes: z.string().max(6000).optional(),
      status: z.string().max(30).optional(),
    }),
    run: async (viewer, a: { id?: string; title?: string; lead_id?: string; client?: string; division?: Division; services?: string[]; objective?: string; audience?: string; deliverables?: string; platforms?: string[]; budget?: number | string; deadline?: string; references?: string[]; notes?: string; status?: string }) => {
      if (!can(viewer, "sales")) throw new Error("You don't have access to briefs.");
      const prisma = getPrisma();
      const client = a.client ? await accountFor(viewer, a.client, ["BRAND", "AGENCY"]) : null;
      const data = {
        ...(a.title ? { title: a.title } : {}), ...(a.lead_id ? { leadId: a.lead_id } : {}), ...(client ? { accountId: client.id } : {}), ...(a.division ? { division: a.division } : {}),
        ...(a.services ? { services: a.services } : {}), ...(a.objective !== undefined ? { objective: a.objective } : {}), ...(a.audience !== undefined ? { audience: a.audience } : {}),
        ...(a.deliverables !== undefined ? { deliverables: a.deliverables } : {}), ...(a.platforms ? { platforms: a.platforms } : {}), ...(a.budget !== undefined ? { budgetPaise: toPaise(a.budget) } : {}),
        ...(day(a.deadline) ? { deadline: day(a.deadline) } : {}), ...(a.references ? { references: a.references } : {}), ...(a.notes !== undefined ? { notes: a.notes } : {}), ...(a.status ? { status: a.status.toUpperCase() } : {}),
      };
      const b = a.id
        ? await (async () => {
            const was = await prisma.brief.findFirst({ where: { id: a.id, OR: [{ createdById: viewer.id }, ...(isSuperAdmin(viewer) ? [{}] : [])] } });
            if (!was) throw new Error("No brief with that id that's yours.");
            return prisma.brief.update({ where: { id: a.id }, data });
          })()
        : await (async () => {
            if (!a.title) throw new Error("A new brief needs a title.");
            return prisma.brief.create({ data: { title: a.title, ...data, createdById: viewer.id } });
          })();
      await recordAuditLog({ action: a.id ? "ai.update_brief" : "ai.create_brief", entity: "brief", entityId: b.id, actorId: viewer.id });
      return { id: b.id, number: b.number, title: b.title, status: b.status, link: appUrl(`/admin/briefs/${b.id}`) };
    },
  },
  {
    name: "update_request",
    description: "Change a client's request or support ticket (id or number): status (OPEN, IN_PROGRESS, WAITING_ON_CLIENT, DONE, DECLINED), priority (LOW, NORMAL, HIGH), who it's assigned to, or the project it belongs to. Replies to the client are written by the team in the CRM.",
    input: z.object({ request: z.string(), status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "DONE", "DECLINED"]).optional(), priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(), assignee: z.string().max(200).optional(), project: z.string().optional() }),
    run: async (viewer, a: { request: string; status?: RequestStatus; priority?: "LOW" | "NORMAL" | "HIGH"; assignee?: string; project?: string }) => {
      const prisma = getPrisma();
      const n = Number(a.request.replace(/^R?-?#?0*/i, ""));
      const r = await prisma.request.findFirst({ where: { AND: [through("account", accountScope(viewer)), /^\D?-?#?\d+$/.test(a.request) && n > 0 ? { number: n } : { id: a.request }] } });
      if (!r) throw new Error("No request with that id or number that you can see.");
      const who = a.assignee ? await person(a.assignee) : null;
      const project = a.project ? await projectFor(viewer, a.project) : null;
      const saved = await prisma.request.update({ where: { id: r.id }, data: { ...(a.status ? { status: a.status, closedAt: a.status === "DONE" || a.status === "DECLINED" ? new Date() : null } : {}), ...(a.priority ? { priority: a.priority } : {}), ...(who ? { assigneeId: who.id } : {}), ...(project ? { projectId: project.id } : {}) } });
      await recordAuditLog({ action: "ai.update_request", entity: "request", entityId: r.id, actorId: viewer.id });
      return { id: saved.id, number: saved.number, title: saved.title, status: saved.status, link: appUrl(`/admin/requests/${saved.id}`) };
    },
  },
  {
    name: "assign_vendor",
    description: "Offer a job on a project to a vendor or freelancer (they see it in their portal to accept): project (id or P-number), vendor (name or id), role (e.g. Editor, DOP), brief, fee in rupees, due date (YYYY-MM-DD).",
    input: z.object({ project: z.string(), vendor: z.string().max(160), role: z.string().min(1).max(80), brief: z.string().max(6000).optional(), fee: money, due_date: z.string().optional() }),
    run: async (viewer, a: { project: string; vendor: string; role: string; brief?: string; fee?: number | string; due_date?: string }) => {
      if (!can(viewer, "delivery")) throw new Error("You don't have access to assign vendors.");
      const project = await projectFor(viewer, a.project);
      const vendor = await accountFor(viewer, a.vendor, ["VENDOR"]);
      const job = await getPrisma().vendorAssignment.create({ data: { projectId: project.id, vendorId: vendor.id, role: a.role, brief: a.brief ?? null, feePaise: toPaise(a.fee) ?? 0, dueDate: day(a.due_date), createdById: viewer.id } });
      await getPrisma().activity.create({ data: { projectId: project.id, kind: "SYSTEM", actorId: viewer.id, body: `${a.role} offered to ${vendor.name}${a.fee ? ` for ₹${rupees(toPaise(a.fee))}` : ""} (Genesis Copilot).` } });
      await recordAuditLog({ action: "ai.assign_vendor", entity: "vendor_assignment", entityId: job.id, actorId: viewer.id });
      return { id: job.id, project: project.name, vendor: vendor.name, role: job.role, fee: rupees(job.feePaise), status: job.status, link: appUrl(`/admin/projects/${project.id}`) };
    },
  },
  {
    name: "find_work",
    readOnly: true,
    description: "Look up projects (with stage, dates and producer), invoices (number, client, status, total) or client requests, filtered by text and status.",
    input: z.object({ what: z.enum(["projects", "invoices", "requests"]), query: z.string().max(200).optional(), status: z.string().max(30).optional(), limit: z.number().int().min(1).max(30).optional() }),
    run: async (viewer, a: { what: "projects" | "invoices" | "requests"; query?: string; status?: string; limit?: number }) => {
      const prisma = getPrisma();
      const take = a.limit ?? 12;
      const q = a.query?.trim();
      const st = a.status?.toUpperCase();
      if (a.what === "projects") {
        const rows = await prisma.project.findMany({ where: { AND: [projectScope(viewer), st ? { status: st as ProjectStatus } : {}, q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { account: { name: { contains: q, mode: "insensitive" } } }] } : {}] }, orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }], take, include: { account: { select: { name: true } }, manager: { select: { name: true, email: true } } } });
        return rows.map(projectOut);
      }
      if (a.what === "invoices") {
        if (!can(viewer, "sales") && !can(viewer, "finance")) throw new Error("You don't have access to invoices.");
        const rows = await prisma.invoice.findMany({ where: { AND: [invoiceScope(viewer), st ? { status: st as "DRAFT" } : {}, q ? { OR: [{ billToName: { contains: q, mode: "insensitive" } }, { number: { contains: q } }] } : {}] }, orderBy: { issueDate: "desc" }, take });
        return rows.map((i) => ({ id: i.id, number: i.number, client: i.billToName, status: i.status, issue_date: iso(i.issueDate), due_date: iso(i.dueDate), total: rupees(i.totalPaise), link: appUrl(`/admin/invoices/${i.id}`) }));
      }
      const rows = await prisma.request.findMany({ where: { AND: [through("account", accountScope(viewer)), st ? { status: st as RequestStatus } : {}, q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { account: { name: { contains: q, mode: "insensitive" } } }] } : {}] }, orderBy: { createdAt: "desc" }, take, include: { account: { select: { name: true } } } });
      return rows.map((r) => ({ id: r.id, number: r.number, title: r.title, client: r.account.name, kind: r.kind, status: r.status, priority: r.priority, link: appUrl(`/admin/requests/${r.id}`) }));
    },
  },
];
