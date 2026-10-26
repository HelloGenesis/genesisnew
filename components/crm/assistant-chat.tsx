"use client";

import { Loader2, Paperclip, Plus, Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";

import { readSheetFile } from "@/lib/sheet-file";

type ChatItem = { id: string; title: string; updatedAt: string };
type Msg = { role: "user" | "assistant"; text: string; files?: string[]; tools?: string[] };
type Attachment = { kind: "image"; media_type: string; data: string; name: string } | { kind: "pdf"; data: string; name: string } | { kind: "sheet"; text: string; name: string };

/* The request stays under the host's limit: about 4 MB of attachments a message. */
const MAX_BYTES = 3_800_000;

/** A screenshot shrunk to at most 1600 px a side, as JPEG: plenty for reading, small to send. */
async function shrinkImage(file: File): Promise<Attachment> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.85);
  return { kind: "image", media_type: "image/jpeg", data: url.slice(url.indexOf(",") + 1), name: file.name };
}
const base64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).slice(String(reader.result).indexOf(",") + 1));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
const size = (a: Attachment) => (a.kind === "sheet" ? a.text.length : a.data.length);

/** **bold**, [links](url) and bare links, line by line; nothing else is interpreted. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+)/g).map((part, j) => {
            const md = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
            if (md) return <a key={j} href={md[2]} target="_blank" rel="noreferrer" className="crm-link">{md[1]}</a>;
            if (/^https?:\/\//.test(part)) return <a key={j} href={part} target="_blank" rel="noreferrer" className="crm-link break-all">{part}</a>;
            if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={j} className="text-bone">{part.slice(2, -2)}</strong>;
            return <Fragment key={j}>{part}</Fragment>;
          })}
        </Fragment>
      ))}
    </>
  );
}

/**
 * THE CRM ASSISTANT'S CHAT (app/api/crm/assistant). Your chats on the left;
 * the answer streams in as it's written, with what it's doing in the CRM
 * shown as it happens.
 */
