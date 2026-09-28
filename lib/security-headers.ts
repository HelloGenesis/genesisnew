/**
 * Security headers applied to every response.
 *
 * Kept in one place and consumed from `next.config.ts` so the policy is
 * defined once. This module must stay dependency-free and importable from
 * the Next config (which is evaluated outside the app runtime).
 */

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy.
 *
 * KNOWN LIMITATION — `script-src` includes `'unsafe-inline'`. Next.js inlines
 * its hydration/bootstrap payload in `<script>` tags, so a nonce-free policy
 * has to allow inline scripts. Eliminating it requires nonce injection at the
 * proxy layer, which conflicts with the Auth0 proxy owning the response for
 * every request (see PROGRESS.md → Hardening follow-ups). The policy still
 * meaningfully constrains *origins*: no third-party scripts, no framing, no
 * plugins, no off-site form posts.
 */
function contentSecurityPolicy(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      // Vercel Analytics serves from the same origin (/_vercel/insights/
      // script.js) once deployed to Vercel, but falls back to this host
      // everywhere else — including local dev. Allowlisted per Vercel's own
      // CSP guidance so the policy behaves identically in both.
      "https://va.vercel-scripts.com",
      // Razorpay Checkout, for membership payments (components/genesis/cart-page),
      // and the risk-detection script it loads itself.
      "https://checkout.razorpay.com",
      "https://cdn.razorpay.com",
      // Required by the dev-mode React refresh runtime only.
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // Tailwind and Framer Motion both write inline style attributes.
    "style-src": ["'self'", "'unsafe-inline'"],
    /*
       NOT `https:`. A wildcard image source is an exfiltration channel: with
       'unsafe-inline' unavoidably present in script-src (see above), any
       injected script could push stolen data off-site simply by setting an
       image URL. The only remote images this app loads are YouTube still
       frames, and `next.config.ts` already restricts optimisation to that one
       host — so the two policies now agree instead of one being ten thousand
       times wider than the other.
    */
    "img-src": ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://cdn.razorpay.com"],
    // YouTube embeds for the journal's video-linked articles. Restricted to
    // the nocookie host, and the frame only mounts on an explicit click.
    "frame-src": ["'self'", "https://www.youtube-nocookie.com", "https://api.razorpay.com", "https://checkout.razorpay.com"],
    "font-src": ["'self'", "data:"],
    "media-src": ["'self'", "https:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "connect-src": [
      "'self'",
      // Sentry ingest (region-specific subdomains).
      "https://*.ingest.sentry.io",
      "https://*.ingest.us.sentry.io",
      "https://*.ingest.de.sentry.io",
      // Auth0 tenant endpoints.
      "https://*.auth0.com",
      // Analytics posts to /_vercel/insights/event (same-origin) on Vercel;
      // these cover Speed Insights and the non-Vercel/dev fallback.
      "https://vitals.vercel-insights.com",
      "https://va.vercel-scripts.com",
      // Razorpay Checkout's own calls.
      "https://api.razorpay.com",
      "https://lumberjack.razorpay.com",
      "https://cdn.razorpay.com",
      // Dev server websocket for hot reload.
      ...(isDev ? ["ws:", "http://localhost:*"] : []),
    ],
  };

  const policy = Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ");

  // Only meaningful over HTTPS; harmless locally.
  return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy(),
  },
  {
    // 2 years, matching the HSTS preload list requirement.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Redundant with `frame-ancestors` above, kept for older browsers.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
] as const;
