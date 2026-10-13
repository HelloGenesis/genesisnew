import { NextResponse } from "next/server";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { planInputFor } from "@/lib/crm/plan-sheets";
import { type PlanColumns, planWorkbooks, sharesSheet } from "@/lib/crm/plan-tables";
import { xlsxBook } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

/**
 * The external influencer plan as Excel, for the brand (the quote link is
 * the permission): only when the plan is sent as a sheet, and never the
 * internal one.
 */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isDatabaseConfigured()) return new NextResponse(null, { status: 404 });
  const { token } = await params;
  const q = await getPrisma().quote.findUnique({ where: { token }, select: { id: true, planColumns: true } });
  if (!q || !sharesSheet(q.planColumns as PlanColumns)) return new NextResponse(null, { status: 404 });
  const { input } = await planInputFor(q.id);
  const name = `${input.brand} x Genesis Media - Influencer Plan`.replace(/[^\w\s.-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return new NextResponse(new Uint8Array(xlsxBook(planWorkbooks(input).ext)), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}.xlsx"`, "Cache-Control": "no-store" },
  });
}
