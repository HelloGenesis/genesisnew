"use client";

import { Check, Download, ExternalLink, FileText, Link2, Lock, Play, Share2, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { addProjectLink, briefAsGoogleDoc, createProjectGoogleFile, deleteProjectFile, saveProjectBrief, sendFileForReview, setFileAudience } from "@/app/(crm)/files-actions";

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
  /** Google's own page for it: how a Google Doc or Sheet opens. */
  link?: string | null;
  /** Its latest review, when it's been sent on: INTERNAL_REVIEW, IN_REVIEW, CHANGES_REQUESTED, APPROVED. */
  review?: string | null;
};

const REVIEW: Record<string, { label: string; tone: string }> = {
  INTERNAL_REVIEW: { label: "With the team", tone: "bg-[#a78bfa]/15 text-[#a78bfa]" },
  IN_REVIEW: { label: "With the client", tone: "bg-[#ffc516]/15 text-[#ffc516]" },
  CHANGES_REQUESTED: { label: "Changes asked", tone: "bg-[#ef4444]/15 text-[#ef4444]" },
  APPROVED: { label: "Approved", tone: "bg-[#22c55e]/15 text-[#22c55e]" },
};

type Folder = { key: string; label: string; hint: string; audience: string; canUpload: boolean };

const AUDIENCE: Record<string, string> = { ADMINS: "Admins only", TEAM: "Genesis only", TEAM_VENDOR: "Genesis + vendors", TEAM_CLIENT: "Genesis + client", EVERYONE: "Everyone" };
const BRIEF = "__brief";
/* Folders where a new Google Doc or Sheet makes sense. */
const GOOGLE_FILES = new Set(["brief", "scripts", "internal", "edited"]);

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
const kind = (m: string | null) => (m?.startsWith("image/") ? "image" : m?.startsWith("video/") ? "video" : m === "application/pdf" ? "pdf" : m === "text/uri-list" ? "link" : "file");
/* Opens in its own place, not the viewer: Google Docs and Sheets, and pasted links. */
const opensOut = (f: { mimeType: string | null; link?: string | null; uploadedAs?: string }) => Boolean(f.link) && (f.mimeType?.startsWith("application/vnd.google-apps") || f.mimeType === "text/uri-list" || f.uploadedAs === "drive");

/**
 * A PROJECT'S FILES, FOLDER BY FOLDER — the same gallery for Genesis, the
 * client and the vendors on the project, each seeing only what is theirs to see
 * (the server filters; this only draws). Images and videos play in place,
 * streamed from Genesis's Drive through /api/crm/files.
 */
