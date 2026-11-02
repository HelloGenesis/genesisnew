"use client";

import { FileText, Redo2, Undo2, Wand2 } from "lucide-react";
import { type RefObject, useRef, useState } from "react";

import { rephrase, TEMPLATES, TOOLS } from "@/lib/crm/rephrase";

/**
 * Writing tools under a message box, without AI (lib/crm/rephrase): fix,
 * more formal, friendlier, shorter, and ready messages. All in the browser;
 * nothing leaves the page.
 */
export function RephraseBar({ value, onChange, fill, target }: { value: string; onChange: (text: string) => void; fill?: { name?: string | null; title?: string | null }; target?: RefObject<HTMLTextAreaElement | null> }) {
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const turn = useRef(0);
  /* Rephrase again rewords the text as it was before the first Rephrase, with the next wording, rather than rewording a rewording. */
  const reworded = useRef<{ from: string; to: string } | null>(null);
  /*
   * UNDO AND REDO THAT WORK (Genesis, 3 Nov 2026): the text goes in as if
   * typed, so Cmd+Z and Cmd+Shift+Z in the box step through the changes too,
   * and Grammarly and the like see it; the Undo and Redo buttons keep their
   * own steps.
   */
  const put = (text: string) => {
    const box = target?.current;
    if (box) {
      box.focus();
      box.select();
      if (document.execCommand?.("insertText", false, text)) return;
    }
    onChange(text);
  };
  const set = (text: string, msg: string) => {
    if (text !== value) {
      setPast((p) => [...p.slice(-29), value]);
      setFuture([]);
      put(text);
    }
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
              const again = t.id === "rephrase" && reworded.current?.to === value;
              const from = again ? reworded.current!.from : value;
              if (t.id === "rephrase" && !again) turn.current = 0;
              const r = rephrase(from, t.id, t.id === "rephrase" ? turn.current++ : 0);
              if (t.id === "rephrase") reworded.current = { from, to: r.text };
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
        <button
          type="button"
          disabled={!past.length}
          title="Undo"
          aria-label="Undo"
          onClick={() => {
            setFuture((f) => [value, ...f]);
            put(past.at(-1)!);
            setPast((p) => p.slice(0, -1));
            setNote("Undone.");
          }}
          className={chip}
        >
          <Undo2 className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          disabled={!future.length}
          title="Redo"
          aria-label="Redo"
          onClick={() => {
            setPast((p) => [...p, value]);
            put(future[0]!);
            setFuture((f) => f.slice(1));
            setNote("Redone.");
          }}
          className={chip}
        >
          <Redo2 className="size-3.5" aria-hidden />
        </button>
        {note && <span role="status" className="text-[0.75rem] text-faint">{note}</span>}
      </div>
    </div>
  );
}

/** A form's message box with the writing tools under it. */
export function MessageBox({ name, defaultValue, fill, className = "crm-input !min-h-24" }: { name: string; defaultValue: string; fill?: { name?: string | null; title?: string | null }; className?: string }) {
  const [text, setText] = useState(defaultValue);
  const box = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <textarea ref={box} name={name} value={text} onChange={(e) => setText(e.target.value)} className={className} />
      <RephraseBar value={text} onChange={setText} fill={fill} target={box} />
    </>
  );
}
