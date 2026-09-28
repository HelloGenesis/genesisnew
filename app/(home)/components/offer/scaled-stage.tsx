"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A composition laid out once at a fixed size and scaled to its container, so
 * a design drawn for one width reads as the same picture at every width. The
 * outer box takes the scaled height, so the page flows around it normally.
 *
 * Until the first measurement (and without script) it renders at the scale
 * that fits a 540px column — the hero's width on a laptop — rather than at
 * full size, so nothing jumps a long way on load.
 */
export function ScaledStage({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(540 / width);

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () => setScale(Math.min(1, node.clientWidth / width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={box} className="relative w-full" style={{ height: height * scale }}>
      {/*
        DISPLAY ONLY WHEN IT IS SHRUNK HARD. On a phone the stage draws at
        about 0.35×, which turns its small round links into 15px targets no
        finger can hit. Past that point it is a picture of the board, and the
        same actions sit in the buttons under the section — so it is made
        inert (not focusable, not clickable) rather than left as a trap.
      */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width, height, transform: `scale(${scale})` }}
        inert={scale < 0.6}
      >
        {children}
      </div>
    </div>
  );
}
