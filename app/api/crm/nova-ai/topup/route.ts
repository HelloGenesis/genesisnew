import { NextResponse } from "next/server";
import { z } from "zod";

import { startTopUp } from "@/lib/crm/nova-ai";
import { getViewer } from "@/lib/crm/session";
import { RazorpayError } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A NOVA AI credit top-up for this agency (lib/crm/nova-ai): back comes the Razorpay payment link to open. */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.workspaceId || viewer.demo || viewer.workspaceRole !== "ADMIN") return NextResponse.json({ error: "Only your agency's admin can top up." }, { status: 403 });
  const parsed = z.object({ pack: z.number().int().min(0).max(10) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick a pack." }, { status: 400 });
  const { getPrisma } = await import("@/lib/db");
  const agency = await getPrisma().account.findFirst({ where: { id: viewer.workspaceId, workspaceId: null }, select: { name: true } });
  try {
    return NextResponse.json({ url: await startTopUp(viewer.workspaceId, agency?.name ?? "your agency", parsed.data.pack, { email: viewer.email, name: viewer.name }) });
  } catch (error) {
    console.error("[nova-ai] top-up failed", error instanceof RazorpayError ? `${error.status} ${error.body}` : error);
    return NextResponse.json({ error: error instanceof RazorpayError ? "The payment couldn't be started. Try again in a minute." : (error as Error).message }, { status: 502 });
  }
}
