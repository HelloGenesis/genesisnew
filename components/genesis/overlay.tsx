"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

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
 */
export function Overlay({
  open,
  label,
  onClose,
  children,
  className,
}: {
  open: boolean;
  /** Read out as the dialog's name. */
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
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
  useEffect(() => {
    close.current = onClose;
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

  if (!open) return null;

  const dismissFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) close.current();
  };

  return (
    <div
      data-lenis-prevent
      onMouseDown={dismissFromBackdrop}
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/55 backdrop-blur-xl"
    >
      <div
        onMouseDown={dismissFromBackdrop}
        className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-8"
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          onClickCapture={onClickCapture}
          className={cn(
            "relative w-full max-w-4xl rounded-[1.75rem] border border-[var(--glass-border)]",
            "bg-[var(--surface-raised)] p-6 pt-14 shadow-2xl outline-none sm:p-9 sm:pt-14",
            className,
          )}
        >
          <button
            type="button"
            onClick={() => close.current()}
            aria-label="Close"
            className="absolute right-4 top-4 z-[2] grid size-9 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--surface-raised)] text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X className="size-4" aria-hidden />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
