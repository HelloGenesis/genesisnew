"use client";

import { useCallback, useEffect, useRef } from "react";

import { type CaseStudy, isPublished } from "@/lib/case-studies";
import { cn } from "@/lib/utils";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";

/**
 * A case study, opened over the landing page with the page blurred behind it.
 *
 * WHY THIS EXISTS RATHER THAN A ROUTE. Genesis asked for the posters to be
 * interactive — click one, the page behind blurs, the study appears — and
 * separately that nothing but the two forms should change page. A route
 * satisfies neither: it replaces the page instead of layering over it, and it
 * loses the reader's place in a scroll they were halfway through.
 *
 * IT IS A DIALOG, WITH EVERYTHING A DIALOG OWES THE READER, because a div with
 * a click handler is the usual way this gets built and it strands anyone not
 * using a mouse:
 *
 *   ESCAPE CLOSES IT and so does a click on the backdrop, which are the two
 *     gestures every reader already expects.
 *   FOCUS GOES INTO IT on open and comes back to the poster on close, so a
 *     keyboard reader is not dropped at the top of the document.
 *   FOCUS IS TRAPPED while it is open — Tab past the last control returns to
 *     the first — so tabbing does not wander invisibly through the blurred
 *     page underneath.
 *   THE PAGE BEHIND IS INERT: `aria-hidden` is not enough on its own, so the
 *     body also stops scrolling. A backdrop that blurs but still scrolls is
 *     the thing that makes these feel broken.
 *
 * THE BLUR IS ON THE BACKDROP, NOT ON THE PAGE. Filtering the whole document
 * would force a repaint of every section behind it and, worse, create a new
 * containing block that this fixed overlay would then be trapped inside.
 * `backdrop-filter` on the overlay blurs whatever it happens to cover, costs
 * one composited layer, and cannot disturb the layout underneath.
 */
export function CaseStudyDialog({
  study,
  onClose,
}: {
  study: CaseStudy | null;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<Element | null>(null);

  const open = study !== null;

  /* Remember what was focused, so it can be handed back on close. */
  useEffect(() => {
    if (open) restoreTo.current = document.activeElement;
  }, [open]);

  const close = useCallback(() => {
    onClose();
    const target = restoreTo.current;
    if (target instanceof HTMLElement) target.focus();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* Focus the panel itself rather than guessing at a first control. */
    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (!study) return null;

  const published = isPublished(study);
  const sections = [
    { label: "The problem", body: study.problem },
    { label: "The strategy", body: study.strategy },
    { label: "The execution", body: study.execution },
  ].filter((s) => s.body && !s.body.startsWith("TODO"));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-4 backdrop-blur-xl sm:p-8"
      onMouseDown={(event) => {
        /*
          mousedown on the BACKDROP ONLY. Using onClick here closes the dialog
          when a drag that began inside the panel happens to end outside it —
          selecting a line of the study and releasing past its edge would shut
          the thing the reader was reading.
        */
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`${study.client} case study`}
        tabIndex={-1}
        className={cn(
          "relative my-auto w-full max-w-4xl rounded-[1.75rem] border border-[var(--glass-border)]",
          "bg-[var(--surface-raised)] p-6 shadow-2xl outline-none sm:p-9",
        )}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close case study"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p className="micro-label !text-brand">{study.discipline}</p>
        <h2 className="mt-3 text-balance text-h3 font-normal leading-[1.08] tracking-tight text-bone sm:text-h2">
          {study.client}
        </h2>
        {study.headline && !study.headline.startsWith("TODO") && (
          <p className="mt-3 text-pretty text-body leading-relaxed text-ash sm:text-lead">
            {study.headline}
          </p>
        )}

        {study.hero && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-ink">
            {study.hero.endsWith(".mp4") ? (
              <video
                src={study.hero}
                controls
                playsInline
                preload="metadata"
                {...VIDEO_GUARD_CLIENT}
                className="aspect-video w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={study.hero} alt="" className="aspect-video w-full object-cover" />
            )}
          </div>
        )}

        {study.results && study.results.length > 0 && (
          <ul className="mt-7 grid gap-4 sm:grid-cols-3">
            {study.results.map((metric) => (
              <li
                key={metric.label}
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-wash)] p-4"
              >
                <p className="text-h3 font-normal leading-none text-brand-ink">
                  {metric.value}
                </p>
                <p className="mt-2 text-micro uppercase tracking-[0.12em] text-ash">
                  {metric.label}
                </p>
              </li>
            ))}
          </ul>
        )}

        {sections.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="micro-label">{section.label}</p>
                <p className="mt-2 text-pretty text-small leading-relaxed text-ash">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {/*
          THE HONEST EMPTY STATE. Two of the four studies have no copy written
          yet. Opening one to a blank panel would read as a broken dialog, so
          it says what is true — the work is real, the write-up is not done —
          rather than showing furniture with nothing in it.
        */}
        {!published && sections.length === 0 && (
          <p className="mt-8 text-pretty text-small leading-relaxed text-ash">
            The full write-up for this campaign is being prepared. The work
            itself is in the portfolio below.
          </p>
        )}
      </div>
    </div>
  );
}
