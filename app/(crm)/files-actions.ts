"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { FileAudience } from "@/lib/generated/prisma/enums";
import { trashFile } from "@/lib/crm/drive";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

/** Genesis staff only: who sees a project file, and removing one (to Drive's trash, recoverable for 30 days). */

const AUDIENCES: FileAudience[] = ["ADMINS", "TEAM", "TEAM_VENDOR", "TEAM_CLIENT", "EVERYONE"];

export async function setFileAudience(id: string, audience: string) {
  const viewer = await requireStaff();
  if (!AUDIENCES.includes(audience as FileAudience)) return;
  await getPrisma().driveFile.update({ where: { id }, data: { audience: audience as FileAudience } });
  await recordAuditLog({ action: "file.audience", entity: "drive_file", entityId: id, actorId: viewer.id, metadata: { audience } });
  revalidatePath("/", "layout");
}

/** Who may remove a project's files (Genesis, 31 Oct 2026: "cannot be deleted by the user until permitted"): the owners and the project's producer. */
export async function canDeleteFiles(projectId: string | null) {
  const viewer = await requireStaff();
  if (isSuperAdmin(viewer)) return true;
  if (!projectId) return false;
  const p = await getPrisma().project.findUnique({ where: { id: projectId }, select: { managerId: true } });
  return p?.managerId === viewer.id;
}

export async function deleteProjectFile(id: string) {
  const viewer = await requireStaff();
  const file = await getPrisma().driveFile.findUnique({ where: { id } });
  if (!file) return;
  if (!(await canDeleteFiles(file.projectId))) throw new Error("Only the project's producer or an owner can remove files.");
  await trashFile(file.driveId).catch(() => undefined);
  await getPrisma().driveFile.delete({ where: { id } });
  await recordAuditLog({ action: "file.deleted", entity: "drive_file", entityId: id, actorId: viewer.id, metadata: { name: file.name } });
  revalidatePath("/", "layout");
}

/** The project's brief, the first tab of its Files (Genesis, 31 Oct 2026: "Brief will only have the brief here, customisable"). */
export async function saveProjectBrief(projectId: string, brief: string) {
  const viewer = await requireStaff();
  const text = brief.trim().slice(0, 20000) || null;
  await getPrisma().project.update({ where: { id: projectId }, data: { brief: text } });
  await getPrisma().activity.create({ data: { projectId, kind: "SYSTEM", actorId: viewer.id, body: "Updated the brief." } });
  revalidatePath("/", "layout");
}
