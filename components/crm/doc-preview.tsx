"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * THE DOCUMENT FIRST, THE EDITOR IN A POP-UP (Genesis, 17 Nov 2026: "an invoice option, beside it the
 * supporting document, previewed like the invoice, and an Edit button that opens these in a pop-up"; "copy
 * the same for the quote: the first thing visible is its preview; the editors open only in a pop-up").
 * One tab per view; Edit opens that view's editor; closing reloads the preview. A link to #edit (More
 * actions → Edit) opens the first editor.
 */
export type DocTab = { key: string; label: string; src: string; editor?: React.ReactNode; editLabel?: string };

export function DocPreview({ tabs, openEditor = false }: { tabs: DocTab[]; openEditor?: boolean }) {
  const [doc, setDoc] = useState(tabs[0].key);
  const [editing, setEditing] = useState<string | null>(openEditor ? (tabs.find((t) => t.editor)?.key ?? null) : null);
  const [version, setVersion] = useState(0);
  const first = tabs.find((t) => t.editor)?.key ?? null;
  useEffect(() => {
    const fromHash = () => window.location.hash === "#edit" && first && setEditing(first);
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [first]);
  useEffect(() => {
    if (!editing) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  });
  function close() {
    setEditing(null);
    setVersion((v) => v + 1);
    if (window.location.hash === "#edit") history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  const shown = tabs.find((t) => t.key === doc) ?? tabs[0];
  const open = tabs.find((t) => t.key === editing);
  return (
    <section className="crm-card overflow-hidden !p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] px-4 py-3">
        {tabs.length > 1 ? (
          <div role="tablist" className="inline-flex rounded-full border border-[var(--glass-border)] p-1">
            {tabs.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={doc === t.key} onClick={() => setDoc(t.key)} className={`rounded-full px-4 py-1.5 text-[0.875rem] font-medium transition ${doc === t.key ? "bg-[#ffc516] text-black" : "text-ash hover:text-bone"}`}>{t.label}</button>
            ))}
          </div>
        ) : (
          <span className="px-1 text-[0.875rem] font-medium text-ash">{shown.label}</span>
        )}
        {shown.editor && (
          <button type="button" onClick={() => setEditing(shown.key)} className="crm-btn crm-btn-secondary crm-btn-sm"><Pencil className="size-4" aria-hidden /> {shown.editLabel ?? `Edit ${shown.label.toLowerCase()}`}</button>
        )}
      </div>
      <iframe key={`${shown.key}-${version}`} title={shown.label} src={shown.src} className="block h-[min(1180px,85vh)] w-full border-0 bg-white" />
      {/* Every editor stays mounted so nothing typed is lost between opens. */}
      <div role="dialog" aria-modal="true" aria-label={open?.editLabel ?? "Edit"} className={`fixed inset-0 z-50 items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8 ${open ? "flex" : "hidden"}`} onClick={(e) => e.target === e.currentTarget && close()} data-lenis-prevent>
        <div className="relative w-full max-w-6xl rounded-3xl border border-[var(--glass-border)] bg-[var(--crm-panel)] p-4 shadow-[var(--shadow-float)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-sans text-[1.25rem] font-semibold text-bone">{open?.editLabel ?? "Edit"}</h2>
            <button type="button" onClick={close} aria-label="Close" className="crm-btn crm-btn-secondary crm-btn-sm !px-2.5"><X className="size-4" aria-hidden /></button>
          </div>
          {tabs.filter((t) => t.editor).map((t) => (
            <div key={t.key} className={editing === t.key ? "" : "hidden"}>{t.editor}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
