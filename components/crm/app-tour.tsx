"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { finishTour } from "@/app/(crm)/tour-actions";

/**
 * THE TOUR (Genesis, 22 Oct 2026: "whenever someone new signs in there should
 * be a tour of the entire app and its features, and an option to view it").
 * It opens by itself the first time someone signs in, and again from "Take the
 * tour". Each step lights up one part of the sidebar (only the parts this
 * person's role can open) and says what it's for in a line or two.
 */

type Step = { target?: string; title: string; body: string };

/** What each part of the CRM and the portal does, keyed by its sidebar link. */
const ABOUT: Record<string, Omit<Step, "target">> = {
  "/admin": { title: "Dashboard", body: "Your day at a glance: tasks due, follow-ups, new briefs and the numbers that matter." },
  "/admin/notifications": { title: "Notifications", body: "Everything that needs you: a client opened a quote, an invoice was paid, a task was assigned." },
  "/admin/inbox": { title: "Inbox · Gmail & Drive", body: "Connect Gmail and Drive once. Briefs that arrive by email or in Drive become leads, with the brief attached." },
  "/admin/tasks": { title: "Tasks", body: "Your to-dos and the team's, with due dates. Overdue ones show a count here." },
  "/admin/reports": { title: "Reports", body: "Pipeline, sales and delivery numbers across the team." },
  "/admin/leads": { title: "Leads & pipeline", body: "Every enquiry from the site, calls, WhatsApp and email. Drag them across stages; the count shows follow-ups due." },
  "/admin/briefs": { title: "Briefs", body: "What clients have asked for. Turn a brief into a quote or influencer plan in one click." },
  "/admin/quotes": { title: "Quotes & plans", body: "Proposals, price quotes and influencer plans. Send a link or PDF with a Razorpay pay link; export to Excel or Google Sheets. Every save is shared with the team." },
  "/admin/reachout": { title: "Reach out", body: "Ask a plan's creators for their rates on WhatsApp or email, from your saved message, and see who's been contacted." },
  "/admin/invoices": { title: "Invoices", body: "GST tax invoices with CGST/SGST or IGST worked out. Fill one from a quote; each is filed as a PDF in the client's Google Drive folder." },
  "/admin/accounts": { title: "Clients & agencies", body: "Every client, agency and partner with their contacts, billing details, projects and history." },
  "/admin/projects": { title: "Projects", body: "The work once a client says yes: stages, deliverables for approval, files and the team on it." },
  "/admin/requests": { title: "Requests & support", body: "Briefs and questions clients send from their portal, and the replies." },
  "/admin/creators": { title: "Influencer database", body: "Creators with followers, rates and contacts. Filter, tick and make a plan; tap the pencil to edit any cell." },
  "/admin/vendors": { title: "Vendors & crew", body: "Freelancers, crews and production houses, with skills, rates and commission." },
  "/admin/billing": { title: "Orders & subscriptions", body: "Everything bought on the website and paid through Razorpay, including subscriptions." },
  "/admin/payouts": { title: "Commissions & payouts", body: "What's owed to resellers and vendors, and what's been paid." },
  "/admin/expenses": { title: "Expenses & salaries", body: "Company spending, salaries and receipts in one place." },
  "/admin/expenses/subscriptions": { title: "Our subscriptions", body: "The tools Genesis pays for, with renewal reminders." },
  "/admin/expenses/gst": { title: "GST", body: "GST due dates and filings." },
  "/admin/staff": { title: "Staff & roles", body: "Who works in the CRM, what each person can open, influencer-data access, and client or influencer portal access." },
  "/admin/settings": { title: "Integrations", body: "Google Drive, Gmail, Google Sheets and Contacts, and anything that didn't send." },
  "/portal": { title: "Overview", body: "Where everything stands: work waiting for your approval, what's next and what's due." },
  "/portal/projects": { title: "Projects", body: "Each piece of work with its stages. Review and approve deliverables here." },
  "/portal/requests": { title: "Briefs & requests", body: "Send a new brief or a question to the Genesis team, and follow the replies." },
  "/portal/billing": { title: "Billing & invoices", body: "Your invoices, payments and subscriptions." },
  "/portal/team": { title: "Team", body: "Add colleagues so they can see and approve work too." },
  "/portal/brands": { title: "Brands", body: "The brands you manage, each with their own projects." },
  "/portal/referrals": { title: "Referrals & commission", body: "Your referral link and the commission you've earned." },
  "/portal/work": { title: "My work", body: "Jobs offered to you, what you're working on, and what to deliver." },
  "/portal/invoices": { title: "Invoices & payouts", body: "Send your invoices and see what's been paid." },
};

