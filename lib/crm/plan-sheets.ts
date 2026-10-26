import "server-only";

import { getPrisma } from "@/lib/db";

import { contactVisibility } from "./creator-privacy";
import type { Viewer } from "./session";
import { COMPANY_ACCOUNT, companyToken, personFileToken } from "./google";
import { type Cell, type PlanColumns, type PlanInput, planTables, sharesSheet } from "./plan-tables";

/**
 * AN INFLUENCER PLAN AS GENESIS'S TWO GOOGLE SHEETS (Genesis, 12 Oct 2026,
 * after the IndusInd Nippon Life plan): an EXTERNAL one for the client — a
 * Summary and the Influencer Plan by tier, client prices only — and an
 * INTERNAL one for the team. The rows come from plan-tables (shared with the
 * Excel downloads).
 *
 * Made in the Drive of whoever makes them, when they connected Google with
 * file access (Genesis, 13 Oct 2026: "it should be connected with the user's
 * account itself"), else in the company account's; shared with the super
 * admins, the maker and the company account. "Update" rewrites both.
 */

const API = "https://sheets.googleapis.com/v4/spreadsheets";
const HEADER_FILL = { red: 1, green: 0.949, blue: 0.8 }; // #FFF2CC, as in Genesis's sheets
const GROUP_FILL = { red: 0.851, green: 0.918, blue: 0.827 };
type Meta = { sheets: { properties: { sheetId: number; title: string } }[] };

/* Text that would run as a formula is written as text. */
const safe = (v: Cell): Cell => (typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : v);
const rupees = (p: number | null | undefined) => (p === null || p === undefined ? null : Math.round(p) / 100);

async function call<T>(token: string, url: string, body?: unknown, method = "POST"): Promise<T> {
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok) throw new Error(json.error?.message ?? `Google ${r.status}`);
  return json;
}

/** The plan as saved, in the shape plan-tables reads. */
/** `viewer`: whose export this is; creators' contacts they may not see are left out (lib/crm/creator-privacy). */
export async function planInputFor(quoteId: string, viewer?: Viewer): Promise<{ input: PlanInput; extSheetId: string | null; intSheetId: string | null }> {
  const prisma = getPrisma();
  const q = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { creators: true } });
  const visible = viewer ? await contactVisibility(viewer, q, q.creators.map((c) => c.creatorId)) : () => true;
  const ids = q.creators.map((c) => c.creatorId).filter((x): x is string => Boolean(x));
  const db = new Map((await prisma.creator.findMany({ where: { id: { in: ids } } })).map((c) => [c.id, c]));
  return {
    extSheetId: q.extSheetId,
    intSheetId: q.intSheetId,
    input: {
      title: q.title,
      brand: q.company || q.contactName || q.title,
      terms: q.terms,
      planBudget: q.planBudget,
      columns: (q.planColumns ?? {}) as PlanColumns,
      creators: q.creators.map((c) => {
        const d = c.creatorId ? db.get(c.creatorId) : undefined;
        const open = visible(c);
        return {
          name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews,
          er: c.engagementRate ?? d?.engagementRate ?? null, niches: c.niches.length ? c.niches : (d?.niches ?? []), city: c.city ?? d?.city ?? null,
          reelCost: rupees(c.reelCostPaise), storyCost: rupees(c.storyCostPaise), dlCost: rupees(c.dlCostPaise),
          reelPrice: rupees(c.reelPricePaise), storyPrice: rupees(c.storyPricePaise), dlPrice: rupees(c.dlPricePaise),
          reachout: c.reachout, contact: open ? (c.contact ?? ([d?.phone, d?.managedBy].filter(Boolean).join(" · ") || null)) : null, remarks: c.remarks,
          yt: d?.youtubeUrl ?? null, email: open ? (d?.email ?? null) : null, extra: (c.extra ?? {}) as Record<string, string>,
        };
      }),
    },
  };
}

