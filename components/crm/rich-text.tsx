"use client";

import { Bold, Code2, Heading, Highlighter, ImagePlus, Italic, Link2, List, ListOrdered, RemoveFormatting, Underline } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { embedUrl, textToHtml } from "@/lib/rich-text";

type Tool = "bold" | "italic" | "underline" | "highlight" | "heading" | "bullets" | "numbered" | "link" | "image" | "embed" | "clear";
const TOOLS: { key: Tool; label: string; icon: React.ReactNode }[] = [
  { key: "bold", label: "Bold", icon: <Bold className="size-4" /> },
  { key: "italic", label: "Italic", icon: <Italic className="size-4" /> },
  { key: "underline", label: "Underline", icon: <Underline className="size-4" /> },
  { key: "highlight", label: "Highlight", icon: <Highlighter className="size-4" /> },
  { key: "heading", label: "Heading", icon: <Heading className="size-4" /> },
  { key: "bullets", label: "Bullets", icon: <List className="size-4" /> },
  { key: "numbered", label: "Numbered list", icon: <ListOrdered className="size-4" /> },
  { key: "link", label: "Link", icon: <Link2 className="size-4" /> },
  { key: "image", label: "Add an image (or paste / drop one into the box)", icon: <ImagePlus className="size-4" /> },
  { key: "embed", label: "Embed a video, reel, deck or design", icon: <Code2 className="size-4" /> },
  { key: "clear", label: "Clear formatting", icon: <RemoveFormatting className="size-4" /> },
];

/** A photo made web-sized before upload: at most 2000px wide, as WebP (GIFs and small files as they are). */
async function shrink(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size < 700_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = Object.assign(document.createElement("canvas"), { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/webp", 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" }) : file;
  } catch {
    return file;
  }
}

/**
 * A PROPOSAL BOX YOU CAN FORMAT (Genesis, 13 Oct 2026: "a tool section for
 * text edits, highlights, and other things like adding images, link, embed").
 * Bold, italic, underline, highlight, a heading, lists, a link, an image by
 * its address, and an embed (YouTube, Instagram reel, Drive, Slides, Canva,
 * Loom, Figma). What it writes is cleaned on the server before it is kept.
 */
