import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import type { FileAudience } from "@/lib/generated/prisma/enums";
import { projectRef } from "@/lib/crm/catalog";
import { DriveNotConnected, projectFolderId, startUpload } from "@/lib/crm/drive";
import { FOLDERS, projectRole, signTicket } from "@/lib/crm/files";
import { getViewer } from "@/lib/crm/session";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  projectId: z.string().min(1).max(40),
  folder: z.string().max(20),
  audience: z.enum(["TEAM", "TEAM_VENDOR", "TEAM_CLIENT", "EVERYONE"]).optional(),
  name: z.string().min(1).max(250),
  mimeType: z.string().max(150).default("application/octet-stream"),
  size: z.number().int().min(1).max(10 * 1024 ** 3),
});

/**
 * Opens an upload into a project folder: checks who is uploading (staff,
 * the project's client, or a vendor on it) and that they may use that folder,
 * opens a resumable session on Genesis's Drive and returns it with a signed
 * ticket. The browser sends the bytes to Google directly.
 */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const limit = await checkRateLimit(`upload:${viewer.id}`);
  if (!limit.success) return NextResponse.json({ error: "Too many uploads at once. Try again in a minute." }, { status: 429 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad upload" }, { status: 400 });
  const input = parsed.data;

  const role = await projectRole(viewer, input.projectId);
  const folder = FOLDERS.find((f) => f.key === input.folder);
  if (!role || !folder || !folder.upload.includes(role)) return NextResponse.json({ error: "You can't upload to this folder." }, { status: 403 });
  /* Only staff choose who sees a file; clients' and vendors' uploads take the folder's default. */
  const audience: FileAudience = role === "staff" && input.audience ? input.audience : folder.audience;

  const project = await getPrisma().project.findUnique({ where: { id: input.projectId }, include: { account: true } });
  if (!project) return NextResponse.json({ error: "No such project" }, { status: 404 });
  try {
    const parentId = await projectFolderId({
      accountId: project.accountId,
      accountName: project.account.name,
      projectId: project.id,
      projectLabel: `${projectRef(project.number)} ${project.name}`,
      folderKey: folder.key,
      folderLabel: folder.label,
    });
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const uploadUrl = await startUpload({ name: input.name, mimeType: input.mimeType, size: input.size, parentId, origin });
    const ticket = signTicket({ projectId: project.id, folder: folder.key, audience, parentId, userId: viewer.id, as: role, exp: Date.now() + 6 * 3600_000 });
    return NextResponse.json({ uploadUrl, ticket });
  } catch (error) {
    if (error instanceof DriveNotConnected) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[crm] upload start failed", error);
    return NextResponse.json({ error: "Google Drive didn't accept the upload. Try again." }, { status: 502 });
  }
}
