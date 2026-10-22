"use server";

import { getViewer } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

/** The tour seen (finished or skipped): it doesn't open by itself again for this person (components/crm/app-tour). */
export async function finishTour() {
  const viewer = await getViewer();
  if (!viewer) return;
  const key = `tour:done:${viewer.id}`;
  await getPrisma().appSetting.upsert({ where: { key }, create: { key, value: new Date().toISOString() }, update: {} });
}
