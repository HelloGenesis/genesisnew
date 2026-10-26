"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { emailCreator, markReachout, saveOutreachTemplate, saveReachContact } from "@/app/(crm)/admin/actions/outreach";
import { fillOutreach, type OutreachFields, whatsappLink } from "@/lib/crm/outreach";
import { isRecent, type LastReach, reachLine, reachOptions } from "@/lib/crm/reachout-status";

/* `last`: the creator's latest reach-out from any plan; `canEdit`: may see and change their contact. */
type Row = { id: string; name: string; handle: string; phone: string | null; email: string | null; reachout: string | null; last?: LastReach | null; canEdit?: boolean };

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
  const [phones, setPhones] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.id, r.phone ?? ""])));
  const [saved, setSaved] = useState<Record<string, { phone: string; email: string }>>(Object.fromEntries(rows.map((r) => [r.id, { phone: r.phone ?? "", email: r.email ?? "" }])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(rows[0]?.id ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const subject = `Collaboration: ${f.campaign}`;
  const messageFor = (r: Row) => fillOutreach(template, f, r.name);
  const shown = rows.find((r) => r.id === preview) ?? rows[0];

  /* NOT THE SAME INFLUENCER AGAIN AND AGAIN (Genesis, 27 Oct 2026): asks first when they were reached in the last 30 days, from any plan. */
  const okToContact = (r: Row) => !isRecent(r.last) || window.confirm(`${r.name} was already contacted: ${reachLine(r.last)}. Contact again?`);
  /* The number and email, saved to the plan and the influencer database when you leave the box. */
  const saveContact = (r: Row) => {
    const next = { phone: (phones[r.id] ?? "").trim(), email: (emails[r.id] ?? "").trim() };
    const was = saved[r.id];
    if (was && was.phone === next.phone && was.email === next.email) return;
    start(async () => {
      const result = await saveReachContact(r.id, next.phone, next.email);
      if (!result.ok) return setErrors((e) => ({ ...e, [r.id]: result.message ?? "Not saved." }));
      setErrors((e) => ({ ...e, [r.id]: "" }));
      setSaved((s) => ({ ...s, [r.id]: next }));
    });
  };
  const setStatusOf = (r: Row, value: string) => {
    setStatus((s) => ({ ...s, [r.id]: value || null }));
    start(() => void markReachout(r.id, value));
  };
  const whatsapp = (r: Row) => {
    if (!okToContact(r)) return;
    window.open(whatsappLink(phones[r.id]?.trim() || r.phone, messageFor(r)), "_blank", "noopener");
    setStatus((s) => ({ ...s, [r.id]: "WhatsApp" }));
    start(() => void markReachout(r.id, "WhatsApp"));
  };
  const email = (r: Row) => {
    if (!okToContact(r)) return;
    start(async () => {
      const result = await emailCreator(r.id, emails[r.id] ?? "", subject, messageFor(r));
      setNote(result.message ?? null);
      if (result.ok) setStatus((s) => ({ ...s, [r.id]: "Email" }));
    });
  };

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
        <table className="crm-table !min-w-[980px] text-[0.875rem] [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-[var(--surface-panel)]">
          <thead><tr><th>Creator</th><th>WhatsApp</th><th>Email</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="text-bone">
                  {r.name}
                  <span className="block text-[0.75rem] text-ash">@{r.handle}</span>
                  {/* The latest reach-out from any plan; amber when it was in the last 30 days. */}
                  {r.last && <span className={`mt-0.5 block text-[0.6875rem] ${isRecent(r.last) ? "text-[#f59e0b]" : "text-faint"}`}>Last: {reachLine(r.last)}</span>}
                  {errors[r.id] && <span role="alert" className="block text-[0.6875rem] text-[#dc2626]">{errors[r.id]}</span>}
                </td>
                <td>
                  <span className="flex items-center gap-1.5">
                    <input value={phones[r.id] ?? ""} disabled={r.canEdit === false} onChange={(e) => setPhones((m) => ({ ...m, [r.id]: e.target.value }))} onBlur={() => saveContact(r)} placeholder="Number" inputMode="tel" className="crm-input !min-h-8 w-36 !px-2 text-[0.8125rem]" aria-label={`${r.name}'s number`} />
                    <button type="button" onClick={() => whatsapp(r)} className="crm-btn crm-btn-secondary crm-btn-sm"><MessageCircle className="size-4" aria-hidden /> Get costing</button>
                  </span>
                  {!phones[r.id]?.trim() && <span className="block text-[0.6875rem] text-faint">No number: pick the chat in WhatsApp</span>}
                </td>
                <td>
                  <span className="flex items-center gap-1.5">
                    <input value={emails[r.id] ?? ""} disabled={r.canEdit === false} onChange={(e) => setEmails((m) => ({ ...m, [r.id]: e.target.value }))} onBlur={() => saveContact(r)} placeholder="Email" inputMode="email" className="crm-input !min-h-8 w-48 !px-2 text-[0.8125rem]" aria-label={`${r.name}'s email`} />
                    <button type="button" disabled={pending || !emails[r.id]} onClick={() => email(r)} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-40"><Mail className="size-4" aria-hidden /> Send</button>
                  </span>
                </td>
                <td>
                  {/* One list of statuses everywhere (lib/crm/reachout-status); set by hand for reach-outs done outside the CRM. */}
                  <select value={status[r.id] ?? ""} onChange={(e) => setStatusOf(r, e.target.value)} className="crm-input !min-h-8 w-40 !px-2 text-[0.8125rem]" aria-label={`${r.name}'s reach-out status`}>
                    {reachOptions(status[r.id]).map((o) => <option key={o} value={o}>{o || "Not contacted"}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[0.75rem] text-faint">WhatsApp opens with the message written; tap Send there. Email goes from the CRM with replies to you. Numbers and emails typed here are saved to the influencer database and every plan they&apos;re on. Reached someone outside the CRM? Set their status: it&apos;s logged with your name and date.</p>
    </div>
  );
}
