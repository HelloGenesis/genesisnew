"use client";

import { useEffect } from "react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { SectionLabel } from "@/components/genesis/section-label";

/**
 * Route-level error boundary.
 *
 * Reports to Sentry on mount rather than relying on the global handler: an
 * error caught by a boundary never reaches `window.onerror`, so without this
 * it would render a friendly page and be silently lost.
 *
 * The digest is surfaced deliberately — it is the only handle a user can give
 * support that ties their report to a specific server-side failure.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Imported here rather than at the top so an error boundary — which sits
    // in every page's tree — does not put the SDK in every page's bundle.
    // See instrumentation-client.ts.
    void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
  }, [error]);

  return (
    <Atmosphere tone="brand" origin="top" intensity={0.2} className="min-h-dvh">
      <div className="relative z-[2] mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        <SectionLabel dot>Something went wrong</SectionLabel>

        <h1 className="mt-6 text-balance text-h2 font-normal leading-[1.1] tracking-tight text-bone sm:text-h1">
          This page didn&rsquo;t{" "}
          <span className="font-serif font-normal italic text-brand-ink">load</span>
        </h1>

        <p className="mt-6 max-w-md text-small leading-relaxed text-ash">
          The error has been reported. Trying again often works — it may have
          been a momentary fault.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <GlassButton onClick={reset} variant="brand" size="lg">
            Try again
          </GlassButton>
          <GlassButton href="/" variant="glass" size="lg">
            Back to the homepage
          </GlassButton>
        </div>

        {error.digest && (
          <p className="mt-12 text-small text-faint">
            Reference: <code className="text-ash">{error.digest}</code>
          </p>
        )}
      </div>
    </Atmosphere>
  );
}
