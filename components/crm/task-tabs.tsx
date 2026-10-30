"use client";

import { usePref } from "./use-pref";

/**
 * THE DASHBOARD'S TASKS, TWO WAYS (Genesis, 31 Oct 2026: "two options: tasks
 * for me, tasks I have assigned"): one list at a time, the choice kept in
 * this browser. Both lists stay mounted, so a cell being typed in keeps its
 * text across a switch.
 */
export function TaskTabs({ mine, given }: { mine: { count: number; node: React.ReactNode }; given: { count: number; node: React.ReactNode } }) {
  const [showGiven, setShowGiven] = usePref("crm-dashboard-tasks-given", false);
  const tab = (on: boolean, label: string, count: number, pick: () => void) => (
    <button type="button" role="tab" aria-selected={on} onClick={pick} className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.875rem] transition-colors ${on ? "bg-[#ffc516] font-medium text-[#141216]" : "text-ash hover:bg-[var(--hover-wash)] hover:text-bone"}`}>
      {label}
      <span className={`rounded-full px-1.5 text-[0.75rem] tabular-nums leading-5 ${on ? "bg-[#141216]/15" : "bg-[var(--hover-wash)]"}`}>{count}</span>
    </button>
  );
  return (
    <div>
      <div role="tablist" aria-label="Which tasks" className="mb-3 inline-flex gap-1 rounded-full border border-[var(--glass-border)] p-1">
        {tab(!showGiven, "For me", mine.count, () => setShowGiven(false))}
        {tab(showGiven, "I've assigned", given.count, () => setShowGiven(true))}
      </div>
      <div className="max-h-[30rem] overflow-y-auto pr-1" data-lenis-prevent>
        <div role="tabpanel" hidden={showGiven}>{mine.node}</div>
        <div role="tabpanel" hidden={!showGiven}>{given.node}</div>
      </div>
    </div>
  );
}
