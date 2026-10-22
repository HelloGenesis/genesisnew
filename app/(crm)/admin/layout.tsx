import type { Metadata } from "next";
import Link from "next/link";

import { SideNav, type NavGroup } from "@/components/crm/side-nav";
import { Notice } from "@/components/crm/ui";
import { isAuth0Configured } from "@/lib/auth0";
import { emailLoginEnabled } from "@/lib/crm/email-login";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { accountScope, leadScope, plansOnly, projectScope, sees, seesCreators, through } from "@/lib/crm/scope";
import { can, devLoginEnabled, getViewer, staffAccess } from "@/lib/crm/session";
import { SignOut } from "@/components/crm/sign-out";

export const metadata: Metadata = { title: { default: "CRM", template: "%s · Genesis CRM" } };
export const dynamic = "force-dynamic";

/**
 * GENESIS'S CONTROL ROOM. The sidebar shows only what this person's roles
 * allow; every page and action re-checks (requireStaff), so the nav is a
 * convenience, not the gate.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured() || (!isAuth0Configured() && !devLoginEnabled() && !emailLoginEnabled())) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-[2rem] font-normal text-bone">Genesis CRM</h1>
        <div className="mt-6">
          <Notice warn>The CRM needs the database and a sign-in (Auth0, or email codes via Resend and CRM_SESSION_SECRET) configured. See CRM.md.</Notice>
        </div>
      </main>
    );
  }
  const viewer = await getViewer();
  if (staffAccess(viewer) !== "granted") return <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6">{children}</main>;

  const prisma = getPrisma();
  const seesAll = sees(viewer!, "inbox");
  const [openRequests, dueLeads, review, myTasks, inboxNew, unread] = await Promise.all([
    prisma.request.count({ where: { ...through("account", accountScope(viewer!)), status: { in: ["OPEN"] } } }),
    prisma.lead.count({ where: { ...leadScope(viewer!), status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: new Date() } } }),
    prisma.deliverable.count({ where: { ...through("project", projectScope(viewer!)), status: "CHANGES_REQUESTED" } }),
    prisma.task.count({ where: { status: "OPEN", ownerId: viewer!.id, dueDate: { lte: new Date() } } }),
    prisma.inboxItem.count({ where: { status: "NEW", ...(seesAll ? {} : { userId: viewer!.id }) } }),
    prisma.notification.count({ where: { userId: viewer!.id, readAt: null } }),
  ]);

  const groups: NavGroup[] = [
    { label: "Today", items: [{ href: "/admin", label: "Dashboard" }, { href: "/admin/notifications", label: "Notifications", count: unread }, { href: "/admin/inbox", label: "Inbox · Gmail & Drive", count: inboxNew }, { href: "/admin/tasks", label: "Tasks", count: myTasks }, ...(sees(viewer!, "reports") ? [{ href: "/admin/reports", label: "Reports" }] : [])] },
    ...(can(viewer, "sales")
      ? [{ label: "Sales", items: [{ href: "/admin/leads", label: "Leads & pipeline", count: dueLeads }, { href: "/admin/briefs", label: "Briefs" }, { href: "/admin/quotes", label: "Quotes & plans" }, { href: "/admin/reachout", label: "Reach out" }, { href: "/admin/invoices", label: "Invoices" }, { href: "/admin/accounts", label: "Clients & agencies" }] }]
      : []),
    /* The influencer team (no sales role): their plans and the influencer database (Genesis, 22 Oct 2026). */
    ...(plansOnly(viewer!) ? [{ label: "Influence", items: [{ href: "/admin/quotes", label: "Influencer plans" }, { href: "/admin/reachout", label: "Reach out" }, { href: "/admin/creators", label: "Influencer database" }] }] : []),
    ...(can(viewer, "delivery") || can(viewer, "sales")
      ? [
          {
            label: "Delivery",
            items: [
              { href: "/admin/projects", label: "Projects", count: review },
              { href: "/admin/requests", label: "Requests & support", count: openRequests },
              /* Private: owners, the influencer team and people given access (lib/crm/scope seesCreators). */
              ...(seesCreators(viewer!) && !plansOnly(viewer!) ? [{ href: "/admin/creators", label: "Influencer database" }] : []),
              { href: "/admin/vendors", label: "Vendors & crew" },
            ],
          },
        ]
      : viewer!.roles.includes("CREATIVE")
        ? [{ label: "My work", items: [{ href: "/admin/projects", label: "Projects", count: review }, { href: "/admin/requests", label: "Requests" }] }]
        : []),
    ...(can(viewer, "finance")
      ? [{ label: "Money", items: [{ href: "/admin/billing", label: "Orders & subscriptions" }, ...(can(viewer, "sales") ? [] : [{ href: "/admin/invoices", label: "Invoices" }]), { href: "/admin/payouts", label: "Commissions & payouts" }, { href: "/admin/expenses", label: "Expenses & salaries" }, { href: "/admin/expenses/subscriptions", label: "Our subscriptions" }, { href: "/admin/expenses/gst", label: "GST" }] }]
      : []),
    { label: "Setup", items: [...(can(viewer, "staff") ? [{ href: "/admin/staff", label: "Staff & roles" }] : []), { href: "/admin/settings", label: "Integrations" }] },
  ];

  return (
    <div className="crm-shell mx-auto w-full max-w-[1560px] lg:grid lg:w-[calc(100%-2rem)] lg:grid-cols-[264px_minmax(0,1fr)]">
      <div className="crm-side min-w-0 px-4 pt-5 sm:px-6 lg:px-4 lg:py-7">
        <SideNav groups={groups} root="/admin" label="CRM" title="Genesis Media" />
        <div className="mt-8 hidden px-3.5 text-[0.8125rem] text-faint lg:block">
          <p className="truncate text-ash">{viewer!.name ?? viewer!.email}</p>
          <p>{viewer!.roles.join(", ").toLowerCase()}</p>
          <div className="mt-2 flex gap-3">
            {viewer!.memberships.length > 0 && (
              <Link href="/portal" className="crm-link">
                Portal
              </Link>
            )}
            <SignOut className="crm-link" />
          </div>
        </div>
      </div>
      <main className="min-w-0 space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:px-9 lg:py-8">{children}</main>
    </div>
  );
}
