"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
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
