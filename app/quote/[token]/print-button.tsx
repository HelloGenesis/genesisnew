"use client";

import { useEffect } from "react";

/**
 * DOWNLOAD PDF, ALWAYS OF THE LATEST VERSION (Genesis, 13 Oct 2026: "when I
 * save changes it doesn't reflect on the PDF"). A page left open from before
 * a save is reloaded first, then printed; a fresh one prints straight away.
 */
export function PrintButton() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("print")) return;
    url.searchParams.delete("print");
    window.history.replaceState(null, "", url);
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        if (performance.now() < 15_000) return window.print();
        const url = new URL(window.location.href);
        url.searchParams.set("print", "1");
        window.location.replace(url);
      }}
      className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-[0.875rem] font-medium text-[#0f172a]"
    >
      Download PDF
    </button>
  );
}
