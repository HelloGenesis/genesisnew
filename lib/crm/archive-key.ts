import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * THE ARCHIVER'S PASS (lib/crm/archive). The Drive copy of a quote or invoice
 * is printed by a headless browser from the same page the client sees; this
 * signed key lets that browser see a draft and stops its visit counting as the
 * client opening it. Tied to the document's own token, so it opens nothing else.
 */
const secret = () => process.env.CRM_SESSION_SECRET || process.env.AUTH0_SECRET || process.env.CRM_DEV_SECRET || "genesis-local-development-only";

export const archiveKey = (token: string) => createHmac("sha256", secret()).update(`archive:${token}`).digest("base64url");

export function isArchiveKey(token: string, key: string | undefined) {
  if (!key) return false;
  const want = Buffer.from(archiveKey(token));
  const got = Buffer.from(key);
  return want.length === got.length && timingSafeEqual(want, got);
}
