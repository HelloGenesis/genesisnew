"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { useWorkMode } from "./work-mode";

/**
 * Two aids for pages ten sections long.
 *
 * JumpBar — the sections as a column of links, pinned to the right edge at
 * mid-height once the reader is past the opening, with the one they are in
 * lit (Genesis, 2 Oct 2026: "add this bar on the right center, vertical").
 * Below 2xl the page's column reaches too close to the edge for a column of
 * words, so it rests as a rail of dots — the current one long and yellow —
 * and opens to its labels when hovered or tabbed into. A returning buyer
 * goes straight to the plans instead of scrolling past the pitch again.
 *
 * MobileCta — on a phone the page's buttons spend most of the scroll out of
 * view. A slim bar at the foot keeps "See plans" and "Book a call" in reach,
 * leaving the right-hand corner to the WhatsApp button so the two never
 * overlap. Hidden on the opening screen, where the hero's own buttons are.
 */

export type JumpLink = {
  id: string;
  label: string;
  /** A section that exists only on the Subscriptions side: the link switches the page to it first. */
  mode?: "membership";
};

/*
  THE BAR AT REST IS A SLIM COLUMN OF DOTS (Genesis, 2 Oct 2026: "fix this
  design"): each link a 32px circle with its dot centred, the current one a
  taller yellow dot — no yellow pill around a black bar. The pill, the labels
  and the right-aligned row only arrive when the bar opens: hovered, tabbed
  into, or on a screen wide enough (2xl) to keep it open.
*/
const OPEN_ROW =
  "group-hover/jump:w-auto group-hover/jump:justify-end group-hover/jump:gap-2 group-hover/jump:px-3 " +
  "group-focus-within/jump:w-auto group-focus-within/jump:justify-end group-focus-within/jump:gap-2 group-focus-within/jump:px-3 " +
  "2xl:w-auto 2xl:justify-end 2xl:gap-2 2xl:px-3 " +
  "group-data-[open]/jump:w-auto group-data-[open]/jump:justify-end group-data-[open]/jump:gap-2 group-data-[open]/jump:px-3";
const OPEN_ACTIVE =
  "group-hover/jump:bg-brand group-hover/jump:text-on-brand group-focus-within/jump:bg-brand group-focus-within/jump:text-on-brand 2xl:bg-brand 2xl:text-on-brand group-data-[open]/jump:bg-brand group-data-[open]/jump:text-on-brand";
/* The label's open state, shared by the links and Book a call. */
const OPEN_LABEL =
  "group-hover/jump:max-w-40 group-hover/jump:opacity-100 group-focus-within/jump:max-w-40 group-focus-within/jump:opacity-100 " +
  "2xl:max-w-40 2xl:opacity-100 group-data-[open]/jump:max-w-40 group-data-[open]/jump:opacity-100";

