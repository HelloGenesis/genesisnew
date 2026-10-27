"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { addConnector, setConnector } from "@/lib/crm/ai-connectors";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff, type Viewer } from "@/lib/crm/session";

/** The assistant's connected apps (lib/crm/ai-connectors): owners, or an agency CRM's admins, manage them. */

const mayManage = (v: Viewer) => (v.workspaceId ? v.workspaceRole === "ADMIN" : isSuperAdmin(v));

export async function connectApp(input: { name: string; url: string; token?: string }) {
  const viewer = await requireStaff();
  if (!mayManage(viewer)) return { ok: false, message: "Only an owner can connect apps." };
  const name = input.name.trim().slice(0, 60);
  const url = input.url.trim();
  if (!name) return { ok: false, message: "Give it a name." };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, message: "That link doesn't look right." };
  }
  if (parsed.protocol !== "https:") return { ok: false, message: "The link must start with https://." };
  const id = await addConnector(viewer.ws ?? null, viewer.id, { name, url: parsed.toString(), token: input.token?.trim() || null });
  await recordAuditLog({ action: "ai.connector_added", entity: "connector", entityId: id, actorId: viewer.id, metadata: { name, host: parsed.host } });
  revalidatePath("/admin/assistant");
  return { ok: true, message: `${name} is connected.` };
}

export async function changeApp(id: string, change: { enabled?: boolean; remove?: boolean }) {
  const viewer = await requireStaff();
  if (!mayManage(viewer)) return { ok: false, message: "Only an owner can change connected apps." };
  await setConnector(viewer.ws ?? null, id, change);
  await recordAuditLog({ action: change.remove ? "ai.connector_removed" : "ai.connector_changed", entity: "connector", entityId: id, actorId: viewer.id, metadata: change });
  revalidatePath("/admin/assistant");
  return { ok: true };
}
