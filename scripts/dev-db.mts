/**
 * Local development database: a persistent embedded PostgreSQL on port 54331.
 * Stands in for Neon on this machine only (as in genesis-coworking). Run it in
 * its own terminal:
 *
 *   npm run db:dev
 *
 * then `npm run db:deploy && npm run crm:seed`, with
 * DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54331/genesis_media
 * in .env.local.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), ".tmp", "pg-dev");
const fresh = !existsSync(dir);
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port: 54331, persistent: true, onLog: () => {} });
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("genesis_media");
console.log("Dev Postgres ready: postgresql://postgres:postgres@127.0.0.1:54331/genesis_media");
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
