import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { projectRef } from "@/lib/crm/catalog";
import { fileMeta } from "@/lib/crm/drive";
import { folderOf, readTicket } from "@/lib/crm/files";
import { accountEmails, appUrl, queueEmail, queueStaffEmail } from "@/lib/crm/notify";
import { notifyProjectTeam } from "@/lib/crm/project-team";
import { reviewEmail } from "@/lib/crm/review-links";
import { getViewer } from "@/lib/crm/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ ticket: z.string().max(2000), driveId: z.string().min(5).max(200), note: z.string().max(500).optional(), review: z.union([z.boolean(), z.enum(["client", "internal"])]).optional() });

/**
 * Records an uploaded file — after checking the ticket is this person's and
 * the file really is in the folder the ticket named. A cut uploaded by staff
 * with "send for review" also becomes a deliverable: for the client to approve,
 * or (Genesis, 31 Oct 2026: "internal approvals with editors … reflected only
 * to those, and to the brand later") for the producer first, seen only by
 * Genesis and the vendors on the project until the producer sends it on.
 */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const viewer = await getViewer();
  const parsed = body.safeParse(await request.json().catch(() => null));
  const ticket = parsed.success ? readTicket(parsed.data.ticket) : null;
  if (!viewer || !parsed.success || !ticket || ticket.userId !== viewer.id) return NextResponse.json({ error: "Upload expired. Try again." }, { status: 400 });

  const meta = await fileMeta(parsed.data.driveId).catch(() => null);
  if (!meta || !meta.parents?.includes(ticket.parentId)) return NextResponse.json({ error: "That file isn't in the project folder." }, { status: 400 });

  const prisma = getPrisma();
  const project = await prisma.project.findUniqueOrThrow({ where: { id: ticket.projectId } });
  const file = await prisma.driveFile.upsert({
    where: { driveId: meta.id },
    create: {
      driveId: meta.id,
      name: meta.name,
      mimeType: meta.mimeType ?? null,
      sizeBytes: meta.size ? BigInt(meta.size) : null,
      webViewLink: meta.webViewLink ?? null,
      folder: ticket.folder,
      audience: ticket.audience,
      projectId: project.id,
      accountId: project.accountId,
      uploadedById: viewer.id,
      uploadedAs: ticket.as,
      note: parsed.data.note ?? null,
    },
    update: {},
  });
  const folder = folderOf(ticket.folder)!;
  await prisma.activity.create({ data: { projectId: project.id, kind: "SYSTEM", actorId: viewer.id, body: `${ticket.as === "staff" ? "" : `${ticket.as[0]!.toUpperCase()}${ticket.as.slice(1)} `}uploaded "${meta.name}" to ${folder.label}.` } });

  const ref = `${projectRef(project.number)} · ${project.name}`;
  const clientSees = file.audience === "TEAM_CLIENT" || file.audience === "EVERYONE";
  const review = parsed.data.review === true ? "client" : parsed.data.review || null;
  if (ticket.as === "staff" && (review === "internal" || (review === "client" && !clientSees))) {
    const previous = await prisma.deliverable.findFirst({ where: { projectId: project.id, title: `${folder.label}: ${meta.name}` }, orderBy: { version: "desc" } });
    await prisma.deliverable.create({
      data: { projectId: project.id, title: `${folder.label}: ${meta.name}`, url: `/api/crm/files/${file.id}`, fileId: file.id, kind: meta.mimeType?.startsWith("image/") ? "IMAGE" : "VIDEO", status: "INTERNAL_REVIEW", version: (previous?.version ?? 0) + 1, submittedById: viewer.id },
    });
    await notifyProjectTeam(project.id, viewer.id, {
      vendorsToo: file.audience === "TEAM_VENDOR" || file.audience === "EVERYONE",
      subject: `For internal review: ${meta.name} · ${ref}`,
      text: `${folder.label}: "${meta.name}" is ready for the producer's review, before the client sees it.\n\n${appUrl(`/admin/projects/${project.id}#deliverables`)}`,
    });
  } else if (ticket.as === "staff" && review === "client" && clientSees) {
    const previous = await prisma.deliverable.findFirst({ where: { projectId: project.id, title: meta.name }, orderBy: { version: "desc" } });
    const made = await prisma.deliverable.create({
      data: { projectId: project.id, title: `${folder.label}: ${meta.name}`, url: `/api/crm/files/${file.id}`, fileId: file.id, kind: meta.mimeType?.startsWith("image/") ? "IMAGE" : "VIDEO", status: "IN_REVIEW", version: (previous?.version ?? 0) + 1, submittedById: viewer.id },
    });
    /* Approve and Ask for changes right in the email (lib/crm/review-links). */
    await queueEmail(reviewEmail({ id: made.id, title: `${folder.label}: ${meta.name}`, project: project.name, to: await accountEmails(project.accountId), portal: appUrl(`/portal/projects/${project.id}#review`) }));
  } else if (ticket.as !== "staff") {
    await queueStaffEmail({ kind: "file_uploaded", scope: "producers", subject: `New file from the ${ticket.as}: ${meta.name} · ${ref}`, text: `${folder.label} · ${appUrl(`/admin/projects/${project.id}#files`)}` });
  }
  /* Everyone working on the project hears about a vendor's or client's upload (Genesis, 31 Oct 2026). */
  if (ticket.as !== "staff") await notifyProjectTeam(project.id, viewer.id, { vendorsToo: false, subject: `${meta.name} uploaded to ${folder.label} · ${ref}`, text: `${appUrl(`/admin/projects/${project.id}#files`)}` });
  return NextResponse.json({ ok: true, id: file.id });
}
