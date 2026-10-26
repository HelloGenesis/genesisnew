import "server-only";

import { getPrisma } from "@/lib/db";
import { parseServiceAccount } from "@/lib/google-drive";
import { column, ensureTab, getSheets, isSheetsConfigured } from "@/lib/google-sheets";

import { activeWorkspace } from "./request-workspace";
import { companyConnection, companyToken } from "./google";

import { ACCOUNT_KIND, DIVISION_LABEL, LEAD_SOURCE, LEAD_STATUS, ORDER_STATUS, PROJECT_STATUS, REQUEST_KIND, REQUEST_STATUS, SUBSCRIPTION_STATUS, projectRef, requestRef } from "./catalog";
import { stageName } from "@/lib/crm/stages";

/**
 * THE CRM, MIRRORED LIVE TO GOOGLE SHEETS (as genesis-coworking's mirror).
 *
 * The database is the record; the spreadsheet is a copy the team can share,
 * filter and pivot. A change queues its row's key (`queueSheet`); the job
 * runner sends each queued row's CURRENT state, updating the row with that key
 * in place or appending it. A deleted record is marked "Deleted" rather than
 * removed, so nobody's filter or formula shifts under them.
 *
 * Same spreadsheet and service account as the website forms
 * (GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_JSON), or CRM_SHEETS_ID for a
 * separate one. Tabs are created on first use.
 */

export type SheetTabKey = "leads" | "accounts" | "orders" | "payments" | "projects" | "requests" | "creators" | "invoices" | "quotes" | "briefs" | "expenses";

const TITLES: Record<SheetTabKey, string> = {
  leads: "CRM Leads",
  accounts: "CRM Accounts",
  orders: "CRM Orders",
  payments: "CRM Payments",
  projects: "CRM Projects",
  requests: "CRM Requests",
  creators: "CRM Influencers",
  invoices: "CRM Invoices",
  quotes: "CRM Quotes",
  briefs: "CRM Briefs",
  expenses: "CRM Expenses",
};

/**
 * ONE GOOGLE SHEET PER THING (Genesis, 12 Oct 2026: "dedicated Google Sheets
 * linked to each thing, like leads, influencers and invoices, updated in real
 * time"). Each is its own spreadsheet in the company Drive, "Genesis CRM ·
 * Leads" and so on, made the first time it's needed and shared with the
 * website's service account (which writes the rows) and the super admins
 * (everyone's data is in it). Rows follow the CRM within a minute. Until the
 * company account has connected Google, they stay tabs in the forms sheet.
 */
export const SHEET_NAMES: Record<SheetTabKey, string> = {
  leads: "Leads",
  accounts: "Clients",
  orders: "Orders",
  payments: "Payments",
  projects: "Projects",
  requests: "Requests",
  creators: "Influencers",
  invoices: "Invoices",
  quotes: "Quotes",
  briefs: "Briefs",
  expenses: "Expenses",
};

/** The dedicated spreadsheet for a kind, made and shared on first use. Null until the company account can create files. */
export async function dedicatedSheet(tab: SheetTabKey): Promise<string | null> {
  const prisma = getPrisma();
  const key = `sheet:${tab}`;
  const known = await prisma.appSetting.findUnique({ where: { key } });
  if (known) return known.value;
  if (!(await companyConnection())) return null;
  const token = await companyToken();
  const created = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties: { title: `Genesis CRM · ${SHEET_NAMES[tab]}` }, sheets: [{ properties: { title: SHEET_NAMES[tab], gridProperties: { frozenRowCount: 1 } } }] }),
  }).then((r) => r.json() as Promise<{ spreadsheetId?: string; error?: { message?: string } }>);
  if (!created.spreadsheetId) throw new Error(`Couldn't create the ${SHEET_NAMES[tab]} sheet: ${created.error?.message ?? "unknown"}`);
  await prisma.appSetting.create({ data: { key, value: created.spreadsheetId } });
  await shareDedicated(tab, created.spreadsheetId);
  await backfill(tab);
  return created.spreadsheetId;
}

