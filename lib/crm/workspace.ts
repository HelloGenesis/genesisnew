import "server-only";

import { cookies } from "next/headers";

import { getPrisma } from "@/lib/db";

/**
 * AGENCY CRMS (Genesis, 22 Oct 2026: "CRM access for agencies… a separate
 * dashboard where our data should not be merged with theirs, but we can see
 * their data"). An agency account with `crmWorkspace` has its own CRM: its
 * team (users with `workspaceId`) sees only records tagged with it (lib/db
 * keeps them apart), makes its own quotes, plans and invoices under its own
 * name and GST details, and keeps its own influencer list. Genesis's owners
 * can switch into any agency's CRM to see it; Genesis's own lists never
 * include an agency's records.
 */

export type WorkspaceProfile = {
  name: string;
  legalName?: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  payee?: string;
  bank?: string;
  account?: string;
  ifsc?: string;
  /** Put before every invoice number: "ABC/" → ABC/1, ABC/2… */
  invoicePrefix?: string;
  logoUrl?: string;
};

/** Which agency CRM a Genesis owner is looking at (the switcher); a cookie, read only for owners. */
export const VIEWING_COOKIE = "gm_ws";

export async function viewingCookie() {
  return (await cookies()).get(VIEWING_COOKIE)?.value ?? null;
}

/** The agency CRM a person works in (null: Genesis's). */
export async function workspaceOfUser(userId: string) {
  return (await getPrisma().user.findUnique({ where: { id: userId }, select: { workspaceId: true } }))?.workspaceId ?? null;
}

export async function workspaces() {
  return getPrisma().account.findMany({ where: { crmWorkspace: true, workspaceId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

/** An agency CRM's details for its documents; its account's own fields fill the gaps. */
export async function workspaceProfile(id: string): Promise<WorkspaceProfile | null> {
  const a = await getPrisma().account.findFirst({ where: { id, crmWorkspace: true, workspaceId: null }, select: { name: true, legalName: true, gstin: true, billingAddress: true, phone: true, email: true, website: true, crmProfile: true } });
  if (!a) return null;
  const p = (a.crmProfile ?? {}) as Partial<WorkspaceProfile>;
  return {
    name: p.name || a.name,
    legalName: p.legalName || a.legalName || a.name,
    gstin: p.gstin || a.gstin || undefined,
    address: p.address || a.billingAddress || undefined,
    phone: p.phone || a.phone || undefined,
    email: p.email || a.email || undefined,
    website: p.website || a.website || undefined,
    payee: p.payee || p.legalName || a.legalName || a.name,
    bank: p.bank,
    account: p.account,
    ifsc: p.ifsc,
    invoicePrefix: p.invoicePrefix,
    logoUrl: p.logoUrl,
  };
}

/** An agency CRM's emails to its clients end with the agency's name and take replies at its address. */
export function agencyEmail(p: WorkspaceProfile | null): { signOff?: string; replyTo?: string | null } {
  if (!p) return {};
  return { signOff: `\n\n— ${p.name}${p.email || p.website ? `\n${[p.email, p.website].filter(Boolean).join(" · ")}` : ""}`, replyTo: p.email ?? null };
}
