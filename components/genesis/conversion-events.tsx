"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

/**
 * CONVERSION EVENTS, SITE-WIDE, FROM ONE LISTENER.
 *
 * Until this existed the only thing measured was page views, so there was no
 * way to know which button a lead came from — every contact CTA ends in the
 * same WhatsApp chat. One capture-phase listener on the document records:
 *
 *   whatsapp_click — any link to wa.me, with the button's label and page
 *   cta_click      — anything carrying `data-track="<name>"` (plan buttons,
 *                    the calendar's booking button, the /pricing tabs)
 *
 * CAPTURE PHASE, like the work grid's filter listener, because SmoothScroll
 * stops hash-link clicks before React's own handlers run.
 *
 * These are Vercel Web Analytics custom events: they appear under Events in
 * the Vercel dashboard (custom events need a Pro or Enterprise plan). No
 * personal data is sent — a label, a page path and, for plans, the plan name.
 */
export function ConversionEvents() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const tagged = target?.closest?.("[data-track]");
      const link = target?.closest?.("a");
      const path = window.location.pathname;

      if (tagged) {
        track("cta_click", {
          name: tagged.getAttribute("data-track") ?? "",
          label: labelOf(tagged),
          path,
        });
      }
      const href = link?.getAttribute("href") ?? "";
      if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) {
        track("whatsapp_click", { label: labelOf(link!), path });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

function labelOf(element: Element) {
  return (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
}
