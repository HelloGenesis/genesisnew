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
import { requestWorkspace } from "@/lib/crm/request-workspace";
import { workspaces } from "@/lib/crm/workspace";
import { setViewingCrm } from "./actions/workspaces";
import { AppTour } from "@/components/crm/app-tour";
import { Suspense } from "react";

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

  /* Everything on this page stays in this person's CRM (lib/crm/workspace). */
  Object.assign(requestWorkspace(), { ws: viewer!.ws, known: true });
  const prisma = getPrisma();
  const seesAll = sees(viewer!, "inbox");
  const agencyCrm = viewer!.ws ? await prisma.account.findFirst({ where: { id: viewer!.ws, workspaceId: null }, select: { name: true } }) : null;
  const owner = viewer!.roles.includes("OWNER") && !viewer!.workspaceId;
  const switchable = owner ? await workspaces() : [];
  const [openRequests, dueLeads, review, myTasks, inboxNew, unread] = await Promise.all([
    prisma.request.count({ where: { ...through("account", accountScope(viewer!)), status: { in: ["OPEN"] } } }),
    prisma.lead.count({ where: { ...leadScope(viewer!), status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: new Date() } } }),
    prisma.deliverable.count({ where: { ...through("project", projectScope(viewer!)), status: "CHANGES_REQUESTED" } }),
    prisma.task.count({ where: { status: "OPEN", ownerId: viewer!.id, dueDate: { lte: new Date() } } }),
    prisma.inboxItem.count({ where: { status: "NEW", ...(seesAll ? {} : { userId: viewer!.id }) } }),
    prisma.notification.count({ where: { userId: viewer!.id, readAt: null } }),
  ]);

  /* The tour opens by itself on someone's first visit (components/crm/app-tour). */
  const tourSeen = Boolean(await prisma.appSetting.findUnique({ where: { key: `tour:done:${viewer!.id}` }, select: { key: true } }));
  const groups: NavGroup[] = [
    { label: "Today", items: [{ href: "/admin", label: "Dashboard" }, { href: "/admin/notifications", label: "Notifications", count: unread }, { href: "/admin/inbox", label: "Inbox · Gmail & Drive", count: inboxNew }, { href: "/admin/tasks", label: "Tasks", count: myTasks }, { href: "/admin/assistant", label: "AI assistant" }, ...(sees(viewer!, "reports") ? [{ href: "/admin/reports", label: "Reports" }] : [])] },
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
    {
      label: "Setup",
      items: [
        ...(can(viewer, "staff") ? [{ href: "/admin/staff", label: "Staff & roles" }] : []),
        /* An agency's own team and its details for quotes and invoices; Genesis's integrations are Genesis's. */
        ...(viewer!.workspaceId ? (viewer!.workspaceRole === "ADMIN" ? [{ href: "/admin/team", label: "Team & company" }] : []) : [{ href: "/admin/settings", label: "Integrations" }]),
        { href: "/admin?tour=1", label: "Take the tour" },
      ],
    },
  ];

  return (
    <div className="crm-shell mx-auto w-full max-w-[1560px] lg:grid lg:w-[calc(100%-2rem)] lg:grid-cols-[264px_minmax(0,1fr)]">
      <div className="crm-side min-w-0 px-4 pt-5 sm:px-6 lg:px-4 lg:py-7">
        {/* A Genesis owner can look inside any agency's CRM; Genesis's own lists never mix in theirs. */}
        {switchable.length > 0 && (
          <form action={setViewingCrm} className="mb-5 px-0.5">
            <label className="block">
              <span className="mb-1 block px-3 text-[0.6875rem] uppercase tracking-[0.12em] text-faint">Viewing</span>
              <select name="ws" defaultValue={viewer!.ws ?? ""} className="crm-input">
                <option value="">Genesis Media</option>
                {switchable.map((w) => <option key={w.id} value={w.id}>{w.name} (agency CRM)</option>)}
              </select>
            </label>
            <button className="crm-btn crm-btn-secondary crm-btn-sm mt-2 w-full">Switch</button>
          </form>
        )}
        <SideNav groups={groups} root="/admin" label="CRM" title={agencyCrm?.name ?? "Genesis Media"} />
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
      <main className="min-w-0 space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:px-9 lg:py-8">
        {/* A Genesis owner inside an agency's CRM: anything added here is the agency's. */}
        {agencyCrm && !viewer!.workspaceId && (
          <form action={setViewingCrm} className="crm-notice flex flex-wrap items-center justify-between gap-3">
            <span>You&apos;re viewing <b>{agencyCrm.name}</b>&apos;s CRM. Anything you add here goes into theirs, not Genesis&apos;s.</span>
            <input type="hidden" name="ws" value="" />
            <button className="crm-btn crm-btn-secondary crm-btn-sm">Back to Genesis</button>
          </form>
        )}
        {children}
      </main>
      <Suspense fallback={null}>
        <AppTour firstTime={!tourSeen} name={viewer!.name} area="admin" />
      </Suspense>
    </div>
  );
}
