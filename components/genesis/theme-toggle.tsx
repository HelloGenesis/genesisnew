"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export type Theme = "light" | "dark";

const STORAGE_KEY = "genesis-theme";
/** Fired on the document when this tab changes the theme. */
const CHANGE_EVENT = "genesis-theme-change";

/**
 * Subscribes to every source that can change the resolved theme: this tab's
 * own toggle, the OS preference, and another tab writing to storage.
 */
function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  document.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    document.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * The RESOLVED theme, not the stored one. On a system-default visit nothing is
 * stored but the page is already light or dark, and the control has to agree
 * with what the visitor is looking at.
 */
function getSnapshot(): Theme {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "light" || stamped === "dark") return stamped;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/** The server cannot know the OS preference; dark is the site's default. */
function getServerSnapshot(): Theme {
  return "dark";
}

/**
 * Light/dark switch.
 *
 * THREE STATES, TWO POSITIONS. Until someone chooses, the site follows the OS:
 * `data-theme` is not stamped and the `prefers-color-scheme` block in
 * globals.css resolves it. The first interaction stamps an explicit choice,
 * which then beats the OS in both directions and persists.
 *
 * Read through `useSyncExternalStore` rather than `useState` + an effect. The
 * theme lives outside React — in an attribute, in localStorage, and in a media
 * query — and this is the hook for exactly that. It also removes the
 * one-frame flicker a state-in-effect version has, because the store is read
 * during render rather than corrected after mount.
 *
 * Rendered as role="switch" so assistive tech announces the on/off state; the
 * label says what the control WILL DO, which is what a screen-reader user
 * needs at the moment they reach it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLight = theme === "light";

  const toggle = () => {
    const next: Theme = isLight ? "dark" : "light";
    /*
      THE CROSSFADE, ARMED FOR EXACTLY ONE TRANSITION.

      Genesis asked for the two themes to feel like one site being re-lit
      rather than two sites being swapped, and named the timing: 300-500ms, no
      instant flash. `data-theme-transition` turns on a 400ms colour
      transition across the whole document (see globals.css) and is taken off
      the moment it has served — a permanent one would slow every hover and
      every reveal on the page by the same amount.

      420ms, not 400: the attribute has to outlive the transition it starts,
      or removing it mid-fade snaps the remaining distance, which is the flash
      this exists to remove.
    */
    const root = document.documentElement;
    root.setAttribute("data-theme-transition", "");
    window.setTimeout(() => root.removeAttribute("data-theme-transition"), 420);
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse storage. The choice still applies to this
      // page and simply will not survive a reload — the right degradation.
    }
    document.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      onClick={toggle}
      className={cn(
        "group relative inline-flex h-9 w-16 shrink-0 items-center rounded-full",
        /*
          THE TRACK HAS TO BE A TRACK. It was --hover-wash over
          --glass-border, and on paper that resolves to 7% black on a pill
          that is 72% white — measured, a 1.06:1 track. The knob was solid
          and perfectly visible, so what a light-theme visitor saw was a dark
          dot floating in the nav with nothing around it: not a switch, and
          not obviously anything. Genesis could not find it, which is the
          whole report.

          Own values rather than tokens here, and deliberately. Every token
          that could carry this is tuned for a surface sitting ON the page,
          and this one sits on the glass pill, which is already a lightened
          plate over whatever is behind it — so the same 7% that reads as a
          panel edge elsewhere disappears here. 14% ink with a 34% rim is the
          faintest that still reads as a groove on both grounds — 50% on the
          rim is what takes the control's boundary past 3:1 against the pill,
          which is the threshold a UI component's edge is meant to clear.
        */
        "border transition-colors duration-300",
        "border-[color-mix(in_srgb,var(--ink-strong)_50%,transparent)]",
        "bg-[color-mix(in_srgb,var(--ink-strong)_14%,transparent)]",
        "hover:border-[color-mix(in_srgb,var(--ink-strong)_72%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute grid size-7 place-items-center rounded-full",
          // The knob is the page's own ink over the page's own ground, so it
          // stays a solid, high-contrast puck in both themes rather than
          // being white-on-white on paper.
          "bg-[var(--ink-strong)] text-[var(--surface-base)] shadow-raised",
          "transition-transform duration-300 ease-out",
          isLight ? "translate-x-8" : "translate-x-1",
        )}
      >
        {isLight ? (
          <Sun className="size-4" strokeWidth={2.2} />
        ) : (
          <Moon className="size-4" strokeWidth={2.2} />
        )}
      </span>
    </button>
  );
}
