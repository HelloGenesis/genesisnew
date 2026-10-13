import { NextResponse } from "next/server";

import { markProposalImage, proposalImagesFolderId, uploadSmall } from "@/lib/crm/drive";
import { can, getViewer, staffAccess } from "@/lib/crm/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX = 4 * 1024 * 1024;

/**
 * AN IMAGE FOR A PROPOSAL, FROM YOUR COMPUTER OR PHONE (Genesis, 13 Oct
 * 2026: "cannot add images"). Kept in the company Drive (Genesis CRM /
 * Proposal images) and shown through /api/crm/images/<id>, so the client's
 * page displays it without anyone sharing Drive files.
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (staffAccess(viewer) !== "granted" || !can(viewer, "sales")) return NextResponse.json({ error: "Sign in again." }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image." }, { status: 400 });
  if (!TYPES.has(file.type)) return NextResponse.json({ error: "Use a PNG, JPG, WebP or GIF image." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "That image is over 4 MB." }, { status: 400 });
  try {
    const id = await uploadSmall({ name: file.name || "image", mimeType: file.type, bytes: Buffer.from(await file.arrayBuffer()), parentId: await proposalImagesFolderId() });
    await markProposalImage(id, file.type);
    return NextResponse.json({ url: `/api/crm/images/${id}` });
  } catch (error) {
    console.error("[crm] proposal image upload failed", error);
    return NextResponse.json({ error: `Couldn't upload: ${(error as Error).message.slice(0, 160)}` }, { status: 502 });
  }
}
