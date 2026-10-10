import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Badge, Empty, Field, PageHead, Select } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, todayIst } from "@/lib/crm/catalog";
import { inDays, staffOptions } from "@/lib/crm/options";
import { requireStaff } from "@/lib/crm/session";

import { createTask, toggleTask } from "../actions/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ owner?: string; done?: string }> }) {
  const viewer = await requireStaff();
  const params = await searchParams;
  const owner = params.owner === "all" ? undefined : (params.owner ?? viewer.id);
  const [tasks, staff] = await Promise.all([
    getPrisma().task.findMany({
      where: { ...(owner ? { ownerId: owner } : {}), status: params.done ? "DONE" : "OPEN" },
      orderBy: params.done ? { completedAt: "desc" } : [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
      take: 300,
      include: { owner: true, lead: true, account: true, project: true },
    }),
    staffOptions(),
  ]);
  const today = todayIst();
  return (
    <>
      <PageHead kicker="Today" title="Tasks" sub={params.done ? "Done" : "Open, by due date"} />
      <form action="/admin/tasks" className="flex flex-wrap items-end gap-2">
        <Select name="owner" required defaultValue={params.owner ?? viewer.id} options={[...staff, ["all", "Everyone"]]} className="max-w-[14rem]" />
        <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="done" value="1" defaultChecked={Boolean(params.done)} /> Show done</label>
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Show</button>
      </form>
      <AddPanel label="Add a task">
        <ActionForm action={createTask} submit="Add task" reset>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Task" className="sm:col-span-2"><input name="title" required className="crm-input" /></Field>
            <Field label="Due"><input name="dueDate" type="date" defaultValue={inDays(1)} className="crm-input" /></Field>
            <Field label="Priority"><Select name="priority" required defaultValue="NORMAL" options={[["LOW", "Low"], ["NORMAL", "Normal"], ["HIGH", "High"]]} /></Field>
            <Field label="Owner"><Select name="ownerId" options={staff} defaultValue={viewer.id} /></Field>
          </div>
          <Field label="Details"><textarea name="details" className="crm-input !min-h-16" /></Field>
        </ActionForm>
      </AddPanel>
      {tasks.length === 0 ? (
        <Empty>No tasks here.</Empty>
      ) : (
        <ul className="crm-card divide-y divide-[var(--glass-border)]">
          {tasks.map((t) => {
            const late = t.status === "OPEN" && t.dueDate && t.dueDate.toISOString().slice(0, 10) < today;
            const about = t.lead ? { href: `/admin/leads/${t.lead.id}`, label: t.lead.name } : t.project ? { href: `/admin/projects/${t.project.id}`, label: t.project.name } : t.account ? { href: `/admin/accounts/${t.account.id}`, label: t.account.name } : null;
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <form action={toggleTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <button aria-label={t.status === "OPEN" ? "Mark done" : "Reopen"} className={`grid size-5 place-items-center rounded border border-[var(--glass-border)] ${t.status === "DONE" ? "bg-[#16a34a] text-white" : ""}`}>{t.status === "DONE" ? "✓" : ""}</button>
                </form>
                <span className="min-w-0 flex-1">
                  <span className={t.status === "DONE" ? "text-faint line-through" : "text-bone"}>{t.title}</span>
                  {t.details && <span className="block text-[0.8125rem] text-ash">{t.details}</span>}
                </span>
                {about && <Link href={about.href} className="text-[0.8125rem] text-ash hover:text-bone">{about.label} ↗</Link>}
                {t.priority === "HIGH" && <Badge tone="bad">High</Badge>}
                <span className="text-[0.8125rem] text-ash">{t.owner?.name ?? t.owner?.email ?? ""}</span>
                <span className={`text-[0.8125rem] ${late ? "font-semibold text-[#dc2626]" : "text-faint"}`}>{date(t.dueDate)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
