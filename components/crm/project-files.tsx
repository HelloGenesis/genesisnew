"use client";

import { Check, Download, FileText, Play, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { deleteProjectFile, saveProjectBrief, setFileAudience } from "@/app/(crm)/files-actions";

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

const AUDIENCE: Record<string, string> = { ADMINS: "Admins only", TEAM: "Genesis only", TEAM_VENDOR: "Genesis + vendors", TEAM_CLIENT: "Genesis + client", EVERYONE: "Everyone" };
const BRIEF = "__brief";

/*
 * WHO SEES IT, AT A GLANCE (Genesis, 31 Oct 2026: "all files or folders should
 * show who it's shared with and who it's not, for the employee to easily
 * understand"): Genesis, the client and the vendors, each ticked or crossed.
 */
const SEES: Record<string, { client: boolean; vendors: boolean; team?: boolean }> = {
  ADMINS: { client: false, vendors: false, team: false },
  TEAM: { client: false, vendors: false },
  TEAM_VENDOR: { client: false, vendors: true },
  TEAM_CLIENT: { client: true, vendors: false },
  EVERYONE: { client: true, vendors: true },
};
export function SharedWith({ audience, small = false, team = "Genesis" }: { audience: string; small?: boolean; team?: string }) {
  const s = SEES[audience] ?? SEES.TEAM!;
  const chip = (label: string, on: boolean) => (
    <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2 ${small ? "py-0 text-[0.625rem]" : "py-0.5 text-[0.75rem]"} ${on ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-[var(--hover-wash)] text-faint line-through decoration-1"}`} title={on ? `${label} can see this` : `${label} can't see this`}>
      {on ? <Check className={small ? "size-2.5" : "size-3"} aria-hidden /> : <X className={small ? "size-2.5" : "size-3"} aria-hidden />}
      {label}
    </span>
  );
  /* Admins only (an agency's default): the admins, not the rest of the team. */
  if (s.team === false) return <span className="inline-flex flex-wrap items-center gap-1" aria-label="Admins only">{[chip("Admins", true), chip("Team", false), chip("Client", false), chip("Vendors", false)]}</span>;
  return <span className="inline-flex flex-wrap items-center gap-1" aria-label={`Shared with the team${s.client ? ", the client" : ""}${s.vendors ? ", vendors" : ""}`}>{[chip(team, true), chip("Client", s.client), chip("Vendors", s.vendors)]}</span>;
}

const size = (n: number | null) => (n === null ? "" : n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
const kind = (m: string | null) => (m?.startsWith("image/") ? "image" : m?.startsWith("video/") ? "video" : m === "application/pdf" ? "pdf" : "file");

/**
 * A PROJECT'S FILES, FOLDER BY FOLDER — the same gallery for Genesis, the
 * client and the vendors on the project, each seeing only what is theirs to see
 * (the server filters; this only draws). Images and videos play in place,
 * streamed from Genesis's Drive through /api/crm/files.
 */
export function ProjectFiles({ projectId, role, folders, files, brief, canDelete = false, drive = {}, agency = false, admin = true }: { projectId: string; role: "staff" | "client" | "vendor"; folders: Folder[]; files: FileItem[]; brief?: string | null; canDelete?: boolean; drive?: Record<string, string>; agency?: boolean; admin?: boolean }) {
  /* In an agency's CRM new files are its admins' until shared (lib/crm/files); its team is "Team", not Genesis. */
  const teamName = agency ? "Team" : "Genesis";
  const defaultFor = (f: Folder) => (agency ? "ADMINS" : f.audience);
  const router = useRouter();
  const hasBrief = brief !== undefined;
  const firstWithFiles = hasBrief ? BRIEF : (folders.find((f) => files.some((x) => x.folder === f.key))?.key ?? folders[0]?.key ?? "brief");
  const [active, setActive] = useState(firstWithFiles);
  const [open, setOpen] = useState<FileItem | null>(null);
  const [progress, setProgress] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<string>("");
  /* Every folder can go for review (Genesis, 31 Oct 2026): to the producer first, or to the client when they can see it. */
  const [review, setReview] = useState<"" | "internal" | "client">("");
  const [briefText, setBriefText] = useState(brief ?? "");
  const [savingBrief, setSavingBrief] = useState<"idle" | "saving" | "saved">("idle");
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
        await uploadToProject(file, { projectId, folder: folder.key, audience, review: review || undefined }, set);
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
      {/* The upload first, at the top (Genesis, 31 Oct 2026: "this should come on top"), then the folders. */}
      {folder?.canUpload && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {role === "staff" && (
            <>
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className="crm-input !min-h-9 !w-auto text-[0.8125rem]" aria-label="Who can see new files">
                <option value="">{agency ? "Default: admins only" : "Folder default"}</option>
                {Object.entries(AUDIENCE).filter(([k]) => admin || k !== "ADMINS").map(([k, v]) => (
                  <option key={k} value={k}>{k === "TEAM" && agency ? "Team only" : agency ? v.replace("Genesis", "Team") : v}</option>
                ))}
              </select>
              <select value={review} onChange={(e) => setReview(e.target.value as typeof review)} className="crm-input !min-h-9 !w-auto text-[0.8125rem]" aria-label="Send for approval">
                <option value="">No approval</option>
                <option value="internal">Internal review (producer)</option>
                {SEES[audience || defaultFor(folder)]?.client && <option value="client">Send to client for review</option>}
              </select>
            </>
          )}
          <input ref={input} type="file" multiple hidden onChange={(e) => void upload(e.target.files)} />
          <button type="button" onClick={() => input.current?.click()} className="crm-btn crm-btn-primary crm-btn-sm" disabled={progress.length > 0}>
            <Upload className="size-4" aria-hidden /> Upload to {folder.label}
          </button>
        </div>
      )}

      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {hasBrief && (
          <button type="button" onClick={() => setActive(BRIEF)} aria-current={active === BRIEF ? "page" : undefined} className="crm-nav-link !min-h-9 shrink-0">Brief</button>
        )}
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
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-ash">
          <span>{folder.hint}</span>
          <span className="text-faint">·</span>
          <span>{role === "staff" ? "New files:" : "Shared with:"}</span>
          <SharedWith audience={audience || defaultFor(folder)} team={teamName} />
          {/* The folder itself on Google Drive (lib/crm/files-view). */}
          {drive[folder.key] ? (
            <a href={drive[folder.key]} target="_blank" rel="noopener noreferrer" className="crm-link ml-auto">Open {folder.label} in Google Drive ↗</a>
          ) : drive.project ? (
            <a href={drive.project} target="_blank" rel="noopener noreferrer" className="crm-link ml-auto">Project folder in Google Drive ↗</a>
          ) : null}
        </p>
      )}

      {active === BRIEF && (
        <div className="space-y-2">
          {role === "staff" ? (
            <>
              <textarea
                value={briefText}
                onChange={(e) => {
                  setBriefText(e.target.value);
                  setSavingBrief("idle");
                }}
                rows={8}
                className="crm-input w-full"
                placeholder="What the client wants: the idea, the audience, the deliverables, the dos and don'ts."
                aria-label="The brief"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={savingBrief === "saving" || briefText === (brief ?? "")}
                  onClick={async () => {
                    setSavingBrief("saving");
                    await saveProjectBrief(projectId, briefText);
                    setSavingBrief("saved");
                    router.refresh();
                  }}
                  className="crm-btn crm-btn-primary crm-btn-sm"
                >
                  {savingBrief === "saving" ? "Saving…" : "Save the brief"}
                </button>
                {savingBrief === "saved" && <span className="text-[0.8125rem] text-ash">Saved.</span>}
                <span className="ml-auto"><SharedWith audience="EVERYONE" /></span>
              </div>
            </>
          ) : brief ? (
            <p className="whitespace-pre-wrap rounded-xl bg-[var(--hover-wash)] px-4 py-3 text-bone">{brief}</p>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--glass-border)] px-4 py-8 text-center text-ash">No brief written yet.</p>
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

      {active === BRIEF ? null : shown.length === 0 ? (
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
                  <SharedWith audience={f.audience} small team={teamName} />
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
                        {Object.entries(AUDIENCE).filter(([k2]) => admin || k2 !== "ADMINS").map(([k2, v]) => <option key={k2} value={k2}>{k2 === "TEAM" && agency ? "Team only" : agency ? v.replace("Genesis", "Team") : v}</option>)}
                      </select>
                    ) : null}
                    <span className="flex shrink-0 items-center gap-1.5">
                      <a href={`/api/crm/files/${f.id}?download=1`} aria-label={`Download ${f.name}`} className="text-ash hover:text-bone"><Download className="size-4" /></a>
                      {role === "staff" && canDelete && (
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
