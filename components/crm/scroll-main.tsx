"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * THE PAGE SCROLLS, THE MENU STAYS (Genesis, 29 Oct 2026: "this should scroll
 * differently and the left one should stay on screen, all across"). On a
 * desktop the CRM is one window-high frame and only the page inside it
 * scrolls; a new page starts at its top, as a page load would.
 */
export function ScrollMain({ className, children }: { className?: string; children: React.ReactNode }) {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollTo(0, 0);
  }, [path]);
  return (
    <main ref={ref} className={className}>
      {children}
    </main>
  );
}
