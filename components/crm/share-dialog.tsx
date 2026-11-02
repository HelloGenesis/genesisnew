"use client";

import { Check, Link2, Lock, Share2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { shareQuote, unshareQuote } from "@/app/(crm)/admin/actions/quote-share";

type Person = { id: string; name: string; email: string | null; picture: string | null };
type WithAccess = Person & { access: "Owner" | "Super admin" | "Shared" };

const Avatar = ({ p }: { p: Person }) =>
  p.picture ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.picture} alt="" className="size-9 shrink-0 rounded-full object-cover" />
  ) : (
    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffaf18] via-[#f06144] to-[#ac84fe] text-[0.75rem] font-semibold text-white">
      {p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
    </span>
  );

/**
 * SHARE, THE WAY GOOGLE DOES IT (Genesis, 2 Nov 2026: "somewhere on the top
 * right corner it should look somewhat like this", with Google Docs' Share
 * dialog): add people from your team, who already has access, who else on
 * the team can open it, and Copy link.
 */
export function ShareDialog({ quoteId, title, viewerId, link, crm, people, candidates }: { quoteId: string; title: string; viewerId: string; link: string; crm: string; people: WithAccess[]; candidates: Person[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Person[]>([]);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 30);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const has = useMemo(() => new Set([...people.map((p) => p.id), ...picked.map((p) => p.id), viewerId]), [people, picked, viewerId]);
  const q = query.trim().toLowerCase();
  const matches = q ? candidates.filter((c) => !has.has(c.id) && (c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q))).slice(0, 6) : [];

  const send = () =>
    start(async () => {
      const r = await shareQuote(quoteId, picked.map((p) => p.id), note);
      setMsg(r.message);
      if (r.ok) {
        setPicked([]);
        setNote("");
      }
    });
  const copy = async () => {
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <button type="button" onClick={() => { setMsg(null); setOpen(true); }} className="crm-btn crm-btn-primary crm-btn-sm">
        <Share2 className="size-4" aria-hidden /> Share
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div role="dialog" aria-modal aria-label={`Share ${title}`} onClick={(e) => e.stopPropagation()} className="flex max-h-[88svh] w-full max-w-[34rem] flex-col overflow-hidden rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--crm-panel)] shadow-[var(--shadow-float)]">
              <div className="flex items-start gap-3 px-6 pt-6">
                <h2 className="min-w-0 flex-1 text-[1.375rem] font-semibold leading-snug text-bone">Share &lsquo;<span className="line-clamp-2 inline">{title}</span>&rsquo;</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><X className="size-5" aria-hidden /></button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4">
                {/* Add people */}
                <div className="relative">
                  <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border-2 border-[#ffc516]/70 px-3 py-2 focus-within:border-[#ffc516]">
                    {picked.map((p) => (
                      <span key={p.id} className="flex items-center gap-1 rounded-full bg-[var(--hover-wash)] py-0.5 pl-2.5 pr-1 text-[0.8125rem] text-bone">
                        {p.name}
                        <button type="button" aria-label={`Remove ${p.name}`} onClick={() => setPicked((x) => x.filter((y) => y.id !== p.id))} className="grid size-5 place-items-center rounded-full hover:bg-black/20"><X className="size-3" aria-hidden /></button>
                      </span>
                    ))}
                    <input
                      ref={input}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && matches[0]) {
                          e.preventDefault();
                          setPicked((x) => [...x, matches[0]!]);
                          setQuery("");
                        }
                        if (e.key === "Backspace" && !query && picked.length) setPicked((x) => x.slice(0, -1));
                      }}
                      placeholder={picked.length ? "" : "Add people from your team"}
                      className="min-w-[8rem] flex-1 bg-transparent text-[0.9375rem] text-bone outline-none placeholder:text-ash"
                    />
                  </div>
                  {matches.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--crm-panel)] shadow-[var(--shadow-float)]">
                      {matches.map((m) => (
                        <li key={m.id}>
                          <button type="button" onClick={() => { setPicked((x) => [...x, m]); setQuery(""); input.current?.focus(); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--hover-wash)]">
                            <Avatar p={m} />
                            <span className="min-w-0"><span className="block truncate text-[0.875rem] font-medium text-bone">{m.name}</span>{m.email && <span className="block truncate text-[0.75rem] text-ash">{m.email}</span>}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {picked.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message (optional)" className="crm-input !min-h-24 text-[0.875rem]" />
                    <p className="text-[0.75rem] text-faint">They get a notification and an email with a link to it, and editor access to its Google Sheets.</p>
                  </div>
                )}

                {msg && <p role="status" className="mt-3 text-[0.8125rem] text-ash">{msg}</p>}

                {/* People with access */}
                <h3 className="mt-6 text-[1rem] font-semibold text-bone">People with access</h3>
                <ul className="mt-2 divide-y divide-[var(--crm-line)]">
                  {people.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <Avatar p={p} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-medium text-bone">{p.name}{p.id === viewerId ? " (you)" : ""}</span>
                        {p.email && <span className="block truncate text-[0.8125rem] text-ash">{p.email}</span>}
                      </span>
                      {p.access === "Shared" ? (
                        <button type="button" disabled={pending} onClick={() => start(() => unshareQuote(quoteId, p.id))} className="rounded-full px-2.5 py-1 text-[0.8125rem] text-ash hover:bg-[var(--hover-wash)] hover:text-[#dc2626]">Remove</button>
                      ) : (
                        <span className="text-[0.8125rem] text-faint">{p.access}</span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* General access */}
                <h3 className="mt-5 text-[1rem] font-semibold text-bone">General access</h3>
                <div className="mt-2 flex items-center gap-3 pb-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--hover-wash)] text-ash"><Lock className="size-4" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] font-medium text-bone">Your team on {crm}</span>
                    <span className="block text-[0.8125rem] text-ash">People with access to quotes and plans can open it with the link. Clients see it only when you send it.</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[var(--crm-line)] px-6 py-4">
                <button type="button" onClick={copy} className="crm-btn crm-btn-secondary">
                  {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
                </button>
                {picked.length ? (
                  <button type="button" disabled={pending} onClick={send} className="crm-btn crm-btn-primary disabled:opacity-50">{pending ? "Sharing…" : "Send"}</button>
                ) : (
                  <button type="button" onClick={() => setOpen(false)} className="crm-btn crm-btn-primary">Done</button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
