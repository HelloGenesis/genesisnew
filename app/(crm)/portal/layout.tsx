import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { SideNav, type NavGroup } from "@/components/crm/side-nav";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { getViewer, portalAccountCookie, portalAccounts } from "@/lib/crm/session";

import { switchAccount } from "./actions";
import { SignOut } from "@/components/crm/sign-out";
import { AppTour } from "@/components/crm/app-tour";
import { Suspense } from "react";
import { ScrollMain } from "@/components/crm/scroll-main";
import { DemoGuard } from "@/components/crm/demo-guard";

export const metadata: Metadata = { title: { default: "Portal", template: "%s · Genesis portal" } };
export const dynamic = "force-dynamic";

/**
 * THE GENESIS PORTAL — one place for a client, an agency or a vendor.
 *
 * A brand sees its projects, reviews, requests and billing. An agency sees
 * the same for every brand it manages (switching between them), plus — as a
 * reseller — its referral link and commission. A vendor sees the work Genesis
 * offered them, delivers against it and invoices for it.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const viewer = isDatabaseConfigured() ? await getViewer() : null;
  const accounts = viewer ? await portalAccounts(viewer) : [];
  if (!viewer || accounts.length === 0) return <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">{children}</main>;

  const chosen = (await cookies()).get(portalAccountCookie.name)?.value;
  const account = accounts.find((a) => a.id === chosen) ?? accounts[0]!;
  const vendor = account.kind === "VENDOR";
  const prisma = getPrisma();
  const [review, waiting] = vendor
    ? [await prisma.vendorAssignment.count({ where: { vendorId: account.id, status: "OFFERED" } }), 0]
    : await Promise.all([
        prisma.deliverable.count({ where: { status: "IN_REVIEW", project: { accountId: account.id } } }),
        prisma.request.count({ where: { accountId: account.id, status: "WAITING_ON_CLIENT" } }),
      ]);

  const groups: NavGroup[] = vendor
    ? [{ label: "Workspace", items: [{ href: "/portal", label: "Overview" }, { href: "/portal/work", label: "My work", count: review }, { href: "/portal/invoices", label: "Invoices & payouts" }] }]
    : [
        {
          label: "Workspace",
          items: [
            { href: "/portal", label: "Overview" },
            { href: "/portal/projects", label: "Projects", count: review },
            { href: "/portal/requests", label: "Briefs & requests", count: waiting },
            { href: "/portal/billing", label: "Billing & invoices" },
            { href: "/portal/team", label: "Team" },
          ],
        },
        ...(account.kind === "AGENCY"
          ? [{ label: "Agency", items: [{ href: "/portal/brands", label: "Brands" }, ...(account.isReseller ? [{ href: "/portal/referrals", label: "Referrals & commission" }] : [])] }]
          : []),
      ];
  groups.push({ label: "Help", items: [{ href: "/portal?tour=1", label: "Take the tour" }] });
  const tourSeen = Boolean(await prisma.appSetting.findUnique({ where: { key: `tour:done:${viewer.id}` }, select: { key: true } }));

  return (
    <div className="crm-shell crm-frame mx-auto w-full max-w-[1400px] lg:grid lg:w-[calc(100%-2rem)] lg:grid-cols-[264px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <div className="crm-side min-w-0 space-y-5 px-4 pt-5 sm:px-6 lg:px-4 lg:py-7">
        {accounts.length > 1 && (
          <form action={switchAccount} className="flex gap-2">
            <select name="accountId" defaultValue={account.id} className="crm-input" aria-label="Account">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.parentId && accounts.some((p) => p.id === a.parentId) ? " (brand)" : ""}
                </option>
              ))}
            </select>
            <button className="crm-btn crm-btn-secondary crm-btn-sm">Go</button>
          </form>
        )}
        <SideNav groups={groups} root="/portal" label="Portal" title={account.name} />
        <div className="hidden px-3 text-[0.8125rem] text-faint lg:block">
          <p className="truncate text-ash">{viewer.name ?? viewer.email ?? viewer.phone}</p>
          <div className="mt-2 flex gap-3">
            {viewer.roles.length > 0 && <Link href="/admin" className="crm-link">CRM</Link>}
            <SignOut className="crm-link" />
          </div>
        </div>
      </div>
      <ScrollMain className="min-w-0 space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:h-full lg:overflow-y-auto lg:px-9 lg:py-8">{children}</ScrollMain>
      {viewer?.demo && <DemoGuard />}
      <Suspense fallback={null}>
        <AppTour firstTime={!tourSeen} name={viewer.name} area="portal" groups={groups} demo={viewer.demo} product="your portal" />
      </Suspense>
    </div>
  );
}
