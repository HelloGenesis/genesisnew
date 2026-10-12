import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getPrisma } from "@/lib/db";

/**
 * EACH PERSON'S OWN GOOGLE (Genesis, 12 Oct 2026: "each person connects their
 * own"). A team member connects their @genesismedia.co Google account once,
 * read-only: Gmail, Drive and Sheets. The CRM reads new mail and documents
 * for briefs, client and vendor details, invoices and links (lib/crm/ingest).
 *
 * The OAuth client is an INTERNAL app in Genesis's Google Workspace, so only
 * genesismedia.co accounts can connect and Google's restricted-scope review
 * does not apply. Env: GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET
 * (the same client as the project-files Drive), with the redirect URI
 * <site>/api/crm/google/callback.
 */

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  /* Files the CRM itself makes: project uploads and the live CRM sheets (Genesis, 12 Oct 2026). Nothing else in Drive can be changed. */
  "https://www.googleapis.com/auth/drive.file",
];

/** The company Google account whose Drive holds project files and the CRM sheets. */
export const COMPANY_ACCOUNT = () => (process.env.CRM_DRIVE_ACCOUNT || "hello@genesismedia.co").toLowerCase();

/** That account's connection, when it has allowed the CRM to create files. */
export async function companyConnection() {
  const conn = await getPrisma().googleConnection.findFirst({ where: { email: COMPANY_ACCOUNT(), status: "ACTIVE" } });
  return conn && conn.scopes.includes("auth/drive.file") ? conn : null;
}

/** An access token for the company account (project files, the CRM sheets). */
export async function companyToken(): Promise<string> {
  const conn = await companyConnection();
  if (!conn) throw new GoogleAuthError(`${COMPANY_ACCOUNT()} hasn't connected Google with file access yet (Inbox → Connect Google).`);
  return accessToken(conn.userId);
}

export const googleConfigured = () => Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);

/* --- Sealing the refresh token ------------------------------------------- */

function key(): Buffer {
  const secret = process.env.CRM_SESSION_SECRET || process.env.AUTH0_SECRET || process.env.CRM_DEV_SECRET || "genesis-local-development-only";
  return createHash("sha256").update(`crm-google:${secret}`).digest();
}

function seal(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

function unseal(sealed: string): string | null {
  try {
    const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv!);
    decipher.setAuthTag(tag!);
    return Buffer.concat([decipher.update(body!), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/* --- Connecting ------------------------------------------------------------ */

export function googleAuthorizeUrl(origin: string, state: string, loginHint?: string | null) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: `${origin}/api/crm/google/callback`,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    hd: "genesismedia.co",
    ...(loginHint ? { login_hint: loginHint } : {}),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Exchanges the callback's code and keeps the person's refresh token. */
export async function completeGoogle(origin: string, code: string, userId: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/crm/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = (await response.json()) as { refresh_token?: string; access_token?: string; id_token?: string; expires_in?: number; scope?: string; error?: string };
  if (!response.ok || !tokens.refresh_token) throw new Error(tokens.error ?? "Google did not return a refresh token");
  const claims = tokens.id_token ? (JSON.parse(Buffer.from(tokens.id_token.split(".")[1]!, "base64url").toString()) as { email?: string }) : {};
  const email = (claims.email ?? "").toLowerCase();
  const data = { email, refreshToken: seal(tokens.refresh_token), scopes: tokens.scope ?? GOOGLE_SCOPES.join(" "), status: "ACTIVE", lastError: null };
  await getPrisma().googleConnection.upsert({ where: { userId }, create: { userId, ...data }, update: { ...data, gmailCursor: null, driveCursor: null } });
  if (tokens.access_token) tokenCache.set(userId, { token: tokens.access_token, expires: Date.now() + (tokens.expires_in ?? 3000) * 1000 - 60_000 });
  return email;
}

export async function disconnectGoogle(userId: string) {
  const conn = await getPrisma().googleConnection.findUnique({ where: { userId } });
  if (!conn) return;
  const refresh = unseal(conn.refreshToken);
  /* Revoked at Google too, so the access really ends. */
  if (refresh) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, { method: "POST" }).catch(() => undefined);
  await getPrisma().googleConnection.delete({ where: { userId } });
  tokenCache.delete(userId);
}

/* --- Calling Google as a person ---------------------------------------------- */

const tokenCache = new Map<string, { token: string; expires: number }>();

export class GoogleAuthError extends Error {}

async function accessToken(userId: string): Promise<string> {
  const hit = tokenCache.get(userId);
  if (hit && hit.expires > Date.now()) return hit.token;
  const conn = await getPrisma().googleConnection.findUnique({ where: { userId } });
  const refresh = conn ? unseal(conn.refreshToken) : null;
  if (!conn || !refresh) throw new GoogleAuthError("Google is not connected");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!, client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!, refresh_token: refresh, grant_type: "refresh_token" }),
  });
  const body = (await response.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !body.access_token) {
    /* Revoked or expired: the person reconnects; the sync stops asking. */
    if (body.error === "invalid_grant") await getPrisma().googleConnection.update({ where: { userId }, data: { status: "REVOKED", lastError: "Google access was removed. Connect again." } });
    throw new GoogleAuthError(`Google token refresh failed: ${body.error ?? response.status}`);
  }
  tokenCache.set(userId, { token: body.access_token, expires: Date.now() + (body.expires_in ?? 3000) * 1000 - 60_000 });
  return body.access_token;
}

/** A Google API call as this person. `url` is absolute (Gmail, Drive and Sheets live on different hosts). */
export async function google<T>(userId: string, url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${await accessToken(userId)}`, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    const error = new Error(`Google ${response.status}: ${(await response.text()).slice(0, 300)}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

/** Plain text from Google (a Doc exported as text, a Sheet as CSV). */
export async function googleText(userId: string, url: string, max = 20_000): Promise<string> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken(userId)}` }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Google ${response.status}`);
  return (await response.text()).slice(0, max);
}
