import "server-only";

import { getPrisma } from "@/lib/db";
import type { Viewer } from "@/lib/crm/session";
import { accountScope, invoiceScope, quoteScope } from "@/lib/crm/scope";

/** The clients an invoice can be filled from: this person's, or all for super admins. */
export async function invoiceAccounts(viewer: Viewer) {
  const rows = await getPrisma().account.findMany({ where: { ...accountScope(viewer), kind: { in: ["BRAND", "AGENCY"] } }, orderBy: { name: "asc" }, take: 500, select: { id: true, name: true, legalName: true, email: true, gstin: true, billingAddress: true, state: true } });
  return rows.map((a) => ({ id: a.id, name: a.name, legalName: a.legalName, email: a.email, gstin: a.gstin, address: a.billingAddress, state: a.state }));
}

/*
 * WHAT'S ALREADY KNOWN ABOUT A BRAND AND ITS PEOPLE (Genesis, 16 Nov 2026: "if
 * a brand or POC is added and the data's already there, it reflects
 * automatically"): the latest billing details for each brand name from past
 * invoices, and each contact's phone and email from past invoices and quotes.
 */
export type KnownBrand = { name: string; email: string | null; gstin: string | null; pan: string | null; address: string | null; place: string; contact: string | null; phone: string | null };
export type KnownContact = { name: string; phone: string | null; email: string | null; brand: string | null };
export async function knownBillTo(viewer: Viewer): Promise<{ brands: KnownBrand[]; contacts: KnownContact[] }> {
  const prisma = getPrisma();
  const [invoices, quotes] = await Promise.all([
    prisma.invoice.findMany({ where: invoiceScope(viewer), orderBy: { createdAt: "desc" }, take: 400, select: { billToName: true, billToEmail: true, billToGstin: true, billToPan: true, billToAddress: true, placeOfSupply: true, billToContact: true, billToPhone: true } }),
    prisma.quote.findMany({ where: quoteScope(viewer), orderBy: { createdAt: "desc" }, take: 400, select: { contactName: true, contactPhone: true, contactEmail: true, company: true } }),
  ]);
  const brands = new Map<string, KnownBrand>();
  for (const i of invoices) {
    const key = i.billToName.trim().toLowerCase();
    if (key && !brands.has(key)) brands.set(key, { name: i.billToName.trim(), email: i.billToEmail, gstin: i.billToGstin, pan: i.billToPan, address: i.billToAddress, place: i.placeOfSupply, contact: i.billToContact, phone: i.billToPhone });
  }
  const contacts = new Map<string, KnownContact>();
  const add = (name: string | null, phone: string | null, email: string | null, brand: string | null) => {
    const key = (name ?? "").trim().toLowerCase();
    if (!key) return;
    const had = contacts.get(key);
    if (!had) contacts.set(key, { name: name!.trim(), phone, email, brand });
    else contacts.set(key, { ...had, phone: had.phone ?? phone, email: had.email ?? email, brand: had.brand ?? brand });
  };
  for (const i of invoices) add(i.billToContact, i.billToPhone, i.billToEmail, i.billToName);
  for (const q of quotes) add(q.contactName, q.contactPhone, q.contactEmail, q.company);
  return { brands: [...brands.values()], contacts: [...contacts.values()] };
}

export const DEFAULT_TERMS_OLD = [
  "Payment due within 7 days of the invoice date.",
  "Please quote the invoice number with your payment.",
  "Bank: (add Genesis's account name, number, IFSC and branch here, or pay by the link in the email).",
].join("\n");

/** Invoices carry Genesis's standing terms and bank details in the layout itself; this box is for anything extra. */
export const DEFAULT_TERMS = "";