/** `viewer`: who's making them; contacts they may not see stay out of the sheets (lib/crm/creator-privacy). */
export async function makePlanSheets(quoteId: string, actorEmail: string | null, actorId?: string | null, viewer?: Viewer) {
  const prisma = getPrisma();
  const { input, extSheetId, intSheetId } = await planInputFor(quoteId, viewer);
  const t = planTables(input);
  const rows = t.rows;
  const maker = await personFileToken(actorId);
  const brand = input.brand;

  /* --- Writing: each file with whichever account can open it (the maker's; the company's for sheets made there before). --- */
  const ensure = async (existing: string | null, title: string, tabs: string[]) => {
    if (existing) {
      for (const token of [maker.token, maker.own ? await companyToken().catch(() => null) : null]) {
        if (!token) continue;
        const meta = await call<Meta>(token, `${API}/${existing}?fields=sheets.properties`, undefined, "GET").catch(() => null);
        if (!meta) continue;
        /* Rewrite: clear values, merges and formats, keep the file (and its link and sharing). */
        await call(token, `${API}/${existing}:batchUpdate`, { requests: meta.sheets.flatMap((s) => [{ unmergeCells: { range: { sheetId: s.properties.sheetId } } }, { repeatCell: { range: { sheetId: s.properties.sheetId }, cell: { userEnteredFormat: {} }, fields: "userEnteredFormat" } }]) });
        await call(token, `${API}/${existing}/values:batchClear`, { ranges: meta.sheets.map((s) => `'${s.properties.title}'`) });
        const sheets = Object.fromEntries(meta.sheets.map((s) => [s.properties.title, s.properties.sheetId])) as Record<string, number>;
        /*
         * A TAB RENAMED OR DELETED IN GOOGLE SHEETS (Genesis, 26 Oct 2026: "Unable
         * to parse range: 'Influencer Plan'!A1"): it's added back, so the update
         * goes through; the file, its link and its sharing stay as they are.
         */
        const missing = tabs.filter((tab) => !(tab in sheets));
        if (missing.length) {
          const added = await call<{ replies: { addSheet?: { properties: { title: string; sheetId: number } } }[] }>(token, `${API}/${existing}:batchUpdate`, {
            requests: missing.map((tab) => ({ addSheet: { properties: { title: tab, gridProperties: { frozenRowCount: tab === "Summary" ? 0 : tab === "INT" ? 2 : 1 } } } })),
          });
          for (const r of added.replies) if (r.addSheet) sheets[r.addSheet.properties.title] = r.addSheet.properties.sheetId;
        }
        return { id: existing, token, fresh: false, sheets };
      }
    }
    const made = await call<{ spreadsheetId: string } & Meta>(maker.token, API, {
      properties: { title },
      sheets: tabs.map((tab) => ({ properties: { title: tab, gridProperties: { frozenRowCount: tab === "Summary" ? 0 : tab === "INT" ? 2 : 1 } } })),
    });
    return { id: made.spreadsheetId, token: maker.token, fresh: true, sheets: Object.fromEntries(made.sheets.map((s) => [s.properties.title, s.properties.sheetId])) as Record<string, number> };
  };

  const ext = await ensure(extSheetId, `${brand} x Genesis Media | Influencer Plan`, ["Summary", "Influencer Plan"]);
  const int = await ensure(intSheetId, `INT - ${brand} | Influencer plan`, ["INT", "EXT"]);
  const write = (token: string, id: string, data: { range: string; values: Cell[][] }[]) =>
    call(token, `${API}/${id}/values:batchUpdate`, { valueInputOption: "USER_ENTERED", data: data.map((d) => ({ ...d, values: d.values.map((r) => r.map(safe)) })) });
  await write(ext.token, ext.id, [
    { range: "'Summary'!A1", values: t.summary },
    { range: "'Influencer Plan'!A1", values: [t.ext.header, ...t.ext.rows, ...t.ext.disclaimer] },
  ]);
  await write(int.token, int.id, [
    { range: "'INT'!A1", values: [t.int.header1, t.int.header, ...t.int.rows, t.int.totals] },
    { range: "'EXT'!A1", values: [t.ext.header, ...t.ext.rows] },
  ]);

  /* --- Formatting --------------------------------------------------------- */
  const bold = (sheetId: number, r0: number, r1: number, c1: number, fill = HEADER_FILL) => ({
    repeatCell: { range: { sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: 0, endColumnIndex: c1 }, cell: { userEnteredFormat: { backgroundColor: fill, textFormat: { bold: true }, wrapStrategy: "WRAP", verticalAlignment: "MIDDLE" } }, fields: "userEnteredFormat(backgroundColor,textFormat,wrapStrategy,verticalAlignment)" },
  });
  const widths = (sheetId: number, px: number[]) => px.map((w, i) => ({ updateDimensionProperties: { range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 }, properties: { pixelSize: w }, fields: "pixelSize" } }));
  const money = (sheetId: number, r0: number, r1: number, cols: number[]) =>
    cols.map((c) => ({ repeatCell: { range: { sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c, endColumnIndex: c + 1 }, cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "₹#,##,##0" } } }, fields: "userEnteredFormat.numberFormat" } }));
  /* The tier column merged across each tier's rows, as on Genesis's plans (when Tier is the first column). */
  const tierMerges = (sheetId: number, offset: number) => {
    if (t.ext.cols[0]?.key !== "tier") return [];
    const out: object[] = [];
    let start = 0;
    for (let i = 1; i <= rows.length; i++) {
      if (i === rows.length || rows[i]!.tier !== rows[start]!.tier) {
        if (i - start > 1) out.push({ mergeCells: { range: { sheetId, startRowIndex: offset + start, endRowIndex: offset + i, startColumnIndex: 0, endColumnIndex: 1 }, mergeType: "MERGE_ALL" } });
        out.push({ repeatCell: { range: { sheetId, startRowIndex: offset + start, endRowIndex: offset + i, startColumnIndex: 0, endColumnIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, verticalAlignment: "MIDDLE", horizontalAlignment: "CENTER", wrapStrategy: "WRAP" } }, fields: "userEnteredFormat(textFormat,verticalAlignment,horizontalAlignment,wrapStrategy)" } });
        start = i;
      }
    }
    return out;
  };
  const moneyAt = (cols: { money?: boolean }[]) => cols.map((c, i) => (c.money ? i : -1)).filter((i) => i >= 0);
  const extWidths = t.ext.cols.map((c) => c.width);
  const sum0 = ext.sheets["Summary"]!;
  const plan = ext.sheets["Influencer Plan"]!;
  await call(ext.token, `${API}/${ext.id}:batchUpdate`, {
    requests: [
      bold(plan, 0, 1, t.ext.header.length),
      ...tierMerges(plan, 1),
      ...widths(plan, extWidths),
      ...money(plan, 1, rows.length + 1, moneyAt(t.ext.cols)),
      { repeatCell: { range: { sheetId: sum0, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } }, fields: "userEnteredFormat.textFormat" } },
      { repeatCell: { range: { sheetId: sum0, startRowIndex: 3, endRowIndex: 10, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat" } },
      ...widths(sum0, [30, 220, 20, 520]),
    ],
  });
  const intId = int.sheets["INT"]!;
  const extCopy = int.sheets["EXT"]!;
  await call(int.token, `${API}/${int.id}:batchUpdate`, {
    requests: [
      bold(intId, 0, 2, t.int.header.length),
      ...t.int.groups.flatMap(({ start, end }) => [
        ...(end - start > 1 ? [{ mergeCells: { range: { sheetId: intId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: start, endColumnIndex: end }, mergeType: "MERGE_ALL" } }] : []),
        { repeatCell: { range: { sheetId: intId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: start, endColumnIndex: end }, cell: { userEnteredFormat: { horizontalAlignment: "CENTER", backgroundColor: GROUP_FILL, textFormat: { bold: true } } }, fields: "userEnteredFormat(horizontalAlignment,backgroundColor,textFormat)" } },
      ]),
      bold(intId, rows.length + 2, rows.length + 3, t.int.header.length, GROUP_FILL),
      ...money(intId, 2, rows.length + 3, moneyAt(t.int.cols)),
      ...widths(intId, t.int.cols.map((c) => c.width)),
      bold(extCopy, 0, 1, t.ext.header.length),
      ...tierMerges(extCopy, 1),
      ...widths(extCopy, extWidths),
    ],
  });

  /* --- Sharing: super admins, whoever made it and the company account; the client gets the external link from them. --- */
  const owners = await prisma.staffRole.findMany({ where: { role: "OWNER" }, select: { user: { select: { email: true } } } });
  const people = [...new Set([...owners.map((o) => o.user.email), actorEmail, COMPANY_ACCOUNT()].filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase()))];
  for (const sheet of [ext, int]) {
    if (!sheet.fresh) continue;
    for (const email of people) {
      if (email === maker.email.toLowerCase()) continue;
      await fetch(`https://www.googleapis.com/drive/v3/files/${sheet.id}/permissions?sendNotificationEmail=false`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sheet.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "user", role: "writer", emailAddress: email }),
      }).catch(() => undefined);
    }
  }
  await prisma.quote.update({ where: { id: quoteId }, data: { extSheetId: ext.id, intSheetId: int.id } });
  /* Sent to the brand as a link: the external sheet opens for anyone with it (view only). The internal one never does. */
  const shared = sharesSheet(input.columns) ? await shareExternalSheet(quoteId, actorId).catch(() => false) : false;
  return {
    shared, ext: `https://docs.google.com/spreadsheets/d/${ext.id}/edit`, int: `https://docs.google.com/spreadsheets/d/${int.id}/edit`, own: maker.own, account: maker.email };
}

/**
 * THE EXTERNAL SHEET, FOR THE BRAND (Genesis, 13 Oct 2026: "add the Google
 * Sheet (external) to send it to the brand"). View-only for anyone with the
 * link, set with whichever account owns it. True when it worked.
 */
export async function shareExternalSheet(quoteId: string, actorId?: string | null): Promise<boolean> {
  const q = await getPrisma().quote.findUnique({ where: { id: quoteId }, select: { extSheetId: true } });
  if (!q?.extSheetId) return false;
  const tokens = [await personFileToken(actorId).then((m) => m.token).catch(() => null), await companyToken().catch(() => null)];
  for (const token of tokens) {
    if (!token) continue;
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${q.extSheetId}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "anyone", role: "reader", allowFileDiscovery: false }),
    }).catch(() => null);
    if (r?.ok) return true;
  }
  return false;
}