export function RichText({ value, onChange, placeholder, label }: { value: string; onChange: (html: string) => void; placeholder?: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const last = useRef<string>("");
  const picker = useRef<HTMLInputElement>(null);
  const spot = useRef<Range | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  /* Where the image goes: the cursor when the button was pressed (choosing a file takes the focus away). */
  const remember = () => {
    const sel = window.getSelection();
    spot.current = sel?.rangeCount && box.current?.contains(sel.getRangeAt(0).commonAncestorContainer) ? sel.getRangeAt(0).cloneRange() : null;
  };
  async function upload(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setUploading(images.length > 1 ? `Uploading ${images.length} images…` : "Uploading the image…");
    try {
      for (const original of images) {
        const body = new FormData();
        body.append("file", await shrink(original));
        const response = await fetch("/api/crm/images", { method: "POST", body });
        const json = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!response.ok || !json.url) throw new Error(json.error ?? `Error ${response.status}`);
        box.current?.focus();
        if (spot.current) {
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(spot.current);
        }
        document.execCommand("insertHTML", false, `<p><img src="${json.url.replace(/"/g, "&quot;")}" alt=""></p>`);
        remember();
        emit();
      }
      setUploading(null);
    } catch (e) {
      setUploading(`Image not added: ${(e as Error).message}`);
    }
  }

  /* The box owns its text while you type; it's only rewritten when the value changes from outside. */
  useEffect(() => {
    const html = textToHtml(value);
    if (box.current && html !== last.current) {
      box.current.innerHTML = html;
      last.current = html;
    }
  }, [value]);

  const emit = () => {
    const html = box.current?.innerHTML ?? "";
    const clean = html === "<br>" || html === "<p><br></p>" ? "" : html;
    last.current = clean;
    onChange(clean);
  };
  const run = (command: string, arg?: string) => {
    box.current?.focus();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, arg);
    emit();
  };
  const ask = (q: string) => window.prompt(q)?.trim() || null;

  function act(tool: Tool) {
    if (tool === "bold" || tool === "italic" || tool === "underline") return run(tool);
    if (tool === "heading") return run("formatBlock", "h3");
    if (tool === "bullets") return run("insertUnorderedList");
    if (tool === "numbered") return run("insertOrderedList");
    if (tool === "clear") return run("removeFormat");
    if (tool === "highlight") {
      /* The selection wrapped in <mark> (kept as a highlight on the client's page and in emails). */
      const range = window.getSelection()?.rangeCount ? window.getSelection()!.getRangeAt(0) : null;
      if (!range || range.collapsed || !box.current?.contains(range.commonAncestorContainer)) return;
      const holder = document.createElement("div");
      holder.appendChild(range.cloneContents());
      return run("insertHTML", `<mark>${holder.innerHTML}</mark>`);
    }
    if (tool === "link") {
      const url = ask("Link address (https://…)");
      if (!url) return;
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      if (window.getSelection()?.toString()) return run("createLink", href);
      return run("insertHTML", `<a href="${href.replace(/"/g, "&quot;")}">${href.replace(/</g, "&lt;")}</a>&nbsp;`);
    }
    if (tool === "image") {
      remember();
      return picker.current?.click();
    }
    const url = ask("Paste a YouTube, Instagram reel/post, Google Drive/Slides, Canva, Loom or Figma link");
    if (!url) return;
    const src = embedUrl(url);
    if (src) return run("insertHTML", `<p><iframe src="${src.replace(/"/g, "&quot;")}"></iframe></p><p><br></p>`);
    return run("insertHTML", `<a href="${url.replace(/"/g, "&quot;")}">${url.replace(/</g, "&lt;")}</a>&nbsp;`);
  }

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--input-bg,transparent)] focus-within:border-[#ffc516]">
      <div className="flex flex-wrap gap-0.5 border-b border-[var(--glass-border)] px-1.5 py-1" role="toolbar" aria-label={`${label} formatting`}>
        {TOOLS.map((t) => (
          <button key={t.key} type="button" title={t.label} aria-label={t.label} onMouseDown={(e) => e.preventDefault()} onClick={() => act(t.key)} className="grid size-8 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
            {t.icon}
          </button>
        ))}
      </div>
      <div
        ref={box}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label={label}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          const files = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
          if (!files.length) return;
          e.preventDefault();
          remember();
          void upload(files);
        }}
        onDrop={(e) => {
          const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
          if (!files.length) return;
          e.preventDefault();
          const at = document.caretRangeFromPoint?.(e.clientX, e.clientY);
          if (at) spot.current = at;
          void upload(files);
        }}
        className="crm-rich min-h-28 px-3 py-2.5 text-[0.9375rem] text-bone outline-none empty:before:pointer-events-none empty:before:text-faint empty:before:content-[attr(data-placeholder)] [&_a]:text-[#ffc516] [&_a]:underline [&_h3]:mt-2 [&_h3]:text-[1.0625rem] [&_h3]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-xl [&_iframe]:rounded-lg [&_img]:max-h-72 [&_img]:rounded-lg [&_li]:my-0.5 [&_mark]:rounded [&_mark]:bg-[#fff2a8] [&_mark]:px-0.5 [&_mark]:text-[#141216] [&_ol]:list-decimal [&_ol]:pl-5 [&_span[style*=background]]:text-[#141216] [&_ul]:list-disc [&_ul]:pl-5"
      />
      <input
        ref={picker}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void upload([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      {uploading && <p className="border-t border-[var(--glass-border)] px-3 py-1.5 text-[0.8125rem] text-ash" role="status">{uploading}</p>}
    </div>
  );
}
