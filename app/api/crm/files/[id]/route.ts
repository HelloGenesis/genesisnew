import { NextResponse } from "next/server";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { fetchContent } from "@/lib/crm/drive";
import { fileAdmin, projectRole, visibleTo } from "@/lib/crm/files";
import { readReviewToken } from "@/lib/crm/review-links";
import { getViewer } from "@/lib/crm/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A project file's bytes, streamed from Drive — only to someone who may see
 * it (staff; the client for client files; a vendor on the project for vendor
 * files). Range requests pass through, so videos play and seek in place.
 * ?download=1 saves it instead.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return new NextResponse(null, { status: 503 });
  const { id } = await params;
  const file = await getPrisma().driveFile.findUnique({ where: { id } });
  if (!file || !file.projectId) return new NextResponse(null, { status: 404 });
  const viewer = await getViewer();
  const role = await projectRole(viewer, file.projectId);
  /* Or the review link's key, for the one piece it was sent for (lib/crm/review-links). */
  const r = new URL(request.url).searchParams.get("r");
  const byReview = r ? await reviewOpens(r, file.id) : false;
  if (!byReview && (!role || !visibleTo(role, fileAdmin(viewer)).includes(file.audience))) return new NextResponse(null, { status: 404 });

  const upstream = await fetchContent(file.driveId, request.headers.get("range"));
  if (!upstream.ok && upstream.status !== 206) return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("Content-Disposition", `${new URL(request.url).searchParams.has("download") ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
  headers.set("X-Content-Type-Options", "nosniff");
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

async function reviewOpens(token: string, fileId: string) {
  const id = readReviewToken(token);
  if (!id) return false;
  const d = await getPrisma().deliverable.findUnique({ where: { id }, select: { fileId: true, status: true } });
  return d?.fileId === fileId && d.status === "IN_REVIEW";
}