export function JumpBar({ links, bookHref }: { links: JumpLink[]; bookHref?: string }) {
  const [shown, setShown] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const work = useWorkMode();
  const mode = work?.mode;

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
    /* Re-observed when the page switches mode: the sections on the page change. */
  }, [links, mode]);

  /*
    A SUBSCRIPTIONS SECTION WHILE PAY-PER-PROJECT IS SHOWING isn't on the page
    yet: switch first, then scroll once it has rendered.
  */
  /*
    ON A PHONE, A THIN LINE (Genesis, 4 Oct 2026: "add a thin line for this,
    and when dragged on the device it shows each section"). Touching or
    dragging the line opens the bar with every label; sliding the finger down
    the open list picks a section, and letting go goes there. A tap on a
    label works too; a tap anywhere else closes it.
  */
  const [open, setOpen] = useState(false);
  const [scrub, setScrub] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);
  /* When it last closed: the tap that closed it must not land on the line underneath and reopen it. */
  const closedAt = useRef(0);
  const close = () => {
    closedAt.current = Date.now();
    setOpen(false);
  };
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) close();
    };
    /*
      A label tapped closes it. Caught on the window, in capture: the smooth
      scroller takes anchor clicks at the document and stops them there, so
      the link's own onClick never runs.
    */
    const picked = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest?.("a[data-jump]") && nav.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("click", picked, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("click", picked, true);
    };
  }, [open]);
  /* Back up at the hero the bar hides, and closes with it. */
  const isOpen = open && shown;

  const rowAt = (touch: { clientX: number; clientY: number }) => {
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    return target?.closest<HTMLAnchorElement>("a[data-jump]") ?? null;
  };
  const onTouchStart = () => {
    if (Date.now() - closedAt.current < 500) return;
    setOpen(true);
    setScrub(null);
  };
  const onTouchMove = (event: React.TouchEvent) => {
    const row = rowAt(event.touches[0]);
    setScrub(row?.dataset.jump ?? null);
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const row = rowAt(event.changedTouches[0]);
    setScrub(null);
    if (row) {
      event.preventDefault();
      row.click();
    }
  };
  const activeIndex = Math.max(0, links.findIndex((link) => link.id === current));

  const go = (event: React.MouseEvent, link: JumpLink) => {
    close();
    if (!link.mode || !work || work.mode === link.mode) return;
    event.preventDefault();
    work.setMode(link.mode);
    window.setTimeout(() => {
      document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${link.id}`);
    }, 350);
  };

  return (
    <nav
      ref={nav}
      aria-label="On this page"
      data-open={isOpen || undefined}
      onTouchStart={isOpen ? undefined : onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        "group/jump fixed right-1.5 top-1/2 z-30 -translate-y-1/2 transition-[opacity,transform] duration-300 max-md:origin-right max-md:scale-90 md:right-3 2xl:right-5",
        shown ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0",
      )}
    >
      {/* The phone's line: the sections as a thin track, the current one lit. */}
      <button
        type="button"
        aria-label="Show the sections on this page"
        aria-expanded={isOpen}
        onClick={() => {
          if (Date.now() - closedAt.current > 500) setOpen(true);
        }}
        tabIndex={shown ? 0 : -1}
        className="flex h-40 w-7 justify-end py-1 pr-2.5 md:hidden group-data-[open]/jump:hidden"
      >
        <span aria-hidden className="relative h-full w-1 overflow-hidden rounded-full bg-white/25 shadow-[0_0_0_1px_rgb(0_0_0/0.25)]">
          <span
            className="absolute inset-x-0 rounded-full bg-brand transition-[top] duration-300"
            style={{ height: `${100 / links.length}%`, top: `${(activeIndex * 100) / links.length}%` }}
          />
        </span>
      </button>
      <ul className="glass-chip flex flex-col items-end gap-0.5 rounded-full p-1 shadow-[var(--shadow-panel)] group-hover/jump:rounded-[1.25rem] group-focus-within/jump:rounded-[1.25rem] max-md:hidden max-md:group-data-[open]/jump:flex group-data-[open]/jump:rounded-[1.25rem] 2xl:rounded-[1.25rem]">
        {links.map((link) => {
          const active = current === link.id;
          return (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={(event) => go(event, link)}
                data-track={`jump:${link.id}`}
                data-jump={link.id}
                tabIndex={shown ? 0 : -1}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "flex h-8 w-8 items-center justify-center gap-0 rounded-full text-[0.8125rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  OPEN_ROW,
                  active ? OPEN_ACTIVE : "text-ash hover:text-bone",
                  scrub === link.id && !active && "bg-[var(--hover-wash)] text-bone",
                )}
              >
                {/* The label: always from 2xl, on hover or focus below it. */}
                <span
                  className={cn(
                    "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-300",
                    OPEN_LABEL,
                  )}
                >
                  {link.label}
                </span>
                {/* The dot, which is all of it at rest below 2xl. */}
                <span
                  aria-hidden
                  className={cn(
                    "shrink-0 rounded-full transition-all duration-300 2xl:hidden",
                    "group-hover/jump:hidden group-focus-within/jump:hidden group-data-[open]/jump:hidden",
                    active ? "h-4 w-1.5 bg-brand" : "size-1.5 bg-current opacity-60",
                  )}
                />
              </a>
            </li>
          );
        })}
        {/* BOOK A CALL, the bar's last stop (Genesis, 2 Oct 2026). */}
        {bookHref && (
          <li className="mt-1 w-full border-t border-[var(--glass-border)] pt-1.5 [&>a]:ml-auto">
            <a
              href={bookHref}
              {...(/^https?:\/\//.test(bookHref) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              data-track="jump:book-call"
              data-jump="book-call"
              onClick={close}
              tabIndex={shown ? 0 : -1}
              aria-label="Book a 15-min call"
              className={cn(
                "flex h-8 w-8 items-center justify-center gap-0 rounded-full text-[0.8125rem] font-medium text-brand-ink transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                OPEN_ROW,
              )}
            >
              <span
                className={cn(
                  "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-300",
                  OPEN_LABEL,
                )}
              >
                Book a call
              </span>
              <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}

export function MobileCta({
  primary,
  bookHref,
}: {
  primary: { label: string; href: string };
  bookHref: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const external = /^https?:\/\//.test(bookHref);

  return (
    <div
      className={cn(
        "fixed bottom-5 left-4 right-[5.25rem] z-40 flex gap-2 transition-[opacity,transform] duration-300 md:hidden",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <a
        href={primary.href}
        data-track="mobile-cta:primary"
        tabIndex={shown ? 0 : -1}
        className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand px-4 text-small text-on-brand shadow-[var(--shadow-panel)]"
      >
        {primary.label}
      </a>
      <a
        href={bookHref}
        data-track="mobile-cta:book"
        tabIndex={shown ? 0 : -1}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="glass-strong flex h-12 items-center justify-center gap-2 rounded-full px-4 text-small text-bone shadow-[var(--shadow-panel)]"
      >
        <CalendarDays className="size-4 text-brand-ink" aria-hidden />
        Book a call
      </a>
    </div>
  );
}
