import "server-only";

import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { isAuth0Configured } from "@/lib/auth0";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

import { emailConfigured, sendNow } from "./notify";

/**
 * SIGN-IN BY EMAIL CODE, WITHOUT AUTH0.
 *
 * Used whenever Auth0 isn't configured (and Resend, the database and
 * CRM_SESSION_SECRET are): we email a six-digit code, keep only its hash in
 * crm_settings for ten minutes with five tries, and on a match set a signed
 * session cookie. Staff still need the authenticator code for /admin. Once
 * Auth0 credentials are set, Auth0 takes over and this switches itself off.
 */

export const emailLoginEnabled = () =>
  !isAuth0Configured() && isDatabaseConfigured() && emailConfigured() && Boolean(process.env.CRM_SESSION_SECRET);

const secret = () => process.env.CRM_SESSION_SECRET ?? "";
const CODE_TTL_MS = 10 * 60_000;
const RESEND_AFTER_MS = 30_000;
const MAX_TRIES = 5;

export const SESSION_COOKIE = "gm_session";
export const PENDING_COOKIE = "gm_login_email";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
export const sessionCookieOptions = { ...cookieBase, maxAge: SESSION_TTL_SECONDS };
export const pendingCookieOptions = { ...cookieBase, maxAge: CODE_TTL_MS / 1000 };

const keyFor = (email: string) => `login-code:${createHash("sha256").update(email).digest("hex")}`;
const hashCode = (email: string, code: string) => createHmac("sha256", secret()).update(`${email}:${code}`).digest("hex");

type Pending = { h: string; exp: number; tries: number; sentAt: number };

/** Emails a fresh code. False when one was sent under 30 seconds ago. */
export async function sendLoginCode(email: string): Promise<boolean> {
  const prisma = getPrisma();
  const key = keyFor(email);
  const row = await prisma.appSetting.findUnique({ where: { key } });
  const before = row ? (JSON.parse(row.value) as Pending) : null;
  if (before && Date.now() - before.sentAt < RESEND_AFTER_MS) return false;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const value = JSON.stringify({ h: hashCode(email, code), exp: Date.now() + CODE_TTL_MS, tries: 0, sentAt: Date.now() } satisfies Pending);
  await prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await sendNow(
    [email],
    `${code} is your Genesis Media sign-in code`,
    `Your sign-in code is ${code}\n\nIt works for 10 minutes. If you didn't ask for it, you can ignore this email.`,
  );
  return true;
}

/** Checks a code; a match is used up. */
export async function checkLoginCode(email: string, code: string): Promise<"ok" | "wrong" | "expired"> {
  const prisma = getPrisma();
  const key = keyFor(email);
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return "expired";
  const pending = JSON.parse(row.value) as Pending;
  if (pending.exp < Date.now() || pending.tries >= MAX_TRIES) {
    await prisma.appSetting.delete({ where: { key } }).catch(() => undefined);
    return "expired";
  }
  const given = hashCode(email, code.replace(/\D/g, ""));
  if (given.length === pending.h.length && timingSafeEqual(Buffer.from(given), Buffer.from(pending.h))) {
    await prisma.appSetting.delete({ where: { key } }).catch(() => undefined);
    return "ok";
  }
  await prisma.appSetting.update({ where: { key }, data: { value: JSON.stringify({ ...pending, tries: pending.tries + 1 }) } });
  return pending.tries + 1 >= MAX_TRIES ? "expired" : "wrong";
}

/** A signed value naming an email, with its expiry (the session, or the address waiting for its code). */
export function signEmail(email: string, ttlSeconds = SESSION_TTL_SECONDS): string {
  const body = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(`email-session:${body}`).digest("hex")}`;
}

export function readSignedEmail(value: string | undefined): string | null {
  if (!value || !secret()) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(`email-session:${body}`).digest("hex");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const { email, exp } = JSON.parse(Buffer.from(body, "base64url").toString()) as { email: string; exp: number };
  return exp > Date.now() / 1000 ? email : null;
}
