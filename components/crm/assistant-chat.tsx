"use client";

import { AudioLines, ChevronDown, CircleHelp, Maximize2, Minimize2, ChevronsLeft, ChevronsRight, FileText, Lightbulb, ListChecks, Loader2, MessageSquarePlus, Paperclip, Plug, Plus, Scale, Search, SendHorizontal, Settings2, Sheet, Sparkles, UserPlus, Users, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";

import { type Added, type BuiltIn, ConnectorsDialog } from "@/components/crm/connectors-dialog";
import { usePref } from "@/components/crm/use-pref";
import { NeuralOrb } from "@/components/genesis/neural-orb";
import { ProductWordmark } from "@/components/genesis/product-wordmark";

import { NovaAiCredits, NovaAiPill, type NovaAi } from "./nova-ai-credits";
import { readSheetFile } from "@/lib/sheet-file";

type ChatItem = { id: string; title: string; updatedAt: string };
/* `previews`: the pictures sent in this visit, shown in the message (saved chats keep the names). */
type Msg = { role: "user" | "assistant"; text: string; files?: string[]; previews?: (string | null)[]; tools?: string[] };
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

/* Shortcuts: in the sidebar, as cards under the chat box; each starts a prompt. */
const SHORTCUTS = [
  { label: "Make a quote", at: "left-0 top-[18%] -translate-x-[70%]", body: "From a vendor's costing, with your margin and a proposal.", icon: FileText, prompt: "Make a price quote for <client> from this vendor costing, adding 50% to each line: " },
  { label: "Build an influencer plan", at: "right-0 top-[24%] translate-x-[70%]", body: "From screenshots, Excel or an agency roster.", icon: Users, prompt: "Make an influencer plan for <brand> from these screenshots: " },
  { label: "Find creators", at: "bottom-[16%] right-0 translate-x-[65%]", body: "By category, city, followers and reach-out.", icon: Search, prompt: "Find wellness creators in Mumbai under 500K followers with a phone number who haven't been contacted." },
  { label: "Add a lead", at: "bottom-[22%] left-0 -translate-x-[75%]", body: "With a follow-up date and a task.", icon: UserPlus, prompt: "Add a lead: " },
  { label: "Add a task", at: "", body: "For you or a teammate, with a due date.", icon: ListChecks, prompt: "Add a task for <teammate>, due <date>: " },
];

/* How hard it thinks (lib/crm/assistant ChatMode). */
const MODES = [
  { key: "quick", label: "Quick answer", icon: Zap },
  { key: "balanced", label: "Balanced", icon: Scale },
  { key: "deep", label: "Deep think", icon: Lightbulb },
] as const;
type Mode = (typeof MODES)[number]["key"];

/* Which AI answers (Genesis, 31 Oct 2026: "options to switch between NOVA AI 1.0 and Copilot"): Genesis's owners can try what agencies get. */
const MODELS = [
  { key: "copilot", label: "Nova Copilot", hint: "Every CRM and every tool; you choose how hard it thinks" },
  { key: "nova", label: "NOVA AI 1.0", hint: "What agencies get: their own CRM, quick answers" },
] as const;
type Model = (typeof MODELS)[number]["key"];

/*
 * THE CHARACTERS BEHIND THE CHAT BOX (Genesis, 27 Oct 2026: "the numbers in
 * the background element"): rows of letters, numbers and signs, the same on
 * every load (a fixed seed, so the server and browser draw the same), lit
 * where the box's glows are.
 */
const RAIN_INK = { backgroundImage: "linear-gradient(90deg, #ff8a3d, #ffc516 22%, #f472b6 38%, rgb(255 255 255 / 0.08) 50%, #c084fc 64%, #818cf8 85%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } as const;
const RAIN = (() => {
  let seed = 7;
  const next = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const glyphs = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ+=#%&*<>/₹";
  return Array.from({ length: 9 }, () => Array.from({ length: 64 }, () => (next() < 0.32 ? " " : glyphs[Math.floor(next() * glyphs.length)])).join(""));
})();

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
export function AssistantChat({ chats, open, firstName, connectors, initialText = "", monthCost, nova, defaults }: { chats: ChatItem[]; open: { id: string; title: string; messages: Msg[] } | null; firstName?: string | null; initialText?: string; connectors: { builtIns: BuiltIn[]; added: Added[]; canManage: boolean }; monthCost?: string; nova?: NovaAi; defaults?: { model: "copilot" | "nova"; mode: "quick" | "balanced" | "deep" } }) {
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(open?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>(open?.messages ?? []);
  /* A prompt to start from (?prompt=, from the rail's Create links). */
  const [text, setText] = useState(initialText);
  const [outOfCredits, setOutOfCredits] = useState(Boolean(nova && !nova.demo && nova.credits < 1));
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  /* Where each owner's chats start (AI settings, lib/crm/ai-prefs). */
  const [mode, setMode] = useState<Mode>(defaults?.mode ?? "balanced");
  const [model, setModel] = useState<Model>(defaults?.model ?? "copilot");
  const [modeMenu, setModeMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [dragging, setDragging] = useState(false);
  /* The assistant over the whole screen; Esc leaves. Remembered, so a new chat (a new page) stays full screen (Genesis, 29 Oct 2026). */
  const [full, setFull] = usePref("crm-assistant-full", false);
  useEffect(() => {
    if (!full) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !showConnectors && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = was;
      window.removeEventListener("keydown", onKey);
    };
  }, [full, setFull, showConnectors]);
  /* Out of full screen, the window fits what's left of the screen below it, each time (Genesis, 29 Oct 2026: "fit it every time"). */
  const frame = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number | null>(null);
  useEffect(() => {
    if (full) return;
    const measure = () => {
      const el = frame.current;
      if (!el) return;
      const scroller = el.closest("main");
      const top = el.getBoundingClientRect().top + (scroller && getComputedStyle(scroller).overflowY === "auto" ? scroller.scrollTop : window.scrollY);
      const bottom = scroller ? parseFloat(getComputedStyle(scroller).paddingBottom) : 0;
      const frameBottom = scroller ? window.innerHeight - scroller.getBoundingClientRect().bottom : 0;
      setFit(Math.max(448, Math.floor(window.innerHeight - top - Math.min(bottom, 32) - Math.max(frameBottom, 0))));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [full]);
  const fullButton = (
    <button type="button" onClick={() => setFull(!full)} aria-pressed={full} aria-label={full ? "Leave full screen" : "Full screen"} title={full ? "Leave full screen (Esc)" : "Full screen"} className="grid size-8 shrink-0 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
      {full ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
    </button>
  );
  const liveApps = connectors.builtIns.filter((b) => b.on).length + connectors.added.filter((c) => c.enabled).length;
  /* The sidebar, open or folded; remembered on this device. */
  const [listOpen, toggleList] = usePref("crm-assistant-sidebar", true);
  const picker = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    /* The newest message in view, inside the window; the page itself doesn't move. */
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
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
    /* The chat box, taller now, kept in view. */
    requestAnimationFrame(() => box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const send = async () => {
    if (busy || (!text.trim() && !files.length)) return;
    /*
     * THE DEMO ANSWERS ITSELF (Genesis, 31 Oct 2026: "when anyone writes on
     * the demo, an automated reply: explore our plans to upgrade"). Nothing is
     * sent to the AI from the demo.
     */
    if (nova?.demo) {
      const asked = text.trim() || files.map((f) => f.name).join(", ");
      setMessages((m) => [
        ...m,
        { role: "user", text: asked, files: files.map((f) => f.name), previews: files.map((f) => (f.kind === "image" ? `data:${f.media_type};base64,${f.data}` : null)) },
        { role: "assistant", text: "This is Nova's live demo, so NOVA AI doesn't answer here.\n\nIn your own Nova, it would do this for you: make the quote or plan, add the lead, or find the creators, from text, screenshots, Excel or PDFs.\n\n[Start your 14-day free trial](https://genesismedia.co/resellers#trial) to get 5 free NOVA AI requests, or [explore the plans](https://genesismedia.co/resellers#pricing) to upgrade.", tools: [] },
      ]);
      setText("");
      setFiles([]);
      return;
    }
    setBusy(true);
    setError(null);
    const sent = { text: text.trim(), files, mode, model };
    let madeId: string | null = null;
    let failed = false;
    setMessages((m) => [...m, { role: "user", text: sent.text, files: sent.files.map((f: Attachment) => f.name), previews: sent.files.map((f: Attachment) => (f.kind === "image" ? `data:${f.media_type};base64,${f.data}` : null)) }, { role: "assistant", text: "", tools: [] }]);
    setText("");
    setFiles([]);
    try {
      const r = await fetch("/api/crm/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId, ...sent }) });
      if (!r.ok || !r.body) {
        const why = (await r.json().catch(() => ({}))) as { error?: string; topUp?: boolean };
        if (why.topUp) setOutOfCredits(true);
        throw new Error(why.error ?? "Couldn't reach the assistant.");
      }
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

  /* Voice: the browser's own dictation, where it has it (Chrome, Edge, Safari), typed into the box. */
  const voice = () => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Rec = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Rec) return setError("Voice typing isn't available in this browser; try Chrome or Safari.");
    const rec = new Rec();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => setText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}${Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" ")}`);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const thinking = busy && (!messages.at(-1)?.text || Boolean(activity));
  const modeNow = MODES.find((m) => m.key === mode)!;

  /* THE CHAT BOX (Genesis, 27 Oct 2026, after the reference): Genesis's gradient edge and glows, characters behind it. */
  const composer = (
    <div className="relative w-full">
      <div aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-10 overflow-hidden [mask-image:radial-gradient(70%_80%_at_50%_50%,black,transparent)]">
        <pre className="absolute inset-0 flex flex-col items-center justify-center whitespace-pre font-mono text-[0.6875rem] leading-[1.35rem] tracking-[0.35em] opacity-70" style={RAIN_INK}>
          {RAIN.join("\n")}
        </pre>
      </div>
      <span aria-hidden className="pointer-events-none absolute -left-4 top-1/2 h-24 w-40 -translate-y-1/2 rounded-full bg-[#ff8a3d]/35 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -right-4 top-1/2 h-24 w-40 -translate-y-1/2 rounded-full bg-[#a78bfa]/40 blur-3xl" />
      <div className={`relative rounded-[1.25rem] bg-gradient-to-r from-[#ffc516] via-[#f472b6] to-[#a78bfa] p-px shadow-[0_20px_60px_-25px_rgb(244_114_182/0.6)] ${thinking ? "animate-pulse" : ""}`}>
        <div className="rounded-[calc(1.25rem-1px)] bg-[var(--crm-panel)] p-3">
          {/* What's attached (Genesis, 27 Oct 2026: as in the reference): a picture of each, × to take it off. */}
          {!!files.length && (
            <div className="mb-3 flex flex-wrap gap-3 px-1 pt-2">
              {files.map((f, i) => (
                <span key={i} className="group relative">
                  <Thumb file={f} />
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--surface-float)] text-ash shadow-[var(--shadow-float)] hover:text-bone"><X className="size-3.5" aria-hidden /></button>
                </span>
              ))}
            </div>
          )}
          <textarea
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); void attach(e.clipboardData.files); } }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            rows={2}
            placeholder="Ask anything, or paste screenshots…"
            className="w-full resize-none bg-transparent px-1 py-1 text-[0.9375rem] text-bone placeholder:text-faint focus:outline-none"
            aria-label="Message"
          />
          <div className="mt-1 flex items-center gap-2">
            <div className="relative">
              <button type="button" onClick={() => { setMenu((m) => !m); setModeMenu(false); }} disabled={busy} aria-expanded={menu} aria-label="Attach or start over" className={CHIP + " !px-0 w-9 justify-center"}>
                <Plus className={`size-4 transition-transform ${menu ? "rotate-45" : ""}`} aria-hidden />
              </button>
              {menu && (
                <ul className={MENU}>
                  <li><button type="button" onClick={() => { setMenu(false); picker.current?.click(); }} className={MENU_ITEM}><Paperclip className="size-4" aria-hidden /> Screenshots, PDFs or Excel</button></li>
                  <li><button type="button" onClick={() => { setMenu(false); setShowConnectors(true); }} className={MENU_ITEM}><Plug className="size-4" aria-hidden /> Connectors</button></li>
                  <li><Link href="/admin/assistant" onClick={() => setMenu(false)} className={MENU_ITEM}><MessageSquarePlus className="size-4" aria-hidden /> New chat</Link></li>
                </ul>
              )}
            </div>
            {/* NOVA AI runs in quick mode only (lib/crm/nova-ai). */}
            {!nova && (
            <div className="relative">
                <button type="button" onClick={() => { setModeMenu((m) => !m); setMenu(false); }} aria-expanded={modeMenu} aria-label={`Model: ${model === "nova" ? "NOVA AI 1.0" : `Nova Copilot, ${modeNow.label}`}`} className={CHIP}>
                  <Sparkles className="size-3.5 text-[#f472b6]" aria-hidden />
                  <span className="font-medium text-bone">{model === "nova" ? "NOVA AI 1.0" : "Nova Copilot"}</span>
                  {model === "copilot" && <span className="max-sm:hidden">· {modeNow.label}</span>}
                  <ChevronDown className={`size-3.5 transition-transform ${modeMenu ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {modeMenu && (
                  <ul className={`${MENU} w-72`}>
                    <li className="px-3 pb-1 pt-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Model</li>
                    {MODELS.map((m) => (
                      <li key={m.key}>
                        <button type="button" onClick={() => { setModel(m.key); if (m.key === "nova") setModeMenu(false); }} aria-pressed={model === m.key} className={`${MENU_ITEM} !items-start ${model === m.key ? "bg-[var(--hover-wash)] text-bone" : ""}`}>
                          <Sparkles className={`mt-0.5 size-4 shrink-0 ${m.key === "copilot" ? "text-[#f472b6]" : "text-[#c084fc]"}`} aria-hidden />
                          <span className="text-left"><span className="block text-bone">{m.label}</span><span className="block text-[0.75rem] text-faint">{m.hint}</span></span>
                        </button>
                      </li>
                    ))}
                    {model === "copilot" && (
                      <>
                        <li className="mt-1 border-t border-[var(--glass-border)] px-3 pb-1 pt-2 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Thinking</li>
                        {MODES.map((m) => (
                          <li key={m.key}>
                            <button type="button" onClick={() => { setMode(m.key); setModeMenu(false); }} aria-pressed={mode === m.key} className={`${MENU_ITEM} ${mode === m.key ? "bg-[var(--hover-wash)] text-bone" : ""}`}><m.icon className="size-4" aria-hidden /> {m.label}</button>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                )}
              </div>
            )}
            <input ref={picker} type="file" multiple accept="image/*,.pdf,.xlsx,.csv,.tsv" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void attach(e.target.files); e.target.value = ""; }} />
            <button type="button" onClick={() => setShowConnectors(true)} className={`${CHIP} max-sm:hidden`} aria-label={`Connectors: ${liveApps} on`}>
              <Plug className="size-3.5" aria-hidden /> Connectors <span className="rounded-full bg-[var(--hover-wash)] px-1.5 text-[0.6875rem] text-bone">{liveApps}</span>
            </button>
            <button type="button" onClick={voice} disabled={busy || listening} className={`${CHIP} ml-auto ${listening ? "!border-[#f472b6] !text-bone" : ""}`} aria-label="Voice typing">
              <AudioLines className={`size-3.5 ${listening ? "animate-pulse" : ""}`} aria-hidden /> <span className="max-sm:hidden">{listening ? "Listening…" : "Voice"}</span>
            </button>
            <button type="button" onClick={() => void send()} disabled={busy || (!text.trim() && !files.length)} aria-label="Send" className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffc516] via-[#f472b6] to-[#a78bfa] text-white shadow-[0_6px_20px_-6px_rgb(244_114_182/0.8)] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <SendHorizontal className="size-4" aria-hidden />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    /* ONE WINDOW (Genesis, 27 Oct 2026, after the reference): the sidebar inside it, the orb and the chat box in the middle. */
    /* A fixed window (Genesis, 27 Oct 2026: "this section stays still"): only the conversation scrolls inside it. */
    <div ref={frame} style={full || fit === null ? undefined : { height: fit }} className={full ? "fixed inset-0 z-[80] flex overflow-hidden bg-[var(--crm-panel)]" : "crm-card relative flex h-[calc(100svh-16.25rem)] min-h-[28rem] overflow-hidden !p-0"}>
      {listOpen && (
        <aside className="flex w-[16rem] shrink-0 flex-col border-r border-[var(--glass-border)] max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:bg-[var(--crm-panel)] max-lg:shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-2 px-4 pb-3 pt-4">
            {/* The GENESIS COPILOT wordmark (Genesis, 30 Oct 2026), its N standing in for the logo tile. */}
            <span className="flex flex-1 items-center gap-1.5">{nova ? <><ProductWordmark product="nova" className="h-[14px]" /><span className="text-[0.75rem] font-medium tracking-[0.2em] text-ash">AI</span></> : <ProductWordmark product="copilot" className="h-[18px]" />}</span>
            {fullButton}
            <button type="button" onClick={() => toggleList(false)} className="grid size-8 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone" aria-label="Hide the sidebar" title="Hide the sidebar"><ChevronsLeft className="size-4" aria-hidden /></button>
          </div>
          <div className="px-3">
            <Link href="/admin/assistant" className="flex items-center gap-2 rounded-xl bg-[var(--hover-wash)] px-3 py-2.5 text-[0.875rem] text-bone hover:bg-[var(--crm-card-hover)]"><MessageSquarePlus className="size-4" aria-hidden /> New chat</Link>
          </div>
          <p className="mt-5 px-5 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Shortcuts</p>
          <ul className="mt-1.5 space-y-0.5 px-3">
            {SHORTCUTS.map((x) => (
              <li key={x.label}>
                <button type="button" onClick={() => setText(x.prompt)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.875rem] text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><x.icon className="size-4 shrink-0" aria-hidden /> {x.label}</button>
              </li>
            ))}
          </ul>
          <div className="mt-1 px-3">
            <button type="button" onClick={() => setShowConnectors(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.875rem] text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><Plug className="size-4 shrink-0" aria-hidden /> Connectors <span className="ml-auto rounded-full bg-[var(--hover-wash)] px-1.5 text-[0.6875rem] text-bone">{liveApps}</span></button>
          </div>
          <p className="mt-5 px-5 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Your chats</p>
          <ul className="mt-1.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" data-lenis-prevent>
            {chats.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/assistant?chat=${c.id}`} aria-current={c.id === chatId ? "page" : undefined} className={`block truncate rounded-xl px-3 py-2 text-[0.8125rem] ${c.id === chatId ? "bg-[var(--hover-wash)] text-bone" : "text-ash hover:text-bone"}`}>
                  {c.title}
                </Link>
              </li>
            ))}
            {!chats.length && <li className="px-3 text-[0.8125rem] text-faint">Your chats will show here.</li>}
          </ul>
          {/* What you've used this month (Genesis, 30 Oct 2026: "show usage to each user"); the detail is on /admin/assistant/usage. */}
          {monthCost && !nova && (
            <div className="mx-3 mb-3 flex gap-2">
              <Link href="/admin/assistant/usage" className="flex min-w-0 flex-1 items-center justify-between rounded-xl border border-[var(--glass-border)] px-3 py-2 text-[0.75rem] text-ash hover:border-[#ffc516]/60 hover:text-bone">
                <span className="truncate">Your usage this month</span>
                <span className="tabular-nums text-bone">{monthCost} →</span>
              </Link>
              {/* AI settings (Genesis, 31 Oct 2026). */}
              <Link href="/admin/assistant/settings" aria-label="AI settings" title="AI settings" className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--glass-border)] text-ash hover:border-[#ffc516]/60 hover:text-bone">
                <Settings2 className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </aside>
      )}

      {/* Drop screenshots, PDFs or sheets anywhere here to attach them. */}
      <section
        className="relative flex min-h-0 min-w-0 flex-1 flex-col"
        onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } }}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={(e) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); setDragging(false); void attach(e.dataTransfer.files); }}
      >
        {dragging && (
          <div aria-hidden className="pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-[1.25rem] border-2 border-dashed border-[#f472b6] bg-[var(--crm-panel)]/85 backdrop-blur-sm">
            <span className="flex items-center gap-2 text-[1rem] text-bone"><Paperclip className="size-5 text-[#ffc516]" aria-hidden /> Drop to attach: pictures, PDFs or Excel</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-4 pt-4 sm:px-6">
          {!listOpen && (
            <button type="button" onClick={() => toggleList(true)} className={CHIP} aria-label="Show the sidebar"><ChevronsRight className="size-3.5" aria-hidden /> Chats</button>
          )}
          {!listOpen && <span className="ml-auto">{fullButton}</span>}
          {/* Copilot's own tour (components/crm/copilot-tour). */}
          {!nova && <button type="button" data-copilot-tour className={`${CHIP} ${listOpen ? "ml-auto" : ""}`}><CircleHelp className="size-3.5" aria-hidden /> <span className="max-sm:hidden">How it works</span></button>}
          {/* NOVA AI: its credits in this corner instead of New chat (that stays in the sidebar); nothing here in the demo. */}
          {nova ? (!nova.demo && <NovaAiPill nova={nova} />) : (
          <Link href="/admin/assistant" className={CHIP} aria-label="New chat"><MessageSquarePlus className="size-3.5" aria-hidden /> <span className="max-sm:hidden">New chat</span></Link>
          )}
        </div>

        {!messages.length ? (
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 py-8 [container-type:size] sm:px-10 [&>*:first-child]:mt-auto [&>*:last-child]:mb-auto" data-lenis-prevent>
            {/* Genesis's orb with what it can do round it (as before), the greeting, the chat box; the orb shrinks on a short window so the chat box always shows. */}
            <div className="relative w-[max(9rem,min(15rem,58vw,calc(100cqh-20rem)))]">
              <NeuralOrb thinking={thinking} />
              {/* Just the orb, for NOVA AI and Nova Copilot alike (Genesis, 31 Oct 2026: "remove the Nova logo from here"). */}
              {SHORTCUTS.filter((x) => x.at).map((x) => (
                <button key={x.label} type="button" onClick={() => setText(x.prompt)} className={`absolute hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--glass-border)] bg-[var(--surface-float)] px-3 py-1.5 text-[0.75rem] text-ash shadow-[var(--shadow-float)] transition-colors hover:border-[#ffc516] hover:text-bone sm:[@container(min-height:30rem)]:flex ${x.at}`}>
                  <x.icon className="size-3.5" aria-hidden /> {x.label}
                </button>
              ))}
            </div>
            <p className="mt-5 bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#ffc516] bg-clip-text text-[1rem] text-transparent">{greeting}{firstName ? `, ${firstName}` : ""}</p>
            <h2 className="mt-1 text-balance text-center font-sans text-[1.5rem] text-bone sm:text-[1.875rem]">What should we do in the CRM?</h2>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
              {SHORTCUTS.slice(0, 4).map((x) => (
                <button key={x.label} type="button" onClick={() => setText(x.prompt)} className={CHIP}><x.icon className="size-3.5" aria-hidden /> {x.label}</button>
              ))}
            </div>
            <div className="mt-6 w-full max-w-3xl">{composer}</div>
            {error && <p className="mt-3 text-[0.8125rem] text-[#dc2626]" role="alert">{error}</p>}
            {nova && !nova.demo && outOfCredits && <div className="mt-3 w-full max-w-sm"><NovaAiCredits nova={nova} open compact /></div>}
          </div>
        ) : (
          <>
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
            <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
              {messages.map((m, i) => {
                const live = m.role === "assistant" && i === messages.length - 1;
                return m.role === "user" ? (
                  <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-[var(--hover-wash)] px-4 py-2.5">
                    {!!m.files?.length &&
                      (m.previews?.some(Boolean) ? (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {m.files.map((name, j) =>
                            m.previews?.[j] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={j} src={m.previews[j]!} alt={name} className="size-20 rounded-xl border border-[var(--glass-border)] object-cover" />
                            ) : (
                              <span key={j} className="grid h-20 w-24 place-items-center rounded-xl border border-[var(--glass-border)] px-2 text-center text-[0.6875rem] text-ash"><FileText className="mx-auto size-5" aria-hidden /><span className="line-clamp-2">{name}</span></span>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="mb-1 text-[0.75rem] text-ash">📎 {m.files.join(", ")}</p>
                      ))}
                    <div className="text-[0.9375rem] leading-relaxed text-bone"><Rich text={m.text} /></div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-3">
                    {/* The orb by the latest answer, thinking while it works; a still one by the rest. */}
                    {live ? (
                      <div className={`-my-3 -ml-3 shrink-0 transition-[width,height] duration-500 ${thinking ? "size-24" : "size-14"}`}><NeuralOrb thinking={thinking} /></div>
                    ) : (
                      <span aria-hidden className="mt-1 size-8 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff7d6,#ffc516_35%,#f472b6_65%,#a78bfa_85%)] opacity-80" />
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
            </div>
            </div>
            <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-2 sm:px-6">{composer}</div>
          </>
        )}
        <p className="pb-3 text-center text-[0.6875rem] text-faint">Works as you, with your permissions. Adds and updates, never deletes or messages anyone.</p>
      </section>
      {showConnectors && <ConnectorsDialog {...connectors} onClose={() => setShowConnectors(false)} />}
    </div>
  );
}

/** An attachment as the chat box shows it: the picture itself, or a tile for a PDF or a sheet. */
function Thumb({ file }: { file: Attachment }) {
  if (file.kind === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`data:${file.media_type};base64,${file.data}`} alt={file.name} title={file.name} className="size-24 rounded-2xl border-2 border-[#a78bfa]/70 object-cover shadow-[0_0_0_4px_rgb(167_139_250/0.15)]" />;
  const pdf = file.kind === "pdf";
  return (
    <span title={file.name} className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-[#a78bfa]/70 bg-[var(--hover-wash)] px-2 text-center shadow-[0_0_0_4px_rgb(167_139_250/0.15)]">
      {pdf ? <FileText className="size-6 text-[#f472b6]" aria-hidden /> : <Sheet className="size-6 text-[#22c55e]" aria-hidden />}
      <span className="line-clamp-2 break-all text-[0.625rem] leading-tight text-ash">{file.name}</span>
    </span>
  );
}

/* The chat box's buttons and menus. */
const CHIP = "inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3 text-[0.8125rem] text-ash transition-colors hover:border-[#ffc516]/60 hover:text-bone disabled:opacity-50";
const MENU = "absolute bottom-11 left-0 z-20 w-56 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float)] p-1.5 text-[0.8125rem] shadow-[var(--shadow-float)]";
const MENU_ITEM = "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-ash hover:bg-[var(--hover-wash)] hover:text-bone";

/* The browser's speech recognition, as much of it as is used here. */
type SpeechRec = { lang: string; interimResults: boolean; start: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
