"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A DRAWING LAID OUT AT ONE WIDTH AND SCALED TO FIT ITS BOX.
 *
 * For a composition whose parts are placed against each other at a fixed
 * size — the AI Lab diagram with its pieces round the pill — so a phone gets
 * the desktop design whole, just smaller, instead of a different layout
 * (Genesis, 6 Oct 2026: "I also want the desktop version design here").
 * Never scales up past 1.
 */
export function FitScale({ width, className, children }: { width: number; className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const outer = box.current;
    const content = inner.current;
    if (!outer || !content) return;
    const measure = () => {
      const next = Math.min(1, outer.clientWidth / width);
      setScale(next);
      setHeight(content.offsetHeight * next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(content);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={box} className={cn("relative w-full", className)} style={{ height }}>
      <div
        ref={inner}
        className="absolute left-1/2 top-0 origin-top"
        style={{ width, transform: `translateX(-50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
