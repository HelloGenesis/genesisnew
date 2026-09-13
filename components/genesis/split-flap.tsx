"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A word on a departures board — each letter its own flap, falling into
 * place one after another when the word changes.
 *
 * The word is padded to the longest in the list so the tiles never reflow as
 * it cycles; a board that changes width every few seconds reads as a layout
 * bug rather than as a mechanism. Screen readers get the current word once,
 * as plain text, instead of a tile per letter.
 */
export function SplitFlap({
  words,
  interval = 2600,
  className,
  tileClassName,
}: {
  words: string[];
  interval?: number;
  className?: string;
  tileClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const width = Math.max(...words.map((w) => w.length));

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      interval,
    );
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  const word = words[index].toUpperCase().padEnd(width, " ");

  return (
    <span className={cn("inline-flex gap-[3px] [perspective:400px]", className)}>
      <span className="sr-only">{words[index]}</span>
      {word.split("").map((char, i) => (
        <span
          key={`${index}-${i}`}
          aria-hidden
          className={cn(
            "gm-flap-in relative grid h-[1.9em] w-[1.35em] place-items-center overflow-hidden rounded-[4px] bg-[linear-gradient(180deg,#221a1e_0%,#221a1e_49%,#120d10_51%,#1a1418_100%)] font-mono text-[0.95em] font-semibold leading-none text-[#fff3dc] shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_0_0_1px_rgb(255_197_22/0.18)]",
            tileClassName,
          )}
          style={{ animationDelay: `${i * 45}ms` }}
        >
          {char === " " ? " " : char}
          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/60" />
        </span>
      ))}
    </span>
  );
}

/** The board's clock, local time, filled in after mount so it cannot mismatch. */
export function BoardClock({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        }),
      );
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {now ?? "--:--"} IST
    </span>
  );
}
