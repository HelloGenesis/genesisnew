import "server-only";

import { getPrisma } from "@/lib/db";

import { COMPANY_ACCOUNT, google } from "./google";

/**
 * THE CRM'S PEOPLE IN GOOGLE CONTACTS (Genesis, 22 Oct 2026: "influencer
 * contacts and other contacts should be saved in Google Contacts"). Every
 * influencer, client, agency, vendor and lead with a phone number or email is
 * kept as a contact in the company account (hello@), under a label per kind,
 * so they're on the team's phones and in Gmail. Changes in the CRM update the
 * contact; contacts made by hand are never touched.
 *
 * Runs with the five-minute Google job, a few hundred records a run (the
 * first sync of the influencer database takes a few runs). Needs the company
 * account connected with Contacts access (Inbox → Connect Google) and the
 * People API enabled on the OAuth client's Google Cloud project.
 */

const PEOPLE = "https://people.googleapis.com/v1";
const BATCH = 200;
const PER_RUN = 600;

type Kind = "creator" | "client" | "vendor" | "lead";
const LABEL: Record<Kind, string> = { creator: "Genesis · Influencers", client: "Genesis · Clients & agencies", vendor: "Genesis · Vendors & crew", lead: "Genesis · Leads" };

type Person = {
  names: { givenName: string; familyName?: string; unstructuredName?: string }[];
  emailAddresses?: { value: string; type?: string }[];
  phoneNumbers?: { value: string; type?: string }[];
  organizations?: { name?: string; title?: string }[];
  urls?: { value: string; type?: string }[];
  biographies?: { value: string; contentType: "TEXT_PLAIN" }[];
  memberships?: { contactGroupMembership: { contactGroupResourceName: string } }[];
  etag?: string;
};
type Row = { key: string; updatedAt: Date; person: Person };

/** The company connection, when it has allowed Contacts. */
async function connection() {
  const conn = await getPrisma().googleConnection.findFirst({ where: { email: COMPANY_ACCOUNT(), status: "ACTIVE" } });
  return conn && conn.scopes.includes("auth/contacts") ? conn : null;
}

export async function contactsStatus() {
  return (await connection()) ? "connected" : "needs-access";
}

const setting = (key: string) => getPrisma().appSetting.findUnique({ where: { key } }).then((r) => r?.value ?? null);
const store = (key: string, value: string) => getPrisma().appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });

/** The label for a kind, made once. */
async function group(userId: string, kind: Kind) {
  const key = `contacts:group:${kind}`;
  const known = await setting(key);
  if (known) return known;
  const made = await google<{ resourceName: string }>(userId, `${PEOPLE}/contactGroups`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactGroup: { name: LABEL[kind] } }) });
  await store(key, made.resourceName);
  return made.resourceName;
}

const split = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? { givenName: parts.slice(0, -1).join(" "), familyName: parts.at(-1)! } : { givenName: name.trim() };
};
const phones = (raw: string | null | undefined) =>
  (raw ?? "")
    .split(/[,/;]|\s{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, "").length >= 8)
    .slice(0, 3)
    .map((value) => ({ value }));
const email = (raw: string | null | undefined) => (raw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim()) ? [{ value: raw.trim().toLowerCase() }] : undefined);

/** The records changed since the last run, as contacts. Only those with a phone or an email. */
async function changed(kind: Kind, since: Date, take: number): Promise<Row[]> {
  const prisma = getPrisma();
  const reach = { OR: [{ phone: { not: null } }, { email: { not: null } }] };
  if (kind === "creator") {
    const rows = await prisma.creator.findMany({ where: { updatedAt: { gt: since }, ...reach }, orderBy: { updatedAt: "asc" }, take });
    return rows.map((c) => ({
      key: `creator:${c.id}`,
      updatedAt: c.updatedAt,
      person: {
        names: [split(c.name || c.handle)],
        emailAddresses: email(c.email),
        phoneNumbers: phones(c.phone),
        organizations: c.managedBy ? [{ name: c.managedBy, title: "Influencer" }] : [{ title: "Influencer" }],
        urls: c.profileUrl ? [{ value: c.profileUrl, type: "profile" }] : undefined,
        biographies: [{ value: [`@${c.handle} · ${c.platform.toLowerCase()} · ${c.followers.toLocaleString("en-IN")} followers`, c.niches.join(", "), c.city].filter(Boolean).join("\n"), contentType: "TEXT_PLAIN" }],
      },
    }));
  }
  if (kind === "lead") {
    const rows = await prisma.lead.findMany({ where: { updatedAt: { gt: since }, ...reach }, orderBy: { updatedAt: "asc" }, take });
    return rows.map((l) => ({
      key: `lead:${l.id}`,
      updatedAt: l.updatedAt,
      person: { names: [split(l.name)], emailAddresses: email(l.email), phoneNumbers: phones(l.phone), organizations: [{ name: l.company ?? undefined, title: l.designation ?? undefined }] },
    }));
  }
  const rows = await prisma.account.findMany({ where: { updatedAt: { gt: since }, kind: kind === "vendor" ? "VENDOR" : { in: ["BRAND", "AGENCY"] }, ...reach }, orderBy: { updatedAt: "asc" }, take });
  return rows.map((a) => ({
    key: `account:${a.id}`,
    updatedAt: a.updatedAt,
    person: {
      names: [split(a.name)],
      emailAddresses: email(a.email),
      phoneNumbers: phones(a.phone),
      organizations: [{ name: a.legalName ?? a.name, title: kind === "vendor" ? (a.vendorSkills.join(", ") || "Vendor") : a.kind === "AGENCY" ? "Agency" : "Client" }],
      urls: a.website ? [{ value: a.website, type: "website" }] : undefined,
    },
  }));
}

