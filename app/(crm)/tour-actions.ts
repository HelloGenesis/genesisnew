"use server";

import { getViewer } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

/** A tour seen (finished or skipped): it doesn't offer itself again to this person (components/crm/app-tour; "copilot": components/crm/copilot-tour). */
export async function finishTour(which: "app" | "copilot" = "app") {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return;
  const key = which === "app" ? `tour:done:${viewer.id}` : `tour:${which}:done:${viewer.id}`;
  await getPrisma().appSetting.upsert({ where: { key }, create: { key, value: new Date().toISOString() }, update: {} });
}
