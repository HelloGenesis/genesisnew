import { NextRequest, NextResponse } from "next/server";

import { getAuth0IfConfigured } from "./lib/auth0";
import { PATH_HEADER } from "./lib/crm/path-header";
import { checkRateLimit, rateLimitKey } from "./lib/rate-limit";

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

/** Path prefixes requiring an authenticated session: Insider, the CRM (/admin) and the client portal. */
const PROTECTED_PREFIXES = ["/insider", "/admin", "/portal"];

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
    return withPath(request);
  }

  /* One-time codes cost money and invite abuse: a per-IP limit on top of Auth0's own (as genesis-coworking). */
  if (url.pathname === "/auth/passwordless/start" && request.method === "POST") {
    const limit = await checkRateLimit(rateLimitKey(request, "otp"));
    if (!limit.success) {
      return NextResponse.json(
        { error: "too_many_requests", error_description: "Please wait before requesting another code." },
        { status: 429 },
      );
    }
  }

  // Auth0 owns /auth/* entirely and rolls the session for everything else.
  const authResponse = await auth0.middleware(request);

  if (url.pathname.startsWith("/auth/")) {
    return authResponse;
  }

  if (isProtectedPath(url.pathname)) {
    const session = await auth0.getSession(new NextRequest(request));

    if (!session) {
      /* Our own sign-in page (Google, email code, mobile code), then back to where they were headed. */
      const loginUrl = new URL("/login", url.origin);
      loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return withPath(request, authResponse);
}

/**
 * Passes the request on with its path in a header, for lib/crm/request-workspace
 * (which CRM a form submission or download is in). Set here, so it can't be
 * supplied by the browser; Auth0's rolled session cookies are kept.
 */
function withPath(request: Request, base?: NextResponse): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, new URL(request.url).pathname);
  const response = NextResponse.next({ request: { headers } });
  if (base) {
    for (const cookie of base.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
    base.headers.forEach((value, key) => {
      if (key !== "set-cookie" && !key.startsWith("x-middleware-")) response.headers.set(key, value);
    });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and metadata files. The Auth0 SDK needs
     * this broad a matcher for rolling sessions to work. `og` is the share
     * cards (app/og) — images, with no session to roll.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|llms-full.txt|og).*)",
  ],
};
