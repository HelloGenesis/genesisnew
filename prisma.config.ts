import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads `.env.local`; the Prisma CLI does not load env files at all
// (Prisma 7 removed implicit loading). Load both here so there is a single
// source of truth for the connection string, with `.env.local` winning.
loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", override: true, quiet: true });
// The local embedded database (scripts/dev-db.mts), development only.
if (process.env.NODE_ENV !== "production") loadEnv({ path: ".env.development.local", override: true, quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations must run over a DIRECT (unpooled) Neon connection — PgBouncer
    // does not support the session-level advisory locks the migration engine
    // takes. Runtime queries use the pooled `DATABASE_URL` (see lib/db.ts).
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
