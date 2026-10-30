"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { addSheetTask, patchTask, type SheetTask, type TaskPatch } from "@/app/(crm)/admin/actions/tasks";

type Row = SheetTask & { about?: { href: string; label: string } | null; from?: string | null };

const PRIORITIES = [["LOW", "Low"], ["NORMAL", "Normal"], ["HIGH", "High"]] as const;
const CELL = "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[0.875rem] text-bone outline-none hover:border-[var(--glass-border)] focus:border-[#ffc516] focus:bg-[var(--surface-float)]";

/** Moves to the same column one row down (or up), like a spreadsheet. */
function move(from: HTMLElement, by: 1 | -1) {
  const sheet = from.closest("[data-sheet]");
  const row = Number(from.dataset.row);
  const next = sheet?.querySelector<HTMLElement>(`[data-row="${row + by}"][data-col="${from.dataset.col}"]`) ?? (by === 1 ? sheet?.querySelector<HTMLElement>('[data-new="title"]') : null);
  next?.focus();
}

/**
 * TASKS AS A SPREADSHEET (Genesis, 29 Oct 2026: "edit and write it inside the
 * task tab itself; easily editable like any spreadsheet"). Click a cell and
 * type: it saves when you leave it (Enter goes down a row, Esc undoes the
 * cell). The last row adds a task. Saves through app/(crm)/admin/actions/tasks.
 */
