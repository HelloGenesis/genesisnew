"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The pop-up's scrolling area — the window's content, not the page. */
const scrollerOf = (el: HTMLElement | null) => el?.closest<HTMLElement>(".overflow-y-auto") ?? null;

/** Scrolls a pop-up to one of its `data-section` blocks, clear of the pinned tabs. */
export function scrollToSection(from: HTMLElement | null, key: string) {
  const scroller = scrollerOf(from);
  const target = scroller?.querySelector<HTMLElement>(`[data-section="${key}"]`);
  if (!scroller || !target) return;
  const nav = scroller.querySelector<HTMLElement>("[data-popup-nav]");
  const offset = (nav?.offsetHeight ?? 0) + 12;
  const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - offset;
  scroller.scrollTo({ top, behavior: "smooth" });
}

/**
 * THE POP-UP'S OWN TABS (Genesis, 3 Oct 2026: "make this page UI/UX better and
 * user friendly"). A long window — pictures, what's included, the price and
 * extras, how it works, the work, the terms — gets a row of tabs pinned to
 * its top: one tap goes to a section, and the one being read is lit as you
 * scroll. Sections are marked `data-section` in the pop-up.
 */
export function PopupNav({ sections }: { sections: { key: string; label: string }[] }) {
  const nav = useRef<HTMLElement>(null);
  const [active, setActive] = useState(sections[0]?.key);

  useEffect(() => {
    const scroller = scrollerOf(nav.current);
    if (!scroller) return;
    const onScroll = () => {
      const line = scroller.getBoundingClientRect().top + (nav.current?.offsetHeight ?? 0) + 40;
      let current = sections[0]?.key;
      for (const { key } of sections) {
        const el = scroller.querySelector<HTMLElement>(`[data-section="${key}"]`);
        if (el && el.getBoundingClientRect().top <= line) current = key;
      }
      /* At the very end, the last section, however short. */
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) current = sections[sections.length - 1]?.key;
      setActive(current);
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [sections]);

  return (
    <nav
      ref={nav}
      data-popup-nav
      aria-label="In this window"
      /*
        FLUSH WITH THE WINDOW'S EDGES. The window pads its content (p-6 / p-9)
        and the pop-up pads again (px-5 / px-8); the tabs pull back through
        both, and stick at minus the top padding, so nothing scrolls past
        above or beside them.
      */
      className="sticky -top-6 z-20 -mx-11 -mt-6 mb-6 border-b border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--surface-raised)_92%,transparent)] px-11 py-2.5 backdrop-blur-xl sm:-top-9 sm:-mx-[4.25rem] sm:-mt-9 sm:px-[4.25rem]"
    >
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map(({ key, label }) => (
          <li key={key} className="shrink-0">
            <button
              type="button"
              aria-current={active === key ? "true" : undefined}
              onClick={() => scrollToSection(nav.current, key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                active === key ? "bg-brand text-on-brand" : "text-ash hover:bg-[var(--hover-wash)] hover:text-bone",
              )}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * THE BUY BAR, pinned to the window's foot: what it is, what it comes to with
 * the extras chosen, and one button to the price box — so buying never means
 * hunting for the button in a long window.
 */
export function BuyBar({ name, price, action, onAction }: { name: string; price: ReactNode; action: string; onAction: (from: HTMLElement | null) => void }) {
  const bar = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={bar}
      /* Flush with the window's foot and sides — see PopupNav. */
      className="sticky -bottom-6 z-20 -mx-11 -mb-6 mt-10 border-t border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--surface-raised)_92%,transparent)] px-11 py-3 backdrop-blur-xl sm:-bottom-9 sm:-mx-[4.25rem] sm:-mb-9 sm:px-[4.25rem]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-small text-ash">{name}</p>
          <p className="font-display text-lead leading-tight tabular-nums text-bone">{price}</p>
        </div>
        <button
          type="button"
          onClick={() => onAction(bar.current)}
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-small font-medium text-on-brand shadow-[0_8px_24px_-10px_rgb(255_197_22/0.6)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {action}
        </button>
      </div>
    </div>
  );
}
