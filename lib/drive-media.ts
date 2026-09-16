import "server-only";

import { getDriveClient, getRootFolderId, isDriveConfigured } from "./google-drive";
import manifest from "../public/work/clips/manifest.json";

/**
 * Resolving a public-looking media path to a file inside Genesis's Drive.
 *
 * WHAT THIS IS FOR, AND WHAT IT IS NOT FOR. Drive is the file store — the
 * place Genesis actually keeps footage and stills — so the site should be able
 * to read from it rather than requiring every asset to be committed to the
 * repository and redeployed. That is a workflow win: drop a file in a folder,
 * it is on the site.
 *
 * It is NOT a content delivery network and must not be used as one. Drive
 * rate-limits per file, serves interstitials under load, and its Range support
 * is poor enough that scrubbing a video through it is unreliable. Anything
 * fetched here is therefore fetched ONCE and then served from our own cache
 * headers for a year — see the route in app/api/media. Drive is the origin of
 * record; it is never in the hot path twice for the same file.
 *
 * PATHS MIRROR /public. `work/clips/10.mp4` here is the same file that lives
 * at /work/clips/10.mp4 in the repo, so switching a caller between the two is
 * a prefix and nothing else, and a Drive folder that mirrors /public is a
 * structure a person can keep tidy without being told a scheme.
 */

/**
 * Where each numbered film actually lives in Genesis's Drive.
 *
 * THE FOLDERS ARE ORGANISED BY SHOOT, NOT BY THE SITE'S PATHS, and that is
 * reasonable — they are Genesis's working folders, and asking a person to
 * restructure their Drive to match a URL scheme is asking the wrong party to
 * do the mapping. The site asked for `work/clips/1.mp4`, the file is `1.mp4`
 * at the root of one folder, and nothing resolved. This table is the mapping,
 * written down once.
 *
 * Two sources, because the footage arrived in two batches:
 *   1-32   "With 2 seconds thumbnail"   — named 1.mp4 … 32.mp4
 *   33-42  "Website Content Temporary"  — named after the property filmed
 *
 * Note 40: `Chembur Plot` has no file extension in Drive. It is matched by the
 * name Drive actually holds, not the name it ought to have.
 */
const PROPERTY_FILMS: Record<number, string> = {
  33: "1) Panvel Hospital Plot.mp4",
  34: "2) Ghatkopar Godown.mp4",
  35: "3) Chembur Commercial Office.mp4",
  36: "4) Vashi Petrol Pump.mp4",
  37: "5) Prajapati Ornate.mp4",
  38: "6) Sea Facing Alibag.mp4",
  39: "7) Alibag Plot 1.mp4",
  40: "8) Chembur Plot",
  41: "9) Karjat Agricultural Land.mp4",
  42: "11) Sarda Village.mp4",
};

/**
 * THE NAMED CLIPS, by the Drive id the ingest recorded for each.
 *
 * Numbered films resolve by filename below. A named clip — `ai-lab-tanvi-uiiui`
 * — has no filename to ask for: its id is a slug of the folder path and the
 * original name, and Drive holds "uiiui.mp4" inside "AI Lab / Tanvi". Without
 * this every named piece played its four-second preview on the detail page,
 * because the film lookup walked /films and found nothing. The manifest
 * already knows which Drive file each slug came from, so it is asked.
 *
 * NUMBERED CLIPS GO THROUGH IT TOO. The manifest records 1-32 under the
 * slugs of the folders they now live in — `influence-16`, `ai-lab-29` —
 * because Genesis sorted the root folder into division subfolders. The
 * filename lookup below still asked the root for `16.mp4` and got nothing,
 * so every numbered film answered 404 and fell back to its preview.
 */
const NAMED_FILMS = new Map(
  (manifest as { slug: string; driveId: string; name: string }[]).map(
    (entry) => [entry.slug, entry] as const,
  ),
);

/** Resolves `films/<n>.mp4` to the folder and filename Drive really has. */
function filmSource(
  segments: string[],
): { parentId: string; name: string } | { file: DriveMediaFile } | null {
  if (segments.length !== 2 || segments[0] !== "films") return null;
  const stem = segments[1].replace(/\.mp4$/i, "");

  const named =
    NAMED_FILMS.get(stem) ??
    NAMED_FILMS.get(`influence-${stem}`) ??
    NAMED_FILMS.get(`ai-lab-${stem}`);
  if (named) {
    return {
      file: { id: named.driveId, name: named.name, mimeType: "video/mp4" },
    };
  }

  const n = Number(stem);
  if (!Number.isInteger(n)) return null;

  const property = PROPERTY_FILMS[n];
  if (property) {
    const folder = process.env.GOOGLE_DRIVE_PROPERTY_FOLDER_ID?.trim();
    return folder ? { parentId: folder, name: property } : null;
  }

  if (n >= 1 && n <= 32) {
    const root = getRootFolderId();
    return root ? { parentId: root, name: `${n}.mp4` } : null;
  }
  return null;
}

