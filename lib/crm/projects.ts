import "server-only";

import { getPrisma } from "@/lib/db";
import type { Division } from "@/lib/generated/prisma/enums";

import { appUrl, queueEmail } from "./notify";
import { queueSheet } from "./sheets";
import { templateByKey, templateFor } from "./stages";

/**
 * EVERY WON LEAD STARTS A PROJECT (Genesis, 10 Oct 2026).
 *
 * One place opens projects, so every path — a lead moved to Won on the board,
 * a lead converted on its page, a quote accepted or paid, a website checkout —
 * gets the same stages (lib/crm/stages) and the same first timeline entry.
 */

export async function openProject(input: {
  accountId: string;
  name: string;
  division: Division;
  productName?: string | null;
  productId?: string | null;
  membership?: boolean;
  templateKey?: string | null;
  leadId?: string | null;
  quoteId?: string | null;
  orderId?: string | null;
  orderLineId?: string | null;
  subscriptionId?: string | null;
  managerId?: string | null;
  quota?: number | null;
  brief?: string | null;
  dueDate?: Date | null;
  driveUrl?: string | null;
  why: string;
  actorId?: string | null;
}) {
  const template = templateByKey(input.templateKey) ?? templateFor(input.division, input.productName, input.membership);
  /* Opened because the lead was won: that first stage is already done. */
  const project = await getPrisma().project.create({
    data: {
      accountId: input.accountId,
      name: input.name,
      division: input.division,
      productId: input.productId ?? null,
      stages: [...template.stages],
      stage: template.stages[0] === "Lead won" || template.stages[0] === "Month opened" ? 1 : 0,
      leadId: input.leadId ?? null,
      quoteId: input.quoteId ?? null,
      orderId: input.orderId ?? null,
      orderLineId: input.orderLineId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      managerId: input.managerId ?? null,
      quota: input.quota ?? null,
      brief: input.brief ?? null,
      dueDate: input.dueDate ?? null,
      driveUrl: input.driveUrl ?? null,
      startDate: new Date(),
    },
  });
  await getPrisma().activity.create({ data: { projectId: project.id, kind: "SYSTEM", actorId: input.actorId ?? null, body: `${input.why} Stages: ${template.label}.` } });
  await queueSheet("projects", project.id);
  return project;
}

/**
 * Marks a lead won and makes sure there is a client and a project for it.
 * The account is the lead's own, or one made from its details with the
 * contact given portal access; the project is skipped when the lead already
 * has one (a quote or order opened it).
 */
export async function winLead(leadId: string, actorId: string | null, why = "Lead won.") {
  const prisma = getPrisma();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { projects: { select: { id: true } } } });
  if (!lead) return null;

  let accountId = lead.accountId;
  if (!accountId) {
    const existing = lead.email ? await prisma.account.findFirst({ where: { email: lead.email, kind: { not: "VENDOR" } }, select: { id: true } }) : null;
    accountId =
      existing?.id ??
      (await prisma.account.create({
        data: { name: lead.company ?? lead.name, email: lead.email, phone: lead.phone, status: "ACTIVE", managerId: lead.ownerId ?? actorId, referredById: lead.partnerId, notes: lead.notes },
      })).id;
    if (lead.email) {
      const user = await prisma.user.findFirst({ where: { email: lead.email, emailVerified: true } });
      if (user) await prisma.accountMember.upsert({ where: { accountId_userId: { accountId, userId: user.id } }, create: { accountId, userId: user.id, role: "OWNER" }, update: {} });
      else await prisma.accountInvite.upsert({ where: { accountId_email: { accountId, email: lead.email } }, create: { accountId, email: lead.email, role: "OWNER", invitedById: actorId }, update: {} });
    }
    await queueSheet("accounts", accountId);
  }
  await prisma.account.update({ where: { id: accountId }, data: { status: "ACTIVE" } });
  await prisma.lead.update({ where: { id: leadId }, data: { status: "WON", accountId, nextFollowUp: null } });
  await queueSheet("leads", leadId);

  let projectId = lead.projects[0]?.id ?? null;
  if (!projectId) {
    const project = await openProject({
      accountId,
      name: lead.interest ? `${lead.interest}${lead.company ? ` · ${lead.company}` : ""}` : `${lead.company ?? lead.name} project`,
      division: lead.division ?? "STUDIOS",
      productName: lead.interest,
      leadId,
      managerId: lead.ownerId ?? actorId,
      brief: lead.notes,
      why,
      actorId,
    });
    projectId = project.id;
    if (lead.email) {
      await queueEmail({
        kind: "project_opened",
        to: [lead.email],
        subject: `We're starting: ${project.name}`,
        text: `Thank you for choosing Genesis. Your project is open and the team is on ideation and scripting.\n\nFollow every step, share your brief and assets, and review drafts in your portal. Sign in with this email; we'll send a one-time code:\n${appUrl(`/portal/projects/${project.id}`)}`,
        dedupeKey: `project-opened:${project.id}`,
      });
    }
  }
  return { accountId, projectId };
}
