"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

/** One step: what to light up (optional) and what to say about it. */
export type TourStep = {
  /** A CSS selector, or "text:Words" for the first visible heading, button or label starting with those words. */
  target?: string;
  title: string;
  body: string;
};

const TEXTUAL = "h1, h2, h3, button, a, summary, label, legend, th, span, p, [role=tab]";

/** The visible element a step points at, or null (the step is then shown in the middle). */
export function findTarget(target: string): HTMLElement | null {
  if (target.startsWith("text:")) {
    const words = target.slice(5).trim().toLowerCase();
    const all = [...document.querySelectorAll<HTMLElement>(TEXTUAL)].filter((el) => el.offsetParent !== null && !el.closest("[data-tour-card]"));
    /* The smallest element whose own text starts with the words: the heading or button itself, not its section. */
    /* "＋ Add a creator" matches "Add a creator": leading symbols and icons are ignored. */
    const text = (el: HTMLElement) => el.innerText.trim().replace(/^[^\p{L}\p{N}#₹]+/u, "").toLowerCase();
    return all.filter((el) => text(el).startsWith(words)).sort((a, b) => a.innerText.length - b.innerText.length)[0] ?? null;
  }
  try {
    return [...document.querySelectorAll<HTMLElement>(target)].find((el) => el.offsetParent !== null) ?? null;
  } catch {
    return null;
  }
}

/**
 * THE SPOTLIGHT (components/crm/app-tour and the pages' "How it works"): dims
 * the page, rings the step's element, and shows a card beside it (under it on
 * a phone, centred when there's nothing to point at). Arrow keys move, Esc
 * closes.
 */
export function TourOverlay({ steps, onClose, startLabel = "Start" }: { steps: TourStep[]; onClose: () => void; startLabel?: string }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const step = steps[i];

  const measure = useCallback(() => {
    const el = step?.target ? findTarget(step.target) : null;
    if (!el) return setBox(null);
    setBox(el.getBoundingClientRect());
  }, [step]);
  useLayoutEffect(() => {
    const el = step?.target ? findTarget(step.target) : null;
    /* In the sidebar, scroll as little as possible; on the page, bring it to the middle. */
    el?.scrollIntoView({ block: el.closest("nav") ? "nearest" : "center", inline: "center", behavior: "smooth" });
    const frame = window.requestAnimationFrame(measure);
    const later = window.setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(later);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, steps.length]);

  const card = useMemo(() => {
    if (!box || typeof window === "undefined") return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" } as const;
    const wide = window.innerWidth >= 1024;
    if (wide && box.right + 380 < window.innerWidth) return { left: box.right + 16, top: Math.max(16, Math.min(box.top - 8, window.innerHeight - 280)) };
    if (wide && box.left - 380 > 0) return { left: box.left - 368, top: Math.max(16, Math.min(box.top - 8, window.innerHeight - 280)) };
    const below = box.bottom + 12;
    return below + 260 < window.innerHeight ? { left: 16, right: 16, top: below } : { left: 16, right: 16, top: Math.max(16, box.top - 272) };
  }, [box]);

  if (!step) return null;
  const last = i === steps.length - 1;
  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl ring-2 ring-[#ffc516] transition-all duration-300"
          style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.62)" }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-black/60" />
      )}
      <div data-tour-card className="fixed max-w-sm rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-float,#1d1b1f)] p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)] sm:w-[22rem]" style={card}>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-ash hover:bg-[var(--hover-wash)] hover:text-bone">
          <X className="size-4" aria-hidden />
        </button>
        <p className="text-[0.75rem] uppercase tracking-[0.12em] text-faint">
          {i + 1} of {steps.length}
        </p>
        <h2 id="tour-title" className="mt-1.5 pr-8 font-sans text-[1.25rem] font-semibold text-bone">{step.title}</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ash">{step.body}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="text-[0.875rem] text-ash underline-offset-4 hover:text-bone hover:underline">
            {last ? "" : "Skip"}
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button type="button" onClick={() => setI(i - 1)} className="crm-btn crm-btn-secondary crm-btn-sm">
                Back
              </button>
            )}
            <button type="button" onClick={() => (last ? onClose() : setI(i + 1))} className="crm-btn crm-btn-primary crm-btn-sm">
              {last ? "Done" : i === 0 ? startLabel : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
