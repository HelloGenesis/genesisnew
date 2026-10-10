import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { authorizeUrl, driveOAuthConfigured } from "@/lib/crm/drive";
import { can, getViewer, staffAccess } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

/** An owner connects Genesis's Google Drive: off to Google to sign in as hello@genesismedia.co. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const viewer = await getViewer();
  if (staffAccess(viewer) !== "granted" || !can(viewer, "staff")) return NextResponse.redirect(new URL("/admin/forbidden", url.origin));
  if (!driveOAuthConfigured()) return NextResponse.redirect(new URL("/admin/settings?drive=unconfigured", url.origin));
  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(authorizeUrl(url.origin, state));
  response.cookies.set("gm_drive_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: process.env.NODE_ENV === "production" });
  return response;
}
