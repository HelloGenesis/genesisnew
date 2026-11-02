import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/crm/scope";
import { getViewer } from "@/lib/crm/session";
import { VIEWING_COOKIE } from "@/lib/crm/workspace";

/**
 * OPEN SOMETHING IN WHICHEVER CRM IT'S IN (Genesis, 2 Nov 2026: "as a super
 * admin, why wasn't I able to see this"). A Genesis owner following a link to
 * another CRM's quote or plan is switched to that CRM ("Viewing") and taken
 * there. ?ws= is the agency CRM, empty for Genesis Media's own.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/admin";
  const safe = /^\/admin(\/|$|\?)/.test(next) ? next : "/admin";
  const viewer = await getViewer();
  if (!viewer || !isSuperAdmin(viewer) || viewer.workspaceId) return NextResponse.redirect(new URL(safe, url.origin));
  const ws = url.searchParams.get("ws") ?? "";
  const jar = await cookies();
  if (ws && (await getPrisma().account.findFirst({ where: { id: ws, crmWorkspace: true, workspaceId: null }, select: { id: true } }))) jar.set(VIEWING_COOKIE, ws, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  else jar.delete(VIEWING_COOKIE);
  return NextResponse.redirect(new URL(safe, url.origin));
}
