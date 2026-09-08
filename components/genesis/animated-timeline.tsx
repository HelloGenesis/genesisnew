"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import { isPending } from "@/lib/home-content";
import { cn } from "@/lib/utils";

/**
 * Animated vertical timeline — the "Our Journey" spine (img-004).
 *
 * A dim rail runs the full height; a lit rail scales up through it as the
 * section scrolls, and each milestone's date pill and marker fade in as they
 * arrive. Scroll progress is spring-smoothed so the fill glides rather than
 * tracking the wheel one-to-one.
 */

export type Milestone = {
  /** e.g. "Mar 2024". Absent while the date is still unwritten. */
  date?: string;
  title: string;
  description?: string;
};

export function AnimatedTimeline({
  milestones,
  tone = "brand",
  surface = "dark",
  className,
}: {
  milestones: Milestone[];
  tone?: "brand";
  /**
   * "light" sets the timeline in dark ink for a pale ground. Journey prints
   * its history on a lit broadsheet: sampled from p15_0 the paper runs lum
   * 201 at the top to 147 at the foot and the ink sits at lum 46-68, so white
   * type on it would land at 3.6:1 — under the 4.5:1 body-text floor — while
   * dark ink lands well clear.
   */
  surface?: "dark" | "light";
  className?: string;
}) {
  const light = surface === "light";
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Start filling when the section's top reaches 80% down the viewport;
    // finish when its bottom passes the 40% line.
    offset: ["start 0.8", "end 0.4"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const scaleY = useTransform(progress, [0, 1], [0, 1]);

  // NOT `to-transparent`. The lit rail is already revealed by scaleY, so a
  // transparent end stop meant that even at scroll progress 1 the bottom third
  // of the rail was invisible by construction — the fade was being applied
  // twice, once by the mask and once by the gradient.
  const railColor =
    tone === "brand"
      ? "from-brand via-brand-soft to-brand"
      : tone === "brand"
        ? "from-brand via-brand/70 to-brand/80"
        : "from-brand via-brand-soft to-brand";

  const glowColor =
    tone === "brand"
      ? "rgb(255 197 22 / 0.5)"
      : tone === "brand"
        ? "rgb(45 212 191 / 0.45)"
        : "rgb(255 197 22 / 0.5)";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/*
        img-004 is a THICK glowing spline with light bleeding several pixels
        off it. This was `w-px bg-white/10` — a 1px hairline, the faintest
        thing on the page, where the reference makes it the hero of the
        section. Widened, and given a separate wider glow plate so light
        actually bleeds rather than sitting inside a 1px box-shadow.
      */}

      {/* Unlit rail */}
      <div
        aria-hidden
        className={cn(
          "absolute left-[7.5rem] top-0 h-full w-[3px] -translate-x-1/2 rounded-full sm:left-[9.5rem]",
          light ? "bg-[#16232e]/20" : "bg-white/12",
        )}
      />

      {/* Bleed plate — wider and softer than the rail it sits under. */}
      <motion.div
        aria-hidden
        style={{ scaleY, background: glowColor, filter: "blur(7px)" }}
        className="absolute left-[7.5rem] top-0 h-full w-[11px] -translate-x-1/2 origin-top rounded-full opacity-70 sm:left-[9.5rem]"
      />

      {/* Lit rail, driven by scroll progress */}
      <motion.div
        aria-hidden
        style={{ scaleY, boxShadow: `0 0 14px 1px ${glowColor}` }}
        className={cn(
          "absolute left-[7.5rem] top-0 h-full w-[3px] -translate-x-1/2 origin-top rounded-full bg-gradient-to-b sm:left-[9.5rem]",
          railColor,
        )}
      />

      <ol className="relative flex flex-col gap-16">
        {milestones.map((milestone, index) => (
          <motion.li
            key={milestone.title}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
            className="relative grid grid-cols-[7.5rem_1fr] items-start gap-x-8 sm:grid-cols-[9.5rem_1fr]"
          >
            {/*
              Date pill, right-aligned against the rail. Omitted entirely when
              the date is unwritten: the column keeps its width so the rail
              stays straight, but nothing is printed in it. An unwritten date
              must never surface as a placeholder next to real history.
            */}
            <div className="flex justify-end pr-0">
              {!isPending(milestone.date) && (
                <span
                  className={cn(
                    "rounded-full px-3 py-2 text-micro font-medium tracking-wide",
                    light
                      ? "border border-[#1c2b38]/20 bg-[#1c2b38]/8 text-[#1c2b38]"
                      : "glass text-bone",
                  )}
                >
                  {milestone.date}
                </span>
              )}
            </div>

            {/* Node sitting on the rail */}
            <span
              aria-hidden
              className={cn(
                "absolute left-[7.5rem] top-1 size-5 -translate-x-1/2 rounded-full sm:left-[9.5rem]",
                light ? "border border-[#16232e]/30 bg-[#e6eef5]" : "glass border border-white/30",
              )}
              style={{ boxShadow: `0 0 16px 3px ${glowColor}` }}
            />

            <div className="pl-4">
              <h3
                className={cn(
                  "text-h3 font-normal tracking-tight",
                  light ? "text-[#16232e]" : "text-bone",
                )}
              >
                {milestone.title}
              </h3>
              {!isPending(milestone.description) && (
                <p
                  className={cn(
                    "mt-2 max-w-prose text-small leading-relaxed",
                    light ? "text-[#20303e]" : "text-ash",
                  )}
                >
                  {milestone.description}
                </p>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
