"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { createConnectorKey, revokeConnectorKey } from "@/lib/crm/mcp-keys";
import { appUrl } from "@/lib/crm/notify";
import { usesAi } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

/** A new ChatGPT / Claude connector link for the signed-in person (lib/crm/mcp-keys); shown once. */
export async function createConnectorLink(label: string) {
  const viewer = await requireStaff();
  if (!usesAi(viewer)) throw new Error("Genesis Copilot is open to the owners only.");
  const secret = await createConnectorKey(viewer.id, label);
  await recordAuditLog({ action: "connector.created", entity: "user", entityId: viewer.id, actorId: viewer.id, metadata: { label: label.slice(0, 60) } });
  revalidatePath("/admin/settings");
  return { url: appUrl(`/api/mcp/${secret}`) };
}

export async function revokeConnectorLink(form: FormData) {
  const viewer = await requireStaff();
  await revokeConnectorKey(viewer.id, String(form.get("id") ?? ""));
  await recordAuditLog({ action: "connector.revoked", entity: "user", entityId: viewer.id, actorId: viewer.id });
  revalidatePath("/admin/settings");
}
