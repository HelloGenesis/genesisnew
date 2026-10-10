"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { FileAudience } from "@/lib/generated/prisma/enums";
import { trashFile } from "@/lib/crm/drive";
import { requireStaff } from "@/lib/crm/session";

/** Genesis staff only: who sees a project file, and removing one (to Drive's trash, recoverable for 30 days). */

const AUDIENCES: FileAudience[] = ["TEAM", "TEAM_VENDOR", "TEAM_CLIENT", "EVERYONE"];

export async function setFileAudience(id: string, audience: string) {
  const viewer = await requireStaff();
  if (!AUDIENCES.includes(audience as FileAudience)) return;
  await getPrisma().driveFile.update({ where: { id }, data: { audience: audience as FileAudience } });
  await recordAuditLog({ action: "file.audience", entity: "drive_file", entityId: id, actorId: viewer.id, metadata: { audience } });
  revalidatePath("/", "layout");
}

export async function deleteProjectFile(id: string) {
  const viewer = await requireStaff();
  const file = await getPrisma().driveFile.findUnique({ where: { id } });
  if (!file) return;
  await trashFile(file.driveId).catch(() => undefined);
  await getPrisma().driveFile.delete({ where: { id } });
  await recordAuditLog({ action: "file.deleted", entity: "drive_file", entityId: id, actorId: viewer.id, metadata: { name: file.name } });
  revalidatePath("/", "layout");
}
