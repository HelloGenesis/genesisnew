"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { saveInvoice } from "@/app/(crm)/admin/actions/invoices";

export type InvoiceDraft = {
  id?: string;
  accountId?: string | null;
  quoteId?: string | null;
  billToName: string;
  billToEmail?: string | null;
  billToGstin?: string | null;
  billToAddress?: string | null;
  placeOfSupply: string;
  issueDate: string;
  dueDate?: string | null;
  discount: number;
  notes?: string | null;
  terms?: string | null;
  quotationRef?: string | null;
  quotationDate?: string | null;
  poNumber?: string | null;
  poDate?: string | null;
  executionDate?: string | null;
  paymentTermDays?: number;
  reference?: string | null;
  billToPan?: string | null;
  lines: { description: string; sac: string; qty: number; uom?: string; unit: number }[];
};

const inr = (r: number) => `₹${r.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The invoice form: who it's billed to, the lines with their SAC codes, and live CGST + SGST (or IGST) totals. */
export function InvoiceBuilder({ initial, states, accounts }: { initial: InvoiceDraft; states: string[]; accounts: { id: string; name: string; legalName: string | null; email: string | null; gstin: string | null; address: string | null; state: string | null }[] }) {
  const [v, setV] = useState<InvoiceDraft>(initial);
  const [state, action, pending] = useActionState(saveInvoice, null);
  const set = <K extends keyof InvoiceDraft>(k: K, value: InvoiceDraft[K]) => setV((x) => ({ ...x, [k]: value }));
  const setLine = (i: number, patch: Partial<InvoiceDraft["lines"][number]>) => setV((x) => ({ ...x, lines: x.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const fromGstin = v.billToGstin && /^\d{2}/.test(v.billToGstin) ? v.billToGstin.slice(0, 2) : null;
  const interstate = fromGstin ? fromGstin !== "27" : v.placeOfSupply !== "Maharashtra";
  const t = useMemo(() => {
    const subtotal = v.lines.reduce((s, l) => s + l.qty * l.unit, 0);
    const taxable = Math.max(0, subtotal - v.discount);
    const tax = Math.round(taxable * 18) / 100;
    const half = Math.round(tax * 50) / 100;
    return { subtotal, taxable, tax, cgst: interstate ? 0 : half, sgst: interstate ? 0 : tax - half, total: taxable + tax };
  }, [v, interstate]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(v)} />
      <section className="crm-card crm-pad space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-sans font-semibold text-[1.25rem] text-bone">Billed to</h2>
          {accounts.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                const a = accounts.find((x) => x.id === e.target.value);
                if (a) setV((x) => ({ ...x, accountId: a.id, billToName: a.legalName ?? a.name, billToEmail: a.email ?? x.billToEmail, billToGstin: a.gstin ?? x.billToGstin, billToAddress: a.address ?? x.billToAddress, placeOfSupply: a.state ?? x.placeOfSupply }));
              }}
              className="crm-input w-auto max-w-[18rem]"
              aria-label="Fill from a client"
            >
              <option value="">Fill from a client…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="lg:col-span-2"><span className="crm-label">Name (as registered) *</span><input value={v.billToName} onChange={(e) => set("billToName", e.target.value)} required className="crm-input" /></label>
          <label><span className="crm-label">Email</span><input type="email" value={v.billToEmail ?? ""} onChange={(e) => set("billToEmail", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">GSTIN</span><input value={v.billToGstin ?? ""} onChange={(e) => set("billToGstin", e.target.value.toUpperCase())} className="crm-input uppercase" placeholder="27ABCDE1234F1Z5" /></label>
          <label><span className="crm-label">PAN</span><input value={v.billToPan ?? ""} onChange={(e) => set("billToPan", e.target.value.toUpperCase())} className="crm-input uppercase" placeholder="From the GSTIN when blank" /></label>
          <label className="lg:col-span-2"><span className="crm-label">Billing address</span><input value={v.billToAddress ?? ""} onChange={(e) => set("billToAddress", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">Place of supply</span>
            <select value={v.placeOfSupply} onChange={(e) => set("placeOfSupply", e.target.value)} className="crm-input">{states.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label><span className="crm-label">Date</span><input type="date" value={v.issueDate} onChange={(e) => set("issueDate", e.target.value)} className="crm-input" /></label>
            <label><span className="crm-label">Due</span><input type="date" value={v.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} className="crm-input" /></label>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className="crm-label">Quotation no.</span><input value={v.quotationRef ?? ""} onChange={(e) => set("quotationRef", e.target.value)} className="crm-input" placeholder="E-Mail, or #0000041" /></label>
          <label><span className="crm-label">Quotation date</span><input type="date" value={v.quotationDate ?? ""} onChange={(e) => set("quotationDate", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">PO no.</span><input value={v.poNumber ?? ""} onChange={(e) => set("poNumber", e.target.value)} className="crm-input" placeholder="E-Mail" /></label>
          <label><span className="crm-label">PO date</span><input type="date" value={v.poDate ?? ""} onChange={(e) => set("poDate", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">Date of execution</span><input type="date" value={v.executionDate ?? ""} onChange={(e) => set("executionDate", e.target.value)} className="crm-input" /></label>
          <label><span className="crm-label">Payment term (days)</span><input type="number" min={0} value={v.paymentTermDays ?? 15} onChange={(e) => set("paymentTermDays", Number(e.target.value) || 0)} className="crm-input" /></label>
          <label className="lg:col-span-2"><span className="crm-label">Ref</span><input value={v.reference ?? ""} onChange={(e) => set("reference", e.target.value)} className="crm-input" /></label>
        </div>
        <p className="text-[0.8125rem] text-faint">{interstate ? "Outside Maharashtra: IGST 18%." : "Within Maharashtra: CGST 9% + SGST 9%."} The GSTIN&apos;s first two digits decide it when one is given.</p>
      </section>

      <section className="crm-card crm-pad space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="font-sans font-semibold text-[1.25rem] text-bone">Lines</h2>
          <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setV((x) => ({ ...x, lines: [...x.lines, { description: "", sac: "996211", qty: 1, uom: "NOS", unit: 0 }] }))}><Plus className="size-4" /> Add line</button>
        </div>
        {v.lines.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_6rem_4.5rem_4.5rem_8rem_8rem_auto] sm:items-end">
            <label><span className="crm-label">Description</span><input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} required className="crm-input" placeholder="UGC content production — 10 videos" /></label>
            <label><span className="crm-label">SAC</span><input value={l.sac} onChange={(e) => setLine(i, { sac: e.target.value })} className="crm-input" /></label>
            <label><span className="crm-label">Qty</span><input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, Number(e.target.value) || 1) })} className="crm-input" /></label>
            <label><span className="crm-label">Unit</span><input value={l.uom ?? "NOS"} onChange={(e) => setLine(i, { uom: e.target.value.toUpperCase() })} className="crm-input" /></label>
            <label><span className="crm-label">Rate (₹)</span><input type="number" min={0} step="0.01" value={l.unit} onChange={(e) => setLine(i, { unit: Number(e.target.value) || 0 })} className="crm-input" /></label>
            <p className="pb-2.5 text-right tabular-nums text-bone">{inr(l.qty * l.unit)}</p>
            <button type="button" aria-label="Remove line" onClick={() => setV((x) => ({ ...x, lines: x.lines.filter((_, j) => j !== i) }))} className="pb-2.5 text-ash hover:text-[#dc2626]"><Trash2 className="size-4" /></button>
          </div>
        ))}
        <p className="text-[0.75rem] text-faint">HSN/SAC as on your invoices (996211); others: 998361 advertising, 999612 video production, 998391 design.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="crm-card crm-pad space-y-3">
          <label className="block"><span className="crm-label">Notes</span><textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="crm-input !min-h-20" /></label>
          <label className="block"><span className="crm-label">Terms & bank details</span><textarea value={v.terms ?? ""} onChange={(e) => set("terms", e.target.value)} className="crm-input !min-h-28" /></label>
        </section>
        <section className="crm-card crm-pad space-y-3 self-start">
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[0.9375rem]">
            <dt className="text-ash">Subtotal</dt><dd className="tabular-nums">{inr(t.subtotal)}</dd>
            <dt className="text-ash">Discount (₹)</dt><dd><input type="number" min={0} value={v.discount} onChange={(e) => set("discount", Number(e.target.value) || 0)} className="crm-input !min-h-8 w-32 text-right" /></dd>
            <dt className="text-ash">Taxable value</dt><dd className="tabular-nums">{inr(t.taxable)}</dd>
            {interstate ? (
              <><dt className="text-ash">IGST 18%</dt><dd className="tabular-nums">{inr(t.tax)}</dd></>
            ) : (
              <><dt className="text-ash">CGST 9%</dt><dd className="tabular-nums">{inr(t.cgst)}</dd><dt className="text-ash">SGST 9%</dt><dd className="tabular-nums">{inr(t.sgst)}</dd></>
            )}
            <dt className="border-t border-[var(--glass-border)] pt-2 font-semibold text-bone">Total</dt>
            <dd className="border-t border-[var(--glass-border)] pt-2 text-[1.25rem] font-semibold tabular-nums text-bone">{inr(t.total)}</dd>
          </dl>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="crm-btn crm-btn-primary" disabled={pending}>{pending ? "Saving…" : v.id ? "Save changes" : "Create invoice"}</button>
            {state?.message && <span className={`text-[0.8125rem] ${state.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} role={state.ok ? "status" : "alert"}>{state.message}</span>}
          </div>
        </section>
      </div>
    </form>
  );
}
