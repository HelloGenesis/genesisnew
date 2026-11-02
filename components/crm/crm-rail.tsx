"use client";

import {
  BadgeIndianRupee,
  Bell,
  Blocks,
  BookOpen,
  ChevronRight,
  Briefcase,
  Building2,
  ChartColumn,
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
  FolderOpen,
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
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  Receipt,
  Repeat,
  ScanFace,
  Send,
  Settings,
  Settings2,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { ProBadge } from "./pro-badge";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { NavGroup } from "./side-nav";

/*
 * THE CRM'S RAIL (Genesis, 27 Oct 2026, after Vitra's: "I want the CRM
 * dashboard to have these features, and everything is collapsible, proper
 * buttons"). On a desktop: a dark rail of the CRM's areas, and beside it that
 * area's pages in a panel that folds away («) to give the page the room. The
 * area you're in is lit; clicking another opens its pages. Phones keep the
 * strip of pages (components/crm/side-nav).
 */

/** An icon for each area, and for each page (by its address). */
const AREA_LABEL: Record<string, string> = { Today: "Home", "My work": "Work" };
/* What each area is for, under its name in its menu. */
const AREA_HINT: Record<string, string> = {
  Today: "Your day: tasks, alerts and inbox",
  Sales: "Leads, briefs, clients and quotes",
  Influence: "Creators, plans and reach-outs",
  Delivery: "Projects, requests and crew",
  "My work": "Your projects and requests",
  Money: "Invoices, billing and spend",
  Portal: "Your brands, clients, vendors and crew",
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
  "/admin/assistant/settings": Settings2,
  "/admin/analytics": ChartColumn,
  "/admin/reports": ChartColumn,
  "/admin/leads": Users,
  "/admin/briefs": Lightbulb,
  "/admin/quotes": FileText,
  "/admin/quotes?type=quotes": FileText,
  "/admin/quotes?type=plans": ClipboardList,
  "/admin/reachout": Send,
  "/admin/invoices": Receipt,
  "/admin/accounts": Building2,
  "/admin/accounts?kind=BRAND": Store,
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
/*
 * THE MENU, IN THE ORDER THE WORK GOES (Genesis, 3 Nov 2026): Home, Tasks,
 * Email Inbox, Sales, Influencers, Delivery & Timeline, Reports; then Assets,
 * Share Portal, Money and Setup; Copilot at the foot. Open with names by
 * default, folding to icons only («, top right); the choice is remembered (a
 * cookie, so the page draws it right first time). Notifications moved to the
 * top bar. Features sits in Setup's menu; Files, the Creative library and AI
 * avatars under Assets.
 */
const OWN_ENTRY = new Set(["/admin/tasks", "/admin/inbox", "/admin/reports", "/admin/files", "/admin/creatives", "/admin/lab/avatars", "/admin/features", "/admin/notifications", "/admin/assistant"]);
type Entry = { key: string; label: string; icon: LucideIcon; href: string; group?: NavGroup; area?: string; count: number; hrefs: string[] };

export function CrmRail({ groups, title, root = "/admin", footer, collapsed: startCollapsed = false }: { groups: NavGroup[]; title: string; root?: string; footer?: React.ReactNode; collapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `crm_rail=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  };
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
  const pages = groups.flatMap((g) => g.items);
  const page = (href: string) => pages.find((i) => i.href === href);
  const group = (...labels: string[]) => groups.find((g) => labels.includes(g.label));
  /* An area's menu without the pages that have their own place in the menu. */
  const trim = (g: NavGroup | undefined, extra: NavGroup["items"] = []): NavGroup | undefined => (g ? { ...g, items: [...extra, ...g.items.filter((i) => !OWN_ENTRY.has(i.href))] } : undefined);
  const sum = (g?: NavGroup) => (g ? g.items.reduce((n, i) => n + (i.count ?? 0), 0) : 0);
  const fromGroup = (key: string, label: string, icon: LucideIcon, g: NavGroup | undefined): Entry[] => {
    if (!g || !g.items.length) return [];
    const first = g.items.find((i) => !i.href.includes("tour="));
    return [{ key, label, icon, href: first?.href ?? root, group: g, area: g.label, count: sum(g), hrefs: g.items.map((i) => i.href) }];
  };
  const fromPage = (key: string, label: string, icon: LucideIcon, href: string): Entry[] => {
    const p = page(href);
    return p ? [{ key, label, icon, href, count: p.count ?? 0, hrefs: [href] }] : [];
  };
  const today = group("Today");
  const assets: NavGroup = {
    label: "Assets",
    items: [
      ...(page("/admin/files") ? [{ href: "/admin/files", label: "Files" }] : []),
      ...(page("/admin/creatives") ? [{ href: "/admin/creatives", label: "Creative library" }] : []),
      ...(page("/admin/lab/avatars") ? [{ href: "/admin/lab/avatars", label: "AI avatars" }] : []),
    ],
  };
  const work: Entry[] = [
    ...fromGroup("home", "Home", LayoutGrid, trim(today) && { ...trim(today)!, items: [{ href: root, label: "Dashboard" }, ...trim(today)!.items.filter((i) => i.href !== root)] }),
    ...fromPage("tasks", "Tasks", ListChecks, "/admin/tasks"),
    ...fromPage("inbox", "Email Inbox", Inbox, "/admin/inbox"),
    ...fromGroup("sales", "Sales", TrendingUp, group("Sales")),
    ...fromGroup("influence", "Influencers", Megaphone, group("Influence")),
    ...fromGroup("delivery", "Delivery & Timeline", FolderKanban, trim(group("Delivery", "My work"))),
    ...fromPage("reports", "Reports", ChartColumn, "/admin/reports"),
  ];
  const manage: Entry[] = [
    ...fromGroup("assets", "Assets", FolderOpen, assets),
    ...fromGroup("portal", "Share Portal", DoorOpen, group("Portal")),
    ...fromGroup("money", "Money", Wallet, group("Money")),
    ...fromGroup("setup", "Setup", Settings, trim(group("Setup"), page("/admin/features") ? [{ href: "/admin/features", label: "All features" }] : [])),
  ];
  const entries = [...work, ...manage];

  /*
   * HOVER MENUS (Genesis, 31 Oct 2026: "make the expandables like this on
   * hover", after Wix): hovering an area's icon shows its pages beside the
   * rail, one click to any of them. It holds all the area has, its pages,
   * what to create and the latest few (Genesis, 31 Oct 2026: "all the details
   * in the hover, everywhere, and remove the panel"). Clicking the icon opens
   * the area's first page; on a touch screen it opens the menu instead. Fixed
   * to the page, as the rail scrolls and would clip it.
   */
  const [fly, setFly] = useState<{ label: string; top: number; left: number } | null>(null);
  const closing = useRef<number | undefined>(undefined);
  const keep = () => window.clearTimeout(closing.current);
  const leave = () => {
    keep();
    closing.current = window.setTimeout(() => !pinned.current && setFly(null), 160);
  };
  const hover = (label: string, el: HTMLElement) => {
    keep();
    const r = el.getBoundingClientRect();
    setFly({ label, top: Math.max(8, Math.min(r.top - 12, window.innerHeight - 520)), left: r.right + 8 });
  };
  const flyGroup = fly ? entries.find((e) => e.key === fly.label)?.group : null;
  /* The tour opens an area's menu while it talks about it (components/crm/tour-overlay); it stays until the tour moves on. */
  const pinned = useRef(false);
  useEffect(() => {
    const open = (e: Event) => {
      const el = (e as CustomEvent<HTMLElement | null>).detail;
      if (el?.dataset.area) {
        pinned.current = true;
        const key = entries.find((x) => x.area === el.dataset.area)?.key;
        if (key) hover(key, el);
      } else if (pinned.current) {
        pinned.current = false;
        setFly(null);
      }
    };
    window.addEventListener("crm-rail-open", open);
    return () => window.removeEventListener("crm-rail-open", open);
  });
  const touch = useRef(false);

  /* One line of the menu: an area (its pages show on hover) or a page. */
  const row = (e: Entry) => {
    const lit = !!best && e.hrefs.includes(best) && !best.startsWith("/admin/assistant");
    const Icon = e.icon;
    return (
      <Link
        key={e.key}
        href={e.href}
        data-area={e.area}
        aria-current={lit ? "page" : undefined}
        aria-haspopup={e.group ? "menu" : undefined}
        aria-label={`${e.label}${e.count ? `, ${e.count} waiting` : ""}`}
        title={collapsed ? e.label : undefined}
        onPointerEnter={(ev) => e.group && ev.pointerType === "mouse" && hover(e.key, ev.currentTarget)}
        onPointerLeave={e.group ? leave : undefined}
        onPointerDown={(ev) => (touch.current = ev.pointerType !== "mouse")}
        onClick={(ev) => {
          if (e.group && touch.current) {
            ev.preventDefault();
            return fly?.label === e.key ? setFly(null) : hover(e.key, ev.currentTarget);
          }
          setFly(null);
        }}
        className={`group relative flex shrink-0 items-center rounded-2xl transition-colors ${collapsed ? "mx-auto size-12 justify-center" : "min-h-11 w-full gap-3 px-3"} ${
          lit ? "border border-[#ffc516]/70 bg-[#ffc516]/12 text-[var(--rail-fg)] shadow-[0_0_18px_rgb(255_197_22/0.18)]" : "border border-transparent text-[var(--rail-soft)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-fg)]"
        }`}
      >
        <Icon className={`size-[1.1875rem] shrink-0 ${lit ? "text-[#ffc516]" : ""}`} aria-hidden />
        {!collapsed && <span className={`min-w-0 flex-1 truncate text-[0.9375rem] ${lit ? "font-semibold" : "font-medium"}`}>{e.label}</span>}
        {!collapsed && e.count > 0 && <span className="rounded-md bg-[var(--rail-hover)] px-1.5 text-[0.75rem] font-semibold leading-5 text-[var(--rail-fg)]">{e.count > 99 ? "99+" : e.count}</span>}
        {collapsed && e.count > 0 && <span aria-hidden className="absolute right-2 top-2 size-2 rounded-full bg-[#ffc516] ring-2 ring-[var(--rail-ring)]" />}
      </Link>
    );
  };
  const heading = (text: string) =>
    collapsed ? <span aria-hidden className="mx-auto my-2 h-px w-8 shrink-0 bg-[var(--rail-line)]" /> : <p className="mb-1 mt-3 shrink-0 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[var(--rail-faint)]">{text}</p>;
  const ai = !!aiLink;
  const nova = aiLink?.label === "NOVA AI";
  const aiHere = path.startsWith("/admin/assistant");

  return (
    <div className="flex h-full gap-3">
      {/* On the page itself, above the content beside the rail. */}
      {flyGroup && fly && createPortal(
        <div
          role="menu"
          data-rail-fly
          aria-label={AREA_LABEL[flyGroup.label] ?? flyGroup.label}
          onPointerEnter={keep}
          onPointerLeave={leave}
          style={{ top: fly.top, left: fly.left, maxHeight: `calc(100vh - ${fly.top + 8}px)` }}
          className="rail-glass fixed z-[70] flex w-72 flex-col rounded-2xl motion-safe:animate-[tour-in_0.15s_ease-out]"
        >
          <div className="border-b border-[var(--rail-line)] px-4 pb-3 pt-3.5">
            <p className="truncate text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--rail-faint)]">{title}</p>
            <p className="text-[0.9375rem] font-semibold uppercase tracking-[0.08em] text-[var(--rail-fg)]">{AREA_LABEL[flyGroup.label] ?? flyGroup.label}</p>
            {AREA_HINT[flyGroup.label] && <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--rail-soft)]">{AREA_HINT[flyGroup.label]}</p>}
          </div>
          <div className="min-h-0 overflow-y-auto p-2" data-lenis-prevent>
            {flyGroup.items.filter((i) => !i.href.includes("tour=")).map((i) => {
              const Icon = iconFor(i.href);
              const active = i.href === best;
              return (
                <Link key={i.href} href={i.href} role="menuitem" onClick={() => setFly(null)} aria-current={active ? "page" : undefined} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.875rem] transition-colors ${active ? "bg-[#ffc516]/15 font-medium text-[var(--rail-fg)]" : "text-[var(--rail-soft)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-fg)]"}`}>
                  <Icon className={`size-4 shrink-0 ${active ? "text-[#ffc516]" : ""}`} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{i.label}</span>
                  {i.pro && <ProBadge />}
                  {i.count ? <span className="rounded-full bg-[#ffc516] px-1.5 text-[0.6875rem] font-semibold leading-5 text-[#141216]">{i.count}</span> : null}
                </Link>
              );
            })}
            {/* Starting points: a new plan, a lead, a quote from the AI… */}
            {!!flyGroup.create?.length && (
              <>
                <p className="mb-1 mt-3 px-3 text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--rail-faint)]">Create</p>
                {flyGroup.create.map((c) => (
                  <Link key={c.href} href={c.href} role="menuitem" onClick={() => setFly(null)} className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[0.8125rem] text-[var(--rail-soft)] transition-colors hover:bg-[var(--rail-hover)] hover:text-[var(--rail-fg)]">
                    <span className={`grid size-4 shrink-0 place-items-center rounded-md ${c.href.startsWith("/admin/assistant") ? "bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#ffc516] text-[#141216]" : "bg-[#ffc516]/15 text-[#ffc516]"}`}>
                      {c.href.startsWith("/admin/assistant") ? <Sparkles className="size-2.5" aria-hidden /> : <Plus className="size-2.5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  </Link>
                ))}
              </>
            )}
            {/* The latest few ("Check existing quotes"), listed straight out. */}
            {flyGroup.recent && (
              <>
                <p className="mb-1 mt-3 flex items-center gap-1.5 px-3 text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--rail-faint)]"><History className="size-3" aria-hidden /> {flyGroup.recent.label}</p>
                {flyGroup.recent.items.map((r) => (
                  <Link key={r.href} href={r.href} role="menuitem" onClick={() => setFly(null)} className="block rounded-xl px-3 py-1.5 text-[0.8125rem] text-[var(--rail-soft)] transition-colors hover:bg-[var(--rail-hover)] hover:text-[var(--rail-fg)]">
                    <span className="block truncate">{r.label}</span>
                    {r.hint && <span className="block text-[0.6875rem] text-[var(--rail-faint)]">{r.hint}</span>}
                  </Link>
                ))}
                <Link href={flyGroup.recent.all} role="menuitem" onClick={() => setFly(null)} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[0.8125rem] text-[#ffc516] hover:underline">See all <ChevronsRight className="size-3.5" aria-hidden /></Link>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
      {/* The menu. */}
      <nav aria-label="CRM areas" className={`rail-glass flex shrink-0 flex-col rounded-[1.25rem] py-3 transition-[width] duration-200 ${collapsed ? "w-[4.75rem] items-center px-1.5" : "w-[15.5rem] px-3"}`}>
        <div className={`flex shrink-0 ${collapsed ? "flex-col items-center gap-2" : "items-start justify-between px-1"}`}>
          {/* Genesis's N, as the favicon (app/icon.svg): yellow on white. */}
          <Link href={root} className="grid size-11 shrink-0 place-items-center rounded-xl bg-white" aria-label="Dashboard" title={title}>
            <svg viewBox="0 0 306 500" className="h-6 w-auto" aria-hidden>
              <g fill="#ffd400">
                <polygon points="30,0 306,0 306,340.7" />
                <polygon points="0,149.1 284.25,500 0,500" />
              </g>
            </svg>
          </Link>
          <button type="button" onClick={toggle} aria-label={collapsed ? "Open the menu" : "Fold the menu to icons"} title={collapsed ? "Open the menu" : "Fold to icons"} className="grid size-9 place-items-center rounded-xl text-[var(--rail-soft)] transition-colors hover:bg-[var(--rail-hover)] hover:text-[var(--rail-fg)]">
            {collapsed ? <PanelLeftOpen className="size-[1.125rem]" aria-hidden /> : <PanelLeftClose className="size-[1.125rem]" aria-hidden />}
          </button>
        </div>
        {/* Scrolls when the window is too short; nothing squashes. */}
        <div className={`mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto ${collapsed ? "w-full items-center" : "-mx-1 px-1"}`} data-lenis-prevent>
          {heading("Work")}
          {work.map(row)}
          {manage.length > 0 && heading("Manage")}
          {manage.map(row)}
        </div>
        {/* Copilot at the foot (Genesis, 3 Nov 2026), NOVA AI in an agency's CRM. */}
        {ai && (
          <Link
            href="/admin/assistant"
            aria-label={nova ? "NOVA AI" : "Nova Copilot"}
            aria-current={aiHere ? "page" : undefined}
            title={collapsed ? (nova ? "NOVA AI" : "Copilot") : undefined}
            className={`group mt-2 flex shrink-0 items-center rounded-2xl border transition-colors ${collapsed ? "size-12 justify-center" : "w-full gap-3 px-2.5 py-2"} ${aiHere ? "border-[#ffc516]/80" : "border-[#ac84fe]/45 hover:border-[#ffc516]/70"} bg-gradient-to-r from-[#ac84fe]/12 via-transparent to-[#ffc516]/10`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/email/genesis-orb.png" alt="" aria-hidden className={`shrink-0 rounded-full object-contain transition-transform group-hover:scale-110 ${collapsed ? "size-8" : "size-10"}`} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block bg-gradient-to-r from-[#ffaf18] via-[#f06144] to-[#ac84fe] bg-clip-text text-[0.9375rem] font-semibold leading-tight text-transparent">{nova ? "NOVA AI" : "Copilot"}</span>
                  <span className="block truncate text-[0.75rem] text-[var(--rail-soft)]">Your AI work assistant</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-[var(--rail-soft)]" aria-hidden />
              </>
            )}
          </Link>
        )}
        <div className={`flex shrink-0 ${collapsed ? "justify-center" : "px-1"}`}>{footer}</div>
      </nav>
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
