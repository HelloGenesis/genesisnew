"use client";

import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * NOVA, LIVE (Genesis, 31 Oct 2026: "our real dashboard interface, usable …
 * what you see is what you get; a book-a-trial button top right and a full
 * screen button"; a "View demo" that opens it full screen). The real CRM in a window, signed in as the demo agency
 * (/demo, lib/crm/demo): every page opens and works, nothing is saved. Full
 * screen uses the browser's own, or fills the window where there is none
 * (iPhone Safari).
 */
export function NovaLive() {
  const box = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [loaded, setLoaded] = useState(false);
  /* "View demo" reopens it on the dashboard with the tour running (Genesis, 31 Oct 2026: "it should expand and start the tour"). */
  const [src, setSrc] = useState("/demo");

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  /* The window-filling fallback closes on Escape like the real thing. */
  useEffect(() => {
    if (!full || document.fullscreenElement) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [full]);

  const toggle = useCallback(async () => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) return void (await document.exitFullscreen());
    if (full) return setFull(false);
    if (el.requestFullscreen) await el.requestFullscreen().catch(() => setFull(true));
    else setFull(true);
  }, [full]);
  /* The demo, full screen, on the dashboard with the tour running: from this window's button, or any "View demo" on the page (ViewDemoButton). */
  const viewDemo = useCallback(
    (path = "/admin?tour=1") => {
      setLoaded(false);
      setSrc(`/demo?next=${encodeURIComponent(`${path}${path.includes("?") ? "&" : "?"}at=${Date.now()}`)}`);
      if (!full) void toggle();
    },
    [full, toggle],
  );
  useEffect(() => {
    /* No page given arrives as null (CustomEvent's default), which a default parameter doesn't catch. */
    const open = (e: Event) => viewDemo((e as CustomEvent<string | null>).detail ?? undefined);
    window.addEventListener("nova-view-demo", open);
    return () => window.removeEventListener("nova-view-demo", open);
  }, [viewDemo]);

  return (
    <div
      ref={box}
      className={`flex flex-col overflow-hidden border border-[var(--glass-border)] bg-[#141216] [color-scheme:dark] ${full ? "fixed inset-0 z-[100] rounded-none" : "relative h-[min(82svh,52rem)] rounded-[1.25rem] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]"}`}
    >
      <div className="flex shrink-0 items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate text-[0.75rem] text-white/45">nova.genesismedia.co · live demo, nothing is saved</span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {/* "View demo" opens it full screen (Genesis, 31 Oct 2026). */}
          {!full && (
            <button
              type="button"
              onClick={() => viewDemo()}
              className="rounded-full border border-white/20 px-3.5 py-1.5 text-[0.75rem] font-medium text-white transition-colors hover:border-white/50 hover:bg-white/10">
              View demo
            </button>
          )}
          <a href="#trial" onClick={() => document.fullscreenElement && document.exitFullscreen()} className="rounded-full bg-[#ffc516] px-3.5 py-1.5 text-[0.75rem] font-medium text-[#141216] transition-transform hover:scale-[1.03]">
            Start free trial
          </a>
          <button type="button" onClick={toggle} aria-label={full ? "Exit full screen" : "Full screen"} title={full ? "Exit full screen" : "Full screen"} className="grid size-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
            {full ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
          </button>
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center text-[0.8125rem] text-white/50">
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Opening the live demo…
            </span>
          </div>
        )}
        <iframe src={src} title="Nova by Genesis, live demo" loading="lazy" onLoad={() => setLoaded(true)} className={`size-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`} />
      </div>
    </div>
  );
}

/**
 * "View demo" anywhere on the Nova page: opens the live demo above full screen,
 * on `path` (the dashboard with the tour, unless told otherwise).
 */
export function ViewDemoButton({ className, path, children }: { className?: string; path?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("nova-view-demo", { detail: path }))}>
      {children}
    </button>
  );
}
