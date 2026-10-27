import "server-only";

import { getPrisma } from "@/lib/db";

import { appUrl, queueEmail } from "./notify";

/** "You've got a task": to the assignee, unless they assigned it to themselves. */
export async function notifyAssignee(taskId: string, assignerId: string) {
  const prisma = getPrisma();
  const t = await prisma.task.findUnique({ where: { id: taskId }, include: { owner: true, lead: true, project: true, account: true } });
  if (!t?.owner?.email || t.ownerId === assignerId) return;
  const assigner = await prisma.user.findUnique({ where: { id: assignerId }, select: { name: true, email: true } });
  const about = t.project ? `Project: ${t.project.name}` : t.lead ? `Lead: ${t.lead.name}` : t.account ? `Client: ${t.account.name}` : "";
  await queueEmail({
    kind: "task_assigned",
    to: [t.owner.email],
    subject: `${t.priority === "HIGH" ? "[High] " : ""}New task: ${t.title}`,
    text: [
      `${assigner?.name ?? assigner?.email ?? "Someone"} assigned you a task in the Genesis CRM.`,
      "",
      t.title,
      t.details ?? "",
      about,
      t.dueDate ? `Due: ${t.dueDate.toISOString().slice(0, 10)}` : "",
      "",
      `Your tasks: ${appUrl("/admin/tasks")}`,
    ]
      .filter((l, i, all) => l !== "" || all[i - 1] !== "")
      .join("\n"),
    dedupeKey: `task-assigned:${t.id}:${t.ownerId}`,
  });
}
