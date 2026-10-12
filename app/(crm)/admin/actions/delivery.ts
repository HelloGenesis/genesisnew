"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPrisma } from "@/lib/db";
import type {
  AssignmentStatus,
  CampaignCreatorStatus,
  CreatorTier,
  DeliverableKind,
  DeliverableStatus,
  Platform,
  Priority,
  ProjectStatus,
  RequestStatus,
} from "@/lib/generated/prisma/enums";
import { CAMPAIGN_CREATOR_STATUS, DIVISIONS, PROJECT_STATUS, REQUEST_STATUS, money, projectRef, requestRef, tierFor, toPaise } from "@/lib/crm/catalog";
import { type ActionState, day, fail, links, ok, text } from "@/lib/crm/form-state";
import { accountEmails, appUrl, queueEmail } from "@/lib/crm/notify";
import { queueSheet } from "@/lib/crm/sheets";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { openProject } from "@/lib/crm/projects";
import { stagesOf } from "@/lib/crm/stages";

/** Server actions for projects, deliverables, messages, requests, tasks, vendors and creators. */

const done = () => revalidatePath("/admin", "layout");
const oneOf = <T extends string>(value: string | null, list: readonly T[]): T | null => (value && (list as readonly string[]).includes(value) ? (value as T) : null);

// --- Projects ---------------------------------------------------------------------

export async function createProject(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("delivery");
  const accountId = text(form, "accountId");
  const name = text(form, "name", 200);
  const division = oneOf(text(form, "division"), DIVISIONS);
  if (!accountId || !name || !division) return fail("Choose a client, a division and a name.");
  const project = await openProject({
    accountId,
    name,
    division,
    templateKey: text(form, "template"),
    managerId: text(form, "managerId") ?? viewer.id,
    dueDate: day(form, "dueDate"),
    quota: Number(form.get("quota")) || null,
    brief: text(form, "brief"),
    driveUrl: text(form, "driveUrl", 500),
    why: "Project opened by hand.",
    actorId: viewer.id,
  });
  done();
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProject(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("delivery");
  const id = text(form, "id");
  if (!id) return fail("Missing project.");
  const prisma = getPrisma();
  const before = await prisma.project.findUnique({ where: { id } });
  if (!before) return fail("That project no longer exists.");
  /* The stage list itself is editable: one per line ("it may vary from service to service"). */
  const stageText = text(form, "stages", 2000);
  const stageList = stageText ? stageText.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 15) : null;
  const stages = stageList?.length ? stageList : stagesOf(before);
  const stage = Math.max(0, Math.min(stages.length - 1, Number(form.get("stage") ?? before.stage)));
  const status = (oneOf(text(form, "status"), Object.keys(PROJECT_STATUS) as ProjectStatus[]) ?? before.status) as ProjectStatus;
  await prisma.project.update({
    where: { id },
    data: {
      name: text(form, "name", 200) ?? before.name,
      stage,
      status,
      managerId: text(form, "managerId"),
      dueDate: day(form, "dueDate"),
      quota: Number(form.get("quota")) || null,
      brief: text(form, "brief"),
      driveUrl: text(form, "driveUrl", 500),
      ...(stageList ? { stages: stageList } : {}),
    },
  });
  if (stage !== before.stage || status !== before.status) await afterProgress(id, before.stage, stage, before.status, status, viewer.id);
  await queueSheet("projects", id);
  done();
  return ok("Saved.");
}

/** "Move to next stage" — the producer's one click. */
export async function advanceStage(form: FormData) {
  const viewer = await requireStaff("delivery");
  const id = text(form, "id");
  if (!id) return;
  const prisma = getPrisma();
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) return;
  const last = stagesOf(p).length - 1;
  const stage = Math.min(last, p.stage + 1);
  const status: ProjectStatus = stage === last ? "DELIVERED" : p.status;
  await prisma.project.update({ where: { id }, data: { stage, status } });
  await afterProgress(id, p.stage, stage, p.status, status, viewer.id);
  await queueSheet("projects", id);
  done();
}

