"use client";

import { useRouter } from "next/navigation";

/**
 * EVERY ROW OPENS ITS RECORD (Genesis, 17 Nov 2026: "when you click on this it should open; on hover a hover
 * effect, clickable throughout"). A click anywhere on a table row follows the row's first link; links,
 * buttons and fields in the row still do their own thing. Cmd/Ctrl-click opens a new tab.
 */
export function ClickRows({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div
      className="crm-card overflow-x-auto"
      onClick={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest("a, button, input, select, textarea, label, summary, [role=menu]")) return;
        if (window.getSelection()?.toString()) return;
        const a = el.closest("tbody tr")?.querySelector<HTMLAnchorElement>("a[href]");
        if (!a) return;
        if (e.metaKey || e.ctrlKey || a.target === "_blank") window.open(a.href, "_blank", "noopener");
        else router.push(a.getAttribute("href")!);
      }}
    >
      {children}
    </div>
  );
}
