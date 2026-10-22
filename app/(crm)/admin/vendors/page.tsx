import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Badge, Empty, Field, PageHead, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { MultiSelect } from "@/components/crm/multi-select";
import { money, VENDOR_SKILLS } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";

import { createAccount } from "../actions/sales";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendors & crew" };

/** The freelancers, crews and production houses Genesis hires — each with a portal for their work and invoices. */
export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  await requireStaff();
  const { skill } = await searchParams;
  const vendors = await getPrisma().account.findMany({
    where: { kind: "VENDOR", ...(skill ? { vendorSkills: { has: skill } } : {}) },
    orderBy: { name: "asc" },
    include: {
      assignments: { where: { status: { in: ["OFFERED", "ACCEPTED", "SUBMITTED"] } }, select: { id: true } },
      vendorInvoices: { where: { status: { in: ["SUBMITTED", "APPROVED"] } }, select: { amountPaise: true, taxPaise: true } },
      _count: { select: { members: true, assignments: true } },
    },
  });
  const skills = [...new Set(vendors.flatMap((v) => v.vendorSkills))].sort();
  return (
    <>
      <PageHead kicker="Delivery" title="Vendors & crew" sub="Editors, DOPs, AI artists, designers and production partners." />
      {skills.length > 0 && (
        <nav className="flex flex-wrap gap-1.5">
          <Link href="/admin/vendors" aria-current={!skill ? "page" : undefined} className="crm-nav-link !min-h-8">All</Link>
          {skills.map((s) => <Link key={s} href={`/admin/vendors?skill=${encodeURIComponent(s)}`} aria-current={skill === s ? "page" : undefined} className="crm-nav-link !min-h-8">{s}</Link>)}
        </nav>
      )}
      <AddPanel label="Add a vendor">
        <ActionForm action={createAccount} submit="Add vendor">
          <input type="hidden" name="kind" value="VENDOR" />
          <input type="hidden" name="status" value="ACTIVE" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name *"><input name="name" required className="crm-input" /></Field>
            <Field label="Skills" hint="Pick any, or write your own."><MultiSelect name="vendorSkills" label="Pick skills" allowCustom options={VENDOR_SKILLS.map((s) => [s, s] as const)} /></Field>
            <Field label="Rates"><input name="vendorRateNote" className="crm-input" placeholder="₹8,000 per reel edit" /></Field>
            <Field label="Commission %" hint="If they work on commission."><input name="vendorCommissionPercent" type="number" min={0} max={100} step="0.5" className="crm-input" placeholder="e.g. 10" /></Field>
            <Field label="Phone"><input name="phone" className="crm-input" /></Field>
            <Field label="City"><input name="city" className="crm-input" /></Field>
            <Field label="Portal email"><input name="inviteEmail" type="email" className="crm-input" /></Field>
          </div>
          <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="notify" defaultChecked /> Email them the portal invite</label>
        </ActionForm>
      </AddPanel>
      {vendors.length === 0 ? (
        <Empty>No vendors yet.</Empty>
      ) : (
        <Table head={["Vendor", "Skills", "Rates", "Commission", "Live work", "Total jobs", "To pay", "Portal"]}>
          {vendors.map((v) => (
            <tr key={v.id}>
              <td><Link href={`/admin/accounts/${v.id}`} className="text-bone hover:underline">{v.name}</Link><span className="block text-[0.8125rem] text-ash">{[v.city, v.phone].filter(Boolean).join(" · ")}</span></td>
              <td><span className="flex flex-wrap gap-1">{v.vendorSkills.map((s) => <Badge key={s}>{s}</Badge>)}</span></td>
              <td>{v.vendorRateNote ?? "—"}</td>
              <td className="tabular-nums">{v.vendorCommissionPercent ? `${v.vendorCommissionPercent}%` : "—"}</td>
              <td className="tabular-nums">{v.assignments.length}</td>
              <td className="tabular-nums">{v._count.assignments}</td>
              <td className="tabular-nums">{money(v.vendorInvoices.reduce((s, i) => s + i.amountPaise + i.taxPaise, 0))}</td>
              <td>{v._count.members ? "Yes" : "—"}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
