"use client";

import { useActionState, useEffect, useRef } from "react";

import type { ActionState } from "@/lib/crm/form-state";

/**
 * A form posting to a CRM server action, showing its result beside the
 * button. `reset` clears the form after a success (a message box, a new note).
 */
export function ActionForm({
  action,
  children,
  submit,
  confirm,
  className = "",
  tone = "primary",
  reset = false,
  inline = false,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  submit: string;
  confirm?: string;
  className?: string;
  tone?: "primary" | "secondary" | "danger";
  reset?: boolean;
  inline?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (reset && state?.ok) form.current?.reset();
  }, [reset, state]);
  return (
    <form
      ref={form}
      action={formAction}
      className={inline ? `flex flex-wrap items-end gap-2 ${className}` : `space-y-3 ${className}`}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className={`crm-btn crm-btn-${tone} ${inline ? "crm-btn-sm" : ""}`} disabled={pending}>
          {pending ? "Working…" : submit}
        </button>
        {state?.message && (
          <span className={`text-[0.8125rem] font-medium ${state.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} role={state.ok ? "status" : "alert"}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
