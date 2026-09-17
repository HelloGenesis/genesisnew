import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security-headers";

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
  */
  async redirects() {
    const slug = ":slug([a-z0-9-]+)";
    return [
      { source: "/our-work", destination: "/#library", permanent: false },
      { source: `/work/${slug}`, destination: "/#library", permanent: false },
      { source: `/case-studies/${slug}`, destination: "/#case-studies", permanent: false },
      { source: `/avatars/${slug}`, destination: "/#ai-lab", permanent: false },
      { source: "/influencer-campaigns", destination: "/#influence", permanent: false },
      { source: "/content-creation", destination: "/#studios", permanent: false },
      { source: "/academy", destination: "/", permanent: false },
      { source: "/team", destination: "/", permanent: false },
      { source: "/blog", destination: "/", permanent: false },
      { source: `/blog/${slug}`, destination: "/", permanent: false },
      { source: "/style-guide", destination: "/", permanent: false },
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
