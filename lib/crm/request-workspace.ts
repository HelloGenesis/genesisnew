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
export const requestWorkspace = cache(() => resolve());

const scoped = new AsyncLocalStorage<{ ws: string | null | undefined }>();

/**
 * Runs `fn` held to this CRM: `db` is a client bound to it (lib/db
 * getPrisma(ws)), and plain `getPrisma()` anywhere inside answers the same.
 * Awaited in here, not handed back: a Prisma query runs on its first
 * `.then()`, and one awaited by the caller would run outside this CRM.
 */
export async function inWorkspace<T>(ws: string | null, fn: (db: ReturnType<typeof import("@/lib/db").getPrisma>) => Promise<T>): Promise<T> {
  const { getPrisma } = await import("@/lib/db");
  return scoped.run({ ws }, async () => await fn(getPrisma(ws)));
}

const CRM_PATHS = /^\/(admin|api\/crm)(\/|$)/;

export async function activeWorkspace(): Promise<string | null | undefined> {
  const explicit = scoped.getStore();
  if (explicit) return explicit.ws;
  /* One lookup per request, shared while it's in flight: a page's first burst of queries all wait on it. */
  return requestWorkspace();
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
  /*
   * Its own lookups run unfiltered, so they never wait on this lookup. (A cap
   * on lookups in flight used to answer "no CRM" past 50: one agency request
   * with 60 queries at once saw every CRM's leads, 30 Oct 2026.)
   */
  return scoped.run({ ws: undefined }, async () => {
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
  });
}
