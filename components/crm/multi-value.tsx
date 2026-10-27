"use client";

import { Plus, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { splitList } from "@/lib/crm/creator-contacts";

/**
 * SEVERAL NUMBERS OR EMAILS IN ONE FIELD (Genesis, 27 Oct 2026: "make sure we
 * can add multiple emails and contacts"): a box each, "+ Add another", and an
 * action beside each (WhatsApp, Send). Kept as one ", "-separated text
 * (lib/crm/creator-contacts). `onCommit` runs when focus leaves the field.
 */
export function MultiValue({
  value,
  onChange,
  onCommit,
  placeholder,
  addLabel,
  type = "text",
  disabled,
  label,
  inputClassName = "crm-input !min-h-8 w-40 !px-2 text-[0.8125rem]",
  action,
}: {
  value: string | null | undefined;
  onChange?: (next: string) => void;
  onCommit?: (next: string) => void;
  placeholder?: string;
  addLabel: string;
  type?: "tel" | "email" | "text";
  disabled?: boolean;
  label: string;
  inputClassName?: string;
  action?: (item: string) => ReactNode;
}) {
  const fromValue = () => {
    const xs = splitList(value);
    return xs.length ? xs : [""];
  };
  const [items, setItems] = useState(fromValue);
  /* A change from outside (a save elsewhere, the other table) replaces what's shown, unless it's what we sent. */
  const [seen, setSeen] = useState(value ?? "");
  if ((value ?? "") !== seen) {
    setSeen(value ?? "");
    if (splitList(value).join(", ") !== items.filter((x) => x.trim()).join(", ")) setItems(fromValue());
  }
  const joined = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean).join(", ");
  const set = (xs: string[]) => {
    setItems(xs);
    const next = joined(xs);
    setSeen(next);
    onChange?.(next);
  };
  return (
    <div
      className="flex flex-col gap-1"
      role="group"
      aria-label={label}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onCommit?.(joined(items));
      }}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <input
            value={item}
            disabled={disabled}
            onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={i === 0 ? placeholder : `Another ${placeholder?.toLowerCase() ?? ""}`.trim()}
            type={type === "email" ? "email" : "text"}
            inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
            className={inputClassName}
            aria-label={`${label} ${i + 1}`}
          />
          {items.length > 1 && !disabled && (
            <button type="button" aria-label={`Remove ${item || "this one"}`} onClick={() => set(items.filter((_, j) => j !== i))} className="grid size-6 shrink-0 place-items-center rounded-md text-faint hover:bg-[var(--hover-wash)] hover:text-[#dc2626]">
              <X className="size-3.5" aria-hidden />
            </button>
          )}
          {action?.(item.trim())}
        </span>
      ))}
      {!disabled && items[items.length - 1]?.trim() && (
        <button type="button" onClick={() => setItems([...items, ""])} className="flex w-fit items-center gap-1 text-[0.75rem] text-ash hover:text-bone">
          <Plus className="size-3" aria-hidden /> {addLabel}
        </button>
      )}
    </div>
  );
}