export function TaskSheet({ rows: initial, staff, today, defaultOwner, newDue }: { rows: Row[]; staff: [string, string][]; today: string; defaultOwner: string | null; newDue: string }) {
  const [rows, setRows] = useState(initial);
  const [state, setState] = useState<Record<string, "saving" | "saved" | string>>({});
  const [draft, setDraft] = useState({ title: "", ownerId: defaultOwner ?? "", dueDate: newDue, priority: "NORMAL" as Row["priority"] });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const newTitle = useRef<HTMLInputElement>(null);

  const save = async (id: string, patch: TaskPatch, local: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...local } : r)));
    setState((s) => ({ ...s, [id]: "saving" }));
    const res = await patchTask(id, patch).catch(() => ({ ok: false as const, message: "Couldn't save. Check your connection." }));
    setState((s) => ({ ...s, [id]: res.ok ? "saved" : res.message }));
  };

  const add = async () => {
    if (!draft.title.trim() || adding) return;
    setAdding(true);
    setAddError(null);
    const res = await addSheetTask({ title: draft.title, ownerId: draft.ownerId || null, dueDate: draft.dueDate || null, priority: draft.priority }).catch(() => ({ ok: false as const, message: "Couldn't add it. Check your connection." }));
    setAdding(false);
    if (!res.ok) return setAddError(res.message);
    setRows((rs) => [...rs, { ...res.task, about: null, from: null }]);
    setDraft((d) => ({ ...d, title: "" }));
    newTitle.current?.focus();
  };

  /* A text cell: saves on leaving it when changed; Enter moves down, Esc puts it back. */
  const text = (r: Row, i: number, col: "title" | "details" | "links", placeholder: string) => (
    <textarea
      rows={1}
      key={`${r.id}-${col}-${r[col]}`}
      defaultValue={r[col]}
      placeholder={placeholder}
      aria-label={`${col === "title" ? "Task" : col === "details" ? "Notes" : "Links"}, row ${i + 1}`}
      data-row={i}
      data-col={col}
      className={`${CELL} block resize-none [field-sizing:content] ${col === "title" && r.done ? "text-faint line-through" : ""} ${col !== "title" ? "text-ash" : ""} ${col === "links" ? "break-all" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          move(e.currentTarget, e.shiftKey ? -1 : 1);
        } else if (e.key === "Escape") {
          e.currentTarget.value = r[col];
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        const v = e.currentTarget.value;
        if (v === r[col]) return;
        if (col === "title" && !v.trim()) {
          e.currentTarget.value = r.title;
          return;
        }
        void save(r.id, { [col]: v }, { [col]: v });
      }}
    />
  );

  return (
    <div data-sheet className="relative -mx-1 overflow-x-auto" data-lenis-prevent>
      <table className="w-full min-w-[68rem] table-fixed border-separate border-spacing-0 text-left">
        <colgroup>
          <col className="w-10" />
          <col />
          <col className="w-40" />
          <col className="w-36" />
          <col className="w-24" />
          <col className="w-[24%]" />
          <col className="w-36" />
          <col className="w-[4.5rem]" />
        </colgroup>
        <thead>
          <tr className="text-[0.6875rem] uppercase tracking-[0.08em] text-faint [&>th]:border-b [&>th]:border-[var(--glass-border)] [&>th]:px-3 [&>th]:py-2 [&>th]:font-normal">
            <th><span className="sr-only">Done</span></th>
            <th>Task</th>
            <th>Assigned to</th>
            <th>Due</th>
            <th>Priority</th>
            <th>Notes</th>
            <th>Links</th>
            <th><span className="sr-only">Saved</span></th>
          </tr>
        </thead>
        <tbody className="[&>tr>td]:border-b [&>tr>td]:border-[var(--glass-border)] [&>tr>td]:px-1 [&>tr>td]:py-1 [&>tr>td]:align-middle">
          {rows.map((r, i) => {
            const late = !r.done && r.dueDate !== null && r.dueDate < today;
            const s = state[r.id];
            return (
              <tr key={r.id} className={`group ${r.done ? "opacity-60" : ""} hover:bg-[var(--hover-wash)]`}>
                <td className="text-center">
                  <input type="checkbox" checked={r.done} aria-label={r.done ? `Reopen ${r.title}` : `Mark ${r.title} done`} onChange={(e) => void save(r.id, { done: e.target.checked }, { done: e.target.checked })} className="size-4 accent-[#16a34a]" />
                </td>
                <td>
                  {text(r, i, "title", "Task")}
                  {(r.about || r.from) && (
                    <span className="block px-2 pb-1 text-[0.75rem] text-faint">
                      {r.about && <Link href={r.about.href} className="hover:text-bone">{r.about.label} ↗</Link>}
                      {r.about && r.from && " · "}
                      {r.from && `from ${r.from}`}
                    </span>
                  )}
                </td>
                <td>
                  <select value={r.ownerId ?? ""} data-row={i} data-col="owner" aria-label={`Assigned to, row ${i + 1}`} onChange={(e) => void save(r.id, { ownerId: e.target.value || null }, { ownerId: e.target.value || null })} className={`${CELL} cursor-pointer`}>
                    <option value="">Unassigned</option>
                    {staff.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </td>
                <td>
                  <input type="date" value={r.dueDate ?? ""} data-row={i} data-col="due" aria-label={`Due, row ${i + 1}`} onChange={(e) => void save(r.id, { dueDate: e.target.value || null }, { dueDate: e.target.value || null })} className={`${CELL} ${late ? "!font-semibold !text-[#dc2626]" : ""}`} />
                </td>
                <td>
                  <select value={r.priority} data-row={i} data-col="priority" aria-label={`Priority, row ${i + 1}`} onChange={(e) => void save(r.id, { priority: e.target.value as Row["priority"] }, { priority: e.target.value as Row["priority"] })} className={`${CELL} cursor-pointer ${r.priority === "HIGH" ? "!text-[#dc2626]" : r.priority === "LOW" ? "!text-faint" : ""}`}>
                    {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td>{text(r, i, "details", "Add a note")}</td>
                <td>
                  {text(r, i, "links", "Paste a link")}
                  {r.links && (
                    <span className="flex flex-wrap gap-x-2 px-2 text-[0.75rem]">
                      {r.links.split(/[\s,]+/).filter(Boolean).map((l) => <a key={l} href={l} target="_blank" rel="noreferrer" className="crm-link max-w-[12rem] truncate">Open ↗</a>)}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 text-[0.75rem]" aria-live="polite">
                  {s === "saving" ? <span className="text-faint">Saving…</span> : s === "saved" ? <span className="text-[#16a34a]">Saved</span> : s ? <span className="text-[#dc2626]" title={s}>Not saved</span> : null}
                </td>
              </tr>
            );
          })}
          {/* The last row: type a task and press Enter. */}
          <tr className="bg-[var(--hover-wash)]/40">
            <td className="text-center text-faint">+</td>
            <td>
              <input
                ref={newTitle}
                data-new="title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void add();
                  }
                }}
                placeholder={adding ? "Adding…" : "Type a new task and press Enter"}
                aria-label="New task"
                className={CELL}
              />
            </td>
            <td>
              <select value={draft.ownerId} onChange={(e) => setDraft((d) => ({ ...d, ownerId: e.target.value }))} aria-label="New task: assigned to" className={`${CELL} cursor-pointer`}>
                <option value="">Me</option>
                {staff.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </td>
            <td><input type="date" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} aria-label="New task: due" className={CELL} /></td>
            <td>
              <select value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as Row["priority"] }))} aria-label="New task: priority" className={`${CELL} cursor-pointer`}>
                {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </td>
            <td colSpan={2}>
              <button type="button" onClick={() => void add()} disabled={adding || !draft.title.trim()} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-40">Add</button>
              {addError && <span className="ml-2 text-[0.75rem] text-[#dc2626]">{addError}</span>}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
      <p className="px-2 pt-2 text-[0.75rem] text-faint">Click any cell and type; it saves when you leave it. Enter goes down a row (⇧Enter up), Esc undoes a cell. Tick to mark done.</p>
    </div>
  );
}
