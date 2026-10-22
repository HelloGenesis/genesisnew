"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import type { AccountKind, AccountStatus, ActivityKind, Division, LeadSource, LeadStatus, MemberRole } from "@/lib/generated/prisma/enums";
import { DIVISIONS, LEAD_SOURCE, LEAD_STATUS, money, toPaise } from "@/lib/crm/catalog";
import { type ActionState, day, fail, isEmail, ok, text } from "@/lib/crm/form-state";
import { appUrl, queueEmail } from "@/lib/crm/notify";
import { queueSheet } from "@/lib/crm/sheets";
import { winLead } from "@/lib/crm/projects";
import { leadScope } from "@/lib/crm/scope";
import { requireStaff, type Viewer } from "@/lib/crm/session";
import { notes, razorpay, razorpayKeys } from "@/lib/razorpay";

/** Server actions for leads, accounts and portal access. Every one re-checks the caller's role. */

const done = () => revalidatePath("/admin", "layout");
const oneOf = <T extends string>(value: string | null, list: readonly T[]): T | null => (value && (list as readonly string[]).includes(value) ? (value as T) : null);

const LEAD_STATUSES = Object.keys(LEAD_STATUS) as LeadStatus[];
const LEAD_SOURCES = Object.keys(LEAD_SOURCE) as LeadSource[];

/** A lead this person may change: their own, or any for a super admin (lib/crm/scope). */
const mayTouch = async (viewer: Viewer, id: string) => Boolean(await getPrisma().lead.findFirst({ where: { id, ...leadScope(viewer) }, select: { id: true } }));

// --- Leads ------------------------------------------------------------------------

export async function createLead(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  const name = text(form, "name", 120);
  if (!name) return fail("Add a name.");
  const email = text(form, "email", 200)?.toLowerCase() ?? null;
  if (email && !isEmail(email)) return fail("That email doesn't look right.");
  const lead = await getPrisma().lead.create({
    data: {
      name,
      email,
      phone: text(form, "phone", 30),
      company: text(form, "company", 160),
      designation: text(form, "designation", 100),
      division: oneOf(text(form, "division"), DIVISIONS),
      interest: text(form, "interest", 200),
      source: oneOf(text(form, "source"), LEAD_SOURCES) ?? "OTHER",
      valuePaise: toPaise(form.get("value")) ?? 0,
      nextFollowUp: day(form, "nextFollowUp") ?? new Date(),
      ownerId: text(form, "ownerId") ?? viewer.id,
      partnerId: text(form, "partnerId"),
      notes: text(form, "notes"),
      createdById: viewer.id,
    },
  });
  await queueSheet("leads", lead.id);
  done();
  return ok("Lead added.");
}

export async function updateLead(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  if (!id) return fail("Missing lead.");
  if (!(await mayTouch(viewer, id))) return fail("That lead isn't yours.");
  const prisma = getPrisma();
  const before = await prisma.lead.findUnique({ where: { id } });
  if (!before) return fail("That lead no longer exists.");
  const status = oneOf(text(form, "status"), LEAD_STATUSES) ?? before.status;
  const value = toPaise(form.get("value"));
  await prisma.lead.update({
    where: { id },
    data: {
      name: text(form, "name", 120) ?? before.name,
      email: text(form, "email", 200)?.toLowerCase() ?? null,
      phone: text(form, "phone", 30),
      company: text(form, "company", 160),
      designation: text(form, "designation", 100),
      division: oneOf(text(form, "division"), DIVISIONS),
      interest: text(form, "interest", 200),
      source: oneOf(text(form, "source"), LEAD_SOURCES) ?? before.source,
      status,
      valuePaise: value ?? before.valuePaise,
      ownerId: text(form, "ownerId"),
      nextFollowUp: status === "WON" || status === "LOST" ? null : day(form, "nextFollowUp"),
      lostReason: status === "LOST" ? text(form, "lostReason", 500) : null,
      notes: text(form, "notes"),
    },
  });
  if (status !== before.status) {
    await prisma.activity.create({ data: { leadId: id, kind: "STATUS", actorId: viewer.id, body: `${LEAD_STATUS[before.status].label} → ${LEAD_STATUS[status].label}` } });
    if (status === "WON") await winLead(id, viewer.id, "Lead won.");
  }
  await queueSheet("leads", id);
  done();
  return ok("Saved.");
}

