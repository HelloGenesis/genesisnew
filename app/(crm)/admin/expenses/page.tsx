import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Card, Empty, Field, PageHead, Select, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, money, todayIst } from "@/lib/crm/catalog";
import { EXPENSE_CATEGORY, perMonth } from "@/lib/crm/company";
import { requireStaff } from "@/lib/crm/session";

import { addExpense, addPayroll, deleteExpense } from "../actions/company";
import { MoneyTabs } from "./tabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expenses & salaries" };

const PAID_VIA: [string, string][] = [["Bank transfer", "Bank transfer"], ["UPI", "UPI"], ["Company card", "Company card"], ["Cash", "Cash"], ["Cheque", "Cheque"]];

/** What Genesis spends, month by month: salaries, vendors, rent, software and the rest. Finance and owners. */
export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string; category?: string }> }) {
  await requireStaff("finance");
  const params = await searchParams;
  const today = todayIst();
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));
  const prevFrom = new Date(Date.UTC(y, m - 2, 1));
  const prisma = getPrisma();
  const category = params.category && params.category in EXPENSE_CATEGORY ? params.category : undefined;

  const [rows, byCategory, previous, subs, salaryPeople] = await Promise.all([
    prisma.expense.findMany({ where: { date: { gte: from, lt: to }, ...(category ? { category: category as never } : {}) }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 500 }),
    prisma.expense.groupBy({ by: ["category"], where: { date: { gte: from, lt: to } }, _sum: { amountPaise: true, gstPaise: true } }),
    prisma.expense.aggregate({ where: { date: { gte: prevFrom, lt: from } }, _sum: { amountPaise: true } }),
    prisma.companySubscription.findMany({ where: { active: true }, select: { amountPaise: true, cycle: true } }),
    prisma.expense.groupBy({ by: ["payee"], where: { category: "SALARY", date: { gte: from, lt: to } }, _sum: { amountPaise: true } }),
  ]);
  const total = byCategory.reduce((s, c) => s + (c._sum.amountPaise ?? 0), 0);
  const salaries = byCategory.find((c) => c.category === "SALARY")?._sum.amountPaise ?? 0;
  const inputGst = byCategory.reduce((s, c) => s + (c._sum.gstPaise ?? 0), 0);
  const runRate = subs.reduce((s, x) => s + perMonth(x.amountPaise, x.cycle), 0);
  const label = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(from);
  const shift = (n: number) => new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
  const change = previous._sum.amountPaise ? Math.round(((total - previous._sum.amountPaise) / previous._sum.amountPaise) * 100) : null;

  return (
    <>
      <PageHead kicker="Money" title="Expenses & salaries" sub={label} exportKind="expenses">
        <a href={`/admin/expenses?month=${shift(-1)}`} className="crm-btn crm-btn-secondary crm-btn-sm">← {shift(-1)}</a>
        {month !== today.slice(0, 7) && <a href={`/admin/expenses?month=${shift(1)}`} className="crm-btn crm-btn-secondary crm-btn-sm">{shift(1)} →</a>}
      </PageHead>
      <MoneyTabs active="expenses" />
      <Stats
        items={[
          { label: `Spent in ${label}`, value: money(total), hint: change === null ? undefined : `${change >= 0 ? "+" : ""}${change}% on last month` },
          { label: "Salaries", value: money(salaries), hint: `${salaryPeople.length} people paid` },
          { label: "Subscriptions (a month)", value: money(runRate), hint: `${subs.length} active`, href: "/admin/expenses/subscriptions" },
          { label: "Input GST to claim", value: money(inputGst), href: "/admin/expenses/gst" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AddPanel label="Add an expense">
          <ActionForm action={addExpense} submit="Add expense" reset>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date"><input name="date" type="date" defaultValue={today} className="crm-input" /></Field>
              <Field label="Category"><Select name="category" required defaultValue="OTHER" options={EXPENSE_CATEGORY} /></Field>
              <Field label="What for" className="sm:col-span-2"><input name="description" required className="crm-input" placeholder="Camera rental for the Mahindra shoot" /></Field>
              <Field label="Paid to"><input name="payee" className="crm-input" placeholder="Vendor or person" /></Field>
              <Field label="Paid via"><Select name="paidVia" options={PAID_VIA} /></Field>
              <Field label="Amount (₹, total paid)"><input name="amount" required inputMode="decimal" className="crm-input" /></Field>
              <Field label="GST in it (₹)" hint="From the bill; claimable as input credit."><input name="gst" inputMode="decimal" className="crm-input" /></Field>
              <Field label="Invoice / reference"><input name="reference" className="crm-input" /></Field>
            </div>
            <Field label="Notes"><textarea name="notes" className="crm-input !min-h-16" /></Field>
          </ActionForm>
        </AddPanel>
        <AddPanel label="Add this month's salaries">
          <ActionForm action={addPayroll} submit="Record salaries" reset>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Paid on"><input name="date" type="date" defaultValue={today} className="crm-input" /></Field>
              <Field label="Paid via"><Select name="paidVia" options={PAID_VIA} defaultValue="Bank transfer" /></Field>
            </div>
            <Field label="One person a line" hint="Name: amount. Each becomes its own salary row."><textarea name="lines" required className="crm-input !min-h-28" placeholder={"Tanvi: 85000\nGaurav: 70000"} /></Field>
          </ActionForm>
        </AddPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <form className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="month" value={month} />
            <Select name="category" defaultValue={category} options={EXPENSE_CATEGORY} placeholder="All categories" className="max-w-[16rem]" />
            <button className="crm-btn crm-btn-secondary crm-btn-sm">Filter</button>
          </form>
          {rows.length === 0 ? (
            <Empty>No expenses recorded for {label}.</Empty>
          ) : (
            <Table head={["Date", "What", "Category", "Paid to", "Amount", "GST", ""]}>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap">{date(e.date)}</td>
                  <td className="text-bone">{e.description}{e.reference && <span className="block text-[0.75rem] text-faint">{e.reference}</span>}</td>
                  <td>{EXPENSE_CATEGORY[e.category]}</td>
                  <td>{e.payee ?? "—"}{e.paidVia && <span className="block text-[0.75rem] text-faint">{e.paidVia}</span>}</td>
                  <td className="whitespace-nowrap text-bone">{money(e.amountPaise)}</td>
                  <td className="whitespace-nowrap">{e.gstPaise ? money(e.gstPaise) : "—"}</td>
                  <td>
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-[0.75rem] text-faint hover:text-[#dc2626]" aria-label="Delete expense">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
        <div className="space-y-6">
          <Card title="By category">
            {byCategory.length === 0 ? (
              <p className="text-ash">Nothing yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {[...byCategory].sort((a, b) => (b._sum.amountPaise ?? 0) - (a._sum.amountPaise ?? 0)).map((c) => (
                  <li key={c.category}>
                    <span className="flex justify-between text-[0.875rem]"><span className="text-bone">{EXPENSE_CATEGORY[c.category]}</span><span>{money(c._sum.amountPaise)}</span></span>
                    <span className="mt-1 block h-1.5 rounded-full bg-[var(--hover-wash)]"><span className="block h-full rounded-full bg-[var(--brand-ink)]" style={{ width: `${total ? Math.max(2, ((c._sum.amountPaise ?? 0) / total) * 100) : 0}%` }} /></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Salaries this month">
            {salaryPeople.length === 0 ? (
              <p className="text-ash">None recorded yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {salaryPeople.map((p) => (
                  <li key={p.payee ?? "—"} className="flex justify-between py-2 text-[0.875rem]"><span className="text-bone">{p.payee ?? "—"}</span><span>{money(p._sum.amountPaise)}</span></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
