"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditLog } from "@/lib/audit";
import { decideDeliverable } from "@/lib/crm/review-links";
import { getPrisma } from "@/lib/db";
import type { MemberRole, RequestKind } from "@/lib/generated/prisma/enums";
import { REQUEST_KIND, money, projectRef, requestRef, toPaise } from "@/lib/crm/catalog";
import { type ActionState, fail, isEmail, links, ok, text } from "@/lib/crm/form-state";
import { appUrl, queueEmail, queueStaffEmail } from "@/lib/crm/notify";
import { queueSheet } from "@/lib/crm/sheets";
import { portalAccountCookie, requirePortal } from "@/lib/crm/session";

/**
 * THE PORTAL'S ACTIONS — clients, agencies and vendors.
 *
 * Every one starts from the signed-in person and the accounts they may open
 * (their memberships, plus an agency's brands), and checks that the thing
 * being changed belongs to one of those accounts. An id from the form is
 * never trusted on its own.
 */

const done = () => revalidatePath("/portal", "layout");

async function context() {
  const { viewer, accounts, account } = await requirePortal();
  const allowed = new Set(accounts.map((a) => a.id));
  return { viewer, account, accounts, allowed };
}

export async function switchAccount(form: FormData) {
  const { allowed } = await context();
  const id = text(form, "accountId");
  if (id && allowed.has(id)) (await cookies()).set(portalAccountCookie.name, id, portalAccountCookie.options);
  redirect("/portal");
}

// --- Reviews and messages ---------------------------------------------------------

export async function reviewDeliverable(_: ActionState, form: FormData): Promise<ActionState> {
  const { viewer, allowed } = await context();
  const id = text(form, "id");
  const decision = text(form, "decision");
  const feedback = text(form, "feedback");
  if (!id || (decision !== "approve" && decision !== "changes")) return fail("Choose approve or request changes.");
  if (decision === "changes" && !feedback) return fail("Tell us what to change, in one consolidated note.");
  const d = await getPrisma().deliverable.findUnique({ where: { id }, include: { project: true } });
  if (!d || !allowed.has(d.project.accountId) || d.status !== "IN_REVIEW") return fail("This isn't waiting for your review any more.");
  /* The same decision as from the email's page (lib/crm/review-links). */
  await decideDeliverable({ id, decision, feedback: feedback ?? null, by: viewer.name ?? viewer.email ?? "The client", userId: viewer.id });
  done();
  return ok(decision === "approve" ? "Approved. Thank you!" : "Sent to the team.");
}

export async function postClientMessage(_: ActionState, form: FormData): Promise<ActionState> {
  const { viewer, allowed } = await context();
  const body = text(form, "body");
  if (!body) return fail("Write a message first.");
  const prisma = getPrisma();
  const projectId = text(form, "projectId");
  const requestId = text(form, "requestId");
  const target = projectId
    ? await prisma.project.findUnique({ where: { id: projectId }, select: { accountId: true, name: true, number: true, managerId: true } })
    : requestId
      ? await prisma.request.findUnique({ where: { id: requestId }, select: { accountId: true, title: true, number: true, assigneeId: true } })
      : null;
  if (!target || !allowed.has(target.accountId)) return fail("You can't post here.");
  await prisma.message.create({ data: { accountId: target.accountId, projectId, requestId, authorId: viewer.id, body, links: links(form, "links") } });
  if (requestId) await prisma.request.updateMany({ where: { id: requestId, status: "WAITING_ON_CLIENT" }, data: { status: "OPEN" } });
  const label = "name" in target ? `${projectRef(target.number)} · ${target.name}` : `${requestRef(target.number)} · ${target.title}`;
  await queueStaffEmail({
    kind: "client_message",
    scope: "producers",
    subject: `Client message: ${label}`,
    text: `${viewer.name ?? viewer.email} wrote:\n\n${body}\n\n${appUrl(projectId ? `/admin/projects/${projectId}` : `/admin/requests/${requestId}`)}`,
  });
  done();
  return ok("Sent.");
}

// --- Requests ---------------------------------------------------------------------

const KINDS = Object.keys(REQUEST_KIND) as RequestKind[];

