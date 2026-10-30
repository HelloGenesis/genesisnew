"use client";

import {
  BadgeIndianRupee,
  Bell,
  Blocks,
  BookOpen,
  ChartColumn,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  DoorOpen,
  CircleDollarSign,
  ClipboardList,
  Compass,
  Contact,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Film,
  FolderKanban,
  FolderUp,
  Gauge,
  History,
  Inbox,
  Lightbulb,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  type LucideIcon,
  Megaphone,
  Plug,
  Plus,
  Receipt,
  Repeat,
  ScanFace,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { ProBadge } from "./pro-badge";
import { usePathname, useSearchParams } from "next/navigation";
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
const AREA_ICON: Record<string, LucideIcon> = { Today: LayoutGrid, Sales: TrendingUp, Influence: Megaphone, Delivery: FolderKanban, "My work": FolderKanban, Portal: DoorOpen, Money: Wallet, Setup: Settings };
const AREA_LABEL: Record<string, string> = { Today: "Home", "My work": "Work" };
/* What each area is for, under its name in the panel. */
const AREA_HINT: Record<string, string> = {
  Today: "Your day: tasks, alerts and inbox",
  Sales: "Leads, briefs, clients and quotes",
  Influence: "Creators, plans and reach-outs",
  Delivery: "Projects, requests and crew",
  "My work": "Your projects and requests",
  Money: "Invoices, billing and spend",
  Portal: "Your vendors and crew",
  Setup: "Your team and the CRM",
};
export const PAGE_ICON: Record<string, LucideIcon> = {
  "/admin": LayoutGrid,
  "/admin/notifications": Bell,
  "/admin/inbox": Inbox,
  "/admin/tasks": ListChecks,
  "/admin/features": Blocks,
  "/admin/assistant": Sparkles,
  "/admin/assistant/usage": Gauge,
  "/admin/reports": ChartColumn,
  "/admin/leads": Users,
  "/admin/briefs": Lightbulb,
  "/admin/quotes": FileText,
  "/admin/quotes?type=quotes": FileText,
  "/admin/quotes?type=plans": ClipboardList,
  "/admin/reachout": Send,
  "/admin/invoices": Receipt,
  "/admin/accounts": Building2,
  "/admin/creators": Contact,
  "/admin/projects": FolderKanban,
  "/admin/requests": LifeBuoy,
  "/admin/vendors": Truck,
  "/admin/files": FolderUp,
  "/admin/creatives": Film,
  "/admin/billing": CircleDollarSign,
  "/admin/payouts": BadgeIndianRupee,
  "/admin/expenses": Wallet,
  "/admin/expenses/subscriptions": Repeat,
  "/admin/expenses/gst": FileSpreadsheet,
  "/admin/gst": FileSpreadsheet,
  "/admin/staff": UserCog,
  "/admin/plan": CreditCard,
  "/admin/me": UserCog,
  "/admin/lab": FlaskConical,
  "/admin/lab/avatars": ScanFace,
  "/admin/team": Briefcase,
  "/admin/settings": Plug,
  "/admin?tour=1": Compass,
};
export const iconFor = (href: string) => PAGE_ICON[href] ?? BookOpen;
/* Every rail item the same size, icon and label on one centre line. */
/* Items share the rail's height: full size on a tall screen, closer together on a laptop, never hidden. */
const ITEM = "group flex min-h-[3.375rem] max-h-[3.75rem] w-full flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-[0.6875rem] text-white/65 transition-colors hover:text-white";
const TILE = "relative grid size-8 shrink-0 place-items-center rounded-xl transition-colors";
/* The areas set apart at the bottom of the rail, as Vitra's are. */
const TOP_SHORTCUT = "/admin/tasks";
const LOWER = new Set(["Portal", "Money", "Setup"]);
/*
 * PAGES STRAIGHT ON THE RAIL (Genesis, 28 Oct 2026: "Files, Tasks, Inbox,
 * Notifications, Creative Library, Reports … all I want here"): one click,
 * between the areas and Money/Setup, when this person has them. Notifications
 * is the bell at the foot.
 */
const SHORTCUTS: { href: string; label: string }[] = [
  /* All features, off the dashboard (Genesis, 31 Oct 2026). */
  { href: "/admin/features", label: "Features" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/files", label: "Files" },
  { href: "/admin/creatives", label: "Creatives" },
  { href: "/admin/lab/avatars", label: "Avatars" },
  { href: "/admin/reports", label: "Reports" },
];

export function CrmRail({ groups, title, root = "/admin", footer }: { groups: NavGroup[]; title: string; root?: string; footer?: React.ReactNode }) {
  const path = usePathname() ?? root;
  const aiLink = groups.flatMap((g) => g.items).find((i) => i.href === "/admin/assistant");
  const search = useSearchParams();
  /*
   * WHICH PAGE YOU'RE ON: the longest matching address; a link with a query
   * ("Quotes & proposals" is /admin/quotes?type=quotes) wins when its query
   * matches too. A new plan (?kind=INFLUENCER_PLAN) counts as the plans.
   * "Take the tour" is an action, never the page you're on.
   */
  const param = (k: string) => (k === "type" ? (search?.get("type") ?? (search?.get("kind") === "INFLUENCER_PLAN" ? "plans" : null)) : (search?.get(k) ?? null));
  const score = (href: string) => {
    const [p, qs] = href.split("?") as [string, string | undefined];
    if (qs && new URLSearchParams(qs).has("tour")) return -1;
    if (!(p === root ? path === root : path === p || path.startsWith(`${p}/`))) return -1;
    const fits = qs ? [...new URLSearchParams(qs)].every(([k, v]) => param(k) === v) : true;
    return p.length * 10 + (fits ? 5 : 0);
  };
  const best = groups
    .flatMap((g) => g.items.map((i) => i.href))
    .map((href) => [href, score(href)] as const)
    .filter(([, n]) => n >= 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const here = groups.find((g) => g.items.some((i) => i.href === best))?.label ?? groups[0]?.label;
  /* The area whose pages are showing: the one you're in, until you pick another. */
  const [picked, setPicked] = useState<{ label: string; at: string } | null>(null);
  const area = picked && picked.at === path ? picked.label : here;
  const [open, setOpen] = usePref("crm-rail-panel", true);
  const group = groups.find((g) => g.label === area) ?? groups[0];
  const counts = (g: NavGroup) => g.items.reduce((s, i) => s + (i.count ?? 0), 0);
  /* The rail's own links, only for pages this person's areas include. */
  const pages = groups.flatMap((g) => g.items);
  const shortcuts = SHORTCUTS.flatMap((sc) => {
    const item = pages.find((i) => i.href === sc.href);
    return item ? [{ ...sc, count: item.count }] : [];
  });
  const bell = pages.find((i) => i.href === "/admin/notifications");

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
        className={ITEM}
      >
        <span className={`${TILE} ${lit ? "bg-white text-[#141216] shadow-[0_0_0_2px_#ffc516]" : inside ? "bg-white/15 text-white" : "group-hover:bg-white/10"}`}>
          <Icon className="size-[1.125rem]" aria-hidden />
          {/* Something waiting in this area: a dot here, the numbers in its panel. */}
          {n > 0 && <span aria-hidden className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc516] ring-2 ring-[#18171b]" />}
        </span>
        <span className={`leading-none ${lit || inside ? "font-medium text-white" : ""}`}>{AREA_LABEL[g.label] ?? g.label}</span>
      </button>
    );
  };

  /* One quick link (Inbox, Tasks, Files…). */
  const shortcutLink = (sc: (typeof shortcuts)[number]) => {
    const Icon = iconFor(sc.href);
    const lit = sc.href === best;
    return (
      <Link key={sc.href} href={sc.href} aria-current={lit ? "page" : undefined} aria-label={`${sc.label}${sc.count ? `, ${sc.count} waiting` : ""}`} className={ITEM}>
        <span className={`${TILE} ${lit ? "bg-white text-[#141216] shadow-[0_0_0_2px_#ffc516]" : "group-hover:bg-white/10"}`}>
          <Icon className="size-[1.125rem]" aria-hidden />
          {!!sc.count && <span aria-hidden className="absolute right-1 top-1 size-2 rounded-full bg-[#ffc516] ring-2 ring-[#18171b]" />}
        </span>
        <span className={`leading-none ${lit ? "font-medium text-white" : ""}`}>{sc.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-full gap-3">
      {/* The rail. */}
      <nav aria-label="CRM areas" className="flex w-[4.75rem] shrink-0 flex-col items-center rounded-[1.25rem] bg-[#18171b] px-1.5 py-3 shadow-[var(--shadow-float)]">
        {/* Genesis's N, as the favicon (app/icon.svg): yellow on white. */}
        <Link href={root} className="mb-2 grid size-11 shrink-0 place-items-center rounded-xl bg-white" aria-label="Dashboard" title={title}>
          <svg viewBox="0 0 306 500" className="h-6 w-auto" aria-hidden>
            <g fill="#ffd400">
              <polygon points="30,0 306,0 306,340.7" />
              <polygon points="0,149.1 284.25,500 0,500" />
            </g>
          </svg>
        </Link>
        <span aria-hidden className="mx-auto mb-1 h-px w-10 bg-white/15" />
        {/* Scrolls when the window is too short for every icon (Genesis, 29 Oct 2026: "add a scroller here"); icons never squash into each other. */}
        <div className="-mr-1 flex min-h-0 w-[calc(100%+0.25rem)] flex-1 flex-col overflow-y-auto pr-1" data-lenis-prevent>
          {/* Tasks sits at the top, under Home (Genesis, 31 Oct 2026: "move this on top"). */}
          {groups.filter((g) => !LOWER.has(g.label)).flatMap((g, i) => (i === 0 ? [railButton(g), ...shortcuts.filter((sc) => sc.href === TOP_SHORTCUT).map(shortcutLink)] : [railButton(g)]))}
          {/* Genesis Copilot for its owners, NOVA AI in an agency's CRM (lib/crm/scope; the nav keeps the link only for them). */}
          {aiLink && (
          <Link href="/admin/assistant" aria-label={aiLink.label} className={ITEM}>
            <span className={`${TILE} bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#ffc516] text-[#141216] ${path.startsWith("/admin/assistant") ? "shadow-[0_0_0_2px_#fff]" : "opacity-90 group-hover:opacity-100"}`}>
              <Sparkles className="size-[1.125rem]" aria-hidden />
            </span>
            <span className={`leading-none ${path.startsWith("/admin/assistant") ? "font-medium text-white" : ""}`}>{aiLink.label === "NOVA AI" ? "NOVA AI" : "Copilot"}</span>
          </Link>
          )}
          {shortcuts.length > 0 && <span aria-hidden className="mx-auto my-1 h-px w-10 shrink-0 bg-white/15" />}
          {shortcuts.filter((sc) => sc.href !== TOP_SHORTCUT).map(shortcutLink)}
          {groups.some((g) => LOWER.has(g.label)) && <span aria-hidden className="mx-auto my-1 h-px w-10 shrink-0 bg-white/15" />}
          {groups.filter((g) => LOWER.has(g.label)).map(railButton)}
        </div>
        {bell && (
          <Link href={bell.href} aria-current={bell.href === best ? "page" : undefined} aria-label={`Notifications${bell.count ? `, ${bell.count} unread` : ""}`} title="Notifications" className={`relative mt-1 grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${bell.href === best ? "bg-white text-[#141216]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
            <Bell className="size-5" aria-hidden />
            {!!bell.count && <span aria-hidden className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[#ffc516] px-1 text-center text-[0.625rem] font-semibold leading-4 text-[#141216] ring-2 ring-[#18171b]">{bell.count > 99 ? "99+" : bell.count}</span>}
          </Link>
        )}
        {footer}
      </nav>

      {/* The area's pages, in a panel that folds away. */}
      {open && group && (
        <nav aria-label="CRM" className="crm-card flex w-[15rem] shrink-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--glass-border)] px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-[0.6875rem] uppercase tracking-[0.14em] text-faint">{title}</p>
              <p className="truncate text-[0.9375rem] font-semibold uppercase tracking-[0.08em] text-bone">{AREA_LABEL[group.label] ?? group.label}</p>
              {AREA_HINT[group.label] && <p className="mt-0.5 text-[0.75rem] leading-snug text-ash">{AREA_HINT[group.label]}</p>}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fold the panel away" title="Fold away" className="grid size-8 shrink-0 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
              <ChevronsLeft className="size-4" aria-hidden />
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto p-2.5" data-lenis-prevent>
            <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = iconFor(item.href);
              const active = item.href === best;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.9375rem] transition-colors ${active ? "bg-[#ffc516]/15 font-medium text-bone" : "text-ash hover:bg-[var(--hover-wash)] hover:text-bone"}`}>
                  <Icon className={`size-[1.125rem] shrink-0 ${active ? "text-[#ffc516]" : ""}`} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.pro && <ProBadge />}
                  {item.count ? <span className="rounded-full bg-[#ffc516] px-1.5 text-[0.6875rem] font-semibold leading-5 text-[#141216]">{item.count}</span> : null}
                </Link>
              );
            })}
            </div>
            {/* Starting points: a new plan, a lead, a quote from the AI… */}
            {!!group.create?.length && (
              <>
                <p className="mb-1 mt-5 px-3 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Create</p>
                <div className="flex flex-col gap-0.5">
                  {group.create.map((c) => (
                    <Link key={c.href} href={c.href} className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.875rem] text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone">
                      <span className={`grid size-[1.125rem] shrink-0 place-items-center rounded-md ${c.href.startsWith("/admin/assistant") ? "bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#ffc516] text-[#141216]" : "bg-[#ffc516]/15 text-[#ffc516]"}`}>
                        {c.href.startsWith("/admin/assistant") ? <Sparkles className="size-3" aria-hidden /> : <Plus className="size-3" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {group.recent && <RecentList area={group.label} recent={group.recent} />}
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

/** "Check existing plans": the latest few, opened from the panel (Genesis, 27 Oct 2026: "then a list appears"). */
function RecentList({ area, recent }: { area: string; recent: NonNullable<NavGroup["recent"]> }) {
  const [open, setOpen] = usePref(`crm-rail-recent:${area}`, false);
  return (
    <div className="mt-5">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.875rem] text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone">
        <History className="size-[1.125rem] shrink-0" aria-hidden />
        <span className="flex-1">{recent.label}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5 border-l border-[var(--glass-border)] pl-2 ml-5">
          {recent.items.map((r) => (
            <Link key={r.href} href={r.href} className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
              <span className="block truncate">{r.label}</span>
              {r.hint && <span className="block text-[0.6875rem] text-faint">{r.hint}</span>}
            </Link>
          ))}
          <Link href={recent.all} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.8125rem] text-[#ffc516] hover:underline">See all <ChevronsRight className="size-3.5" aria-hidden /></Link>
        </div>
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
