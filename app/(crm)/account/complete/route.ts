import { NextResponse } from "next/server";

import { currentIdentity, safeNext, syncIdentity } from "@/lib/crm/session";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { hintValue, SIGNED_IN_HINT, SIGNED_IN_HINT_MAX_AGE } from "@/lib/signed-in-hint";

export const dynamic = "force-dynamic";

/**
 * Where every sign-in lands. Maps the identity to its user, claims any staff
 * or portal invite waiting for its verified email, then continues: to `next`
 * when that is somewhere this person may go, otherwise staff to /admin and
 * everyone else to /account, which links their portals.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const identity = await currentIdentity();
  if (!identity || !isDatabaseConfigured()) return NextResponse.redirect(new URL("/login", url.origin));

  const user = await syncIdentity(identity);
  const staff = await getPrisma().staffRole.count({ where: { userId: user.id } });
  const next = safeNext(url.searchParams.get("next"), "");
  /* Staff to the CRM; everyone else to My account (cart, purchases, portals). */
  const home = staff ? "/admin" : "/account";
  const allowed = next && !(next.startsWith("/admin") && !staff);
  const response = NextResponse.redirect(new URL(allowed ? next : home, url.origin));
  /* Tells the site's bar to show the cart and "My account" (lib/signed-in-hint). */
  response.cookies.set(SIGNED_IN_HINT, hintValue(user.name), { path: "/", maxAge: SIGNED_IN_HINT_MAX_AGE, sameSite: "lax", secure: url.protocol === "https:" });
  return response;
}
