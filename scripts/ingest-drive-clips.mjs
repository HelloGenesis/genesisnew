/**
 * Turn a Google Drive folder of master videos into web-ready hover previews.
 *
 *   node scripts/ingest-drive-clips.mjs <folderId>
 *
 * WHY THIS EXISTS. Genesis's work lands as full-resolution masters — the first
 * folder averaged 51MB a file, 2GB in total, single clips 200x the weight of
 * the whole homepage. None of it is servable. This produces, per file, a
 * four-second silent loop at 720px on the long edge plus a poster frame.
 * Measured: 11.5MB -> 82KB, about 140x.
 *
 * IT USES THE DRIVE API, not the public folder view. That matters for three
 * reasons beyond being the supported path:
 *
 *   1. It reads PRIVATE folders. The scrape it replaced only ever worked on
 *      folders set to "anyone with the link", which is not where finished
 *      client work should have to live.
 *   2. It returns METADATA — real filenames, sizes, mime types, descriptions,
 *      and the folder each file sits in. Files arriving as 1.mp4..32.mp4 carry
 *      no client anywhere in them, and the folder tree is the one place that
 *      information plausibly exists. The script walks subfolders and records
 *      the path, then writes a manifest.
 *   3. It is stable. The previous version parsed `embeddedfolderview` HTML,
 *      an undocumented endpoint that changes without notice.
 *
 * IT STILL DOES NOT DOWNLOAD THE MASTERS. ffmpeg is handed the API's media
 * URL plus a bearer token, and range-requests only the leading seconds it
 * needs — six seconds a file rather than a 2GB pull that is then discarded.
 *
 * SETUP: set GOOGLE_SERVICE_ACCOUNT_JSON (raw or base64) in .env.local, and
 * share the folder with that account's client_email — a service account with
 * no share sees an empty Drive and reports zero files rather than an error.
 * Requires ffmpeg on PATH.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import "dotenv/config";
import { google } from "googleapis";

const run = promisify(execFile);
const folderId = process.argv[2];
if (!folderId) {
  console.error("usage: node scripts/ingest-drive-clips.mjs <folderId>");
  process.exit(1);
}

/*
  `fileURLToPath`, NOT `.pathname`, and it is a real bug rather than a style
  note. A file: URL percent-encodes its path, so on a checkout living in a
  directory with a space in the name — "claude builds" — `.pathname` hands
  back ".../claude%20builds/genesis/public/work" as a literal string. mkdirSync
  then cheerfully CREATES a folder called "claude%20builds" next to the real
  one and writes every clip, poster and the manifest into it. The run reports
  "61/61 converted" and the repo gains nothing; that is exactly what happened
  the first time this was pointed at the divisions folder.
*/
const OUT = fileURLToPath(new URL("../public/work", import.meta.url));
/** One filter for both orientations: reels are portrait, films landscape. */
const SCALE = "scale='if(gt(iw,ih),720,-2)':'if(gt(iw,ih),-2,720)':flags=lanczos";

/**
 * Mirrors lib/google-drive.ts. Not imported from it because that module is
 * marked `server-only` for the app's benefit, and this is a plain Node script.
 */
function credentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw || raw.startsWith("your") || raw.length < 40) {
    console.error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set.\n" +
        "Add the service account JSON (raw or base64) to .env.local, then share\n" +
        "the Drive folder with that account's client_email.",
    );
    process.exit(1);
  }
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(json);
  return {
    client_email: parsed.client_email,
    // Vercel stores the key with literal \n sequences; PEM needs real ones.
    private_key: String(parsed.private_key).replace(/\\n/g, "\n"),
  };
}

