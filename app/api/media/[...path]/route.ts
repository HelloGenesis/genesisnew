import { Readable } from "node:stream";

import { after } from "next/server";

import {
  resolveDriveMedia,
  isSafeMediaPath,
  type DriveMediaFile,
} from "@/lib/drive-media";
import { getDriveClient } from "@/lib/google-drive";

/**
 * Serves a file out of Genesis's Drive at a path that mirrors /public.
 *
 * `/api/media/work/clips/10.mp4` is the Drive copy of `/work/clips/10.mp4`.
 * Callers do not choose between them; lib/media-url.ts does, from one env
 * flag, so a component never knows where its bytes came from.
 *
 * THE CACHE IS THE ENTIRE POINT OF THIS ROUTE. Pointing an <img> or a
 * <video> straight at a Drive share link is the obvious version of this idea
 * and it is a bad one: it hands every viewer a third-party DNS lookup and TLS
 * handshake, it is rate-limited per file, and Drive answers Range requests
 * poorly enough that seeking inside a video misbehaves. Proxying through here
 * means Drive is asked once per file per deploy and every viewer after that is
 * served by our own CDN, from our own origin, on a connection the browser has
 * already opened.
 *
 * `immutable` is safe because the media path is a name Genesis controls. A
 * changed file under the same name wants a deploy or a purge, which is the
 * same contract /public already has — a file in there is cached for a year by
 * the same reasoning.
 *
 * BUT A CACHE HEADER ALONE NEVER CACHED A SINGLE VIDEO BYTE. Vercel's CDN
 * will not store a response to a request carrying `Range`, will not store a
 * 206, and will not store a function response over 20MB. A <video> element
 * asks for everything by Range, and the films are 30-60MB — so every play of
 * every film went to Drive, and production answered `x-vercel-cache: MISS` on
 * the same request twice in a row. The year-long header was a promise
 * nothing kept.
 *
 * SO FILES ARE SERVED IN BLOCKS. Each file is cut into fixed 8MiB blocks,
 * and each block has its own URL — this route with `?block=N`. A block is a
 * plain GET with no Range, a 200, and well under the limit, which is exactly
 * what the CDN does cache. A viewer's Range request is answered by fetching
 * the one block it falls in from our OWN origin (the CDN, after the first
 * time) and cutting the asked-for bytes out of it. Drive is asked for each
 * block once per region, and never again for the life of the cache.
 *
 * A viewer's response is at most VIEW_CHUNK, and never crosses a block. HTTP allows a server
 * to answer a range with fewer bytes than were asked for — Content-Range says
 * which — and every browser's media stack simply asks for the next range.
 *
 * IF THE SELF-FETCH FAILS — a preview behind Deployment Protection, a cold
 * region timing out — the route reads that block from Drive directly, which
 * is what it did for every request before. It cannot do worse than that.
 *
 * Node runtime, not edge: googleapis signs its JWT with node:crypto.
 */
export const runtime = "nodejs";

/*
  A MINUTE, NOT THE PLATFORM DEFAULT. A cold block is 8MiB read out of Drive,
  and on a big master that can outlast a short default — at which point the
  response is cut, the <video> errors, and the window used to fall back to
  the four-second preview: a film that "only plays 3 seconds".
*/
export const maxDuration = 60;

/*
  RUN IN MUMBAI (bom1), set in vercel.json — this route only. Functions
  default to Washington (iad1); the response header read `bom1::iad1`, so
  every video byte for a visitor in India went Drive → Washington → Mumbai →
  phone, and the blocks this route caches were cached in Washington. A 2MB
  piece took 1.2-1.7s, barely faster than a master plays. Everything else
  stays in iad1, next to the database in us-east-2.
*/

/** A year, which is what /public gets and what an addressed asset should get. */
const CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";

/**
 * 8MiB. Under the CDN's 20MB ceiling for a streamed function response with
 * room to spare, and large enough that a film is a handful of blocks rather
 * than hundreds of cache entries.
 */
const BLOCK = 8 * 1024 * 1024;

/**
 * THE MOST A VIEWER IS SENT PER REQUEST: 2MiB, a couple of seconds of a
 * master. A viewer used to get the rest of the whole 8MiB block, and a
 * browser downloads all of a response it has been handed — so a tile that
 * played for one second on a phone still pulled 8-12MB. Galleries play full
 * films now, so that was most of what made the site slow on a phone. The CDN
 * still caches whole blocks; this only limits what leaves for the viewer,
 * and the browser simply asks for the next range as playback needs it.
 */
const VIEW_CHUNK = 2 * 1024 * 1024;

/** File sizes, for files whose lookup did not include one. Per process. */
const sizes = new Map<string, Promise<number | undefined>>();

function sizeOf(file: DriveMediaFile): Promise<number | undefined> {
  if (file.size) return Promise.resolve(file.size);
  let known = sizes.get(file.id);
  if (!known) {
    known = getDriveClient()
      .files.get({ fileId: file.id, fields: "size", supportsAllDrives: true })
      .then((response) => (response.data.size ? Number(response.data.size) : undefined))
      .catch(() => undefined);
    sizes.set(file.id, known);
  }
  return known;
}

/**
 * Reads bytes [start, end] of a Drive file as a web stream. The one place
 * this route talks to Drive.
 */
async function readDrive(fileId: string, start?: number, end?: number) {
  const response = await getDriveClient().files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    {
      responseType: "stream",
      ...(start !== undefined ? { headers: { Range: `bytes=${start}-${end ?? ""}` } } : {}),
    },
  );
  return Readable.toWeb(response.data as unknown as Readable) as ReadableStream<Uint8Array>;
}

