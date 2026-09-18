import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { INDEXABLE, SITE_HOST, SITE_URL } from "@/lib/seo";

/**
 * Crawl rules — decided per HOST, because robots.txt is read per host.
 *
 * ONLY THE PRODUCTION DOMAIN IS CRAWLABLE. The same build answers on several
 * hosts: www.genesismedia.co, the project's *.vercel.app alias, and every
 * preview URL. Each of those serves this file, and a copy of the site
 * indexed on a vercel.app host competes with the real one. So anything that
 * is not the production domain on a production build is told `Disallow: /`.
 * Reading the Host header makes this file render per request, which is the
 * point.
 *
 * ON THE REAL DOMAIN:
 *   - /api/ is closed — the diagnostics route is token-gated and nothing
 *     else there is a page — EXCEPT /api/media/. When Drive serves the media
 *     (NEXT_PUBLIC_FILMS_FROM_DRIVE / NEXT_PUBLIC_MEDIA_FROM_DRIVE), every
 *     full-length film and poster is a file under it, and the case studies'
 *     VideoObject points there. Blocking it would hide every film from video
 *     search. The longer rule wins in Google's matching, so Allow beats
 *     Disallow for those paths.
 *   - /insider (authenticated) and /auth/ (Auth0's login, callback and
 *     logout) are closed; neither is a page anyone should land on from search.
 *   - The forms post as Server Actions to the page they sit on, so there is
 *     no separate submission route to close.
 *   - /_next/ stays OPEN. Google renders pages with their JavaScript and
 *     CSS, and blocking the build output is how a site gets indexed as blank.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  const crawlable = INDEXABLE && host === SITE_HOST;

  if (!crawlable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/media/"],
      disallow: ["/api/", "/insider", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