/** The timeline note, and the client told when their project moves on. */
async function afterProgress(id: string, from: number, to: number, fromStatus: ProjectStatus, toStatus: ProjectStatus, actorId: string) {
  const prisma = getPrisma();
  const p = await prisma.project.findUniqueOrThrow({ where: { id } });
  const moved = from !== to ? `${stagesOf(p)[from]} → ${stagesOf(p)[to]}` : "";
  const status = fromStatus !== toStatus ? `${PROJECT_STATUS[fromStatus].label} → ${PROJECT_STATUS[toStatus].label}` : "";
  await prisma.activity.create({ data: { projectId: id, kind: "STATUS", actorId, body: [moved, status].filter(Boolean).join(" · ") } });
  await queueEmail({
    kind: "project_progress",
    to: await accountEmails(p.accountId),
    subject: toStatus === "DELIVERED" ? `Delivered: ${p.name}` : `${p.name}: now at ${stagesOf(p)[to]}`,
    text:
      toStatus === "DELIVERED"
        ? `${p.name} is delivered. Final files are in your portal.\n\n${appUrl(`/portal/projects/${id}`)}\n\nThank you for working with us. If you'd like more of the same, send a new brief from the portal any time.`
        : `Your project ${projectRef(p.number)} · ${p.name} has moved to ${stagesOf(p)[to]}.\n\nFollow it here: ${appUrl(`/portal/projects/${id}`)}`,
    dedupeKey: `progress:${id}:${to}:${toStatus}`,
  });
}

// --- Deliverables -----------------------------------------------------------------

const DELIVERABLE_KINDS = ["VIDEO", "IMAGE", "DESIGN", "DOCUMENT", "LINK"] as const;

