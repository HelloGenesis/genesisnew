import "server-only";

import { getPrisma } from "@/lib/db";

import { projectRef } from "./catalog";
import { FOLDERS } from "./files";
import { projectScope } from "./scope";
import type { Viewer } from "./session";

/**
 * FILES AND THE CREATIVE LIBRARY (Genesis, 28 Oct 2026: "Files, Creative
 * Library … all I want here"): everything uploaded to the projects this person
 * can open, in one place, from Genesis's Drive (lib/crm/drive). The projects
 * come through projectScope (and lib/db keeps an agency's CRM apart), so a
 * file is never shown to someone who couldn't open its project. The Creative
 * Library is the images and videos.
 */
export async function libraryFor(viewer: Viewer, media: boolean) {
  const prisma = getPrisma();
  const projects = await prisma.project.findMany({
    where: projectScope(viewer),
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, name: true, status: true, account: { select: { name: true } } },
  });
  const byId = new Map(projects.map((p) => [p.id, p]));
  const files = projects.length
    ? await prisma.driveFile.findMany({
        where: { projectId: { in: projects.map((p) => p.id) }, ...(media ? { OR: [{ mimeType: { startsWith: "image/" } }, { mimeType: { startsWith: "video/" } }] } : {}) },
        orderBy: { createdAt: "desc" },
        take: 600,
      })
    : [];
  const people = await prisma.user.findMany({ where: { id: { in: [...new Set(files.map((f) => f.uploadedById).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, email: true } });
  const who = new Map(people.map((u) => [u.id, u.name ?? u.email]));
  return {
    files: files.map((f) => {
      const p = byId.get(f.projectId!)!;
      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.sizeBytes === null ? null : Number(f.sizeBytes),
        folder: f.folder,
        folderLabel: FOLDERS.find((x) => x.key === f.folder)?.label ?? f.folder,
        projectId: p.id,
        project: `${projectRef(p.number)} ${p.name}`,
        client: p.account.name,
        uploader: (f.uploadedById && who.get(f.uploadedById)) || (f.uploadedAs === "staff" ? "Genesis" : f.uploadedAs),
        createdAt: f.createdAt.toISOString(),
      };
    }),
    /* Where a new upload can go: open projects first, and the folders staff may upload to. */
    projects: [...projects].sort((a, b) => Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE")).map((p) => ({ id: p.id, label: `${projectRef(p.number)} ${p.name}`, client: p.account.name })),
    folders: FOLDERS.filter((f) => f.upload.includes("staff")).map((f) => ({ key: f.key, label: f.label })),
  };
}

export type Library = Awaited<ReturnType<typeof libraryFor>>;
