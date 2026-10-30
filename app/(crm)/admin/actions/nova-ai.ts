"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { type ActionState, fail, ok, text } from "@/lib/crm/form-state";
import { type CreditPack, grantNovaAi, saveNovaAiPacks } from "@/lib/crm/nova-ai";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

/** NOVA AI's credit packs and grants, set by Genesis's super admins (lib/crm/nova-ai; AI usage page). */

export async function saveNovaAiPricing(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  if (!isSuperAdmin(viewer) || viewer.workspaceId) return fail("Super admins only.");
  const packs: CreditPack[] = [];
  for (let i = 0; i < 6; i++) {
    const credits = Number(text(form, `pack${i}_credits`));
    const price = Number(text(form, `pack${i}_price`));
    if (!credits && !price) continue;
    if (!(credits > 0) || !(price > 0)) return fail(`Pack ${i + 1}: both credits and a price are needed.`);
    packs.push({ credits: Math.round(credits), price: Math.round(price) });
  }
  if (!packs.length) return fail("Keep at least one pack.");
  await saveNovaAiPacks(packs);
  await recordAuditLog({ action: "nova_ai.pricing", entity: "setting", entityId: "nova-ai-pricing", actorId: viewer.id, metadata: { packs } });
  revalidatePath("/admin/assistant/usage");
  return ok("NOVA AI packs saved.");
}

export async function grantNovaAiCredits(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  if (!isSuperAdmin(viewer) || viewer.workspaceId) return fail("Super admins only.");
  const ws = text(form, "ws");
  const credits = Number(text(form, "credits"));
  if (!ws || !Number.isFinite(credits) || credits === 0) return fail("Pick the agency and the number of credits (negative takes away).");
  const agency = await getPrisma().account.findFirst({ where: { id: ws, crmWorkspace: true, workspaceId: null }, select: { name: true } });
  if (!agency) return fail("That agency wasn't found.");
  await grantNovaAi(ws, credits, viewer.id, text(form, "note", 200) ?? "Added by Genesis");
  await recordAuditLog({ action: "nova_ai.grant", entity: "account", entityId: ws, actorId: viewer.id, metadata: { credits } });
  revalidatePath("/admin/assistant/usage");
  return ok(`${credits > 0 ? "Added" : "Took away"} ${Math.abs(credits)} NOVA AI credits for ${agency.name}.`);
}
