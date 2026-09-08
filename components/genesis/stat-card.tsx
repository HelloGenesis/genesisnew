"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { isPending } from "@/lib/home-content";
import { cn } from "@/lib/utils";

/**
 * Statistics display.
 *
 * `StatCard` is the bordered tile with an icon well (img-012 "1,00,000+
 * INFLUENCER DATABASE"); `StatRow` is the glass bar of four figures beneath it.
 * Both share `CountUp`, which animates the number once on first view.
 */

/** Splits "1,00,000+" into the numeric part and any prefix/suffix. */
function parseValue(value: string) {
  const match = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!match) return { prefix: "", digits: null, suffix: value };
  return { prefix: match[1], digits: match[2], suffix: match[3] };
}

function CountUp({ value, durationMs = 1400 }: { value: string; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const prefersReducedMotion = useReducedMotion();
  const { prefix, digits, suffix } = parseValue(value);

  // Seeded with the FINAL figure, not zero. That keeps the markup correct
  // without JavaScript, under `prefers-reduced-motion`, and for assistive
  // tech — the count-up simply overwrites it on the first animation frame
  // after the element scrolls into view.
  const [display, setDisplay] = useState(digits ?? "");

  useEffect(() => {
    if (!inView || digits === null || prefersReducedMotion) return;

    const target = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(target)) return;

    // Preserve the source formatting (Indian grouping in "1,00,000" included)
    // by re-applying the original separators positionally.
    const format = (n: number) => {
      const raw = Math.round(n).toString();
      if (!digits.includes(",")) return raw;
      const groups = digits.split(",");
      const sizes = groups.slice(1).map((g) => g.length);
      let out = "";
      let rest = raw;
      for (const size of sizes.reverse()) {
        if (rest.length <= size) break;
        out = `,${rest.slice(-size)}${out}`;
        rest = rest.slice(0, -size);
      }
      return rest + out;
    };

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // Clamped at BOTH ends. The first rAF callback can carry a timestamp
      // from the frame already in flight when the effect ran, so `now` may be
      // earlier than `start`; an unclamped negative progress drives the
      // ease-out cubic below zero, and the formatter then groups the minus
      // sign as if it were a digit — which is how a live page came to render
      // "-,11,839+".
      const progress = Math.min(1, Math.max(0, (now - start) / durationMs));
      // Ease-out cubic: fast start, settled landing.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(format(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, digits, durationMs, prefersReducedMotion]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function StatCard({
  value,
  label,
  description,
  icon,
  action,
  className,
}: {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass glass-lit group relative flex items-start gap-6 rounded-panel p-6 sm:p-8",
        "bg-[linear-gradient(135deg,rgb(255_197_22/0.10)_0%,transparent_55%)]",
        className,
      )}
    >
      {icon && (
        <div className="grid size-14 shrink-0 place-items-center rounded-card border border-brand/25 bg-brand/10 text-brand-ink">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-h2 font-semibold tracking-tight text-bone sm:text-h2">
          <CountUp value={value} />
        </p>
        <p className="micro-label mt-2">{label}</p>
        {description && (
          <p className="mt-3 text-small leading-relaxed text-ash">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** The horizontal glass bar of figures from img-012. */
export function StatRow({
  stats,
  surface = "dark",
  className,
}: {
  stats: { value: string; label: string; icon?: ReactNode }[];
  /**
   * "light" sets the figure in dark ink for a pale ground — Journey prints its
   * headline figure on the broadsheet, where bone-on-paper would be unreadable
   * for the same reason the timeline needed it.
   */
  surface?: "dark" | "light";
  className?: string;
}) {
  // The single choke point for figures across the site, so the guarantee that
  // no placeholder ever reaches a page is enforced HERE rather than at each of
  // the several call sites. A figure with no confirmed value is omitted; an
  // invented one would be a claim we cannot support.
  const shown = stats.filter((stat) => !isPending(stat.value));
  if (shown.length === 0) return null;

  /**
   * A LONE figure gets its own treatment rather than one cell of a bar.
   *
   * Adapting the column count was not enough: at `grid-cols-1` the single
   * figure still sat at text-h3 against the left edge of a full-width glass
   * bar with about 85% of it empty, which reads as three figures that failed
   * to load. Spec page 16 asks for "//numbers increasing animation" and the
   * image on that page sets the numeral at display scale — roughly a sixth of
   * the frame height. So one figure becomes a statement, and the chassis goes.
   */
  if (shown.length === 1) {
    const [only] = shown;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn("flex flex-col items-start gap-3", className)}
      >
        <p
          className={cn(
            "text-h1 font-semibold leading-none tracking-tight [font-variant-numeric:tabular-nums] sm:text-display",
            surface === "light" ? "text-[#16232e]" : "text-bone",
          )}
        >
          <CountUp value={only.value} />
        </p>
        <p className={cn("micro-label", surface === "light" && "!text-[#20303e]")}>
          {only.label}
        </p>
      </motion.div>
    );
  }

  /*
    Columns follow the number of figures that survived the filter.

    FOUR FIGURES START AT ONE COLUMN, not two. At 390px a two-column grid
    gives each figure about 150px, and "1,00,000+" set at text-h3 is wider
    than that — it overflowed its cell and collided with the figure beside it,
    labels and all. Measured on /influencer-campaigns at 390.
  */
  const columns =
    shown.length >= 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : shown.length === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : shown.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1";

  return (
    <div
      className={cn(
        // gap-x as well as gap-y: the columns had no horizontal gutter at
        // all, so anything that did fit still sat flush against its neighbour.
        "glass glass-lit grid gap-x-6 gap-y-8 rounded-panel px-6 py-8 sm:px-8",
        columns,
        className,
      )}
    >
      {shown.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
          className={cn(
            "flex items-center gap-4 px-2",
            // Hairline dividers between figures, never before the first in a row.
            index > 0 && "lg:border-l lg:border-white/10 lg:pl-6",
          )}
        >
          {stat.icon && (
            <div className="grid size-11 shrink-0 place-items-center rounded-card border border-white/10 bg-white/5 text-bone">
              {stat.icon}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-h3 font-semibold tracking-tight text-bone">
              <CountUp value={stat.value} />
            </p>
            <p className="mt-1 text-small leading-tight text-ash">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
