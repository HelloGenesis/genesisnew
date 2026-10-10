import { NextResponse } from "next/server";

import { recordAuditLog } from "@/lib/audit";
import { completeConnection } from "@/lib/crm/drive";
import { can, getViewer, staffAccess } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const viewer = await getViewer();
  const state = request.headers.get("cookie")?.match(/(?:^|;\s*)gm_drive_state=([a-f0-9]+)/)?.[1];
  const back = (q: string) => {
    const r = NextResponse.redirect(new URL(`/admin/settings?drive=${q}`, url.origin));
    r.cookies.delete("gm_drive_state");
    return r;
  };
  if (staffAccess(viewer) !== "granted" || !can(viewer, "staff")) return NextResponse.redirect(new URL("/admin/forbidden", url.origin));
  if (!state || state !== url.searchParams.get("state") || !url.searchParams.get("code")) return back("failed");
  try {
    const account = await completeConnection(url.origin, url.searchParams.get("code")!);
    await recordAuditLog({ action: "drive.connected", entity: "settings", actorId: viewer!.id, metadata: { account } });
    return back("connected");
  } catch (error) {
    console.error("[crm] drive connect failed", error);
    return back("failed");
  }
}
