/**
 * NOVA'S DEMO AGENCY, LOCALLY (lib/crm/demo-seed) — never for a real database.
 *
 *   npx tsx --conditions react-server scripts/nova-demo-seed.mts [clean]
 *
 * Makes Northstar Collective fresh (or removes it with `clean`) and prints
 * what it made, for scripts/nova-shots.mjs. In production the demo makes
 * itself the first time someone opens /demo.
 */
import { removeDemo, reseedDemo } from "../lib/crm/demo-seed";

if (!/@(127\.0\.0\.1|localhost):/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Refusing: DATABASE_URL is not the local development database.");
  process.exit(1);
}
if (process.argv[2] === "clean") {
  await removeDemo();
  console.log("Removed the demo agency.");
} else console.log(JSON.stringify(await reseedDemo()));
process.exit(0);
