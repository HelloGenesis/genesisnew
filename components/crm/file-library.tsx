"use client";

import { Download, ExternalLink, FileText, Film, ImageIcon, Play, Search, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import type { Library } from "@/lib/crm/library";

import { uploadToProject } from "./upload-to-drive";

type Item = Library["files"][number];

const size = (n: number | null) => (n === null ? "" : n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
const kind = (m: string | null) => (m?.startsWith("image/") ? "image" : m?.startsWith("video/") ? "video" : m === "application/pdf" ? "pdf" : "file");
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * FILES AND THE CREATIVE LIBRARY (lib/crm/library): search and filter every
 * project's files; upload by dropping files anywhere on the page, into a
 * project's folder. "creatives" shows images and videos as a gallery, the
 * finals first to hand.
 */
export function FileLibrary({ mode, library }: { mode: "files" | "creatives"; library: Library }) {
  const router = useRouter();
  const creatives = mode === "creatives";
  const [q, setQ] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("");
  const [folder, setFolder] = useState("");
  const [open, setOpen] = useState<Item | null>(null);
  const [panel, setPanel] = useState(false);
  const [to, setTo] = useState({ projectId: library.projects[0]?.id ?? "", folder: creatives ? "final" : "brief" });
  const [progress, setProgress] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const clients = useMemo(() => [...new Set(library.files.map((f) => f.client))].sort(), [library.files]);
  const folders = useMemo(() => [...new Map(library.files.map((f) => [f.folder, f.folderLabel])).entries()], [library.files]);
  const shown = library.files.filter((f) => {
    if (client && f.client !== client) return false;
    if (type && kind(f.mimeType) !== type) return false;
    if (folder && f.folder !== folder) return false;
    const s = q.trim().toLowerCase();
    return !s || `${f.name} ${f.project} ${f.client} ${f.folderLabel}`.toLowerCase().includes(s);
  });

  async function upload(list: FileList | File[] | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    if (!to.projectId) return setError("Pick the project these files belong to first.");
    setError(null);
    for (const file of files) {
      setProgress((p) => [...p, { name: file.name, pct: 0 }]);
      try {
        await uploadToProject(file, to, (pct) => setProgress((p) => p.map((x) => (x.name === file.name ? { ...x, pct } : x))));
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      } finally {
        setProgress((p) => p.filter((x) => x.name !== file.name));
      }
    }
    if (input.current) input.current.value = "";
    router.refresh();
  }

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-0 flex-1 basis-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
        <span className="sr-only">Search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={creatives ? "Search creatives, projects, clients…" : "Search files, projects, clients…"} className="crm-input !pl-9" />
      </label>
      <select value={client} onChange={(e) => setClient(e.target.value)} className="crm-input !w-auto !pr-8" aria-label="Client">
        <option value="">All clients</option>
        {clients.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={type} onChange={(e) => setType(e.target.value)} className="crm-input !w-auto !pr-8" aria-label="Type">
        <option value="">{creatives ? "Images & videos" : "All types"}</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        {!creatives && <option value="pdf">PDFs</option>}
        {!creatives && <option value="file">Other files</option>}
      </select>
      <select value={folder} onChange={(e) => setFolder(e.target.value)} className="crm-input !w-auto !pr-8" aria-label="Folder">
        <option value="">All folders</option>
        {folders.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
      <button type="button" onClick={() => setPanel((p) => !p)} className="crm-btn crm-btn-primary" aria-expanded={panel}>
        <Upload className="size-4" aria-hidden /> Upload
      </button>
    </div>
  );

  return (
    <div
      className="relative space-y-5"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDrag(true);
        setPanel(true);
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void upload(e.dataTransfer.files);
      }}
    >
      {filters}

      {panel && (
        <section className="crm-card crm-pad space-y-3">
          {library.projects.length === 0 ? (
            <p className="text-ash">Files live in projects. <Link href="/admin/projects" className="crm-link">Open a project</Link> first, then upload here or on the project.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="crm-label">Project</span>
                  <select value={to.projectId} onChange={(e) => setTo({ ...to, projectId: e.target.value })} className="crm-input">
                    {library.projects.map((p) => <option key={p.id} value={p.id}>{p.label.includes(p.client) ? p.label : `${p.label} · ${p.client}`}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="crm-label">Folder</span>
                  <select value={to.folder} onChange={(e) => setTo({ ...to, folder: e.target.value })} className="crm-input">
                    {library.folders.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </label>
              </div>
              <input ref={input} type="file" multiple hidden accept={creatives ? "image/*,video/*" : undefined} onChange={(e) => void upload(e.target.files)} />
              <button
                type="button"
                onClick={() => input.current?.click()}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${drag ? "border-[#ffc516] bg-[#ffc516]/10" : "border-[var(--glass-border)] hover:border-[#ffc516]/60"}`}
              >
                <Upload className="size-6 text-[#ffc516]" aria-hidden />
                <span className="text-bone">Drop files here, or click to choose</span>
                <span className="text-[0.8125rem] text-ash">They go to Google Drive, in the project&apos;s folder. Big videos are fine.</span>
              </button>
            </>
          )}
          {progress.map((p) => (
            <div key={p.name} className="rounded-xl bg-[var(--hover-wash)] px-3 py-2 text-[0.8125rem] text-ash">
              {p.name} · {p.pct}%
              <span className="mt-1 block h-1 rounded-full bg-[var(--glass-border)]"><span className="block h-1 rounded-full bg-[#ffc516]" style={{ width: `${p.pct}%` }} /></span>
            </div>
          ))}
          {error && <p role="alert" className="crm-notice crm-notice-warn">{error}</p>}
        </section>
      )}

      <p className="text-[0.8125rem] text-ash">{shown.length.toLocaleString("en-IN")} {creatives ? (shown.length === 1 ? "creative" : "creatives") : shown.length === 1 ? "file" : "files"}{shown.length !== library.files.length ? ` of ${library.files.length.toLocaleString("en-IN")}` : ""}</p>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-12 text-center text-ash">
          {library.files.length ? "Nothing matches these filters." : creatives ? "No images or videos yet. Upload finals here or on a project, and they show up here." : "No files yet. Drop some here, or upload on a project."}
        </p>
      ) : creatives ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {shown.map((f) => (
            <li key={f.id} className="crm-card group overflow-hidden !rounded-2xl">
              <button type="button" onClick={() => setOpen(f)} className="relative block aspect-[4/5] w-full bg-black/80">
                {kind(f.mimeType) === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/crm/files/${f.id}`} alt="" loading="lazy" className="size-full object-cover transition-transform group-hover:scale-[1.02]" />
                ) : (
                  <>
                    <video src={`/api/crm/files/${f.id}#t=0.5`} preload="metadata" muted className="size-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center"><span className="grid size-11 place-items-center rounded-full bg-white/85 text-[#141216]"><Play className="ml-0.5 size-5" aria-hidden /></span></span>
                  </>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.6875rem] text-white">{f.folderLabel}</span>
              </button>
              <div className="space-y-0.5 p-2.5">
                <p className="truncate text-[0.8125rem] text-bone" title={f.name}>{f.name}</p>
                <p className="truncate text-[0.6875rem] text-faint">{f.client} · {day(f.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="crm-card divide-y divide-[var(--glass-border)] overflow-hidden !p-0">
          {shown.map((f) => {
            const k = kind(f.mimeType);
            const Icon = k === "image" ? ImageIcon : k === "video" ? Film : FileText;
            return (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffc516]/12 text-[#ffc516]"><Icon className="size-5" aria-hidden /></span>
                <button type="button" onClick={() => setOpen(f)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[0.9375rem] text-bone">{f.name}</span>
                  <span className="block truncate text-[0.75rem] text-ash">{f.project.includes(f.client) ? f.project : `${f.client} · ${f.project}`} · {f.folderLabel}</span>
                </button>
                <span className="hidden shrink-0 text-right text-[0.75rem] text-faint sm:block">{size(f.size)}<br />{f.uploader} · {day(f.createdAt)}</span>
                <a href={`/api/crm/files/${f.id}?download=1`} aria-label={`Download ${f.name}`} className="grid size-9 shrink-0 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><Download className="size-4" /></a>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.name} className="fixed inset-0 z-[120] flex flex-col bg-black/90 p-3 sm:p-6" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="mb-3 flex items-center justify-between gap-3 text-white">
            <p className="min-w-0 truncate text-[0.9375rem]">{open.name} <span className="text-white/60">· {open.client} · {open.project}</span></p>
            <span className="flex shrink-0 items-center gap-3">
              <Link href={`/admin/projects/${open.projectId}#files`} className="text-white/80 hover:text-white" aria-label="Open the project"><ExternalLink className="size-5" /></Link>
              <a href={`/api/crm/files/${open.id}?download=1`} className="text-white/80 hover:text-white" aria-label="Download"><Download className="size-5" /></a>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="text-white/80 hover:text-white"><X className="size-6" /></button>
            </span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
            {kind(open.mimeType) === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/crm/files/${open.id}`} alt={open.name} className="max-h-full max-w-full object-contain" />
            ) : kind(open.mimeType) === "video" ? (
              <video src={`/api/crm/files/${open.id}`} controls autoPlay className="max-h-full max-w-full" />
            ) : kind(open.mimeType) === "pdf" ? (
              <iframe src={`/api/crm/files/${open.id}`} title={open.name} className="size-full rounded-lg bg-white" />
            ) : (
              <a href={`/api/crm/files/${open.id}?download=1`} className="crm-btn crm-btn-primary">Download {open.name}</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
