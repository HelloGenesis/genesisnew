"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A prompt that types itself, holds, clears, and types the next one.
 *
 * The full text is in the DOM for screen readers and search from the first
 * render; only the visible half is animated. With reduced motion the first
 * prompt is simply shown whole.
 */
export function TypingPrompt({
  prompts,
  className,
}: {
  prompts: string[];
  className?: string;
}) {
  const [which, setWhich] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const text = prompts[which];
    const done = shown >= text.length;
    // Reduced motion: show the first prompt whole, once, and stop there.
    if (reduced && done) return;
    const id = window.setTimeout(
      () => {
        if (reduced) setShown(text.length);
        else if (!done) setShown((n) => n + 1);
        else {
          setShown(0);
          setWhich((w) => (w + 1) % prompts.length);
        }
      },
      reduced ? 0 : done ? 2400 : 34,
    );
    return () => window.clearTimeout(id);
  }, [which, shown, prompts]);

  return (
    <span className={cn("min-w-0", className)}>
      <span className="sr-only">{prompts[0]}</span>
      <span aria-hidden>
        {prompts[which].slice(0, shown)}
        <span className="gm-caret ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] bg-brand" />
      </span>
    </span>
  );
}
