"use client";

import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { guideFor } from "@/lib/crm/guides";

import { TourOverlay } from "./tour-overlay";

/** "How it works" beside a page's title: that page's own walkthrough (lib/crm/guides). */
export function GuideButton() {
  const path = usePathname() ?? "";
  const guide = guideFor(path);
  const [open, setOpen] = useState(false);
  if (!guide) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="crm-btn crm-btn-secondary crm-btn-sm" title={guide.title}>
        <CircleHelp className="size-4" aria-hidden /> How it works
      </button>
      {open && <TourOverlay steps={guide.steps} onClose={() => setOpen(false)} startLabel="Show me" />}
    </>
  );
}
