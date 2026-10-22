"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { finishTour } from "@/app/(crm)/tour-actions";

import { TourOverlay, type TourStep } from "./tour-overlay";

/**
 * THE TOUR (Genesis, 22 Oct 2026: "whenever someone new signs in there should
 * be a tour of the entire app and its features, and an option to view it").
 * It opens by itself the first time someone signs in, and again from "Take the
 * tour". Each step lights up one part of the sidebar (only the parts this
 * person's role can open) and says what it's for in a line or two.
 */

type Step = TourStep;

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

export function AppTour({ firstTime, name, area }: { firstTime: boolean; name: string | null; area: "admin" | "portal" }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const asked = params.get("tour") === "1";
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

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
      setOpen(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [firstTime, asked, build]);

  const close = useCallback(() => {
    setOpen(false);
    void finishTour();
    if (asked) router.replace(path);
  }, [asked, path, router]);

  if (!open || steps.length === 0) return null;
  return <TourOverlay key={steps.length} steps={steps} onClose={close} />;
}
