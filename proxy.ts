import { NextRequest, NextResponse } from "next/server";

import { getAuth0IfConfigured } from "./lib/auth0";

/**
 * Next.js 16 renamed Middleware to Proxy. This file must be named `proxy.ts`
 * and export `proxy`; the proxy layer runs on the Node.js runtime (the edge
 * runtime is not supported here).
 *
 * Responsibilities:
 *   1. Mount the Auth0 SDK routes (/auth/login, /auth/callback, /auth/logout)
 *      and roll the session cookie on every request.
 *   2. Perform an *optimistic* redirect for protected paths.
 *
 * The optimistic check is a UX shortcut, not the authorization boundary —
 * Next.js explicitly warns against treating proxy as a full auth solution.
 * `app/insider/layout.tsx` re-checks the session and role server-side, and
 * that check is the one that actually gates access.
 */

/** Path prefixes requiring an authenticated session. */
const PROTECTED_PREFIXES = ["/insider"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: Request): Promise<NextResponse> {
  const auth0 = getAuth0IfConfigured();
  const url = new URL(request.url);

  // Before Auth0 credentials are supplied, let every request through. The
  // proxy matcher covers the whole site, so throwing here would take the
  // marketing pages down too; /insider renders a "not configured" notice.
  if (!auth0) {
    return NextResponse.next();
  }

  // Auth0 owns /auth/* entirely and rolls the session for everything else.
  const authResponse = await auth0.middleware(request);

  if (url.pathname.startsWith("/auth/")) {
    return authResponse;
  }

  if (isProtectedPath(url.pathname)) {
    const session = await auth0.getSession(new NextRequest(request));

    if (!session) {
      const loginUrl = new URL("/auth/login", url.origin);
      // Bring the user back to where they were headed after logging in.
      loginUrl.searchParams.set("returnTo", `${url.pathname}${url.search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and metadata files. The Auth0 SDK needs
     * this broad a matcher for rolling sessions to work. `og` is the share
     * cards (app/og) — images, with no session to roll.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|og).*)",
  ],
};
