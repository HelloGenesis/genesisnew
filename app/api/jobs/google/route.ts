import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { syncGoogle } from "@/lib/crm/ingest";
import { syncSheetImports } from "@/lib/crm/sheet-import";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* The AI reads each email and document, which takes seconds apiece: this job has its own, longer budget. */
export const maxDuration = 300;

/** Vercel Cron, every five minutes: connected Gmail and Drive (lib/crm/ingest), then sheets kept in sync. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const report: Record<string, unknown> = {};
  try {
    report.google = await syncGoogle();
  } catch (error) {
    report.google = { error: String((error as Error).message).slice(0, 300) };
  }
  try {
    report.sheets = await syncSheetImports();
  } catch (error) {
    report.sheets = { error: String((error as Error).message).slice(0, 300) };
  }
  return NextResponse.json(report);
}