/** The board's quick move: one click from one stage to the next. */
export async function moveLead(form: FormData) {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  const status = oneOf(text(form, "status"), LEAD_STATUSES);
  if (!id || !status || !(await mayTouch(viewer, id))) return;
  const prisma = getPrisma();
  const before = await prisma.lead.findUnique({ where: { id } });
  if (!before || before.status === status) return;
  await prisma.lead.update({ where: { id }, data: { status, ...(status === "WON" || status === "LOST" ? { nextFollowUp: null } : {}) } });
  await prisma.activity.create({ data: { leadId: id, kind: "STATUS", actorId: viewer.id, body: `${LEAD_STATUS[before.status].label} → ${LEAD_STATUS[status].label}` } });
  await queueSheet("leads", id);
  /* Won on the board: the client and its project open now (lib/crm/projects). */
  if (status === "WON") await winLead(id, viewer.id, "Lead won on the pipeline.");
  done();
}

export async function logActivity(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const body = text(form, "body");
  if (!body) return fail("Write something first.");
  const kind = (oneOf(text(form, "kind"), ["NOTE", "CALL", "EMAIL", "MEETING", "WHATSAPP"] as const) ?? "NOTE") as ActivityKind;
  const leadId = text(form, "leadId");
  const accountId = text(form, "accountId");
  const projectId = text(form, "projectId");
  await getPrisma().activity.create({ data: { kind, body, leadId, accountId, projectId, actorId: viewer.id } });
  /* Logging a touch on a lead pushes its follow-up, when a new date was picked. */
  const follow = day(form, "nextFollowUp");
  if (leadId && follow) await getPrisma().lead.update({ where: { id: leadId }, data: { nextFollowUp: follow } });
  done();
  return ok("Logged.");
}

export async function deleteLead(form: FormData) {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  if (!id || !(await mayTouch(viewer, id))) return;
  await getPrisma().lead.delete({ where: { id } }).catch(() => undefined);
  await queueSheet("leads", id, true);
  await recordAuditLog({ action: "lead.deleted", entity: "lead", entityId: id, actorId: viewer.id });
  done();
  redirect("/admin/leads");
}

/** Won without a website checkout (a deal closed on a call): the lead becomes a client account, its contact invited to the portal. */
export async function convertLead(form: FormData) {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  if (!id || !(await mayTouch(viewer, id))) return;
  const result = await winLead(id, viewer.id, "Lead won and converted.");
  if (!result) return;
  await getPrisma().activity.create({ data: { leadId: id, kind: "STATUS", actorId: viewer.id, body: "Won: client account and project opened." } });
  done();
  redirect(result.projectId ? `/admin/projects/${result.projectId}` : `/admin/accounts/${result.accountId}`);
}

// --- Accounts ---------------------------------------------------------------------

const KINDS = ["BRAND", "AGENCY", "VENDOR"] as const;
const STATUSES = ["PROSPECT", "ACTIVE", "PAUSED", "CHURNED"] as const;

const referralCode = () => randomBytes(4).toString("hex");

