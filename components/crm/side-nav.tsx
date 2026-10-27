"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * `create`: quick ways to start something in the area (the rail's panel, components/crm/crm-rail);
 * `recent`: a list that opens there (the latest plans or quotes).
 */
export type NavGroup = {
  label: string;
  items: { href: string; label: string; count?: number }[];
  create?: { href: string; label: string; hint?: string }[];
  recent?: { label: string; all: string; items: { href: string; label: string; hint?: string }[] };
};

/** Sidebar on desktop, a scrollable strip on phones (as genesis-coworking's AdminNav). */
/** `title`: the bold heading over the desktop sidebar ("GENESIS MEDIA", as the tour's "YOUR AGENCY"). */
/** `phoneOnly`: just the strip (the CRM's desktop has its rail instead, components/crm/crm-rail). */
export function SideNav({ groups, root, label, title, phoneOnly = false }: { groups: NavGroup[]; root: string; label: string; title?: string; phoneOnly?: boolean }) {
  const path = usePathname() ?? root;
  const matches = (href: string) => (href === root ? path === root : path === href || path.startsWith(`${href}/`));
  /* The most specific item wins: /admin/expenses/gst lights GST, not Expenses too. */
  const best = groups.flatMap((g) => g.items.map((i) => i.href)).filter(matches).sort((a, b) => b.length - a.length)[0];
  const active = (href: string) => href === best;
  const link = (item: NavGroup["items"][number]) => (
    <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className="crm-nav-link justify-between">
      <span>{item.label}</span>
      {item.count ? <span className="rounded-full bg-[#ffc516] px-1.5 text-[0.6875rem] font-semibold leading-5 text-[#141216]">{item.count}</span> : null}
    </Link>
  );
  return (
    <>
      <nav aria-label={label} className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden">
        {groups.flatMap((g) => g.items).map(link)}
      </nav>
      {!phoneOnly && <nav aria-label={label} className="hidden lg:block">
        <div className="sticky top-20 space-y-6">
          {title && <p className="crm-side-title px-3.5">{title}</p>}
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-1.5 px-3.5 text-[0.6875rem] uppercase tracking-[0.12em] text-faint">{g.label}</p>
              <div className="flex flex-col gap-1">{g.items.map(link)}</div>
            </div>
          ))}
        </div>
      </nav>}
    </>
  );
}
