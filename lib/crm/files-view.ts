import "server-only";

import { getPrisma } from "@/lib/db";

import { FOLDERS, type FileRole, visibleTo } from "./files";

/** The folders and files one person sees on a project, ready for <ProjectFiles>. */
export async function filesFor(projectId: string, role: FileRole, opts: { avatar?: boolean } = {}) {
  const files = await getPrisma().driveFile.findMany({
    where: { projectId, audience: { in: visibleTo(role) } },
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
  return {
    folders,
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
    })),
  };
}
