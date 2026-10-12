"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { shareByEmail } from "@/app/(crm)/admin/actions/outreach";

/**
 * SEND IT FROM HERE (Genesis, 12 Oct 2026: "share it over WhatsApp or email
 * right from there"). The text is editable; WhatsApp opens with it written,
 * email sends it from the CRM with replies to you.
 */
export function ShareBox({ subject, text: initial, phone }: { subject: string; text: string; phone?: string | null }) {
  const [text, setText] = useState(initial);
  const [to, setTo] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  const wa = `https://wa.me/${digits.length >= 11 ? digits : ""}?text=${encodeURIComponent(text)}`;
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="crm-input !min-h-40 text-[0.875rem]" />
      <div className="flex flex-wrap items-center gap-2">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm"><MessageCircle className="size-4" aria-hidden /> WhatsApp</a>
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email(s)" className="crm-input !min-h-8 min-w-[12rem] flex-1 !px-2 text-[0.8125rem]" />
        <button type="button" disabled={pending || !to} onClick={() => start(async () => setNote((await shareByEmail(to, subject, text)).message ?? null))} className="crm-btn crm-btn-secondary crm-btn-sm disabled:opacity-40"><Mail className="size-4" aria-hidden /> Email</button>
      </div>
      {note && <p className="text-[0.8125rem] text-ash" role="status">{note}</p>}
    </div>
  );
}
