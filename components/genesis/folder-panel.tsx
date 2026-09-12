"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A glass panel cut in the shape of a file folder: a tab on the top left,
 * sloping down into the body. The Brand & Design reference is built from
 * three of these.
 *
 * DRAWN AS A MEASURED PATH, not assembled from boxes. A tab made of a second
 * rounded div gives two borders that meet in a seam, and a gradient border
 * cannot be continued across that seam. So the outline is one SVG path
 * computed from the panel's real size, which gives one continuous stroke,
 * and the same path clips the backdrop blur so the glass follows the tab
 * too. A ResizeObserver keeps it exact at every width.
 *
 * THE REFERENCE'S GRADIENTS ("the box also had gradients"): a rim that runs
 * orange at the top left through pink to violet at the bottom right, a soft
 * glow of that rim bleeding inward, and a body tinted warm in one corner and
 * violet in the other rather than a flat black.
 *
 * ALWAYS DARK, in both themes. It is an object on the page rather than the
 * page itself, the way a device mockup is, and the orange-to-violet headline
 * inside only reads on a dark ground. Copy inside uses the `scene`
 * inks, which do not flip.
 */
export function FolderPanel({
  children,
  tab = 0.4,
  tabHeight = 26,
  radius = 22,
  dots = false,
  className,
  contentClassName,
}: {
  children: ReactNode;
  /** Tab width as a share of the panel. 0 for a plain rounded panel. */
  tab?: number;
  tabHeight?: number;
  radius?: number;
  /** The three accent dots in the top-right corner. */
  dots?: boolean;
  className?: string;
  contentClassName?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lip = tab > 0 ? tabHeight : 0;
  const d = size ? folderPath(size.w, size.h, tab * size.w, lip, radius) : null;

  return (
    <div ref={box} className={cn("relative isolate", className)}>
      {/* Depth. A sibling rather than a filter on this box: a filter would
          make the box a backdrop root and the glass would blur nothing. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 bottom-0 -z-10 rounded-[22px] shadow-[0_30px_70px_-24px_rgb(0_0_0/0.75)]"
        style={{ top: lip }}
      />

      {d && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 backdrop-blur-xl"
            style={{
              clipPath: `path("${d}")`,
              background:
                "linear-gradient(150deg, rgb(46 30 24 / 0.9) 0%, rgb(22 18 22 / 0.92) 42%, rgb(20 16 28 / 0.92) 64%, rgb(40 24 62 / 0.92) 100%)",
            }}
          />
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-visible"
            width={size!.w}
            height={size!.h}
          >
            <defs>
              <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff9a3c" />
                <stop offset="35%" stopColor="#ff8a5c" stopOpacity="0.7" />
                <stop offset="65%" stopColor="#e070c0" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a45cff" />
              </linearGradient>
              <radialGradient id={`${id}-warm`} cx="0" cy="0" r="0.85">
                <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`${id}-cool`} cx="1" cy="1" r="0.85">
                <stop offset="0%" stopColor="#9b5cff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#9b5cff" stopOpacity="0" />
              </radialGradient>
              <clipPath id={`${id}-inside`}>
                <path d={d} />
              </clipPath>
              <filter id={`${id}-soften`} x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            <path d={d} fill={`url(#${id}-warm)`} />
            <path d={d} fill={`url(#${id}-cool)`} />
            {/* The rim's glow, blurred and kept inside the shape, so the edge
                reads as lit glass rather than a drawn line. */}
            <g clipPath={`url(#${id}-inside)`}>
              <path
                d={d}
                fill="none"
                stroke={`url(#${id}-edge)`}
                strokeWidth="14"
                strokeOpacity="0.55"
                filter={`url(#${id}-soften)`}
              />
            </g>
            <path d={d} fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />
          </svg>
        </>
      )}

      {dots && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 flex gap-1"
          style={{ top: lip + 16 }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[5px] rounded-full bg-[#b56cff]" />
          ))}
        </span>
      )}

      {/* The tab's height on its own box, so a caller's `pt-*` adds to it
          rather than being overridden by an inline style. */}
      <div className="relative" style={{ paddingTop: lip }}>
        <div className={cn("relative", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}

/**
 * The outline: tab across the top left, a 45° slope down to the body, then
 * the body's rounded rectangle. With no tab it is a plain rounded rectangle.
 */
function folderPath(w: number, h: number, tw: number, th: number, r: number) {
  if (th === 0) {
    return `M0 ${r} A${r} ${r} 0 0 1 ${r} 0 H${w - r} A${r} ${r} 0 0 1 ${w} ${r} V${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} H${r} A${r} ${r} 0 0 1 0 ${h - r} Z`;
  }
  const s = th; // the slope runs as far across as it drops
  const k = 5; // softening on the two slope corners
  const q = k * 0.7;
  return [
    `M0 ${r}`,
    `A${r} ${r} 0 0 1 ${r} 0`,
    `H${tw - s - k}`,
    `Q${tw - s} 0 ${tw - s + q} ${q}`,
    `L${tw - q} ${th - q}`,
    `Q${tw} ${th} ${tw + k} ${th}`,
    `H${w - r}`,
    `A${r} ${r} 0 0 1 ${w} ${th + r}`,
    `V${h - r}`,
    `A${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H${r}`,
    `A${r} ${r} 0 0 1 0 ${h - r}`,
    "Z",
  ].join(" ");
}
