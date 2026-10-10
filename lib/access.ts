import "server-only";

import * as Sentry from "@sentry/nextjs";

import { getAuth0IfConfigured, isAuth0Configured } from "./auth0";
import { getPrisma, isDatabaseConfigured } from "./db";
import { UserRole } from "@/lib/generated/prisma/enums";

/**
 * Authorization boundary for Genesis Insider.
 *
 * This is the authoritative check — `proxy.ts` only performs an optimistic
 * redirect. Role comes from the local `users` table (seeded from the Auth0
 * roles claim at login), so a role change does not require the user's Auth0
 * session to expire before it takes effect.
 */

/** Roles permitted into /insider. VIEWER is the unprovisioned default. */
const INSIDER_ROLES: readonly UserRole[] = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.MEMBER,
];

export type InsiderUser = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  role: UserRole;
};

export type InsiderAccess =
  /** Credentials for Auth0 and/or the database have not been supplied yet. */
  | { status: "unconfigured"; missing: string[] }
  /** No valid session — the caller should send the user to /auth/login. */
  | { status: "unauthenticated" }
  /** Authenticated, but not provisioned with an Insider role. */
  | { status: "forbidden"; email: string | null; role: UserRole | null }
  | { status: "granted"; user: InsiderUser };

export async function getInsiderAccess(): Promise<InsiderAccess> {
  const missing: string[] = [];
  if (!isAuth0Configured()) missing.push("Auth0");
  if (!isDatabaseConfigured()) missing.push("Neon database");
  if (missing.length > 0) return { status: "unconfigured", missing };

  const auth0 = getAuth0IfConfigured();
  if (!auth0) return { status: "unconfigured", missing: ["Auth0"] };

  const session = await auth0.getSession();
  if (!session) return { status: "unauthenticated" };

  try {
    const user = await getPrisma().user.findUnique({
      where: { auth0Sub: session.user.sub },
      select: { id: true, email: true, name: true, picture: true, role: true },
    });

    // Authenticated with Auth0 but no local row: the login-time sync failed,
    // or the account has not been provisioned. Deny rather than assume.
    if (!user) {
      return {
        status: "forbidden",
        email: session.user.email ?? null,
        role: null,
      };
    }

    if (!INSIDER_ROLES.includes(user.role)) {
      return { status: "forbidden", email: user.email, role: user.role };
    }

    return { status: "granted", user };
  } catch (error) {
    // A database failure must never be treated as a grant.
    Sentry.captureException(error, { tags: { subsystem: "access" } });
    return {
      status: "forbidden",
      email: session.user.email ?? null,
      role: null,
    };
  }
}
