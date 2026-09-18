import "server-only";

import { google } from "googleapis";

import { isDriveConfigured, parseServiceAccount } from "./google-drive";

/**
 * Form submissions, appended to a Google Sheet.
 *
 * WHY A SHEET AND NOT ONLY THE DATABASE. Genesis asked for the form's backend
 * to be Sheets, and for a lead form that is the right instinct: the people who
 * act on an enquiry are the ones who need to see it, and they already live in
 * a spreadsheet. A Postgres row is only visible to whoever has a client and a
 * connection string.
 *
 * IT DOES NOT REPLACE THE DATABASE, IT SITS BESIDE IT. A sheet is a document
 * — it can be sorted, edited and deleted by anyone with the link, which is
 * exactly what makes it useful and exactly why it is not a record of what was
 * submitted. When both are configured a submission is written to both, and
 * the form succeeds if EITHER lands. When only one is, that one carries it,
 * which is what makes the form work before the database exists.
 *
 * SETUP: share the target spreadsheet with the service account's
 * `client_email` as an Editor, and put its id — the long string in the sheet's
 * URL between /d/ and /edit — in GOOGLE_SHEETS_ID.
 */

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**
 * ONE TAB PER FORM, each with that form's own columns.
 *
 * Every submission used to land in one "Submissions" tab with eight fixed
 * columns, so the fields that mattered most on each form — an influencer's
 * rates and handles, a project's budget and timeline, an applicant's CV link
 * — had no column at all and were lost to the sheet. Genesis set up four tabs
 * in one spreadsheet and named them; these titles must match theirs exactly.
 *
 * Every tab reads Received, Source, the form's fields, then Status. Status is
 * the team's own follow-up column and is never written here — the header
 * includes it so a freshly created tab comes out complete.
 *
 * The header is written only into an EMPTY first row, so a fresh tab is
 * readable without setup; it is never rewritten — if someone renames a column
 * to suit how they work, that is their sheet.
 */
export type SheetTab = "brand" | "quick" | "influencer" | "career";

const TABS: Record<SheetTab, { title: string; columns: [header: string, field: string][] }> = {
  brand: {
    title: "Project Enquiries",
    columns: [
      ["Name", "name"],
      ["Company", "company"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Website or social", "website"],
      ["What do you need?", "need"],
      ["Budget range", "budget"],
      ["Timeline", "timeline"],
      ["Project brief", "message"],
    ],
  },
  quick: {
    title: "Quick Contact",
    columns: [
      ["Name", "name"],
      ["Company", "company"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["What can we help you with?", "message"],
    ],
  },
  influencer: {
    title: "Influencer Onboarding",
    columns: [
      ["Name", "name"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Platforms", "platforms"],
      ["What brings you to us?", "goals"],
      ["Instagram link", "instagram"],
      ["YouTube link", "youtube"],
      ["IG reel cost (₹)", "igReelCost"],
      ["YT integrated (₹)", "ytReelCost"],
      ["Previous brands", "previousBrands"],
      ["Picture link", "picture"],
      ["Comments", "message"],
      ["Consent to pitch", "consent"],
    ],
  },
  career: {
    title: "Careers",
    columns: [
      ["First name", "name"],
      ["Last name", "lastName"],
      ["Email", "email"],
      ["Contact number", "phone"],
      ["Position", "position"],
      ["Portfolio or CV link", "portfolio"],
      ["About yourself", "message"],
    ],
  },
};

function headerFor(tab: SheetTab): string[] {
  return ["Received", "Source", ...TABS[tab].columns.map(([header]) => header), "Status"];
}

/** Column letter for a 1-based index (1 → A, 27 → AA). */
function column(n: number): string {
  let out = "";
  for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) {
    out = String.fromCharCode(65 + ((i - 1) % 26)) + out;
  }
  return out;
}

/** The legacy single-row shape, kept for the older contact action. */
export type SubmissionRow = {
  type: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  message?: string | null;
  source?: string | null;
};

export function isSheetsConfigured(): boolean {
  const id = process.env.GOOGLE_SHEETS_ID;
  return isDriveConfigured() && Boolean(id && id.trim() !== "");
}

let client: ReturnType<typeof google.sheets> | undefined;

function getSheets() {
  if (!client) {
    const credentials = parseServiceAccount(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "",
    );
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      /*
        Its own scope, not the Drive client's. That account can already reach
        every file in the shared folder; there is no reason for a token minted
        to write one spreadsheet row to also carry Drive write access.
      */
      scopes: SCOPES,
    });
    client = google.sheets({ version: "v4", auth });
  }
  return client;
}

