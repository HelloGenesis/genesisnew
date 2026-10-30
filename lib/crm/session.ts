import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getAuth0IfConfigured, isAuth0Configured } from "@/lib/auth0";
import { recordAuditLog } from "@/lib/audit";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

import { DEMO_AGENCY, DEMO_EMAIL, DEMO_SUB, inDemoArea } from "./demo";
import { requestWorkspace } from "./request-workspace";
import { emailLoginEnabled, readSignedEmail, SESSION_COOKIE } from "./email-login";
import { TEAM } from "./team";
import type { AccountKind, MemberRole, StaffRoleKind } from "@/lib/generated/prisma/enums";

/**
 * WHO IS SIGNED IN, AND WHAT THEY MAY SEE — the CRM's authorization boundary.
 *
 * Authentication is Auth0's (Google, email or mobile one-time code — see
 * /login); everything after it is ours. One `users` row per identity, staff
 * roles in `crm_staff_roles`, portal access through `crm_account_members`.
 * `proxy.ts` only redirects signed-out visitors optimistically; every admin
 * page and action calls `requireStaff`, and every portal query is scoped to
 * the accounts `portalAccounts` returns.
 *
 * Same rules as genesis-coworking: roles are never self-assigned — they come
 * from an owner's invite, claimed only by a VERIFIED email — and /admin needs
 * a two-factor session (Auth0 MFA, or the staff authenticator code).
 */

export type Identity = {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  name: string | null;
  picture: string | null;
  amr: string[];
};

export type Membership = { accountId: string; role: MemberRole; name: string; kind: AccountKind; isReseller: boolean; parentId: string | null };

export type Viewer = {
  id: string;
  sub: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  title: string | null;
  /** Areas a super admin has opened up beyond this person's own records (lib/crm/scope). */
  grants: string[];
  roles: StaffRoleKind[];
  mfa: boolean;
  memberships: Membership[];
  dev: boolean;
  /** Nova's live demo visitor (lib/crm/demo): everything shows, nothing saves. */
  demo: boolean;
  /** The agency CRM this person works in (null: Genesis's team). */
  workspaceId: string | null;
  workspaceRole: "ADMIN" | "MEMBER" | null;
  /** The CRM this person is looking at now: their agency's; an owner's pick from the switcher; otherwise Genesis's (null). */
  ws: string | null;
};

// --- Local development sign-in -------------------------------------------------
// Auth0 is not configured on this machine, so `npm run dev` with
// CRM_DEV_LOGIN=1 offers a sign-in by email at /login that issues a signed
// cookie. It cannot exist in production: it needs NODE_ENV=development, the
// flag, AND no Auth0 credentials.

export const devLoginEnabled = () =>
  process.env.NODE_ENV === "development" && process.env.CRM_DEV_LOGIN === "1" && !isAuth0Configured();

const DEV_COOKIE = "gm_dev_identity";
const devSecret = () => process.env.CRM_DEV_SECRET || "genesis-local-development-only";

export function signDevIdentity(email: string): string {
  const body = Buffer.from(JSON.stringify({ email: email.toLowerCase() })).toString("base64url");
  return `${body}.${createHmac("sha256", devSecret()).update(body).digest("hex")}`;
}

function readDevIdentity(value: string | undefined): Identity | null {
  if (!value || !devLoginEnabled()) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", devSecret()).update(body).digest("hex");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const { email } = JSON.parse(Buffer.from(body, "base64url").toString()) as { email: string };
  return { sub: `dev|${email}`, email, emailVerified: true, phone: null, phoneVerified: false, name: null, picture: null, amr: [] };
}

export const devCookie = { name: DEV_COOKIE, options: { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 12 } };

// --- The identity behind this request --------------------------------------------

export async function currentIdentity(): Promise<Identity | null> {
  const signedIn = await signedInIdentity();
  if (signedIn) return signedIn;
  /* No one signed in, and this browser opened Nova's live demo (lib/crm/demo). */
  return (await inDemoArea()) ? demoIdentity() : null;
}

