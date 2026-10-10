import { NextResponse } from "next/server";

import { localDrive, localWrite } from "@/lib/crm/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local development's stand-in for Google's upload URL (see localDrive). 404 everywhere else. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!localDrive()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const meta = localWrite(id, Buffer.from(await request.arrayBuffer()));
  return NextResponse.json(meta);
}
