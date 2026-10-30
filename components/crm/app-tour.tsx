"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { finishTour } from "@/app/(crm)/tour-actions";

import { ABOUT, JOURNEY } from "@/lib/crm/tour-copy";

import { findTarget, TourOverlay, type TourStep } from "./tour-overlay";

/**
 * THE TOUR (Genesis, 22 Oct 2026, and 31 Oct 2026: "a dashboard tour with a
 * small pop-up to take it or skip it; after it, ask them to try it
 * themselves; explain everything from start to end"). On the dashboard, a
 * small invitation the first time (TourInvite). The tour walks the dashboard,
 * then each area of the CRM in the order the work happens (lib/crm/tour-copy
 * JOURNEY), listing that area's pages this person can open; then "Try it
 * yourself" with the first things to do. "Take the tour" opens it any time.
 *
 * Remembered per person in the database; in Nova's live demo, which saves
 * nothing, in this browser instead.
 */

type Group = { label: string; items: { href: string; label: string }[]; create?: { href: string; label: string }[] };
export type TourProps = { firstTime: boolean; name: string | null; area: "admin" | "portal"; groups: Group[]; demo?: boolean; product?: string };

const DEMO_KEY = "nova-tour-done";
const demoSeen = () => {
  try {
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
};
const markDemoSeen = () => {
  try {
    localStorage.setItem(DEMO_KEY, "1");
  } catch {
    /* Private window: it just asks again next time. */
  }
};

/* The dashboard's cards, explained (only those on screen are shown). */
const DASHBOARD: TourStep[] = [
  { target: "main dl", title: "Your numbers", body: "Open pipeline, follow-ups due, money collected this month, active projects, work waiting on the client and changes asked for. Click any number to see what's behind it." },
  { target: "text:Tasks", title: "Tasks", body: "What's due today and soon: yours, and what you've given teammates. Tick one off, click a title to rename it, change its date or priority, right here. Overdue dates turn red." },
  { target: "text:Calendar", title: "Calendar", body: "Your Google Calendar for the week, once you've connected Google in the Inbox." },
  { target: "text:From Gmail & Drive", title: "Found in Gmail & Drive", body: "Briefs, client and vendor details, invoices and links the AI found in connected Gmail and Drive. Open one to keep it as a lead or record." },
  { target: 'nav[aria-label="CRM areas"] a[href="/admin/features"]', title: "All features", body: "Every part of the CRM as a card with what it does, in one place. Search it, or pick an area, and open any of them." },
  { target: "text:Follow up today", title: "Follow up today", body: "Leads whose next follow-up is today or overdue, so nobody is forgotten." },
  { target: "text:Requests waiting on us", title: "Requests waiting on us", body: "Briefs and questions clients sent from their portal that still need a reply." },
  { target: "text:Due in the next 7 days", title: "Due this week", body: "Projects and deliverables due in the next seven days." },
];

export function AppTour({ firstTime, name, area, groups, demo = false, product = "Genesis" }: TourProps) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const asked = params.get("tour") === "1";
  const home = path === (area === "admin" ? "/admin" : "/portal");
  const [stage, setStage] = useState<"idle" | "invite" | "tour" | "try">("idle");
  const [steps, setSteps] = useState<TourStep[]>([]);

  const build = useCallback((): TourStep[] => {
    const first = name ? name.split(" ")[0] : null;
    const nav = `nav[aria-label="${area === "admin" ? "CRM" : "Portal"}"]`;
    const shown = (s: TourStep) => !s.target || Boolean(findTarget(s.target));
    if (area === "portal") {
      /* The portal is small: each of its pages, in the sidebar's order. */
      const pages = groups.flatMap((g) => g.items).filter((i) => ABOUT[i.href]);
      return [
        { title: `Welcome${first ? `, ${first}` : ""}`, body: "Your portal is where you follow everything we're doing for you: approve work, send briefs, see invoices and add your team. Here's each part." },
        ...pages.map((p) => ({ target: `${nav} a[href="${p.href}"]`, ...ABOUT[p.href]! })),
        { target: 'nav[aria-label="Page history"]', title: "Back, forward, refresh", body: "Move between pages, and refresh to see the team's latest without losing what you've typed." },
      ].filter(shown);
    }
    const rail = 'nav[aria-label="CRM areas"]';
    const chapters: TourStep[] = groups
      .filter((g) => JOURNEY[g.label])
      .map((g) => {
        const label = g.label === "Today" ? "Home" : g.label === "My work" ? "Work" : g.label;
        const points = g.items.filter((i) => ABOUT[i.href] && !i.href.startsWith("/admin/assistant") && i.href !== "/admin?tour=1").map((i) => ABOUT[i.href]!);
        return { target: `${rail} button[aria-label^="${label}"]`, ...JOURNEY[g.label]!, points };
      });
    const copilot = groups.some((g) => g.items.some((i) => i.href === "/admin/assistant"));
    return [
      { title: `Welcome to ${product}${first ? `, ${first}` : ""}`, body: `A tour of everything, start to end: your dashboard, then each part of ${product} in the order the work happens, from a new lead to a paid invoice. Use the arrow keys or Next; leave any time and take it again from “Take the tour”.` },
      ...(home ? DASHBOARD : []),
      { target: rail, title: "The areas", body: "Home, Sales, Influence, Delivery, Money and Setup down the side. Click one and its pages open in the panel beside it; « folds the panel away for more room. A yellow dot means something's waiting there." },
      ...chapters,
      { target: `${rail} a[href="/admin/notifications"]`, title: "Notifications", body: "A client opened your quote, accepted it or paid; a deliverable was approved or needs changes; a task was given to you. All here, and by email for the important ones." },
      ...(copilot
        ? [
            product === "Nova"
              ? { target: `${rail} a[href="/admin/assistant"]`, title: "NOVA AI", body: "The AI that works in your CRM: ask it to make a quote or influencer plan from screenshots, Excel or PDFs, add leads and tasks, or find creators. You get 5 free requests; after that it runs on credits you top up." }
              : { target: `${rail} a[href="/admin/assistant"]`, title: "Genesis Copilot", body: "The AI that works in the CRM with you: ask it to make a quote or influencer plan from screenshots, Excel or PDFs, add leads and tasks, or find creators. It has its own tour the first time you open it." },
          ]
        : []),
      { target: "text:How it works", title: "Help on every page", body: "Each page has its own “How it works” that walks through that page step by step: how to make a quote, an influencer plan, an invoice, import a sheet." },
      { target: 'nav[aria-label="Page history"]', title: "Back, forward, refresh", body: "Move between pages, and refresh to see a teammate's latest changes without losing what you've typed." },
    ].filter(shown);
  }, [area, groups, home, name, product]);

  /* The invitation: the first time, on the dashboard. A link to "Take the tour" opens the tour itself. */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (asked) {
        setSteps(build());
        setStage("tour");
      } else if (home && (demo ? !demoSeen() : firstTime)) setStage("invite");
    }, 600);
    return () => window.clearTimeout(t);
  }, [asked, build, demo, firstTime, home]);

  const remember = useCallback(() => {
    if (demo) markDemoSeen();
    else void finishTour();
  }, [demo]);
  const end = useCallback(
    (then: "idle" | "try") => {
      remember();
      setStage(then);
      if (asked) router.replace(path);
    },
    [asked, path, remember, router],
  );

  if (stage === "invite")
    return (
      <TourInvite
        product={product}
        portal={area === "portal"}
        onStart={() => {
          setSteps(build());
          setStage("tour");
        }}
        onSkip={() => end("idle")}
      />
    );
  if (stage === "tour" && steps.length) return <TourOverlay key={steps.length} steps={steps} onClose={() => end("idle")} onDone={() => end("try")} />;
  if (stage === "try") return <TryIt area={area} groups={groups} demo={demo} product={product} onClose={() => setStage("idle")} />;
  return null;
}

