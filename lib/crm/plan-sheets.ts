import "server-only";

import { getPrisma } from "@/lib/db";

import { companyToken } from "./google";

/**
 * AN INFLUENCER PLAN AS GENESIS'S TWO GOOGLE SHEETS (Genesis, 12 Oct 2026,
 * after the IndusInd Nippon Life plan): an EXTERNAL one for the client — a
 * Summary and the Influencer Plan by tier, client prices only — and an
 * INTERNAL one for the team — reach-out status, YouTube, the creators' own
 * costs, contact, profit, the client prices, remarks, email.
 *
 * Made in the company Drive and shared with the super admins and whoever made
 * the plan; "Update" rewrites both from the plan as it is now.
 */

type Cell = string | number | null;
const API = "https://sheets.googleapis.com/v4/spreadsheets";
const HEADER_FILL = { red: 1, green: 0.949, blue: 0.8 }; // #FFF2CC, as in Genesis's sheets
const GROUP_FILL = { red: 0.851, green: 0.918, blue: 0.827 };

/* Text that would run as a formula is written as text. */
const safe = (v: Cell): Cell => (typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : v);
const rupees = (p: number | null | undefined) => (p === null || p === undefined ? null : Math.round(p) / 100);
const k = (n: number) => (n >= 1e5 ? `${Math.round(n / 1e4) / 10 >= 10 ? Math.round(n / 1e5) * 100 : Math.round(n / 1e3)}k` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

async function call<T>(token: string, url: string, body?: unknown, method = "POST"): Promise<T> {
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok) throw new Error(json.error?.message ?? `Google ${r.status}`);
  return json;
}

/** Tiers as Genesis groups them on a plan. */
const tierOf = (followers: number) => (followers < 100_000 ? "Nano & Micro\n5k–100k" : "Macro & Mega\n100k+");

const DEFAULT_NOTES = [
  "The cost is inclusive of the basic production, which will be taken care of by the creator's team, creatively managed by Genesis Media.",
  "Based on the costs shared, one round of changes has been accounted for. Beyond that, each round will be charged additionally.",
  "This idea breakout & rights is with Genesis Media; using this idea or reaching out to influencers without approval is strictly prohibited.",
  "If there is any additional requirement, a revised estimate will be shared. A sales order corresponding to the estimate has to be submitted to commence work.",
  "The product has to be provided and delivered by the client.",
  "Any content shot by the influencers falls under the purview of the ASCI guidelines (14 June 2021).",
  "The mentioned cost is exclusive of GST.",
  "Payment terms: 50% advance and 50% before the video/deliverables go live.",
];

