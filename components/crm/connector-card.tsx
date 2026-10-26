"use client";

import { Copy } from "lucide-react";
import { useState, useTransition } from "react";

import { createConnectorLink, revokeConnectorLink } from "@/app/(crm)/admin/actions/connector";

type Link = { id: string; label: string; createdAt: string; lastUsedAt?: string };
const when = (d?: string) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "never");

/**
 * CHATGPT / CLAUDE (Genesis, 27 Oct 2026): your own secret link for the CRM's
 * connector (app/api/mcp). Shown once; switch it off here any time.
 */
export function ConnectorCard({ links }: { links: Link[] }) {
  const [label, setLabel] = useState("ChatGPT");
  const [made, setMade] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4 text-[0.875rem]">
      <p className="text-ash">
        Use the CRM from ChatGPT or Claude: drop in screenshots, Excel sheets or agency roster PDFs and ask it to make or update an influencer plan, find creators, add numbers and rates, or log reach-outs. It works with your account and permissions; it can add and update but not delete, and never messages anyone.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="crm-label">Name it</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="crm-input w-48" placeholder="ChatGPT" />
        </label>
        <button type="button" disabled={pending} onClick={() => start(async () => { const r = await createConnectorLink(label); setMade(r.url); setCopied(false); })} className="crm-btn crm-btn-primary crm-btn-sm">
          Make my connector link
        </button>
      </div>
      {made && (
        <div className="space-y-2 rounded-xl border border-[#ffc516] p-3">
          <p className="text-bone">Your link (shown once; keep it private, like a password):</p>
          <p className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-[var(--hover-wash)] px-2 py-1 text-[0.8125rem]">{made}</code>
            <button type="button" onClick={() => void navigator.clipboard.writeText(made).then(() => setCopied(true))} className="crm-btn crm-btn-secondary crm-btn-sm"><Copy className="size-4" aria-hidden /> {copied ? "Copied" : "Copy"}</button>
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-ash">
            <li><b className="text-bone">ChatGPT</b>: Settings → Apps &amp; Connectors → Advanced → turn on Developer mode; then Create (connector), name it “Genesis CRM”, paste the link as the MCP server URL, authentication “No authentication”, and create. In a chat, pick it from the + menu.</li>
            <li><b className="text-bone">Claude</b>: Settings → Connectors → Add custom connector, paste the link.</li>
            <li>Then ask, e.g. “Make an influencer plan for Sun Pharma from these screenshots” or “Add this agency roster PDF to the database”.</li>
          </ol>
        </div>
      )}
      {links.length > 0 && (
        <ul className="divide-y divide-[var(--glass-border)] rounded-xl border border-[var(--glass-border)]">
          {links.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span><span className="text-bone">{l.label}</span> <span className="text-[0.8125rem] text-ash">· made {when(l.createdAt)} · last used {when(l.lastUsedAt)}</span></span>
              <form action={revokeConnectorLink}>
                <input type="hidden" name="id" value={l.id} />
                <button className="text-[0.8125rem] text-ash hover:text-[#dc2626]">Switch off</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
