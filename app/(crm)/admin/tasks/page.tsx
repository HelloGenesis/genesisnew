import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Badge, Empty, Field, PageHead, Select } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, todayIst } from "@/lib/crm/catalog";
import { inDays, staffOptions } from "@/lib/crm/options";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { createTask, toggleTask, updateTask } from "../actions/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ owner?: string; done?: string }> }) {
  const viewer = await requireStaff();
  const params = await searchParams;
  /* No filter chosen: two panels, what's mine and what I've given others (Genesis, 11 Oct 2026). */
  /* Other people's tasks: super admins only (lib/crm/scope). */
  const superAdmin = isSuperAdmin(viewer);
  const split = !params.owner || !superAdmin;
  const owner = !superAdmin ? viewer.id : params.owner === "all" ? undefined : (params.owner ?? viewer.id);
  const [tasks, staff] = await Promise.all([
    getPrisma().task.findMany({
      where: { ...(split ? { OR: [{ ownerId: viewer.id }, { createdById: viewer.id }] } : owner ? { ownerId: owner } : {}), status: params.done ? "DONE" : "OPEN" },
      orderBy: params.done ? { completedAt: "desc" } : [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
      take: 300,
      include: { owner: true, lead: true, account: true, project: true },
    }).then(async (rows) => {
      const ids = [...new Set(rows.map((r) => r.createdById).filter((x): x is string => Boolean(x)))];
      const people = await getPrisma().user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
      return rows.map((r) => ({ ...r, by: people.find((p) => p.id === r.createdById) }));
    }),
    staffOptions(),
  ]);
  const today = todayIst();
  const mine = tasks.filter((t) => t.ownerId === viewer.id);
  const given = tasks.filter((t) => t.ownerId !== viewer.id && t.createdById === viewer.id);
  const rows = (list: typeof tasks) => list.map((t) => {
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
                  {t.links.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.8125rem]">
                      {t.links.map((l) => <a key={l} href={l} target="_blank" rel="noreferrer" className="crm-link max-w-[18rem] truncate">{/drive\.google|docs\.google/.test(l) ? "📁 " : ""}{l.replace(/^https?:\/\/(www\.)?/, "")}</a>)}
                    </span>
                  )}
                </span>
                {about && <Link href={about.href} className="text-[0.8125rem] text-ash hover:text-bone">{about.label} ↗</Link>}
                {t.priority === "HIGH" && <Badge tone="bad">High</Badge>}
                <span className="text-[0.8125rem] text-ash">{t.owner?.name ?? t.owner?.email ?? "Unassigned"}{t.by && t.createdById !== t.ownerId ? <span className="text-faint"> · from {t.by.name ?? t.by.email}</span> : null}</span>
                <span className={`text-[0.8125rem] ${late ? "font-semibold text-[#dc2626]" : "text-faint"}`}>{date(t.dueDate)}</span>
                <details className="w-full">
                  <summary className="cursor-pointer text-[0.75rem] text-faint">Edit · reassign</summary>
                  <ActionForm action={updateTask} submit="Save" inline className="mt-2">
                    <input type="hidden" name="id" value={t.id} />
                    <input name="title" defaultValue={t.title} className="crm-input min-w-[12rem] flex-1" />
                    <Select name="ownerId" defaultValue={t.ownerId} options={staff} className="w-auto" placeholder="Unassigned" />
                    <input name="dueDate" type="date" defaultValue={t.dueDate ? t.dueDate.toISOString().slice(0, 10) : ""} className="crm-input w-auto" />
                    <Select name="priority" required defaultValue={t.priority} options={[["LOW", "Low"], ["NORMAL", "Normal"], ["HIGH", "High"]]} className="w-auto" />
                    <input type="hidden" name="details" value={t.details ?? ""} />
                    <input name="links" defaultValue={t.links.join(", ")} placeholder="Links (comma separated)" className="crm-input min-w-[14rem] flex-1" />
                  </ActionForm>
                </details>
              </li>
            );
  });
  return (
    <>
      <PageHead kicker="Today" title="Tasks" sub={params.done ? "Done" : "Open, by due date"} />
      <form action="/admin/tasks" className="flex flex-wrap items-end gap-2">
        {superAdmin && <Select name="owner" defaultValue={params.owner} options={[...staff, ["all", "Everyone"]]} placeholder="Mine & assigned by me" className="max-w-[16rem]" />}
        <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="done" value="1" defaultChecked={Boolean(params.done)} /> Show done</label>
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Show</button>
      </form>
      <AddPanel label="Add a task">
        <ActionForm action={createTask} submit="Add task" reset>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Task" className="sm:col-span-2"><input name="title" required className="crm-input" /></Field>
            <Field label="Due"><input name="dueDate" type="date" defaultValue={inDays(1)} className="crm-input" /></Field>
            <Field label="Priority"><Select name="priority" required defaultValue="NORMAL" options={[["LOW", "Low"], ["NORMAL", "Normal"], ["HIGH", "High"]]} /></Field>
            <Field label="Assign to" hint="They get an email and see it on their dashboard."><Select name="ownerId" options={staff} defaultValue={viewer.id} /></Field>
          </div>
          <Field label="Details"><textarea name="details" className="crm-input !min-h-16" /></Field>
          <Field label="Links" hint="Drive folders, Docs, Canva, references: one a line."><textarea name="links" className="crm-input !min-h-14" placeholder="https://drive.google.com/…" /></Field>
        </ActionForm>
      </AddPanel>
      {split && !params.done ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {([["My tasks", mine, "Nothing assigned to you."], ["Assigned by me", given, "You haven't given anyone a task."]] as const).map(([heading, list, empty]) => (
            <section key={heading} className="crm-card overflow-hidden">
              <h2 className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3 text-bone">{heading}<span className="text-[0.8125rem] text-ash">{list.length}</span></h2>
              {list.length === 0 ? <p className="px-4 py-6 text-ash">{empty}</p> : <ul className="divide-y divide-[var(--glass-border)]">{rows(list)}</ul>}
            </section>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Empty>No tasks here.</Empty>
      ) : (
        <ul className="crm-card divide-y divide-[var(--glass-border)]">{rows(tasks)}</ul>
      )}
    </>
  );
}
