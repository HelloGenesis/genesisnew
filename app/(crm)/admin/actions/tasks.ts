"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { notifyAssignee } from "@/lib/crm/task-notify";

/**
 * THE TASK SHEET (Genesis, 29 Oct 2026: "edit and write it inside the task
 * tab itself, easily editable like any spreadsheet"). Each cell saves on its
 * own as it's changed (components/crm/task-sheet); a new row is a task.
 */

const Patch = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  details: z.string().max(4000).optional(),
  links: z.string().max(4000).optional(),
  ownerId: z.string().max(40).nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
  done: z.boolean().optional(),
});
export type TaskPatch = z.infer<typeof Patch>;

const linkList = (v: string) => v.split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s)).slice(0, 20);
const dayOf = (v: string | null | undefined) => (v ? new Date(`${v}T00:00:00Z`) : null);

export type SheetTask = { id: string; title: string; details: string; links: string; ownerId: string | null; dueDate: string | null; priority: "LOW" | "NORMAL" | "HIGH"; done: boolean };

/** One cell (or a few) of a task: your own tasks or ones you gave out; super admins any. A new owner is emailed. */
export async function patchTask(id: string, input: TaskPatch): Promise<{ ok: true } | { ok: false; message: string }> {
  const viewer = await requireStaff();
  const parsed = Patch.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That value can't be saved." };
  const p = parsed.data;
  const prisma = getPrisma();
  const before = await prisma.task.findUnique({ where: { id } });
  if (!before) return { ok: false, message: "That task no longer exists." };
  if (!isSuperAdmin(viewer) && before.ownerId !== viewer.id && before.createdById !== viewer.id) return { ok: false, message: "That task isn't yours." };
  await prisma.task.update({
    where: { id },
    data: {
      ...(p.title !== undefined ? { title: p.title } : {}),
      ...(p.details !== undefined ? { details: p.details.trim() || null } : {}),
      ...(p.links !== undefined ? { links: linkList(p.links) } : {}),
      ...(p.ownerId !== undefined ? { ownerId: p.ownerId } : {}),
      ...(p.dueDate !== undefined ? { dueDate: dayOf(p.dueDate) } : {}),
      ...(p.priority !== undefined ? { priority: p.priority } : {}),
      ...(p.done !== undefined ? (p.done ? { status: "DONE" as const, completedAt: before.completedAt ?? new Date() } : { status: "OPEN" as const, completedAt: null }) : {}),
    },
  });
  if (p.ownerId && p.ownerId !== before.ownerId) await notifyAssignee(id, viewer.id);
  /* Counts on the rail change only when a task is done or moves to someone else. */
  if (p.done !== undefined || p.ownerId !== undefined) revalidatePath("/admin", "layout");
  return { ok: true };
}

/** A task typed into the sheet's last row. */
export async function addSheetTask(input: { title: string; ownerId: string | null; dueDate: string | null; priority?: "LOW" | "NORMAL" | "HIGH" }): Promise<{ ok: true; task: SheetTask } | { ok: false; message: string }> {
  const viewer = await requireStaff();
  const title = input.title.trim().slice(0, 200);
  if (!title) return { ok: false, message: "Type the task first." };
  const due = input.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ? input.dueDate : null;
  const t = await getPrisma().task.create({
    data: { title, ownerId: input.ownerId ?? viewer.id, dueDate: dayOf(due), priority: input.priority ?? "NORMAL", createdById: viewer.id },
  });
  await notifyAssignee(t.id, viewer.id);
  revalidatePath("/admin", "layout");
  return { ok: true, task: { id: t.id, title: t.title, details: "", links: "", ownerId: t.ownerId, dueDate: due, priority: t.priority, done: false } };
}
