"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect } from "react";

import { avatars } from "@/lib/avatars";

/**
 * Step between avatars without leaving the window.
 *
 * Genesis asked for the avatar pop-up to carry "slider arrow buttons along
 * with left- and right-click functionality" — so both: controls you can click
 * and the arrow keys, which is what anyone who has used a lightbox reaches
 * for first.
 *
 * `router.replace`, NOT `push`, AND THAT IS THE WHOLE DESIGN. The window is a
 * history entry — it exists because something navigated to /avatars/<slug>,
 * and RouteModal closes it with router.back(). Pushing on every step would
 * bury the roster under one entry per avatar, so a reader who flicked through
 * five of them and hit Escape would land on the fourth, then the third, then
 * the second. Replacing keeps exactly one entry for "an avatar is open", so
 * back and Escape both return to where the roster was, whichever avatar is
 * showing when they do.
 *
 * IT WRAPS. Seven is a small roster and a slider that dead-ends on the last
 * card invites the reader to conclude they have seen everything when they
 * started at number five. Both buttons are therefore always live, and neither
 * is ever disabled — a disabled arrow on a list this short is a control that
 * spends most of its life doing nothing.
 *
 * WORKS ON THE PAGE TOO, not only in the dialog. AvatarDetail renders in both
 * places; navigating from /avatars/adi to /avatars/diya inside the app is
 * still an in-app navigation, so the interception applies in the dialog and
 * does not on a cold-loaded page. Same component, right behaviour in both.
 */
export function AvatarPager({
  currentId,
  onNavigate,
}: {
  currentId: string;
  onNavigate: (id: string) => void;
}) {
  const index = Math.max(0, avatars.findIndex((a) => a.id === currentId));

  const step = useCallback(
    (delta: -1 | 1) => {
      const next = avatars[(index + delta + avatars.length) % avatars.length];
      onNavigate(next.id);
    },
    [index, onNavigate],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      /*
        Not while the reader is typing or scrubbing. A <video> with controls
        uses the arrow keys to seek, and an input uses them to move the
        caret; stealing them there would break the control the reader is
        actually holding. The samples list in this very dialog has videos in
        it, so this is a real case rather than a defensive one.
      */
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLVideoElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      step(event.key === "ArrowLeft" ? -1 : 1);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step]);

  const previous = avatars[(index - 1 + avatars.length) % avatars.length];
  const next = avatars[(index + 1) % avatars.length];

  return (
    <>
      {/*
        OVER THE PORTRAIT, at its vertical middle — the position a slider
        control is looked for. They sit inside the picture rather than outside
        it because the dialog has no margin to put them in at narrow widths,
        and a control that only appears above 1024px is not a control.

        Each carries the name of the avatar it goes to rather than "previous"
        and "next", so a screen reader announces a destination instead of a
        direction.
      */}
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label={`Previous avatar: ${previous.name}`}
        className="absolute left-2 top-1/2 z-[2] grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => step(1)}
        aria-label={`Next avatar: ${next.name}`}
        className="absolute right-2 top-1/2 z-[2] grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>

      {/*
        Where you are in the roster. Without it the arrows are a loop with no
        edges — you can go round forever and never know you have.
      */}
      <span className="absolute bottom-3 left-1/2 z-[2] -translate-x-1/2 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-micro tabular-nums text-white/90 backdrop-blur-md">
        {index + 1} / {avatars.length}
      </span>
    </>
  );
}
