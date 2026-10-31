"use client";

import { useState, useTransition } from "react";

import { decideFromEmail } from "./actions";

export function ReviewForm({ token, start }: { token: string; start: "approve" | "changes" | null }) {
  const [mode, setMode] = useState<"approve" | "changes">(start ?? "approve");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, go] = useTransition();
  if (result?.ok) return <p className="rounded-2xl bg-[#28c840]/10 px-5 py-4 text-[#1f7a35]">{result.message}</p>;
  const decide = (d: "approve" | "changes") => go(async () => setResult(await decideFromEmail(token, d, note)));
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("approve")} aria-pressed={mode === "approve"} className={`rounded-full px-4 py-2 text-[0.9375rem] ${mode === "approve" ? "bg-[#141216] text-white" : "border border-[#d8d4cc] text-[#3a3630]"}`}>Approve</button>
        <button type="button" onClick={() => setMode("changes")} aria-pressed={mode === "changes"} className={`rounded-full px-4 py-2 text-[0.9375rem] ${mode === "changes" ? "bg-[#141216] text-white" : "border border-[#d8d4cc] text-[#3a3630]"}`}>Ask for changes</button>
      </div>
      {mode === "approve" ? (
        <button type="button" disabled={busy} onClick={() => decide("approve")} className="h-12 w-full rounded-full bg-[#ffc516] font-semibold text-[#141216] disabled:opacity-60">{busy ? "Approving…" : "Yes, approve it"}</button>
      ) : (
        <>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="Everything you'd like changed, in one note: the more specific, the faster the next version." className="w-full rounded-2xl border border-[#d8d4cc] bg-white px-4 py-3 text-[#141216] outline-none focus:border-[#ffc516]" />
          <button type="button" disabled={busy} onClick={() => decide("changes")} className="h-12 w-full rounded-full bg-[#141216] font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Send my changes"}</button>
        </>
      )}
      {result && !result.ok && <p role="alert" className="text-[0.9375rem] text-[#b42318]">{result.message}</p>}
    </div>
  );
}
