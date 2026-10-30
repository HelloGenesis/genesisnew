import type { Metadata } from "next";
import Link from "next/link";

import { GenesisMark } from "@/components/genesis/genesis-mark";
import { ProductWordmark } from "@/components/genesis/product-wordmark";
import { getViewer } from "@/lib/crm/session";
import { isDatabaseConfigured } from "@/lib/db";
import { ThemeToggle } from "@/components/genesis/theme-toggle";
import { HistoryNav } from "@/components/crm/history-nav";

import "./crm.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * THE CRM'S FRAME — sign-in, /admin (Genesis's control room) and /portal
 * (clients, agencies and vendors). None of the marketing site's chrome: no
 * smooth scroll, no atmosphere, no WhatsApp bubble — a working tool, in the
 * site's colours, fonts and both themes.
 */
export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  /* An agency's CRM is Nova by Genesis (and so is the live demo): its logo up top. */
  const viewer = isDatabaseConfigured() ? await getViewer().catch(() => null) : null;
  const nova = Boolean(viewer?.workspaceId);
  return (
    <div className="crm">
      <header className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--surface-base)_80%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href={nova ? "/admin" : "/"} aria-label={nova ? "Nova by Genesis" : "Genesis Media home"} className="flex items-center">
              {nova ? <ProductWordmark product="nova-small" className="h-[32px]" /> : <GenesisMark className="h-[16px] w-[8.5rem]" />}
            </Link>
            <HistoryNav />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="origin-right scale-[0.8]" />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