function accountData(form: FormData) {
  const reseller = form.get("isReseller") === "on";
  return {
    name: text(form, "name", 160)!,
    kind: (oneOf(text(form, "kind"), KINDS) ?? "BRAND") as AccountKind,
    status: (oneOf(text(form, "status"), STATUSES) ?? "PROSPECT") as AccountStatus,
    legalName: text(form, "legalName", 200),
    gstin: text(form, "gstin", 20)?.toUpperCase() ?? null,
    billingAddress: text(form, "billingAddress", 400),
    city: text(form, "city", 80),
    state: text(form, "state", 80),
    website: text(form, "website", 200),
    industry: text(form, "industry", 120),
    email: text(form, "email", 200)?.toLowerCase() ?? null,
    phone: text(form, "phone", 30),
    notes: text(form, "notes"),
    tags: (text(form, "tags", 400) ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    parentId: text(form, "parentId"),
    referredById: text(form, "referredById"),
    managerId: text(form, "managerId"),
    isReseller: reseller,
    commissionPercent: reseller ? Math.max(0, Math.min(50, Number(form.get("commissionPercent") ?? 0) || 0)) : 0,
    /* One value per ticked skill (the dropdown), or a comma-separated list; typed-in skills too. */
    vendorSkills: [...new Set(form.getAll("vendorSkills").flatMap((v) => String(v).split(",")).map((t) => t.trim().slice(0, 60)).filter(Boolean))].slice(0, 20),
    vendorRateNote: text(form, "vendorRateNote", 400),
    vendorCommissionPercent: (() => {
      const n = Number(text(form, "vendorCommissionPercent", 8) ?? "");
      return Number.isFinite(n) && n > 0 ? Math.min(100, Math.round(n * 100) / 100) : null;
    })(),
  };
}

export async function createAccount(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  if (!text(form, "name")) return fail("Add a name.");
  const data = accountData(form);
  const account = await getPrisma().account.create({ data: { ...data, managerId: data.managerId ?? viewer.id, referralCode: data.isReseller ? referralCode() : null } });
  const email = text(form, "inviteEmail")?.toLowerCase() ?? null;
  if (email && isEmail(email)) await invite(account.id, email, "OWNER", viewer.id, form.get("notify") === "on");
  await queueSheet("accounts", account.id);
  done();
  redirect(`/admin/accounts/${account.id}`);
}

export async function updateAccount(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff("sales");
  const id = text(form, "id");
  if (!id || !text(form, "name")) return fail("Add a name.");
  const prisma = getPrisma();
  const before = await prisma.account.findUnique({ where: { id } });
  if (!before) return fail("That account no longer exists.");
  const data = accountData(form);
  if (data.parentId === id || data.referredById === id) return fail("An account can't be its own agency or referrer.");
  await prisma.account.update({ where: { id }, data: { ...data, referralCode: data.isReseller ? (before.referralCode ?? referralCode()) : before.referralCode } });
  await queueSheet("accounts", id);
  done();
  return ok("Saved.");
}

/** Portal access for an email: added straight away when that person already has a verified sign-in, otherwise waiting for it. */
async function invite(accountId: string, email: string, role: MemberRole, by: string, notify: boolean) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({ where: { email, emailVerified: true } });
  if (user) {
    await prisma.accountMember.upsert({ where: { accountId_userId: { accountId, userId: user.id } }, create: { accountId, userId: user.id, role }, update: { role } });
  } else {
    await prisma.accountInvite.upsert({ where: { accountId_email: { accountId, email } }, create: { accountId, email, role, invitedById: by }, update: { role } });
  }
  if (notify) {
    const account = await prisma.account.findUnique({ where: { id: accountId }, select: { name: true, kind: true } });
    await queueEmail({
      kind: "portal_invite",
      to: [email],
      subject: `You're invited to the Genesis ${account?.kind === "VENDOR" ? "crew" : "client"} portal`,
      text: `You now have access to ${account?.name ?? "your account"} on Genesis Media's portal${account?.kind === "VENDOR" ? ": your assignments, briefs, deliveries and invoices" : ": projects, files to review, briefs, invoices and a direct line to the team"}.\n\nSign in with this email address. We'll send you a one-time code, no password needed:\n${appUrl("/login?next=/portal")}`,
    });
  }
}

export async function inviteMember(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  const accountId = text(form, "accountId");
  const email = text(form, "email")?.toLowerCase() ?? null;
  if (!accountId || !isEmail(email)) return fail("Enter a valid email.");
  const role = (oneOf(text(form, "role"), ["OWNER", "MEMBER", "BILLING"] as const) ?? "MEMBER") as MemberRole;
  await invite(accountId, email, role, viewer.id, form.get("notify") === "on");
  await recordAuditLog({ action: "portal.invited", entity: "account", entityId: accountId, actorId: viewer.id, metadata: { email, role } });
  done();
  return ok(`${email} has portal access.`);
}

export async function removeMember(form: FormData) {
  const viewer = await requireStaff("sales");
  const accountId = text(form, "accountId");
  const userId = text(form, "userId");
  const inviteId = text(form, "inviteId");
  const prisma = getPrisma();
  if (accountId && userId) await prisma.accountMember.delete({ where: { accountId_userId: { accountId, userId } } }).catch(() => undefined);
  if (inviteId) await prisma.accountInvite.delete({ where: { id: inviteId } }).catch(() => undefined);
  await recordAuditLog({ action: "portal.access_removed", entity: "account", entityId: accountId ?? undefined, actorId: viewer.id, metadata: { userId, inviteId } });
  done();
}

/**
 * A PAYMENT LINK FOR WORK THAT ISN'T IN THE CART — an Influence campaign, a
 * custom quote, an Enterprise plan's first invoice. Razorpay makes the link
 * and emails it; the order waits here as pending and, when Razorpay's webhook
 * says it was paid, becomes a project like any checkout (lib/crm/orders).
 */
