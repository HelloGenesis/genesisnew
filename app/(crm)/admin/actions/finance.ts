"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { CommissionStatus, StaffRoleKind, VendorInvoiceStatus } from "@/lib/generated/prisma/enums";
import { money } from "@/lib/crm/catalog";
import { type ActionState, fail, isEmail, ok, text } from "@/lib/crm/form-state";
import { accountEmails, appUrl, queueEmail } from "@/lib/crm/notify";
import { disconnectDrive } from "@/lib/crm/drive";
import { fulfil } from "@/lib/crm/orders";
import { queueSheet } from "@/lib/crm/sheets";
import { AREAS, isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { RazorpayError, razorpay, razorpayKeys } from "@/lib/razorpay";

/** Money and people: subscriptions, manual payments, commissions, vendor invoices, staff roles. */

const done = () => revalidatePath("/admin", "layout");

/** Cancel a plan on Razorpay — at the end of the paid cycle, or now. */
export async function cancelSubscription(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  const now = form.get("when") === "now";
  if (!id) return fail("Missing subscription.");
  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) return fail("That subscription no longer exists.");
  if (!razorpayKeys()) return fail("Razorpay keys aren't set.");
  try {
    await razorpay(`subscriptions/${sub.razorpayId}/cancel`, { cancel_at_cycle_end: now ? 0 : 1 });
  } catch (error) {
    return fail(error instanceof RazorpayError ? `Razorpay refused: ${error.body.slice(0, 120)}` : "Razorpay couldn't be reached.");
  }
  await prisma.subscription.update({ where: { id }, data: { cancelRequestedAt: new Date(), ...(now ? { status: "CANCELLED", cancelledAt: new Date() } : {}) } });
  await recordAuditLog({ action: "subscription.cancelled", entity: "subscription", entityId: id, actorId: viewer.id, metadata: { now } });
  done();
  return ok(now ? "Cancelled." : "Cancels at the end of the paid cycle.");
}

/** An order paid outside Razorpay (bank transfer, cheque): mark it paid and open its work. */
export async function markOrderPaid(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  const ref = text(form, "paymentRef", 120);
  if (!id || !ref) return fail("Add the bank or UTR reference.");
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.status === "PAID") return fail("Already paid.");
  await prisma.order.update({ where: { id }, data: { status: "PAID", paidAt: new Date(), razorpayPaymentId: null, notes: [order.notes, `Paid offline: ${ref}`].filter(Boolean).join("\n") } });
  await fulfil(id, { id: `manual_${ref.replace(/\W+/g, "_")}`, amount: order.totalPaise, method: "bank transfer" });
  await recordAuditLog({ action: "order.marked_paid", entity: "order", entityId: id, actorId: viewer.id, metadata: { ref } });
  done();
  return ok("Marked paid. The client's projects are open.");
}

export async function cancelOrder(form: FormData) {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  if (!id) return;
  await getPrisma().order.updateMany({ where: { id, status: "PENDING" }, data: { status: "CANCELLED" } });
  await queueSheet("orders", id);
  await recordAuditLog({ action: "order.cancelled", entity: "order", entityId: id, actorId: viewer.id });
  done();
}

export async function setCommissionStatus(form: FormData) {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  const status = text(form, "status") as CommissionStatus | null;
  if (!id || !status || !["DUE", "APPROVED", "PAID", "VOID"].includes(status)) return;
  const c = await getPrisma().commission.update({ where: { id }, data: { status, paidAt: status === "PAID" ? new Date() : null } });
  if (status === "PAID") {
    await queueEmail({ kind: "commission_paid", to: await accountEmails(c.partnerId), subject: `Commission paid: ${money(c.amountPaise)}`, text: `We've paid your commission of ${money(c.amountPaise)}.\n\n${appUrl("/portal/referrals")}` });
  }
  await recordAuditLog({ action: "commission.status", entity: "commission", entityId: id, actorId: viewer.id, metadata: { status } });
  done();
}

export async function setVendorInvoiceStatus(form: FormData) {
  const viewer = await requireStaff("finance");
  const id = text(form, "id");
  const status = text(form, "status") as VendorInvoiceStatus | null;
  if (!id || !status || !["SUBMITTED", "APPROVED", "PAID", "REJECTED"].includes(status)) return;
  const prisma = getPrisma();
  const invoice = await prisma.vendorInvoice.update({ where: { id }, data: { status, decidedById: viewer.id, paidAt: status === "PAID" ? new Date() : null } });
  if (status === "PAID" && invoice.assignmentId) await prisma.vendorAssignment.update({ where: { id: invoice.assignmentId }, data: { status: "PAID" } });
  if (status !== "SUBMITTED") {
    await queueEmail({
      kind: "vendor_invoice_status",
      to: await accountEmails(invoice.vendorId),
      subject: `Invoice ${invoice.number}: ${status === "PAID" ? "paid" : status === "APPROVED" ? "approved" : "needs a fix"}`,
      text: `Your invoice ${invoice.number} for ${money(invoice.amountPaise + invoice.taxPaise)} is ${status.toLowerCase()}.${status === "REJECTED" ? " Reply to this email and we'll tell you what to change." : ""}\n\n${appUrl("/portal/invoices")}`,
    });
  }
  await recordAuditLog({ action: "vendor_invoice.status", entity: "vendor_invoice", entityId: id, actorId: viewer.id, metadata: { status } });
  done();
}