/*
 * The demo agency's admin, only while that user is exactly what the demo
 * made: in an agency workspace, on no one's staff. Anything else and there is
 * no demo, so a mistake can never sign a visitor in as someone real.
 */
const demoIdentity = cache(async (): Promise<Identity | null> => {
  if (!isDatabaseConfigured()) return null;
  /*
   * The agency is read through the user (a nested read), never as its own
   * Account query: that would ask which CRM this request is in, which asks
   * who is signed in, which is this, waiting on itself.
   */
  const user = await getPrisma().user.findUnique({
    where: { auth0Sub: DEMO_SUB },
    select: { email: true, workspace: { select: { name: true, crmWorkspace: true, workspaceId: true } }, staffRoles: { select: { role: true }, take: 1 } },
  });
  const w = user?.workspace;
  if (user?.email !== DEMO_EMAIL || !w || w.name !== DEMO_AGENCY || !w.crmWorkspace || w.workspaceId !== null || user.staffRoles.length) return null;
  return { sub: DEMO_SUB, email: DEMO_EMAIL, emailVerified: true, phone: null, phoneVerified: false, name: null, picture: null, amr: ["mfa"] };
});

/** Whoever is really signed in (never the demo). */
export async function signedInIdentity(): Promise<Identity | null> {
  if (devLoginEnabled()) return readDevIdentity((await cookies()).get(DEV_COOKIE)?.value);
  if (emailLoginEnabled()) {
    const email = readSignedEmail((await cookies()).get(SESSION_COOKIE)?.value);
    return email ? { sub: `email|${email}`, email, emailVerified: true, phone: null, phoneVerified: false, name: null, picture: null, amr: [] } : null;
  }
  const auth0 = getAuth0IfConfigured();
  if (!auth0) return null;
  const session = await auth0.getSession();
  if (!session) return null;
  const u = session.user as Record<string, unknown>;
  return {
    sub: String(u.sub),
    email: typeof u.email === "string" ? u.email.toLowerCase() : null,
    emailVerified: u.email_verified === true,
    phone: typeof u.phone_number === "string" ? u.phone_number : null,
    phoneVerified: u.phone_number_verified === true,
    name: typeof u.name === "string" && u.name !== u.email ? u.name : null,
    picture: typeof u.picture === "string" ? u.picture : null,
    amr: Array.isArray(u.amr) ? (u.amr as string[]) : [],
  };
}

/** Owner emails from the environment: the first owner needs no command line (CRM_OWNER_EMAILS). */
const ownerEmails = () =>
  new Set((process.env.CRM_OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));

/**
 * The user row for an identity, created or refreshed, with any invite for its
 * VERIFIED email claimed. Run on every sign-in (/account/complete) and lazily
 * by getViewer, so a role or a portal granted while someone is signed in
 * reaches them on their next page.
 */
