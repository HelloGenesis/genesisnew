"use client";

import { Download, FileText, Play, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { deleteProjectFile, setFileAudience } from "@/app/(crm)/files-actions";

import { uploadToProject } from "./upload-to-drive";

export type FileItem = {
  id: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  folder: string;
  audience: string;
  uploadedAs: string;
  uploader: string | null;
  createdAt: string;
};

type Folder = { key: string; label: string; hint: string; audience: string; canUpload: boolean };

const AUDIENCE: Record<string, string> = { TEAM: "Genesis only", TEAM_VENDOR: "Genesis + vendors", TEAM_CLIENT: "Genesis + client", EVERYONE: "Everyone" };
const CUTS = new Set(["first-cut", "second-cut", "final"]);

const size = (n: number | null) => (n === null ? "" : n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
const kind = (m: string | null) => (m?.startsWith("image/") ? "image" : m?.startsWith("video/") ? "video" : m === "application/pdf" ? "pdf" : "file");

/**
 * A PROJECT'S FILES, FOLDER BY FOLDER — the same gallery for Genesis, the
 * client and the vendors on the project, each seeing only what is theirs to see
 * (the server filters; this only draws). Images and videos play in place,
 * streamed from Genesis's Drive through /api/crm/files.
 */
export function ProjectFiles({ projectId, role, folders, files }: { projectId: string; role: "staff" | "client" | "vendor"; folders: Folder[]; files: FileItem[] }) {
  const router = useRouter();
  const firstWithFiles = folders.find((f) => files.some((x) => x.folder === f.key))?.key ?? folders[0]?.key ?? "brief";
  const [active, setActive] = useState(firstWithFiles);
  const [open, setOpen] = useState<FileItem | null>(null);
  const [progress, setProgress] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<string>("");
  const [review, setReview] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const folder = folders.find((f) => f.key === active);
  const shown = useMemo(() => files.filter((f) => f.folder === active), [files, active]);

  async function upload(list: FileList | null) {
    if (!list?.length || !folder) return;
    setError(null);
    for (const file of Array.from(list)) {
      setProgress((p) => [...p, { name: file.name, pct: 0 }]);
      const set = (pct: number) => setProgress((p) => p.map((x) => (x.name === file.name ? { ...x, pct } : x)));
      try {
        await uploadToProject(file, { projectId, folder: folder.key, audience, review: review && CUTS.has(folder.key) }, set);
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      } finally {
        setProgress((p) => p.filter((x) => x.name !== file.name));
      }
    }
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div id="files" className="space-y-4">
      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {folders.map((f) => {
          const n = files.filter((x) => x.folder === f.key).length;
          return (
            <button key={f.key} type="button" onClick={() => setActive(f.key)} aria-current={active === f.key ? "page" : undefined} className="crm-nav-link !min-h-9 shrink-0">
              {f.label}
              {n > 0 && <span className="ml-1.5 text-[0.75rem] opacity-70">{n}</span>}
            </button>
          );
        })}
      </nav>

      {folder && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-[0.8125rem] text-ash">
            {folder.hint}
            {role === "staff" && <> · new files: <strong className="text-bone">{AUDIENCE[audience || folder.audience]}</strong></>}
          </p>
          {folder.canUpload && (
            <div className="flex flex-wrap items-center gap-2">
              {role === "staff" && (
                <>
                  <select value={audience} onChange={(e) => setAudience(e.target.value)} className="crm-input !min-h-9 w-auto text-[0.8125rem]" aria-label="Who can see new files">
                    <option value="">Folder default</option>
                    {Object.entries(AUDIENCE).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  {CUTS.has(folder.key) && (
                    <label className="flex items-center gap-1.5 text-[0.8125rem] text-ash">
                      <input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} /> Send to client for review
                    </label>
                  )}
                </>
              )}
              <input ref={input} type="file" multiple hidden onChange={(e) => void upload(e.target.files)} />
              <button type="button" onClick={() => input.current?.click()} className="crm-btn crm-btn-primary crm-btn-sm" disabled={progress.length > 0}>
                <Upload className="size-4" aria-hidden /> Upload to {folder.label}
              </button>
            </div>
          )}
        </div>
      )}

      {progress.map((p) => (
        <div key={p.name} className="rounded-xl bg-[var(--hover-wash)] px-3 py-2 text-[0.8125rem] text-ash">
          {p.name} · {p.pct}%
          <span className="mt-1 block h-1 rounded-full bg-[var(--glass-border)]"><span className="block h-1 rounded-full bg-[#ffc516]" style={{ width: `${p.pct}%` }} /></span>
        </div>
      ))}
      {error && <p role="alert" className="crm-notice crm-notice-warn">{error}</p>}

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--glass-border)] px-4 py-8 text-center text-ash">Nothing in {folder?.label ?? "this folder"} yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {shown.map((f) => {
            const k = kind(f.mimeType);
            return (
              <li key={f.id} className="crm-card overflow-hidden !rounded-xl">
                <button type="button" onClick={() => setOpen(f)} className="relative block aspect-video w-full bg-black/80">
                  {k === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/crm/files/${f.id}`} alt="" loading="lazy" className="size-full object-cover" />
                  ) : k === "video" ? (
                    <>
                      <video src={`/api/crm/files/${f.id}#t=0.5`} preload="metadata" muted className="size-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center"><span className="grid size-10 place-items-center rounded-full bg-white/85 text-[#141216]"><Play className="ml-0.5 size-4" aria-hidden /></span></span>
                    </>
                  ) : (
                    <span className="grid size-full place-items-center text-white/70"><FileText className="size-8" aria-hidden /></span>
                  )}
                </button>
                <div className="space-y-1 p-2.5">
                  <p className="truncate text-[0.8125rem] text-bone" title={f.name}>{f.name}</p>
                  <p className="truncate text-[0.6875rem] text-faint">
                    {size(f.size)} · {f.uploader ?? f.uploadedAs} · {new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    {role === "staff" ? (
                      <select
                        defaultValue={f.audience}
                        onChange={async (e) => {
                          await setFileAudience(f.id, e.target.value);
                          router.refresh();
                        }}
                        className="min-w-0 rounded-md border border-[var(--glass-border)] bg-transparent px-1 py-0.5 text-[0.6875rem] text-ash"
                        aria-label="Who can see this file"
                      >
                        {Object.entries(AUDIENCE).map(([k2, v]) => <option key={k2} value={k2}>{v}</option>)}
                      </select>
                    ) : (
                      <span className="text-[0.6875rem] text-faint">{AUDIENCE[f.audience]}</span>
                    )}
                    <span className="flex shrink-0 items-center gap-1.5">
                      <a href={`/api/crm/files/${f.id}?download=1`} aria-label={`Download ${f.name}`} className="text-ash hover:text-bone"><Download className="size-4" /></a>
                      {role === "staff" && (
                        <button
                          type="button"
                          aria-label={`Delete ${f.name}`}
                          className="text-ash hover:text-[#dc2626]"
                          onClick={async () => {
                            if (!window.confirm(`Move "${f.name}" to Drive's trash?`)) return;
                            await deleteProjectFile(f.id);
                            router.refresh();
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.name} className="fixed inset-0 z-[120] flex flex-col bg-black/90 p-3 sm:p-6" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="mb-3 flex items-center justify-between gap-3 text-white">
            <p className="truncate text-[0.9375rem]">{open.name}</p>
            <span className="flex items-center gap-3">
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
