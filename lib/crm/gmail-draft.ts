import "server-only";

import { getPrisma } from "@/lib/db";

import { google } from "./google";
import type { Attachment } from "./notify";

/**
 * A DRAFT IN THE PERSON'S OWN GMAIL (Genesis, 31 Oct 2026: "put a draft in the
 * mail box for the user to customise it"), with the PDF attached. The CRM
 * never sends it: they open Drafts, change what they like and send it from
 * their own address. Needs Google's gmail.compose, granted when they connect
 * (or reconnect) Google in My settings.
 */
export class DraftAccessError extends Error {}

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64");
const wrap = (s: string) => s.replace(/.{1,76}/g, "$&\r\n");
/* Non-ASCII subjects and names as RFC 2047 words. */
const word = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

export async function canDraft(userId: string) {
  const conn = await getPrisma().googleConnection.findUnique({ where: { userId }, select: { status: true, scopes: true } });
  return Boolean(conn && conn.status === "ACTIVE" && conn.scopes.includes("gmail.compose"));
}

export async function gmailDraft(userId: string, mail: { to: string[]; subject: string; text: string; attachments?: Attachment[] }) {
  const conn = await getPrisma().googleConnection.findUnique({ where: { userId }, select: { email: true, status: true, scopes: true } });
  if (!conn || conn.status !== "ACTIVE") throw new DraftAccessError("Connect your Google account in My settings first.");
  if (!conn.scopes.includes("gmail.compose")) throw new DraftAccessError("Reconnect Google in My settings to let the CRM put drafts in your Gmail.");
  const boundary = `genesis-${crypto.randomUUID()}`;
  const parts = [
    `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(b64(mail.text))}`,
    ...(mail.attachments ?? []).map(
      (a) => `--${boundary}\r\nContent-Type: application/pdf; name="${a.filename}"\r\nContent-Disposition: attachment; filename="${a.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(a.content.toString("base64"))}`,
    ),
  ];
  const mime = [`To: ${mail.to.join(", ")}`, `Subject: ${word(mail.subject)}`, "MIME-Version: 1.0", `Content-Type: multipart/mixed; boundary="${boundary}"`, "", ...parts, `--${boundary}--`, ""].join("\r\n");
  /* The upload endpoint takes the raw message as it is, up to 35 MB. */
  const draft = await google<{ id: string; message: { id: string } }>(userId, "https://gmail.googleapis.com/upload/gmail/v1/users/me/drafts?uploadType=media", {
    method: "POST",
    headers: { "Content-Type": "message/rfc822" },
    body: mime,
  });
  return { url: `https://mail.google.com/mail/u/${encodeURIComponent(conn.email)}/#drafts?compose=${draft.message.id}`, account: conn.email };
}
