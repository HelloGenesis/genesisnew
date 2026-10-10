import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
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
const globalForPrisma = globalThis as unknown as { genesisPrisma?: Client };

function createClient(): Client {
  const { DATABASE_URL } = dbEnv();
  /* Neon in production and on previews; node-postgres for the local embedded database (scripts/dev-db.ts). */
  const adapter = /\.neon\.tech\b/.test(DATABASE_URL)
    ? new PrismaNeon({ connectionString: DATABASE_URL })
    : new PrismaPg({ connectionString: DATABASE_URL });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export function getPrisma(): Client {
  if (!globalForPrisma.genesisPrisma) {
    globalForPrisma.genesisPrisma = createClient();
  }
  return globalForPrisma.genesisPrisma;
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
