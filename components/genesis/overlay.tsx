"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { getLenis } from "./smooth-scroll";

/**
 * A panel over the landing page, with the page blurred and held still behind.
 *
 * ONE SHELL FOR EVERY DETAIL VIEW, because the site no longer has any other
 * pages to put them on. Genesis asked for everything except the two forms to
 * live on the landing page, so a case study, a portfolio piece and an AI
 * avatar all open here instead of at a URL of their own. Three dialogs built
 * three times would disagree about Escape, focus and scrolling within a week.
 *
 * WHAT IT OWES THE READER:
 *
 *   ESCAPE, A BACKDROP CLICK AND THE CLOSE BUTTON all dismiss it. The backdrop
 *     listens on mousedown, not click, so a text selection that starts inside
 *     the panel and is released outside it does not shut what was being read.
 *   FOCUS moves into the panel on open, is trapped there while it is open, and
 *     goes back to whatever opened it on close.
 *   THE PAGE BEHIND DOES NOT MOVE. This is the part the first case-study
 *     dialog got wrong. The site scrolls through Lenis, which listens to the
 *     wheel on the window, and `overflow: hidden` does not stop it — so the
 *     page could be scrolled underneath an open panel. Lenis is stopped here,
 *     the document is locked, and `data-lenis-prevent` lets a long panel still
 *     scroll natively inside itself.
 *   A LINK TO A SECTION CLOSES IT FIRST. "Start a project" inside a piece
 *     points at /#contact. Followed normally, it would try to scroll a page
 *     that is locked and then leave the reader with the panel still open on
 *     top. It is caught, the panel closes, and the scroll happens once the
 *     page has been released.
 *
 * THE BLUR IS ON THE BACKDROP, NOT THE PAGE. Filtering the document would
 * repaint every section behind it and create a containing block this fixed
 * layer would then be trapped inside.
 *
 * IT IS PORTALLED TO THE BODY, and that is a bug fix rather than tidiness.
 * This used to render where it was written — inside the section that opened
 * it — and every one of those sections sits under a `Reveal`, which animates
 * with a transform. A transformed ancestor becomes the containing block for
 * `position: fixed` descendants, so "fixed inset-0" was not the viewport at
 * all: it was that section's box. The panel sat wherever the section
 * happened to be, the navigation bar painted over it despite a far higher
 * z-index (a transform makes a stacking context too), and the top of the
 * panel could be scrolled away entirely. Genesis reported both halves of
 * that: the window is "not even aligned properly" and the nav on top of it.
 *
 * AND IT IS SHAPED LIKE A WINDOW, which Genesis asked for in the same
 * message: a title bar with the three buttons, the red one closing it.
 */
/**
 * Stepping through a set without closing the window — Genesis's "left/right
 * arrow to view the portfolio", everywhere a piece opens. Labels name the
 * destination so a screen reader announces where the arrow goes.
 */
export type OverlayPager = {
  onPrevious: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
  /** "3 / 16" — where the reader is, so the loop has edges. */
  position?: string;
};

