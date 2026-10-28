/**
 * One file into a project's folder on Genesis's Drive (lib/crm/drive): the
 * server opens a resumable session, the browser sends the bytes to Google
 * itself, then the server records it. Used by a project's Files and by the
 * CRM's Files and Creative Library pages.
 */
export async function uploadToProject(file: File, to: { projectId: string; folder: string; audience?: string; review?: boolean }, onPct: (pct: number) => void) {
  const start = await fetch("/api/crm/files/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: to.projectId, folder: to.folder, audience: to.audience || undefined, name: file.name, mimeType: file.type || "application/octet-stream", size: file.size }),
  });
  const started = (await start.json()) as { uploadUrl?: string; ticket?: string; error?: string };
  if (!start.ok || !started.uploadUrl) throw new Error(started.error ?? "Upload couldn't start.");
  const driveId = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", started.uploadUrl!);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const id = (JSON.parse(xhr.responseText) as { id?: string }).id;
        if (xhr.status < 300 && id) resolve(id);
        else reject(new Error("Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
  const done = await fetch("/api/crm/files/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: started.ticket, driveId, review: to.review }),
  });
  if (!done.ok) throw new Error(((await done.json()) as { error?: string }).error ?? "Couldn't save the file.");
}
