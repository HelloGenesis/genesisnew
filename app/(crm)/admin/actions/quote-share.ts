"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { notify } from "@/lib/crm/notifications";
import { appUrl } from "@/lib/crm/notify";
import { docRef } from "@/lib/crm/quote-templates";
import { addShares, grantPlanSheets, removeShare, shareCandidates } from "@/lib/crm/quote-share";
import { quoteScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

/**
 * SHARE A QUOTE OR PLAN (Genesis, 2 Nov 2026): the people picked get a
 * notification and an email with a link straight to it, and editor access to
 * the plan's Google Sheets. Anyone who can open it can share it.
 */
export async function shareQuote(quoteId: string, userIds: string[], note: string): Promise<{ ok: boolean; message: string }> {
  const viewer = await requireStaff("plans");
  const q = await getPrisma().quote.findFirst({ where: { id: quoteId, ...quoteScope(viewer) }, select: { id: true, number: true, baseNumber: true, revision: true, kind: true, title: true, workspaceId: true } });
  if (!q) return { ok: false, message: "That quote isn't yours to share." };
  const allowed = new Set((await shareCandidates(q.workspaceId)).map((p) => p.id));
  const ids = [...new Set(userIds)].filter((id) => allowed.has(id) && id !== viewer.id);
  if (!ids.length) return { ok: false, message: "Pick someone on your team." };
  await addShares(q.id, ids, viewer.id);
  const people = await getPrisma().user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, workspaceId: true } });
  const what = q.kind === "INFLUENCER_PLAN" ? "plan" : "quote";
  const path = `/admin/quotes/${q.id}`;
  const by = viewer.name ?? viewer.email ?? "Someone";
  /* Genesis's owners open it in whichever CRM it's in (app/(crm)/admin/switch). */
  for (const p of people) {
    const href = (p.workspaceId ?? null) === (q.workspaceId ?? null) ? path : `/admin/switch?ws=${q.workspaceId ?? ""}&next=${encodeURIComponent(path)}`;
    await notify([p.id], {
      title: `${by} shared a ${what} with you: ${q.title}`,
      body: `${note.trim() ? `${note.trim().slice(0, 600)}\n\n` : ""}${docRef(q)} · ${appUrl(href)}`,
      href,
      email: true,
    });
  }
  const sheets = await grantPlanSheets(q.id, people.map((p) => p.email).filter((e): e is string => Boolean(e))).catch(() => false);
  await recordAuditLog({ action: "quote.shared", entity: "quote", entityId: q.id, actorId: viewer.id, metadata: { with: ids } });
  revalidatePath(path);
  return { ok: true, message: `Shared with ${ids.length} ${ids.length === 1 ? "person" : "people"}${sheets ? ", with the Google Sheets" : ""}.` };
}

export async function unshareQuote(quoteId: string, userId: string) {
  const viewer = await requireStaff("plans");
  const q = await getPrisma().quote.findFirst({ where: { id: quoteId, ...quoteScope(viewer) }, select: { id: true } });
  if (!q) return;
  await removeShare(q.id, userId);
  revalidatePath(`/admin/quotes/${q.id}`);
}
