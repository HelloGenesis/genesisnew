"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { emailCreator, markReachout, saveOutreachTemplate } from "@/app/(crm)/admin/actions/outreach";
import { fillOutreach, type OutreachFields, whatsappLink } from "@/lib/crm/outreach";

type Row = { id: string; name: string; handle: string; phone: string | null; email: string | null; reachout: string | null };

/**
 * "GET COSTING" (Genesis, 12 Oct 2026). The message is edited here — the
 * campaign, audience, cities, deliverables, who's sending — and saved as the
 * template for next time. Each creator gets it with their own first name:
 * WhatsApp opens with it ready to send, or email sends it from the CRM.
 */
export function OutreachPanel({ rows, template: initialTemplate, fields: initialFields }: { rows: Row[]; template: string; fields: OutreachFields }) {
  const [template, setTemplate] = useState(initialTemplate);
  const [f, setF] = useState(initialFields);
  const [status, setStatus] = useState<Record<string, string | null>>(Object.fromEntries(rows.map((r) => [r.id, r.reachout])));
  const [emails, setEmails] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.id, r.email ?? ""])));
  const [preview, setPreview] = useState(rows[0]?.id ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const subject = `Collaboration: ${f.campaign}`;
  const messageFor = (r: Row) => fillOutreach(template, f, r.name);
  const shown = rows.find((r) => r.id === preview) ?? rows[0];

  const whatsapp = (r: Row) => {
    window.open(whatsappLink(r.phone, messageFor(r)), "_blank", "noopener");
    setStatus((s) => ({ ...s, [r.id]: "WhatsApp" }));
    start(() => void markReachout(r.id, "WhatsApp"));
  };
  const email = (r: Row) =>
    start(async () => {
      const result = await emailCreator(r.id, emails[r.id] ?? "", subject, messageFor(r));
      setNote(result.message ?? null);
      if (result.ok) setStatus((s) => ({ ...s, [r.id]: "Email" }));
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label><span className="crm-label">Campaign</span><input value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} className="crm-input" placeholder="life insurance brand campaign" /></label>
        <label><span className="crm-label">Audience</span><input value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} className="crm-input" placeholder="women" /></label>
        <label><span className="crm-label">Cities</span><input value={f.cities} onChange={(e) => setF({ ...f, cities: e.target.value })} className="crm-input" placeholder="Indore, Vijayawada and Dehradun" /></label>
        <label><span className="crm-label">Deliverables (one a line)</span><textarea value={f.deliverables.join("\n")} onChange={(e) => setF({ ...f, deliverables: e.target.value.split("\n") })} className="crm-input !min-h-24" /></label>
        <label><span className="crm-label">Sender</span><input value={f.sender} onChange={(e) => setF({ ...f, sender: e.target.value })} className="crm-input" /></label>
        <label><span className="crm-label">Designation</span><input value={f.senderTitle} onChange={(e) => setF({ ...f, senderTitle: e.target.value })} className="crm-input" /></label>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="block">
          <span className="crm-label">Template · {"{first_name} {campaign} {audience} {cities} {deliverables} {sender} {sender_title}"}</span>
          <textarea value={template} onChange={(e) => setTemplate(e.target.value)} className="crm-input !min-h-64 font-mono text-[0.8125rem]" />
          <span className="mt-2 flex items-center gap-3">
            <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => start(async () => { await saveOutreachTemplate(template); setNote("Template saved for everyone."); })}>Save as template</button>
            {note && <span className="text-[0.8125rem] text-ash" role="status">{note}</span>}
          </span>
        </label>
        <div>
          <span className="crm-label flex items-center justify-between gap-2">
            Preview for
            <select value={preview} onChange={(e) => setPreview(e.target.value)} className="crm-input !min-h-8 w-auto !py-1 text-[0.8125rem]">{rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          </span>
          <pre className="mt-1 min-h-64 whitespace-pre-wrap rounded-xl border border-[var(--glass-border)] bg-[var(--hover-wash)] p-3 font-sans text-[0.875rem] text-bone">{shown ? messageFor(shown) : ""}</pre>
        </div>
      </div>
      {/* The creators in their own scrolling box, headings pinned (Genesis, 13 Oct 2026: "end this box here and add a scroller"). */}
      <div className="max-h-[30rem] overflow-auto rounded-xl border border-[var(--glass-border)]" data-lenis-prevent>
        <table className="crm-table !min-w-[760px] text-[0.875rem] [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-[var(--surface-panel)]">
          <thead><tr><th>Creator</th><th>WhatsApp</th><th>Email</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="text-bone">{r.name}<span className="block text-[0.75rem] text-ash">@{r.handle}{r.phone ? ` · ${r.phone}` : ""}</span></td>
                <td>
                  <button type="button" onClick={() => whatsapp(r)} className="crm-btn crm-btn-secondary crm-btn-sm"><MessageCircle className="size-4" aria-hidden /> Get costing</button>
                  {!r.phone && <span className="block text-[0.6875rem] text-faint">No number: pick the chat in WhatsApp</span>}
                </td>
                <td>
                  <span className="flex items-center gap-1.5">
                    <input value={emails[r.id] ?? ""} onChange={(e) => setEmails((m) => ({ ...m, [r.id]: e.target.value }))} placeholder="email" className="crm-input !min-h-8 w-48 !px-2 text-[0.8125rem]" />
                    <button type="button" disabled={pending || !emails[r.id]} onClick={() => email(r)} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-40"><Mail className="size-4" aria-hidden /> Send</button>
                  </span>
                </td>
                <td className="text-ash">{status[r.id] ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[0.75rem] text-faint">WhatsApp opens with the message written; tap Send there. Email goes from the CRM with replies to you.</p>
    </div>
  );
}
