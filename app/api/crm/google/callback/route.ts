import { NextResponse } from "next/server";

import { recordAuditLog } from "@/lib/audit";
import { completeGoogle } from "@/lib/crm/google";
import { getViewer, staffAccess } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const viewer = await getViewer();
  const state = request.headers.get("cookie")?.match(/(?:^|;\s*)gm_google_state=([a-f0-9]+)/)?.[1];
  const back = (q: string) => {
    const r = NextResponse.redirect(new URL(`/admin/inbox?google=${q}`, url.origin));
    r.cookies.delete("gm_google_state");
    return r;
  };
  if (staffAccess(viewer) !== "granted") return NextResponse.redirect(new URL("/login?next=/admin/inbox", url.origin));
  if (url.searchParams.get("error")) return back("cancelled");
  if (!state || state !== url.searchParams.get("state") || !url.searchParams.get("code")) return back("failed");
  try {
    const email = await completeGoogle(url.origin, url.searchParams.get("code")!, viewer!.id);
    await recordAuditLog({ action: "google.connected", entity: "user", entityId: viewer!.id, actorId: viewer!.id, metadata: { email } });
    return back("connected");
  } catch (error) {
    console.error("[crm] google connect failed", error);
    return back("failed");
  }
}
