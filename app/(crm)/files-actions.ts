"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { FileAudience } from "@/lib/generated/prisma/enums";
import { projectRef } from "@/lib/crm/catalog";
import { createGoogleFile, projectFolderId, trashFile } from "@/lib/crm/drive";
import { folderOf } from "@/lib/crm/files";
import { accountEmails, appUrl, queueEmail } from "@/lib/crm/notify";
import { notifyProjectTeam } from "@/lib/crm/project-team";
import { reviewEmail } from "@/lib/crm/review-links";
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

/*
 * NEW GOOGLE DOCS AND SHEETS, RIGHT IN THEIR FOLDER (Genesis, 31 Oct 2026):
 * a script as a Doc, a shot list as a Sheet, in the project's folder on Drive,
 * listed with the rest of its files. Opens in Google.
 */
export async function createProjectGoogleFile(projectId: string, folderKey: string, kind: "doc" | "sheet", name: string) {
  const viewer = await requireStaff();
  const folder = folderOf(folderKey);
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { account: { select: { name: true } } } });
  if (!project || !folder) return { ok: false as const, error: "No such project or folder." };
  try {
    const parentId = await projectFolderId({ accountId: project.accountId, accountName: project.account.name, projectId, projectLabel: `${projectRef(project.number)} ${project.name}`, folderKey: folder.key, folderLabel: folder.label });
    const made = await createGoogleFile({ parentId, name: name.trim() || (kind === "doc" ? "Untitled document" : "Untitled spreadsheet"), kind });
    await prisma.driveFile.create({ data: { driveId: made.id, name: name.trim() || (kind === "doc" ? "Untitled document" : "Untitled spreadsheet"), mimeType: made.mimeType, webViewLink: made.webViewLink, folder: folder.key, audience: project.workspaceId ? "ADMINS" : folder.audience, projectId, accountId: project.accountId, uploadedById: viewer.id, uploadedAs: "staff" } });
    revalidatePath("/", "layout");
    return { ok: true as const, url: made.webViewLink };
  } catch (error) {
    return { ok: false as const, error: `Google Drive couldn't make it: ${(error as Error).message.slice(0, 140)}` };
  }
}

/** The brief as a Google Doc in the project's folder, made once, then opened (Genesis, 31 Oct 2026: "brief Google Doc"). */
export async function briefAsGoogleDoc(projectId: string) {
  await requireStaff();
  const prisma = getPrisma();
  const key = `drive:brief:${projectId}`;
  const known = await prisma.appSetting.findUnique({ where: { key } });
  if (known) return { ok: true as const, url: known.value };
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { account: { select: { name: true } } } });
  if (!project) return { ok: false as const, error: "No such project." };
  try {
    const label = `${projectRef(project.number)} ${project.name}`;
    const assets = await projectFolderId({ accountId: project.accountId, accountName: project.account.name, projectId, projectLabel: label, folderKey: "brief", folderLabel: "Assets" });
    const parent = (await prisma.appSetting.findUnique({ where: { key: `drive:folder:project:${projectId}` } }))?.value ?? assets;
    const made = await createGoogleFile({ parentId: parent, name: `Brief · ${label}`, kind: "doc", text: `${label}\n${project.account.name}\n\n${project.brief ?? "Write the brief here."}` });
    const url = made.webViewLink ?? `https://docs.google.com/document/d/${made.id}/edit`;
    await prisma.appSetting.create({ data: { key, value: url } });
    return { ok: true as const, url };
  } catch (error) {
    return { ok: false as const, error: `Google Drive couldn't make it: ${(error as Error).message.slice(0, 140)}` };
  }
}

/*
 * SEND ANY FILE ON, AFTER IT'S UP (Genesis, 31 Oct 2026: "one upload; then for
 * whatever's uploaded, an option to send it to the internal/creative team or
 * to the client"). To the team: an internal review the client never sees. To
 * the client: shared with them if it wasn't, and emailed with Approve and Ask
 * for changes buttons (lib/crm/review-links).
 */
export async function sendFileForReview(fileId: string, to: "team" | "client") {
  const viewer = await requireStaff();
  const prisma = getPrisma();
  const file = await prisma.driveFile.findUnique({ where: { id: fileId }, include: { project: true } });
  if (!file?.project) return { ok: false as const, error: "This file isn't on a project." };
  const folder = folderOf(file.folder);
  const title = `${folder?.label ?? "File"}: ${file.name}`;
  const previous = await prisma.deliverable.findFirst({ where: { projectId: file.project.id, title }, orderBy: { version: "desc" } });
  const kind = file.mimeType?.startsWith("image/") ? "IMAGE" : file.mimeType?.startsWith("video/") ? "VIDEO" : file.mimeType === "application/pdf" ? "DOCUMENT" : "DOCUMENT";
  const url = file.webViewLink && file.mimeType?.startsWith("application/vnd.google-apps") ? file.webViewLink : `/api/crm/files/${file.id}`;
  if (to === "client") {
    /* The client has to be able to see it. */
    if (file.audience !== "TEAM_CLIENT" && file.audience !== "EVERYONE") await prisma.driveFile.update({ where: { id: file.id }, data: { audience: file.audience === "TEAM_VENDOR" ? "EVERYONE" : "TEAM_CLIENT" } });
    const d = await prisma.deliverable.create({ data: { projectId: file.project.id, title, url, fileId: file.id, kind, status: "IN_REVIEW", version: (previous?.version ?? 0) + 1, submittedById: viewer.id } });
    await queueEmail(reviewEmail({ id: d.id, title, project: file.project.name, to: await accountEmails(file.project.accountId), portal: appUrl(`/portal/projects/${file.project.id}#review`) }));
    await prisma.activity.create({ data: { projectId: file.project.id, kind: "SYSTEM", actorId: viewer.id, body: `Sent "${file.name}" to the client for approval.` } });
  } else {
    await prisma.deliverable.create({ data: { projectId: file.project.id, title, url, fileId: file.id, kind, status: "INTERNAL_REVIEW", version: (previous?.version ?? 0) + 1, submittedById: viewer.id } });
    await notifyProjectTeam(file.project.id, viewer.id, { vendorsToo: file.audience === "TEAM_VENDOR" || file.audience === "EVERYONE", subject: `For review: ${file.name} · ${file.project.name}`, text: `${title} is ready for the team's review, before the client sees it.\n\n${appUrl(`/admin/projects/${file.project.id}#files`)}` });
    await prisma.activity.create({ data: { projectId: file.project.id, kind: "SYSTEM", actorId: viewer.id, body: `Sent "${file.name}" to the team for review.` } });
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}
