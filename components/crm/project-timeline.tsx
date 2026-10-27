import Link from "next/link";

import { projectRef } from "@/lib/crm/catalog";

/*
 * THE PROJECT TIMELINE (Genesis, 27 Oct 2026: "track project timeline, add
 * the timeline in the main box"). One row per project, from its start to its
 * due date, cut into its stages: done, the one it's on, still to come. A line
 * marks today; a late project's bar is red. A project without dates runs
 * from when it was opened, dashed, until dates are set on its page.
 */

export type TimelineProject = { id: string; number: number; name: string; client: string; start: Date; due: Date | null; stages: readonly string[]; stage: number; active: boolean };

const DAY = 864e5;
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export function ProjectTimeline({ projects, today }: { projects: TimelineProject[]; today: Date }) {
  if (!projects.length) return <p className="text-[0.875rem] text-ash">No projects to show.</p>;
  /* The window: from the earliest start (or a week ago) to the latest due date (or a month ahead), at most about six months. */
  const from = new Date(Math.max(Math.min(today.getTime() - 7 * DAY, ...projects.map((p) => p.start.getTime())), today.getTime() - 90 * DAY));
  const to = new Date(Math.min(Math.max(today.getTime() + 30 * DAY, ...projects.map((p) => (p.due ?? p.start).getTime() + 7 * DAY)), from.getTime() + 190 * DAY));
  const span = to.getTime() - from.getTime();
  const at = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - from.getTime()) / span) * 100));
  /* Month marks along the top. */
  const months: { label: string; left: number }[] = [];
  for (let m = new Date(from.getFullYear(), from.getMonth() + 1, 1); m < to; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) months.push({ label: m.toLocaleDateString("en-IN", { month: "short" }), left: at(m) });
  const now = at(today);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1" data-lenis-prevent>
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-[14rem_minmax(0,1fr)] gap-3">
          <span />
          <div className="relative h-6 border-b border-[var(--glass-border)] text-[0.6875rem] uppercase tracking-[0.1em] text-faint">
            <span className="absolute left-0 top-0">{fmt(from)}</span>
            {months.map((m) => (
              <span key={m.label + m.left} className="absolute top-0 -translate-x-1/2 border-l border-[var(--glass-border)] pl-1" style={{ left: `${m.left}%` }}>{m.label}</span>
            ))}
            <span className="absolute right-0 top-0">{fmt(to)}</span>
          </div>
        </div>
        <ul className="mt-1">
          {projects.map((p) => {
            const end = p.due ?? new Date(Math.max(p.start.getTime() + 14 * DAY, today.getTime() + 7 * DAY));
            const left = at(p.start);
            const width = Math.max(1.5, at(end) - left);
            const late = p.active && p.due && p.due < today;
            const current = p.stages[Math.min(p.stage, p.stages.length - 1)] ?? "";
            return (
              <li key={p.id} className="grid grid-cols-[14rem_minmax(0,1fr)] items-center gap-3 border-b border-[var(--glass-border)] py-2.5 last:border-b-0">
                <Link href={`/admin/projects/${p.id}`} className="min-w-0">
                  <span className="block truncate text-[0.875rem] text-bone hover:underline">{p.name}</span>
                  <span className="block truncate text-[0.75rem] text-ash">{projectRef(p.number)} · {p.client}</span>
                </Link>
                <div className="relative h-10">
                  {/* Today. */}
                  <span aria-hidden className="absolute inset-y-[-0.625rem] w-px bg-[#ffc516]/60" style={{ left: `${now}%` }} />
                  <Link
                    href={`/admin/projects/${p.id}`}
                    title={`${p.name}: ${fmt(p.start)} → ${p.due ? fmt(p.due) : "no due date yet"} · ${current}`}
                    className={`absolute top-0 flex h-5 overflow-hidden rounded-full ${p.due ? "" : "border border-dashed border-[var(--glass-border)]"} ${late ? "ring-2 ring-[#dc2626]" : ""}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {p.stages.map((s, i) => (
                      <span
                        key={s + i}
                        className={`h-full flex-1 border-r border-[var(--crm-card)] last:border-r-0 ${i < p.stage ? "bg-gradient-to-r from-[#a78bfa] to-[#f472b6]" : i === p.stage && p.active ? "bg-[#ffc516]" : i === p.stage ? "bg-gradient-to-r from-[#a78bfa] to-[#f472b6]" : "bg-[var(--hover-wash)]"}`}
                      />
                    ))}
                  </Link>
                  <span className="absolute top-6 truncate text-[0.6875rem] text-ash" style={{ left: `${Math.min(left, 70)}%`, maxWidth: "60%" }}>
                    {current}
                    <span className={late ? "font-semibold text-[#dc2626]" : "text-faint"}> · {p.due ? `${late ? "was due" : "due"} ${fmt(p.due)}` : "no due date"}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-faint">
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#f472b6]" /> Done</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-[#ffc516]" /> Now</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-[var(--hover-wash)]" /> To come</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-[#ffc516]/60" /> Today</span>
          <span>Dashed: no due date yet. Set dates on the project.</span>
        </p>
      </div>
    </div>
  );
}