/**
 * Creates the Submissions tab if the spreadsheet has not got one.
 *
 * A NEW SHEET COMES WITH ONE TAB CALLED "Sheet1", AND NOTHING TOLD ANYONE.
 * Genesis shared a spreadsheet, enabled the API, and every submission would
 * still have failed — appending to `Submissions!A:H` when no such tab exists
 * is a 400, and because appendSubmission never throws, the failure would have
 * been silent and the form would have blamed the database instead.
 *
 * Asking a person to rename a tab to an exact string is a setup step that gets
 * missed once and then debugged for an hour. Making the tab is one API call.
 *
 * Failing here must not stop the append either: if the tab already exists this
 * throws a duplicate error, which is the success case.
 */
async function ensureTab(spreadsheetId: string, title: string): Promise<void> {
  try {
    const sheets = getSheets();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties.title",
    });
    const titles = (meta.data.sheets ?? []).map((s) => s.properties?.title);
    if (titles.includes(title)) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
  } catch {
    // Raced by another submission, or no permission to add one. The append
    // below reports the real outcome either way.
  }
}

async function ensureHeader(spreadsheetId: string, tab: SheetTab): Promise<void> {
  const { title } = TABS[tab];
  const header = headerFor(tab);
  try {
    const sheets = getSheets();
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${title}'!A1:${column(header.length)}1`,
    });
    if (existing.data.values && existing.data.values.length > 0) return;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${title}'!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [header] },
    });
  } catch {
    // See above.
  }
}

/**
 * One submission, as a row in its form's tab.
 *
 * `values` is keyed by the form's field names; anything missing is an empty
 * cell. Received is written in India time as a person reads it, since the
 * sheet is read by people, not parsed. Never throws — a Sheets outage returns
 * false and the caller decides what the visitor is told.
 */
export async function appendToTab(
  tab: SheetTab,
  values: Record<string, string | undefined | null>,
  source?: string | null,
): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  if (!spreadsheetId || !isSheetsConfigured()) return false;

  const { title, columns } = TABS[tab];
  const received = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    await ensureTab(spreadsheetId, title);
    await ensureHeader(spreadsheetId, tab);

    await getSheets().spreadsheets.values.append({
      spreadsheetId,
      range: `'${title}'!A:${column(columns.length + 2)}`,
      valueInputOption: "RAW",
      /*
        INSERT_ROWS, not OVERWRITE. Overwrite appends after the last row the
        API can see, which on a sheet someone has been filtering or editing is
        not always the last row of data — INSERT_ROWS puts a new row in and
        cannot land on top of anything.
      */
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[received, source ?? "", ...columns.map(([, field]) => values[field] ?? "")]],
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * The older contact action's entry point. Its form is no longer on any page;
 * anything that still arrives through it is a short enquiry, so it goes to
 * Quick Contact with its type noted in Source.
 */
export async function appendSubmission(row: SubmissionRow): Promise<boolean> {
  return appendToTab(
    "quick",
    {
      name: row.name,
      email: row.email,
      company: row.company,
      phone: row.phone,
      message: row.message,
    },
    [row.source, row.type].filter(Boolean).join(" · "),
  );
}
