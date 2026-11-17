"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * THE INVOICE AND ITS SUPPORTING DOCUMENT, ON SCREEN (Genesis, 17 Nov 2026: "an invoice option, beside it the
 * supporting document, previewed like the invoice, and an Edit button that opens these in a pop-up"). Edit
 * opens the editor for whichever is showing; closing it reloads the preview. "Edit" under More actions
 * (#edit) opens it too.
 */
export function InvoicePreview({ token, invoiceEditor, supportingEditor }: { token: string; invoiceEditor: React.ReactNode | null; supportingEditor: React.ReactNode }) {
  const [doc, setDoc] = useState<"invoice" | "supporting">("invoice");
  const [editing, setEditing] = useState<"invoice" | "supporting" | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const fromHash = () => window.location.hash === "#edit" && invoiceEditor && setEditing("invoice");
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [invoiceEditor]);
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
  const canEdit = doc === "supporting" || invoiceEditor;
  const tab = (k: "invoice" | "supporting", label: string) => (
    <button type="button" role="tab" aria-selected={doc === k} onClick={() => setDoc(k)} className={`rounded-full px-4 py-1.5 text-[0.875rem] font-medium transition ${doc === k ? "bg-[#ffc516] text-black" : "text-ash hover:text-bone"}`}>{label}</button>
  );
  return (
    <section className="crm-card overflow-hidden !p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] px-4 py-3">
        <div role="tablist" className="inline-flex rounded-full border border-[var(--glass-border)] p-1">
          {tab("invoice", "Invoice")}
          {tab("supporting", "Supporting document")}
        </div>
        {canEdit && (
          <button type="button" onClick={() => setEditing(doc)} className="crm-btn crm-btn-secondary crm-btn-sm"><Pencil className="size-4" aria-hidden /> Edit {doc === "invoice" ? "invoice" : "supporting document"}</button>
        )}
      </div>
      <iframe key={`${doc}-${version}`} title={doc === "invoice" ? "Invoice" : "Supporting document"} src={`/invoice/${token}?preview=1${doc === "supporting" ? "&doc=supporting" : ""}`} className="block h-[min(1180px,85vh)] w-full border-0 bg-white" />
      {/* Both editors stay mounted so nothing typed is lost between opens. */}
      <div role="dialog" aria-modal="true" aria-label="Edit" className={`fixed inset-0 z-50 items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8 ${editing ? "flex" : "hidden"}`} onClick={(e) => e.target === e.currentTarget && close()} data-lenis-prevent>
        <div className="relative w-full max-w-6xl rounded-3xl border border-[var(--glass-border)] bg-[var(--crm-panel)] p-4 shadow-[var(--shadow-float)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-sans text-[1.25rem] font-semibold text-bone">{editing === "supporting" ? "Edit the supporting document" : "Edit the invoice"}</h2>
            <button type="button" onClick={close} aria-label="Close" className="crm-btn crm-btn-secondary crm-btn-sm !px-2.5"><X className="size-4" aria-hidden /></button>
          </div>
          <div className={editing === "invoice" ? "" : "hidden"}>{invoiceEditor}</div>
          <div className={editing === "supporting" ? "" : "hidden"}>{supportingEditor}</div>
        </div>
      </div>
    </section>
  );
}
