import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";

import type { Viewer } from "./session";

/**
 * WHO SEES WHOSE RECORDS (Genesis, 12 Oct 2026). Super admins (the Owner role:
 * Shivam and Tanvi) see everything, everyone's. Everyone else sees their own —
 * the leads they own, the quotes and invoices they made, the clients and
 * projects they look after, their own Gmail and Drive finds — plus any area a
 * super admin has opened to them in Staff & roles.
 *
 * Roles still decide WHICH sections a person can open (requireStaff); this
 * decides WHOSE rows they see inside them.
 */

export const AREAS: Record<string, string> = {
  leads: "All leads & briefs",
  billing: "All billing & invoices",
  clients: "All clients",
  projects: "All projects",
  inbox: "Everyone's Gmail & Drive finds",
  reports: "Reports",
};

export const isSuperAdmin = (v: Viewer) => v.roles.includes("OWNER");
export const sees = (v: Viewer, area: keyof typeof AREAS | string) => isSuperAdmin(v) || v.grants.includes(area);

/*
 * THE INFLUENCER DATABASE IS PRIVATE (Genesis, 22 Oct 2026: "influencer
 * database shouldn't be visible to all; give an option to grant access"). Set
 * per person in Staff & roles:
 *   all  — the whole database (owners always; grant "creators");
 *   own  — no access to the main database, but every creator they add, import
 *          or put on a plan is saved to it, and they see just those (grant
 *          "creators:own"; the influencer team's default);
 *   none — no influencer data.
 */
export type CreatorAccess = "all" | "own" | "none";
export const CREATOR_ACCESS: Record<CreatorAccess, string> = {
  none: "No influencer data",
  own: "Only what they add (saved to the database, can't see the rest)",
  all: "All influencer data",
};
export function creatorAccess(v: Viewer): CreatorAccess {
  if (sees(v, "creators")) return "all";
  if (v.grants.includes("creators:own")) return "own";
  if (v.grants.includes("creators:none")) return "none";
  /* Not set yet: the influencer team adds to the database without seeing it. */
  return v.roles.includes("INFLUENCER") ? "own" : "none";
}
/** May open the influencer database at all (all of it, or their own entries). */
export const seesCreators = (v: Viewer) => creatorAccess(v) !== "none";
/** The creators this person may see: everyone's, or only the ones they added. */
export const creatorScope = (v: Viewer): Prisma.CreatorWhereInput => (creatorAccess(v) === "all" ? {} : { createdById: v.id });

/** Only influencer plans (the influencer team without a sales role). */
export const plansOnly = (v: Viewer) => !isSuperAdmin(v) && !v.roles.some((r) => r === "ADMIN" || r === "SALES") && v.roles.includes("INFLUENCER");

/** For a super admin looking at the dashboard "as" someone: their id, else the viewer's. */
export const asPerson = (v: Viewer, person?: string | null) => (isSuperAdmin(v) && person ? person : v.id);

export function leadScope(v: Viewer, person?: string | null): Prisma.LeadWhereInput {
  if (!person && sees(v, "leads")) return {};
  const id = asPerson(v, person);
  return { OR: [{ ownerId: id }, { createdById: id }] };
}

export function briefScope(v: Viewer, person?: string | null): Prisma.BriefWhereInput {
  if (!person && sees(v, "leads")) return {};
  return { createdById: asPerson(v, person) };
}

/*
 * Quotes and plans are shared (Genesis, 14 Oct 2026: "once a draft is saved it
 * should be visible to all who are allowed"): everyone who can open Quotes sees
 * every quote and plan. Only the dashboard's "as someone" view narrows it.
 */
export function quoteScope(v: Viewer, person?: string | null): Prisma.QuoteWhereInput {
  /* The influencer team sees the influencer plans, everyone's; not the other quotes. */
  if (plansOnly(v)) return person ? { kind: "INFLUENCER_PLAN", createdById: asPerson(v, person) } : { kind: "INFLUENCER_PLAN" };
  if (!person) return {};
  const id = asPerson(v, person);
  return { OR: [{ createdById: id }, { lead: { ownerId: id } }] };
}

export function orderScope(v: Viewer, person?: string | null): Prisma.OrderWhereInput {
  if (!person && sees(v, "billing")) return {};
  const id = asPerson(v, person);
  return { OR: [{ createdById: id }, { quote: { createdById: id } }, { account: { managerId: id } }] };
}

export function invoiceScope(v: Viewer, person?: string | null): Prisma.InvoiceWhereInput {
  if (!person && sees(v, "billing")) return {};
  return { createdById: asPerson(v, person) };
}

export function accountScope(v: Viewer, person?: string | null): Prisma.AccountWhereInput {
  if (!person && sees(v, "clients")) return {};
  const id = asPerson(v, person);
  return { OR: [{ managerId: id }, { leads: { some: { ownerId: id } } }, { projects: { some: { managerId: id } } }, { projects: { some: { tasks: { some: { ownerId: id } } } } }] };
}

export function projectScope(v: Viewer, person?: string | null): Prisma.ProjectWhereInput {
  if (!person && sees(v, "projects")) return {};
  const id = asPerson(v, person);
  return { OR: [{ managerId: id }, { tasks: { some: { ownerId: id } } }, { lead: { ownerId: id } }] };
}

export function inboxScope(v: Viewer, person?: string | null): Prisma.InboxItemWhereInput {
  if (!person && sees(v, "inbox")) return {};
  return { userId: asPerson(v, person) };
}

/** A scope used through a relation ("payments whose order is mine"); nothing at all when the scope is everything. */
export const through = <K extends string, W extends object>(relation: K, scope: W) => (Object.keys(scope).length ? ({ [relation]: scope } as Record<K, W>) : {});

/** Invoices this person may open: in their scope, or ones they're named to sign. (An empty scope can't sit inside an OR: Prisma reads OR [{}] as matching nothing.) */
export function invoiceAccess(v: Viewer): Prisma.InvoiceWhereInput {
  const scope = invoiceScope(v);
  return Object.keys(scope).length === 0 ? {} : { OR: [scope, { signatoryId: v.id }] };
}