/** `bytes=500-` / `bytes=500-999` / `bytes=-500`, resolved against the size. */
function parseRange(header: string | null, size: number): [number, number] | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (match[1] === "" && match[2] === "")) return null;
  if (match[1] === "") {
    // A suffix: the last N bytes.
    const length = Math.min(Number(match[2]), size);
    return [size - length, size - 1];
  }
  const start = Number(match[1]);
  const end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  return start <= end && start < size ? [start, end] : null;
}

/** Drops `skip` bytes, then passes `take` bytes, then ends the stream. */
function slice(stream: ReadableStream<Uint8Array>, skip: number, take: number) {
  let offset = 0;
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const from = Math.max(0, skip - offset);
        const to = Math.min(chunk.length, skip + take - offset);
        offset += chunk.length;
        if (to > from) controller.enqueue(chunk.subarray(from, to));
        if (offset >= skip + take) controller.terminate();
      },
    }),
  );
}

/**
 * One block, from the CDN if it has it. The URL is this route's own, so the
 * first request in a region fills the cache and the rest are served from it.
 */
async function readBlock(request: Request, fileId: string, index: number, size: number) {
  const url = new URL(request.url);
  url.search = `?block=${index}`;
  try {
    const response = await fetch(url, { headers: { accept: "*/*" } });
    if (response.ok && response.body) return response.body;
    await response.body?.cancel();
  } catch {
    // Falls through to Drive.
  }
  const start = index * BLOCK;
  return readDrive(fileId, start, Math.min(start + BLOCK, size) - 1);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  if (!isSafeMediaPath(path)) {
    return new Response("Bad media path", { status: 400 });
  }

  const file = await resolveDriveMedia(path);
  if (!file) {
    /*
      Not configured, or genuinely not in the folder. Either way this is a
      404 rather than a redirect to /public: a silent fallback would make a
      misconfigured Drive look like a working one, and the missing file would
      only surface the day the local copy was deleted.
    */
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": file.mimeType,
    "Cache-Control": CACHE,
    // The bytes are ours to serve but they are not ours to let another site
    // frame or sniff into something else.
    "X-Content-Type-Options": "nosniff",
    // Lets the browser ask for a range next time even on a fresh connection.
    "Accept-Ranges": "bytes",
  });

  try {
    const size = await sizeOf(file);

    /*
      NO SIZE, NO BLOCKS. Google-native types report none, and without it a
      block cannot be bounded — so the file is streamed from Drive whole, as
      it always was. Nothing the site serves today is such a file.
    */
    if (!size) {
      return new Response(await readDrive(file.id), { status: 200, headers });
    }

    const params = new URL(request.url).searchParams;

    /*
      WARM, AND ANSWER AT ONCE. A gallery tile calls this when it starts
      playing, so that by the time anyone opens its window the film's first
      and last blocks are already in this region's CDN cache. The last one
      matters as much as the first: several masters carry their index (moov)
      at the END, and a browser cannot show frame one until it has read it.
      Measured before this, a cold window took up to 12s to start; from the
      cache it is about one.

      The fetches run after the response (next/server `after`), each read to
      the end — the CDN only stores a response it has seen completely — and
      the tiny 204 is itself cached, so a region warms each film once.
    */
    if (params.get("warm") !== null) {
      const last = Math.max(0, Math.ceil(size / BLOCK) - 1);
      after(async () => {
        await Promise.all(
          [...new Set([0, last])].map(async (index) => {
            const body = await readBlock(request, file.id, index, size);
            const reader = body.getReader();
            while (!(await reader.read()).done) {
              // Drained, so the CDN sees the whole block.
            }
          }),
        );
      });
      return new Response(null, {
        status: 204,
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
      });
    }

    const block = params.get("block");
    if (block !== null) {
      // A block, for the CDN. Always a 200 and never a Range, so it is
      // cacheable; out-of-range indices are refused rather than clamped.
      const index = Number(block);
      if (!Number.isInteger(index) || index < 0 || index * BLOCK >= size) {
        return new Response("Bad block", { status: 400 });
      }
      const start = index * BLOCK;
      const end = Math.min(start + BLOCK, size) - 1;
      headers.set("Content-Length", String(end - start + 1));
      return new Response(await readDrive(file.id, start, end), { status: 200, headers });
    }

    const asked = request.headers.get("range");
    const range = parseRange(asked, size);

    if (asked && !range) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    if (!range) {
      /*
        The whole file, which only a crawler or a direct download asks for —
        a player always sends a Range. Assembled block by block, so even
        this is served from the cache.
      */
      headers.set("Content-Length", String(size));
      const count = Math.ceil(size / BLOCK);
      let index = 0;
      let current: ReadableStreamDefaultReader<Uint8Array> | null = null;
      const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
          while (true) {
            if (!current) {
              if (index >= count) return controller.close();
              current = (await readBlock(request, file.id, index++, size)).getReader();
            }
            const { done, value } = await current.read();
            if (!done) return controller.enqueue(value);
            current = null;
          }
        },
        cancel() {
          void current?.cancel();
        },
      });
      return new Response(body, { status: 200, headers });
    }

    // One block's worth at most: from the start of the range to the end of
    // the block it starts in, or the end of the range if that comes first.
    const [start] = range;
    const index = Math.floor(start / BLOCK);
    const end = Math.min(range[1], start + VIEW_CHUNK - 1, (index + 1) * BLOCK - 1, size - 1);

    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));

    const stream = await readBlock(request, file.id, index, size);
    return new Response(slice(stream, start - index * BLOCK, end - start + 1), {
      status: 206,
      headers,
    });
  } catch {
    /*
      Deliberately opaque. A Drive failure here is a quota, a permission or a
      revoked key — all of which are ours to fix and none of which a visitor
      can act on, and the error text from googleapis carries the service
      account's identity.
    */
    return new Response("Media unavailable", { status: 502 });
  }
}