// --- Staff (owners only) -------------------------------------------------------------

const ROLES: StaffRoleKind[] = ["OWNER", "ADMIN", "SALES", "PRODUCER", "FINANCE"];

/** A role for an email: granted now if that person has a verified sign-in, otherwise the moment they do. */
export async function inviteStaff(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("staff");
  const email = text(form, "email")?.toLowerCase() ?? null;
  const role = text(form, "role") as StaffRoleKind | null;
  if (!isEmail(email) || !role || !ROLES.includes(role)) return fail("Enter an email and choose a role.");
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({ where: { email, emailVerified: true } });
  if (user) {
    await prisma.staffRole.upsert({ where: { userId_role: { userId: user.id, role } }, create: { userId: user.id, role, grantedById: viewer.id }, update: {} });
  } else {
    await prisma.staffInvite.upsert({ where: { email_role: { email, role } }, create: { email, role, invitedById: viewer.id }, update: {} });
  }
  await queueEmail({
    kind: "staff_invite",
    to: [email],
    subject: "You've been added to the Genesis CRM",
    text: `${viewer.name ?? "An owner"} gave you ${role.toLowerCase()} access to the Genesis CRM.\n\nSign in with this email (Google, or a one-time code). The first time, you'll set up an authenticator app for two-factor:\n${appUrl("/login?next=/admin")}`,
  });
  await recordAuditLog({ action: "staff.invited", entity: "user", entityId: user?.id, actorId: viewer.id, metadata: { email, role } });
  done();
  return ok(user ? `${email} is now ${role.toLowerCase()}.` : `Invite saved: ${email} gets ${role.toLowerCase()} on first sign-in.`);
}

export async function revokeStaff(form: FormData) {
  const viewer = await requireStaff("staff");
  const userId = text(form, "userId");
  const email = text(form, "email");
  const role = text(form, "role") as StaffRoleKind | null;
  if (!role) return;
  const prisma = getPrisma();
  if (userId) {
    /* Never the last owner. */
    if (role === "OWNER" && (await prisma.staffRole.count({ where: { role: "OWNER" } })) <= 1) return;
    await prisma.staffRole.delete({ where: { userId_role: { userId, role } } }).catch(() => undefined);
  }
  if (email) await prisma.staffInvite.delete({ where: { email_role: { email, role } } }).catch(() => undefined);
  await recordAuditLog({ action: "staff.revoked", entity: "user", entityId: userId ?? undefined, actorId: viewer.id, metadata: { email, role } });
  done();
}

/** Re-queue a failed email (Integrations page). */
export async function retryEmail(form: FormData) {
  await requireStaff();
  const id = text(form, "id");
  if (!id) return;
  await getPrisma().emailOutbox.update({ where: { id }, data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date() } });
  done();
}

/** Owners: forget the Google Drive connection (files already uploaded stay in the Drive). */
export async function disconnectGoogleDrive() {
  const viewer = await requireStaff("staff");
  await disconnectDrive();
  await recordAuditLog({ action: "drive.disconnected", entity: "settings", actorId: viewer.id });
  done();
}

/** Owners: clear someone's authenticator, so their next sign-in shows a fresh QR code (lost or new phone). */
export async function resetTwoFactor(form: FormData) {
  const viewer = await requireStaff("staff");
  const userId = text(form, "userId");
  if (!userId) return;
  await getPrisma().staffTotp.deleteMany({ where: { userId } });
  await recordAuditLog({ action: "staff.two_factor_reset", entity: "user", entityId: userId, actorId: viewer.id });
  done();
}

/** A staff member's name and job title, as the dashboard greets them. */
export async function setStaffProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("staff");
  const userId = text(form, "userId");
  if (!userId) return fail("Pick someone.");
  await getPrisma().user.update({ where: { id: userId }, data: { name: text(form, "name", 80), title: text(form, "title", 80) } });
  await recordAuditLog({ action: "staff.profile", entity: "user", entityId: userId, actorId: viewer.id });
  done();
  return ok("Saved.");
}

/** What a person sees beyond their own records (lib/crm/scope): super admins decide. */
export async function setGrants(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("staff");
  if (!isSuperAdmin(viewer)) return fail("Only super admins can change this.");
  const userId = text(form, "userId");
  if (!userId) return fail("Pick someone.");
  const grants = form.getAll("grants").map(String).filter((g) => g in AREAS);
  await getPrisma().user.update({ where: { id: userId }, data: { grants } });
  await recordAuditLog({ action: "staff.grants", entity: "user", entityId: userId, actorId: viewer.id, metadata: { grants } });
  done();
  return ok(grants.length ? `Now sees: ${grants.map((g) => AREAS[g]).join(", ")}.` : "Sees only their own records.");
}
