"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

/** Share on its own (Genesis, 17 Nov 2026: "our share icon should be separate"): copies the client's link. */
export function CopyLinkButton({ url, label = "Share" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Copy the client's link"
      onClick={async () => {
        await navigator.clipboard.writeText(url).catch(() => window.prompt("Copy the link", url));
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
      className="crm-btn crm-btn-secondary crm-btn-sm"
    >
      {done ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} {done ? "Link copied" : label}
    </button>
  );
}
