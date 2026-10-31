"use client";

import {
  BadgeIndianRupee,
  Bell,
  Blocks,
  BookOpen,
  ChartColumn,
  Briefcase,
  Building2,
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

import { NovaGlyph } from "@/components/genesis/nova-glyphs";

import { ProBadge } from "./pro-badge";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
const AREA_ICON: Record<string, LucideIcon> = { Today: LayoutGrid, Sales: TrendingUp, Influence: Megaphone, Delivery: FolderKanban, "My work": FolderKanban, Portal: DoorOpen, Money: Wallet, Setup: Settings };
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
/* Every rail item the same size, icon and label on one centre line. */
/* Items share the rail's height: full size on a tall screen, closer together on a laptop, never hidden. */
const ITEM = "group flex min-h-[3.375rem] max-h-[3.75rem] w-full flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-[0.6875rem] text-[var(--rail-soft)] transition-colors hover:text-[var(--rail-fg)]";
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
  const router = useRouter();
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
  const counts = (g: NavGroup) => g.items.reduce((s, i) => s + (i.count ?? 0), 0);
  /* The rail's own links, only for pages this person's areas include. */
  const pages = groups.flatMap((g) => g.items);
  const shortcuts = SHORTCUTS.flatMap((sc) => {
    const item = pages.find((i) => i.href === sc.href);
    return item ? [{ ...sc, count: item.count }] : [];
  });
  const bell = pages.find((i) => i.href === "/admin/notifications");

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
  const flyGroup = fly ? groups.find((g) => g.label === fly.label) : null;
  /* The tour opens an area's menu while it talks about it (components/crm/tour-overlay); it stays until the tour moves on. */
  const pinned = useRef(false);
  useEffect(() => {
    const open = (e: Event) => {
      const el = (e as CustomEvent<HTMLElement | null>).detail;
      if (el?.dataset.area) {
        pinned.current = true;
        hover(el.dataset.area, el);
      } else if (pinned.current) {
        pinned.current = false;
        setFly(null);
      }
    };
    window.addEventListener("crm-rail-open", open);
    return () => window.removeEventListener("crm-rail-open", open);
  });
  const touch = useRef(false);

  const railButton = (g: NavGroup) => {
    const Icon = AREA_ICON[g.label] ?? LayoutGrid;
    /* A page with its own rail icon (Inbox, Tasks…) lights that one, not its area too. */
    const lit = g.label === here && !shortcuts.some((sc) => sc.href === best) && !best?.startsWith("/admin/assistant");
    const n = counts(g);
    return (
      <button
        key={g.label}
        onPointerEnter={(e) => e.pointerType === "mouse" && hover(g.label, e.currentTarget)}
        onPointerLeave={leave}
        type="button"
        onPointerDown={(e) => (touch.current = e.pointerType !== "mouse")}
        onClick={(e) => {
          if (touch.current) return fly?.label === g.label ? setFly(null) : hover(g.label, e.currentTarget);
          setFly(null);
          /* Home goes to the dashboard (Genesis, 31 Oct 2026); every area to its first page. */
          const first = g.items.find((i) => !i.href.includes("tour="));
          if (first) router.push(first.href);
        }}
        aria-current={lit ? "page" : undefined}
        aria-haspopup="menu"
        data-area={g.label}
        aria-label={`${AREA_LABEL[g.label] ?? g.label}${n ? `, ${n} waiting` : ""}`}
        className={ITEM}
      >
        <span className={`${TILE} ${lit ? "bg-white text-[#141216] shadow-[0_0_0_2px_#ffc516]" : "group-hover:bg-[var(--rail-hover)]"}`}>
          <Icon className="size-[1.125rem]" aria-hidden />
          {/* Something waiting in this area: a dot here, the numbers in its menu. */}
          {n > 0 && <span aria-hidden className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ffc516] ring-2 ring-[var(--rail-ring)]" />}
        </span>
        <span className={`leading-none ${lit ? "font-medium text-[var(--rail-fg)]" : ""}`}>{AREA_LABEL[g.label] ?? g.label}</span>
      </button>
    );
  };

  /* One quick link (Inbox, Tasks, Files…). */
  const shortcutLink = (sc: (typeof shortcuts)[number]) => {
    const Icon = iconFor(sc.href);
    const lit = sc.href === best;
    return (
      <Link key={sc.href} href={sc.href} aria-current={lit ? "page" : undefined} aria-label={`${sc.label}${sc.count ? `, ${sc.count} waiting` : ""}`} className={ITEM}>
        <span className={`${TILE} ${lit ? "bg-white text-[#141216] shadow-[0_0_0_2px_#ffc516]" : "group-hover:bg-[var(--rail-hover)]"}`}>
          <Icon className="size-[1.125rem]" aria-hidden />
          {!!sc.count && <span aria-hidden className="absolute right-1 top-1 size-2 rounded-full bg-[#ffc516] ring-2 ring-[var(--rail-ring)]" />}
        </span>
        <span className={`leading-none ${lit ? "font-medium text-[var(--rail-fg)]" : ""}`}>{sc.label}</span>
      </Link>
    );
  };

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
      {/* The rail. */}
      <nav aria-label="CRM areas" className="rail-glass flex w-[4.75rem] shrink-0 flex-col items-center rounded-[1.25rem] px-1.5 py-3">
        {/* Genesis's N, as the favicon (app/icon.svg): yellow on white. */}
        <Link href={root} className="mb-2 grid size-11 shrink-0 place-items-center rounded-xl bg-white" aria-label="Dashboard" title={title}>
          <svg viewBox="0 0 306 500" className="h-6 w-auto" aria-hidden>
            <g fill="#ffd400">
              <polygon points="30,0 306,0 306,340.7" />
              <polygon points="0,149.1 284.25,500 0,500" />
            </g>
          </svg>
        </Link>
        <span aria-hidden className="mx-auto mb-1 h-px w-10 bg-[var(--rail-line)]" />
        {/* Scrolls when the window is too short for every icon (Genesis, 29 Oct 2026: "add a scroller here"); icons never squash into each other. */}
        <div className="-mr-1 flex min-h-0 w-[calc(100%+0.25rem)] flex-1 flex-col overflow-y-auto pr-1" data-lenis-prevent>
          {/* Tasks sits at the top, under Home (Genesis, 31 Oct 2026: "move this on top"). */}
          {groups.filter((g) => !LOWER.has(g.label)).flatMap((g, i) => (i === 0 ? [railButton(g), ...shortcuts.filter((sc) => sc.href === TOP_SHORTCUT).map(shortcutLink)] : [railButton(g)]))}
          {/* Nova Copilot for its owners, NOVA AI in an agency's CRM (lib/crm/scope; the nav keeps the link only for them). */}
          {aiLink && (
          aiLink.label === "NOVA AI" ? (
            /* NOVA AI's logo, the orb as its O (Genesis, 31 Oct 2026: "add this logo over here"). */
            <Link href="/admin/assistant" aria-label="NOVA AI" className={`${ITEM} !flex-row !gap-0 ${path.startsWith("/admin/assistant") ? "bg-[var(--rail-hover)] text-[var(--rail-fg)]" : "text-[var(--rail-soft)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-fg)]"}`}>
              <NovaGlyph letter="N" className="h-[0.625rem] shrink-0" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/genesis-orb.png" alt="" aria-hidden className="mx-[0.125rem] size-[0.8125rem] shrink-0 scale-[1.35] object-contain" />
              <NovaGlyph letter="V" className="h-[0.625rem] shrink-0" />
              <NovaGlyph letter="A" className="h-[0.625rem] shrink-0" />
              <span className="ml-[0.25rem] text-[0.8125rem] leading-[0.625rem] tracking-[0.02em]">AI</span>
            </Link>
          ) : (
          /* Nova Copilot: the NOVA logo, COPILOT under it (Genesis, 31 Oct 2026: "add the Nova logo here, Copilot you can write below"). */
          <Link href="/admin/assistant" aria-label="Nova Copilot" aria-current={path.startsWith("/admin/assistant") ? "page" : undefined} className={ITEM}>
            {/* The logo in an icon's place, the same height as the rest (Genesis, 31 Oct 2026: "fit, aligned, aesthetic"). */}
            <span className={`${TILE} !w-auto px-1.5 ${path.startsWith("/admin/assistant") ? "bg-[var(--rail-hover)] text-[var(--rail-fg)] shadow-[0_0_0_2px_#ffc516]" : "text-[var(--rail-fg)] group-hover:bg-[var(--rail-hover)]"}`}>
              <span className="flex items-center gap-[0.1875rem]">
                <NovaGlyph letter="N" className="h-[0.5625rem] shrink-0" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/genesis-orb.png" alt="" aria-hidden className="size-[0.8125rem] shrink-0 scale-[1.3] object-contain brightness-[1.5] saturate-[1.5]" />
                <NovaGlyph letter="V" className="h-[0.5625rem] shrink-0" />
                <NovaGlyph letter="A" className="h-[0.5625rem] shrink-0" />
              </span>
            </span>
            <span className={`bg-gradient-to-r from-[#ffaf18] via-[#f06144] to-[#ac84fe] bg-clip-text text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.2em] text-transparent ${path.startsWith("/admin/assistant") ? "" : "opacity-90 group-hover:opacity-100"}`}>Copilot</span>
          </Link>
          )
          )}
          {shortcuts.length > 0 && <span aria-hidden className="mx-auto my-1 h-px w-10 shrink-0 bg-[var(--rail-line)]" />}
          {shortcuts.filter((sc) => sc.href !== TOP_SHORTCUT).map(shortcutLink)}
          {groups.some((g) => LOWER.has(g.label)) && <span aria-hidden className="mx-auto my-1 h-px w-10 shrink-0 bg-[var(--rail-line)]" />}
          {groups.filter((g) => LOWER.has(g.label)).map(railButton)}
        </div>
        {bell && (
          <Link href={bell.href} aria-current={bell.href === best ? "page" : undefined} aria-label={`Notifications${bell.count ? `, ${bell.count} unread` : ""}`} title="Notifications" className={`relative mt-1 grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${bell.href === best ? "bg-white text-[#141216]" : "text-[var(--rail-soft)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-fg)]"}`}>
            <Bell className="size-5" aria-hidden />
            {!!bell.count && <span aria-hidden className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[#ffc516] px-1 text-center text-[0.625rem] font-semibold leading-4 text-[#141216] ring-2 ring-[var(--rail-ring)]">{bell.count > 99 ? "99+" : bell.count}</span>}
          </Link>
        )}
        {footer}
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
