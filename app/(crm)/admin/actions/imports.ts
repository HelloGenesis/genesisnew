"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { IMPORT_KINDS, importRows, mapHeaders } from "@/lib/crm/sheet-import";
import { requireStaff } from "@/lib/crm/session";

/**
 * AN EXCEL OR CSV FILE INTO THE CRM (Genesis, 13 Oct 2026: "add an import
 * data feature … Excel format or import from a Google Sheet"). The browser
 * reads the file; these take its header row (to match the columns) and then
 * its rows in batches, so a list of thousands never hits an upload limit.
 */

const allowed = (kind: string) => kind in IMPORT_KINDS && kind !== "expenses";
const clean = (rows: unknown[][]) => rows.slice(0, 500).map((r) => (Array.isArray(r) ? r.slice(0, 80).map((c) => String(c ?? "").slice(0, 2000)) : []));

export async function matchUploadColumns(kind: string, headers: string[], sample: string[][]) {
  await requireStaff();
  if (!allowed(kind)) return {};
  return mapHeaders(kind, headers.map((h) => String(h ?? "").slice(0, 200)), clean(sample).slice(0, 5));
}

export async function importUploadBatch(kind: string, fileName: string, headers: string[], rows: string[][], mapping: Record<string, string>, last: boolean) {
  const viewer = await requireStaff();
  if (!allowed(kind)) return { added: 0, updated: 0 };
  const fields = IMPORT_KINDS[kind]!.fields;
  const safe = Object.fromEntries(Object.entries(mapping).filter(([, f]) => f in fields));
  const result = await importRows(kind, viewer.id, headers.map((h) => String(h ?? "").trim()), clean(rows), safe);
  if (last) {
    await recordAuditLog({ action: "file.imported", entity: kind, actorId: viewer.id, metadata: { fileName: fileName.slice(0, 200) } });
    revalidatePath("/admin", "layout");
  }
  return result;
}

/**
 * AN EXCEL OF INFLUENCERS, STRAIGHT INTO A PLAN (Genesis, 13 Oct 2026: "add
 * import Excel sheet button here as well; whatever we add here also gets
 * saved in our database"). Each batch goes into the influencer database
 * (new ones added, existing ones updated, never duplicated), and comes back
 * as plan rows with their rates.
 */
export async function importCreatorsForPlan(fileName: string, headers: string[], rows: string[][], mapping: Record<string, string>) {
  const viewer = await requireStaff("sales");
  const fields = IMPORT_KINDS.influencers!.fields;
  const safe = Object.fromEntries(Object.entries(mapping).filter(([, f]) => f in fields));
  const result = await importRows("influencers", viewer.id, headers.map((h) => String(h ?? "").trim()), clean(rows), safe);
  const ids = [...new Set(result.ids ?? [])];
  const creators = ids.length ? await getPrisma().creator.findMany({ where: { id: { in: ids } } }) : [];
  await recordAuditLog({ action: "plan.imported", entity: "influencers", actorId: viewer.id, metadata: { fileName: fileName.slice(0, 200), added: result.added, updated: result.updated } });
  revalidatePath("/admin/creators");
  const r = (p: number | null) => (p === null ? null : p / 100);
  return {
    added: result.added,
    updated: result.updated,
    creators: creators.map((c) => ({ id: c.id, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, er: c.engagementRate, reel: r(c.reelRatePaise), story: r(c.storyRatePaise), dl: r(c.dlRatePaise), contact: [c.phone, c.email, c.managedBy].filter(Boolean).join(" · ") || null })),
  };
}
