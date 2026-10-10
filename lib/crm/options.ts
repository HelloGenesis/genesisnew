import "server-only";

import { getPrisma } from "@/lib/db";
import type { AccountKind } from "@/lib/generated/prisma/enums";

/** [id, label] lists for the CRM's selects. */

export async function staffOptions(): Promise<[string, string][]> {
  const rows = await getPrisma().user.findMany({ where: { staffRoles: { some: {} } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } });
  return rows.map((u) => [u.id, u.name ?? u.email ?? "Staff"]);
}

export async function accountOptions(kinds?: AccountKind[], resellersOnly = false): Promise<[string, string][]> {
  const rows = await getPrisma().account.findMany({
    where: { ...(kinds ? { kind: { in: kinds } } : {}), ...(resellersOnly ? { isReseller: true } : {}) },
    select: { id: true, name: true, kind: true },
    orderBy: { name: "asc" },
  });
  return rows.map((a) => [a.id, kinds?.length === 1 ? a.name : `${a.name} (${a.kind.toLowerCase()})`]);
}

/** Today + n days as an input[type=date] value. */
export const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
export const dateValue = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

/** A moment n days from now (negative for the past) — for date filters in server pages. */
export const daysFromNow = (n: number) => new Date(Date.now() + n * 864e5);