export async function syncIdentity(identity: Identity) {
  const prisma = getPrisma();
  const verifiedEmail = identity.emailVerified ? identity.email : null;
  /* A verified email already on another row (an earlier sign-in by another method) is the same person. */
  const existing =
    (await prisma.user.findUnique({ where: { auth0Sub: identity.sub } })) ??
    (verifiedEmail ? await prisma.user.findFirst({ where: { email: verifiedEmail, emailVerified: true } }) : null);

  const fields = {
    ...(identity.email && (identity.emailVerified || !existing?.email) ? { email: identity.email, emailVerified: identity.emailVerified } : {}),
    ...(identity.phone ? { phone: identity.phone, phoneVerified: identity.phoneVerified } : {}),
    ...(identity.name ? { name: identity.name } : {}),
    ...(identity.picture ? { picture: identity.picture } : {}),
    lastLoginAt: new Date(),
  };

  let user;
  try {
    user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: fields })
      : await prisma.user.create({ data: { auth0Sub: identity.sub, ...fields } });
  } catch {
    /* The email is held by an unverified row: keep this identity without it rather than fail the sign-in. */
    const rest: Record<string, unknown> = { ...fields };
    delete rest.email;
    delete rest.emailVerified;
    user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: rest })
      : await prisma.user.create({ data: { auth0Sub: identity.sub, ...rest } });
  }

  if (verifiedEmail) {
    const staffInvites = await prisma.staffInvite.findMany({ where: { email: verifiedEmail } });
    const roles = new Set(staffInvites.map((invite) => invite.role));
    if (ownerEmails().has(verifiedEmail)) roles.add("OWNER");
    for (const role of roles) {
      await prisma.staffRole.upsert({
        where: { userId_role: { userId: user.id, role } },
        create: { userId: user.id, role, grantedById: staffInvites.find((i) => i.role === role)?.invitedById ?? null },
        update: {},
      });
    }
    if (staffInvites.length) {
      await prisma.staffInvite.deleteMany({ where: { email: verifiedEmail } });
      await recordAuditLog({ action: "staff.invite_claimed", entity: "user", entityId: user.id, actorId: user.id, metadata: { roles: [...roles] } });
    }

    const accountInvites = await prisma.accountInvite.findMany({ where: { email: verifiedEmail } });
    for (const invite of accountInvites) {
      await prisma.accountMember.upsert({
        where: { accountId_userId: { accountId: invite.accountId, userId: user.id } },
        create: { accountId: invite.accountId, userId: user.id, role: invite.role },
        update: {},
      });
    }
    if (accountInvites.length) {
      await prisma.accountInvite.deleteMany({ where: { id: { in: accountInvites.map((i) => i.id) } } });
      await recordAuditLog({ action: "portal.invite_claimed", entity: "user", entityId: user.id, actorId: user.id, metadata: { accounts: accountInvites.map((i) => i.accountId) } });
    }
    /* An invitation into an agency's CRM (lib/crm/workspace), waiting for this verified email. */
    const agencyInvite = await prisma.appSetting.findUnique({ where: { key: `agency-invite:${verifiedEmail}` } });
    if (agencyInvite && !user.workspaceId) {
      const { ws, role } = JSON.parse(agencyInvite.value) as { ws: string; role: "ADMIN" | "MEMBER" };
      if ((await prisma.staffRole.count({ where: { userId: user.id } })) === 0) user = await prisma.user.update({ where: { id: user.id }, data: { workspaceId: ws, workspaceRole: role } });
      await prisma.appSetting.delete({ where: { key: agencyInvite.key } });
    }
  }
  return user;
}

/** Cached per request. Null when signed out, or when Auth0 (or dev sign-in) and the database are not configured. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isDatabaseConfigured()) return null;
  const identity = await currentIdentity();
  if (!identity) return null;
  const prisma = getPrisma();
  /* By this sign-in, or by the same verified email from another method (Google, then an email code). */
  let user =
    (await prisma.user.findUnique({ where: { auth0Sub: identity.sub } })) ??
    (identity.emailVerified && identity.email ? await prisma.user.findFirst({ where: { email: identity.email, emailVerified: true } }) : null) ??
    (await syncIdentity(identity));
  /* The team's names and titles, the first time (lib/crm/team). */
  const known = user.email ? TEAM[user.email] : undefined;
  if (known && (!user.name || !user.title)) user = await prisma.user.update({ where: { id: user.id }, data: { name: user.name ?? known.name, title: user.title ?? known.title } });

  const jar = await cookies();
  return buildViewer(user, {
    sub: identity.sub,
    mfa: identity.amr.includes("mfa") || readStaffTwoFactor(jar.get(STAFF_2FA_COOKIE)?.value, user.id, identity.sub),
    viewing: jar.get("gm_ws")?.value ?? null,
  });
});

/**
 * The same person, from their user record alone: for the ChatGPT / Claude
 * connector (lib/crm/mcp), which signs in with a secret link instead of a
 * browser session. Two-factor counts as done (the link is the secret);
 * Genesis owners work in Genesis's own CRM.
 */
