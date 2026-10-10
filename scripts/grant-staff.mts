/**
 * Grant a CRM staff role from the command line (as genesis-coworking):
 *
 *   npm run staff:grant -- owner@genesismedia.co OWNER
 *
 * Granted at once if that email has signed in verified; otherwise saved as an
 * invite claimed on first verified sign-in. Further staff are managed in
 * /admin/staff. (Alternatively set CRM_OWNER_EMAILS in the environment.)
 */
import { config } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: ".env.local", quiet: true });
if (process.env.NODE_ENV !== "production") config({ path: ".env.development.local", override: true, quiet: true });

const [emailArg, roleArg = "OWNER"] = process.argv.slice(2);
const email = emailArg?.toLowerCase();
const role = roleArg.toUpperCase();
if (!email || !/^[^\s@]+@[^\s@]+$/.test(email) || !["OWNER", "ADMIN", "SALES", "PRODUCER", "FINANCE"].includes(role)) {
  console.error("Usage: npm run staff:grant -- email@genesismedia.co [OWNER|ADMIN|SALES|PRODUCER|FINANCE]");
  process.exit(1);
}
const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
const prisma = new PrismaClient({ adapter: /\.neon\.tech\b/.test(url) ? new PrismaNeon({ connectionString: url }) : new PrismaPg({ connectionString: url }) });
const r = role as "OWNER";
const user = await prisma.user.findFirst({ where: { email, emailVerified: true } });
if (user) {
  await prisma.staffRole.upsert({ where: { userId_role: { userId: user.id, role: r } }, create: { userId: user.id, role: r }, update: {} });
  console.log(`${email} is now ${role}.`);
} else {
  await prisma.staffInvite.upsert({ where: { email_role: { email, role: r } }, create: { email, role: r }, update: {} });
  console.log(`Saved: ${email} becomes ${role} on first verified sign-in.`);
}
await prisma.$disconnect();
