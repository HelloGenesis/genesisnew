"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditLog } from "@/lib/audit";
import { type ActionState, fail, isEmail, ok, text } from "@/lib/crm/form-state";
import { appUrl, queueEmail } from "@/lib/crm/notify";
import { isSuperAdmin } from "@/lib/crm/scope";
import { getViewer, requireStaff } from "@/lib/crm/session";
import { VIEWING_COOKIE, type WorkspaceProfile } from "@/lib/crm/workspace";
import { getPrisma } from "@/lib/db";

/**
 * AGENCY CRMS: switching into one (owners), giving an agency its CRM (Staff &
 * roles), and an agency's own team and company details (Team & company).
 * See lib/crm/workspace.
 */

/** A Genesis owner's "Viewing" switcher: Genesis's own CRM, or an agency's. */
export async function setViewingCrm(form: FormData) {
  const viewer = await getViewer();
  if (!viewer || !isSuperAdmin(viewer) || viewer.workspaceId) return;
  const ws = text(form, "ws");
  const jar = await cookies();
  if (ws && (await getPrisma().account.findFirst({ where: { id: ws, crmWorkspace: true, workspaceId: null }, select: { id: true } }))) jar.set(VIEWING_COOKIE, ws, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  else jar.delete(VIEWING_COOKIE);
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

async function addToCrm(workspaceId: string, agencyName: string, email: string, role: "ADMIN" | "MEMBER", by: string, byName: string | null) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({ where: { email, emailVerified: true } });
  if (user) {
    /* Someone on Genesis's own team can't also be inside an agency's CRM. */
    if ((await prisma.staffRole.count({ where: { userId: user.id } })) > 0) return `${email} is on Genesis's team, so can't join an agency CRM.`;
    await prisma.user.update({ where: { id: user.id }, data: { workspaceId, workspaceRole: role } });
  } else {
    /* Claimed when that address first signs in, verified (lib/crm/session). */
    const key = `agency-invite:${email}`;
    const value = JSON.stringify({ ws: workspaceId, role });
    await prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  await queueEmail({
    kind: "agency_crm_invite",
    to: [email],
    subject: `${agencyName}: your CRM`,
    text: `${byName ?? "Genesis Media"} gave you access to ${agencyName}'s CRM${role === "ADMIN" ? " as its admin" : ""}: leads, quotes and influencer plans, invoices, projects and your own influencer list.\n\nSign in with this email (Google, or a one-time code). The first time, you'll set up an authenticator app for two-factor:\n${appUrl("/login?next=/admin")}`,
  });
  await recordAuditLog({ action: "workspace.member_added", entity: "account", entityId: workspaceId, actorId: by, metadata: { email, role } });
  return null;
}

/** Staff & roles → CRM access for an agency: the agency (an account) and its admin's email. */
export async function grantAgencyCrm(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff("staff");
  if (viewer.workspaceId) return fail("Not available here.");
  const email = text(form, "email")?.toLowerCase() ?? null;
  const accountId = text(form, "accountId");
  const newName = text(form, "agencyName", 160);
  if (!isEmail(email)) return fail("Enter the agency admin's email.");
  const prisma = getPrisma();
  const agency = accountId
    ? await prisma.account.findFirst({ where: { id: accountId, workspaceId: null } })
    : newName
      ? await prisma.account.create({ data: { name: newName, kind: "AGENCY", status: "ACTIVE", managerId: viewer.id, workspaceId: null } })
      : null;
  if (!agency) return fail("Pick the agency, or type its name.");
  await prisma.account.update({ where: { id: agency.id, workspaceId: null }, data: { crmWorkspace: true, kind: "AGENCY" } });
  const problem = await addToCrm(agency.id, agency.name, email, "ADMIN", viewer.id, viewer.name);
  if (problem) return fail(problem);
  revalidatePath("/admin", "layout");
  return ok(`${agency.name} has its own CRM. ${email} is its admin and has been emailed.`);
}

/** Team & company → add someone to this agency's CRM. */
export async function addAgencyMember(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const ws = viewer.ws;
  if (!ws || !(viewer.workspaceRole === "ADMIN" || isSuperAdmin(viewer))) return fail("Only the agency's admin can add people.");
  const email = text(form, "email")?.toLowerCase() ?? null;
  if (!isEmail(email)) return fail("Enter their email.");
  const agency = await getPrisma().account.findFirst({ where: { id: ws, workspaceId: null }, select: { name: true } });
  const problem = await addToCrm(ws, agency?.name ?? "Your agency", email, text(form, "role") === "ADMIN" ? "ADMIN" : "MEMBER", viewer.id, viewer.name);
  if (problem) return fail(problem);
  revalidatePath("/admin/team");
  return ok(`${email} has been added and emailed.`);
}

export async function removeAgencyMember(form: FormData) {
  const viewer = await requireStaff();
  const ws = viewer.ws;
  if (!ws || !(viewer.workspaceRole === "ADMIN" || isSuperAdmin(viewer))) return;
  const userId = text(form, "userId");
  if (!userId || userId === viewer.id) return;
  await getPrisma().user.updateMany({ where: { id: userId, workspaceId: ws }, data: { workspaceId: null, workspaceRole: null } });
  revalidatePath("/admin/team");
}

/** Team & company → the agency's details for its quotes and invoices. */
export async function saveAgencyProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  const ws = viewer.ws;
  if (!ws || !(viewer.workspaceRole === "ADMIN" || isSuperAdmin(viewer))) return fail("Only the agency's admin can change this.");
  const keys: (keyof WorkspaceProfile)[] = ["name", "legalName", "gstin", "address", "phone", "email", "website", "payee", "bank", "account", "ifsc", "invoicePrefix", "logoUrl"];
  const profile = Object.fromEntries(keys.map((k) => [k, text(form, k, 400) ?? undefined]).filter(([, v]) => v)) as WorkspaceProfile;
  if (profile.gstin) profile.gstin = profile.gstin.toUpperCase();
  if (profile.invoicePrefix) profile.invoicePrefix = profile.invoicePrefix.replace(/[^A-Za-z0-9/-]/g, "").slice(0, 12);
  /* Invoice numbers are unique across every CRM: two agencies can't share a prefix, nor take Genesis's plain numbers. */
  if (profile.invoicePrefix) {
    if (/^\d+$/.test(profile.invoicePrefix)) return fail("Start the prefix with a letter, e.g. ABC/.");
    const others = await getPrisma().account.findMany({ where: { crmWorkspace: true, workspaceId: null, NOT: { id: ws } }, select: { crmProfile: true } });
    if (others.some((a) => ((a.crmProfile ?? {}) as Partial<WorkspaceProfile>).invoicePrefix?.toLowerCase() === profile.invoicePrefix!.toLowerCase())) return fail("Another agency uses that prefix. Pick a different one.");
  }
  await getPrisma().account.update({ where: { id: ws, workspaceId: null }, data: { crmProfile: profile } });
  revalidatePath("/admin", "layout");
  return ok("Saved. Your quotes and invoices use these details.");
}
