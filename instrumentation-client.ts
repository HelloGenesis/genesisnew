import type * as SentryModule from "@sentry/nextjs";

/*
  Browser-side Sentry initialisation. Next.js loads this file automatically on
  the client (the successor to `sentry.client.config.ts`).

  THE SDK IS LOADED AFTER THE PAGE, NOT WITH IT. A static import here put
  @sentry/nextjs — about 130KB gzipped with tracing — into the same chunk as
  React, so every visitor on every page downloaded, parsed and evaluated it
  before the page could hydrate. On a mobile Lighthouse run that chunk was the
  largest single file on the homepage. Error reporting does not need to be up
  before the page is; it needs to not lose errors. So:

    1. Two tiny listeners are attached immediately and hold on to any error
       or unhandled rejection that happens before the SDK arrives.
    2. Once the page has loaded and the browser is idle, the SDK is imported,
       initialised, and handed everything that was held.

  What this gives up is the page-load trace span, which now starts late.
  Errors — the thing this is actually used for — are all still reported.
*/

type Sentry = typeof SentryModule;

let sentry: Sentry | undefined;
const early: unknown[] = [];

const hold = (event: ErrorEvent | PromiseRejectionEvent) => {
  early.push("reason" in event ? event.reason : (event.error ?? event.message));
};

function load() {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: true,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      // Session Replay stays off for now — it records user sessions and needs a
      // privacy review plus a decision on the cookie/consent banner first.
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,

      sendDefaultPii: false,
      debug: false,
    });
    sentry = Sentry;

    window.removeEventListener("error", hold);
    window.removeEventListener("unhandledrejection", hold);
    for (const error of early.splice(0)) Sentry.captureException(error);
  });
}

if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== "undefined") {
  window.addEventListener("error", hold);
  window.addEventListener("unhandledrejection", hold);

  const whenIdle = () =>
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(load, { timeout: 4000 })
      : window.setTimeout(load, 1500);

  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
}

/** Instruments client-side navigations for tracing, once the SDK is up. */
export function onRouterTransitionStart(
  ...args: Parameters<Sentry["captureRouterTransitionStart"]>
) {
  sentry?.captureRouterTransitionStart(...args);
}
