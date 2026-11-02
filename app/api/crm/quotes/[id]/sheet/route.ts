import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/db";
import { grantPlanSheets } from "@/lib/crm/quote-share";
import { quoteScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

/**
 * OPENING A PLAN'S SHEET FROM THE CRM (Genesis, 2 Nov 2026: Ayaan got "You
 * need access" on his own plan's sheet): whoever can open the plan in the CRM
 * is given access to its sheet first, then taken there. ?which=int|ext.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const viewer = await requireStaff("plans");
  const q = await getPrisma().quote.findFirst({ where: { id, ...quoteScope(viewer) }, select: { extSheetId: true, intSheetId: true } });
  const sheet = url.searchParams.get("which") === "ext" ? q?.extSheetId : q?.intSheetId;
  if (!sheet) return NextResponse.redirect(new URL(`/admin/quotes/${id}`, url.origin));
  if (viewer.email) await grantPlanSheets(id, [viewer.email]).catch(() => false);
  return NextResponse.redirect(`https://docs.google.com/spreadsheets/d/${sheet}/edit`);
}
