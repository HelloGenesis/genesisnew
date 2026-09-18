import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security-headers";

/*
  THE SITE THIS REPLACES. www.genesismedia.co is a Wix site today, and
  everything Google has indexed for Genesis lives at Wix's URLs — read off its
  three sitemaps (pages, blog posts, blog categories) in September 2026. On
  launch day every one of them would 404 and take its standing with it, so
  each is sent, permanently, to the page that now does its job.

  THE BLOG POSTS WERE CASE STUDIES, and most have an exact successor in the
  case-study master: Jump For Health, YogaBAE, The WorldGrad, Vikrant Massey's
  Activ One BTS, UMANG 2024, and the Matcha reel, which the master files under
  All For Health. The two with no written study go to the nearest real page —
  the Mahindra Finance FD film to the index, the NHPS school events to Studios.

  WIX'S DUPLICATE AND TEST PAGES (copy-of-home, blank-1, nil…) go home. They
  carry nothing worth keeping, but a 308 costs nothing and a 404 on a URL
  someone once linked is a small leak.

  Anything under /post/ or /blog/categories/ not named here lands on the
  case-study index rather than a 404: that is what the old blog was.

  Check Search Console's Pages report after launch for any Wix URL with
  impressions that is missing here, and add it.
*/
const WIX_REDIRECTS = [
  // Pages
  { source: "/home", destination: "/" },
  { source: "/landingpage", destination: "/" },
  { source: "/copy-of-landing-page", destination: "/" },
  { source: "/copy-of-home", destination: "/" },
  { source: "/copy-of-home-1", destination: "/" },
  { source: "/copy-of-home-2", destination: "/" },
  { source: "/blank-1", destination: "/" },
  { source: "/blank-2", destination: "/" },
  { source: "/nil", destination: "/" },
  { source: "/app-landing-page", destination: "/" },
  { source: "/members", destination: "/" },
  { source: "/about-3", destination: "/" },
  { source: "/team-3", destination: "/" },
  { source: "/challenges", destination: "/" },
  { source: "/services-7", destination: "/" },
  { source: "/career", destination: "/careers" },
  { source: "/job-form", destination: "/careers" },
  { source: "/contact-us", destination: "/#contact" },
  { source: "/copy-of-contact-us", destination: "/#contact" },
  { source: "/apointments", destination: "/#contact" },
  { source: "/book-online", destination: "/#contact" },
  { source: "/influencer-registration-form", destination: "/creator" },
  { source: "/roster", destination: "/influencer-marketing" },
  { source: "/events", destination: "/content-production" },
  { source: "/work", destination: "/case-studies" },
  // The terms page was removed at Genesis's request; both land on privacy.
  { source: "/terms-conditions", destination: "/privacy" },
  { source: "/terms", destination: "/privacy" },
  { source: "/privacy-policy", destination: "/privacy" },
  // Blog
  { source: "/blog", destination: "/case-studies" },
  { source: "/blog/categories/influencer-marketing-blogs", destination: "/influencer-marketing" },
  { source: "/blog/categories/video-production-by-genesis-media", destination: "/content-production" },
  { source: "/blog/categories/events-by-genesis-media", destination: "/content-production" },
  { source: "/blog/categories/:category*", destination: "/case-studies" },
  { source: "/post/how-influencer-power-jumpstarted-a-health-movement-aditya-birla-capital-health-insurance-s-jumpf", destination: "/case-studies/abhi-jump-for-health-2023" },
  { source: "/post/yogabae-activ-living-case-study", destination: "/case-studies/abhi-yogabae" },
  { source: "/post/world-grad-case-study", destination: "/case-studies/the-worldgrad" },
  { source: "/post/behind-the-scenes-vikrant-massey-brings-activ-one-to-life", destination: "/case-studies/activ-one-bts-with-vikrant-massey" },
  { source: "/post/celebrating-umang-2024", destination: "/case-studies/umang-2024" },
  { source: "/post/matcha-for-focus-energy-mood-abhi-s-instagram-reel-that-led-700k-to-activ-living", destination: "/case-studies/abhi-all-for-health" },
  { source: "/post/delivering-impeccable-school-functions-nhps", destination: "/content-production" },
  { source: "/post/:post*", destination: "/case-studies" },
].map((redirect) => ({ ...redirect, permanent: true }));

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // `googleapis` is a very large CJS package that should not be traced into
  // the serverless bundle; Next loads it from node_modules at runtime instead.
  serverExternalPackages: ["googleapis"],

  images: {
    /**
     * YouTube still frames for the journal's video-linked articles. Scoped to
     * the thumbnail host only — a permissive pattern here would let any URL
     * in the app become an optimisation request against arbitrary origins.
     */
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },

  /*
    THE PAGES THAT FOLDED INTO THE LANDING PAGE. Genesis asked for everything
    except the two forms to live on the one page, so these routes are gone.
    Anyone arriving on an old link — a shared project, a bookmarked case study,
    a search result — lands on the section that replaced it, not on a 404.

    THE SLUG PATTERNS ARE DELIBERATELY NARROW, and that is the part to keep.
    Next checks redirects BEFORE /public, and /public has live files under two
    of these prefixes: every video at /work/clips/<n>.mp4 and every avatar
    portrait at /avatars/<name>.jpg. `/work/:slug*` would have redirected the
    whole catalogue's footage and `/avatars/:slug` every portrait. Matching one
    segment of letters, digits and hyphens only — no dot, no slash — catches
    the old page URLs and cannot touch a file.

    Temporary (307), not permanent: the decision is new, and a 308 is cached by
    browsers and search engines long enough to be hard to take back.

    EXCEPT WHERE THE DESTINATION IS NOW A PAGE OF ITS OWN. The divisions and
    the case studies have real URLs again (see divisionPages in
    lib/site-config and lib/case-study-pages), so the routes that used to
    stand for them point there permanently — a 308 is what hands a URL's
    standing on to its replacement. /case-studies/<slug> is no longer
    redirected at all: it is the study's page, and an old slug is redirected
    by the page itself to the study's new name.
  */
  async redirects() {
    const slug = ":slug([a-z0-9-]+)";
    return [
      { source: "/our-work", destination: "/#library", permanent: false },
      { source: `/work/${slug}`, destination: "/#library", permanent: false },
      { source: `/avatars/${slug}`, destination: "/ai-content-automation", permanent: false },
      { source: "/influencer-campaigns", destination: "/influencer-marketing", permanent: true },
      { source: "/content-creation", destination: "/content-production", permanent: true },
      { source: "/academy", destination: "/", permanent: false },
      { source: "/team", destination: "/", permanent: false },
      { source: `/blog/${slug}`, destination: "/", permanent: false },
      { source: "/style-guide", destination: "/", permanent: false },
      ...WIX_REDIRECTS,
    ];
  },

  async headers() {
    return [
      {
        // Applies to every route, including static assets and API handlers.
        source: "/:path*",
        headers: [...securityHeaders],
      },
    ];
  },
};

/**
 * Sentry wraps the config to upload source maps at build time and instrument
 * the server. Source map upload is skipped automatically when
 * SENTRY_AUTH_TOKEN is absent, so local builds work without Sentry set up.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Quiet unless there is something actionable; CI logs stay readable.
  silent: !process.env.CI,

  // Upload source maps for the client bundle but do not ship them publicly.
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // NOTE: `disableLogger` is deliberately omitted. It is deprecated in favour
  // of `webpack.treeshake.removeDebugLogging`, which has no effect under
  // Turbopack — the default bundler in Next 16. Setting either one only emits
  // a deprecation warning on every build without shrinking the bundle.
});