/** The service account writes; super admins (Owners) can open and edit. Re-run when someone becomes a super admin. */
async function shareDedicated(tab: SheetTabKey, id: string) {
  const prisma = getPrisma();
  const sharedKey = `sheet-shared:${tab}`;
  const already = new Set((await prisma.appSetting.findUnique({ where: { key: sharedKey } }))?.value.split(",") ?? []);
  const owners = await prisma.staffRole.findMany({ where: { role: "OWNER" }, select: { user: { select: { email: true } } } });
  const robot = parseServiceAccount(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "").client_email;
  const wanted = [robot, ...owners.map((o) => o.user.email).filter((e): e is string => Boolean(e))].map((e) => e.toLowerCase());
  const missing = wanted.filter((e) => !already.has(e));
  if (missing.length === 0) return;
  const token = await companyToken();
  for (const email of missing) {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user", role: "writer", emailAddress: email }),
    });
    if (r.ok) already.add(email);
  }
  const value = [...already].join(",");
  await prisma.appSetting.upsert({ where: { key: sharedKey }, create: { key: sharedKey, value }, update: { value } });
}

/** Everything of that kind, queued for its new sheet. */
async function backfill(tab: SheetTabKey) {
  const prisma = getPrisma();
  const pick = { select: { id: true }, take: 20000 } as const;
  /* Only Genesis's own records, never an agency CRM's. */
  const own = { ...pick, where: { workspaceId: null } } as const;
  const ids: { id: string }[] =
    tab === "leads" ? await prisma.lead.findMany(own)
    : tab === "accounts" ? await prisma.account.findMany(own)
    : tab === "orders" ? await prisma.order.findMany(pick)
    : tab === "payments" ? await prisma.payment.findMany(pick)
    : tab === "projects" ? await prisma.project.findMany(own)
    : tab === "requests" ? await prisma.request.findMany(own)
    : tab === "creators" ? await prisma.creator.findMany(own)
    : tab === "invoices" ? await prisma.invoice.findMany(own)
    : tab === "quotes" ? await prisma.quote.findMany(own)
    : tab === "briefs" ? await prisma.brief.findMany(own)
    : await prisma.expense.findMany(pick);
  for (const { id } of ids) await queueSheet(tab, id);
}

/** The sheet's link, for the "Open in Google Sheets" buttons. */
export async function sheetUrl(tab: SheetTabKey) {
  const id = (await getPrisma().appSetting.findUnique({ where: { key: `sheet:${tab}` } }))?.value;
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
}

/*
  Development never writes to the live forms spreadsheet: locally the mirror
  needs CRM_SHEETS_ID set to a test sheet. (A local run once mirrored demo
  rows into the real sheet through GOOGLE_SHEETS_ID in .env.local.)
*/
const spreadsheetId = () =>
  (process.env.CRM_SHEETS_ID || (process.env.NODE_ENV === "production" ? process.env.GOOGLE_SHEETS_ID : "") || "").trim();
export const crmSheetsConfigured = () => Boolean(spreadsheetId()) && isSheetsConfigured();

/** Marks a record's row as changed; the next sync writes its current state. */
export async function queueSheet(tab: SheetTabKey, key: string, deleted = false) {
  /* Genesis's live sheets are Genesis's: an agency CRM's records never go into them (lib/crm/workspace). */
  if (typeof (await activeWorkspace()) === "string") return;
  await getPrisma()
    .sheetOutbox.upsert({
      where: { tab_key: { tab, key } },
      create: { tab, key, deleted },
      update: { deleted, changedAt: new Date(), sentAt: null, attempts: 0, lastError: null },
    })
    .catch(() => undefined);
}

type Cells = Record<string, string | number>;

const rs = (paise: number | null | undefined) => (paise === null || paise === undefined ? "" : paise / 100);
const ist = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" }).format(d) : "";
const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