/** The sidebar link (the visible copy: desktop column or the phone's strip) for a page. */
function findTarget(selector: string): HTMLElement | null {
  return ([...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.offsetParent !== null) as HTMLElement | undefined) ?? null;
}

export function AppTour({ firstTime, name, area }: { firstTime: boolean; name: string | null; area: "admin" | "portal" }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const asked = params.get("tour") === "1";
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [box, setBox] = useState<DOMRect | null>(null);

  /* The steps: this person's own sidebar, in its order, then the top bar. */
  const build = useCallback(() => {
    const seen = new Set<string>();
    const links = [...document.querySelectorAll<HTMLAnchorElement>(`nav[aria-label="${area === "admin" ? "CRM" : "Portal"}"] a[href]`)];
    const fromNav: Step[] = [];
    for (const a of links) {
      const href = a.getAttribute("href")!;
      if (seen.has(href) || !ABOUT[href]) continue;
      seen.add(href);
      fromNav.push({ target: `nav[aria-label="${area === "admin" ? "CRM" : "Portal"}"] a[href="${href}"]`, ...ABOUT[href]! });
    }
    const first = name ? name.split(" ")[0] : null;
    return [
      { title: `Welcome to Genesis${first ? `, ${first}` : ""}`, body: area === "admin" ? "A quick tour of the CRM: what each part does, in about a minute. You can leave any time and take it again from “Take the tour”." : "A quick tour of your portal: where your work, approvals and invoices are. You can take it again from “Take the tour”." },
      ...fromNav,
      { target: 'nav[aria-label="Page history"]', title: "Back, forward, refresh", body: "Move between pages, and refresh to see a teammate's latest changes without losing what you've typed." },
      { title: "You're all set", body: "That's the tour. Find it again any time under “Take the tour” in the sidebar." },
    ];
  }, [area, name]);

  useEffect(() => {
    if (!(firstTime || asked)) return;
    /* After the page has drawn, so the sidebar is there to point at. */
    const t = window.setTimeout(() => {
      setSteps(build());
      setI(0);
      setOpen(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [firstTime, asked, build]);

  const step = steps[i];
  const measure = useCallback(() => {
    if (!step?.target) return setBox(null);
    const el = findTarget(step.target);
    if (!el) return setBox(null);
    el.scrollIntoView({ block: "nearest", inline: "center" });
    setBox(el.getBoundingClientRect());
  }, [step]);
  useLayoutEffect(() => {
    if (!open) return;
    /* Reads the lit item's position from the page: a measurement of the DOM, so it belongs here. */
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  const close = useCallback(() => {
    setOpen(false);
    void finishTour();
    if (asked) router.replace(path);
  }, [asked, path, router]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, close, steps.length]);

  /* The card sits beside the lit item on a wide screen, under it on a phone, centred when there's nothing to point at. */
  const card = useMemo(() => {
    if (!box || typeof window === "undefined") return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" } as const;
    const wide = window.innerWidth >= 1024;
    if (wide && box.right + 380 < window.innerWidth) return { left: box.right + 16, top: Math.max(16, Math.min(box.top - 8, window.innerHeight - 260)) };
    return { left: 16, right: 16, top: Math.min(box.bottom + 12, window.innerHeight - 250) };
  }, [box]);

  if (!open || !step) return null;
  const last = i === steps.length - 1;
  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl ring-2 ring-[#ffc516] transition-all duration-300"
          style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.62)" }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-black/60" />
      )}
      <div className="fixed max-w-sm rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float,#1d1b1f)] p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)] sm:w-[22rem]" style={card}>
        <button type="button" onClick={close} aria-label="Close the tour" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
          <X className="size-4" aria-hidden />
        </button>
        <p className="text-[0.75rem] uppercase tracking-[0.12em] text-faint">
          {i + 1} of {steps.length}
        </p>
        <h2 id="tour-title" className="mt-1.5 pr-8 font-sans text-[1.25rem] font-semibold text-bone">{step.title}</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ash">{step.body}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button type="button" onClick={close} className="text-[0.875rem] text-ash underline-offset-4 hover:text-bone hover:underline">
            {last ? "" : "Skip the tour"}
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button type="button" onClick={() => setI(i - 1)} className="crm-btn crm-btn-secondary crm-btn-sm">
                Back
              </button>
            )}
            <button type="button" onClick={() => (last ? close() : setI(i + 1))} className="crm-btn crm-btn-primary crm-btn-sm">
              {last ? "Done" : i === 0 ? "Start" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
