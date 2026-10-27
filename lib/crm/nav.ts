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
  return [
    { label: "Today", items: [{ href: "/admin", label: "Dashboard" }, { href: "/admin/notifications", label: "Notifications", count: unread }, { href: "/admin/inbox", label: "Inbox · Gmail & Drive", count: inboxNew }, { href: "/admin/tasks", label: "Tasks", count: myTasks }, { href: "/admin/assistant", label: "AI assistant" }, ...(sees(viewer, "reports") ? [{ href: "/admin/reports", label: "Reports" }] : [])] },
    ...(can(viewer, "sales")
      ? [{ label: "Sales", items: [{ href: "/admin/leads", label: "Leads & pipeline", count: dueLeads }, { href: "/admin/briefs", label: "Briefs" }, { href: "/admin/quotes", label: "Quotes & plans" }, { href: "/admin/reachout", label: "Reach out" }, { href: "/admin/invoices", label: "Invoices" }, { href: "/admin/accounts", label: "Clients & agencies" }] }]
      : []),
    /* The influencer team (no sales role): their plans and the influencer database (Genesis, 22 Oct 2026). */
    ...(plansOnly(viewer) ? [{ label: "Influence", items: [{ href: "/admin/quotes", label: "Influencer plans" }, { href: "/admin/reachout", label: "Reach out" }, { href: "/admin/creators", label: "Influencer database" }] }] : []),
    ...(can(viewer, "delivery") || can(viewer, "sales")
      ? [
          {
            label: "Delivery",
            items: [
              { href: "/admin/projects", label: "Projects", count: review },
              { href: "/admin/requests", label: "Requests & support", count: openRequests },
              /* Private: owners, the influencer team and people given access (lib/crm/scope seesCreators). */
              ...(seesCreators(viewer) && !plansOnly(viewer) ? [{ href: "/admin/creators", label: "Influencer database" }] : []),
              { href: "/admin/vendors", label: "Vendors & crew" },
            ],
          },
        ]
      : viewer.roles.includes("CREATIVE")
        ? [{ label: "My work", items: [{ href: "/admin/projects", label: "Projects", count: review }, { href: "/admin/requests", label: "Requests" }] }]
        : []),
    ...(can(viewer, "finance")
      ? [{ label: "Money", items: [{ href: "/admin/billing", label: "Orders & subscriptions" }, ...(can(viewer, "sales") ? [] : [{ href: "/admin/invoices", label: "Invoices" }]), { href: "/admin/payouts", label: "Commissions & payouts" }, { href: "/admin/expenses", label: "Expenses & salaries" }, { href: "/admin/expenses/subscriptions", label: "Our subscriptions" }, { href: "/admin/expenses/gst", label: "GST" }] }]
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
  ];
}
