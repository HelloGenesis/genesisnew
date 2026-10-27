"use client";

import {
  BadgeIndianRupee,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  ClipboardList,
  Compass,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderKanban,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  type LucideIcon,
  Megaphone,
  Plug,
  Receipt,
  Repeat,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { NavGroup } from "./side-nav";
import { usePref } from "./use-pref";

/*
 * THE CRM'S RAIL (Genesis, 27 Oct 2026, after Vitra's: "I want the CRM
 * dashboard to have these features, and everything is collapsible, proper
 * buttons"). On a desktop: a dark rail of the CRM's areas, and beside it that
 * area's pages in a panel that folds away («) to give the page the room. The
 * area you're in is lit; clicking another opens its pages. Phones keep the
 * strip of pages (components/crm/side-nav).
 */

/** An icon for each area, and for each page (by its address). */
const AREA_ICON: Record<string, LucideIcon> = { Today: LayoutGrid, Sales: TrendingUp, Influence: Megaphone, Delivery: FolderKanban, "My work": FolderKanban, Money: Wallet, Setup: Settings };
const AREA_LABEL: Record<string, string> = { Today: "Home", "My work": "Work" };
export const PAGE_ICON: Record<string, LucideIcon> = {
  "/admin": LayoutGrid,
  "/admin/notifications": Bell,
  "/admin/inbox": Inbox,
  "/admin/tasks": ListChecks,
  "/admin/assistant": Sparkles,
  "/admin/reports": TrendingUp,
  "/admin/leads": Users,
  "/admin/briefs": ClipboardList,
  "/admin/quotes": FileText,
  "/admin/reachout": Send,
  "/admin/invoices": Receipt,
  "/admin/accounts": Building2,
  "/admin/creators": Megaphone,
  "/admin/projects": FolderKanban,
  "/admin/requests": LifeBuoy,
  "/admin/vendors": Truck,
  "/admin/billing": CircleDollarSign,
  "/admin/payouts": BadgeIndianRupee,
  "/admin/expenses": Wallet,
  "/admin/expenses/subscriptions": Repeat,
  "/admin/expenses/gst": FileSpreadsheet,
  "/admin/staff": UserCog,
  "/admin/lab": FlaskConical,
  "/admin/team": Briefcase,
  "/admin/settings": Plug,
  "/admin?tour=1": Compass,
};
export const iconFor = (href: string) => PAGE_ICON[href] ?? BookOpen;
/* The areas set apart at the bottom of the rail, as Vitra's are. */
const LOWER = new Set(["Money", "Setup"]);

export function CrmRail({ groups, title, root = "/admin", footer }: { groups: NavGroup[]; title: string; root?: string; footer?: React.ReactNode }) {
  const path = usePathname() ?? root;
  /* Links with a query ("Take the tour") are actions, never the page you're on. */
  const matches = (href: string) => !href.includes("?") && (href === root ? path === root : path === href || path.startsWith(`${href}/`));
  const best = groups.flatMap((g) => g.items.map((i) => i.href)).filter(matches).sort((a, b) => b.length - a.length)[0];
  const here = groups.find((g) => g.items.some((i) => i.href === best))?.label ?? groups[0]?.label;
  /* The area whose pages are showing: the one you're in, until you pick another. */
  const [picked, setPicked] = useState<{ label: string; at: string } | null>(null);
  const area = picked && picked.at === path ? picked.label : here;
  const [open, setOpen] = usePref("crm-rail-panel", true);
  const group = groups.find((g) => g.label === area) ?? groups[0];
  const counts = (g: NavGroup) => g.items.reduce((s, i) => s + (i.count ?? 0), 0);

  const railButton = (g: NavGroup) => {
    const Icon = AREA_ICON[g.label] ?? LayoutGrid;
    const lit = g.label === area && open;
    const inside = g.label === here;
    const n = counts(g);
    return (
      <button
        key={g.label}
        type="button"
        onClick={() => {
          if (g.label === area && open) return setOpen(false);
          setPicked({ label: g.label, at: path });
          setOpen(true);
        }}
        aria-pressed={lit}
        aria-label={`${AREA_LABEL[g.label] ?? g.label}${n ? `, ${n} waiting` : ""}`}
        className="group flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[0.6875rem] text-white/65 transition-colors hover:text-white"
      >
        <span className={`relative grid size-11 place-items-center rounded-xl transition-colors ${lit ? "bg-white text-[#141216] ring-2 ring-[#ffc516] ring-offset-2 ring-offset-[#18171b]" : inside ? "bg-white/15 text-white" : "group-hover:bg-white/10"}`}>
          <Icon className="size-5" aria-hidden />
          {n > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#ffc516] px-1 text-[0.625rem] font-semibold leading-4 text-[#141216]">{n > 99 ? "99+" : n}</span>}
        </span>
        <span className={lit || inside ? "font-medium text-white" : ""}>{AREA_LABEL[g.label] ?? g.label}</span>
      </button>
    );
  };

  return (
    <div className="sticky top-20 flex h-[calc(100svh-6rem)] gap-3">
      {/* The rail. */}
      <nav aria-label="CRM areas" className="flex w-[4.75rem] shrink-0 flex-col items-center rounded-[1.25rem] bg-[#18171b] px-1.5 py-3 shadow-[var(--shadow-float)]">
        <Link href={root} className="mb-3 grid size-11 place-items-center rounded-xl bg-[#ffc516]" aria-label="Dashboard" title={title}>
          <Image src="/brand/genesis-n.png" alt="" width={18} height={30} className="h-6 w-auto invert" />
        </Link>
        <div className="flex w-full flex-1 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none]">
          {groups.filter((g) => !LOWER.has(g.label)).map(railButton)}
          <Link href="/admin/assistant" aria-label="AI assistant" className="group flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[0.6875rem] text-white/65 hover:text-white">
            <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#ffc516] text-[#141216] ${path.startsWith("/admin/assistant") ? "ring-2 ring-white ring-offset-2 ring-offset-[#18171b]" : "opacity-90 group-hover:opacity-100"}`}>
              <Sparkles className="size-5" aria-hidden />
            </span>
            <span className={path.startsWith("/admin/assistant") ? "font-medium text-white" : ""}>AI</span>
          </Link>
          {groups.some((g) => LOWER.has(g.label)) && <span aria-hidden className="mx-auto my-2 h-px w-10 bg-white/15" />}
          {groups.filter((g) => LOWER.has(g.label)).map(railButton)}
        </div>
        {footer}
      </nav>

      {/* The area's pages, in a panel that folds away. */}
      {open && group && (
        <nav aria-label="CRM" className="crm-card flex w-[15rem] shrink-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--glass-border)] px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-[0.6875rem] uppercase tracking-[0.14em] text-faint">{title}</p>
              <p className="truncate text-[0.9375rem] font-semibold uppercase tracking-[0.08em] text-bone">{group.label === "Today" ? "Home" : group.label}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fold the panel away" title="Fold away" className="grid size-8 shrink-0 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
              <ChevronsLeft className="size-4" aria-hidden />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5" data-lenis-prevent>
            {group.items.map((item) => {
              const Icon = iconFor(item.href);
              const active = item.href === best;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.9375rem] transition-colors ${active ? "bg-[#ffc516]/15 font-medium text-bone" : "text-ash hover:bg-[var(--hover-wash)] hover:text-bone"}`}>
                  <Icon className={`size-[1.125rem] shrink-0 ${active ? "text-[#ffc516]" : ""}`} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count ? <span className="rounded-full bg-[#ffc516] px-1.5 text-[0.6875rem] font-semibold leading-5 text-[#141216]">{item.count}</span> : null}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      {!open && (
        <button type="button" onClick={() => setOpen(true)} aria-label="Show the panel" title="Show the pages" className="-ml-1.5 mt-3 grid h-10 w-5 place-items-center self-start rounded-r-lg border border-l-0 border-[var(--glass-border)] bg-[var(--crm-card)] text-ash hover:text-bone">
          <ChevronsRight className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** The rail's foot: who's signed in, with the portal and sign out (a form post, never a link: a prefetch would sign you out). */
export function RailUser({ name, email, roles, portal }: { name: string | null; email: string | null; roles: string; portal: boolean }) {
  const [menu, setMenu] = useState(false);
  const n = (name ?? email ?? "?").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  const letters = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : (parts[0]?.[1] ?? ""))).toUpperCase() || "?";
  return (
    <div className="relative mt-2">
      <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label={`${n}: account menu`} className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#ffc516] to-[#f472b6] text-[0.8125rem] font-semibold text-[#141216]">
        {letters}
      </button>
      {menu && (
        <div className="absolute bottom-0 left-14 z-40 w-56 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-2 text-[0.875rem] shadow-[var(--shadow-float)]">
          <p className="truncate px-2.5 pt-1.5 text-bone">{n}</p>
          <p className="truncate px-2.5 pb-2 text-[0.75rem] text-faint">{roles}</p>
          {portal && <Link href="/portal" className="block rounded-lg px-2.5 py-2 text-ash hover:bg-[var(--hover-wash)] hover:text-bone">Client portal</Link>}
          <form action="/signout" method="post">
            <button type="submit" className="block w-full rounded-lg px-2.5 py-2 text-left text-ash hover:bg-[var(--hover-wash)] hover:text-[#dc2626]">Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}