/** The small "take the tour?" card, bottom right. */
export function TourInvite({ product, portal = false, what, onStart, onSkip }: { product: string; portal?: boolean; what?: string; onStart: () => void; onSkip: () => void }) {
  return (
    <div role="dialog" aria-labelledby="tour-invite-title" className="fixed bottom-5 right-5 z-[85] w-[min(calc(100vw-2.5rem),22rem)] rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float,#1d1b1f)] p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)] motion-safe:animate-[tour-in_0.35s_ease-out]">
      <p className="text-[0.75rem] uppercase tracking-[0.12em] text-[#ffc516]">New here?</p>
      <h2 id="tour-invite-title" className="mt-1.5 font-sans text-[1.125rem] font-semibold text-bone">Take a quick tour of {product}</h2>
      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ash">{what ?? (portal ? "Two minutes: where your work, approvals, briefs and invoices are." : "A few minutes, start to end: how a lead becomes a quote, a project and a paid invoice, and where everything lives.")}</p>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={onSkip} className="crm-btn crm-btn-secondary crm-btn-sm">Skip</button>
        <button type="button" onClick={onStart} className="crm-btn crm-btn-primary crm-btn-sm">Take the tour</button>
      </div>
    </div>
  );
}

/** After the tour: "now try it yourself", with the first things to do. */
function TryIt({ area, groups, demo, product, onClose }: { area: "admin" | "portal"; groups: Group[]; demo: boolean; product: string; onClose: () => void }) {
  const actions =
    area === "portal"
      ? [
          { href: "/portal/requests", label: "Send a brief" },
          { href: "/portal/projects", label: "Review work" },
          { href: "/portal/team", label: "Add a colleague" },
        ]
      : groups.flatMap((g) => g.create ?? []).filter((c) => !c.href.startsWith("/admin/assistant")).slice(0, 5);
  return (
    <TryItCard
      title="Now try it yourself"
      body={demo ? `Click anything: this is the real ${product} with sample data, so go ahead and open a lead, an influencer plan or an invoice. Nothing you do here is saved.` : "The quickest way to learn it is to use it. Start with one of these; every page has “How it works” if you get stuck."}
      actions={actions}
      demo={demo}
      onClose={onClose}
    />
  );
}

export function TryItCard({ title, body, actions, demo = false, onClose }: { title: string; body: string; actions: { href: string; label: string }[]; demo?: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="try-title" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float,#1d1b1f)] p-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)]" onClick={(e) => e.stopPropagation()}>
        <p className="text-[0.75rem] uppercase tracking-[0.12em] text-[#ffc516]">Tour done</p>
        <h2 id="try-title" className="mt-1.5 font-sans text-[1.375rem] font-semibold text-bone">{title}</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ash">{body}</p>
        {actions.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {actions.map((a) => (
              <li key={a.href}>
                <Link href={a.href} onClick={onClose} className="flex h-full items-center rounded-xl border border-[var(--glass-border)] px-3.5 py-2.5 text-[0.875rem] text-bone transition-colors hover:border-[#ffc516]/70 hover:bg-[var(--hover-wash)]">
                  {a.label} →
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {demo && (
            <a href="/resellers#trial" target="_top" className="crm-btn crm-btn-secondary crm-btn-sm">Start a 14-day free trial</a>
          )}
          <button type="button" onClick={onClose} className="crm-btn crm-btn-primary crm-btn-sm">Let me try</button>
        </div>
      </div>
    </div>
  );
}
