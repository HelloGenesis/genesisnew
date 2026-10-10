import "server-only";

import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import * as Sentry from "@sentry/nextjs";
import { decodeJwt } from "jose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAuditLog } from "./audit";
import { getPrisma, isDatabaseConfigured } from "./db";
import { AUTH0_ROLES_CLAIM, isPlaceholder } from "./env";
import { UserRole } from "@/lib/generated/prisma/enums";

/**
 * Auth0 owns authentication end-to-end: login, session cookies, MFA, and the
 * roles claim. Nothing here stores passwords or hand-rolls session logic.
 *
 * The client is constructed lazily and defensively. Before real Auth0
 * credentials exist, the marketing site must still build, deploy, and serve —
 * only `/insider` degrades, and it does so with a clear message rather than a
 * 500 on every route (`proxy.ts` runs on essentially every request).
 */

/** True when real (non-placeholder) Auth0 credentials are present. */
export function isAuth0Configured(): boolean {
  return (
    !isPlaceholder(process.env.AUTH0_DOMAIN) &&
    !isPlaceholder(process.env.AUTH0_CLIENT_ID) &&
    !isPlaceholder(process.env.AUTH0_CLIENT_SECRET) &&
    !isPlaceholder(process.env.AUTH0_SECRET)
  );
}

/** Auth0 role names → local `UserRole`. Unknown roles fall through to VIEWER. */
const ROLE_MAP: Record<string, UserRole> = {
  owner: UserRole.OWNER,
  admin: UserRole.ADMIN,
  member: UserRole.MEMBER,
  viewer: UserRole.VIEWER,
};

const rolesClaimSchema = z.array(z.string()).catch([]);

/** Highest-privilege role wins when Auth0 grants several. */
const ROLE_PRECEDENCE: UserRole[] = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.MEMBER,
  UserRole.VIEWER,
];

export function resolveRole(claims: unknown): UserRole {
  const names = rolesClaimSchema.parse(claims);
  const mapped = names
    .map((name) => ROLE_MAP[name.trim().toLowerCase()])
    .filter((role): role is UserRole => Boolean(role));

  return (
    ROLE_PRECEDENCE.find((role) => mapped.includes(role)) ?? UserRole.VIEWER
  );
}

/**
 * Mirrors the Auth0 identity into the local `users` table, keyed by `sub`,
 * and records the login in the audit trail.
 *
 * Wrapped so a database outage cannot block authentication — the user still
 * gets a session, and the failure is reported to Sentry.
 */
async function syncUserFromSession(session: SessionData): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const { user } = session;
  const email = user.email;
  /* A sign-in by mobile code has no email; lib/crm/session maps it to a user on first use. */
  if (!email) return;

  const role = resolveRole(user[AUTH0_ROLES_CLAIM]);

  try {
    const record = await getPrisma().user.upsert({
      where: { auth0Sub: user.sub },
      create: {
        auth0Sub: user.sub,
        email,
        name: user.name ?? null,
        picture: user.picture ?? null,
        role,
        lastLoginAt: new Date(),
      },
      update: {
        email,
        name: user.name ?? null,
        picture: user.picture ?? null,
        // Auth0 remains the source of truth for role assignment.
        role,
        lastLoginAt: new Date(),
      },
    });

    await recordAuditLog({
      action: "auth.login",
      entity: "user",
      entityId: record.id,
      actorId: record.id,
      actorSub: user.sub,
      metadata: { role: record.role },
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { subsystem: "auth0.sync" } });
  }
}

/**
 * Where every sign-in lands: /account/complete maps the identity to its CRM
 * user, claims any staff or portal invite for a verified address, and sends
 * staff to /admin and clients, agencies and vendors to /portal.
 */
export const SIGN_IN_LANDING = "/account/complete";

/** Builds a same-origin absolute URL, refusing to redirect off-site. */
function safeRedirectUrl(target: string | undefined, base: string): URL {
  const baseUrl = new URL(base);
  try {
    const resolved = new URL(target ?? SIGN_IN_LANDING, baseUrl);
    return resolved.origin === baseUrl.origin
      ? resolved
      : new URL(SIGN_IN_LANDING, baseUrl);
  } catch {
    return new URL(SIGN_IN_LANDING, baseUrl);
  }
}

/** Claims kept on the session beyond the SDK's default subset (as in genesis-coworking). */
const EXTRA_CLAIMS = ["phone_number", "phone_number_verified", "amr"] as const;

function createAuth0Client(): Auth0Client {
  return new Auth0Client({
    // `appBaseUrl` is intentionally left to the SDK when APP_BASE_URL is unset
    // so Vercel preview deployments resolve their own host at runtime.
    signInReturnToPath: SIGN_IN_LANDING,
    /* Email and mobile one-time codes (Auth0 passwordless) need the phone claims. */
    authorizationParameters: { scope: "openid profile email phone offline_access" },
    /* Signed-out visitors get 204 from /auth/profile instead of a noisy 401. */
    noContentProfileResponseWhenUnauthenticated: true,

    beforeSessionSaved: async (session, idToken) => {
      const claims = idToken ? (decodeJwt(idToken) as Record<string, unknown>) : {};
      const extra = Object.fromEntries(EXTRA_CLAIMS.filter((key) => key in claims).map((key) => [key, claims[key]]));
      return {
        ...session,
        user: {
          ...session.user,
          ...extra,
          genesisRole: resolveRole(session.user[AUTH0_ROLES_CLAIM]),
        },
      };
    },

    onCallback: async (error, ctx, session) => {
      const base =
        ctx.appBaseUrl ?? process.env.APP_BASE_URL ?? "http://localhost:3000";

      if (error) {
        Sentry.captureException(error, { tags: { subsystem: "auth0.callback" } });
        const target = new URL("/login", base);
        target.searchParams.set("error", "authentication_failed");
        return NextResponse.redirect(target);
      }

      if (session) {
        await syncUserFromSession(session);
      }

      return NextResponse.redirect(safeRedirectUrl(ctx.returnTo, base));
    },
  });
}

let client: Auth0Client | undefined;

/** Throws a clear error when Auth0 credentials are absent. */
export function getAuth0(): Auth0Client {
  if (!client) client = createAuth0Client();
  return client;
}

/**
 * Returns the client only if Auth0 is configured, otherwise `null`.
 * Lets `proxy.ts` pass requests through untouched pre-credentials instead of
 * failing every route on the site.
 */
export function getAuth0IfConfigured(): Auth0Client | null {
  if (!isAuth0Configured()) return null;
  try {
    return getAuth0();
  } catch (error) {
    Sentry.captureException(error, { tags: { subsystem: "auth0.init" } });
    return null;
  }
}