/** The row for each key, column order = key order. */
const BUILDERS: Record<SheetTabKey, (keys: string[]) => Promise<Map<string, Cells>>> = {
  async leads(keys) {
    const rows = await getPrisma().lead.findMany({ where: { id: { in: keys } }, include: { owner: true, partner: true } });
    return new Map(rows.map((l) => [l.id, {
      Added: ist(l.createdAt), Name: l.name, Company: l.company ?? "", Email: l.email ?? "", Phone: l.phone ?? "",
      Division: l.division ? DIVISION_LABEL[l.division] : "", Interest: l.interest ?? "", Source: LEAD_SOURCE[l.source],
      Partner: l.partner?.name ?? "", Status: LEAD_STATUS[l.status].label, "Value (₹)": rs(l.valuePaise), Owner: l.owner?.name ?? l.owner?.email ?? "",
      "Next follow-up": day(l.nextFollowUp), Notes: l.notes ?? "", Updated: ist(l.updatedAt),
    }]));
  },
  async accounts(keys) {
    const rows = await getPrisma().account.findMany({ where: { id: { in: keys } }, include: { manager: true, parent: true, referredBy: true } });
    return new Map(rows.map((a) => [a.id, {
      Name: a.name, Type: ACCOUNT_KIND[a.kind] + (a.isReseller ? " (reseller)" : ""), Status: a.status, Agency: a.parent?.name ?? "",
      "Referred by": a.referredBy?.name ?? "", Email: a.email ?? "", Phone: a.phone ?? "", GSTIN: a.gstin ?? "", City: a.city ?? "",
      Manager: a.manager?.name ?? a.manager?.email ?? "", Added: ist(a.createdAt),
    }]));
  },
  async orders(keys) {
    const rows = await getPrisma().order.findMany({ where: { id: { in: keys } }, include: { lines: true, account: true, partner: true } });
    return new Map(rows.map((o) => [o.id, {
      Reference: o.reference, Created: ist(o.createdAt), Status: ORDER_STATUS[o.status].label, Channel: o.channel,
      Client: o.account?.name ?? o.company ?? "", Contact: `${o.contactName} · ${o.contactEmail}${o.contactPhone ? ` · ${o.contactPhone}` : ""}`,
      Items: o.lines.map((l) => `${l.name}${l.qty > 1 ? ` ×${l.qty}` : ""}`).join("; "), Billing: o.billing ?? "Pay-per-project",
      "Subtotal (₹)": rs(o.subtotalPaise), "Discounts (₹)": rs(o.discountPaise + o.comboDiscountPaise), "Tax (₹)": rs(o.taxPaise), "Total (₹)": rs(o.totalPaise),
      Partner: o.partner?.name ?? "", "Paid at": ist(o.paidAt), Razorpay: [o.razorpayPaymentId, o.razorpaySubscriptionId, o.razorpayLinkId].filter(Boolean).join(" · "),
    }]));
  },
  async payments(keys) {
    const rows = await getPrisma().payment.findMany({ where: { id: { in: keys } }, include: { account: true, order: true, subscription: true } });
    return new Map(rows.map((p) => [p.id, {
      "Paid at": ist(p.paidAt), Client: p.account?.name ?? "", For: p.subscription ? `Subscription (${p.subscription.billing ?? ""})` : `Order ${p.order?.reference ?? ""}`,
      Status: p.status, "Amount (₹)": rs(p.amountPaise), Method: p.method ?? "", "Razorpay payment": p.razorpayId, Invoice: p.invoiceUrl ?? "",
      Subscription: p.subscription ? SUBSCRIPTION_STATUS[p.subscription.status].label : "",
    }]));
  },
  async projects(keys) {
    const rows = await getPrisma().project.findMany({ where: { id: { in: keys } }, include: { account: true, manager: true, _count: { select: { deliverables: { where: { status: "APPROVED" } } } } } });
    return new Map(rows.map((p) => [p.id, {
      Ref: projectRef(p.number), Project: p.name, Client: p.account.name, Division: DIVISION_LABEL[p.division], Stage: stageName(p),
      Status: PROJECT_STATUS[p.status].label, Delivered: p.quota ? `${p._count.deliverables} of ${p.quota}` : String(p._count.deliverables),
      Manager: p.manager?.name ?? p.manager?.email ?? "", Due: day(p.dueDate), Updated: ist(p.updatedAt),
    }]));
  },
  /* The influencer database, one row per creator, kept in step with the CRM (Genesis, 12 Oct 2026: "connect it to google sheets"). */
  async creators(keys) {
    const rows = await getPrisma().creator.findMany({ where: { id: { in: keys } } });
    return new Map(rows.map((c) => [c.id, {
      Name: c.name, Handle: `@${c.handle}`, Platform: c.platform, Profile: c.profileUrl ?? "", Followers: c.followers, "Avg views": c.avgViews ?? "",
      "Engagement %": c.engagementRate ?? "", Tier: c.tier, Niches: c.niches.join(", "), Languages: c.languages.join(", "), City: c.city ?? "", Gender: c.gender ?? "",
      "Reel (₹)": rs(c.reelRatePaise), "Story (₹)": rs(c.storyRatePaise), "Post (₹)": rs(c.postRatePaise), Email: c.email ?? "", Phone: c.phone ?? "",
      "Managed by": c.managedBy ?? "", "Do not work with": c.blacklisted ? "Yes" : "", Notes: c.notes ?? "", Updated: ist(c.updatedAt),
    }]));
  },
  async invoices(keys) {
    const rows = await getPrisma().invoice.findMany({ where: { id: { in: keys } } });
    return new Map(rows.map((i) => [i.id, {
      Number: i.number, Date: day(i.issueDate), Due: day(i.dueDate), Status: i.status, "Billed to": i.billToName, GSTIN: i.billToGstin ?? "", Email: i.billToEmail ?? "",
      "Place of supply": i.placeOfSupply, "Taxable (₹)": rs(i.subtotalPaise - i.discountPaise), "CGST (₹)": rs(i.cgstPaise), "SGST (₹)": rs(i.sgstPaise), "IGST (₹)": rs(i.igstPaise),
      "Total (₹)": rs(i.totalPaise), Paid: ist(i.paidAt), Link: i.paymentUrl ?? "",
    }]));
  },
  async quotes(keys) {
    const rows = await getPrisma().quote.findMany({ where: { id: { in: keys } } });
    return new Map(rows.map((q) => [q.id, {
      Number: `#${String(q.number).padStart(7, "0")}`, Kind: q.kind === "INFLUENCER_PLAN" ? "Influencer plan" : "Quote", Title: q.title, Client: q.company ?? q.contactName,
      Email: q.contactEmail, Status: q.status, "Total (₹)": rs(q.totalPaise), Issued: ist(q.issuedAt), Sent: ist(q.sentAt), Accepted: ist(q.acceptedAt), Expires: day(q.expiresAt),
    }]));
  },
  async briefs(keys) {
    const rows = await getPrisma().brief.findMany({ where: { id: { in: keys } } });
    return new Map(rows.map((b) => [b.id, {
      Ref: `B-${String(b.number).padStart(4, "0")}`, Title: b.title, Division: b.division ? DIVISION_LABEL[b.division] : "", Services: b.services.join(", "), Platforms: b.platforms.join(", "),
      "Budget (₹)": rs(b.budgetPaise), "Needed by": day(b.deadline), Objective: b.objective ?? "", Deliverables: b.deliverables ?? "", Status: b.status, Added: ist(b.createdAt),
    }]));
  },
  async expenses(keys) {
    const rows = await getPrisma().expense.findMany({ where: { id: { in: keys } } });
    return new Map(rows.map((e) => [e.id, {
      Date: day(e.date), Category: e.category, What: e.description, "Paid to": e.payee ?? "", "Paid via": e.paidVia ?? "", "Amount (₹)": rs(e.amountPaise), "GST (₹)": rs(e.gstPaise), Reference: e.reference ?? "",
    }]));
  },
  async requests(keys) {
    const rows = await getPrisma().request.findMany({ where: { id: { in: keys } }, include: { account: true, assignee: true } });
    return new Map(rows.map((r) => [r.id, {
      Ref: requestRef(r.number), Opened: ist(r.createdAt), Client: r.account.name, Type: REQUEST_KIND[r.kind], Title: r.title,
      Status: REQUEST_STATUS[r.status].label, Priority: r.priority, Assignee: r.assignee?.name ?? r.assignee?.email ?? "", Closed: ist(r.closedAt),
    }]));
  },
};