export function AssistantChat({ chats, open }: { chats: ChatItem[]; open: { id: string; title: string; messages: Msg[] } | null }) {
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(open?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>(open?.messages ?? []);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, activity]);

  const attach = async (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const added: Attachment[] = [];
    for (const file of Array.from(list)) {
      try {
        if (file.type.startsWith("image/")) added.push(await shrinkImage(file));
        else if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) added.push({ kind: "pdf", data: await base64(file), name: file.name });
        else if (/\.(xlsx|csv|tsv)$/i.test(file.name)) {
          const tabs = await readSheetFile(file);
          const textOf = tabs.map((t) => `${tabs.length > 1 ? `# ${t.name}\n` : ""}${t.rows.map((r) => r.join("\t")).join("\n")}`).join("\n\n");
          added.push({ kind: "sheet", text: textOf.slice(0, 400_000), name: file.name });
        } else setError(`${file.name}: attach images, PDFs, Excel (.xlsx) or CSV.`);
      } catch {
        setError(`Couldn't read ${file.name}.`);
      }
    }
    const next = [...files, ...added];
    if (next.reduce((s, a) => s + size(a), 0) > MAX_BYTES) return setError("Those files are too large for one message (about 3 MB). Send fewer at a time, or split the PDF.");
    setFiles(next);
  };

  const send = async () => {
    if (busy || (!text.trim() && !files.length)) return;
    setBusy(true);
    setError(null);
    const sent = { text: text.trim(), files };
    let madeId: string | null = null;
    let failed = false;
    setMessages((m) => [...m, { role: "user", text: sent.text, files: sent.files.map((f) => f.name) }, { role: "assistant", text: "", tools: [] }]);
    setText("");
    setFiles([]);
    try {
      const r = await fetch("/api/crm/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId, ...sent }) });
      if (!r.ok || !r.body) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't reach the assistant.");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as { t: string; id?: string; d?: string; label?: string; m?: string };
          if (e.t === "chat" && e.id) {
            if (!chatId) madeId = e.id;
            setChatId(e.id);
          } else if (e.t === "text" && e.d) {
            setActivity(null);
            setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: x.text + e.d } : x)));
          } else if (e.t === "tool" && e.label) {
            setActivity(`${e.label}…`);
            setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, tools: [...(x.tools ?? []), e.label!] } : x)));
          } else if (e.t === "error" && e.m) {
            failed = true;
            setError(e.m);
          }
        }
      }
    } catch (err) {
      failed = true;
      setError((err as Error).message);
    } finally {
      setBusy(false);
      setActivity(null);
      /* A new chat: its own address (loads it as saved); otherwise just the list refreshed. */
      if (madeId && !failed) router.replace(`/admin/assistant?chat=${madeId}`);
      else if (!failed) router.refresh();
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="crm-card crm-pad h-fit space-y-2">
        <Link href="/admin/assistant" className="crm-btn crm-btn-secondary crm-btn-sm w-full"><Plus className="size-4" aria-hidden /> New chat</Link>
        <ul className="-mx-2 max-h-[60vh] space-y-0.5 overflow-y-auto" data-lenis-prevent>
          {chats.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/assistant?chat=${c.id}`} aria-current={c.id === chatId ? "page" : undefined} className={`block truncate rounded-lg px-2 py-1.5 text-[0.8125rem] ${c.id === chatId ? "bg-[var(--hover-wash)] text-bone" : "text-ash hover:text-bone"}`}>
                {c.title}
              </Link>
            </li>
          ))}
          {!chats.length && <li className="px-2 text-[0.8125rem] text-faint">Your chats will show here.</li>}
        </ul>
      </aside>

      <section className="crm-card flex min-h-[70vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" data-lenis-prevent>
          {!messages.length && (
            <div className="space-y-2 text-[0.9375rem] text-ash">
              <p className="text-bone">Try:</p>
              {[
                "Find wellness creators in Mumbai under 500K followers with a phone number who haven't been contacted.",
                "Make an influencer plan for Beyond X from these screenshots. The last two are brand-shortlisted.",
                "Add this agency roster PDF to the influencer database; source: Collective, Oct 2026.",
                "Update plan #0000046: Shravanee is Confirmed, and add these two creators.",
              ].map((s) => (
                <button key={s} type="button" onClick={() => setText(s)} className="block w-full rounded-xl border border-[var(--glass-border)] px-3 py-2 text-left hover:text-bone">{s}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-[var(--hover-wash)] px-4 py-2.5" : "max-w-full"}>
              {!!m.tools?.length && <p className="mb-1 text-[0.75rem] text-faint">{[...new Set(m.tools)].join(" · ")}</p>}
              {!!m.files?.length && <p className="mb-1 text-[0.75rem] text-ash">📎 {m.files.join(", ")}</p>}
              <div className="text-[0.9375rem] leading-relaxed text-bone"><Rich text={m.text} /></div>
              {m.role === "assistant" && busy && i === messages.length - 1 && !m.text && <Loader2 className="size-4 animate-spin text-ash" aria-label="Working" />}
            </div>
          ))}
          {activity && <p className="text-[0.8125rem] text-ash" role="status"><Loader2 className="mr-1 inline size-3.5 animate-spin" aria-hidden />{activity}</p>}
          {error && <p className="text-[0.8125rem] text-[#dc2626]" role="alert">{error}</p>}
          <div ref={end} />
        </div>
        <div className="border-t border-[var(--glass-border)] p-3">
          {!!files.length && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[0.75rem] text-bone">
                  {f.name}
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="text-ash hover:text-[#dc2626]"><X className="size-3.5" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => picker.current?.click()} disabled={busy} className="crm-btn crm-btn-secondary crm-btn-sm" aria-label="Attach screenshots, PDFs or sheets"><Paperclip className="size-4" aria-hidden /></button>
            <input ref={picker} type="file" multiple accept="image/*,.pdf,.xlsx,.csv,.tsv" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void attach(e.target.files); e.target.value = ""; }} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); void attach(e.clipboardData.files); } }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
              rows={2}
              placeholder="Ask, or paste screenshots… (Enter to send, Shift+Enter for a new line)"
              className="crm-input !min-h-12 flex-1 resize-none"
              aria-label="Message"
            />
            <button type="button" onClick={() => void send()} disabled={busy || (!text.trim() && !files.length)} className="crm-btn crm-btn-primary crm-btn-sm disabled:opacity-50" aria-label="Send">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            </button>
          </div>
          <p className="mt-1.5 text-[0.6875rem] text-faint">It works in the CRM as you, with your permissions; it can add and update, never delete or message anyone. Check what it changed via its links.</p>
        </div>
      </section>
    </div>
  );
}
