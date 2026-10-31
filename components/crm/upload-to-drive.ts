/**
 * One file into a project's folder on Genesis's Drive (lib/crm/drive): the
 * server opens a resumable session, the browser sends the bytes to Google
 * itself, then the server records it. Used by a project's Files and by the
 * CRM's Files and Creative Library pages.
 */
export async function uploadToProject(file: File, to: { projectId: string; folder: string; audience?: string; review?: "client" | "internal" }, onPct: (pct: number) => void) {
  const start = await fetch("/api/crm/files/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: to.projectId, folder: to.folder, audience: to.audience || undefined, name: file.name, mimeType: file.type || "application/octet-stream", size: file.size }),
  });
  const started = (await start.json()) as { uploadUrl?: string; ticket?: string; error?: string };
  if (!start.ok || !started.uploadUrl) throw new Error(started.error ?? "Upload couldn't start.");
  const driveId = await sendInPieces(started.uploadUrl, file, onPct);
  const done = await fetch("/api/crm/files/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: started.ticket, driveId, review: to.review }),
  });
  if (!done.ok) throw new Error(((await done.json()) as { error?: string }).error ?? "Couldn't save the file.");
}

/*
 * HUGE FILES DON'T BREAK (Genesis, 31 Oct 2026: "this should handle huge
 * files and should not break during upload"). The bytes go to Google in 32 MB
 * pieces on the resumable session. When a piece fails (Wi-Fi drops, a laptop
 * sleeps), we ask Google how much it already has and carry on from there,
 * waiting a little longer each time; nothing already sent is sent again.
 */
const PIECE = 32 * 1024 * 1024; /* A multiple of 256 KB, as Google asks. */
const TRIES = 8;

type Sent = { done: true; id: string } | { done: false; next: number };

function put(url: string, body: Blob | null, range: string | null, type: string, onBytes?: (n: number) => void): Promise<Sent> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (range) xhr.setRequestHeader("Content-Range", range);
    if (body) xhr.setRequestHeader("Content-Type", type);
    if (onBytes) xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => {
      if (xhr.status === 308) {
        /* "Range: bytes=0-N": Google has everything up to N. */
        const got = xhr.getResponseHeader("Range")?.match(/-(\d+)$/);
        return resolve({ done: false, next: got ? Number(got[1]) + 1 : 0 });
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const id = (JSON.parse(xhr.responseText) as { id?: string }).id;
          if (id) return resolve({ done: true, id });
        } catch {}
      }
      reject(new Error(xhr.status === 404 || xhr.status === 410 ? "expired" : `status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

async function sendInPieces(url: string, file: File, onPct: (pct: number) => void): Promise<string> {
  const total = file.size;
  const type = file.type || "application/octet-stream";
  const pct = (n: number) => onPct(total ? Math.min(99, Math.round((n / total) * 100)) : 99);
  /*
   * Up to one piece: the whole file in one request, no Content-Range, as
   * Google's simplest resumable upload (a file stuck at 0% on 31 Oct 2026 came
   * from piece uploads on a small file). Bigger files go in pieces; if Google
   * won't take a piece at all, the file goes in one request instead.
   */
  if (total <= PIECE) {
    const r = await sendWhole(url, file, type, pct);
    onPct(100);
    return r;
  }
  let at = 0;
  let failures = 0;
  while (true) {
    const end = Math.min(at + PIECE, total);
    try {
      const r = await put(url, file.slice(at, end), `bytes ${at}-${end - 1}/${total}`, type, (n) => pct(at + n));
      if (r.done) {
        onPct(100);
        return r.id;
      }
      at = r.next;
      failures = 0;
      pct(at);
    } catch (e) {
      if ((e as Error).message === "expired") throw new Error("The upload expired. Start it again.");
      /* The very first piece refused outright: this browser or network won't do pieces, so send it whole. */
      if (at === 0 && failures === 0 && (e as Error).message === "network") {
        failures++;
        try {
          const id = await sendWhole(url, file, type, pct);
          onPct(100);
          return id;
        } catch {
          /* Fall through to retrying the pieces. */
        }
      }
      if (++failures > TRIES) throw new Error("The connection kept dropping. Check it and try again; nothing is lost on Drive.");
      await new Promise((ok) => setTimeout(ok, Math.min(30_000, 1000 * 2 ** failures)));
      /* Ask Google where it got to, then go on from there. */
      try {
        const r = await put(url, null, `bytes */${total}`, type);
        if (r.done) return r.id;
        at = r.next;
      } catch {
        /* Still offline: the next round asks again. */
      }
    }
  }
}

/* The file in one request, tried three times. */
async function sendWhole(url: string, file: File, type: string, pct: (n: number) => void): Promise<string> {
  let last: Error = new Error("Upload failed.");
  for (let i = 0; i < 3; i++) {
    try {
      const r = await put(url, file, null, type, pct);
      if (r.done) return r.id;
      last = new Error("Upload didn't finish.");
    } catch (e) {
      if ((e as Error).message === "expired") throw new Error("The upload expired. Start it again.");
      last = e as Error;
    }
    await new Promise((ok) => setTimeout(ok, 1500 * (i + 1)));
  }
  throw new Error(last.message === "network" ? "Network error during upload. Check your connection and try again." : `Upload failed (${last.message}).`);
}
