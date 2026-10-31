import "server-only";

import { getPrisma } from "@/lib/db";

import { projectRef } from "./catalog";
import { ensureProjectFolders } from "./drive";
import { FOLDERS, type FileRole, visibleTo } from "./files";

/** The folders and files one person sees on a project, ready for <ProjectFiles>. */
export async function filesFor(projectId: string, role: FileRole, opts: { avatar?: boolean; admin?: boolean } = {}) {
  const files = await getPrisma().driveFile.findMany({
    where: { projectId, audience: { in: visibleTo(role, opts.admin) } },
    orderBy: { createdAt: "desc" },
  });
  const uploaders = await getPrisma().user.findMany({ where: { id: { in: files.map((f) => f.uploadedById).filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true, email: true } });
  const name = (id: string | null) => {
    const u = uploaders.find((x) => x.id === id);
    return u ? (u.name ?? u.email) : null;
  };
  const folders = FOLDERS.filter((f) => {
    if (f.key === "avatar" && !opts.avatar && !files.some((x) => x.folder === "avatar")) return false;
    /* A folder this person can neither see anything in nor upload to is left out. */
    const canSee = visibleTo(role).includes(f.audience) || files.some((x) => x.folder === f.key);
    return canSee || f.upload.includes(role);
  }).map((f) => ({ key: f.key, label: f.label, hint: f.hint, audience: f.audience, canUpload: f.upload.includes(role) }));
  /*
   * EACH FOLDER ON GOOGLE DRIVE (Genesis, 31 Oct 2026: "links should be
   * visible here, properly organised by project"): Genesis CRM / client /
   * project / folder, as lib/crm/drive makes them on the first upload. For
   * Genesis's team only; the Drive is Genesis's.
   */
  const drive: Record<string, string> = {};
  if (role === "staff") {
    /* Every folder made on Drive the first time the project is opened (lib/crm/drive ensureProjectFolders); Drive not connected: skipped. */
    const project = await getPrisma().project.findUnique({ where: { id: projectId }, select: { accountId: true, number: true, name: true, account: { select: { name: true } } } });
    if (project) {
      await ensureProjectFolders({ accountId: project.accountId, accountName: project.account.name, projectId, projectLabel: `${projectRef(project.number)} ${project.name}` }, folders).catch(() => undefined);
    }
    const rows = await getPrisma().appSetting.findMany({ where: { key: { in: [`drive:folder:project:${projectId}`, ...folders.map((f) => `drive:folder:project:${projectId}:${f.key}`)] } } });
    for (const r of rows) if (!r.value.startsWith("local-")) drive[r.key === `drive:folder:project:${projectId}` ? "project" : r.key.split(":").pop()!] = `https://drive.google.com/drive/folders/${r.value}`;
  }
  return {
    folders,
    drive,
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.sizeBytes === null ? null : Number(f.sizeBytes),
      folder: f.folder,
      audience: f.audience,
      uploadedAs: f.uploadedAs,
      uploader: role === "staff" ? name(f.uploadedById) : f.uploadedAs === "staff" ? "Genesis" : f.uploadedAs === "client" ? (name(f.uploadedById) ?? "Client") : "Vendor",
      createdAt: f.createdAt.toISOString(),
      link: f.webViewLink,
    })),
  };
}
