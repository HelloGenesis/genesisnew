import { Field, Select } from "@/components/crm/ui";
import { MultiSelect } from "@/components/crm/multi-select";
import { ACCOUNT_KIND, ACCOUNT_STATUS, VENDOR_SKILLS } from "@/lib/crm/catalog";

type Account = {
  name: string;
  kind: string;
  status: string;
  legalName: string | null;
  gstin: string | null;
  billingAddress: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  parentId: string | null;
  referredById: string | null;
  managerId: string | null;
  isReseller: boolean;
  commissionPercent: number;
  vendorSkills: string[];
  vendorRateNote: string | null;
  vendorCommissionPercent?: number | null;
};

/** The account form's fields — shared by "Add an account" and an account's own page. */
export function AccountFields({ account, staff, agencies, resellers }: { account?: Account; staff: [string, string][]; agencies: [string, string][]; resellers: [string, string][] }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name *"><input name="name" required defaultValue={account?.name} className="crm-input" /></Field>
        <Field label="Type"><Select name="kind" required defaultValue={account?.kind ?? "BRAND"} options={ACCOUNT_KIND} /></Field>
        <Field label="Status"><Select name="status" required defaultValue={account?.status ?? "PROSPECT"} options={Object.entries(ACCOUNT_STATUS).map(([k, v]) => [k, v.label] as const)} /></Field>
        <Field label="Legal name (invoices)"><input name="legalName" defaultValue={account?.legalName ?? ""} className="crm-input" /></Field>
        <Field label="GSTIN"><input name="gstin" defaultValue={account?.gstin ?? ""} className="crm-input uppercase" /></Field>
        <Field label="Industry"><input name="industry" defaultValue={account?.industry ?? ""} className="crm-input" placeholder="Insurance, D2C, real estate…" /></Field>
        <Field label="Email"><input name="email" type="email" defaultValue={account?.email ?? ""} className="crm-input" /></Field>
        <Field label="Phone"><input name="phone" defaultValue={account?.phone ?? ""} className="crm-input" /></Field>
        <Field label="Website"><input name="website" defaultValue={account?.website ?? ""} className="crm-input" /></Field>
        <Field label="City"><input name="city" defaultValue={account?.city ?? ""} className="crm-input" /></Field>
        <Field label="State"><input name="state" defaultValue={account?.state ?? ""} className="crm-input" /></Field>
        <Field label="Account manager"><Select name="managerId" defaultValue={account?.managerId} options={staff} /></Field>
        <Field label="Managed by agency" hint="For a brand an agency buys for."><Select name="parentId" defaultValue={account?.parentId} options={agencies} /></Field>
        <Field label="Referred by reseller" hint="Earns commission on this client's payments."><Select name="referredById" defaultValue={account?.referredById} options={resellers} /></Field>
        <Field label="Tags" hint="Comma separated."><input name="tags" defaultValue={account?.tags.join(", ")} className="crm-input" /></Field>
      </div>
      <Field label="Billing address"><textarea name="billingAddress" defaultValue={account?.billingAddress ?? ""} className="crm-input !min-h-16" /></Field>
      <fieldset className="grid gap-3 rounded-xl border border-[var(--glass-border)] p-3 sm:grid-cols-[auto_10rem] sm:items-end">
        <legend className="px-1 text-[0.8125rem] text-ash">Agencies</legend>
        <label className="flex items-center gap-2 text-[0.9375rem] text-bone">
          <input type="checkbox" name="isReseller" defaultChecked={account?.isReseller} /> Partner / reseller: gets a referral link and earns commission
        </label>
        <Field label="Commission %"><input name="commissionPercent" type="number" min={0} max={50} defaultValue={account?.commissionPercent ?? 10} className="crm-input" /></Field>
      </fieldset>
      <fieldset className="grid gap-3 rounded-xl border border-[var(--glass-border)] p-3 sm:grid-cols-3">
        <legend className="px-1 text-[0.8125rem] text-ash">Vendors</legend>
        <Field label="Skills" hint="Pick any, or write your own."><MultiSelect name="vendorSkills" label="Pick skills" allowCustom options={VENDOR_SKILLS.map((s) => [s, s] as const)} defaultValue={account?.vendorSkills ?? []} /></Field>
        <Field label="Commission %" hint="If they work on commission."><input name="vendorCommissionPercent" type="number" min={0} max={100} step="0.5" defaultValue={account?.vendorCommissionPercent ?? ""} className="crm-input" placeholder="e.g. 10" /></Field>
        <Field label="Rates"><input name="vendorRateNote" defaultValue={account?.vendorRateNote ?? ""} className="crm-input" placeholder="₹8,000 per reel edit" /></Field>
      </fieldset>
      <Field label="Notes"><textarea name="notes" defaultValue={account?.notes ?? ""} className="crm-input" /></Field>
    </>
  );
}
