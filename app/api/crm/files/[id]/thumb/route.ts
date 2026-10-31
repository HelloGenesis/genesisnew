import { NextResponse } from "next/server";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { fetchThumbnail } from "@/lib/crm/drive";
import { fileAdmin, projectRole, visibleTo } from "@/lib/crm/files";
import { getViewer } from "@/lib/crm/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Drive's thumbnail of a project file, for the gallery — same access rule as the file. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return new NextResponse(null, { status: 503 });
  const { id } = await params;
  const file = await getPrisma().driveFile.findUnique({ where: { id } });
  if (!file?.projectId) return new NextResponse(null, { status: 404 });
  const viewer = await getViewer();
  const role = await projectRole(viewer, file.projectId);
  if (!role || !visibleTo(role, fileAdmin(viewer)).includes(file.audience)) return new NextResponse(null, { status: 404 });
  const thumb = await fetchThumbnail(file.driveId).catch(() => null);
  if (!thumb?.ok) return new NextResponse(null, { status: 404 });
  return new NextResponse(thumb.body, { headers: { "Content-Type": thumb.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "private, max-age=3600" } });
}