/** Writes up to `limit` queued rows. Safe to overlap; rows changed mid-send stay queued. */
export async function syncSheets(limit = 200) {
  if (!isSheetsConfigured()) return { skipped: "Google Sheets not configured" };
  const prisma = getPrisma();
  const claimedAt = new Date();
  const pending = await prisma.sheetOutbox.findMany({ where: { sentAt: null, attempts: { lt: 8 } }, orderBy: { changedAt: "asc" }, take: limit });
  if (pending.length === 0) return { sent: 0 };
  await prisma.sheetOutbox.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { attempts: { increment: 1 } } });

  const sheets = getSheets();
  let sent = 0;
  for (const tab of Object.keys(BUILDERS) as SheetTabKey[]) {
    const items = pending.filter((p) => p.tab === tab);
    if (!items.length) continue;
    try {
      /* Its own spreadsheet when the company Drive can make one; a tab in the forms sheet until then. */
      const dedicated = await dedicatedSheet(tab).catch((error: Error) => {
        console.error("[crm] dedicated sheet", tab, error.message);
        return null;
      });
      const id = dedicated ?? spreadsheetId();
      if (!id) continue;
      const title = dedicated ? SHEET_NAMES[tab] : TITLES[tab];
      const live = await BUILDERS[tab](items.filter((i) => !i.deleted).map((i) => i.key));
      await ensureTab(id, title);
      const existing = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `'${title}'!A:A` });
      const keyColumn = (existing.data.values ?? []).map((row) => String(row[0] ?? ""));
      const sample = [...live.values()][0];
      const header = ["Key", ...(sample ? Object.keys(sample) : []), "Deleted"];
      const updates: { range: string; values: (string | number)[][] }[] = [];
      if (keyColumn.length === 0 && sample) updates.push({ range: `'${title}'!A1`, values: [header] });
      const appends: (string | number)[][] = [];
      for (const item of items) {
        const cells = live.get(item.key);
        const row = cells ? [item.key, ...Object.values(cells), ""] : [item.key, "Deleted"];
        const at = keyColumn.indexOf(item.key);
        if (at >= 0) updates.push({ range: `'${title}'!A${at + 1}:${column(row.length)}${at + 1}`, values: [row] });
        else if (cells) appends.push(row);
      }
      if (updates.length) await sheets.spreadsheets.values.batchUpdate({ spreadsheetId: id, requestBody: { valueInputOption: "RAW", data: updates } });
      if (appends.length)
        await sheets.spreadsheets.values.append({ spreadsheetId: id, range: `'${title}'!A:A`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values: appends } });
      await prisma.sheetOutbox.updateMany({ where: { id: { in: items.map((i) => i.id) }, changedAt: { lte: claimedAt } }, data: { sentAt: new Date(), lastError: null } });
      sent += items.length;
    } catch (error) {
      await prisma.sheetOutbox.updateMany({ where: { id: { in: items.map((i) => i.id) } }, data: { lastError: String((error as Error).message).slice(0, 500) } });
    }
  }
  return { sent };
}