const auth = new google.auth.GoogleAuth({
  credentials: credentials(),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

/** Every video under `id`, depth-first, carrying the folder path it was found in. */
async function walk(id, trail = []) {
  const found = [];
  let pageToken;
  do {
    const { data } = await drive.files.list({
      q: `'${id}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size, description)",
      pageSize: 200,
      pageToken,
      // Shared drives are a different corpus; without these the listing comes
      // back empty for anything that is not in "My Drive".
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const file of data.files ?? []) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        found.push(...(await walk(file.id, [...trail, file.name])));
      } else if (file.mimeType?.startsWith("video/")) {
        found.push({ ...file, trail });
      }
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
  return found;
}

/*
  RE-RUNS ARE INCREMENTAL. A file whose Drive id is already in the manifest
  was converted on an earlier run, and converting it again would both waste
  the fetch and throw away the watermark stamped onto it since. The manifest
  is merged rather than rewritten for the same reason: running this on one
  new folder used to leave a manifest describing only that folder.
*/
const MANIFEST = `${OUT}/clips/manifest.json`;
const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : [];
const seen = new Set(previous.map((entry) => entry.driveId));

const found = await walk(folderId);
const files = found.filter((file) => !seen.has(file.id));
console.log(`${found.length - files.length} already ingested, skipped`);
if (found.length === 0) {
  console.error(
    "No videos found. If the folder is not empty, it is probably not shared\n" +
      `with the service account (${credentials().client_email}).`,
  );
  process.exit(1);
}
console.log(`${files.length} new videos\n`);

mkdirSync(`${OUT}/clips`, { recursive: true });
mkdirSync(`${OUT}/posters`, { recursive: true });

const slug = (file) =>
  [...file.trail, file.name.replace(/\.[^.]+$/, "")]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function convert(file, token) {
  const stem = slug(file);
  const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`;
  // ffmpeg range-requests this URL, so only the opening seconds are fetched.
  const headers = `Authorization: Bearer ${token}\r\n`;
  const clip = `${OUT}/clips/${stem}.mp4`;
  const poster = `${OUT}/posters/${stem}.jpg`;
  const opts = { maxBuffer: 1 << 26 };

  await run("ffmpeg", ["-v","error","-y","-headers",headers,"-i",url,"-t","4","-an",
    "-vf",`${SCALE},fps=24`,"-c:v","libx264","-profile:v","high","-crf","30",
    "-preset","slow","-pix_fmt","yuv420p","-movflags","+faststart",clip], opts);
  await run("ffmpeg", ["-v","error","-y","-headers",headers,"-i",url,"-frames:v","1",
    "-vf",SCALE,"-q:v","4",poster], opts);

  return { stem, clip: statSync(clip).size, poster: statSync(poster).size };
}

const token = await auth.getAccessToken();
const queue = [...files];
const done = [];
const manifest = [...previous];

// Four at a time: encoding is CPU-bound and fetching network-bound, so a small
// pool keeps both busy without thrashing either.
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const file = queue.shift();
      try {
        const r = await convert(file, token);
        done.push(r);
        manifest.push({
          slug: r.stem,
          driveId: file.id,
          name: file.name,
          folder: file.trail.join(" / ") || null,
          description: file.description ?? null,
          masterBytes: Number(file.size ?? 0),
          clip: `/work/clips/${r.stem}.mp4`,
          poster: `/work/posters/${r.stem}.jpg`,
        });
        console.log(`${r.stem}: ${(r.clip / 1024) | 0}KB clip, ${(r.poster / 1024) | 0}KB poster`);
      } catch (error) {
        console.log(`${file.name}: FAILED — ${String(error.message).slice(0, 140)}`);
      }
    }
  }),
);

/*
  The manifest is the useful half. It is the only record of which Drive file
  each preview came from, what it was called, and which folder it lived in —
  which is what makes attributing a clip to a client possible later without
  re-listing the whole Drive.
*/
manifest.sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

const mb = (n) => (n / 1048576).toFixed(1);
console.log(`\n${done.length}/${files.length} converted`);
console.log(`clips ${mb(done.reduce((s, r) => s + r.clip, 0))}MB, posters ${mb(done.reduce((s, r) => s + r.poster, 0))}MB`);
console.log(`manifest: public/work/clips/manifest.json`);
