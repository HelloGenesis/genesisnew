"use server";

import { getPrisma } from "@/lib/db";
import { decideDeliverable, readReviewToken } from "@/lib/crm/review-links";

/** Approve, or send one round of changes, from the page the review email opens (lib/crm/review-links). */
export async function decideFromEmail(token: string, decision: "approve" | "changes", feedback: string): Promise<{ ok: boolean; message: string }> {
  const id = readReviewToken(token);
  if (!id) return { ok: false, message: "This link has expired. Open the project in your portal instead." };
  const note = feedback.trim().slice(0, 4000);
  if (decision === "changes" && !note) return { ok: false, message: "Tell us what to change, in one consolidated note." };
  const d = await getPrisma().deliverable.findUnique({ where: { id }, include: { project: { include: { account: { select: { name: true } } } } } });
  if (!d) return { ok: false, message: "We couldn't find this any more." };
  const done = await decideDeliverable({ id, decision, feedback: note || null, by: `${d.project.account.name} (from the email)`, userId: null });
  if (!done) return { ok: false, message: "This isn't waiting for review any more: it may already be approved." };
  return { ok: true, message: decision === "approve" ? "Approved. Thank you, the team has been told." : "Sent to the team. They'll come back with the next version." };
}