export async function createRequest(_: ActionState, form: FormData): Promise<ActionState> {
  const { viewer, account, allowed } = await context();
  const title = text(form, "title", 200);
  const body = text(form, "body", 8000);
  const kind = KINDS.find((k) => k === text(form, "kind")) ?? "NEW_BRIEF";
  if (!title || !body) return fail("Add a title and tell us what you need.");
  const projectId = text(form, "projectId");
  const prisma = getPrisma();
  if (projectId) {
    const p = await prisma.project.findUnique({ where: { id: projectId }, select: { accountId: true } });
    if (!p || !allowed.has(p.accountId)) return fail("Choose one of your projects.");
  }
  const request = await prisma.request.create({ data: { accountId: account.id, projectId, kind, title, body, links: links(form, "links"), createdById: viewer.id } });
  await queueSheet("requests", request.id);
  await queueStaffEmail({
    kind: "request_new",
    scope: kind === "BILLING" || kind === "CANCELLATION" ? "finance" : "all",
    subject: `${REQUEST_KIND[kind]} from ${account.name}: ${title}`,
    text: `${viewer.name ?? viewer.email} (${account.name}) sent a ${REQUEST_KIND[kind].toLowerCase()}:\n\n${title}\n\n${body}\n\n${appUrl(`/admin/requests/${request.id}`)}`,
    dedupeKey: `request-new:${request.id}`,
  });
  await queueEmail({
    kind: "request_received",
    to: [viewer.email],
    subject: `We've got it: ${requestRef(request.number)} · ${title}`,
    text: `Thanks. Your ${REQUEST_KIND[kind].toLowerCase()} is with the team, and we reply within one working day.\n\n${appUrl(`/portal/requests/${request.id}`)}`,
  });
  redirect(`/portal/requests/${request.id}`);
}

// --- Team ------------------------------------------------------------------------

export async function inviteTeammate(_: ActionState, form: FormData): Promise<ActionState> {
  const { viewer, account } = await context();
  if (account.role !== "OWNER") return fail("Only an account owner can add people.");
  const email = text(form, "email")?.toLowerCase() ?? null;
  if (!isEmail(email)) return fail("Enter a valid email.");
  const role = (["OWNER", "MEMBER", "BILLING"].find((r) => r === text(form, "role")) ?? "MEMBER") as MemberRole;
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({ where: { email, emailVerified: true } });
  if (user) await prisma.accountMember.upsert({ where: { accountId_userId: { accountId: account.id, userId: user.id } }, create: { accountId: account.id, userId: user.id, role }, update: { role } });
  else await prisma.accountInvite.upsert({ where: { accountId_email: { accountId: account.id, email } }, create: { accountId: account.id, email, role, invitedById: viewer.id }, update: { role } });
  await queueEmail({
    kind: "portal_invite",
    to: [email],
    subject: `${viewer.name ?? viewer.email} added you to ${account.name} on Genesis`,
    text: `You now have access to ${account.name}'s projects, reviews and invoices on Genesis Media's portal.\n\nSign in with this email. We'll send a one-time code, no password needed:\n${appUrl("/login?next=/portal")}`,
  });
  await recordAuditLog({ action: "portal.teammate_invited", entity: "account", entityId: account.id, actorId: viewer.id, metadata: { email, role } });
  done();
  return ok(`${email} can now sign in.`);
}

export async function removeTeammate(form: FormData) {
  const { viewer, account } = await context();
  if (account.role !== "OWNER") return;
  const userId = text(form, "userId");
  const inviteId = text(form, "inviteId");
  const prisma = getPrisma();
  if (userId && userId !== viewer.id) await prisma.accountMember.deleteMany({ where: { accountId: account.id, userId } });
  if (inviteId) await prisma.accountInvite.deleteMany({ where: { id: inviteId, accountId: account.id } });
  done();
}

/** An agency adds a brand it buys for; the brand appears in the agency team's portal. */
export async function addBrand(_: ActionState, form: FormData): Promise<ActionState> {
  const { viewer, account } = await context();
  if (account.kind !== "AGENCY") return fail("Only agencies can add brands.");
  const name = text(form, "name", 160);
  if (!name) return fail("Add the brand's name.");
  const prisma = getPrisma();
  const parent = await prisma.account.findUnique({ where: { id: account.id }, select: { managerId: true, isReseller: true } });
  const brand = await prisma.account.create({
    data: { name, parentId: account.id, website: text(form, "website", 200), industry: text(form, "industry", 120), status: "PROSPECT", managerId: parent?.managerId, referredById: parent?.isReseller ? account.id : null },
  });
  await queueSheet("accounts", brand.id);
  await queueStaffEmail({ kind: "agency_brand", scope: "sales", subject: `${account.name} added a brand: ${name}`, text: `${viewer.name ?? viewer.email} added ${name} under ${account.name}.\n\n${appUrl(`/admin/accounts/${brand.id}`)}` });
  done();
  return ok(`${name} added. Switch to it from the account menu to send its first brief.`);
}

