"use client";

import { FileText, Undo2, Wand2 } from "lucide-react";
import { useState } from "react";

import { rephrase, TEMPLATES, TOOLS } from "@/lib/crm/rephrase";

/**
 * Writing tools under a message box, without AI (lib/crm/rephrase): fix,
 * more formal, friendlier, shorter, and ready messages. All in the browser;
 * nothing leaves the page.
 */
export function RephraseBar({ value, onChange, fill }: { value: string; onChange: (text: string) => void; fill?: { name?: string | null; title?: string | null } }) {
  const [past, setPast] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const set = (text: string, msg: string) => {
    if (text !== value) setPast((p) => [...p.slice(-19), value]);
    onChange(text);
    setNote(msg);
  };
  const chip = "inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3 py-1 text-[0.8125rem] text-ash transition-colors hover:border-[#ffc516]/60 hover:text-bone disabled:opacity-40";
  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Wand2 className="size-4 text-faint" aria-hidden />
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.hint}
            disabled={!value.trim()}
            onClick={() => {
              const r = rephrase(value, t.id);
              set(r.text, r.changes ? `${t.label}: ${r.changes} change${r.changes === 1 ? "" : "s"}.` : "Nothing to change.");
            }}
            className={chip}
          >
            {t.label}
          </button>
        ))}
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} className={chip}>
            <FileText className="size-3.5" aria-hidden /> Templates
          </button>
          {menu && (
            <ul className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--crm-panel)] py-1 shadow-[var(--shadow-float)]">
              {TEMPLATES.map((t) => (
                <li key={t.label}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      const first = fill?.name?.trim().split(/\s+/)[0];
                      set(t.text.replace("{name}", first || "there").replace(/\{title\}/g, fill?.title?.trim() || "this"), `${t.label} added.`);
                    }}
                    className="block w-full px-3 py-2 text-left text-[0.875rem] text-bone hover:bg-[var(--hover-wash)]"
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {past.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange(past.at(-1)!);
              setPast((p) => p.slice(0, -1));
              setNote("Undone.");
            }}
            className={chip}
          >
            <Undo2 className="size-3.5" aria-hidden /> Undo
          </button>
        )}
        {note && <span role="status" className="text-[0.75rem] text-faint">{note}</span>}
      </div>
    </div>
  );
}

/** A form's message box with the writing tools under it. */
export function MessageBox({ name, defaultValue, fill, className = "crm-input !min-h-24" }: { name: string; defaultValue: string; fill?: { name?: string | null; title?: string | null }; className?: string }) {
  const [text, setText] = useState(defaultValue);
  return (
    <>
      <textarea name={name} value={text} onChange={(e) => setText(e.target.value)} className={className} />
      <RephraseBar value={text} onChange={setText} fill={fill} />
    </>
  );
}
