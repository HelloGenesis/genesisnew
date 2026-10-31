import "server-only";

import { getPrisma } from "@/lib/db";

/**
 * EACH OWNER'S AI DEFAULTS (Genesis, 31 Oct 2026: "AI and Nova Copilot
 * settings, all across"): which AI the chat starts on and how hard it thinks.
 * Kept per person in app settings, like the dashboard's layout.
 */
export type AiPrefs = { model: "copilot" | "nova"; mode: "quick" | "balanced" | "deep" };
export const DEFAULT_AI_PREFS: AiPrefs = { model: "copilot", mode: "balanced" };

const key = (userId: string) => `ai-prefs:${userId}`;

export async function aiPrefs(userId: string): Promise<AiPrefs> {
  const row = await getPrisma().appSetting.findUnique({ where: { key: key(userId) } });
  try {
    const v = row ? (JSON.parse(row.value) as Partial<AiPrefs>) : {};
    return {
      model: v.model === "nova" ? "nova" : "copilot",
      mode: v.mode === "quick" || v.mode === "deep" ? v.mode : "balanced",
    };
  } catch {
    return DEFAULT_AI_PREFS;
  }
}

export async function saveAiPrefs(userId: string, prefs: AiPrefs) {
  const value = JSON.stringify(prefs);
  await getPrisma().appSetting.upsert({ where: { key: key(userId) }, create: { key: key(userId), value }, update: { value } });
}