// --- Vendors ---------------------------------------------------------------------

export async function respondAssignment(form: FormData) {
  const { viewer, allowed } = await context();
  const id = text(form, "id");
  const answer = text(form, "answer");
  if (!id || (answer !== "ACCEPTED" && answer !== "DECLINED")) return;
  const prisma = getPrisma();
  const a = await prisma.vendorAssignment.findUnique({ where: { id }, include: { project: true, vendor: true } });
  if (!a || !allowed.has(a.vendorId) || a.status !== "OFFERED") return;
  await prisma.vendorAssignment.update({ where: { id }, data: { status: answer } });
  await prisma.activity.create({ data: { projectId: a.projectId, kind: "SYSTEM", actorId: viewer.id, body: `${a.vendor.name} ${answer === "ACCEPTED" ? "accepted" : "declined"} ${a.role}.` } });
  await queueStaffEmail({ kind: "vendor_response", scope: "producers", subject: `${a.vendor.name} ${answer === "ACCEPTED" ? "accepted" : "declined"}: ${a.role} · ${a.project.name}`, text: appUrl(`/admin/projects/${a.projectId}`) });
  done();
}

export async function submitVendorWork(_: ActionState, form: FormData): Promise<ActionState> {
  const { viewer, allowed } = await context();
  const id = text(form, "assignmentId");
  const title = text(form, "title", 200);
  const url = text(form, "url", 1000);
  if (!id || !title || !url || !/^https?:\/\//i.test(url)) return fail("Add a title and a link to the files.");
  const prisma = getPrisma();
  const a = await prisma.vendorAssignment.findUnique({ where: { id }, include: { project: true, vendor: true } });
  if (!a || !allowed.has(a.vendorId) || !["ACCEPTED", "SUBMITTED"].includes(a.status)) return fail("This assignment isn't open for delivery.");
  const previous = await prisma.deliverable.findFirst({ where: { projectId: a.projectId, title }, orderBy: { version: "desc" } });
  /* A draft: Genesis reviews it before the client ever sees it. */
  await prisma.deliverable.create({ data: { projectId: a.projectId, title, url, assignmentId: id, version: (previous?.version ?? 0) + 1, status: "DRAFT", submittedById: viewer.id } });
  await prisma.vendorAssignment.update({ where: { id }, data: { status: "SUBMITTED" } });
  await queueStaffEmail({ kind: "vendor_submitted", scope: "producers", subject: `${a.vendor.name} delivered: ${title} · ${a.project.name}`, text: `Review it before sending to the client:\n${appUrl(`/admin/projects/${a.projectId}`)}` });
  done();
  return ok("Delivered. The team will review it.");
}

export async function submitVendorInvoice(_: ActionState, form: FormData): Promise<ActionState> {
  const { viewer, account, allowed } = await context();
  if (account.kind !== "VENDOR") return fail("Only vendor accounts submit invoices.");
  const number = text(form, "number", 60);
  const amount = toPaise(form.get("amount"));
  if (!number || !amount) return fail("Add your invoice number and amount.");
  const assignmentId = text(form, "assignmentId");
  const prisma = getPrisma();
  if (assignmentId) {
    const a = await prisma.vendorAssignment.findUnique({ where: { id: assignmentId }, select: { vendorId: true } });
    if (!a || !allowed.has(a.vendorId)) return fail("Choose one of your jobs.");
  }
  try {
    await prisma.vendorInvoice.create({
      data: { vendorId: account.id, assignmentId, number, amountPaise: amount, taxPaise: toPaise(form.get("tax")) ?? 0, fileUrl: text(form, "fileUrl", 1000), note: text(form, "note", 500), submittedById: viewer.id },
    });
  } catch {
    return fail(`You've already submitted invoice ${number}.`);
  }
  await queueStaffEmail({ kind: "vendor_invoice", scope: "finance", subject: `Vendor invoice ${number} · ${account.name} · ${money(amount)}`, text: appUrl("/admin/payouts") });
  done();
  return ok("Invoice submitted.");
}

export async function saveVendorProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const { account } = await context();
  if (account.kind !== "VENDOR") return fail("Not a vendor account.");
  await getPrisma().account.update({
    where: { id: account.id },
    data: {
      vendorSkills: (text(form, "skills", 400) ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      vendorRateNote: text(form, "rates", 400),
      payoutNote: text(form, "payout", 400),
      phone: text(form, "phone", 30),
      gstin: text(form, "gstin", 20)?.toUpperCase() ?? null,
    },
  });
  done();
  return ok("Saved.");
}

