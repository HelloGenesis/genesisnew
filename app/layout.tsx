import Script from "next/script";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";

import { INDEXABLE, SITE_URL } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import "./globals.css";

/*
 * THE BRAND TYPEFACES, from the Genesis Media brand guidelines.
 *
 * Codec Pro is the text face and Mont is the display face — the wordmark in
 * the guidelines is set in Mont's heavy weight, which is why headings use it
 * rather than a bolder cut of Codec.
 *
 * Self-hosted rather than fetched: the CSP allows no external font host, and
 * next/font/local also removes the layout shift a webfont would otherwise
 * cause.
 *
 * TWO THINGS TO RESOLVE BEFORE LAUNCH.
 *
 * 1. LICENSING. The supplied Codec Pro is the CC BY-NC release — non
 *    commercial — and both Mont files are DEMO cuts under a trial EULA.
 *    Neither is licensed for a commercial agency site. The retail licences
 *    need buying; the files then drop in here unchanged.
 *
 * 2. MISSING WEIGHTS. Codec Pro arrived as Regular and Italic only, with no
 *    bold, and Mont as ExtraLight and Heavy with nothing between. So there is
 *    no semibold anywhere in the system. Headings take Mont Heavy, body takes
 *    Codec Pro Regular, and any `font-medium`/`font-semibold` on body copy is
 *    synthesised by the browser — which is why the type scale leans on SIZE
 *    and colour for hierarchy rather than weight. Codec Pro Bold and Mont
 *    Regular/Book would fix that.
 */
const codecPro = localFont({
  src: [
    { path: "./fonts/CodecPro-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/CodecPro-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
  // Measured against the file so the fallback occupies the same space.
  fallback: ["system-ui", "sans-serif"],
});

const mont = localFont({
  src: [
    { path: "./fonts/Mont-ExtraLightDEMO.woff2", weight: "200", style: "normal" },
    { path: "./fonts/Mont-HeavyDEMO.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/*
  THE DEFAULTS, for the few routes that do not build their own metadata —
  the 404 and /insider. Every marketing page replaces all of this through
  pageMetadata() in lib/seo, which is where the reasoning lives.

  metadataBase IS THE PRODUCTION ORIGIN, NOT APP_BASE_URL. That variable is
  the Auth0 SDK's and is deliberately left unset on Vercel previews, so it
  made canonicals, og:url and share images follow whichever host built the
  page. SITE_URL does not move.
*/
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_IN",
    images: [{ url: "/og", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: { card: "summary_large_image" },
  ...(INDEXABLE ? {} : { robots: { index: false, follow: false } }),
  /*
    Search Console ownership by meta tag, for when DNS verification is not an
    option. Set GOOGLE_SITE_VERIFICATION to the token Search Console gives;
    unset, nothing is printed.
  */
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `suppressHydrationWarning` because the script below stamps `data-theme`
    // on this element before React hydrates. Without it React reports the
    // mismatch it is being asked to tolerate.
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark font-sans", codecPro.variable, mont.variable)}
    >
      <head>
        {/*
          NO-FLASH THEME STAMP. This has to run before first paint, which is
          why it is an inline blocking script rather than an effect: an effect
          runs after hydration, and the visitor would see a full dark page
          repaint to light. Nothing else on the site is allowed to be a
          render-blocking script; this one earns it because the alternative is
          visible.

          DARK IS THE DEFAULT, NOT THE OS. Absent from storage used to mean
          "follow the OS" — nothing was stamped and the prefers-color-scheme
          blocks in globals.css resolved it — so a visitor whose laptop is set
          to light mode met Genesis in the editorial theme on their very first
          visit, having never asked for it. Genesis: "keep default as dark
          mode — koi pehli baar khulega toh dark mode hi khule."

          It is the right default for this site rather than a preference. The
          orb, the division gradients and the whole first section are drawn in
          light inks that only hold on a dark ground; the light theme is a
          deliberate second reading of the site, not the one it is designed
          around. So the first impression is the one Genesis designed.

          THE TOGGLE IS UNAFFECTED. It writes an explicit choice to storage
          and that choice still wins in both directions and still persists —
          this only changes what happens when there is nothing stored.
        */}
        {/*
          THROUGH next/script, NOT A BARE <script>, and the reason is a real
          warning rather than tidiness. React 19 logs "Encountered a script tag
          while rendering React component" for an inline <script> in the tree:
          it is emitted in the server HTML and runs there, but on any CLIENT
          render React does not execute it. For a theme stamp that only ever
          needs to run on first paint that is harmless in practice, which is
          exactly why it is worth routing properly rather than leaving a
          standing console error for every other error to hide in.

          `beforeInteractive` is the strategy that matches what this does: it
          runs before Next's own code and before hydration, which is the whole
          point of stamping data-theme ahead of first paint. Next requires such
          scripts to live in the root layout, which is where this already is.
        */}
        <Script id="genesis-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("genesis-theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){document.documentElement.setAttribute("data-theme","dark")}})()`}
        </Script>
      </head>
      <body
        className="bg-background text-foreground antialiased"
        /*
          BROWSER EXTENSIONS WRITE TO <body> BEFORE REACT HYDRATES. Grammarly
          stamps data-gr-ext-installed and data-new-gr-c-s-check-loaded on it,
          and form-fillers add their own attributes to inputs. React sees the
          server HTML and the live DOM disagree and reports a hydration
          mismatch that no change to this codebase can fix, because the
          difference is not ours. Suppressing it here keeps a real mismatch —
          one we could actually cause — visible instead of buried under this.
        */
        suppressHydrationWarning
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