export function ProjectFiles({ projectId, role, folders, files, brief, canDelete = false, drive = {}, agency = false, admin = true, label = "" }: { label?: string; projectId: string; role: "staff" | "client" | "vendor"; folders: Folder[]; files: FileItem[]; brief?: string | null; canDelete?: boolean; drive?: Record<string, string>; agency?: boolean; admin?: boolean }) {
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
  /* Which upload button was pressed: plain, producer reviews, or to the client. */
  const pending = useRef<"" | "internal" | "client">("");
  const pick = (r: "" | "internal" | "client") => {
    pending.current = r;
    input.current?.click();
  };
  const [making, setMaking] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  /*
   * A BOX, NOT A POP-UP (Genesis, 3 Nov 2026: "just add a box here", over the
   * browser's prompt): Add a link and the new Google Doc or Sheet open a small
   * form under the buttons.
   */
  const [box, setBox] = useState<null | { kind: "link" | "doc" | "sheet"; url: string; name: string }>(null);
  const openBox = (kind: "link" | "doc" | "sheet") => {
    if (!folder) return;
    const base = [label, folder.label].filter(Boolean).join(" · ");
    setError(null);
    setBox({ kind, url: "", name: kind === "doc" ? `${base} · Doc` : kind === "sheet" ? `${base} · Sheet` : base });
  };
  const submitBox = async () => {
    if (!box) return;
    if (box.kind === "link") await addLink(box.url, box.name);
    else await newGoogle(box.kind, box.name);
  };
  const addLink = async (url: string, name: string) => {
    if (!folder || !url.trim()) return setError("Paste a link first.");
    setMaking(true);
    setError(null);
    const r = await addProjectLink(projectId, folder.key, url, name);
    setMaking(false);
    if (!r.ok) return setError(r.error);
    setBox(null);
    router.refresh();
  };
  const sendOn = async (f: FileItem, to: "team" | "client") => {
    if (to === "client" && !window.confirm(`Email "${f.name}" to the client to approve?${SEES[f.audience]?.client ? "" : " It will be shared with them."}`)) return;
    setSending(f.id);
    setError(null);
    const r = await sendFileForReview(f.id, to);
    setSending(null);
    if (!r.ok) return setError(r.error);
    router.refresh();
  };
  /* Named after the project, so it's findable on Drive (Genesis, 31 Oct 2026: "rename this according to the project, so it's trackable"). */
  const newGoogle = async (kind: "doc" | "sheet", name: string) => {
    if (!folder) return;
    setMaking(true);
    setError(null);
    const r = await createProjectGoogleFile(projectId, folder.key, kind, name);
    setMaking(false);
    if (!r.ok) return setError(r.error);
    setBox(null);
    if (r.url) window.open(r.url, "_blank", "noopener");
    router.refresh();
  };
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
        await uploadToProject(file, { projectId, folder: folder.key, audience, review: pending.current || undefined }, set);
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

      {/*
        ONE FOLDER AT A TIME, ITS OWN BUTTONS (Genesis, 31 Oct 2026: "keep it
        structured; the upload below View; each section its own buttons to its
        folder"). Its name and who sees it, Open in Google Drive, then what you
        can do in it.
      */}
      {folder && (
        <div className="space-y-3 rounded-2xl border border-[var(--glass-border)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[1rem] font-semibold text-bone">{folder.label}</p>
              <p className="mt-0.5 text-[0.8125rem] text-ash">{folder.hint}</p>
            </div>
            {role === "staff" ? (
              <FolderShare
                folder={folder.label}
                drive={drive[folder.key] ?? drive.project}
                value={audience || defaultFor(folder)}
                options={Object.entries(AUDIENCE).filter(([k]) => admin || k !== "ADMINS").map(([k, v]) => [k, k === "TEAM" && agency ? "Team only" : agency ? v.replace("Genesis", "Team") : v] as [string, string])}
                onChange={setAudience}
                team={teamName}
              />
            ) : (
              (drive[folder.key] ?? drive.project) && (
                <a href={drive[folder.key] ?? drive.project} target="_blank" rel="noopener noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Open in Google Drive ↗</a>
              )
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-ash">
            <span>{role === "staff" ? "New files are seen by:" : "Shared with:"}</span>
            <SharedWith audience={audience || defaultFor(folder)} team={teamName} />

          </div>
          {folder.canUpload && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--glass-border)] pt-3">
              <input ref={input} type="file" multiple hidden onChange={(e) => void upload(e.target.files)} />
              <button type="button" onClick={() => pick("")} className="crm-btn crm-btn-primary crm-btn-sm" disabled={progress.length > 0}>
                <Upload className="size-4" aria-hidden /> Upload to {folder.label}
              </button>
              {role === "staff" && (
                <>
                  <button type="button" onClick={() => openBox("link")} aria-pressed={box?.kind === "link"} className="crm-btn crm-btn-secondary crm-btn-sm" disabled={making}><Link2 className="size-4" aria-hidden /> Add a link</button>
                  {GOOGLE_FILES.has(folder.key) && (
                    <>
                      <button type="button" onClick={() => openBox("doc")} aria-pressed={box?.kind === "doc"} className="crm-btn crm-btn-secondary crm-btn-sm" disabled={making}>＋ Google Doc</button>
                      <button type="button" onClick={() => openBox("sheet")} aria-pressed={box?.kind === "sheet"} className="crm-btn crm-btn-secondary crm-btn-sm" disabled={making}>＋ Google Sheet</button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
          {box && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitBox();
              }}
              className="grid gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--crm-field)] p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
            >
              {box.kind === "link" && (
                <input autoFocus type="url" required value={box.url} onChange={(e) => setBox({ ...box, url: e.target.value })} placeholder={`Paste the link: Drive, Frame.io, YouTube, Dropbox, Figma…`} aria-label="Link" className="crm-input !min-h-9" />
              )}
              <input autoFocus={box.kind !== "link"} value={box.name} onChange={(e) => setBox({ ...box, name: e.target.value })} placeholder="Name" aria-label="Name" className={`crm-input !min-h-9 ${box.kind === "link" ? "" : "sm:col-span-2"}`} />
              <div className="flex gap-2">
                <button className="crm-btn crm-btn-primary crm-btn-sm" disabled={making}>{making ? "Working…" : box.kind === "link" ? "Add link" : box.kind === "doc" ? "Create Doc" : "Create Sheet"}</button>
                <button type="button" onClick={() => setBox(null)} className="crm-btn crm-btn-secondary crm-btn-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>
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
                className="crm-input w-full !min-h-48"
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
                <button
                  type="button"
                  disabled={making}
                  onClick={async () => {
                    setMaking(true);
                    setError(null);
                    const r = await briefAsGoogleDoc(projectId);
                    setMaking(false);
                    if (!r.ok) return setError(r.error);
                    window.open(r.url, "_blank", "noopener");
                  }}
                  className="crm-btn crm-btn-secondary crm-btn-sm"
                >
                  {making ? "Opening…" : "Open as Google Doc ↗"}
                </button>
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
                <button type="button" onClick={() => (opensOut(f) ? window.open(f.link!, "_blank", "noopener") : setOpen(f))} className="relative block aspect-video w-full bg-black/80">
                  {k === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/crm/files/${f.id}`} alt="" loading="lazy" className="size-full object-cover" />
                  ) : k === "video" ? (
                    <>
                      <video src={`/api/crm/files/${f.id}#t=0.5`} preload="metadata" muted className="size-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center"><span className="grid size-10 place-items-center rounded-full bg-white/85 text-[#141216]"><Play className="ml-0.5 size-4" aria-hidden /></span></span>
                    </>
                  ) : k === "link" ? (
                    <span className="grid size-full place-items-center gap-1 text-white/70"><Link2 className="size-8" aria-hidden /><span className="max-w-[90%] truncate text-[0.6875rem] text-white/45">{f.link?.replace(/^https?:\/\/(www\.)?/, "")}</span></span>
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
                  {/* Send it on, once it's up (Genesis, 31 Oct 2026): to the team, or to the client to approve. */}
                  {role === "staff" &&
                    (f.review && REVIEW[f.review] ? (
                      <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.6875rem] ${REVIEW[f.review]!.tone}`}>{REVIEW[f.review]!.label}</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <button type="button" disabled={sending === f.id} onClick={() => void sendOn(f, "team")} className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.6875rem] text-ash hover:border-[#a78bfa] hover:text-bone">Send to team</button>
                        <button type="button" disabled={sending === f.id} onClick={() => void sendOn(f, "client")} className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.6875rem] text-ash hover:border-[#ffc516] hover:text-bone">Send to client</button>
                      </div>
                    ))}
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
                      {!opensOut(f) && <a href={`/api/crm/files/${f.id}?download=1`} aria-label={`Download ${f.name}`} className="text-ash hover:text-bone"><Download className="size-4" /></a>}
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

/*
 * SHARE A FOLDER, THE SAME WAY AS A QUOTE (Genesis, 3 Nov 2026: "instead of
 * this add a share button here, same as the other one"): who sees new files
 * in it, as a list to pick from, and its Google Drive folder to open or copy.
 */
function FolderShare({ folder, drive, value, options, onChange, team }: { folder: string; drive?: string; value: string; options: [string, string][]; onChange: (v: string) => void; team: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="crm-btn crm-btn-primary crm-btn-sm">
        <Share2 className="size-4" aria-hidden /> Share
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div role="dialog" aria-modal aria-label={`Share ${folder}`} onClick={(e) => e.stopPropagation()} className="flex max-h-[88svh] w-full max-w-[32rem] flex-col overflow-hidden rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--crm-panel)] shadow-[var(--shadow-float)]">
              <div className="flex items-start gap-3 px-6 pt-6">
                <h2 className="min-w-0 flex-1 text-[1.375rem] font-semibold leading-snug text-bone">Share &lsquo;{folder}&rsquo;</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><X className="size-5" aria-hidden /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4">
                <h3 className="text-[1rem] font-semibold text-bone">Who sees new files</h3>
                <p className="mt-0.5 text-[0.8125rem] text-ash">For what you add to {folder} from now on. Each file can still be changed on its own.</p>
                <ul className="mt-3 space-y-1.5">
                  {options.map(([k, label]) => (
                    <li key={k}>
                      <button type="button" onClick={() => onChange(k)} aria-pressed={value === k} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${value === k ? "border-[#ffc516] bg-[#ffc516]/10" : "border-[var(--glass-border)] hover:bg-[var(--hover-wash)]"}`}>
                        <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${value === k ? "border-[#ffc516] bg-[#ffc516] text-[#141216]" : "border-[var(--glass-border)]"}`}>{value === k && <Check className="size-3" aria-hidden />}</span>
                        <span className="min-w-0 flex-1 text-[0.9375rem] font-medium text-bone">{label}</span>
                        <SharedWith audience={k} small team={team} />
                      </button>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-5 text-[1rem] font-semibold text-bone">Google Drive folder</h3>
                <div className="mt-2 flex items-center gap-3 pb-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--hover-wash)] text-ash"><Lock className="size-4" aria-hidden /></span>
                  <span className="min-w-0 text-[0.8125rem] text-ash">In Genesis&apos;s Drive. Clients and vendors get their files through the CRM, not the folder.</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--crm-line)] px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {drive && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(drive).catch(() => undefined);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1800);
                        }}
                        className="crm-btn crm-btn-secondary crm-btn-sm"
                      >
                        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
                      </button>
                      <a href={drive} target="_blank" rel="noopener noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm"><ExternalLink className="size-4" aria-hidden /> Open in Google Drive</a>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => setOpen(false)} className="crm-btn crm-btn-primary crm-btn-sm">Done</button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
