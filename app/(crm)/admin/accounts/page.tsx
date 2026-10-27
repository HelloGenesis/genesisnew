import Link from "next/link";

import { AccountFields } from "@/components/crm/account-fields";
import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Badge, Empty, Field, PageHead, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { AccountKind } from "@/lib/generated/prisma/enums";
import { ACCOUNT_KIND, ACCOUNT_STATUS, date } from "@/lib/crm/catalog";
import { accountOptions, staffOptions } from "@/lib/crm/options";
import { accountScope, isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { createAccount } from "../actions/sales";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients & agencies" };

const TABS: [string, string][] = [["", "All"], ["BRAND", "Brands"], ["AGENCY", "Agencies"], ["resellers", "Resellers"], ["VENDOR", "Vendors & crew"]];

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ kind?: string; q?: string; add?: string }> }) {
  const viewer = await requireStaff("sales");
  const { kind, q, add } = await searchParams;
  const prisma = getPrisma();
  const accounts = await prisma.account.findMany({
    where: {
      ...accountScope(viewer),
      ...(kind === "resellers" ? { isReseller: true } : kind && kind in ACCOUNT_KIND ? { kind: kind as AccountKind } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { gstin: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 300,
    include: {
      parent: true,
      manager: true,
      _count: { select: { projects: { where: { status: "ACTIVE" } }, members: true, brands: true, referrals: true } },
      subscriptions: { where: { status: { in: ["ACTIVE", "PENDING", "HALTED"] } }, select: { status: true } },
    },
  });
  const [staff, agencies, resellers] = await Promise.all([staffOptions(), accountOptions(["AGENCY"]), accountOptions(["AGENCY"], true)]);

  return (
    <>
      <PageHead kicker="Sales" title="Clients & agencies" sub="Brands, the agencies that buy for them or resell Genesis, and the vendors and crew Genesis hires." exportKind={isSuperAdmin(viewer) ? "accounts" : undefined} />
      <nav className="flex flex-wrap gap-1.5">
        {TABS.map(([value, label]) => (
          <Link key={label} href={value ? `/admin/accounts?kind=${value}` : "/admin/accounts"} aria-current={(kind ?? "") === value ? "page" : undefined} className="crm-nav-link !min-h-9">
            {label}
          </Link>
        ))}
        <form action="/admin/accounts" className="ml-auto">
          {kind && <input type="hidden" name="kind" value={kind} />}
          <input name="q" defaultValue={q} placeholder="Search name, email, GSTIN" className="crm-input min-w-[14rem]" />
        </form>
      </nav>

      <AddPanel label="Add an account" open={add === "1"}>
        <ActionForm action={createAccount} submit="Create account">
          <AccountFields staff={staff} agencies={agencies} resellers={resellers} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Give portal access to (email)"><input name="inviteEmail" type="email" className="crm-input" /></Field>
            <label className="flex items-center gap-2 pb-2.5 text-[0.875rem] text-ash">
              <input type="checkbox" name="notify" defaultChecked /> Email them the invite
            </label>
          </div>
        </ActionForm>
      </AddPanel>

      {accounts.length === 0 ? (
        <Empty>No accounts yet. Paid checkouts create client accounts automatically.</Empty>
      ) : (
        <Table head={["Account", "Type", "Status", "Active projects", "Portal users", "Manager", "Added"]}>
          {accounts.map((a) => (
            <tr key={a.id}>
              <td>
                <Link href={`/admin/accounts/${a.id}`} className="text-bone hover:underline">
                  {a.name}
                </Link>
                <span className="block text-[0.8125rem] text-ash">{[a.parent && `via ${a.parent.name}`, a.email, a.city].filter(Boolean).join(" · ")}</span>
              </td>
              <td>
                <span className="flex flex-wrap gap-1">
                  <Badge>{ACCOUNT_KIND[a.kind]}</Badge>
                  {a.isReseller && <Badge tone="warn">Reseller {a.commissionPercent}%</Badge>}
                  {a._count.brands > 0 && <Badge tone="info">{a._count.brands} brands</Badge>}
                  {a.subscriptions.some((s) => s.status !== "ACTIVE") && <Badge tone="bad">Renewal failing</Badge>}
                  {a.subscriptions.some((s) => s.status === "ACTIVE") && <Badge tone="good">On a plan</Badge>}
                </span>
              </td>
              <td><Status value={ACCOUNT_STATUS[a.status]} /></td>
              <td className="tabular-nums">{a._count.projects}</td>
              <td className="tabular-nums">{a._count.members}</td>
              <td>{a.manager?.name ?? a.manager?.email ?? "—"}</td>
              <td>{date(a.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
