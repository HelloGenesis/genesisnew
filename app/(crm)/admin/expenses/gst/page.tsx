import { ActionForm } from "@/components/crm/action-form";
import { Badge, Card, Field, PageHead, Select, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, money, todayIst } from "@/lib/crm/catalog";
import { ensureGstFilings, GST_RETURNS, gstMonth } from "@/lib/crm/company";
import { SUPPLIER } from "@/lib/crm/invoices";
import { requireStaff } from "@/lib/crm/session";

import { type GstProfile, saveGstProfile, updateGstFiling } from "../../actions/company";
import { MoneyTabs } from "../tabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "GST" };

const STATUS = { PENDING: "Pending", FILED: "Filed", NOT_APPLICABLE: "Not applicable" } as const;

/**
 * GST in one place: Genesis's registration details, the tax in what was
 * collected against the input credit on what was spent, month by month, and
 * every return with its due date and whether it is filed. Finance gets a
 * reminder five days before each one.
 */
export default async function GstPage() {
  await requireStaff("finance");
  await ensureGstFilings();
  const prisma = getPrisma();
  const today = todayIst();
  const months = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 - i, 1)).toISOString().slice(0, 7));
  const [filings, profileRow, summary] = await Promise.all([
    prisma.gstFiling.findMany({ orderBy: [{ dueDate: "desc" }, { returnType: "asc" }], take: 40 }),
    prisma.appSetting.findUnique({ where: { key: "gst-profile" } }),
    Promise.all(months.map((m) => gstMonth(m))),
  ]);
  const profile: GstProfile = profileRow ? JSON.parse(profileRow.value) : {};
  const pending = filings.filter((f) => f.status === "PENDING");
  const overdue = pending.filter((f) => f.dueDate.toISOString().slice(0, 10) < today);
  const next = [...pending].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).find((f) => f.dueDate.toISOString().slice(0, 10) >= today);
  const last = summary[1];

  return (
    <>
      <PageHead kicker="Money" title="GST" sub={profile.gstin ? `GSTIN ${profile.gstin}` : "Billing and filing"} />
      <MoneyTabs active="gst" />
      <Stats
        items={[
          { label: "Next return", value: next ? `${next.returnType} · ${date(next.dueDate)}` : "None due", hint: next ? `for ${next.period}` : undefined },
          { label: "Overdue returns", value: overdue.length, tone: overdue.length ? "bad" : undefined },
          { label: `Output GST (${last.period})`, value: money(last.output), hint: `on ${money(last.collected)} collected` },
          { label: `Net payable (${last.period})`, value: money(Math.max(0, last.net)), hint: `after ${money(last.input)} input credit` },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card title="Returns">
            <Table head={["Return", "Period", "Due", "Status", ""]}>
              {filings.map((f) => {
                const late = f.status === "PENDING" && f.dueDate.toISOString().slice(0, 10) < today;
                return (
                  <tr key={f.id}>
                    <td className="text-bone">{f.returnType}<span className="block text-[0.75rem] text-faint">{GST_RETURNS[f.returnType]}</span></td>
                    <td>{f.period}</td>
                    <td className="whitespace-nowrap">{date(f.dueDate)}</td>
                    <td>
                      {f.status === "FILED" ? <Badge tone="good">Filed {date(f.filedOn)}</Badge> : late ? <Badge tone="bad">Overdue</Badge> : <Badge tone={f.status === "PENDING" ? "warn" : "muted"}>{STATUS[f.status]}</Badge>}
                      {f.arn && <span className="block text-[0.75rem] text-faint">ARN {f.arn}</span>}
                      {f.taxPaidPaise ? <span className="block text-[0.75rem] text-faint">Paid {money(f.taxPaidPaise)}</span> : null}
                    </td>
                    <td>
                      <details>
                        <summary className="cursor-pointer text-[0.75rem] text-faint">Update</summary>
                        <ActionForm action={updateGstFiling} submit="Save" className="mt-2 min-w-[16rem]">
                          <input type="hidden" name="id" value={f.id} />
                          <Field label="Status"><Select name="status" required defaultValue={f.status} options={STATUS} /></Field>
                          <Field label="Filed on"><input name="filedOn" type="date" defaultValue={f.filedOn?.toISOString().slice(0, 10) ?? today} className="crm-input" /></Field>
                          <Field label="ARN"><input name="arn" defaultValue={f.arn ?? ""} className="crm-input" /></Field>
                          <Field label="Tax paid (₹)"><input name="taxPaid" inputMode="decimal" defaultValue={f.taxPaidPaise ? f.taxPaidPaise / 100 : ""} className="crm-input" /></Field>
                          <Field label="Notes"><input name="notes" defaultValue={f.notes ?? ""} className="crm-input" /></Field>
                        </ActionForm>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </Card>

          <Card title="GST month by month">
            <Table head={["Month", "Collected", "Output GST", "Input credit", "Net payable", "Spent"]}>
              {summary.map((m) => (
                <tr key={m.period}>
                  <td className="text-bone">{m.period}</td>
                  <td>{money(m.collected)}</td>
                  <td>{money(m.output)}</td>
                  <td>{money(m.input)}</td>
                  <td className={m.net > 0 ? "text-bone" : ""}>{m.net >= 0 ? money(m.net) : `Credit ${money(-m.net)}`}</td>
                  <td>{money(m.spent)}</td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-[0.8125rem] text-faint">Output GST is worked out from payments received (each order&apos;s own tax, or 18% included where there is no order). Input credit is the GST entered on expenses. A guide for the CA, not the return itself.</p>
          </Card>
        </div>

        <Card title="Registration & filing details">
          <ActionForm action={saveGstProfile} submit="Save">
            <Field label="GSTIN"><input name="gstin" defaultValue={profile.gstin ?? SUPPLIER.gstin} className="crm-input uppercase" placeholder="27ABCDE1234F1Z5" /></Field>
            <Field label="Legal name"><input name="legalName" defaultValue={profile.legalName ?? "Genesis Events and Media Group"} className="crm-input" /></Field>
            <Field label="State"><input name="state" defaultValue={profile.state ?? "Maharashtra"} className="crm-input" /></Field>
            <Field label="Filing"><Select name="frequency" defaultValue={profile.frequency ?? "Monthly"} options={[["Monthly", "Monthly (GSTR-1 by 11th, GSTR-3B by 20th)"], ["QRMP", "Quarterly (QRMP scheme)"]]} /></Field>
            <Field label="CA / accountant"><input name="accountant" defaultValue={profile.accountant} className="crm-input" /></Field>
            <Field label="Their email"><input name="accountantEmail" type="email" defaultValue={profile.accountantEmail} className="crm-input" /></Field>
            <Field label="GST portal username" hint="The username only — never store the password here."><input name="portalUser" defaultValue={profile.portalUser} className="crm-input" /></Field>
            <p className="crm-label pt-2">On every invoice</p>
            <Field label="Address"><input name="address" defaultValue={profile.address ?? SUPPLIER.address} className="crm-input" /></Field>
            <Field label="Phone"><input name="phone" defaultValue={profile.phone ?? SUPPLIER.phone} className="crm-input" /></Field>
            <Field label="Email"><input name="invoiceEmail" defaultValue={profile.invoiceEmail ?? SUPPLIER.email} className="crm-input" /></Field>
            <Field label="Payee name"><input name="payee" defaultValue={profile.payee ?? SUPPLIER.payee} className="crm-input" /></Field>
            <Field label="Bank"><input name="bank" defaultValue={profile.bank ?? SUPPLIER.bank} className="crm-input" /></Field>
            <Field label="Account number"><input name="account" defaultValue={profile.account ?? SUPPLIER.account} className="crm-input" /></Field>
            <Field label="IFSC"><input name="ifsc" defaultValue={profile.ifsc ?? SUPPLIER.ifsc} className="crm-input uppercase" /></Field>
            <Field label="Signs invoices" hint="Emailed to sign each new invoice by hand, then uploads the signed copy."><input name="signatoryEmail" type="email" defaultValue={profile.signatoryEmail ?? "shivam@genesismedia.co"} className="crm-input" /></Field>
            <Field label="Notes"><textarea name="notes" defaultValue={profile.notes} className="crm-input !min-h-20" /></Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
