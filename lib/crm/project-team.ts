import "server-only";

import { getPrisma } from "@/lib/db";

import { accountEmails, queueEmail } from "./notify";

/**
 * EVERYONE WORKING ON A PROJECT (Genesis, 31 Oct 2026: "all activity by
 * freelancers or anyone who's working on this project will be notified to the
 * users working on the project"): its producer, the Genesis people with tasks
 * on it, and, when what happened is theirs to see, the vendors and freelancers
 * who took a job on it. The person who did it isn't told about their own work.
 */
export async function projectTeamEmails(projectId: string, opts: { vendorsToo: boolean; except?: string | null }) {
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      manager: { select: { id: true, email: true } },
      tasks: { where: { status: { not: "DONE" } }, select: { owner: { select: { id: true, email: true } } } },
      assignments: opts.vendorsToo ? { where: { status: { in: ["ACCEPTED", "SUBMITTED", "APPROVED"] } }, select: { vendorId: true } } : false,
    },
  });
  if (!project) return [];
  const staff = [project.manager, ...project.tasks.map((t) => t.owner)].filter((u): u is { id: string; email: string | null } => Boolean(u) && u!.id !== opts.except);
  const vendors = opts.vendorsToo && "assignments" in project && project.assignments ? (await Promise.all(project.assignments.map((a) => accountEmails(a.vendorId)))).flat() : [];
  const except = opts.except ? (await prisma.user.findUnique({ where: { id: opts.except }, select: { email: true } }))?.email : null;
  return [...new Set([...staff.map((u) => u.email), ...vendors].filter((e): e is string => Boolean(e) && e !== except))];
}

export async function notifyProjectTeam(projectId: string, actorId: string | null, msg: { vendorsToo: boolean; subject: string; text: string }) {
  const to = await projectTeamEmails(projectId, { vendorsToo: msg.vendorsToo, except: actorId });
  if (to.length) await queueEmail({ kind: "project_activity", to, subject: msg.subject, text: msg.text });
}
