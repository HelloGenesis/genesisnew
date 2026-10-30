import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { activeWorkspace } from "./crm/request-workspace";
import { dbEnv, isPlaceholder } from "./env";

/**
 * Prisma 7 no longer connects on its own — it requires a driver adapter.
 * We use `PrismaNeon`, which speaks Neon's serverless protocol over
 * WebSockets. That avoids holding raw TCP connections from short-lived
 * Vercel functions (which exhausts Postgres connection limits) while still
 * supporting interactive transactions, unlike the HTTP-only adapter.
 *
 * The client is constructed lazily. Building the app must not require a
 * reachable database, and an unset `DATABASE_URL` should surface as a clear
 * error at the call site rather than a crash at import time.
 */

type Client = InstanceType<typeof PrismaClient>;

// Reuse across hot reloads in dev so we don't leak a pool per recompile.
const globalForPrisma = globalThis as unknown as { genesisBase?: Client; genesisCrmPrisma?: Client; genesisScoped?: Map<string | null, Client> };

function createClient(): Client {
  const { DATABASE_URL } = dbEnv();
  /* Neon in production and on previews; node-postgres for the local embedded database (scripts/dev-db.ts). */
  const adapter = /\.neon\.tech\b/.test(DATABASE_URL)
    ? new PrismaNeon({ connectionString: DATABASE_URL })
    : new PrismaPg({ connectionString: DATABASE_URL });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
  return client;
}

function baseClient(): Client {
  return (globalForPrisma.genesisBase ??= createClient());
}

/*
 * AGENCY CRMS KEPT APART (Genesis, 22 Oct 2026: "a separate dashboard for
 * agencies, where our data should not be merged with theirs but we can see
 * their data"). Leads, briefs, clients, quotes, invoices, projects, tasks,
 * creators and requests carry `workspaceId` (null = Genesis's). Inside a staff
 * request (lib/crm/request-workspace) every read and write on those models is
 * held to that request's CRM here, in one place, so no page can forget it.
 * Public pages, webhooks and scheduled jobs run unfiltered.
 *
 * A client from `getPrisma(ws)` carries its CRM in a closure and never looks
 * anywhere else: background work (a Gmail sync, a sheet import, an export)
 * uses that, or `inWorkspace`, which hands one over. Reading the CRM from
 * AsyncLocalStorage in here is only as good as the moment Prisma runs the
 * hook: a Prisma query is lazy and runs on its first `.then()`, so a query
 * built inside `als.run(...)` and awaited outside it ran with no CRM at all
 * (30 Oct 2026).
 */
const TAGGED = new Set(["Lead", "Brief", "Account", "Quote", "Invoice", "Project", "Task", "Creator", "Request"]);
const WHERE_OPS = new Set(["findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy", "update", "updateMany", "updateManyAndReturn", "delete", "deleteMany", "upsert"]);

function withWorkspaces(client: Client, bound?: { ws: string | null }): Client {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TAGGED.has(model)) return query(args);
          const ws = bound ? bound.ws : await activeWorkspace();
          if (ws === undefined) return query(args);
          const a = (args ?? {}) as Record<string, unknown>;
          if (WHERE_OPS.has(operation)) {
            const where = (a.where ?? {}) as Record<string, unknown>;
            if (!("workspaceId" in where)) a.where = { ...where, workspaceId: ws };
          }
          if (operation === "create" || operation === "upsert") {
            const key = operation === "create" ? "data" : "create";
            const data = (a[key] ?? {}) as Record<string, unknown>;
            if (!("workspaceId" in data)) a[key] = { ...data, workspaceId: ws };
          }
          if (operation === "createMany" || operation === "createManyAndReturn") {
            const rows = Array.isArray(a.data) ? a.data : [a.data];
            a.data = rows.map((r) => ("workspaceId" in (r as object) ? r : { ...(r as object), workspaceId: ws }));
          }
          return query(a as typeof args);
        },
      },
    },
  }) as unknown as Client;
}

/**
 * `getPrisma()` — the CRM of this request (or `inWorkspace`); none outside one.
 * `getPrisma(ws)` — held to that CRM whatever runs it (null: Genesis's own).
 */
export function getPrisma(ws?: string | null): Client {
  if (ws === undefined) return (globalForPrisma.genesisCrmPrisma ??= withWorkspaces(baseClient()));
  const scoped = (globalForPrisma.genesisScoped ??= new Map());
  let client = scoped.get(ws);
  if (!client) scoped.set(ws, (client = withWorkspaces(baseClient(), { ws })));
  return client;
}

/**
 * Ergonomic alias so call sites read `prisma.user.findMany()`. Resolution is
 * deferred to first property access, preserving the lazy construction above.
 */
export const prisma: Client = new Proxy({} as Client, {
  get(_target, property, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** True when a real (non-placeholder) connection string is present. */
export function isDatabaseConfigured(): boolean {
  return !isPlaceholder(process.env.DATABASE_URL);
}

/** Round-trips a trivial query to prove the database is reachable. */
export async function pingDatabase(): Promise<void> {
  await getPrisma().$queryRaw`SELECT 1`;
}
