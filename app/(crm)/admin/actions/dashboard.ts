"use server";

import { revalidatePath } from "next/cache";

import { normaliseLayout, type WidgetSlot } from "@/lib/crm/dashboard-layout";
import { requireStaff } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

/** This person's dashboard layout (lib/crm/dashboard-layout): saved, or back to the default with null. */
export async function saveDashboardLayout(layout: WidgetSlot[] | null): Promise<{ ok: boolean }> {
  const viewer = await requireStaff();
  if (viewer.demo) return { ok: false };
  const key = `dashboard:${viewer.id}`;
  const prisma = getPrisma();
  if (layout === null) await prisma.appSetting.deleteMany({ where: { key } });
  else {
    const value = JSON.stringify(normaliseLayout(layout));
    await prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  revalidatePath("/admin");
  return { ok: true };
}
