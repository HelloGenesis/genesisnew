import { NextResponse } from "next/server";

import { fetchContent, proposalImageType } from "@/lib/crm/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A proposal image's bytes (only files uploaded as proposal images), for the builder and the client's page. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w-]{10,120}$/.test(id)) return new NextResponse(null, { status: 404 });
  const type = await proposalImageType(id).catch(() => null);
  if (!type) return new NextResponse(null, { status: 404 });
  const upstream = await fetchContent(id, null);
  if (!upstream.ok) return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
  return new NextResponse(upstream.body, {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" },
  });
}
