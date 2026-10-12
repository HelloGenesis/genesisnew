import "server-only";

import { getPrisma } from "@/lib/db";
import type { Division, InboxKind, InboxSource } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

import { aiConfigured, type Reading, readItem } from "./ai";
import { todayIst } from "./catalog";
import { google, GoogleAuthError, googleConfigured, googleText } from "./google";
import { notify } from "./notifications";
import { scanInfluencerSheets } from "./sheet-import";

/**
 * FROM GMAIL AND DRIVE INTO THE CRM (Genesis, 12 Oct 2026: "integrate our
 * current data … which will automatically add them to leads if there are any
 * briefs and give a notification, for individual users, and then the admins
 * can see all of it").
 *
 * Every few minutes, for each person who connected Google: the new mail in
 * their inbox and the documents changed in their Drive are read by the AI
 * (lib/crm/ai) and sorted.
 *
 *  - A BRIEF becomes a brief at once, on the client or open lead it comes
 *    from, or on a new lead owned by that person — and they're notified.
 *  - Client and vendor details, invoices, proposals and important links wait
 *    in their Inbox for one click (add the client, add the vendor, record the
 *    expense, keep the link on a client). Nothing but briefs is created on its
 *    own, so the CRM never fills with guesses.
 *  - Everything else is ignored and not stored: personal mail, newsletters,
 *    notifications. Only what was sorted into the CRM is kept.
 *
 * Owners and admins see everyone's inbox; everyone else sees their own.
 */

const OWN_DOMAIN = "genesismedia.co";
const PER_RUN = 20;
const FIRST_LOOK_DAYS = 21;
const SKIP_LABELS = ["SPAM", "TRASH", "DRAFT", "CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_UPDATES", "CATEGORY_FORUMS"];
const WORTH_IT = /invoice|bill|receipt|quotation|quote|proposal|brief|estimate|purchase order|\bpo\b|gst/i;

type Found = { source: InboxSource; userId: string; externalId: string; title: string; sender?: string; senderEmail?: string; url?: string; occurredAt: Date; links: string[]; reading: Reading };

/* --- Text helpers ----------------------------------------------------------- */

const decode = (data?: string) => (data ? Buffer.from(data, "base64url").toString("utf8") : "");
const stripHtml = (html: string) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

