"use server";

import { revalidatePath } from "next/cache";

import { type ActionState, fail, ok, text } from "@/lib/crm/form-state";
import { saveAiPrefs } from "@/lib/crm/ai-prefs";
import { usesAi } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

/** An owner's AI defaults (lib/crm/ai-prefs). */
export async function saveAiPrefsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  if (!usesAi(viewer)) return fail("Nova Copilot is for the owners only.");
  const model = text(form, "model") === "nova" ? "nova" : "copilot";
  const m = text(form, "mode");
  await saveAiPrefs(viewer.id, { model, mode: m === "quick" || m === "deep" ? m : "balanced" });
  revalidatePath("/admin/assistant", "layout");
  return ok("Saved. New chats start this way.");
}