export async function viewerForUser(userId: string): Promise<Viewer | null> {
  const user = await getPrisma().user.findUnique({ where: { id: userId } });
  return user ? buildViewer(user, { sub: user.auth0Sub, mfa: true, viewing: null }) : null;
}

type UserRow = NonNullable<Awaited<ReturnType<ReturnType<typeof getPrisma>["user"]["findUnique"]>>>;

async function buildViewer(user: UserRow, s: { sub: string; mfa: boolean; viewing: string | null }): Promise<Viewer> {
  const prisma = getPrisma();
  const [roles, memberships] = await Promise.all([
    prisma.staffRole.findMany({ where: { userId: user.id }, select: { role: true } }),
    prisma.accountMember.findMany({
      where: { userId: user.id },
      select: { role: true, account: { select: { id: true, name: true, kind: true, isReseller: true, parentId: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  /*
   * AN AGENCY'S TEAM (lib/crm/workspace): sales, delivery and the influencer
   * work in their own CRM, never Genesis's money pages or staff. Their admin
   * sees everything in their CRM; a member, their own plus all influencers.
   */
  const agency = user.workspaceId ? await prisma.account.findFirst({ where: { id: user.workspaceId, crmWorkspace: true, workspaceId: null }, select: { id: true } }) : null;
  const workspaceRole = agency ? (user.workspaceRole === "ADMIN" ? "ADMIN" : "MEMBER") : null;
  const staffRoles = agency ? (workspaceRole === "ADMIN" ? (["SALES", "PRODUCER", "INFLUENCER"] as StaffRoleKind[]) : (["SALES", "PRODUCER"] as StaffRoleKind[])) : roles.map((r) => r.role);
  const owner = !agency && staffRoles.includes("OWNER");
  const viewing = owner ? s.viewing : null;
  const viewingOk = viewing ? Boolean(await prisma.account.findFirst({ where: { id: viewing, crmWorkspace: true, workspaceId: null }, select: { id: true } })) : false;
  return {
    id: user.id,
    sub: s.sub,
    email: user.email,
    phone: user.phone,
    name: user.name,
    title: user.title,
    grants: agency ? (workspaceRole === "ADMIN" ? ["leads", "quotes", "billing", "clients", "projects", "creators"] : ["creators"]) : (user.grants ?? []),
    roles: staffRoles,
    mfa: s.mfa,
    memberships: memberships.map((m) => ({ accountId: m.account.id, role: m.role, name: m.account.name, kind: m.account.kind, isReseller: m.account.isReseller, parentId: m.account.parentId })),
    dev: s.sub.startsWith("dev|"),
    demo: s.sub === DEMO_SUB,
    workspaceId: agency?.id ?? null,
    workspaceRole,
    ws: agency?.id ?? (viewingOk ? viewing : null),
  };
}

// --- Staff -------------------------------------------------------------------------

export type StaffArea = "sales" | "plans" | "delivery" | "finance" | "staff";

const AREA_ROLES: Record<StaffArea, StaffRoleKind[]> = {
  sales: ["ADMIN", "SALES"],
  /* Quotes & influencer plans: sales, and the influencer team for influencer plans (lib/crm/scope quoteScope). */
  plans: ["ADMIN", "SALES", "INFLUENCER"],
  delivery: ["ADMIN", "PRODUCER"],
  finance: ["ADMIN", "FINANCE"],
  staff: [],
};

export const isStaff = (viewer: Viewer | null) => Boolean(viewer && viewer.roles.length > 0);

/** Owner can do everything; otherwise the area's roles. */
export function can(viewer: Viewer | null, area: StaffArea): boolean {
  if (!viewer) return false;
  if (viewer.roles.includes("OWNER")) return true;
  return viewer.roles.some((role) => AREA_ROLES[area].includes(role));
}

export const adminRequiresMfa = () => process.env.NODE_ENV === "production" || process.env.ADMIN_REQUIRE_MFA !== "false";

export function staffAccess(viewer: Viewer | null): "granted" | "signin" | "mfa" | "forbidden" {
  if (!viewer) return "signin";
  if (viewer.roles.length === 0) return "forbidden";
  if (adminRequiresMfa() && !viewer.mfa) return "mfa";
  return "granted";
}

/** For admin pages and server actions: a staff role, two-factor, and (optionally) an area. */
export async function requireStaff(area?: StaffArea): Promise<Viewer> {
  const viewer = await getViewer();
  const access = staffAccess(viewer);
  if (access === "signin") redirect("/login?next=/admin");
  if (access === "forbidden") redirect("/admin/forbidden");
  if (access === "mfa") redirect("/staff-verify?next=/admin");
  if (area && !can(viewer, area)) redirect("/admin/forbidden");
  /* Every query from here on stays inside this person's CRM (lib/db). */
  Object.assign(requestWorkspace(), { ws: viewer!.ws, known: true });
  return viewer!;
}

// After a correct authenticator code on /staff-verify, a signed cookie bound to
// this user AND this sign-in (sub) marks the session two-factor for 12 hours.

export const STAFF_2FA_COOKIE = "gm_staff_2fa";
const STAFF_2FA_TTL_SECONDS = 12 * 60 * 60;

function cookieSecret(): string {
  const secret = emailLoginEnabled() ? process.env.CRM_SESSION_SECRET : process.env.AUTH0_SECRET || (devLoginEnabled() ? devSecret() : "");
  if (!secret) throw new Error("AUTH0_SECRET (or CRM_SESSION_SECRET) is required for the staff two-factor check");
  return secret;
}

export function signStaffTwoFactor(userId: string, sub: string): string {
  const exp = Math.floor(Date.now() / 1000) + STAFF_2FA_TTL_SECONDS;
  const sig = createHmac("sha256", cookieSecret()).update(`staff2fa:${userId}.${sub}.${exp}`).digest("hex");
  return `${userId}.${exp}.${sig}`;
}

function readStaffTwoFactor(value: string | undefined, userId: string, sub: string): boolean {
  if (!value) return false;
  const [id, exp, sig] = value.split(".");
  if (!id || !exp || !sig || id !== userId || Number(exp) < Date.now() / 1000) return false;
  let expected: string;
  try {
    expected = createHmac("sha256", cookieSecret()).update(`staff2fa:${id}.${sub}.${exp}`).digest("hex");
  } catch {
    return false;
  }
  return expected.length === sig.length && timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export const staffTwoFactorCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: STAFF_2FA_TTL_SECONDS,
};

// --- Portal ------------------------------------------------------------------------

/**
 * Every account this person may open in the portal: their own memberships,
 * and — for a member of an agency — the brands that agency manages.
 */
export async function portalAccounts(viewer: Viewer) {
  const direct = viewer.memberships.map((m) => m.accountId);
  const agencies = viewer.memberships.filter((m) => m.kind === "AGENCY").map((m) => m.accountId);
  const brands = agencies.length
    ? await getPrisma().account.findMany({ where: { parentId: { in: agencies } }, select: { id: true, name: true, kind: true, isReseller: true, parentId: true } })
    : [];
  const list = [
    ...viewer.memberships.map((m) => ({ id: m.accountId, name: m.name, kind: m.kind, isReseller: m.isReseller, parentId: m.parentId, role: m.role as MemberRole })),
    ...brands.filter((b) => !direct.includes(b.id)).map((b) => ({ ...b, role: "MEMBER" as MemberRole })),
  ];
  return list;
}

const ACCOUNT_COOKIE = "gm_portal_account";

/** For portal pages and actions: the signed-in person and the account they are looking at. */
export async function requirePortal() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/portal");
  const accounts = await portalAccounts(viewer);
  if (accounts.length === 0) redirect(viewer.roles.length ? "/admin" : "/account");
  const chosen = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  const account = accounts.find((a) => a.id === chosen) ?? accounts[0]!;
  return { viewer, accounts, account };
}

export const portalAccountCookie = { name: ACCOUNT_COOKIE, options: { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 90 } };

/** Same-origin path only; anything else falls back. */
export function safeNext(next: string | null | undefined, fallback = "/portal"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