const FIELDS = "names,emailAddresses,phoneNumbers,organizations,urls,biographies";

/** One run: each kind's changes since its cursor, created or updated in batches of 200. */
export async function syncContacts() {
  const conn = await connection();
  if (!conn) return { skipped: "Contacts access not given yet" };
  const prisma = getPrisma();
  const report: Record<string, { created: number; updated: number }> = {};
  let budget = PER_RUN;
  for (const kind of ["client", "vendor", "lead", "creator"] as Kind[]) {
    if (budget <= 0) break;
    const cursorKey = `contacts:cursor:${kind}`;
    const since = new Date((await setting(cursorKey)) ?? 0);
    const rows = await changed(kind, since, budget);
    budget -= rows.length;
    if (rows.length === 0) continue;
    const label = await group(conn.userId, kind);
    const known = new Map((await prisma.appSetting.findMany({ where: { key: { in: rows.map((r) => `contacts:map:${r.key}`) } } })).map((s) => [s.key.slice("contacts:map:".length), JSON.parse(s.value) as { name: string; etag: string }]));
    const fresh = rows.filter((r) => !known.has(r.key));
    const old = rows.filter((r) => known.has(r.key));
    let created = 0;
    let updated = 0;
    for (let i = 0; i < fresh.length; i += BATCH) {
      const chunk = fresh.slice(i, i + BATCH);
      const result = await google<{ createdPeople?: { person?: { resourceName: string; etag: string } }[] }>(conn.userId, `${PEOPLE}/people:batchCreateContacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: chunk.map((r) => ({ contactPerson: { ...r.person, memberships: [{ contactGroupMembership: { contactGroupResourceName: label } }] } })), readMask: "names" }),
      });
      for (const [j, made] of (result.createdPeople ?? []).entries()) {
        if (made.person) await store(`contacts:map:${chunk[j]!.key}`, JSON.stringify({ name: made.person.resourceName, etag: made.person.etag }));
      }
      created += result.createdPeople?.length ?? 0;
    }
    for (let i = 0; i < old.length; i += BATCH) {
      const chunk = old.slice(i, i + BATCH);
      const contacts = Object.fromEntries(chunk.map((r) => [known.get(r.key)!.name, { ...r.person, etag: known.get(r.key)!.etag }]));
      try {
        const result = await google<{ updateResult?: Record<string, { person?: { resourceName: string; etag: string } }> }>(conn.userId, `${PEOPLE}/people:batchUpdateContacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contacts, updateMask: FIELDS, readMask: "names" }),
        });
        for (const r of chunk) {
          const person = result.updateResult?.[known.get(r.key)!.name]?.person;
          if (person) await store(`contacts:map:${r.key}`, JSON.stringify({ name: person.resourceName, etag: person.etag }));
        }
        updated += chunk.length;
      } catch (error) {
        /* A contact deleted or edited in Google since: forget it, so the next run makes it again. */
        if ((error as { status?: number }).status === 400 || (error as { status?: number }).status === 404) await prisma.appSetting.deleteMany({ where: { key: { in: chunk.map((r) => `contacts:map:${r.key}`) } } });
        else throw error;
      }
    }
    await store(cursorKey, rows.at(-1)!.updatedAt.toISOString());
    report[kind] = { created, updated };
  }
  return report;
}