/** The links worth keeping: no tracking pixels, unsubscribes or images. */
export function usefulLinks(text: string): string[] {
  const all = text.match(/https?:\/\/[^\s<>"')\]]+/g) ?? [];
  return [...new Set(all.map((l) => l.replace(/[.,;:]+$/, "")))]
    .filter((l) => !/unsubscribe|list-manage|mailchi\.mp|click\.|track|pixel|\.(png|jpe?g|gif)(\?|$)|googleusercontent|gstatic|schemas\.|w3\.org/i.test(l))
    .slice(0, 25);
}

const emailOf = (from: string) => from.match(/<([^>]+)>/)?.[1]?.toLowerCase() ?? (from.includes("@") ? from.trim().toLowerCase() : undefined);
const nameOf = (from: string) => from.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || undefined;

/* --- Gmail ------------------------------------------------------------------ */

type GmailPart = { mimeType?: string; filename?: string; body?: { data?: string; attachmentId?: string }; parts?: GmailPart[] };
type GmailMessage = { id: string; threadId: string; labelIds?: string[]; internalDate: string; payload: GmailPart & { headers?: { name: string; value: string }[] } };

function bodyText(part: GmailPart): { plain: string; html: string; files: string[] } {
  const out = { plain: "", html: "", files: [] as string[] };
  const walk = (p: GmailPart) => {
    if (p.filename) out.files.push(p.filename);
    else if (p.mimeType === "text/plain" && p.body?.data) out.plain += decode(p.body.data) + "\n";
    else if (p.mimeType === "text/html" && p.body?.data) out.html += decode(p.body.data) + "\n";
    p.parts?.forEach(walk);
  };
  walk(part);
  return out;
}

async function readGmailMessage(userId: string, id: string, ownEmail: string): Promise<Found | null> {
  const prisma = getPrisma();
  if (await prisma.inboxItem.findUnique({ where: { dedupeKey: `GMAIL:${userId}:${id}` }, select: { id: true } })) return null;
  const message = await google<GmailMessage>(userId, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`);
  const labels = message.labelIds ?? [];
  if (labels.some((l) => SKIP_LABELS.includes(l))) return null;
  const header = (name: string) => message.payload.headers?.find((h) => h.name.toLowerCase() === name)?.value ?? "";
  const from = header("from");
  const subject = header("subject") || "(no subject)";
  const sender = emailOf(from);
  if (!sender || sender === ownEmail) return null;
  /* Our own team writing to each other is not a brief, unless it's one forwarded in. */
  if (sender.endsWith(`@${OWN_DOMAIN}`) && !/^(fwd?|fw):/i.test(subject)) return null;
  /* Newsletters and machines, unless it looks like a bill or a brief. */
  const bulk = Boolean(header("list-unsubscribe")) || /no-?reply|notifications?@|mailer-daemon/i.test(sender);
  if (bulk && !WORTH_IT.test(subject)) return null;

  const { plain, html, files } = bodyText(message.payload);
  const text = (plain.trim() || stripHtml(html)).slice(0, 15_000);
  const links = usefulLinks(`${plain}\n${html}`);
  const reading = await readItem({ source: "Gmail", from, to: header("to"), subject, date: header("date"), text, links, attachments: files });
  if (!reading) return null;
  return {
    source: "GMAIL",
    userId,
    externalId: id,
    title: subject,
    sender: nameOf(from),
    senderEmail: sender,
    url: `https://mail.google.com/mail/u/${encodeURIComponent(ownEmail)}/#all/${message.threadId}`,
    occurredAt: new Date(Number(message.internalDate)),
    links: [...new Set([...(reading.links?.map((l) => l.url) ?? []), ...links])].slice(0, 25),
    reading,
  };
}

async function syncGmail(userId: string, ownEmail: string, cursor: string | null): Promise<{ cursor: string | null; found: Found[] }> {
  const base = "https://gmail.googleapis.com/gmail/v1/users/me";
  let ids: string[] = [];
  let next = cursor;
  if (cursor) {
    try {
      const history = await google<{ history?: { messagesAdded?: { message: { id: string; labelIds?: string[] } }[] }[]; historyId: string }>(
        userId,
        `${base}/history?startHistoryId=${cursor}&historyTypes=messageAdded&labelId=INBOX&maxResults=200`,
      );
      ids = [...new Set((history.history ?? []).flatMap((h) => h.messagesAdded ?? []).map((m) => m.message.id))];
      next = history.historyId;
    } catch (error) {
      /* An old cursor Google no longer keeps: look again over the last few weeks (already-sorted mail is skipped). */
      if ((error as { status?: number }).status !== 404) throw error;
      next = null;
    }
  }
  if (!next) {
    const profile = await google<{ historyId: string }>(userId, `${base}/profile`);
    const list = await google<{ messages?: { id: string }[] }>(userId, `${base}/messages?maxResults=60&q=${encodeURIComponent(`in:inbox newer_than:${FIRST_LOOK_DAYS}d -category:promotions -category:social -category:updates -category:forums`)}`);
    ids = (list.messages ?? []).map((m) => m.id).reverse();
    next = profile.historyId;
  }
  const found: Found[] = [];
  for (const id of ids.slice(0, PER_RUN)) {
    try {
      const item = await readGmailMessage(userId, id, ownEmail);
      if (item) found.push(item);
    } catch (error) {
      if (error instanceof GoogleAuthError) throw error;
      console.error("[crm] gmail message skipped", id, (error as Error).message);
    }
  }
  return { cursor: next, found };
}

/* --- Drive ------------------------------------------------------------------ */

const DOC_TYPES: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
  "application/pdf": "",
};

type DriveFile = { id: string; name: string; mimeType: string; webViewLink?: string; modifiedTime: string; owners?: { emailAddress?: string; displayName?: string }[]; lastModifyingUser?: { emailAddress?: string; displayName?: string } };

async function syncDrive(userId: string, since: Date | null): Promise<{ cursor: Date | null; found: Found[] }> {
  const from = since ?? new Date(Date.now() - FIRST_LOOK_DAYS * 864e5);
  const types = Object.keys(DOC_TYPES).map((t) => `mimeType='${t}'`).join(" or ");
  const q = `modifiedTime > '${from.toISOString()}' and trashed = false and (${types})`;
  const list = await google<{ files?: DriveFile[] }>(
    userId,
    `https://www.googleapis.com/drive/v3/files?pageSize=${PER_RUN}&orderBy=modifiedTime&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=allDrives&q=${encodeURIComponent(q)}&fields=${encodeURIComponent("files(id,name,mimeType,webViewLink,modifiedTime,owners(emailAddress,displayName),lastModifyingUser(emailAddress,displayName))")}`,
  );
  const prisma = getPrisma();
  const found: Found[] = [];
  let cursor = since;
  for (const file of list.files ?? []) {
    cursor = new Date(file.modifiedTime);
    if (await prisma.inboxItem.findUnique({ where: { dedupeKey: `DRIVE:${userId}:${file.id}` }, select: { id: true } })) continue;
    const exportAs = DOC_TYPES[file.mimeType];
    /* A PDF is judged by its name alone (no text to read), and only when the name says it matters. */
    if (!exportAs && !WORTH_IT.test(file.name)) continue;
    let text = "";
    try {
      if (exportAs) text = await googleText(userId, `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportAs)}`, 15_000);
    } catch (error) {
      console.error("[crm] drive export skipped", file.id, (error as Error).message);
      continue;
    }
    const owner = file.owners?.[0];
    const reading = await readItem({ source: "Google Drive", from: owner ? `${owner.displayName ?? ""} <${owner.emailAddress ?? ""}>` : undefined, subject: file.name, date: file.modifiedTime, text, links: usefulLinks(text) });
    if (!reading) continue;
    const ownerEmail = owner?.emailAddress?.toLowerCase();
    found.push({
      source: "DRIVE",
      userId,
      externalId: file.id,
      title: file.name,
      sender: owner?.displayName,
      senderEmail: ownerEmail,
      url: file.webViewLink,
      occurredAt: new Date(file.modifiedTime),
      links: [...new Set([...(file.webViewLink ? [file.webViewLink] : []), ...(reading.links?.map((l) => l.url) ?? []), ...usefulLinks(text)])].slice(0, 25),
      reading,
    });
  }
  return { cursor, found };
}

/* --- Into the CRM ------------------------------------------------------------- */

const DIVISIONS = ["AI_LAB", "STUDIOS", "BRAND_DESIGN", "INFLUENCE"];
const rupees = (n?: number) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null);
const isoDay = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : null);

