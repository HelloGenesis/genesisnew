"use client";

import { Check, ExternalLink, Plug, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { changeApp, connectApp } from "@/app/(crm)/admin/actions/connectors";

export type BuiltIn = { key: string; name: string; what: string; on: boolean; href?: string };
export type Added = { id: string; name: string; url: string; enabled: boolean; hasToken: boolean };

/*
 * APPS TO CONNECT (Genesis, 27 Oct 2026). Each has a remote MCP link; most
 * want an access token from the app as well. Zapier is the way to reach
 * almost anything else (WhatsApp, Slack, HubSpot, Meta…) with one link.
 * Check each link against the app's own MCP page when connecting.
 */
const APPS = [
  { name: "Canva", what: "Designs, brand kits and exports", url: "https://mcp.canva.com/mcp", tint: "#7c3aed" },
  { name: "Zapier", what: "8,000+ apps: WhatsApp, Slack, HubSpot, Meta…", url: "", hint: "Paste your personal Zapier MCP link", tint: "#ff4f00" },
  { name: "Notion", what: "Docs, briefs and databases", url: "https://mcp.notion.com/mcp", tint: "#a3a3a3" },
  { name: "Linear", what: "Issues and projects", url: "https://mcp.linear.app/mcp", tint: "#5e6ad2" },
  { name: "Asana", what: "Tasks and projects", url: "https://mcp.asana.com/sse", tint: "#f06a6a" },
  { name: "Atlassian", what: "Jira and Confluence", url: "https://mcp.atlassian.com/v1/sse", tint: "#2684ff" },
  { name: "Stripe", what: "Payments and customers", url: "https://mcp.stripe.com", tint: "#635bff" },
  { name: "Any app", what: "Any service with an MCP link", url: "", hint: "The app's MCP server link", tint: "#ffc516" },
];

/* AI models: some run in the CRM already; the rest come with Genesis AI Lab. */
const MODELS = [
  { key: "claude", name: "Claude", what: "Chat, quotes, plans and the whole CRM" },
  { key: "higgsfield", name: "Higgsfield", what: "Images and video" },
  { key: "openai", name: "OpenAI images", what: "Coming to Genesis AI Lab" },
  { key: "elevenlabs", name: "ElevenLabs voice", what: "Coming to Genesis AI Lab" },
];

const Dot = ({ on }: { on: boolean }) => <span aria-hidden className={`size-2 shrink-0 rounded-full ${on ? "bg-[#22c55e]" : "bg-[var(--crm-line)]"}`} />;
const Letter = ({ name, tint }: { name: string; tint: string }) => (
  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl text-[0.875rem] font-semibold text-white" style={{ background: `linear-gradient(135deg, ${tint}, ${tint}99)` }}>{name[0]}</span>
);

export function ConnectorsDialog({ builtIns, added, canManage, onClose }: { builtIns: BuiltIn[]; added: Added[]; canManage: boolean; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ name: string; url: string; token: string; hint?: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const builtIn = (key: string) => builtIns.find((b) => b.key === key);
  const connected = [...builtIns.filter((b) => b.on && b.key !== "higgsfield" && b.key !== "claude"), ...added];

  const save = () =>
    start(async () => {
      if (!form) return;
      const r = await connectApp({ name: form.name, url: form.url, token: form.token });
      setNote(r.message);
      if (r.ok) {
        setForm(null);
        router.refresh();
      }
    });
  const change = (id: string, c: { enabled?: boolean; remove?: boolean }) =>
    start(async () => {
      const r = await changeApp(id, c);
      if (!r.ok) setNote(r.message ?? "Not changed.");
      router.refresh();
    });

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal aria-label="Connectors" onClick={(e) => e.stopPropagation()} className="flex max-h-[85svh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--crm-panel)] shadow-[var(--shadow-float)]">
        <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-5 py-4">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--hover-wash)] text-bone"><Plug className="size-4" aria-hidden /></span>
          <div className="flex-1">
            <h2 className="text-[1.0625rem] font-semibold text-bone">Connectors</h2>
            <p className="text-[0.8125rem] text-ash">Apps and AI models the assistant can work with.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-ash hover:bg-[var(--hover-wash)] hover:text-bone"><X className="size-4" aria-hidden /></button>
        </div>

        <div className="space-y-6 overflow-y-auto px-5 py-5" data-lenis-prevent>
          {note && <p className="crm-notice text-[0.8125rem]" role="status">{note}</p>}

          <section>
            <p className="mb-2 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Connected</p>
            <ul className="divide-y divide-[var(--glass-border)] rounded-2xl border border-[var(--glass-border)]">
              {builtIns.filter((b) => b.key !== "higgsfield" && b.key !== "claude").map((b) => (
                <li key={b.key} className="flex items-center gap-3 px-4 py-3">
                  <Dot on={b.on} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] text-bone">{b.name}</span>
                    <span className="block text-[0.75rem] text-ash">{b.what}</span>
                  </span>
                  {!b.on && b.href && <Link href={b.href} className="crm-btn crm-btn-secondary crm-btn-sm">Connect</Link>}
                  {b.on && <span className="text-[0.75rem] text-[#22c55e]">On</span>}
                </li>
              ))}
              {added.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <Dot on={c.enabled} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] text-bone">{c.name}</span>
                    <span className="block truncate text-[0.75rem] text-ash">{new URL(c.url).host}{c.hasToken ? " · with token" : ""}</span>
                  </span>
                  {canManage && (
                    <>
                      <button type="button" disabled={pending} onClick={() => change(c.id, { enabled: !c.enabled })} className="crm-btn crm-btn-secondary crm-btn-sm">{c.enabled ? "Pause" : "Turn on"}</button>
                      <button type="button" disabled={pending} onClick={() => window.confirm(`Disconnect ${c.name}?`) && change(c.id, { remove: true })} className="crm-btn crm-btn-secondary crm-btn-sm hover:!text-[#dc2626]">Disconnect</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {connected.length === 0 && <p className="mt-2 text-[0.8125rem] text-ash">Nothing connected yet.</p>}
          </section>

          <section>
            <p className="mb-2 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">Add an app</p>
            {form ? (
              <div className="space-y-3 rounded-2xl border border-[var(--glass-border)] p-4">
                <label className="block"><span className="crm-label">Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="crm-input" /></label>
                <label className="block"><span className="crm-label">MCP link</span><input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder={form.hint ?? "https://…"} className="crm-input" inputMode="url" /></label>
                <label className="block"><span className="crm-label">Access token (if the app gives you one)</span><input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} type="password" autoComplete="off" className="crm-input" /></label>
                <p className="text-[0.75rem] text-faint">The link and token come from the app&apos;s MCP or developer settings. The token is stored encrypted and only used by this CRM&apos;s assistant.</p>
                <div className="flex gap-2">
                  <button type="button" disabled={pending || !form.url.trim()} onClick={save} className="crm-btn crm-btn-primary crm-btn-sm"><Check className="size-4" aria-hidden /> Connect</button>
                  <button type="button" onClick={() => setForm(null)} className="crm-btn crm-btn-secondary crm-btn-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {APPS.map((a) => {
                  const has = added.some((c) => c.name.toLowerCase() === a.name.toLowerCase());
                  return (
                    <li key={a.name}>
                      <button
                        type="button"
                        disabled={!canManage || has}
                        onClick={() => setForm({ name: a.name === "Any app" ? "" : a.name, url: a.url, token: "", hint: a.hint })}
                        className="flex w-full items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-3 text-left transition-colors hover:border-[#ffc516]/60 disabled:cursor-default disabled:hover:border-[var(--glass-border)]"
                      >
                        <Letter name={a.name} tint={a.tint} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.9375rem] text-bone">{a.name}</span>
                          <span className="block truncate text-[0.75rem] text-ash">{a.what}</span>
                        </span>
                        {has ? <span className="text-[0.75rem] text-[#22c55e]">Connected</span> : canManage ? <Plus className="size-4 text-ash" aria-hidden /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!canManage && <p className="mt-2 text-[0.75rem] text-faint">Ask an owner to connect an app.</p>}
          </section>

          <section>
            <p className="mb-2 text-[0.6875rem] uppercase tracking-[0.14em] text-faint">AI models</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {MODELS.map((m) => {
                const on = builtIn(m.key)?.on ?? false;
                return (
                  <li key={m.key} className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-3">
                    <Dot on={on} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] text-bone">{m.name}</span>
                      <span className="block truncate text-[0.75rem] text-ash">{on ? (m.key === "claude" ? m.what : "Connected · " + m.what) : m.key === "higgsfield" ? "Add its key to connect" : m.what}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[0.75rem] text-ash hover:text-bone">What&apos;s an MCP link? <ExternalLink className="size-3" aria-hidden /></a>
          </section>
        </div>
      </div>
    </div>
  );
}
