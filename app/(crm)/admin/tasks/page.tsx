import { ActionForm } from "@/components/crm/action-form";
import { AddPanel, Field, PageHead, Select } from "@/components/crm/ui";
import { TaskSheet } from "@/components/crm/task-sheet";
import { getPrisma } from "@/lib/db";
import { todayIst } from "@/lib/crm/catalog";
import { inDays, staffOptions } from "@/lib/crm/options";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { createTask } from "../actions/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ owner?: string; done?: string; add?: string }> }) {
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
  /* The sheet's rows (components/crm/task-sheet): every cell edited in place. */
  const rows = (list: typeof tasks) =>
    list.map((t) => ({
      id: t.id,
      title: t.title,
      details: t.details ?? "",
      links: t.links.join(", "),
      ownerId: t.ownerId,
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      priority: t.priority,
      done: t.status === "DONE",
      about: t.lead ? { href: `/admin/leads/${t.lead.id}`, label: t.lead.name } : t.project ? { href: `/admin/projects/${t.project.id}`, label: t.project.name } : t.account ? { href: `/admin/accounts/${t.account.id}`, label: t.account.name } : null,
      from: t.by && t.createdById !== t.ownerId ? (t.by.name ?? t.by.email) : null,
    }));
  const sheet = (list: typeof tasks, owner: string | null) => <TaskSheet rows={rows(list)} staff={staff} today={today} defaultOwner={owner} newDue={inDays(1)} />;
  return (
    <>
      <PageHead kicker="Today" title="Tasks" sub={params.done ? "Done" : "Open, by due date"} />
      <form action="/admin/tasks" className="flex flex-wrap items-end gap-2">
        {superAdmin && <Select name="owner" defaultValue={params.owner} options={[...staff, ["all", "Everyone"]]} placeholder="Mine & assigned by me" className="max-w-[16rem]" />}
        <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="done" value="1" defaultChecked={Boolean(params.done)} /> Show done</label>
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Show</button>
      </form>
      <AddPanel label="Add a task" open={params.add === "1"}>
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
        <div className="space-y-6">
          {([["My tasks", mine, null], ["Assigned by me", given, ""]] as const).map(([heading, list, owner]) => (
            <section key={heading} className="crm-card overflow-hidden p-3 sm:p-4">
              <h2 className="mb-2 flex items-center justify-between px-1 font-sans text-[1.25rem] font-semibold text-bone">{heading}<span className="text-[0.8125rem] text-ash">{list.length}</span></h2>
              {sheet(list, owner)}
            </section>
          ))}
        </div>
      ) : (
        <section className="crm-card overflow-hidden p-3 sm:p-4">{sheet(tasks, null)}</section>
      )}
    </>
  );
}
