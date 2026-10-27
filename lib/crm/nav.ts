import type { NavGroup } from "@/components/crm/side-nav";

import { plansOnly, sees, seesCreators } from "./scope";
import { can, type Viewer } from "./session";

/**
 * THE CRM'S PAGES FOR THIS PERSON, by area: only what their roles open. The
 * rail and the phone strip (app/(crm)/admin/layout) and the dashboard's All
 * features show the same list. Counts are what's waiting on each.
 */
export function crmNav(viewer: Viewer, c: { unread?: number; inboxNew?: number; myTasks?: number; dueLeads?: number; review?: number; openRequests?: number } = {}): NavGroup[] {
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
    },
    ...(sales
      ? [{ label: "Sales", items: [{ href: "/admin/leads", label: "Leads & pipeline", count: dueLeads }, { href: "/admin/briefs", label: "Briefs" }, { href: "/admin/accounts", label: "Clients & agencies" }, { href: "/admin/quotes?type=quotes", label: "Quotes & proposals" }] }]
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
