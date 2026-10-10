import { NextResponse } from "next/server";

import { currentIdentity, safeNext, syncIdentity } from "@/lib/crm/session";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Where every sign-in lands. Maps the identity to its user, claims any staff
 * or portal invite waiting for its verified email, then continues: to `next`
 * when that is somewhere this person may go, otherwise staff to /admin and
 * clients, agencies and vendors to /portal.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const identity = await currentIdentity();
  if (!identity || !isDatabaseConfigured()) return NextResponse.redirect(new URL("/login", url.origin));

  const user = await syncIdentity(identity);
  const [staff, member] = await Promise.all([
    getPrisma().staffRole.count({ where: { userId: user.id } }),
    getPrisma().accountMember.count({ where: { userId: user.id } }),
  ]);
  const next = safeNext(url.searchParams.get("next"), "");
  const home = staff ? "/admin" : member ? "/portal" : "/portal/welcome";
  const allowed = next && !(next.startsWith("/admin") && !staff);
  return NextResponse.redirect(new URL(allowed ? next : home, url.origin));
}
