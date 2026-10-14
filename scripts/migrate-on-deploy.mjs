/**
 * DATABASE CHANGES GO OUT WITH THE DEPLOY (Genesis, 14 Oct 2026). On a
 * PRODUCTION build on Vercel only, apply any pending migrations
 * (prisma/migrations) before the app is built, so the code never goes live
 * ahead of the tables it needs. A failure stops the build: the live site keeps
 * running the previous deploy. Preview and local builds skip it.
 */
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate-on-deploy] not a production deploy; skipping migrations");
} else if (!process.env.DIRECT_DATABASE_URL && !process.env.DATABASE_URL) {
  console.log("[migrate-on-deploy] no database configured; skipping migrations");
} else {
  console.log("[migrate-on-deploy] applying pending migrations");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } });
}