/** The client or open lead someone belongs to, by their email (or their company's domain, for a client). */
async function whoIs(email?: string | null) {
  if (!email || email.endsWith(`@${OWN_DOMAIN}`)) return { accountId: null, leadId: null };
  const prisma = getPrisma();
  const lead = await prisma.lead.findFirst({ where: { email, status: { notIn: ["WON", "LOST"] } }, orderBy: { createdAt: "desc" }, select: { id: true, accountId: true } });
  const member = await prisma.accountMember.findFirst({ where: { user: { email } }, select: { accountId: true } });
  const account = member ?? (await prisma.account.findFirst({ where: { email }, select: { id: true } }).then((a) => (a ? { accountId: a.id } : null)));
  return { accountId: account?.accountId ?? lead?.accountId ?? null, leadId: lead?.id ?? null };
}

/** Files what was found: briefs straight into the CRM, the rest into the Inbox. Returns how many briefs were made. */
async function file(found: Found): Promise<boolean> {
  const prisma = getPrisma();
  const r = found.reading;
  if (r.kind === "OTHER" || (r.confidence ?? 0) < 0.5) return false;
  const contactEmail = (r.contact?.email ?? found.senderEmail)?.toLowerCase() ?? null;
  const who = await whoIs(contactEmail);
  const item = await prisma.inboxItem.create({
    data: {
      dedupeKey: `${found.source}:${found.userId}:${found.externalId}`,
      userId: found.userId,
      source: found.source,
      externalId: found.externalId,
      kind: r.kind as InboxKind,
      confidence: r.confidence,
      title: found.title.slice(0, 300),
      sender: found.sender?.slice(0, 160),
      senderEmail: found.senderEmail,
      summary: r.summary?.slice(0, 1000),
      url: found.url,
      links: found.links,
      data: r as unknown as Prisma.InputJsonValue,
      occurredAt: found.occurredAt,
      accountId: who.accountId,
      leadId: who.leadId,
    },
  });
  if (r.kind !== "BRIEF" || (r.confidence ?? 0) < 0.6) {
    if (["CLIENT", "VENDOR", "INVOICE"].includes(r.kind)) {
      await notify([found.userId], { title: `${r.kind === "INVOICE" ? "Invoice" : r.kind === "CLIENT" ? "Client details" : "Vendor details"} found: ${found.title.slice(0, 80)}`, body: r.summary, href: `/admin/inbox?item=${item.id}` });
    }
    return false;
  }

  /* A brief: on the client, on their open lead, or on a new lead for this person. */
  const b = r.brief ?? {};
  const c = r.contact ?? {};
  let leadId = who.leadId;
  if (!leadId && !who.accountId) {
    const lead = await prisma.lead.create({
      data: {
        name: (c.name ?? found.sender ?? c.company ?? contactEmail ?? "New brief").slice(0, 120),
        email: contactEmail,
        phone: c.phone?.slice(0, 30) ?? null,
        company: (c.company ?? r.company?.name)?.slice(0, 160) ?? null,
        designation: c.role?.slice(0, 120) ?? null,
        division: b.division && DIVISIONS.includes(b.division) ? (b.division as Division) : null,
        interest: (b.services?.join(", ") || b.title)?.slice(0, 200) ?? null,
        source: found.source === "GMAIL" ? "EMAIL" : "GOOGLE_DRIVE",
        ownerId: found.userId,
        createdById: found.userId,
        nextFollowUp: new Date(todayIst()),
        valuePaise: rupees(b.budgetRupees) ?? 0,
        notes: [r.summary, found.url ? `Source: ${found.url}` : ""].filter(Boolean).join("\n\n"),
      },
    });
    leadId = lead.id;
  }
  const brief = await prisma.brief.create({
    data: {
      title: (b.title ?? found.title).slice(0, 200),
      leadId: who.accountId && !leadId ? null : leadId,
      accountId: who.accountId,
      division: b.division && DIVISIONS.includes(b.division) ? (b.division as Division) : null,
      services: (b.services ?? []).slice(0, 12),
      objective: b.objective ?? null,
      audience: b.audience ?? null,
      deliverables: b.deliverables ?? null,
      platforms: (b.platforms ?? []).slice(0, 12),
      budgetPaise: rupees(b.budgetRupees),
      deadline: isoDay(b.deadline),
      references: found.links.slice(0, 10),
      notes: [r.summary, `Found in ${found.source === "GMAIL" ? "Gmail" : "Google Drive"}: “${found.title}”${found.url ? `\n${found.url}` : ""}`].filter(Boolean).join("\n\n"),
      createdById: found.userId,
    },
  });
  if (leadId) await prisma.activity.create({ data: { leadId, kind: found.source === "GMAIL" ? "EMAIL" : "NOTE", actorId: found.userId, body: `Brief found in ${found.source === "GMAIL" ? "Gmail" : "Drive"}: ${found.title}` } }).catch(() => undefined);
  await prisma.inboxItem.update({ where: { id: item.id }, data: { status: "DONE", leadId, briefId: brief.id } });
  const company = c.company ?? r.company?.name ?? found.sender ?? contactEmail ?? "someone";
  await notify([found.userId], {
    title: `New brief from ${company}`,
    body: `${r.summary}\n\nAdded to ${who.accountId ? "the client" : who.leadId ? "their open lead" : "a new lead (yours)"} — check it and send a quote.`,
    href: `/admin/briefs/${brief.id}`,
    email: true,
    dedupeKey: `brief-found:${item.id}`,
  });
  return true;
}

