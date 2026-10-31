import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { deviceOf, isBot, sourceOf } from "@/lib/site-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * WHERE THE PUBLIC SITE'S VISITS LAND (components/genesis/site-tracker; Genesis,
 * 31 Oct 2026). A page seen, the time spent on it when the visitor moves on,
 * a click or a form sent. No cookies, nothing personal: a random visit id and
 * visitor id from the browser, the country from Vercel's edge.
 */
const Text = (n: number) => z.string().max(n);
const Body = z.discriminatedUnion("t", [
  z.object({ t: z.literal("view"), sid: Text(40), vid: Text(40), isNew: z.boolean(), path: Text(300), title: Text(200).optional(), ref: Text(500).optional(), utm: z.object({ source: Text(80).optional(), medium: Text(80).optional(), campaign: Text(120).optional() }).optional() }),
  z.object({ t: z.literal("leave"), sid: Text(40), path: Text(300), ms: z.number().int().min(0).max(6 * 3600_000) }),
  z.object({ t: z.literal("click"), sid: Text(40), path: Text(300), label: Text(120), kind: z.enum(["click", "form"]).optional() }),
]);

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return new NextResponse(null, { status: 204 });
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return new NextResponse(null, { status: 204 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 204 });
  const e = parsed.data;
  const prisma = getPrisma();
  const now = new Date();
  try {
    if (e.t === "view") {
      const host = request.headers.get("host");
      const existing = await prisma.siteSession.findUnique({ where: { id: e.sid }, select: { pages: true } });
      if (!existing) {
        const d = deviceOf(ua);
        const city = request.headers.get("x-vercel-ip-city");
        await prisma.siteSession.create({
          data: {
            id: e.sid,
            visitorId: e.vid,
            isNew: e.isNew,
            host,
            landing: e.path,
            referrer: e.ref || null,
            source: sourceOf(e.ref || null, e.utm?.source || null, host),
            utmSource: e.utm?.source || null,
            utmMedium: e.utm?.medium || null,
            utmCampaign: e.utm?.campaign || null,
            country: request.headers.get("x-vercel-ip-country"),
            city: city ? decodeURIComponent(city) : null,
            ...d,
          },
        });
      }
      const position = (existing?.pages ?? 0) + 1;
      await prisma.$transaction([
        prisma.sitePageView.create({ data: { sessionId: e.sid, path: e.path, title: e.title || null, position, at: now } }),
        prisma.siteSession.update({ where: { id: e.sid }, data: { pages: position, lastAt: now } }),
      ]);
    } else if (e.t === "leave") {
      const view = await prisma.sitePageView.findFirst({ where: { sessionId: e.sid, path: e.path }, orderBy: { at: "desc" }, select: { id: true } });
      if (view) await prisma.sitePageView.update({ where: { id: view.id }, data: { durationMs: e.ms } });
      await prisma.siteSession.updateMany({ where: { id: e.sid }, data: { lastAt: now } });
    } else {
      if (await prisma.siteSession.findUnique({ where: { id: e.sid }, select: { id: true } })) {
        await prisma.siteEvent.create({ data: { sessionId: e.sid, kind: e.kind ?? "click", label: e.label.trim(), path: e.path, at: now } });
        await prisma.siteSession.update({ where: { id: e.sid }, data: { lastAt: now } });
      }
    }
  } catch (error) {
    console.error("[track]", error);
  }
  return new NextResponse(null, { status: 204 });
}
