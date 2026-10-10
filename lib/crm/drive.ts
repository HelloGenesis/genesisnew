import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";

import { getPrisma } from "@/lib/db";

/**
 * GENESIS'S GOOGLE DRIVE (hello@genesismedia.co), FOR THE CRM'S FILES.
 *
 * WHY OAUTH AND NOT THE SITE'S SERVICE ACCOUNT. Google gives service accounts
 * no storage of their own, so they can't put files in a person's My Drive.
 * Instead an owner clicks "Connect Google Drive" once (/admin/settings), signs
 * in as hello@genesismedia.co, and the CRM keeps that refresh token,
 * encrypted, in crm_settings. Every upload is then a file owned by hello@, in
 * "Genesis CRM / <client> / <P-0001 project> / <folder>" in that Drive.
 *
 * Scope is drive.file: the CRM can see and change only the files and folders
 * it created — nothing else in that Drive.
 *
 * Uploads go from the browser straight to Google on a resumable session the
 * server opens (no file passes through a Vercel function, so a 2 GB raw clip
 * is fine). Viewing streams back through /api/crm/files/<id>, which checks who
 * may see the file first; nothing is shared publicly on Drive.
 *
 * Env: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET (a Web OAuth client
 * with redirect URI {APP_BASE_URL}/api/crm/drive/callback).
 */

const SCOPES = ["https://www.googleapis.com/auth/drive.file", "openid", "email"];
const ROOT_NAME = "Genesis CRM";

export const driveOAuthConfigured = () => Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);

/*
  LOCAL DEVELOPMENT ONLY: with no Google OAuth client on this machine and the
  CRM's dev sign-in on, files go to .tmp/drive instead, so uploads, galleries
  and access rules can be exercised end to end. Never in production.
*/
const LOCAL_DIR = join(process.cwd(), ".tmp", "drive");
export const localDrive = () => process.env.NODE_ENV === "development" && process.env.CRM_DEV_LOGIN === "1" && !driveOAuthConfigured();
const localMeta = (id: string) => join(LOCAL_DIR, `${id.replace(/[^a-z0-9_-]/gi, "")}.json`);
const localData = (id: string) => join(LOCAL_DIR, id.replace(/[^a-z0-9_-]/gi, ""));

/** The dev upload endpoint's write (app/api/crm/files/local/[id]). */
export function localWrite(id: string, bytes: Buffer) {
  const meta = JSON.parse(readFileSync(localMeta(id), "utf8")) as DriveFileMeta;
  writeFileSync(localData(id), bytes);
  meta.size = String(bytes.length);
  writeFileSync(localMeta(id), JSON.stringify(meta));
  return meta;
}

// --- Encrypted settings ------------------------------------------------------------

function key(): Buffer {
  const secret = process.env.AUTH0_SECRET || process.env.CRM_DEV_SECRET || "genesis-local-development-only";
  return createHash("sha256").update(`crm-settings:${secret}`).digest();
}

function seal(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

function open(sealed: string): string | null {
  try {
    const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv!);
    decipher.setAuthTag(tag!);
    return Buffer.concat([decipher.update(body!), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

async function getSetting(k: string, secret = false) {
  const row = await getPrisma().appSetting.findUnique({ where: { key: k } });
  if (!row) return null;
  return secret ? open(row.value) : row.value;
}

async function setSetting(k: string, value: string, secret = false) {
  const stored = secret ? seal(value) : value;
  await getPrisma().appSetting.upsert({ where: { key: k }, create: { key: k, value: stored }, update: { value: stored } });
}

// --- Connecting ------------------------------------------------------------------

export function authorizeUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: `${origin}/api/crm/drive/callback`,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    login_hint: process.env.CRM_DRIVE_ACCOUNT || "hello@genesismedia.co",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Exchanges the callback's code; stores the refresh token and which Google account it is. */
export async function completeConnection(origin: string, code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/crm/drive/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = (await response.json()) as { refresh_token?: string; access_token?: string; id_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !tokens.refresh_token) throw new Error(tokens.error ?? "Google did not return a refresh token");
  const claims = tokens.id_token ? (JSON.parse(Buffer.from(tokens.id_token.split(".")[1]!, "base64url").toString()) as { email?: string }) : {};
  await setSetting("drive:refresh", tokens.refresh_token, true);
  await setSetting("drive:account", claims.email ?? "unknown");
  await setSetting("drive:connectedAt", new Date().toISOString());
  cached = tokens.access_token ? { token: tokens.access_token, expires: Date.now() + (tokens.expires_in ?? 3000) * 1000 - 60_000 } : undefined;
  return claims.email ?? null;
}

export async function driveStatus() {
  if (localDrive()) return { configured: true, account: "local development folder (.tmp/drive)", connectedAt: null };
  return { configured: driveOAuthConfigured(), account: await getSetting("drive:account"), connectedAt: await getSetting("drive:connectedAt") };
}

export async function disconnectDrive() {
  await getPrisma().appSetting.deleteMany({ where: { key: { startsWith: "drive:" } } });
  cached = undefined;
}

// --- Access tokens -----------------------------------------------------------------

let cached: { token: string; expires: number } | undefined;

export class DriveNotConnected extends Error {
  constructor() {
    super("Google Drive is not connected. An owner can connect it in CRM → Integrations.");
  }
}

async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now()) return cached.token;
  const refresh = driveOAuthConfigured() ? await getSetting("drive:refresh", true) : null;
  if (!refresh) throw new DriveNotConnected();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!, client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!, refresh_token: refresh, grant_type: "refresh_token" }),
  });
  const body = (await response.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !body.access_token) throw new Error(`Google token refresh failed: ${body.error ?? response.status}`);
  cached = { token: body.access_token, expires: Date.now() + (body.expires_in ?? 3000) * 1000 - 60_000 };
  return cached.token;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Drive ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return (await response.json()) as T;
}

