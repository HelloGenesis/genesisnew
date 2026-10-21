"use client";

import { Check, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * A TABLE CELL YOU CAN EDIT WHERE IT IS (Genesis, 22 Oct 2026: "everything
 * should be editable in the influencer section"). Shows the value; the pencil
 * (or a double-click) turns it into a box; Enter or leaving the box saves,
 * Esc cancels. `save` is a server action returning ok or a message.
 */
export function EditCell({
  value,
  save,
  children,
  placeholder,
  options,
  wide = false,
}: {
  /** What the box starts with: the raw value, not the formatted one. */
  value: string;
  save: (value: string) => Promise<{ ok: boolean; message?: string }>;
  children: React.ReactNode;
  placeholder?: string;
  /** A fixed choice instead of free text: [value, label]. */
  options?: readonly (readonly [string, string])[];
  wide?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const commit = (next = draft) => {
    if (next.trim() === value.trim()) return setEditing(false);
    start(async () => {
      const result = await save(next);
      if (!result.ok) return setError(result.message ?? "Not saved.");
      setError("");
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  };

  if (editing) {
    const common = {
      autoFocus: true,
      disabled: pending,
      "aria-label": placeholder ?? "Edit",
      className: `crm-input !min-h-8 !py-1 text-[0.8125rem] ${wide ? "min-w-[14rem]" : "min-w-[7rem]"}`,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setError("");
          setEditing(false);
        }
      },
    };
    return (
      <span className="block">
        {options ? (
          <select {...common} value={draft} onChange={(e) => { setDraft(e.target.value); commit(e.target.value); }} onBlur={() => setEditing(false)}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ) : (
          <input {...common} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={() => commit()} />
        )}
        {error && <span role="alert" className="mt-1 block text-[0.75rem] text-[#dc2626]">{error}</span>}
      </span>
    );
  }
  return (
    <span className="group/cell inline-flex items-start gap-1" onDoubleClick={() => { setDraft(value); setEditing(true); }}>
      <span className="min-w-0">{children}</span>
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true); }}
        aria-label={`Edit ${placeholder ?? "this"}`}
        className="mt-0.5 shrink-0 rounded p-0.5 text-faint opacity-40 transition-opacity hover:text-bone group-hover/cell:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-70"
      >
        {saved ? <Check className="size-3.5 text-[#16a34a]" aria-hidden /> : <Pencil className="size-3.5" aria-hidden />}
      </button>
    </span>
  );
}
