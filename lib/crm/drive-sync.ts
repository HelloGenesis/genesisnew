import "server-only";

import { getPrisma } from "@/lib/db";

import { listFolderFiles, localDrive } from "./drive";
import { FOLDERS } from "./files";

/**
 * DRIVE INTO THE CRM (Genesis, 1 Nov 2026: "every file on Drive shows up here;
 * if it can sync on its own, fab"). Files put straight into a project's Drive
 * folders, from Drive itself or a phone, join that folder's files in the CRM.
 * Each project at most every 5 minutes; nothing is ever deleted from Drive.
 */
const EVERY = 5 * 60_000;

export async function syncProjectDrive(projectId: string, opts: { force?: boolean } = {}) {
  if (localDrive()) return 0;
  const prisma = getPrisma();
  const key = `drive:sync:${projectId}`;
  const last = await prisma.appSetting.findUnique({ where: { key } });
  if (!opts.force && last && Date.now() - Number(last.value) < EVERY) return 0;
  await prisma.appSetting.upsert({ where: { key }, create: { key, value: String(Date.now()) }, update: { value: String(Date.now()) } });
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, accountId: true, workspaceId: true } });
  if (!project) return 0;
  const folders = await prisma.appSetting.findMany({ where: { key: { startsWith: `drive:folder:project:${projectId}:` } } });
  let added = 0;
  for (const row of folders) {
    const folderKey = row.key.split(":").pop()!;
    const folder = FOLDERS.find((f) => f.key === folderKey);
    if (!folder || row.value.startsWith("local-")) continue;
    const listed = await listFolderFiles(row.value).catch(() => []);
    if (!listed.length) continue;
    const known = new Set((await prisma.driveFile.findMany({ where: { driveId: { in: listed.map((f) => f.id) } }, select: { driveId: true } })).map((f) => f.driveId));
    for (const f of listed.filter((x) => !known.has(x.id))) {
      await prisma.driveFile.create({
        data: {
          driveId: f.id,
          name: `${f.path}${f.name}`.slice(0, 250),
          mimeType: f.mimeType,
          sizeBytes: f.size === null ? null : BigInt(f.size),
          webViewLink: f.webViewLink,
          folder: folder.key,
          audience: project.workspaceId ? "ADMINS" : folder.audience,
          projectId,
          accountId: project.accountId,
          uploadedAs: "drive",
          note: "Added in Google Drive",
          createdAt: new Date(f.createdTime),
        },
      }).catch(() => undefined);
      added++;
    }
  }
  return added;
}

/** Every project that has Drive folders, a few at a time (lib/crm/jobs). */
export async function syncAllDrives(limit = 15) {
  const prisma = getPrisma();
  const rows = await prisma.appSetting.findMany({ where: { key: { startsWith: "drive:folder:project:" } }, select: { key: true } });
  const ids = [...new Set(rows.map((r) => r.key.split(":")[3]!).filter(Boolean))];
  const recent = await prisma.project.findMany({ where: { id: { in: ids }, status: { in: ["ACTIVE", "ON_HOLD"] } }, orderBy: { updatedAt: "desc" }, take: limit, select: { id: true } });
  let added = 0;
  for (const p of recent) added += await syncProjectDrive(p.id).catch(() => 0);
  return added;
}
