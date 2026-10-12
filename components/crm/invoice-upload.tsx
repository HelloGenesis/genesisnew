"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/** Uploads supporting screenshots (several at once) or the signed copy to an invoice. */
export function InvoiceUpload({ invoiceId, kind, label }: { invoiceId: string; kind: "SUPPORTING" | "SIGNED"; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    for (const [i, file] of [...files].entries()) {
      setBusy(`Uploading ${i + 1} of ${files.length}…`);
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const r = await fetch(`/api/crm/invoices/${invoiceId}/files`, { method: "POST", body: form });
      if (!r.ok) {
        setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Upload failed.");
        break;
      }
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    router.refresh();
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <input ref={input} type="file" multiple={kind === "SUPPORTING"} accept={kind === "SIGNED" ? "application/pdf,image/*" : "image/*,application/pdf"} className="hidden" onChange={(e) => upload(e.target.files)} />
      <button type="button" disabled={Boolean(busy)} onClick={() => input.current?.click()} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-50"><Upload className="size-4" aria-hidden /> {busy ?? label}</button>
      {error && <span className="text-[0.8125rem] text-[#dc2626]" role="alert">{error}</span>}
    </span>
  );
}
