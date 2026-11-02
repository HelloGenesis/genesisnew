"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * WEBSITE ANALYTICS, THE COUNTING (Genesis, 31 Oct 2026: "a visitor analytics
 * page for the websites"). Every page seen on the public site, how long it was
 * on screen, and the buttons and links clicked, to app/api/track. A visit is
 * this tab until it's left alone for 30 minutes; the visitor id is random and
 * only tells new visitors from returning ones. No cookies, nothing personal,
 * nothing on the CRM's own pages; Do Not Track is honoured.
 */
const IDLE = 30 * 60_000;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function store(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function ids() {
  const local = store("local");
  const session = store("session");
  let vid = local?.getItem("gm_vid") ?? null;
  const isNew = !vid;
  if (!vid) {
    vid = uid();
    local?.setItem("gm_vid", vid);
  }
  const last = Number(session?.getItem("gm_last") ?? 0);
  let sid = session?.getItem("gm_sid") ?? null;
  if (!sid || Date.now() - last > IDLE) {
    sid = uid();
    session?.setItem("gm_sid", sid);
    session?.setItem("gm_first", "1");
  }
  session?.setItem("gm_last", String(Date.now()));
  const first = session?.getItem("gm_first") === "1";
  session?.setItem("gm_first", "0");
  return { sid, vid, isNew: isNew || (first && local?.getItem("gm_seen") !== "1") };
}

function send(body: object) {
  const data = JSON.stringify(body);
  if (navigator.sendBeacon?.(`/api/track`, new Blob([data], { type: "application/json" }))) return;
  void fetch("/api/track", { method: "POST", body: data, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
}

export function SiteTracker() {
  const path = usePathname();
  const page = useRef<{ path: string; since: number; sid: string } | null>(null);

  useEffect(() => {
    if (!path || /^\/(admin|portal|lab|demo|login|account|review|quote|invoice|p\/)/.test(path)) return;
    if (navigator.doNotTrack === "1") return;
    const { sid, vid, isNew } = ids();
    const params = new URLSearchParams(window.location.search);
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
    send({ t: "view", sid, vid, isNew, path, title: document.title.slice(0, 200), ...(ref ? { ref } : {}), utm: { source: params.get("utm_source") ?? undefined, medium: params.get("utm_medium") ?? undefined, campaign: params.get("utm_campaign") ?? undefined } });
    store("local")?.setItem("gm_seen", "1");
    page.current = { path, since: Date.now(), sid };
    const leave = () => {
      const p = page.current;
      if (!p) return;
      send({ t: "leave", sid: p.sid, path: p.path, ms: Math.min(Date.now() - p.since, 6 * 3600_000) });
    };
    const hidden = () => document.visibilityState === "hidden" && leave();
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leave);
    return () => {
      leave();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leave);
    };
  }, [path]);

  /* Clicks on buttons and links, by their words (Wix's "most clicked buttons"); form sends. */
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("a, button");
      const p = page.current;
      if (!el || !p) return;
      const label = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (label) send({ t: "click", sid: p.sid, path: p.path, label });
    };
    const submit = (e: SubmitEvent) => {
      const p = page.current;
      const form = e.target as HTMLFormElement | null;
      if (!p || !form) return;
      send({ t: "click", kind: "form", sid: p.sid, path: p.path, label: (form.getAttribute("aria-label") || form.getAttribute("name") || form.id || "Form").slice(0, 80) });
    };
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
    };
  }, []);

  return null;
}
