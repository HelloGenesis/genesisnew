"use client";

import { FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { importUploadBatch, matchUploadColumns } from "@/app/(crm)/admin/actions/imports";
import { readSheetFile, type SheetTab } from "@/lib/sheet-file";

const BATCH = 250;

/**
 * IMPORT FROM EXCEL OR CSV (Genesis, 13 Oct 2026). Pick the file; the AI
 * matches its columns to the CRM's, you check the match, and the rows go in
 * a batch at a time with a progress bar. Re-importing the same file only
 * fills gaps and updates followers: nothing is duplicated.
 */
export function FileImport({ kind, noun, fields, done }: { kind: string; noun: string; fields: Record<string, string>; done: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [tabs, setTabs] = useState<SheetTab[]>([]);
  const [tab, setTab] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; added: number; updated: number } | null>(null);

  const rows = tabs[tab]?.rows ?? [];
  const headerAt = Math.max(0, rows.findIndex((r) => r.filter((c) => c.trim()).length >= 2));
  const headers = (rows[headerAt] ?? []).map((h) => h.trim());
  const body = rows.slice(headerAt + 1);
  const sample = body.slice(0, 5);

  const match = async (t: SheetTab[], i: number) => {
    const r = t[i]?.rows ?? [];
    const at = Math.max(0, r.findIndex((x) => x.filter((c) => c.trim()).length >= 2));
    setBusy("Matching the columns…");
    setMapping(await matchUploadColumns(kind, (r[at] ?? []).map((h) => h.trim()), r.slice(at + 1, at + 6)));
    setBusy(null);
  };

  const pick = async (f: File | null) => {
    setFile(f);
    setTabs([]);
    setError(null);
    setProgress(null);
    if (!f) return;
    try {
      setBusy("Reading the file…");
      const t = await readSheetFile(f);
      if (!t.length) throw new Error("The file looks empty.");
      setTabs(t);
      setTab(0);
      await match(t, 0);
    } catch (e) {
      setBusy(null);
      setError((e as Error).message);
    }
  };

  const run = async () => {
    setError(null);
    let added = 0;
    let updated = 0;
    try {
      for (let i = 0; i < body.length; i += BATCH) {
        setBusy(`Importing ${Math.min(i + BATCH, body.length)} of ${body.length}…`);
        const r = await importUploadBatch(kind, file?.name ?? "file", headers, body.slice(i, i + BATCH), mapping, i + BATCH >= body.length);
        added += r.added;
        updated += r.updated;
        setProgress({ done: Math.min(i + BATCH, body.length), added, updated });
      }
      router.refresh();
    } catch (e) {
      setError(`Stopped: ${(e as Error).message.slice(0, 200)}. Run it again; rows already in are skipped.`);
    }
    setBusy(null);
  };

  const matched = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-8 text-center hover:bg-[var(--hover-wash)]">
        <FileSpreadsheet className="size-7 text-ash" aria-hidden />
        <span className="text-bone">{file ? file.name : "Choose an Excel (.xlsx) or CSV file"}</span>
        <span className="text-[0.8125rem] text-faint">The first row with headings is used; the file stays on your computer until you import.</span>
        <input type="file" accept=".xlsx,.csv,.tsv,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>

      {tabs.length > 1 && (
        <label className="block max-w-xs">
          <span className="crm-label">Tab</span>
          <select value={tab} onChange={(e) => { setTab(Number(e.target.value)); void match(tabs, Number(e.target.value)); }} className="crm-input">
            {tabs.map((t, i) => <option key={t.name + i} value={i}>{t.name} ({t.rows.length} rows)</option>)}
          </select>
        </label>
      )}

      {headers.length > 0 && !busy?.startsWith("Matching") && (
        <>
          <p className="text-[0.875rem] text-ash">{body.length} rows. {matched} columns matched; change any that are wrong, or set one to “—” to leave it out.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {headers.map((h, i) =>
              h ? (
                <label key={`${h}-${i}`}>
                  <span className="crm-label">{h}</span>
                  <select value={mapping[h] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))} className="crm-input">
                    <option value="">—</option>
                    {Object.entries(fields).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                  <span className="mt-1 block truncate text-[0.75rem] text-faint">{sample.map((r) => r[i]).filter(Boolean).slice(0, 2).join(" · ") || " "}</span>
                </label>
              ) : null,
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={Boolean(busy) || matched === 0 || body.length === 0} onClick={run} className="crm-btn crm-btn-primary disabled:opacity-40">
              Import {body.length} {noun}
            </button>
            {progress && !busy && <a href={done} className="crm-btn crm-btn-secondary crm-btn-sm">See them</a>}
          </div>
        </>
      )}

      {(busy || progress) && (
        <div className="space-y-1.5" role="status">
          {progress && <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hover-wash)]"><div className="h-full bg-[#ffc516] transition-all" style={{ width: `${(progress.done / Math.max(1, body.length)) * 100}%` }} /></div>}
          <p className="text-[0.8125rem] text-ash">{busy ?? `Done: ${progress!.added} added, ${progress!.updated} updated, ${body.length - progress!.added - progress!.updated} already up to date or skipped.`}</p>
        </div>
      )}
      {error && <p className="text-[0.875rem] text-[#dc2626]" role="alert">{error}</p>}
    </div>
  );
}