// --- Folders -----------------------------------------------------------------------

const clean = (name: string) => name.replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 120) || "Untitled";

/** A folder under `parent` (or Drive's root), made once and remembered. */
async function folder(name: string, parent: string | null, cacheKey: string): Promise<string> {
  if (localDrive()) return `local-folder-${createHash("sha1").update(cacheKey).digest("hex").slice(0, 12)}`;
  const known = await getSetting(`drive:folder:${cacheKey}`);
  if (known) return known;
  const created = await api<{ id: string }>("files?fields=id", {
    method: "POST",
    body: JSON.stringify({ name: clean(name), mimeType: "application/vnd.google-apps.folder", ...(parent ? { parents: [parent] } : {}) }),
  });
  await setSetting(`drive:folder:${cacheKey}`, created.id);
  return created.id;
}

/** Genesis CRM / <Client> / <P-0001 Project> / <Folder label> */
export async function projectFolderId(p: { accountId: string; accountName: string; projectId: string; projectLabel: string; folderKey: string; folderLabel: string }) {
  const root = await folder(ROOT_NAME, null, "root");
  const client = await folder(p.accountName, root, `account:${p.accountId}`);
  const project = await folder(p.projectLabel, client, `project:${p.projectId}`);
  return folder(p.folderLabel, project, `project:${p.projectId}:${p.folderKey}`);
}

// --- Files -------------------------------------------------------------------------

/**
 * Opens a resumable upload the browser finishes itself. `origin` is the page's
 * origin: Google only allows the browser's PUT (CORS) when the session was
 * opened for that origin.
 */
export async function startUpload(input: { name: string; mimeType: string; size: number; parentId: string; origin: string }) {
  if (localDrive()) {
    mkdirSync(LOCAL_DIR, { recursive: true });
    const id = `local${randomBytes(8).toString("hex")}`;
    writeFileSync(localMeta(id), JSON.stringify({ id, name: clean(input.name), mimeType: input.mimeType, size: "0", parents: [input.parentId] }));
    return `${input.origin}/api/crm/files/local/${id}`;
  }
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,webViewLink,parents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": input.mimeType || "application/octet-stream",
      "X-Upload-Content-Length": String(input.size),
      Origin: input.origin,
    },
    body: JSON.stringify({ name: clean(input.name), parents: [input.parentId] }),
  });
  const location = response.headers.get("location");
  if (!response.ok || !location) throw new Error(`Drive upload could not start (${response.status})`);
  return location;
}

export type DriveFileMeta = { id: string; name: string; mimeType?: string; size?: string; webViewLink?: string; parents?: string[]; thumbnailLink?: string };

export const fileMeta = async (id: string) =>
  localDrive()
    ? (JSON.parse(readFileSync(localMeta(id), "utf8")) as DriveFileMeta)
    : api<DriveFileMeta>(`files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,webViewLink,parents,thumbnailLink`);

/** The file's bytes, a Range at a time (video seeking), straight from Drive. */
export async function fetchContent(id: string, range: string | null) {
  if (localDrive()) {
    const path = localData(id);
    if (!existsSync(path)) return new Response(null, { status: 404 });
    const size = statSync(path).size;
    const meta = JSON.parse(readFileSync(localMeta(id), "utf8")) as DriveFileMeta;
    const m = /bytes=(\d*)-(\d*)/.exec(range ?? "");
    const start = m?.[1] ? Number(m[1]) : 0;
    const end = m?.[2] ? Number(m[2]) : size - 1;
    const stream = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: m ? 206 : 200,
      headers: { "Content-Type": meta.mimeType ?? "application/octet-stream", "Content-Length": String(end - start + 1), ...(m ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}) },
    });
  }
  return fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, {
    headers: { Authorization: `Bearer ${await accessToken()}`, ...(range ? { Range: range } : {}) },
  });
}

/** Drive's thumbnail for an image or video, fetched with the owner's token. */
export async function fetchThumbnail(id: string) {
  if (localDrive()) return null;
  const meta = await fileMeta(id);
  if (!meta.thumbnailLink) return null;
  return fetch(meta.thumbnailLink.replace(/=s\d+$/, "=s600"), { headers: { Authorization: `Bearer ${await accessToken()}` } });
}

export async function trashFile(id: string) {
  if (localDrive()) return;
  await api(`files/${encodeURIComponent(id)}?fields=id`, { method: "PATCH", body: JSON.stringify({ trashed: true }) });
}
