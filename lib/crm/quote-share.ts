import "server-only";

import { getPrisma } from "@/lib/db";

import { companyToken, personFileToken } from "./google";

/**
 * SHARING A QUOTE OR PLAN WITH SOMEONE (Genesis, 2 Nov 2026: "give a button to
 * every user to share the particular plan with others", like Google's Share).
 * Who it's been shared with is kept per quote; the people who can be added are
 * that CRM's team (Genesis's staff, or the agency's own) and Genesis's owners.
 */

export type SharePerson = { id: string; name: string; email: string | null; picture: string | null };
type Shared = { userId: string; by: string; at: string };

const KEY = (quoteId: string) => `quote-share:${quoteId}`;
const person = (u: { id: string; name: string | null; email: string | null; picture: string | null }): SharePerson => ({ id: u.id, name: u.name ?? u.email ?? "Someone", email: u.email, picture: u.picture });
const PICK = { id: true, name: true, email: true, picture: true } as const;

export async function sharedWith(quoteId: string): Promise<Shared[]> {
  const row = await getPrisma().appSetting.findUnique({ where: { key: KEY(quoteId) } });
  try {
    return row ? (JSON.parse(row.value) as Shared[]) : [];
  } catch {
    return [];
  }
}

export async function addShares(quoteId: string, userIds: string[], by: string) {
  const now = new Date().toISOString();
  const list = await sharedWith(quoteId);
  const fresh = userIds.filter((id) => !list.some((s) => s.userId === id));
  const value = JSON.stringify([...list, ...fresh.map((userId) => ({ userId, by, at: now }))]);
  await getPrisma().appSetting.upsert({ where: { key: KEY(quoteId) }, create: { key: KEY(quoteId), value }, update: { value } });
  return fresh;
}

export async function removeShare(quoteId: string, userId: string) {
  const value = JSON.stringify((await sharedWith(quoteId)).filter((s) => s.userId !== userId));
  await getPrisma().appSetting.upsert({ where: { key: KEY(quoteId) }, create: { key: KEY(quoteId), value }, update: { value } });
}

/** Everyone who can be picked for a quote in this CRM (null: Genesis Media's). */
export async function shareCandidates(workspaceId: string | null): Promise<SharePerson[]> {
  const rows = await getPrisma().user.findMany({
    where: { OR: [workspaceId ? { workspaceId } : { staffRoles: { some: {} }, workspaceId: null }, { staffRoles: { some: { role: "OWNER" } } }] },
    select: PICK,
    orderBy: { name: "asc" },
  });
  return rows.map(person);
}

/** The "People with access" list: who made it, Genesis's owners, and who it's been shared with. */
export async function peopleWithAccess(q: { id: string; createdById: string | null }) {
  const prisma = getPrisma();
  const shares = await sharedWith(q.id);
  const [maker, owners, shared] = await Promise.all([
    q.createdById ? prisma.user.findUnique({ where: { id: q.createdById }, select: PICK }) : null,
    prisma.user.findMany({ where: { staffRoles: { some: { role: "OWNER" } } }, select: PICK, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { id: { in: shares.map((s) => s.userId) } }, select: PICK }),
  ]);
  const out: (SharePerson & { access: "Owner" | "Super admin" | "Shared" })[] = [];
  if (maker) out.push({ ...person(maker), access: "Owner" });
  for (const o of owners) if (!out.some((p) => p.id === o.id)) out.push({ ...person(o), access: "Super admin" });
  for (const s of shared) if (!out.some((p) => p.id === s.id)) out.push({ ...person(s), access: "Shared" });
  return out;
}

/**
 * THE PLAN'S GOOGLE SHEETS FOR THESE PEOPLE (Genesis, 2 Nov 2026: "why doesn't
 * this guy have access to his own sheet?"): editor access on both sheets, set
 * with whichever account owns them (the maker's, else the company's). Sheets
 * were only ever shared when first made, so a revision or a sheet someone
 * else made stayed closed to the rest. Returns whether any sheet was shared.
 */
export async function grantPlanSheets(quoteId: string, emails: string[]) {
  const q = await getPrisma().quote.findUnique({ where: { id: quoteId }, select: { extSheetId: true, intSheetId: true, createdById: true } });
  const sheets = [q?.intSheetId, q?.extSheetId].filter((s): s is string => Boolean(s));
  const to = [...new Set(emails.map((e) => e.toLowerCase()))];
  if (!q || !sheets.length || !to.length) return false;
  const tokens = [await personFileToken(q.createdById).then((m) => m.token).catch(() => null), await companyToken().catch(() => null)].filter((t): t is string => Boolean(t));
  let any = false;
  for (const sheet of sheets) {
    for (const email of to) {
      for (const token of tokens) {
        const r = await fetch(`https://www.googleapis.com/drive/v3/files/${sheet}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ type: "user", role: "writer", emailAddress: email }),
        }).catch(() => null);
        if (r?.ok) {
          any = true;
          break;
        }
      }
    }
  }
  return any;
}