export async function sendPaymentLink(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("sales");
  const accountId = text(form, "accountId");
  const description = text(form, "description", 200);
  const amount = toPaise(form.get("amount"));
  const division = oneOf(text(form, "division"), DIVISIONS) as Division | null;
  const withGst = form.get("gst") === "on";
  if (!accountId || !description || !amount || !division) return fail("Fill in the work, division and amount.");
  if (!razorpayKeys()) return fail("Razorpay keys aren't set, so a link can't be made.");
  const prisma = getPrisma();
  const account = await prisma.account.findUnique({ where: { id: accountId }, include: { members: { include: { user: true }, take: 1 } } });
  if (!account) return fail("That account no longer exists.");
  const contactEmail = text(form, "email")?.toLowerCase() ?? account.email ?? account.members[0]?.user.email ?? null;
  if (!isEmail(contactEmail)) return fail("This account has no email; add one to send the link.");

  const tax = withGst ? Math.round(amount * 0.18) : 0;
  const total = amount + tax;
  const reference = `GM-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`.toUpperCase();
  try {
    const link = await razorpay<{ id: string; short_url: string }>("payment_links", {
      amount: total,
      currency: "INR",
      reference_id: reference,
      description: `Genesis Media: ${description}`.slice(0, 250),
      customer: { name: account.name, email: contactEmail, ...(account.phone ? { contact: account.phone.replace(/[\s-]/g, "") } : {}) },
      notify: { sms: Boolean(account.phone), email: true },
      reminder_enable: true,
      notes: notes({ items: description, company: account.name, tax_id: account.gstin ?? undefined, raised_by: viewer.email ?? viewer.id }),
      callback_url: appUrl("/portal/billing"),
      callback_method: "get",
    });
    const order = await prisma.order.create({
      data: {
        reference,
        channel: "MANUAL",
        accountId,
        partnerId: account.referredById,
        subtotalPaise: amount,
        taxPaise: tax,
        taxLabel: withGst ? "GST 18%" : "No GST",
        totalPaise: total,
        oneTimePaise: total,
        contactName: account.name,
        contactEmail,
        contactPhone: account.phone,
        company: account.legalName ?? account.name,
        taxId: account.gstin,
        billingAddress: account.billingAddress,
        razorpayLinkId: link.id,
        createdById: viewer.id,
        lines: { create: [{ productId: `custom.${division.toLowerCase()}`, name: description, group: "Custom", division, kind: "ONE_TIME", chargePaise: amount }] },
      },
    });
    await queueSheet("orders", order.id);
    await prisma.activity.create({ data: { accountId, kind: "SYSTEM", actorId: viewer.id, body: `Payment link sent: ${description}, ${money(total)} (${reference}).` } });
    done();
    return ok(`Link sent to ${contactEmail}: ${link.short_url}`);
  } catch (error) {
    console.error("[crm] payment link failed", error);
    return fail("Razorpay couldn't make the link. Check the amount and try again.");
  }
}

/**
 * A CALL OR A FOLLOW-UP, PUT ON THE CALENDAR (Genesis, 12 Oct 2026: "book a
 * call / follow up; overall process on the calendar"). It becomes a task with
 * its date, the lead's next follow-up and a line in its timeline; the browser
 * then opens Google Calendar with the event filled in (the client as a guest),
 * one click to save.
 */
export async function planLeadEvent(form: FormData): Promise<{ ok: boolean; calendarUrl?: string; message?: string }> {
  const viewer = await requireStaff("sales");
  const id = text(form, "id");
  const kind = text(form, "kind") === "CALL" ? "CALL" : "FOLLOW_UP";
  const when = text(form, "when"); // "2026-10-14T15:30" in India time
  if (!id || !when || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)) return { ok: false, message: "Pick a date and time." };
  if (!(await mayTouch(viewer, id))) return { ok: false, message: "That lead isn't yours." };
  const prisma = getPrisma();
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id } });
  const who = lead.company ?? lead.name;
  const title = kind === "CALL" ? `Call with ${who}` : `Follow up with ${who}`;
  const day = new Date(`${when.slice(0, 10)}T00:00:00Z`);
  await prisma.$transaction([
    prisma.task.create({ data: { title, details: `${when.replace("T", " ")} IST`, priority: "NORMAL", dueDate: day, ownerId: viewer.id, leadId: id, createdById: viewer.id, links: [appUrl(`/admin/leads/${id}`)] } }),
    prisma.lead.update({ where: { id }, data: { nextFollowUp: day } }),
    prisma.activity.create({ data: { leadId: id, kind: kind === "CALL" ? "MEETING" : "NOTE", actorId: viewer.id, body: `${kind === "CALL" ? "Call booked" : "Follow-up planned"} for ${when.replace("T", " ")} IST.` } }),
  ]);
  /* Google Calendar's own "new event" page, filled in: India time, 30 minutes, the client invited. */
  const start = when.replace(/[-:]/g, "") + "00";
  const endDate = new Date(`${when}:00+05:30`);
  endDate.setMinutes(endDate.getMinutes() + 30);
  const end = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(endDate).replace(/[-: ]/g, (c) => (c === " " ? "T" : ""));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${title} · Genesis Media`,
    dates: `${start}/${end}`,
    ctz: "Asia/Kolkata",
    details: [lead.interest ? `About: ${lead.interest}` : "", `CRM: ${appUrl(`/admin/leads/${id}`)}`].filter(Boolean).join("\n"),
    ...(lead.email ? { add: lead.email } : {}),
  });
  done();
  return { ok: true, calendarUrl: `https://calendar.google.com/calendar/render?${params}` };
}
