"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Play } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * WHAT COMES OUT OF THE LAB (Genesis, 4 Oct 2026: "something popping out of
 * the AI Lab element, like the Brand & Design one — all the things coming out
 * of it, cool techy content"). Over the homepage diagram, the Lab's outputs
 * burst from its pill when the panel comes into view and settle round it:
 * an avatar, a 9:16 reel, a voice clone, a script, a render bar and a
 * "ready to post" ping. They drift while they sit, and spread a little
 * further while the pointer is over the diagram. Decoration: aria-hidden.
 */
type Spot = { x: string; y: string; delay: number; className?: string };

/*
  Where each piece settles, as a share of the diagram's box. Only in the two
  clear bands above and below the Lab's pill, between the strands (which run
  from 18% to 31% and 69% to 82% of the width), so nothing covers a tool, a
  line or the pill (Genesis, 4 Oct 2026: "don't overlap items").
*/
const SPOTS: Spot[] = [
  { x: "38%", y: "19%", delay: 0.05 }, // avatar
  { x: "62%", y: "19%", delay: 0.15 }, // reel
  { x: "50%", y: "7%", delay: 0.25 }, //  script
  { x: "39%", y: "80%", delay: 0.35 }, // voice
  { x: "61%", y: "80%", delay: 0.45 }, // render
  { x: "50%", y: "95%", delay: 0.55 }, // ready
];

/**
 * `row`: the same pieces set out in a tidy group rather than round the pill,
 * at full size — for a phone, where round the scaled-down diagram they were
 * too small to read (Genesis, 6 Oct 2026).
 */
export function AiLabBurst({ className, row = false }: { className?: string; row?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [spread, setSpread] = useState(false);
  const shown = Boolean(seen || reduce);

  const pieces = [
    <AvatarCard key="avatar" />,
    <ReelCard key="reel" />,
    <Chip key="script">
      <span className="grid size-5 place-items-center rounded-md bg-[#ff8fb8]/20 text-[0.625rem] text-[#ffb3cd]">✎</span>
      Script <Check className="size-3 text-emerald-300" aria-hidden />
    </Chip>,
    <VoiceChip key="voice" />,
    <RenderChip key="render" animate={shown && !reduce} />,
    <Chip key="ready">
      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]" />
      Ready to post
    </Chip>,
  ];

  if (row) {
    return (
      <div ref={box} aria-hidden className={cn("flex flex-col items-center gap-3", className)}>
        <div className="flex items-center justify-center gap-3">
          {[pieces[0], pieces[2], pieces[1]].map((piece, index) => (
            <motion.div
              key={index}
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.85 }}
              animate={shown ? { opacity: 1, y: 0, scale: 1 } : undefined}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.08 * index }}
            >
              {piece}
            </motion.div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[pieces[3], pieces[4], pieces[5]].map((piece, index) => (
            <motion.div
              key={index}
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.85 }}
              animate={shown ? { opacity: 1, y: 0, scale: 1 } : undefined}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.25 + 0.08 * index }}
            >
              {piece}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={box}
      aria-hidden
      onPointerEnter={() => setSpread(true)}
      onPointerLeave={() => setSpread(false)}
      className={cn("pointer-events-auto absolute inset-0 hidden lg:block", className)}
    >
      {pieces.map((piece, index) => {
        const spot = SPOTS[index];
        /* Out from the pill (the diagram's centre), and a touch further on hover. */
        const dx = `calc(50% - ${spot.x})`;
        const dy = `calc(50% - ${spot.y})`;
        const away = spread ? 1.08 : 1;
        return (
          <motion.div
            key={index}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: spot.x, top: spot.y }}
            initial={reduce ? false : { opacity: 0, scale: 0.3, x: dx, y: dy }}
            animate={
              shown
                ? { opacity: 1, scale: away, x: 0, y: 0 }
                : { opacity: 0, scale: 0.3, x: dx, y: dy }
            }
            transition={{ type: "spring", stiffness: 140, damping: 16, delay: spot.delay }}
          >
            <motion.div
              animate={reduce || !shown ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 3.4 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
            >
              {piece}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

const GLASS =
  "border border-white/15 bg-[rgb(20_18_22/0.72)] shadow-[0_14px_34px_-14px_rgb(0_0_0/0.9),0_0_22px_-10px_rgb(255_143_184/0.55)] backdrop-blur-md";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[0.75rem] font-medium text-bone", GLASS)}>
      {children}
    </span>
  );
}

function AvatarCard() {
  return (
    <span className={cn("block w-[5.75rem] overflow-hidden rounded-2xl p-1 -rotate-[6deg]", GLASS)}>
      <span className="relative block aspect-[4/5] overflow-hidden rounded-lg">
        <Image src="/avatars/diya.jpg" alt="" fill sizes="104px" className="object-cover" />
      </span>
      <span className="block px-0.5 pb-0.5 pt-1 text-center text-[0.625rem] uppercase tracking-[0.1em] text-[#ffb3cd]">AI avatar</span>
    </span>
  );
}

function ReelCard() {
  return (
    <span className={cn("block w-[4.5rem] overflow-hidden rounded-2xl p-1 rotate-[5deg]", GLASS)}>
      <span className="relative block aspect-[9/16] overflow-hidden rounded-lg">
        <Image src="/work/posters/ai-lab-2-1-9x16-health-returns-activ-yuva.jpg" alt="" fill sizes="72px" className="object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/25">
          <span className="grid size-6 place-items-center rounded-full bg-white/85 text-[#141216]">
            <Play className="ml-0.5 size-3" aria-hidden />
          </span>
        </span>
      </span>
      <span className="block pt-1 text-center text-[0.625rem] uppercase tracking-[0.1em] text-[#ffc28f]">Reel · 9:16</span>
    </span>
  );
}

function VoiceChip() {
  const bars = [6, 12, 8, 16, 10, 14, 7, 11];
  return (
    <Chip>
      <span className="flex h-4 items-center gap-[2px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-[2px] rounded-full bg-gradient-to-t from-[#ff8fb8] to-[#ffa25c] motion-safe:animate-[ai-wave_1.1s_ease-in-out_infinite]"
            style={{ height: h, animationDelay: `${i * 0.09}s` }}
          />
        ))}
      </span>
      Voice clone
    </Chip>
  );
}

function RenderChip({ animate }: { animate: boolean }) {
  return (
    <span className={cn("block w-[8.5rem] rounded-xl px-3 py-2", GLASS)}>
      <span className="flex items-center justify-between text-[0.625rem] text-ash">
        <span>Rendering</span>
        <span className="tabular-nums text-bone">1080p</span>
      </span>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
        <span
          className={cn("block h-full rounded-full bg-gradient-to-r from-[#ff8fb8] to-[#ffa25c]", animate ? "animate-[ai-render_3.2s_ease-in-out_infinite]" : "w-3/4")}
        />
      </span>
    </span>
  );
}
