import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Badge, Empty, Field, PageHead, Select, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, money, todayIst } from "@/lib/crm/catalog";
import { BILLING_CYCLE, perMonth } from "@/lib/crm/company";
import { inDays, staffOptions } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

import { markSubscriptionPaid, saveCompanySubscription, setSubscriptionActive } from "../../actions/company";
import { MoneyTabs } from "../tabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our subscriptions" };

const CYCLES = Object.fromEntries(Object.entries(BILLING_CYCLE).map(([k, v]) => [k, v.label]));

type Sub = Awaited<ReturnType<ReturnType<typeof getPrisma>["companySubscription"]["findMany"]>>[number];

function SubFields({ sub, staff }: { sub?: Sub; staff: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {sub && <input type="hidden" name="id" value={sub.id} />}
      <Field label="Name *"><input name="name" required defaultValue={sub?.name} className="crm-input" placeholder="Adobe Creative Cloud" /></Field>
      <Field label="Vendor"><input name="vendor" defaultValue={sub?.vendor ?? ""} className="crm-input" /></Field>
      <Field label="Category"><input name="category" defaultValue={sub?.category ?? ""} className="crm-input" placeholder="Design, AI, hosting…" /></Field>
      <Field label="Amount each cycle (₹) *"><input name="amount" required inputMode="decimal" defaultValue={sub ? sub.amountPaise / 100 : ""} className="crm-input" /></Field>
      <Field label="Billed"><Select name="cycle" required defaultValue={sub?.cycle ?? "MONTHLY"} options={CYCLES} /></Field>
      <Field label="Next due *"><input name="nextDueDate" type="date" required defaultValue={sub ? sub.nextDueDate.toISOString().slice(0, 10) : inDays(30)} className="crm-input" /></Field>
      <Field label="Paid with"><input name="paymentMethod" defaultValue={sub?.paymentMethod ?? ""} className="crm-input" placeholder="HDFC card ••1234" /></Field>
      <Field label="Owner"><Select name="ownerId" defaultValue={sub?.ownerId} options={staff} /></Field>
      <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="autoRenew" defaultChecked={sub?.autoRenew ?? true} /> Renews automatically</label>
      <Field label="Notes" className="sm:col-span-2 lg:col-span-3"><input name="notes" defaultValue={sub?.notes ?? ""} className="crm-input" /></Field>
    </div>
  );
}

/** Every tool and service Genesis pays for, what it costs a month, and when each renews. Finance gets a reminder a week ahead. */
export default async function CompanySubscriptionsPage() {
  await requireStaff("finance");
  const [subs, staff] = await Promise.all([
    getPrisma().companySubscription.findMany({ orderBy: [{ active: "desc" }, { nextDueDate: "asc" }] }),
    staffOptions(),
  ]);
  const today = todayIst();
  const soon = new Date(new Date(today).getTime() + 7 * 864e5);
  const active = subs.filter((s) => s.active);
  const monthly = active.reduce((s, x) => s + perMonth(x.amountPaise, x.cycle), 0);
  const dueSoon = active.filter((s) => s.nextDueDate <= soon);
  const owner = (id: string | null) => staff.find(([v]) => v === id)?.[1];

  return (
    <>
      <PageHead kicker="Money" title="Our subscriptions" sub="Tools and services Genesis pays for" />
      <MoneyTabs active="subscriptions" />
      <Stats
        items={[
          { label: "A month, all in", value: money(monthly), hint: `${active.length} active` },
          { label: "A year, all in", value: money(monthly * 12) },
          { label: "Due in 7 days", value: dueSoon.length, tone: dueSoon.length ? "warn" : undefined },
          { label: "Due in 7 days (₹)", value: money(dueSoon.reduce((s, x) => s + x.amountPaise, 0)) },
        ]}
      />
      <AddPanel label="Add a subscription">
        <ActionForm action={saveCompanySubscription} submit="Add subscription" reset>
          <SubFields staff={staff} />
        </ActionForm>
      </AddPanel>
      {subs.length === 0 ? (
        <Empty>No subscriptions yet. Add the tools Genesis pays for, and finance is reminded before each renewal.</Empty>
      ) : (
        <Table head={["Subscription", "Cost", "A month", "Next due", "Paid with", ""]}>
          {subs.map((s) => {
            const late = s.nextDueDate.toISOString().slice(0, 10) < today;
            const near = !late && s.nextDueDate <= soon;
            return (
              <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                <td className="text-bone">
                  {s.name}
                  <span className="block text-[0.75rem] text-faint">{[s.vendor, s.category, owner(s.ownerId)].filter(Boolean).join(" · ")}</span>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[0.75rem] text-faint">Edit</summary>
                    <ActionForm action={saveCompanySubscription} submit="Save" className="mt-2">
                      <SubFields sub={s} staff={staff} />
                    </ActionForm>
                  </details>
                </td>
                <td className="whitespace-nowrap">{money(s.amountPaise)} <span className="text-faint">/ {BILLING_CYCLE[s.cycle].label.toLowerCase()}</span></td>
                <td className="whitespace-nowrap">{money(perMonth(s.amountPaise, s.cycle))}</td>
                <td className="whitespace-nowrap">
                  {s.active ? (late ? <Badge tone="bad">Overdue · {date(s.nextDueDate)}</Badge> : near ? <Badge tone="warn">{date(s.nextDueDate)}</Badge> : date(s.nextDueDate)) : "Stopped"}
                  {s.active && <span className="block text-[0.75rem] text-faint">{s.autoRenew ? "Auto-renews" : "Pay manually"}</span>}
                </td>
                <td>{s.paymentMethod ?? "—"}</td>
                <td className="whitespace-nowrap">
                  {s.active && (
                    <form action={markSubscriptionPaid} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button className="crm-btn crm-btn-secondary crm-btn-sm" title="Records the expense and moves the due date on one cycle">Paid</button>
                    </form>
                  )}
                  <form action={setSubscriptionActive} className="ml-2 inline">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={s.active ? "0" : "1"} />
                    <button className="text-[0.75rem] text-faint hover:text-bone">{s.active ? "Stop" : "Restart"}</button>
                  </form>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
