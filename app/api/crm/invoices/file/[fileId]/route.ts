import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/db";
import { fetchContent } from "@/lib/crm/drive";
import { invoiceAccess } from "@/lib/crm/scope";
import { getViewer, staffAccess } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/** An invoice's file: for staff who can see the invoice, or anyone holding its link (?t=<token>), as the client does. */
export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const token = new URL(request.url).searchParams.get("t");
  const prisma = getPrisma();
  const file = await prisma.invoiceFile.findUnique({ where: { id: fileId }, include: { invoice: { select: { id: true, token: true, status: true } } } });
  if (!file || file.kind === "LINK") return new NextResponse("Not found", { status: 404 });
  let allowed = Boolean(token && token === file.invoice.token && file.invoice.status !== "DRAFT");
  if (!allowed) {
    const viewer = await getViewer();
    allowed = staffAccess(viewer) === "granted" && Boolean(await prisma.invoice.findFirst({ where: { id: file.invoice.id, ...invoiceAccess(viewer!) }, select: { id: true } }));
  }
  if (!allowed) return new NextResponse("Not found", { status: 404 });
  const upstream = await fetchContent(file.driveId, null);
  if (!upstream.ok || !upstream.body) return new NextResponse("Unavailable", { status: 502 });
  return new NextResponse(upstream.body, { headers: { "Content-Type": file.mimeType, "Cache-Control": "private, max-age=3600", "Content-Disposition": `inline; filename="${file.name.replace(/"/g, "")}"` } });
}
