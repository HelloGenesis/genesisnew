import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/db";
import { planInputFor } from "@/lib/crm/plan-sheets";
import { type PlanCreator, type PlanInput, planWorkbooks } from "@/lib/crm/plan-tables";
import { creatorScope, quoteScope, seesCreators } from "@/lib/crm/scope";
import { can, getViewer, staffAccess } from "@/lib/crm/session";
import { xlsxBook } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

/**
 * AN INFLUENCER PLAN AS EXCEL, internal or external (Genesis, 13 Oct 2026:
 * "export as Excel and Google Sheet in internal and external sheet button
 * here"). The same rows as the Google Sheets (lib/crm/plan-tables), from:
 *   POST  the builder as it is on screen (no need to save first),
 *   GET   ?quote=<id> a saved plan, or ?creators=<id>… creators ticked in
 *         the influencer database (their rates as cost, +30% as price).
 * ?which=ext (client) or int (team).
 */

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : null);
const fileName = (s: string) => s.replace(/[^\w\s.-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Influencer plan";

async function allowed() {
  const viewer = await getViewer();
  return viewer && staffAccess(viewer) === "granted" && can(viewer, "plans") ? viewer : null;
}

function send(input: PlanInput, which: string) {
  const book = planWorkbooks(input);
  const ext = which !== "int";
  const name = ext ? `${input.brand} x Genesis Media - Influencer Plan` : `INT - ${input.brand} - Influencer plan`;
  return new NextResponse(new Uint8Array(xlsxBook(ext ? book.ext : book.int)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName(name)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!(await allowed())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !Array.isArray(body.creators)) return NextResponse.json({ error: "No plan" }, { status: 400 });
  const cols = (body.planColumns ?? {}) as { hidden?: unknown; custom?: unknown };
  const input: PlanInput = {
    title: str(body.title, 200) || "Influencer plan",
    brand: str(body.company, 160) || str(body.contactName, 120) || str(body.title, 120) || "Brand",
    terms: str(body.terms, 12000),
    planBudget: str(body.planBudget, 120),
    columns: { hidden: Array.isArray(cols.hidden) ? cols.hidden.map(String).slice(0, 40) : [], custom: Array.isArray(cols.custom) ? cols.custom.map(String).slice(0, 20) : [] },
    creators: (body.creators as Record<string, unknown>[]).slice(0, 500).map(
      (c): PlanCreator => ({
        name: str(c.name, 200) ?? "", handle: str(c.handle, 120) ?? "", platform: str(c.platform, 20) ?? "INSTAGRAM", profileUrl: str(c.profileUrl, 1000),
        followers: num(c.followers) ?? 0, avgViews: num(c.avgViews), er: num(c.er), niches: Array.isArray(c.niches) ? c.niches.map(String).slice(0, 30) : [], city: str(c.city, 200),
        reelCost: num(c.reelCost), storyCost: num(c.storyCost), dlCost: num(c.dlCost), reelPrice: num(c.reelPrice), storyPrice: num(c.storyPrice), dlPrice: num(c.dlPrice),
        reachout: str(c.reachout, 120), phone: str(c.phone, 1000), email: str(c.email, 1000), tier: str(c.tier, 40), remarks: str(c.remarks, 1000),
        extra: c.extra && typeof c.extra === "object" ? Object.fromEntries(Object.entries(c.extra as Record<string, unknown>).map(([k, v]) => [k.slice(0, 80), String(v ?? "").slice(0, 1000)])) : {},
      }),
    ),
  };
  return send(input, url.searchParams.get("which") ?? "ext");
}

export async function GET(request: Request) {
  const viewer = await allowed();
  if (!viewer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const which = url.searchParams.get("which") ?? "ext";
  const quoteId = url.searchParams.get("quote");
  if (quoteId) {
    const q = await getPrisma().quote.findFirst({ where: { id: quoteId, ...quoteScope(viewer) }, select: { id: true } });
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return send((await planInputFor(q.id, viewer)).input, which);
  }
  const ids = url.searchParams.getAll("creators").slice(0, 500);
  if (!ids.length) return NextResponse.json({ error: "Tick some creators first." }, { status: 400 });
  /* Only creators this person may see (the influencer database is private). */
  if (!seesCreators(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await getPrisma().creator.findMany({ where: { id: { in: ids }, ...creatorScope(viewer) } });
  const r = (p: number | null) => (p === null ? null : p / 100);
  const up = (p: number | null) => (p === null ? null : Math.round((p / 100) * 1.3));
  return send(
    {
      title: "Influencer plan",
      brand: "Brand",
      terms: null,
      planBudget: "As per Brand",
      columns: {},
      creators: rows.map((c) => ({
        name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, er: c.engagementRate, niches: c.niches, city: c.city,
        reelCost: r(c.reelRatePaise), storyCost: r(c.storyRatePaise), dlCost: r(c.dlRatePaise), reelPrice: up(c.reelRatePaise), storyPrice: up(c.storyRatePaise), dlPrice: up(c.dlRatePaise),
        phone: c.phone, email: c.email, remarks: c.managedBy ? `Managed by ${c.managedBy}` : null, yt: c.youtubeUrl,
      })),
    },
    which,
  );
}
