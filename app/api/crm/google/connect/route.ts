import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { googleAuthorizeUrl, googleConfigured } from "@/lib/crm/google";
import { getViewer, staffAccess } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/** A team member connects their own Google (Gmail, Drive, Sheets; read-only). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const viewer = await getViewer();
  if (staffAccess(viewer) !== "granted") return NextResponse.redirect(new URL("/login?next=/admin/inbox", url.origin));
  if (!googleConfigured()) return NextResponse.redirect(new URL("/admin/inbox?google=unconfigured", url.origin));
  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(googleAuthorizeUrl(url.origin, state, viewer!.email));
  response.cookies.set("gm_google_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: process.env.NODE_ENV === "production" });
  return response;
}
