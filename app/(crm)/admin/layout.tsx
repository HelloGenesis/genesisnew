import type { Metadata } from "next";
import Link from "next/link";

import { SideNav, type NavGroup } from "@/components/crm/side-nav";
import { Notice } from "@/components/crm/ui";
import { isAuth0Configured } from "@/lib/auth0";
import { emailLoginEnabled } from "@/lib/crm/email-login";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { can, devLoginEnabled, getViewer, staffAccess } from "@/lib/crm/session";

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
  const [openRequests, dueLeads, review, myTasks] = await Promise.all([
    prisma.request.count({ where: { status: { in: ["OPEN"] } } }),
    prisma.lead.count({ where: { status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: new Date() } } }),
    prisma.deliverable.count({ where: { status: "CHANGES_REQUESTED" } }),
    prisma.task.count({ where: { status: "OPEN", ownerId: viewer!.id, dueDate: { lte: new Date() } } }),
  ]);

  const groups: NavGroup[] = [
    { label: "Today", items: [{ href: "/admin", label: "Overview" }, { href: "/admin/tasks", label: "Tasks", count: myTasks }, { href: "/admin/reports", label: "Reports" }] },
    ...(can(viewer, "sales")
      ? [{ label: "Sales", items: [{ href: "/admin/leads", label: "Leads & pipeline", count: dueLeads }, { href: "/admin/quotes", label: "Quotes & plans" }, { href: "/admin/accounts", label: "Clients & agencies" }] }]
      : []),
    ...(can(viewer, "delivery") || can(viewer, "sales")
      ? [
          {
            label: "Delivery",
            items: [
              { href: "/admin/projects", label: "Projects", count: review },
              { href: "/admin/requests", label: "Requests & support", count: openRequests },
              { href: "/admin/creators", label: "Influencer database" },
              { href: "/admin/vendors", label: "Vendors & crew" },
            ],
          },
        ]
      : []),
    ...(can(viewer, "finance")
      ? [{ label: "Money", items: [{ href: "/admin/billing", label: "Orders & subscriptions" }, { href: "/admin/payouts", label: "Commissions & payouts" }] }]
      : []),
    { label: "Setup", items: [...(can(viewer, "staff") ? [{ href: "/admin/staff", label: "Staff & roles" }] : []), { href: "/admin/settings", label: "Integrations" }] },
  ];

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
      <div className="min-w-0">
        <SideNav groups={groups} root="/admin" label="CRM" />
        <div className="mt-6 hidden px-3 text-[0.8125rem] text-faint lg:block">
          <p className="truncate text-ash">{viewer!.name ?? viewer!.email}</p>
          <p>{viewer!.roles.join(", ").toLowerCase()}</p>
          <div className="mt-2 flex gap-3">
            {viewer!.memberships.length > 0 && (
              <Link href="/portal" className="crm-link">
                Portal
              </Link>
            )}
            <Link href="/signout" className="crm-link">
              Sign out
            </Link>
          </div>
        </div>
      </div>
      <main className="min-w-0 space-y-6">{children}</main>
    </div>
  );
}
