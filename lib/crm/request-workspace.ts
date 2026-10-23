import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { cookies, headers } from "next/headers";
import { cache } from "react";

import { PATH_HEADER } from "./path-header";

/**
 * WHICH CRM THIS WORK IS IN (lib/crm/workspace). The database client (lib/db)
 * keeps every query on agency-tagged records inside it.
 *   undefined — a public page, a webhook, a scheduled job: no filter;
 *   null      — Genesis's own records;
 *   a string  — that agency's.
 *
 * Worked out from who is signed in, on the CRM's own pages and APIs (the
 * proxy stamps each request with its path): an agency's team → their
 * agency; a Genesis owner → the agency picked in "Viewing", else Genesis;
 * everyone else → Genesis. Page renders, form submissions and downloads all
 * get the same answer. Background work for one person (a sheet sync, their
 * Gmail) runs inside `inWorkspace`.
 */
export const requestWorkspace = cache((): { ws: string | null | undefined; known: boolean } => ({ ws: undefined, known: false }));

const scoped = new AsyncLocalStorage<{ ws: string | null }>();

/** Runs `fn` with every query held to this CRM. */
export function inWorkspace<T>(ws: string | null, fn: () => Promise<T>): Promise<T> {
  return scoped.run({ ws }, fn);
}

const CRM_PATHS = /^\/(admin|api\/crm)(\/|$)/;

let resolving = 0;

export async function activeWorkspace(): Promise<string | null | undefined> {
  const explicit = scoped.getStore();
  if (explicit) return explicit.ws;
  let memo: ReturnType<typeof requestWorkspace> | null = null;
  try {
    memo = requestWorkspace();
  } catch {
    memo = null;
  }
  if (memo?.known) return memo.ws;
  const ws = await resolve();
  if (memo) Object.assign(memo, { ws, known: true });
  return ws;
}

async function resolve(): Promise<string | null | undefined> {
  let path: string;
  try {
    path = (await headers()).get(PATH_HEADER) ?? "";
  } catch {
    /* Not in a request: a job or a script. */
    return undefined;
  }
  if (!CRM_PATHS.test(path)) return undefined;
  /* Its own lookups are users and roles, never CRM records; the guard is belt and braces. */
  if (resolving > 50) return undefined;
  resolving++;
  try {
    const [{ currentIdentity }, { getPrisma }] = await Promise.all([import("./session"), import("@/lib/db")]);
    const identity = await currentIdentity();
    if (!identity) return undefined;
    const prisma = getPrisma();
    const user =
      (await prisma.user.findUnique({ where: { auth0Sub: identity.sub }, select: { id: true, workspaceId: true } })) ??
      (identity.emailVerified && identity.email ? await prisma.user.findFirst({ where: { email: identity.email, emailVerified: true }, select: { id: true, workspaceId: true } }) : null);
    if (!user) return undefined;
    if (user.workspaceId) return user.workspaceId;
    const owner = (await prisma.staffRole.count({ where: { userId: user.id, role: "OWNER" } })) > 0;
    return (owner ? (await cookies()).get("gm_ws")?.value : null) || null;
  } finally {
    resolving--;
  }
}
