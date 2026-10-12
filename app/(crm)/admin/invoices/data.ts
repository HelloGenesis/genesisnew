import "server-only";

import { getPrisma } from "@/lib/db";
import type { Viewer } from "@/lib/crm/session";
import { accountScope } from "@/lib/crm/scope";

/** The clients an invoice can be filled from: this person's, or all for super admins. */
export async function invoiceAccounts(viewer: Viewer) {
  const rows = await getPrisma().account.findMany({ where: { ...accountScope(viewer), kind: { in: ["BRAND", "AGENCY"] } }, orderBy: { name: "asc" }, take: 500, select: { id: true, name: true, legalName: true, email: true, gstin: true, billingAddress: true, state: true } });
  return rows.map((a) => ({ id: a.id, name: a.name, legalName: a.legalName, email: a.email, gstin: a.gstin, address: a.billingAddress, state: a.state }));
}

export const DEFAULT_TERMS = [
  "Payment due within 7 days of the invoice date.",
  "Please quote the invoice number with your payment.",
  "Bank: (add Genesis's account name, number, IFSC and branch here, or pay by the link in the email).",
].join("\n");
