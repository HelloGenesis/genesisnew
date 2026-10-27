"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { finishTour } from "@/app/(crm)/tour-actions";

import { ABOUT } from "@/lib/crm/tour-copy";

import { TourOverlay, type TourStep } from "./tour-overlay";

/**
 * THE TOUR (Genesis, 22 Oct 2026: "whenever someone new signs in there should
 * be a tour of the entire app and its features, and an option to view it").
 * It opens by itself the first time someone signs in, and again from "Take the
 * tour". Each step lights up one part of the sidebar (only the parts this
 * person's role can open) and says what it's for in a line or two.
 */

type Step = TourStep;


export function AppTour({ firstTime, name, area }: { firstTime: boolean; name: string | null; area: "admin" | "portal" }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const asked = params.get("tour") === "1";
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  /* The steps: this person's own sidebar, in its order, then the top bar. */
  const build = useCallback(() => {
    const seen = new Set<string>();
    /* Only the links on screen: on a desktop the CRM's rail shows one area's pages at a time (components/crm/crm-rail). */
    const links = [...document.querySelectorAll<HTMLAnchorElement>(`nav[aria-label="${area === "admin" ? "CRM" : "Portal"}"] a[href]`)].filter((a) => a.getClientRects().length > 0);
    const fromNav: Step[] = [];
    for (const a of links) {
      const href = a.getAttribute("href")!;
      if (seen.has(href) || !ABOUT[href]) continue;
      seen.add(href);
      fromNav.push({ target: `nav[aria-label="${area === "admin" ? "CRM" : "Portal"}"] a[href="${href}"]`, ...ABOUT[href]! });
    }
    const first = name ? name.split(" ")[0] : null;
    return [
      { title: `Welcome to Genesis${first ? `, ${first}` : ""}`, body: area === "admin" ? "A quick tour of the CRM: what each part does, in about a minute. You can leave any time and take it again from “Take the tour”." : "A quick tour of your portal: where your work, approvals and invoices are. You can take it again from “Take the tour”." },
      ...(document.querySelector('nav[aria-label="CRM areas"]')?.getClientRects().length ? [{ target: 'nav[aria-label="CRM areas"]', title: "The CRM's areas", body: "Home, Sales, Influence, Delivery, Money and Setup. Each icon opens that area's pages in the panel beside it; « folds the panel away for more room. The colourful one is the AI assistant." }] : []),
      ...fromNav,
      { target: 'nav[aria-label="Page history"]', title: "Back, forward, refresh", body: "Move between pages, and refresh to see a teammate's latest changes without losing what you've typed." },
      { title: "You're all set", body: "That's the tour. Find it again any time under “Take the tour” in the sidebar." },
    ];
  }, [area, name]);

  useEffect(() => {
    if (!(firstTime || asked)) return;
    /* After the page has drawn, so the sidebar is there to point at. */
    const t = window.setTimeout(() => {
      setSteps(build());
      setOpen(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [firstTime, asked, build]);

  const close = useCallback(() => {
    setOpen(false);
    void finishTour();
    if (asked) router.replace(path);
  }, [asked, path, router]);

  if (!open || steps.length === 0) return null;
  return <TourOverlay key={steps.length} steps={steps} onClose={close} />;
}