/** One person's Gmail and Drive, once. */
export async function syncPerson(userId: string) {
  const prisma = getPrisma();
  const conn = await prisma.googleConnection.findUnique({ where: { userId } });
  if (!conn || conn.status === "REVOKED") return { skipped: "not connected" };
  if (!aiConfigured()) return { skipped: "ANTHROPIC_API_KEY not set" };
  try {
    const gmail = await syncGmail(userId, conn.email, conn.gmailCursor);
    const drive = await syncDrive(userId, conn.driveCursor);
    let briefs = 0;
    let filed = 0;
    for (const found of [...gmail.found, ...drive.found].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())) {
      try {
        if (await file(found)) briefs += 1;
        if (found.reading.kind !== "OTHER") filed += 1;
      } catch (error) {
        console.error("[crm] could not file", found.externalId, (error as Error).message);
      }
    }
    await prisma.googleConnection.update({ where: { userId }, data: { gmailCursor: gmail.cursor, driveCursor: drive.cursor, lastSyncAt: new Date(), lastError: null, status: "ACTIVE" } });
    return { briefs, filed };
  } catch (error) {
    const message = String((error as Error).message).slice(0, 300);
    await prisma.googleConnection.update({ where: { userId }, data: { lastError: message, lastSyncAt: new Date() } }).catch(() => undefined);
    return { error: message };
  }
}

/** The scheduled run: everyone connected, each at most every five minutes, a few people a minute. */
export async function syncGoogle() {
  if (!googleConfigured()) return { skipped: "Google OAuth not configured" };
  if (!aiConfigured()) return { skipped: "ANTHROPIC_API_KEY not set" };
  const due = await getPrisma().googleConnection.findMany({
    where: { status: "ACTIVE", OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: new Date(Date.now() - 5 * 60_000) } }] },
    orderBy: { lastSyncAt: { sort: "asc", nulls: "first" } },
    take: 3,
  });
  const report: Record<string, unknown> = {};
  const started = Date.now();
  for (const conn of due) {
    /* Inside the job's five minutes: nobody new is started after three. */
    if (Date.now() - started > 180_000) break;
    report[conn.email] = await syncPerson(conn.userId);
    /* Their Drive's influencer sheets, once a day (lib/crm/sheet-import). */
    if (Date.now() - started < 200_000) report[`${conn.email} influencers`] = await scanInfluencerSheets(conn.userId).catch((error: Error) => ({ error: error.message.slice(0, 200) }));
  }
  return report;
}
