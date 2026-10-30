"use client";

import { Check, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { patchTask, type TaskPatch } from "@/app/(crm)/admin/actions/tasks";

type Priority = "LOW" | "NORMAL" | "HIGH";
export type DashTask = { id: string; title: string; dueDate: string | null; priority: Priority; to: string | null };

const PRIORITY: Record<Priority, string> = { LOW: "Low", NORMAL: "Normal", HIGH: "High" };

/**
 * A TASK YOU CAN EDIT ON THE DASHBOARD (Genesis, 31 Oct 2026: "this should be
 * editable here"): tick it done, rename it (click the title), change its due
 * date and priority, saved as you go (patchTask, the Tasks page's own). In
 * Nova's live demo it changes on screen only.
 */
export function DashboardTask({ task, today, demo }: { task: DashTask; today: string; demo: boolean }) {
  const router = useRouter();
  const [t, setT] = useState(task);
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [, start] = useTransition();

  const save = (patch: TaskPatch, next: Partial<DashTask> = {}) => {
    setT((x) => ({ ...x, ...next }));
    if (demo) return setNote("Not saved in the demo");
    start(async () => {
      const r = await patchTask(t.id, patch).catch(() => ({ ok: false as const, message: "Couldn't save. Try again." }));
      if (!r.ok) {
        setT(task);
        setDone(false);
        return setNote(r.message);
      }
      setNote(null);
      if (patch.done) router.refresh();
    });
  };

  const late = !done && t.dueDate && t.dueDate < today;
  return (
    <li className={`flex items-center gap-3 py-2 transition-opacity ${done ? "opacity-45" : ""}`}>
      <button
        type="button"
        onClick={() => {
          setDone(true);
          save({ done: true });
        }}
        aria-label={`Mark “${t.title}” done`}
        title="Mark done"
        className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${done ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)] text-transparent hover:border-[#ffc516] hover:text-[#ffc516]"}`}
      >
        <Check className="size-3.5" aria-hidden />
      </button>
      <span className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={t.title}
            maxLength={200}
            aria-label="Task"
            onBlur={(e) => {
              setEditing(false);
              const title = e.target.value.trim();
              if (title && title !== t.title) save({ title }, { title });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditing(false);
            }}
            className="crm-input !h-8 !py-1 text-[0.9375rem]"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} title="Click to rename" className={`block w-full truncate text-left text-bone hover:text-[#ffc516] ${done ? "line-through" : ""}`}>
            {t.title}
          </button>
        )}
        {(t.to || note) && <span className="block truncate text-[0.75rem] text-ash">{note ?? `to ${t.to}`}</span>}
      </span>
      {/* Priority as a small flag that cycles Low → Normal → High; the word only when it's High. */}
      <button
        type="button"
        onClick={() => {
          const next: Priority = t.priority === "LOW" ? "NORMAL" : t.priority === "NORMAL" ? "HIGH" : "LOW";
          save({ priority: next }, { priority: next });
        }}
        title={`Priority: ${PRIORITY[t.priority]} (click to change)`}
        aria-label={`Priority ${PRIORITY[t.priority]}, change`}
        className={`flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.75rem] transition-colors ${t.priority === "HIGH" ? "bg-[#dc2626]/15 text-[#f87171]" : t.priority === "LOW" ? "text-faint/60 hover:text-ash" : "text-faint hover:text-ash"}`}
      >
        <Flag className="size-3" aria-hidden />
        {t.priority === "HIGH" && "High"}
      </button>
      {/* The due date as "29 Oct"; a click opens the date picker. */}
      <label className={`relative shrink-0 cursor-pointer rounded-lg px-1.5 py-0.5 text-[0.8125rem] hover:bg-[var(--hover-wash)] ${late ? "font-semibold text-[#dc2626]" : "text-ash"}`}>
        {t.dueDate ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${t.dueDate}T00:00:00Z`)) : "Add date"}
        <input
          type="date"
          value={t.dueDate ?? ""}
          onChange={(e) => save({ dueDate: e.target.value || null }, { dueDate: e.target.value || null })}
          onClick={(e) => e.currentTarget.showPicker?.()}
          aria-label="Due date"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </li>
  );
}
