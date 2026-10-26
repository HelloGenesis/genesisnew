import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { getPrisma } from "@/lib/db";

/**
 * THE CONNECTOR LINKS (Genesis, 27 Oct 2026: "run it from my ChatGPT or other
 * AI platform"). Each person makes their own secret link in Integrations and
 * pastes it into ChatGPT (or Claude) once; it acts as them, with their
 * permissions, until they switch it off. Only a hash of the secret is kept.
 */
const PREFIX = "mcp-key:";
const hash = (secret: string) => createHash("sha256").update(secret).digest("hex");

type KeyRecord = { userId: string; label: string; createdAt: string; lastUsedAt?: string };

/** A new link's secret, shown once. */
export async function createConnectorKey(userId: string, label: string) {
  const secret = `gmk_${randomBytes(24).toString("base64url")}`;
  const value: KeyRecord = { userId, label: label.slice(0, 60) || "ChatGPT", createdAt: new Date().toISOString() };
  await getPrisma().appSetting.create({ data: { key: PREFIX + hash(secret), value: JSON.stringify(value) } });
  return secret;
}

export async function connectorKeys(userId: string) {
  const rows = await getPrisma().appSetting.findMany({ where: { key: { startsWith: PREFIX } } });
  return rows
    .map((r) => ({ id: r.key.slice(PREFIX.length, PREFIX.length + 12), ...(JSON.parse(r.value) as KeyRecord) }))
    .filter((k) => k.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Switches a link off (by the start of its hash, as listed). */
export async function revokeConnectorKey(userId: string, id: string) {
  if (!/^[0-9a-f]{12}$/.test(id)) return;
  const rows = await getPrisma().appSetting.findMany({ where: { key: { startsWith: PREFIX + id } } });
  for (const r of rows) if ((JSON.parse(r.value) as KeyRecord).userId === userId) await getPrisma().appSetting.delete({ where: { key: r.key } });
}

/** Whose link this is, or null. Notes when it was last used. */
export async function userForConnectorKey(secret: string): Promise<string | null> {
  if (!/^gmk_[A-Za-z0-9_-]{20,}$/.test(secret)) return null;
  const row = await getPrisma().appSetting.findUnique({ where: { key: PREFIX + hash(secret) } });
  if (!row) return null;
  const rec = JSON.parse(row.value) as KeyRecord;
  /* At most once a minute. */
  if (!rec.lastUsedAt || Date.now() - new Date(rec.lastUsedAt).getTime() > 60_000) {
    await getPrisma().appSetting.update({ where: { key: row.key }, data: { value: JSON.stringify({ ...rec, lastUsedAt: new Date().toISOString() }) } }).catch(() => undefined);
  }
  return rec.userId;
}
