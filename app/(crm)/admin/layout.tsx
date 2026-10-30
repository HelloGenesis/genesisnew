import type { Metadata } from "next";
import Link from "next/link";

import { CrmRail, RailUser } from "@/components/crm/crm-rail";
import { SideNav } from "@/components/crm/side-nav";
import { crmNav } from "@/lib/crm/nav";
import { Notice, PageHead } from "@/components/crm/ui";
import { isAuth0Configured } from "@/lib/auth0";
import { emailLoginEnabled } from "@/lib/crm/email-login";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { accountScope, leadScope, projectScope, quoteScope, sees, through } from "@/lib/crm/scope";
import { quoteRef } from "@/lib/crm/quote-templates";
import { can, devLoginEnabled, getViewer, staffAccess } from "@/lib/crm/session";
import { SignOut } from "@/components/crm/sign-out";
import { requestWorkspace } from "@/lib/crm/request-workspace";
import { workspaces } from "@/lib/crm/workspace";
import { setViewingCrm } from "./actions/workspaces";
import { AppTour } from "@/components/crm/app-tour";
import { ScrollMain } from "@/components/crm/scroll-main";
import { DemoGuard } from "@/components/crm/demo-guard";
import { TrialPlans } from "@/components/crm/trial-plans";
import { daysLeft, planCards, prettyDate, trialGate, trialOf } from "@/lib/crm/nova-trial";
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
  const trial = viewer!.workspaceId ? await trialOf(viewer!.workspaceId) : null;
  const gate = trialGate(trial);
  /* The latest plans and quotes, for the rail's "Check existing" lists. */
  const latest = can(viewer, "plans")
    ? await prisma.quote.findMany({ where: quoteScope(viewer!), orderBy: { updatedAt: "desc" }, take: 30, select: { id: true, number: true, kind: true, title: true, company: true } })
    : [];
  const pick = (kind: "INFLUENCER_PLAN" | "QUOTE") => latest.filter((q) => q.kind === kind).slice(0, 8).map((q) => ({ href: `/admin/quotes/${q.id}`, label: q.company ? `${q.company} · ${q.title}` : q.title, hint: quoteRef(q.number) }));
  const groups = crmNav(viewer!, { unread, inboxNew, myTasks, dueLeads, review, openRequests }, { plans: pick("INFLUENCER_PLAN"), quotes: pick("QUOTE") });

  /* Owners can look inside an agency's CRM: the switch sits over the page. */
  const viewingSwitch = switchable.length > 0 && (
    <form action={setViewingCrm} className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2">
        <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-faint">Viewing</span>
        <select name="ws" defaultValue={viewer!.ws ?? ""} className="crm-input !min-h-9 w-auto !py-1 text-[0.875rem]">
          <option value="">Genesis Media</option>
          {switchable.map((w) => <option key={w.id} value={w.id}>{w.name} (agency CRM)</option>)}
        </select>
      </label>
      <button className="crm-btn crm-btn-secondary crm-btn-sm">Switch</button>
    </form>
  );

  return (
    /*
      THE RAIL AND ITS PANEL on a desktop (Genesis, 27 Oct 2026: components/crm/crm-rail), the page
      beside it; on a phone, the strip of pages over the page as before.
    */
    <div className="crm-shell crm-frame mx-auto w-full max-w-[1680px] lg:grid lg:w-[calc(100%-2rem)] lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <div className="crm-side min-w-0 px-4 pt-5 sm:px-6 lg:h-full lg:border-r-0 lg:p-3 lg:pr-0">
        <div className="lg:hidden">
          <SideNav groups={groups} root="/admin" label="CRM" title={agencyCrm?.name ?? "Genesis Media"} phoneOnly />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-faint">
            <span className="truncate text-ash">{viewer!.name ?? viewer!.email}</span>
            {viewer!.memberships.length > 0 && <Link href="/portal" className="crm-link">Portal</Link>}
            <SignOut className="crm-link" />
          </div>
        </div>
        <div className="crm-rail-wrap hidden lg:block lg:h-full">
          <CrmRail groups={groups} title={agencyCrm?.name ?? "Genesis Media"} footer={<RailUser name={viewer!.name} email={viewer!.email} roles={viewer!.roles.join(", ").toLowerCase()} portal={viewer!.memberships.length > 0} />} />
        </div>
      </div>
      <ScrollMain className="min-w-0 space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:h-full lg:overflow-y-auto lg:px-8 lg:py-7">
        {viewingSwitch && <div className="flex justify-end">{viewingSwitch}</div>}
        {/* A Genesis owner inside an agency's CRM: anything added here is the agency's. */}
        {agencyCrm && !viewer!.workspaceId && (
          <form action={setViewingCrm} className="crm-notice flex flex-wrap items-center justify-between gap-3">
            <span>You&apos;re viewing <b>{agencyCrm.name}</b>&apos;s CRM. Anything you add here goes into theirs, not Genesis&apos;s.</span>
            <input type="hidden" name="ws" value="" />
            <button className="crm-btn crm-btn-secondary crm-btn-sm">Back to Genesis</button>
          </form>
        )}
        {/* NOVA'S FREE TRIAL (lib/crm/nova-trial): the days left, and from day 3 the plan and card before anything else. */}
        {trial && gate === "open" && (trial.state === "TRIAL" || trial.state === "CARD_ADDED") && (
          <Link href="/admin/plan" className="crm-notice flex flex-wrap items-center justify-between gap-3 hover:border-[#ffc516]/60">
            <span>
              {trial.state === "TRIAL"
                ? `Free trial · ${daysLeft(trial)} days left. Choose a plan and add your card by ${prettyDate(trial.cardDueAt)}: ₹0 today.`
                : `Free trial until ${prettyDate(trial.endsAt)}. Your ${trial.plan} plan starts then.`}
            </span>
            <span className="crm-btn crm-btn-primary crm-btn-sm">{trial.state === "TRIAL" ? "Choose a plan" : "Plan & billing"}</span>
          </Link>
        )}
        {gate === "card" ? (
          <>
            <PageHead kicker="Your free trial" title="Choose your plan to carry on" sub={`Everything you've set up is waiting. You pay ₹0 today; your card is first charged on ${prettyDate(trial!.endsAt)}, when your 14-day trial ends.`} />
            <TrialPlans plans={planCards()} firstCharge={prettyDate(trial!.endsAt)} admin={viewer!.workspaceRole === "ADMIN" && !viewer!.demo} initial={trial!.plan} />
          </>
        ) : gate === "ended" ? (
          <>
            <PageHead kicker="Nova by Genesis" title={trial!.state === "CANCELLED" ? "Your trial is cancelled" : "Your free trial has ended"} sub="Nothing has been charged. Your data is kept for 30 days." />
            <p className="crm-notice">To pick up where you left off, reply to any of our emails or write to us on WhatsApp, and we&apos;ll switch it back on with the plan you choose.</p>
          </>
        ) : (
          children
        )}
      </ScrollMain>
      <Suspense fallback={null}>
        {/* An agency's CRM (and Nova's live demo, which remembers the tour in the browser) is Nova by Genesis. */}
        <AppTour firstTime={!tourSeen && gate === "open"} name={viewer!.name} area="admin" groups={groups} demo={viewer!.demo} product={viewer!.workspaceId ? "Nova" : "Genesis"} />
      </Suspense>
      {viewer!.demo && <DemoGuard />}
    </div>
  );
}
