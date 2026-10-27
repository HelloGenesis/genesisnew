"use client";

import { ArrowUp, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Loader2, MessageSquarePlus, Paperclip, Plus, Search, UserPlus, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { NeuralOrb } from "@/components/genesis/neural-orb";
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

/* Whether the chats panel is open, kept in this browser (and the same in every open tab). */
const LIST_KEY = "crm-assistant-list";
/* Where storage is blocked (a private window), this page's memory instead. */
let listMemory = true;
const listStore = {
  subscribe(cb: () => void) {
    window.addEventListener("storage", cb);
    window.addEventListener(LIST_KEY, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(LIST_KEY, cb);
    };
  },
  open() {
    try {
      const saved = localStorage.getItem(LIST_KEY);
      return saved === null ? listMemory : saved !== "closed";
    } catch {
      return listMemory;
    }
  },
  set(open: boolean) {
    listMemory = open;
    try {
      localStorage.setItem(LIST_KEY, open ? "open" : "closed");
    } catch {}
    window.dispatchEvent(new Event(LIST_KEY));
  },
};

/* Round the orb: what it can do, each starting a prompt. */
const SUGGESTIONS = [
  { label: "Make a quote", icon: FileText, at: "left-0 top-[18%] -translate-x-[70%]", prompt: "Make a price quote for <client> from this vendor costing, adding 50% to each line: " },
  { label: "Build an influencer plan", icon: Users, at: "right-0 top-[24%] translate-x-[70%]", prompt: "Make an influencer plan for <brand> from these screenshots: " },
  { label: "Add a lead", icon: UserPlus, at: "bottom-[22%] left-0 -translate-x-[75%]", prompt: "Add a lead: " },
  { label: "Find creators", icon: Search, at: "bottom-[16%] right-0 translate-x-[65%]", prompt: "Find wellness creators in Mumbai under 500K followers with a phone number who haven't been contacted." },
];

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
export function AssistantChat({ chats, open, firstName }: { chats: ChatItem[]; open: { id: string; title: string; messages: Msg[] } | null; firstName?: string | null }) {
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(open?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>(open?.messages ?? []);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  /* The chats panel, open or folded; remembered on this device. */
  const listOpen = useSyncExternalStore(listStore.subscribe, listStore.open, () => true);
  const toggleList = listStore.set;
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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

  const thinking = busy && (!messages.at(-1)?.text || Boolean(activity));
  const composer = (
    <div className="w-full rounded-[1.25rem] border border-[var(--glass-border)] bg-[var(--hover-wash)] p-2 sm:p-3">
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
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); void attach(e.clipboardData.files); } }}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
        rows={2}
        placeholder="Ask anything, or paste screenshots… (Enter to send, Shift+Enter for a new line)"
        className="w-full resize-none bg-transparent px-2 py-1 text-[0.9375rem] text-bone placeholder:text-faint focus:outline-none"
        aria-label="Message"
      />
      <div className="flex items-center gap-2">
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} disabled={busy} aria-expanded={menu} aria-label="Attach or start over" className="grid size-8 place-items-center rounded-full border border-[var(--glass-border)] text-ash transition-colors hover:border-[#ffc516] hover:text-bone disabled:opacity-50">
            <Plus className={`size-4 transition-transform ${menu ? "rotate-45" : ""}`} aria-hidden />
          </button>
          {menu && (
            <ul className="absolute bottom-10 left-0 z-20 w-60 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-1.5 text-[0.8125rem] shadow-[var(--shadow-float)]">
              <li><button type="button" onClick={() => { setMenu(false); picker.current?.click(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><Paperclip className="size-4" aria-hidden /> Screenshots, PDFs or Excel<ChevronRight className="ml-auto size-3.5" aria-hidden /></button></li>
              <li><Link href="/admin/assistant" onClick={() => setMenu(false)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><MessageSquarePlus className="size-4" aria-hidden /> New chat<ChevronRight className="ml-auto size-3.5" aria-hidden /></Link></li>
            </ul>
          )}
        </div>
        <input ref={picker} type="file" multiple accept="image/*,.pdf,.xlsx,.csv,.tsv" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void attach(e.target.files); e.target.value = ""; }} />
        <span className="ml-1 hidden text-[0.75rem] text-faint sm:inline">Works as you, with your permissions. Adds and updates, never deletes or messages anyone.</span>
        <button type="button" onClick={() => void send()} disabled={busy || (!text.trim() && !files.length)} aria-label="Send" className="ml-auto grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#ffc516] text-[#141216] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`grid gap-4 ${listOpen ? "lg:grid-cols-[15rem_minmax(0,1fr)]" : ""}`}>
      {/* Your chats, in a panel that folds away (Genesis, 27 Oct 2026: "everything collapsible"). */}
      {listOpen && (
        <aside className="crm-card crm-pad h-fit space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/admin/assistant" className="crm-btn crm-btn-secondary crm-btn-sm flex-1"><Plus className="size-4" aria-hidden /> New chat</Link>
            <button type="button" onClick={() => toggleList(false)} className="grid size-8 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone" aria-label="Hide your chats" title="Hide your chats"><ChevronsLeft className="size-4" aria-hidden /></button>
          </div>
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
      )}

      <section className="crm-card relative flex min-h-[72vh] flex-col overflow-hidden">
        {!listOpen && (
          <button type="button" onClick={() => toggleList(true)} className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-[0.75rem] text-ash hover:text-bone" aria-label="Show your chats">
            <ChevronsRight className="size-3.5" aria-hidden /> Chats
          </button>
        )}
        {!messages.length ? (
          /* THE AI LAB'S OPENING, IN THE CRM (Genesis, 27 Oct 2026): Genesis's orb, what it can do around it, a greeting, the composer. */
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-10">
            <div className="relative w-[min(14rem,58vw)]">
              <NeuralOrb thinking={thinking} />
              {SUGGESTIONS.map((x) => (
                <button key={x.label} type="button" onClick={() => setText(x.prompt)} className={`absolute flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--glass-border)] bg-[var(--surface-float)] px-3 py-1.5 text-[0.75rem] text-ash shadow-[var(--shadow-float)] transition-colors hover:border-[#ffc516] hover:text-bone max-sm:hidden ${x.at}`}>
                  <x.icon className="size-3.5" aria-hidden /> {x.label}
                </button>
              ))}
            </div>
            <p className="mt-5 bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#ffc516] bg-clip-text text-[1rem] text-transparent">{greeting}{firstName ? `, ${firstName}` : ""}</p>
            <h2 className="mt-1 text-balance text-center font-sans text-[1.5rem] text-bone sm:text-[1.75rem]">What should we do in the CRM?</h2>
            {/* On a phone the pills sit under the heading instead of round the orb. */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
              {SUGGESTIONS.map((x) => (
                <button key={x.label} type="button" onClick={() => setText(x.prompt)} className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-[0.75rem] text-ash"><x.icon className="size-3.5" aria-hidden /> {x.label}</button>
              ))}
            </div>
            <div className="mt-8 w-full max-w-2xl">{composer}</div>
            {error && <p className="mt-3 text-[0.8125rem] text-[#dc2626]" role="alert">{error}</p>}
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-4 pt-14 sm:p-6 sm:pt-14" data-lenis-prevent>
              {messages.map((m, i) => {
                const live = m.role === "assistant" && i === messages.length - 1;
                return m.role === "user" ? (
                  <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-[var(--hover-wash)] px-4 py-2.5">
                    {!!m.files?.length && <p className="mb-1 text-[0.75rem] text-ash">📎 {m.files.join(", ")}</p>}
                    <div className="text-[0.9375rem] leading-relaxed text-bone"><Rich text={m.text} /></div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-3">
                    {/* The orb by the latest answer, thinking while it works; a still one by the rest. */}
                    {live ? (
                      <div className={`-my-3 -ml-3 shrink-0 transition-[width,height] duration-500 ${thinking ? "size-24" : "size-14"}`}><NeuralOrb thinking={thinking} /></div>
                    ) : (
                      <span aria-hidden className="mt-1 size-8 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff7d6,#ffc516_35%,#c084fc_70%,transparent_72%)] opacity-80" />
                    )}
                    <div className="min-w-0 flex-1">
                      {!!m.tools?.length && !(live && busy) && <p className="mb-1 text-[0.75rem] text-faint">{[...new Set(m.tools)].join(" · ")}</p>}
                      <div className="text-[0.9375rem] leading-relaxed text-bone"><Rich text={m.text} /></div>
                      {live && busy && !m.text && <p className="text-[0.8125rem] text-ash" role="status">{activity ?? "Thinking…"}</p>}
                      {live && busy && m.text && activity && <p className="mt-1 text-[0.8125rem] text-ash" role="status">{activity}</p>}
                    </div>
                  </div>
                );
              })}
              {error && <p className="text-[0.8125rem] text-[#dc2626]" role="alert">{error}</p>}
              <div ref={end} />
            </div>
            <div className="border-t border-[var(--glass-border)] p-3">{composer}</div>
          </>
        )}
      </section>
    </div>
  );
}
