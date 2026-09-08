"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Last-resort boundary, for failures in the root layout itself.
 *
 * It must render its own <html> and <body>: at this point the root layout has
 * failed, so nothing above it exists. For the same reason it cannot use the
 * design-system components — they assume a layout that is not there — so the
 * styling is inline and deliberately minimal.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#0a0a0b",
          color: "#f5f5f4",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#a3a3a3",
              margin: 0,
            }}
          >
            Genesis Media
          </p>
          <h1
            style={{
              marginTop: "1.5rem",
              fontSize: "1.75rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Something went badly wrong
          </h1>
          <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#a3a3a3" }}>
            The error has been reported. Please reload the page.
          </p>
          {/*
            A plain anchor on purpose. This boundary catches failures in the
            root layout itself, so the router may not be mounted; next/link
            would depend on the very thing that just broke. A full document
            navigation is the only reliable way out of here.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "2rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              background: "linear-gradient(180deg,#ffd658 0%,#ffc516 45%,#e0ad13 100%)",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Back to the homepage
          </a>
          {error.digest && (
            <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#6b6b70" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
