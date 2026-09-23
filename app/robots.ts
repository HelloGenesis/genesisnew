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
    /*
      SHUT TO SEARCH, OPEN TO LINK PREVIEWS — and that distinction is a bug
      fix, not a nicety.

      `Disallow: /` for everyone is right for indexers and wrong for the bots
      that build a share card, because those obey robots.txt too.
      facebookexternalhit is what WhatsApp sends to read a link's og tags, and
      on genesismedia.vercel.app it was being told to go away — so a link
      Genesis forwarded arrived with a title, a grey box and no picture, and
      no amount of correcting the og:image would have changed it.

      Letting them through costs nothing that the rule above is protecting. A
      preview bot does not index: it fetches one URL, reads the head, fetches
      the image and renders a card in one chat. It cannot put a vercel.app
      copy of the site into anybody's search results, which is the only thing
      the disallow exists to prevent — and the canonical tag on every page
      still names the real domain.

      This matters TODAY because the site is being shared from the Vercel
      host while the domain is still on the old one. It goes on mattering
      afterwards, for anyone sharing a preview build.
    */
    return {
      rules: [
        {
          userAgent: [
            "facebookexternalhit",
            "facebookcatalog",
            "WhatsApp",
            "Twitterbot",
            "LinkedInBot",
            "Slackbot",
            "Slackbot-LinkExpanding",
            "Discordbot",
            "TelegramBot",
            "SkypeUriPreview",
            "redditbot",
            "Iframely",
            "Embedly",
          ],
          allow: "/",
        },
        { userAgent: "*", disallow: "/" },
      ],
    };
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
