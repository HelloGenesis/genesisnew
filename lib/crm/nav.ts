import type { NavGroup } from "@/components/crm/side-nav";

import { plansOnly, sees, seesCreators } from "./scope";
import { can, type Viewer } from "./session";

/**
 * THE CRM'S PAGES FOR THIS PERSON, by area: only what their roles open. The
 * rail and the phone strip (app/(crm)/admin/layout) and the dashboard's All
 * features show the same list. Counts are what's waiting on each.
 */
type Recent = { href: string; label: string; hint?: string }[];
export function crmNav(viewer: Viewer, c: { unread?: number; inboxNew?: number; myTasks?: number; dueLeads?: number; review?: number; openRequests?: number } = {}, recent: { plans?: Recent; quotes?: Recent } = {}): NavGroup[] {
  const { unread = 0, inboxNew = 0, myTasks = 0, dueLeads = 0, review = 0, openRequests = 0 } = c;
  /*
   * THE AREAS, ONE JOB EACH (Genesis, 27 Oct 2026: "make sure it's systematic;
   * make the influencer section out as well, deliveries"). Home is your day;
   * Sales finds and wins the client; Influence is creators and their plans;
   * Delivery is the work; Money is billing and spend; Setup is the CRM itself.
   */
  const sales = can(viewer, "sales");
  const influence = sales || plansOnly(viewer) || seesCreators(viewer);
  const delivery = can(viewer, "delivery") || sales;
  const finance = can(viewer, "finance");
  return [
    {
      label: "Today",
      items: [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/notifications", label: "Notifications", count: unread },
        { href: "/admin/inbox", label: "Inbox · Gmail & Drive", count: inboxNew },
        { href: "/admin/tasks", label: "Tasks", count: myTasks },
        { href: "/admin/assistant", label: "AI assistant" },
        ...(sees(viewer, "reports") ? [{ href: "/admin/reports", label: "Reports" }] : []),
      ],
      create: [
        { href: "/admin/tasks?add=1", label: "Add a task" },
        { href: "/admin/assistant", label: "Ask the AI assistant" },
      ],
    },
    ...(sales
      ? [{ label: "Sales", items: [{ href: "/admin/leads", label: "Leads & pipeline", count: dueLeads }, { href: "/admin/briefs", label: "Briefs" }, { href: "/admin/accounts", label: "Clients & agencies" }, { href: "/admin/quotes?type=quotes", label: "Quotes & proposals" }],
          create: [
            { href: "/admin/leads?add=1", label: "New lead" },
            { href: "/admin/quotes/new", label: "New quote or proposal" },
            { href: "/admin/accounts?add=1", label: "New client or agency" },
            { href: `/admin/assistant?prompt=${encodeURIComponent("Make a price quote for <client> from this vendor costing, adding 50% to each line: ")}`, label: "Quote from a vendor costing (AI)" },
          ],
          ...(recent.quotes?.length ? { recent: { label: "Check existing quotes", all: "/admin/quotes?type=quotes", items: recent.quotes } } : {}),
        }]
      : []),
    ...(influence
      ? [
          {
            label: "Influence",
            items: [
              ...(can(viewer, "plans") ? [{ href: "/admin/quotes?type=plans", label: "Influencer plans" }] : []),
              /* Private: owners, the influencer team and people given access (lib/crm/scope seesCreators). */
              ...(seesCreators(viewer) ? [{ href: "/admin/creators", label: "Influencer database" }] : []),
              ...(can(viewer, "plans") ? [{ href: "/admin/reachout", label: "Reach out" }] : []),
            ],
            /* Starting points (Genesis, 27 Oct 2026: "add more features here, like make an influencer plan"). */
            create: [
              ...(can(viewer, "plans") ? [{ href: "/admin/quotes/new?kind=INFLUENCER_PLAN", label: "New influencer plan" }] : []),
              { href: `/admin/assistant?prompt=${encodeURIComponent("Make an influencer plan for <brand> from these screenshots / this Excel: ")}`, label: "Plan from screenshots or Excel (AI)" },
              ...(seesCreators(viewer) ? [{ href: "/admin/creators?reachout=1", label: "New reach out" }, { href: "/admin/creators?add=1", label: "Add an influencer" }, { href: "/admin/creators/import", label: "Import a roster or sheet" }] : []),
              { href: `/admin/assistant?prompt=${encodeURIComponent("Find creators for <brand>: <category>, <city>, <followers range>, with a phone number, not contacted in the last 30 days.")}`, label: "Find creators (AI)" },
            ],
            /* "Check existing plans, then a list appears" (Genesis, 27 Oct 2026). */
            ...(recent.plans?.length ? { recent: { label: "Check existing plans", all: "/admin/quotes?type=plans", items: recent.plans } } : {}),
          },
        ]
      : []),
    ...(delivery
      ? [{ label: "Delivery", items: [{ href: "/admin/projects", label: "Projects", count: review }, { href: "/admin/requests", label: "Requests & support", count: openRequests }, { href: "/admin/vendors", label: "Vendors & crew" }] }]
      : viewer.roles.includes("CREATIVE")
        ? [{ label: "My work", items: [{ href: "/admin/projects", label: "Projects", count: review }, { href: "/admin/requests", label: "Requests" }] }]
        : []),
    ...(sales || finance
      ? [
          {
            label: "Money",
            create: [{ href: "/admin/invoices/new", label: "New invoice" }],
            items: [
              { href: "/admin/invoices", label: "Invoices" },
              ...(finance
                ? [{ href: "/admin/billing", label: "Orders & subscriptions" }, { href: "/admin/payouts", label: "Commissions & payouts" }, { href: "/admin/expenses", label: "Expenses & salaries" }, { href: "/admin/expenses/subscriptions", label: "Our subscriptions" }, { href: "/admin/expenses/gst", label: "GST" }]
                : []),
            ],
          },
        ]
      : []),
    {
      label: "Setup",
      items: [
        ...(can(viewer, "staff") ? [{ href: "/admin/staff", label: "Staff & roles" }] : []),
        /* An agency's own team and its details for quotes and invoices; Genesis's integrations are Genesis's. */
        ...(viewer.workspaceId ? (viewer.workspaceRole === "ADMIN" ? [{ href: "/admin/team", label: "Team & company" }] : []) : [{ href: "/admin/settings", label: "Integrations" }]),
        { href: "/admin?tour=1", label: "Take the tour" },
      ],
    },
  ].filter((g) => g.items.length > 0);
}