/**
 * Influencers, invoices, quotes, briefs and expenses changed since the last
 * run are queued for their sheets (the other kinds are queued where they
 * change). Cheap to call each minute; also keeps the super admins shared in.
 */
export async function mirrorCreators() {
  if (!isSheetsConfigured()) return { skipped: "Google Sheets not configured" };
  const prisma = getPrisma();
  const key = "creators-mirror-at";
  const since = await prisma.appSetting.findUnique({ where: { key } }).then((r) => (r ? new Date(r.value) : new Date(0)));
  const now = new Date();
  const changed = { updatedAt: { gt: since } };
  const pick = { select: { id: true }, take: 2000 } as const;
  const [creators, invoices, quotes, briefs, expenses] = await Promise.all([
    prisma.creator.findMany({ where: changed, ...pick }),
    prisma.invoice.findMany({ where: changed, ...pick }),
    prisma.quote.findMany({ where: changed, ...pick }),
    prisma.brief.findMany({ where: changed, ...pick }),
    prisma.expense.findMany({ where: { createdAt: { gt: since } }, ...pick }),
  ]);
  for (const c of creators) await queueSheet("creators", c.id);
  for (const c of invoices) await queueSheet("invoices", c.id);
  for (const c of quotes) await queueSheet("quotes", c.id);
  for (const c of briefs) await queueSheet("briefs", c.id);
  for (const c of expenses) await queueSheet("expenses", c.id);
  await prisma.appSetting.upsert({ where: { key }, create: { key, value: now.toISOString() }, update: { value: now.toISOString() } });
  /* New super admins get the sheets too (a database read; Google only when someone's missing). */
  const made = await prisma.appSetting.findMany({ where: { key: { startsWith: "sheet:" } } });
  for (const row of made) await shareDedicated(row.key.slice(6) as SheetTabKey, row.value).catch(() => undefined);
  return { queued: creators.length + invoices.length + quotes.length + briefs.length + expenses.length };
}