export async function makePlanSheets(quoteId: string, actorEmail: string | null) {
  const prisma = getPrisma();
  const q = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { creators: { orderBy: { followers: "asc" } } } });
  const ids = q.creators.map((c) => c.creatorId).filter((x): x is string => Boolean(x));
  const db = new Map((await prisma.creator.findMany({ where: { id: { in: ids } } })).map((c) => [c.id, c]));
  const token = await companyToken();
  const brand = q.company ?? q.contactName;
  const rows = q.creators.map((c) => {
    const d = c.creatorId ? db.get(c.creatorId) : undefined;
    return {
      tier: tierOf(c.followers),
      name: c.name,
      category: c.niches.join(" & ") || d?.niches.join(" & ") || "",
      ig: c.profileUrl ?? (c.platform === "INSTAGRAM" ? `https://www.instagram.com/${c.handle}` : ""),
      yt: d?.youtubeUrl ?? "",
      followers: c.followers,
      avgViews: c.avgViews ?? null,
      er: c.engagementRate ?? d?.engagementRate ?? null,
      cost: [rupees(c.reelCostPaise), rupees(c.storyCostPaise), rupees(c.dlCostPaise)],
      price: [rupees(c.reelPricePaise), rupees(c.storyPricePaise), rupees(c.dlPricePaise)],
      contact: c.contact ?? [d?.phone, d?.managedBy].filter(Boolean).join(" · "),
      location: c.city ?? d?.city ?? "",
      reachout: c.reachout ?? "",
      remarks: c.remarks ?? "",
      email: d?.email ?? "",
    };
  });
  const sum = (xs: (number | null)[]) => xs.reduce<number>((s, v) => s + (v ?? 0), 0);

  /* --- Values ------------------------------------------------------------- */
  const planHeader: Cell[] = ["Tier", "Name", "Category", "IG Link", "Followers", "Avg Views", "ER", "1 IG Reel", "Story + LIB", "DL (1 month)", "Location"];
  const planRows: Cell[][] = rows.map((r) => [r.tier, r.name, r.category, r.ig, r.followers, r.avgViews, r.er === null ? null : `${r.er}%`, ...r.price, r.location]);
  const disclaimer: Cell[][] = [[], ["Disclaimer:"], ["*These are tentative costs; final costs will be confirmed after creator confirmation."], ["*This idea breakout & rights is with Genesis Media; using this idea or reaching out to influencers without approval is strictly prohibited."], [`*The total outlay for this execution will be ${q.markupPercent ? "the creator costs above" : "as quoted"} + 15% agency fee + GST.`]];
  const cities = [...new Set(rows.map((r) => r.location).filter(Boolean))];
  const categories = [...new Set(rows.flatMap((r) => r.category.split(/\s*&\s*|,\s*/)).filter(Boolean))];
  const followers = rows.map((r) => r.followers).filter((n) => n > 0);
  const tiers = [...new Set(q.creators.map((c) => (c.followers < 10_000 ? "Nano" : c.followers < 100_000 ? "Micro" : c.followers < 1_000_000 ? "Macro" : "Mega")))];
  const notes = (q.terms ?? "").split("\n").map((t) => t.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  const summary: Cell[][] = [
    [],
    [],
    [null, "Overview"],
    [null, "Project Name:", null, q.title],
    [null, "Number of influencers:", null, rows.length],
    [null, "Creator Type:", null, tiers.join(", ")],
    [null, "Follower Range:", null, followers.length ? `${k(Math.min(...followers))} - ${k(Math.max(...followers))}` : ""],
    [null, "Region:", null, cities.join(", ")],
    [null, "Category of Influencers:", null, categories.slice(0, 10).join(", ")],
    [null, "Budget:", null, q.planBudget ?? "As per Brand"],
    [null, "*The total outlay for this execution will be 15% Agency fee + GST*"],
    [],
    [null, "Please Note-"],
    ...(notes.length ? notes : DEFAULT_NOTES).map((n) => [null, n] as Cell[]),
  ];
  const intHeader1: Cell[] = ["", "", "", "", "", "", "", "", "Creator cost", "", "", "", "", "", "Client price", "", "", "", ""];
  const intHeader: Cell[] = ["Reachout Status", "Name", "Category", "IG Link", "YT Link", "Followers", "Avg Views", "ER", "1 IG Reel", "Story + LIB", "DL (1 month)", "Contact", "Location", "Profit", "1 IG Reel", "Story + LIB", "DL (1 month)", "Remarks", "Email"];
  const intRows: Cell[][] = rows.map((r) => [r.reachout, r.name, r.category, r.ig, r.yt, r.followers, r.avgViews, r.er === null ? null : `${r.er}%`, ...r.cost, r.contact, r.location, sum(r.price) - sum(r.cost), ...r.price, r.remarks, r.email]);
  const totals: Cell[] = ["Total", `${rows.length} creators`, "", "", "", "", "", "", sum(rows.map((r) => r.cost[0]!)), sum(rows.map((r) => r.cost[1]!)), sum(rows.map((r) => r.cost[2]!)), "", "", sum(rows.map((r) => sum(r.price) - sum(r.cost))), sum(rows.map((r) => r.price[0]!)), sum(rows.map((r) => r.price[1]!)), sum(rows.map((r) => r.price[2]!)), "", ""];

  /* --- Writing ------------------------------------------------------------ */
  const ensure = async (existing: string | null, title: string, tabs: string[]) => {
    if (existing) {
      const meta = await call<{ sheets: { properties: { sheetId: number; title: string } }[] }>(token, `${API}/${existing}?fields=sheets.properties`, undefined, "GET").catch(() => null);
      if (meta) {
        /* Rewrite: clear values and merges, keep the file (and its link and sharing). */
        await call(token, `${API}/${existing}:batchUpdate`, { requests: meta.sheets.map((s) => ({ unmergeCells: { range: { sheetId: s.properties.sheetId } } })) });
        await call(token, `${API}/${existing}/values:batchClear`, { ranges: meta.sheets.map((s) => `'${s.properties.title}'`) });
        return { id: existing, sheets: Object.fromEntries(meta.sheets.map((s) => [s.properties.title, s.properties.sheetId])) as Record<string, number> };
      }
    }
    const made = await call<{ spreadsheetId: string; sheets: { properties: { sheetId: number; title: string } }[] }>(token, API, {
      properties: { title },
      sheets: tabs.map((t) => ({ properties: { title: t, gridProperties: { frozenRowCount: t === "Summary" ? 0 : t === "INT" ? 2 : 1 } } })),
    });
    return { id: made.spreadsheetId, sheets: Object.fromEntries(made.sheets.map((s) => [s.properties.title, s.properties.sheetId])) as Record<string, number>, fresh: true };
  };

  const ext = await ensure(q.extSheetId, `${brand} x Genesis Media | Influencer Plan`, ["Summary", "Influencer Plan"]);
  const int = await ensure(q.intSheetId, `INT - ${brand} | Influencer plan`, ["INT", "EXT"]);
  const write = (id: string, data: { range: string; values: Cell[][] }[]) =>
    call(token, `${API}/${id}/values:batchUpdate`, { valueInputOption: "USER_ENTERED", data: data.map((d) => ({ ...d, values: d.values.map((r) => r.map(safe)) })) });
  await write(ext.id, [
    { range: "'Summary'!A1", values: summary },
    { range: "'Influencer Plan'!A1", values: [planHeader, ...planRows, ...disclaimer] },
  ]);
  await write(int.id, [
    { range: "'INT'!A1", values: [intHeader1, intHeader, ...intRows, totals] },
    { range: "'EXT'!A1", values: [planHeader, ...planRows] },
  ]);

  /* --- Formatting --------------------------------------------------------- */
  const bold = (sheetId: number, r0: number, r1: number, c1: number, fill = HEADER_FILL) => ({
    repeatCell: { range: { sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: 0, endColumnIndex: c1 }, cell: { userEnteredFormat: { backgroundColor: fill, textFormat: { bold: true }, wrapStrategy: "WRAP", verticalAlignment: "MIDDLE" } }, fields: "userEnteredFormat(backgroundColor,textFormat,wrapStrategy,verticalAlignment)" },
  });
  const widths = (sheetId: number, px: number[]) => px.map((w, i) => ({ updateDimensionProperties: { range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 }, properties: { pixelSize: w }, fields: "pixelSize" } }));
  const money = (sheetId: number, rowsN: number, cols: number[]) =>
    cols.map((c) => ({ repeatCell: { range: { sheetId, startRowIndex: 1, endRowIndex: rowsN, startColumnIndex: c, endColumnIndex: c + 1 }, cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "₹#,##,##0" } } }, fields: "userEnteredFormat.numberFormat" } }));
  /* The tier column merged across each tier's rows, as on Genesis's plans. */
  const tierMerges = (sheetId: number, offset: number) => {
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
  const planWidths = [130, 190, 190, 260, 90, 90, 60, 100, 100, 110, 120];
  const sum0 = ext.sheets["Summary"]!;
  const plan = ext.sheets["Influencer Plan"]!;
  await call(token, `${API}/${ext.id}:batchUpdate`, {
    requests: [
      bold(plan, 0, 1, planHeader.length),
      ...tierMerges(plan, 1),
      ...widths(plan, planWidths),
      ...money(plan, rows.length + 1, [7, 8, 9]),
      { repeatCell: { range: { sheetId: sum0, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } }, fields: "userEnteredFormat.textFormat" } },
      { repeatCell: { range: { sheetId: sum0, startRowIndex: 3, endRowIndex: 10, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat" } },
      ...widths(sum0, [30, 220, 20, 520]),
    ],
  });
  const intId = int.sheets["INT"]!;
  const extCopy = int.sheets["EXT"]!;
  await call(token, `${API}/${int.id}:batchUpdate`, {
    requests: [
      bold(intId, 0, 2, intHeader.length),
      { mergeCells: { range: { sheetId: intId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 8, endColumnIndex: 11 }, mergeType: "MERGE_ALL" } },
      { mergeCells: { range: { sheetId: intId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 14, endColumnIndex: 17 }, mergeType: "MERGE_ALL" } },
      { repeatCell: { range: { sheetId: intId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 8, endColumnIndex: 17 }, cell: { userEnteredFormat: { horizontalAlignment: "CENTER", backgroundColor: GROUP_FILL, textFormat: { bold: true } } }, fields: "userEnteredFormat(horizontalAlignment,backgroundColor,textFormat)" } },
      bold(intId, rows.length + 2, rows.length + 3, intHeader.length, GROUP_FILL),
      ...money(intId, rows.length + 3, [8, 9, 10, 13, 14, 15, 16]),
      ...widths(intId, [130, 190, 170, 240, 200, 90, 90, 60, 100, 100, 110, 200, 120, 100, 100, 100, 110, 200, 200]),
      bold(extCopy, 0, 1, planHeader.length),
      ...tierMerges(extCopy, 1),
      ...widths(extCopy, planWidths),
    ],
  });

  /* --- Sharing: super admins and whoever made it; the client gets the external link from them. --- */
  const owners = await prisma.staffRole.findMany({ where: { role: "OWNER" }, select: { user: { select: { email: true } } } });
  const people = [...new Set([...owners.map((o) => o.user.email), actorEmail].filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase()))];
  for (const id of [ext.id, int.id]) {
    if (!("fresh" in (id === ext.id ? ext : int))) continue;
    for (const email of people) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions?sendNotificationEmail=false`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "user", role: "writer", emailAddress: email }),
      }).catch(() => undefined);
    }
  }
  await prisma.quote.update({ where: { id: quoteId }, data: { extSheetId: ext.id, intSheetId: int.id } });
  return { ext: `https://docs.google.com/spreadsheets/d/${ext.id}/edit`, int: `https://docs.google.com/spreadsheets/d/${int.id}/edit` };
}