export async function addDeliverable(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("delivery");
  const projectId = text(form, "projectId");
  const title = text(form, "title", 200);
  const url = text(form, "url", 1000);
  if (!projectId || !title || !url || !/^https?:\/\//i.test(url)) return fail("Add a title and a link (Drive, Frame.io, YouTube…).");
  const prisma = getPrisma();
  const previous = await prisma.deliverable.findFirst({ where: { projectId, title }, orderBy: { version: "desc" } });
  const send = form.get("send") === "on";
  await prisma.deliverable.create({
    data: {
      projectId,
      title,
      url,
      kind: (oneOf(text(form, "kind"), DELIVERABLE_KINDS) ?? "VIDEO") as DeliverableKind,
      version: (previous?.version ?? 0) + 1,
      status: send ? "IN_REVIEW" : "DRAFT",
      submittedById: viewer.id,
    },
  });
  if (send) await askForReview(projectId, title);
  done();
  return ok(send ? "Shared with the client for review." : "Saved as an internal draft.");
}

async function askForReview(projectId: string, title: string) {
  const p = await getPrisma().project.findUniqueOrThrow({ where: { id: projectId } });
  await queueEmail({
    kind: "deliverable_review",
    to: await accountEmails(p.accountId),
    subject: `Ready for your review: ${title}`,
    text: `"${title}" for ${p.name} is ready. Have a look, then approve it or tell us what to change, all in one place:\n\n${appUrl(`/portal/projects/${projectId}`)}\n\nOne consolidated round of feedback per piece keeps things moving fastest.`,
  });
}

export async function setDeliverableStatus(form: FormData) {
  await requireStaff("delivery");
  const id = text(form, "id");
  const status = oneOf(text(form, "status"), ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED"] as const) as DeliverableStatus | null;
  if (!id || !status) return;
  const d = await getPrisma().deliverable.update({ where: { id }, data: { status } });
  if (status === "IN_REVIEW") await askForReview(d.projectId, d.title);
  done();
}

// --- Messages ---------------------------------------------------------------------

/** A message to the client (emailed to them) or an internal note (never leaves Genesis). */
export async function postStaffMessage(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const body = text(form, "body");
  if (!body) return fail("Write a message first.");
  const projectId = text(form, "projectId");
  const requestId = text(form, "requestId");
  const internal = form.get("internal") === "on";
  const prisma = getPrisma();
  const owner = projectId
    ? await prisma.project.findUnique({ where: { id: projectId }, select: { accountId: true, name: true, number: true } })
    : requestId
      ? await prisma.request.findUnique({ where: { id: requestId }, select: { accountId: true, title: true, number: true } })
      : null;
  if (!owner) return fail("Nothing to post to.");
  await prisma.message.create({ data: { accountId: owner.accountId, projectId, requestId, authorId: viewer.id, fromStaff: true, internal, body, links: links(form, "links") } });
  if (requestId && !internal) await prisma.request.update({ where: { id: requestId }, data: { status: "WAITING_ON_CLIENT" } });
  if (!internal) {
    const subject = "name" in owner ? `${projectRef(owner.number)} · ${owner.name}` : `${requestRef(owner.number)} · ${owner.title}`;
    await queueEmail({
      kind: "staff_message",
      to: await accountEmails(owner.accountId),
      subject: `New message from Genesis: ${subject}`,
      text: `${viewer.name ?? "The Genesis team"} wrote:\n\n${body}\n\nReply in your portal: ${appUrl(projectId ? `/portal/projects/${projectId}` : `/portal/requests/${requestId}`)}`,
    });
  }
  done();
  return ok(internal ? "Note added." : "Sent to the client.");
}

// --- Requests ---------------------------------------------------------------------

export async function updateRequest(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff();
  const id = text(form, "id");
  if (!id) return fail("Missing request.");
  const status = oneOf(text(form, "status"), Object.keys(REQUEST_STATUS) as RequestStatus[]) as RequestStatus | null;
  const prisma = getPrisma();
  const before = await prisma.request.findUnique({ where: { id } });
  if (!before) return fail("That request no longer exists.");
  const updated = await prisma.request.update({
    where: { id },
    data: {
      ...(status ? { status, closedAt: status === "DONE" || status === "DECLINED" ? new Date() : null } : {}),
      assigneeId: text(form, "assigneeId"),
      projectId: text(form, "projectId"),
      priority: (oneOf(text(form, "priority"), ["LOW", "NORMAL", "HIGH"] as const) ?? before.priority) as Priority,
    },
  });
  if (status && status !== before.status && (status === "DONE" || status === "DECLINED")) {
    await queueEmail({
      kind: "request_closed",
      to: await accountEmails(updated.accountId),
      subject: `${requestRef(updated.number)} ${status === "DONE" ? "is done" : "was closed"}: ${updated.title}`,
      text: `Your request "${updated.title}" is ${status === "DONE" ? "done" : "closed"}.\n\n${appUrl(`/portal/requests/${id}`)}`,
    });
  }
  await queueSheet("requests", id);
  done();
  return ok("Saved.");
}

/** A request becomes a project of its own (a new brief that is a new piece of work). */
export async function requestToProject(form: FormData) {
  const viewer = await requireStaff("delivery");
  const id = text(form, "id");
  const division = oneOf(text(form, "division"), DIVISIONS);
  if (!id || !division) return;
  const prisma = getPrisma();
  const r = await prisma.request.findUnique({ where: { id } });
  if (!r) return;
  const project = await openProject({ accountId: r.accountId, name: r.title, division, productName: r.title, brief: r.body, managerId: viewer.id, why: `Opened from ${requestRef(r.number)}.`, actorId: viewer.id });
  await prisma.request.update({ where: { id }, data: { projectId: project.id, status: "IN_PROGRESS" } });
  await queueSheet("requests", id);
  done();
  redirect(`/admin/projects/${project.id}`);
}

// --- Tasks ------------------------------------------------------------------------

export async function createTask(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const title = text(form, "title", 200);
  if (!title) return fail("Add a title.");
  const task = await getPrisma().task.create({
    data: {
      title,
      details: text(form, "details"),
      links: links(form, "links"),
      priority: (oneOf(text(form, "priority"), ["LOW", "NORMAL", "HIGH"] as const) ?? "NORMAL") as Priority,
      dueDate: day(form, "dueDate"),
      ownerId: text(form, "ownerId") ?? viewer.id,
      leadId: text(form, "leadId"),
      accountId: text(form, "accountId"),
      projectId: text(form, "projectId"),
      createdById: viewer.id,
    },
  });
  await notifyAssignee(task.id, viewer.id);
  done();
  return ok(task.ownerId && task.ownerId !== viewer.id ? "Task assigned and emailed." : "Task added.");
}

/** Reassign, reschedule or reprioritise a task; a new owner is emailed. */
export async function updateTask(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const id = text(form, "id");
  if (!id) return fail("Missing task.");
  const prisma = getPrisma();
  const before = await prisma.task.findUnique({ where: { id } });
  if (!before) return fail("That task no longer exists.");
  /* Your own tasks, or ones you gave out; super admins any. */
  if (!isSuperAdmin(viewer) && before.ownerId !== viewer.id && before.createdById !== viewer.id) return fail("That task isn't yours.");
  const ownerId = text(form, "ownerId");
  await prisma.task.update({
    where: { id },
    data: {
      title: text(form, "title", 200) ?? before.title,
      details: text(form, "details"),
      ...(form.has("links") ? { links: links(form, "links") } : {}),
      ownerId,
      dueDate: day(form, "dueDate"),
      priority: (oneOf(text(form, "priority"), ["LOW", "NORMAL", "HIGH"] as const) ?? before.priority) as Priority,
    },
  });
  if (ownerId && ownerId !== before.ownerId) await notifyAssignee(id, viewer.id);
  done();
  return ok("Saved.");
}

/** "You've got a task": to the assignee, unless they assigned it to themselves. */
async function notifyAssignee(taskId: string, assignerId: string) {
  const prisma = getPrisma();
  const t = await prisma.task.findUnique({ where: { id: taskId }, include: { owner: true, lead: true, project: true, account: true } });
  if (!t?.owner?.email || t.ownerId === assignerId) return;
  const assigner = await prisma.user.findUnique({ where: { id: assignerId }, select: { name: true, email: true } });
  const about = t.project ? `Project: ${t.project.name}` : t.lead ? `Lead: ${t.lead.name}` : t.account ? `Client: ${t.account.name}` : "";
  await queueEmail({
    kind: "task_assigned",
    to: [t.owner.email],
    subject: `${t.priority === "HIGH" ? "[High] " : ""}New task: ${t.title}`,
    text: [
      `${assigner?.name ?? assigner?.email ?? "Someone"} assigned you a task in the Genesis CRM.`,
      "",
      t.title,
      t.details ?? "",
      about,
      t.dueDate ? `Due: ${t.dueDate.toISOString().slice(0, 10)}` : "",
      "",
      `Your tasks: ${appUrl("/admin/tasks")}`,
    ]
      .filter((l, i, all) => l !== "" || all[i - 1] !== "")
      .join("\n"),
    dedupeKey: `task-assigned:${t.id}:${t.ownerId}`,
  });
}

export async function toggleTask(form: FormData) {
  await requireStaff();
  const id = text(form, "id");
  if (!id) return;
  const t = await getPrisma().task.findUnique({ where: { id } });
  if (!t) return;
  await getPrisma().task.update({ where: { id }, data: t.status === "OPEN" ? { status: "DONE", completedAt: new Date() } : { status: "OPEN", completedAt: null } });
  done();
}

// --- Vendors ----------------------------------------------------------------------

export async function assignVendor(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("delivery");
  const projectId = text(form, "projectId");
  const vendorId = text(form, "vendorId");
  const role = text(form, "role", 120);
  if (!projectId || !vendorId || !role) return fail("Choose a vendor and what they'll do.");
  const prisma = getPrisma();
  const assignment = await prisma.vendorAssignment.create({
    data: { projectId, vendorId, role, brief: text(form, "brief"), feePaise: toPaise(form.get("fee")) ?? 0, dueDate: day(form, "dueDate"), createdById: viewer.id },
    include: { project: true },
  });
  await queueEmail({
    kind: "vendor_offer",
    to: await accountEmails(vendorId),
    subject: `New work from Genesis: ${role}`,
    text: `We'd like you on ${assignment.project.name} as ${role}${assignment.feePaise ? `, for ${money(assignment.feePaise)}` : ""}${assignment.dueDate ? `, due ${assignment.dueDate.toISOString().slice(0, 10)}` : ""}.\n\n${assignment.brief ?? ""}\n\nAccept or decline in your portal: ${appUrl("/portal/work")}`,
  });
  done();
  return ok("Offered to the vendor.");
}

export async function setAssignmentStatus(form: FormData) {
  await requireStaff("delivery");
  const id = text(form, "id");
  const status = oneOf(text(form, "status"), ["OFFERED", "ACCEPTED", "DECLINED", "SUBMITTED", "APPROVED", "PAID", "CANCELLED"] as const) as AssignmentStatus | null;
  if (!id || !status) return;
  await getPrisma().vendorAssignment.update({ where: { id }, data: { status } });
  done();
}

// --- Influencer database ------------------------------------------------------------

const PLATFORMS = ["INSTAGRAM", "YOUTUBE", "LINKEDIN", "X", "FACEBOOK", "MOJ", "JOSH", "SNAPCHAT", "OTHER"] as const;
const TIERS = ["NANO", "MICRO", "MID", "MACRO", "MEGA", "CELEBRITY"] as const;
const list = (form: FormData, name: string) => (text(form, name, 600) ?? "").split(",").map((t) => t.trim()).filter(Boolean);

function creatorData(form: FormData) {
  const followers = Math.max(0, Number(String(form.get("followers") ?? "").replace(/[,\s]/g, "")) || 0);
  const er = Number(form.get("engagementRate"));
  return {
    name: text(form, "name", 120)!,
    handle: text(form, "handle", 80)!.replace(/^@/, "").toLowerCase(),
    platform: (oneOf(text(form, "platform"), PLATFORMS) ?? "INSTAGRAM") as Platform,
    profileUrl: text(form, "profileUrl", 300),
    followers,
    avgViews: Number(String(form.get("avgViews") ?? "").replace(/[,\s]/g, "")) || null,
    engagementRate: Number.isFinite(er) && er > 0 ? er : null,
    tier: (oneOf(text(form, "tier"), TIERS) ?? tierFor(followers)) as CreatorTier,
    niches: list(form, "niches"),
    languages: list(form, "languages"),
    city: text(form, "city", 80),
    gender: text(form, "gender", 40),
    reelRatePaise: toPaise(form.get("reelRate")),
    storyRatePaise: toPaise(form.get("storyRate")),
    postRatePaise: toPaise(form.get("postRate")),
    dlRatePaise: toPaise(form.get("dlRate")),
    youtubeUrl: text(form, "youtubeUrl", 300),
    email: text(form, "email", 200)?.toLowerCase() ?? null,
    phone: text(form, "phone", 30),
    managedBy: text(form, "managedBy", 160),
    notes: text(form, "notes"),
    tags: list(form, "tags"),
    blacklisted: form.get("blacklisted") === "on",
  };
}

export async function saveCreator(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff("delivery");
  if (!text(form, "name") || !text(form, "handle")) return fail("Add a name and a handle.");
  const id = text(form, "id");
  const data = creatorData(form);
  try {
    const creator = id ? await getPrisma().creator.update({ where: { id }, data }) : await getPrisma().creator.create({ data });
    done();
    if (!id) redirect(`/admin/creators/${creator.id}`);
    return ok("Saved.");
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return fail(`@${data.handle} on ${data.platform.toLowerCase()} is already in the database.`);
    throw error;
  }
}

/** Shortlist creators onto an Influence campaign. */
export async function addCampaignCreators(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff("delivery");
  const projectId = text(form, "projectId");
  const ids = form.getAll("creatorId").map(String).filter(Boolean);
  if (!projectId || ids.length === 0) return fail("Pick at least one creator.");
  const prisma = getPrisma();
  for (const creatorId of ids) {
    await prisma.campaignCreator.upsert({ where: { projectId_creatorId: { projectId, creatorId } }, create: { projectId, creatorId }, update: {} });
  }
  done();
  return ok(`${ids.length} shortlisted.`);
}

export async function updateCampaignCreator(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff("delivery");
  const id = text(form, "id");
  if (!id) return fail("Missing creator.");
  const status = oneOf(text(form, "status"), Object.keys(CAMPAIGN_CREATOR_STATUS) as CampaignCreatorStatus[]) as CampaignCreatorStatus | null;
  const n = (name: string) => Number(String(form.get(name) ?? "").replace(/[,\s]/g, "")) || null;
  await getPrisma().campaignCreator.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      feePaise: toPaise(form.get("fee")),
      deliverables: text(form, "deliverables", 300),
      postUrl: text(form, "postUrl", 500),
      views: n("views"),
      likes: n("likes"),
      comments: n("comments"),
      shares: n("shares"),
      saves: n("saves"),
      reach: n("reach"),
      postedAt: day(form, "postedAt"),
      clientVisible: form.get("clientVisible") === "on",
      notes: text(form, "notes"),
    },
  });
  done();
  return ok("Saved.");
}

/** The campaign report's summary, and whether the client sees it in their portal. */
export async function saveReport(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("delivery");
  const id = text(form, "projectId");
  if (!id) return fail("Missing project.");
  const shared = form.get("shared") === "on";
  const p = await getPrisma().project.update({ where: { id }, data: { reportSummary: text(form, "summary", 8000), reportShared: shared } });
  if (shared && form.get("notify") === "on") {
    await queueEmail({
      kind: "report_shared",
      to: await accountEmails(p.accountId),
      subject: `Your campaign report: ${p.name}`,
      text: `The latest report for ${p.name} is ready: live posts, views, engagement and what it cost.\n\n${appUrl(`/portal/projects/${id}/report`)}`,
    });
  }
  await getPrisma().activity.create({ data: { projectId: id, kind: "SYSTEM", actorId: viewer.id, body: shared ? "Campaign report shared with the client." : "Campaign report updated." } });
  done();
  return ok(shared ? "Saved and shared with the client." : "Saved.");
}
