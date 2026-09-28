"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Two aids for pages ten sections long.
 *
 * JumpBar — the sections as a row of links, pinned under the nav once the
 * reader is past the opening, with the one they are in lit. A returning buyer
 * goes straight to the plans instead of scrolling past the pitch again.
 *
 * MobileCta — on a phone the page's buttons spend most of the scroll out of
 * view. A slim bar at the foot keeps "See plans" and "Book a call" in reach,
 * leaving the right-hand corner to the WhatsApp button so the two never
 * overlap. Hidden on the opening screen, where the hero's own buttons are.
 */

export type JumpLink = { id: string; label: string };

export function JumpBar({ links }: { links: JumpLink[] }) {
  const [shown, setShown] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

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
  }, [links]);

  return (
    <nav
      aria-label="On this page"
      className={cn(
        "fixed inset-x-0 top-[4.75rem] z-30 hidden justify-center px-6 transition-[opacity,transform] duration-300 md:flex",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
      <ul className="glass-chip flex gap-1 rounded-full p-1 shadow-[var(--shadow-panel)]">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              data-track={`jump:${link.id}`}
              tabIndex={shown ? 0 : -1}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3.5 text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                current === link.id ? "bg-brand text-on-brand" : "text-ash hover:text-bone",
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
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
