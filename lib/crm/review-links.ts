import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getPrisma } from "@/lib/db";

import { emailHtml } from "./email-html";
import { appUrl, queueStaffEmail } from "./notify";
import { notifyProjectTeam } from "./project-team";

/**
 * APPROVE FROM THE EMAIL (Genesis, 31 Oct 2026: "take approval from clients
 * with an approval button right there in the email"). Each review email
 * carries a signed link for that one deliverable; it opens /review/<token>,
 * where the client confirms Approve or writes their changes. Nothing is
 * decided by opening the link (mail scanners open links), only by the button
 * on the page. The link works for 60 days and only while it's still in review.
 */
const secret = () => process.env.AUTH0_SECRET || process.env.CRM_DEV_SECRET || "genesis-local-development-only";
const DAYS = 60;

export function reviewToken(deliverableId: string) {
  const body = Buffer.from(JSON.stringify({ d: deliverableId, exp: Date.now() + DAYS * 86400_000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(`review:${body}`).digest("base64url")}`;
}

export function readReviewToken(token: string): string | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(`review:${body}`).digest("base64url");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const t = JSON.parse(Buffer.from(body, "base64url").toString()) as { d: string; exp: number };
    return t.exp > Date.now() ? t.d : null;
  } catch {
    return null;
  }
}

export const reviewUrl = (deliverableId: string, choice?: "approve" | "changes") => appUrl(`/review/${reviewToken(deliverableId)}${choice ? `?do=${choice}` : ""}`);

/** The client's decision, from their portal or from the email's page. */
export async function decideDeliverable(input: { id: string; decision: "approve" | "changes"; feedback: string | null; by: string; userId: string | null }) {
  const prisma = getPrisma();
  const d = await prisma.deliverable.findUnique({ where: { id: input.id }, include: { project: true } });
  if (!d || d.status !== "IN_REVIEW") return null;
  const approve = input.decision === "approve";
  await prisma.deliverable.update({
    where: { id: d.id },
    data: { status: approve ? "APPROVED" : "CHANGES_REQUESTED", feedback: approve ? null : input.feedback, reviewedById: input.userId, reviewedAt: new Date() },
  });
  await prisma.activity.create({ data: { projectId: d.projectId, kind: "STATUS", actorId: input.userId, body: `Client ${approve ? "approved" : "asked for changes to"} "${d.title}" v${d.version}${input.userId ? "" : " (from the email)"}.` } });
  const subject = `${approve ? "Approved" : "Changes requested"}: ${d.title} · ${d.project.name}`;
  const text = `${input.by} ${approve ? "approved" : "asked for changes to"} "${d.title}" (v${d.version}).${input.feedback && !approve ? `\n\nTheir note:\n${input.feedback}` : ""}\n\n${appUrl(`/admin/projects/${d.projectId}`)}`;
  await queueStaffEmail({ kind: approve ? "deliverable_approved" : "deliverable_changes", scope: "producers", subject, text });
  /* Everyone on the project, editors and crew included (lib/crm/project-team). */
  await notifyProjectTeam(d.projectId, input.userId, { vendorsToo: true, subject, text });
  return d;
}

/** The review email: the piece, Approve and Ask for changes buttons, and the portal as the long way round. */
export function reviewEmail(r: { id: string; title: string; project: string; to: string[]; portal: string }) {
  const approve = reviewUrl(r.id, "approve");
  const changes = reviewUrl(r.id, "changes");
  const watch = reviewUrl(r.id);
  return {
    kind: "deliverable_review",
    to: r.to,
    subject: `Ready for your review: ${r.title}`,
    text: `"${r.title}" for ${r.project} is ready.\n\nWatch it, then approve it or tell us what to change:\nApprove: ${approve}\nAsk for changes: ${changes}\n\nOr open it in your portal: ${r.portal}\n\nOne consolidated round of feedback per piece keeps things moving fastest.`,
    html: emailHtml({
      heading: `Ready for your review: ${r.title}`,
      paragraphs: [`**${r.title}** for ${r.project} is ready. Watch it, then approve it or tell us what to change.`],
      buttons: [
        { label: "Approve", url: approve, tone: "primary" },
        { label: "Ask for changes", url: changes, tone: "secondary" },
        { label: "Watch it", url: watch, tone: "secondary" },
      ],
      note: `One consolidated round of feedback per piece keeps things moving fastest. You can also review it in your portal: ${r.portal}`,
    }),
  };
}