export function Overlay({
  open,
  label,
  onClose,
  children,
  className,
  pager,
}: {
  open: boolean;
  /** Read out as the dialog's name. */
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  pager?: OverlayPager;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  /*
    The latest onClose, without making it an effect dependency. Callers pass an
    inline arrow, and with it in the dependency list every re-render of the
    parent — stepping between avatars, say — would tear the lock down and put
    it back, bouncing focus to the opener and back each time.
  */
  const close = useRef(onClose);
  const paging = useRef(pager);
  useEffect(() => {
    close.current = onClose;
    paging.current = pager;
  });

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;

    const lenis = getLenis();
    lenis?.stop();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
        return;
      }
      /*
        ARROW KEYS STEP THE SET, except where they already mean something: a
        video with controls seeks with them and a field moves its caret.
      */
      if (
        paging.current &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        const el = document.activeElement;
        const busy =
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLVideoElement ||
          (el instanceof HTMLElement && el.isContentEditable);
        if (!busy) {
          event.preventDefault();
          if (event.key === "ArrowLeft") paging.current.onPrevious();
          else paging.current.onNext();
          return;
        }
      }
      if (event.key !== "Tab") return;
      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
      root.style.overflow = previousOverflow;
      lenis?.start();
      const target = opener.current;
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    };
  }, [open]);

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href || !(href.startsWith("/#") || href.startsWith("#"))) return;
    event.preventDefault();
    const id = href.split("#")[1];
    close.current();
    /* Two frames: one for the close to render, one for the lock to lift. */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const section = document.getElementById(id);
        if (!section) return;
        history.replaceState(null, "", `#${id}`);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(section);
        else section.scrollIntoView({ behavior: "smooth" });
      }),
    );
  };

  /*
    `document` below is safe without a mounted flag: this returns null unless
    `open`, and `open` is state a click sets, so the portal is only ever
    reached in a browser. A useState/useEffect pair to prove that would be
    two renders to say what the line above already guarantees.
  */
  if (!open) return null;

  const dismissFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) close.current();
  };

  return createPortal(
    <div
      data-lenis-prevent
      onMouseDown={dismissFromBackdrop}
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/55 backdrop-blur-xl"
    >
      <div
        onMouseDown={dismissFromBackdrop}
        /*
          CENTRED AT EVERY SIZE. It was `items-start` below `sm`, from when
          the panel could be taller than the screen and had to be scrolled
          from the top of the page. The window now caps its own height and
          scrolls inside itself, so there is nothing left to scroll past and
          a phone gets the same centred window a desktop does.
        */
        className="flex min-h-full items-center justify-center p-3 sm:p-8"
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          onClickCapture={onClickCapture}
          className={cn(
            "relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden",
            "rounded-xl border border-[var(--glass-border)] bg-[var(--surface-raised)] shadow-2xl outline-none",
            "sm:max-h-[calc(100dvh-4rem)] sm:rounded-[0.875rem]",
            className,
          )}
        >
          {/*
            THE TITLE BAR. The red button closes the window and is a real
            button with a real label; the amber and green are decoration and
            are hidden from assistive technology, because a minimise that
            does not minimise is worse than no minimise at all.

            The three colours are macOS's own rather than the brand's six.
            They are the whole point of the reference — a traffic light in
            yellow, yellow and yellow is not one — and they are chrome around
            the content rather than part of the page's palette.
          */}
          <div className="relative flex h-10 shrink-0 items-center gap-2 border-b border-[var(--glass-border)] bg-[var(--surface-panel)] px-4">
            <button
              type="button"
              onClick={() => close.current()}
              aria-label="Close"
              className="group grid size-3 place-items-center rounded-full bg-[#ff5f57] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]"
            >
              <svg
                aria-hidden
                viewBox="0 0 10 10"
                className="size-2 text-black/55 opacity-0 transition-opacity group-hover:opacity-100"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M2.5 2.5 7.5 7.5M7.5 2.5 2.5 7.5" />
              </svg>
            </button>
            <span aria-hidden className="size-3 rounded-full bg-[#febc2e]" />
            <span aria-hidden className="size-3 rounded-full bg-[#28c840]" />

            {/*
              The window's title, centred the way a Mac centres it — and
              `pointer-events-none` so it cannot swallow a click meant for
              the buttons underneath its own box.
            */}
            <span className="pointer-events-none absolute inset-x-24 truncate text-center text-micro font-medium !tracking-normal text-ash">
              {label}
            </span>
          </div>

          {/* The content, scrolling inside the window rather than moving it. */}
          <div className="overflow-y-auto overscroll-contain p-6 sm:p-9">{children}</div>

          {pager?.position && (
            <span className="pointer-events-none absolute right-4 top-2.5 text-micro tabular-nums text-ash">
              {pager.position}
            </span>
          )}
        </div>

        {/*
          THE ARROWS SIT OUTSIDE THE WINDOW, on the backdrop at the screen's
          edges, where a gallery's controls are looked for — and fixed, so
          they stay put while the window scrolls. On a phone the window runs
          nearly edge to edge and they sit over its sides.
        */}
        {pager && (
          <>
            <PagerButton side="left" label={pager.previousLabel} onClick={pager.onPrevious} />
            <PagerButton side="right" label={pager.nextLabel} onClick={pager.onNext} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function PagerButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(event) => event.stopPropagation()}
      aria-label={label}
      className={cn(
        "fixed top-1/2 z-[101] grid size-11 -translate-y-1/2 place-items-center rounded-full",
        "border border-white/20 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        side === "left" ? "left-2 sm:left-5" : "right-2 sm:right-5",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/**
 * The pager for a list: wraps at both ends, names each destination.
 * Returns undefined when there is nothing to step to.
 */
export function pagerFor<T>(
  items: readonly T[],
  index: number,
  go: (item: T) => void,
  name: (item: T) => string,
): OverlayPager | undefined {
  if (index < 0 || items.length < 2) return undefined;
  const previous = items[(index - 1 + items.length) % items.length];
  const next = items[(index + 1) % items.length];
  return {
    onPrevious: () => go(previous),
    onNext: () => go(next),
    previousLabel: `Previous: ${name(previous)}`,
    nextLabel: `Next: ${name(next)}`,
    position: `${index + 1} / ${items.length}`,
  };
}