export type DriveMediaFile = {
  id: string;
  name: string;
  mimeType: string;
  /** Bytes, when Drive reports it. Absent for some Google-native types. */
  size?: number;
};

/**
 * Drive's query language delimits string literals with single quotes and has
 * no other escaping, so a name containing one has to be backslash-escaped or
 * it terminates the literal early. A file called `it's.mp4` is not exotic.
 */
function quote(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * Rejects anything that is not a plain relative path.
 *
 * The segments arrive from a URL, so this is the boundary where a request
 * stops being someone else's text. `..` is the obvious one; the rest matter
 * because these segments are interpolated into a Drive query, and a name
 * carrying a quote or a backslash that got past `quote()` above would change
 * what that query means.
 */
export function isSafeMediaPath(segments: string[]): boolean {
  if (segments.length === 0 || segments.length > 8) return false;
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment.length <= 128 &&
      segment !== "." &&
      segment !== ".." &&
      !segment.includes("/") &&
      !segment.includes("\\") &&
      // Control characters only. Spaces and hyphens are ordinary in a
      // filename — dot-and-key.webp is one of ours — so this tests code
      // points below 0x20 plus DEL, rather than a punctuation range.
      ![...segment].some((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return code < 0x20 || code === 0x7f;
      }),
  );
}

/**
 * Resolved paths, kept for the life of the server process.
 *
 * The map holds the PROMISE rather than the result, which is what makes it a
 * lock as well as a cache: fifteen tiles asking for the same clip in the same
 * tick share one Drive round trip instead of racing fifteen. A miss is cached
 * too — a file that is not in Drive should not be looked for again on every
 * request, because the answer is a folder listing either way.
 */
const resolved = new Map<string, Promise<DriveMediaFile | null>>();

/** Clears the resolution cache. For tests, and for a future revalidate hook. */
export function clearDriveMediaCache(): void {
  resolved.clear();
}

async function findChild(
  parentId: string,
  name: string,
): Promise<DriveMediaFile | null> {
  const drive = getDriveClient();
  const response = await drive.files.list({
    q: `'${quote(parentId)}' in parents and name = '${quote(name)}' and trashed = false`,
    fields: "files(id,name,mimeType,size)",
    // Two, not one: it lets a duplicate name be detected rather than silently
    // resolving to whichever Drive happened to return first.
    pageSize: 2,
    // Both flags, or a service account pointed at a Shared Drive sees nothing
    // and the failure looks like an empty folder rather than a config error.
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = response.data.files ?? [];
  const file = files[0];
  if (!file?.id) return null;

  return {
    id: file.id,
    name: file.name ?? name,
    mimeType: file.mimeType ?? "application/octet-stream",
    size: file.size ? Number(file.size) : undefined,
  };
}

/**
 * Walks `work/clips/10.mp4` down from the configured root folder.
 *
 * One listing per segment. It is not free, which is exactly why the result is
 * memoised above and why the route that calls it sets a year of cache: the
 * walk happens once per file per deploy, not once per viewer.
 */
export async function resolveDriveMedia(
  segments: string[],
): Promise<DriveMediaFile | null> {
  if (!isDriveConfigured() || !isSafeMediaPath(segments)) return null;

  const root = getRootFolderId();
  if (!root) return null;

  const key = segments.join("/");
  const cached = resolved.get(key);
  if (cached) return cached;

  const lookup = (async () => {
    /*
      A film is addressed by number and lives wherever Genesis put it, so it
      skips the folder walk entirely and asks for one named file in one known
      folder. Everything else still mirrors /public.
    */
    const film = filmSource(segments);
    if (film) {
      return "file" in film ? film.file : findChild(film.parentId, film.name);
    }

    let parent = root;
    for (const segment of segments.slice(0, -1)) {
      const folder = await findChild(parent, segment);
      if (!folder) return null;
      parent = folder.id;
    }
    return findChild(parent, segments[segments.length - 1]);
  })().catch(() => null);

  resolved.set(key, lookup);
  return lookup;
}
