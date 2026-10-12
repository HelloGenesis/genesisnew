"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

/**
 * THE PIPELINE BOARD (Genesis, 12 Oct 2026: "drag n drop or move to previous
 * also"). Cards drag between stages, or step back and forward with the
 * arrows. Call booked carries "Create quotation"; Proposal sent carries "Book
 * a call" and "Follow up", which put the step on Google Calendar.
 */

export type BoardLead = {
  id: string;
  name: string;
  company: string | null;
  status: string;
  division: string | null;
  value: string | null;
  partner: string | null;
  followUp: string | null;
  overdue: boolean;
};

type Props = {
  leads: BoardLead[];
  columns: { status: string; label: string }[];
  move: (form: FormData) => Promise<void>;
  plan: (form: FormData) => Promise<{ ok: boolean; calendarUrl?: string; message?: string }>;
};

export function LeadBoard({ leads, columns, move, plan }: Props) {
  const [pending, startTransition] = useTransition();
  const [shown, moveOptimistic] = useOptimistic(leads, (current, change: { id: string; status: string }) => current.map((l) => (l.id === change.id ? { ...l, status: change.status } : l)));
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [planning, setPlanning] = useState<{ id: string; kind: "CALL" | "FOLLOW_UP" } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const moveTo = (id: string, status: string) => {
    const lead = shown.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    startTransition(async () => {
      moveOptimistic({ id, status });
      const form = new FormData();
      form.set("id", id);
      form.set("status", status);
      await move(form);
    });
  };

  const submitPlan = (form: FormData) => {
    startTransition(async () => {
      const result = await plan(form);
      if (!result.ok) return setMessage(result.message ?? "Couldn't save that.");
      setPlanning(null);
      setMessage("Saved as a task. Google Calendar opened in a new tab: click Save there.");
      if (result.calendarUrl) window.open(result.calendarUrl, "_blank", "noopener");
    });
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      {message && (
        <p className="crm-notice mb-3 flex items-center justify-between gap-3" role="status">
          {message}
          <button onClick={() => setMessage(null)} className="text-faint" aria-label="Close">×</button>
        </p>
      )}
      <div className={`grid min-w-[1400px] gap-3 ${pending ? "opacity-90" : ""}`} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map(({ status, label }, index) => {
          const column = shown.filter((l) => l.status === status);
          return (
            <section
              key={status}
              className={`min-w-0 rounded-xl p-1 transition-colors ${over === status ? "bg-[var(--hover-wash)] outline outline-1 outline-[#ffc516]" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/lead") || dragging;
                if (id) moveTo(id, status);
                setDragging(null);
              }}
            >
              <header className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-[0.875rem] font-medium text-bone">{label}</h2>
                <span className="text-[0.75rem] text-faint">{column.length}</span>
              </header>
              <ol className="min-h-16 space-y-2">
                {column.map((lead) => {
                  const prev = columns[index - 1];
                  const next = columns[index + 1];
                  return (
                    <li
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/lead", lead.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(lead.id);
                      }}
                      onDragEnd={() => setDragging(null)}
                      className={`crm-card cursor-grab p-3 active:cursor-grabbing ${dragging === lead.id ? "opacity-50" : ""}`}
                    >
                      <Link href={`/admin/leads/${lead.id}`} className="block" draggable={false}>
                        <span className="block truncate text-[0.9375rem] text-bone">{lead.name}</span>
                        {lead.company && <span className="block truncate text-[0.8125rem] text-ash">{lead.company}</span>}
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {lead.division && <span className="crm-badge crm-tone-info">{lead.division}</span>}
                          {lead.value && <span className="crm-badge crm-tone-muted">{lead.value}</span>}
                          {lead.partner && <span className="crm-badge crm-tone-warn">via {lead.partner}</span>}
                        </span>
                        {lead.followUp && <span className={`mt-1.5 block text-[0.75rem] ${lead.overdue ? "font-semibold text-[#dc2626]" : "text-faint"}`}>Follow up {lead.followUp}</span>}
                      </Link>

                      {status === "CALL_BOOKED" && (
                        <Link href={`/admin/quotes/new?lead=${lead.id}`} className="crm-btn crm-btn-primary crm-btn-sm mt-2 w-full justify-center">
                          Create quotation
                        </Link>
                      )}
                      {status === "PROPOSAL_SENT" && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <button type="button" onClick={() => setPlanning({ id: lead.id, kind: "CALL" })} className="crm-btn crm-btn-secondary crm-btn-sm justify-center">Book a call</button>
                          <button type="button" onClick={() => setPlanning({ id: lead.id, kind: "FOLLOW_UP" })} className="crm-btn crm-btn-secondary crm-btn-sm justify-center">Follow up</button>
                        </div>
                      )}
                      {planning?.id === lead.id && (
                        <form action={submitPlan} className="mt-2 space-y-1.5">
                          <input type="hidden" name="id" value={lead.id} />
                          <input type="hidden" name="kind" value={planning.kind} />
                          <input type="datetime-local" name="when" required className="crm-input !py-1.5 text-[0.8125rem]" />
                          <div className="flex gap-1.5">
                            <button className="crm-btn crm-btn-primary crm-btn-sm flex-1 justify-center">{planning.kind === "CALL" ? "Book & add to calendar" : "Plan & add to calendar"}</button>
                            <button type="button" onClick={() => setPlanning(null)} className="text-[0.75rem] text-faint">Cancel</button>
                          </div>
                        </form>
                      )}

                      <div className="mt-2 flex justify-between text-[0.75rem]">
                        {prev ? <button type="button" onClick={() => moveTo(lead.id, prev.status)} className="text-ash hover:text-bone" title={`Back to ${prev.label}`}>← {prev.label}</button> : <span />}
                        {next ? <button type="button" onClick={() => moveTo(lead.id, next.status)} className="text-ash hover:text-bone" title={`On to ${next.label}`}>{next.label} →</button> : <span />}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
