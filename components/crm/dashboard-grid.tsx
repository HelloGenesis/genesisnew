"use client";

import { ArrowDown, ArrowUp, EyeOff, GripVertical, LayoutDashboard, Maximize2, Minimize2, Plus, RotateCcw } from "lucide-react";
import { useState, useSyncExternalStore, useTransition } from "react";

import { saveDashboardLayout } from "@/app/(crm)/admin/actions/dashboard";
import { DEFAULT_LAYOUT, normaliseLayout, WIDGETS, type WidgetId, type WidgetSlot } from "@/lib/crm/dashboard-layout";

const DEMO_KEY = "nova-dashboard-layout";
const noSubscribe = () => () => {};
const readDemo = () => {
  try {
    return localStorage.getItem(DEMO_KEY);
  } catch {
    return null;
  }
};
const TOOL = "grid size-8 place-items-center rounded-lg text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone disabled:opacity-30";

/**
 * THE DASHBOARD'S SECTIONS, ARRANGED BY EACH PERSON (lib/crm/dashboard-layout).
 * "Customise": drag a section, or move it up and down with the arrows, make it
 * full or half width, hide it, and add any of the others from the list under
 * them. Saved for this person; in Nova's live demo, in this browser.
 */
export function DashboardGrid({ layout: initial, nodes, demo }: { layout: WidgetSlot[]; nodes: Partial<Record<WidgetId, React.ReactNode>>; demo: boolean }) {
  /* The demo keeps a visitor's arrangement in their browser (read without a render on the server, so nothing mismatches). */
  const stored = useSyncExternalStore(
    noSubscribe,
    () => (demo ? readDemo() : null),
    () => null,
  );
  const [local, setLocal] = useState<WidgetSlot[] | null>(null);
  const layout = local ?? (stored ? normaliseLayout(JSON.parse(stored)) : initial);
  const setLayout = setLocal;
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState<WidgetId | null>(null);
  const [saving, start] = useTransition();

  const usable = layout.filter((s) => nodes[s.id] !== undefined);
  const shown = usable.filter((s) => !s.hidden);
  const hidden = usable.filter((s) => s.hidden);

  const update = (next: WidgetSlot[]) => setLayout(next);
  const move = (id: WidgetId, by: -1 | 1) => {
    const order = shown.map((s) => s.id);
    const i = order.indexOf(id);
    const j = i + by;
    if (j < 0 || j >= order.length) return;
    const other = order[j]!;
    const a = layout.findIndex((s) => s.id === id);
    const b = layout.findIndex((s) => s.id === other);
    const next = [...layout];
    [next[a], next[b]] = [next[b]!, next[a]!];
    update(next);
  };
  const dropBefore = (target: WidgetId) => {
    if (!dragging || dragging === target) return;
    const next = layout.filter((s) => s.id !== dragging);
    next.splice(next.findIndex((s) => s.id === target), 0, layout.find((s) => s.id === dragging)!);
    update(next);
  };
  const patch = (id: WidgetId, p: Partial<WidgetSlot>) => update(layout.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const save = (next: WidgetSlot[] | null) => {
    setEditing(false);
    if (next === null) setLayout(DEFAULT_LAYOUT);
    if (demo) {
      try {
        if (next) localStorage.setItem(DEMO_KEY, JSON.stringify(next));
        else localStorage.removeItem(DEMO_KEY);
      } catch {
        /* Private window: kept until the page reloads. */
      }
      return;
    }
    start(async () => {
      await saveDashboardLayout(next);
    });
  };

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center gap-2 ${editing ? "crm-card px-4 py-3" : "justify-end"}`}>
        {editing ? (
          <>
            <p className="mr-auto text-[0.875rem] text-ash">Drag sections, or use the arrows. Make one full or half width, hide it, or add more below.</p>
            <button type="button" onClick={() => save(null)} className="crm-btn crm-btn-secondary crm-btn-sm"><RotateCcw className="size-3.5" aria-hidden /> Reset</button>
            <button type="button" onClick={() => save(layout)} className="crm-btn crm-btn-primary crm-btn-sm">Done</button>
          </>
        ) : (
          <button type="button" onClick={() => setEditing(true)} disabled={saving} className="crm-btn crm-btn-secondary crm-btn-sm"><LayoutDashboard className="size-3.5" aria-hidden /> Customise</button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {shown.map((s, i) => (
          <div
            key={s.id}
            draggable={editing}
            onDragStart={() => setDragging(s.id)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => editing && e.preventDefault()}
            onDrop={() => dropBefore(s.id)}
            className={`relative min-w-0 ${s.wide ? "xl:col-span-2" : ""} ${editing ? "rounded-[1.25rem] outline-dashed outline-2 outline-offset-4 outline-[#ffc516]/40" : ""} ${dragging === s.id ? "opacity-40" : ""}`}
          >
            {editing && (
              <div className="absolute right-3 top-3 z-20 flex items-center gap-0.5 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-float,#1d1b1f)] p-1 shadow-lg">
                <span className={`${TOOL} cursor-grab`} title="Drag to move"><GripVertical className="size-4" aria-hidden /></span>
                <button type="button" onClick={() => move(s.id, -1)} disabled={i === 0} className={TOOL} aria-label={`Move ${WIDGETS[s.id].title} up`}><ArrowUp className="size-4" aria-hidden /></button>
                <button type="button" onClick={() => move(s.id, 1)} disabled={i === shown.length - 1} className={TOOL} aria-label={`Move ${WIDGETS[s.id].title} down`}><ArrowDown className="size-4" aria-hidden /></button>
                <button type="button" onClick={() => patch(s.id, { wide: !s.wide })} className={TOOL} aria-label={s.wide ? "Half width" : "Full width"} title={s.wide ? "Half width" : "Full width"}>{s.wide ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}</button>
                <button type="button" onClick={() => patch(s.id, { hidden: true })} className={TOOL} aria-label={`Hide ${WIDGETS[s.id].title}`} title="Hide"><EyeOff className="size-4" aria-hidden /></button>
              </div>
            )}
            <div className={editing ? "pointer-events-none select-none" : ""}>{nodes[s.id]}</div>
          </div>
        ))}
      </div>

      {editing && hidden.length > 0 && (
        <div className="crm-card p-5">
          <p className="text-[1.0625rem] font-semibold text-bone">Add a section</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {hidden.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => patch(s.id, { hidden: false })} className="flex h-full w-full items-start gap-3 rounded-xl border border-[var(--glass-border)] p-3 text-left transition-colors hover:border-[#ffc516]/60 hover:bg-[var(--hover-wash)]">
                  <Plus className="mt-0.5 size-4 shrink-0 text-[#ffc516]" aria-hidden />
                  <span>
                    <span className="block text-[0.9375rem] text-bone">{WIDGETS[s.id].title}</span>
                    <span className="block text-[0.8125rem] text-ash">{WIDGETS[s.id].blurb}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
