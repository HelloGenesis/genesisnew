"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { fileRows, type PlanTarget, planTargets, TARGET_LABEL } from "@/lib/crm/plan-import";
import { IMPORT_KINDS, importRows, mapHeaders } from "@/lib/crm/sheet-import";
import { seesCreators } from "@/lib/crm/scope";
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
  if (!allowed(kind) || (kind === "influencers" && !seesCreators(viewer))) return { added: 0, updated: 0 };
  const fields = IMPORT_KINDS[kind]!.fields;
  const safe = Object.fromEntries(Object.entries(mapping).filter(([, f]) => f in fields));
  const result = await importRows(kind, viewer.id, headers.map((h) => String(h ?? "").trim()), clean(rows), safe, `${/\.csv$/i.test(fileName) ? "CSV" : "Excel"} · ${fileName}`.slice(0, 160));
  if (last) {
    await recordAuditLog({ action: "file.imported", entity: kind, actorId: viewer.id, metadata: { fileName: fileName.slice(0, 200) } });
    revalidatePath("/admin", "layout");
  }
  return result;
}

const TO_DB: Record<string, string> = { name: "name", handle: "handle", profileUrl: "profileUrl", platform: "platform", followers: "followers", avgViews: "avgViews", er: "engagementRate", niches: "niches", city: "city", reelCost: "reelRate", storyCost: "storyRate", dlCost: "dlRate" };
const validTarget = (t: string | undefined): PlanTarget | null => (t && (t in TARGET_LABEL || /^col:.{1,60}$/.test(t)) ? (t as PlanTarget) : null);

/**
 * AN EXCEL OF INFLUENCERS, STRAIGHT INTO A PLAN (Genesis, 13 Oct 2026: "add
 * import Excel sheet button here as well; whatever we add here also gets
 * saved in our database"). Each batch goes into the influencer database
 * (new ones added, existing ones updated, never duplicated), and comes back
 * as plan rows with their rates.
 */
/** `chosen`: the column placements as set (or corrected) in the builder's preview; worked out here when absent. */
export async function importCreatorsForPlan(fileName: string, headers: string[], rows: string[][], mapping: Record<string, string>, chosen?: Record<string, string>) {
  const viewer = await requireStaff("plans");
  const fields = IMPORT_KINDS.influencers!.fields;
  const cleanRows = clean(rows);
  const heads = headers.map((h) => String(h ?? "").trim());
  /*
   * Where each column goes on the plan (lib/crm/plan-import). The database
   * gets the creator's own details; a client price is never saved as the
   * creator's rate, nor a "Tentative Cost" kept as text.
   */
  const guessed = planTargets(heads, mapping);
  const targets = Object.fromEntries(heads.map((h) => [h, validTarget(chosen?.[h]) ?? guessed[h] ?? "skip"])) as Record<string, PlanTarget>;
  /* The database's fields follow the placements: what goes to the plan's cost is the creator's rate, and so on. */
  const safe = Object.fromEntries(
    heads
      .map((h) => [h, TO_DB[targets[h]!] ?? ((targets[h] === "contact" || targets[h] === "remarks") && mapping[h] && mapping[h]! in fields ? mapping[h] : undefined)] as const)
      .filter((e): e is readonly [string, string] => Boolean(e[1]) && e[1]! in fields),
  );
  const result = await importRows("influencers", viewer.id, heads, cleanRows, safe, `${/\.csv$/i.test(fileName) ? "CSV" : "Excel"} · ${fileName} (from a plan)`.slice(0, 160));
  const fromFile = fileRows(heads, cleanRows, targets);
  /* Each row's database entry (when it has a handle), for what the file leaves empty. */
  const handles = [...new Set(fromFile.map((r) => r.handle).filter(Boolean))];
  const known = handles.length ? await getPrisma().creator.findMany({ where: { handle: { in: handles } } }) : [];
  await recordAuditLog({ action: "plan.imported", entity: "influencers", actorId: viewer.id, metadata: { fileName: fileName.slice(0, 200), added: result.added, updated: result.updated } });
  revalidatePath("/admin/creators");
  const r = (p: number | null) => (p === null ? null : p / 100);
  return {
    added: result.added,
    updated: result.updated,
    targets,
    rows: fromFile.map((row) => {
      const c = known.find((k) => k.handle === row.handle && k.platform === row.platform) ?? known.find((k) => k.handle === row.handle);
      return {
        ...row,
        creatorId: c?.id ?? null,
        handle: c?.handle ?? row.handle,
        profileUrl: row.profileUrl ?? c?.profileUrl ?? null,
        followers: row.followers ?? c?.followers ?? 0,
        avgViews: row.avgViews ?? c?.avgViews ?? null,
        er: row.er ?? c?.engagementRate ?? null,
        niches: row.niches ?? c?.niches ?? [],
        city: row.city ?? c?.city ?? null,
        /* The file's costs; the database's rates where the file has none. */
        reelCost: row.reelCost ?? r(c?.reelRatePaise ?? null),
        storyCost: row.storyCost ?? r(c?.storyRatePaise ?? null),
        dlCost: row.dlCost ?? r(c?.dlRatePaise ?? null),
        contact: row.contact ?? ([c?.phone, c?.email, c?.managedBy].filter(Boolean).join(" · ") || null),
      };
    }),
  };
}
