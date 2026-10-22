"use client";

import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * BACK, FORWARD, REFRESH IN THE CRM'S BAR (Genesis, 22 Oct 2026). Needed most
 * when the CRM runs as an installed app ("Open in app"), which has no browser
 * buttons. Refresh fetches the page's data again without reloading it, so a
 * teammate's change shows and nothing typed is lost.
 */
export function HistoryNav() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [spun, setSpun] = useState(0);
  const button = "grid size-9 place-items-center rounded-full text-ash transition-colors hover:bg-[var(--crm-card-hover,var(--hover-wash))] hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc516]";
  return (
    <nav aria-label="Page history" className="flex items-center gap-0.5">
      <button type="button" onClick={() => router.back()} aria-label="Back" title="Back" className={button}>
        <ArrowLeft className="size-[1.125rem]" aria-hidden />
      </button>
      <button type="button" onClick={() => router.forward()} aria-label="Forward" title="Forward" className={button}>
        <ArrowRight className="size-[1.125rem]" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => {
          setSpun((n) => n + 1);
          start(() => router.refresh());
        }}
        aria-label="Refresh"
        title="Refresh"
        className={button}
      >
        <RotateCw key={spun} className={`size-[1.0625rem] ${pending ? "animate-spin" : ""}`} aria-hidden />
      </button>
    </nav>
  );
}
