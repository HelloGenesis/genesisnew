"use client";

import { Bold, Code2, Heading, Highlighter, ImagePlus, Italic, Link2, List, ListOrdered, RemoveFormatting, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

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
  { key: "image", label: "Image (paste its address)", icon: <ImagePlus className="size-4" /> },
  { key: "embed", label: "Embed a video, reel, deck or design", icon: <Code2 className="size-4" /> },
  { key: "clear", label: "Clear formatting", icon: <RemoveFormatting className="size-4" /> },
];

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
      const url = ask("Image address (https://…; for a Drive image use Share → anyone with the link)");
      if (!url || !/^https:\/\//i.test(url)) return;
      const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/i);
      return run("insertHTML", `<p><img src="${(drive ? `https://lh3.googleusercontent.com/d/${drive[1]}` : url).replace(/"/g, "&quot;")}" alt=""></p>`);
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
        className="crm-rich min-h-28 px-3 py-2.5 text-[0.9375rem] text-bone outline-none empty:before:pointer-events-none empty:before:text-faint empty:before:content-[attr(data-placeholder)] [&_a]:text-[#ffc516] [&_a]:underline [&_h3]:mt-2 [&_h3]:text-[1.0625rem] [&_h3]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-xl [&_iframe]:rounded-lg [&_img]:max-h-72 [&_img]:rounded-lg [&_li]:my-0.5 [&_mark]:rounded [&_mark]:bg-[#fff2a8] [&_mark]:px-0.5 [&_mark]:text-[#141216] [&_ol]:list-decimal [&_ol]:pl-5 [&_span[style*=background]]:text-[#141216] [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
