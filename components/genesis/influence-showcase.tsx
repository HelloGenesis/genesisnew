"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * GENESIS'S TWO INFLUENCE POSTERS, IN PLACE OF THE REEL GALLERY on the
 * homepage's Influence panel (Genesis, 4 Oct 2026: "add this in that bento,
 * replacing the gallery … make it creative … fit it properly on the right";
 * then "make both the cards visible at once").
 *
 * Both up together, fanned like two cards held in a hand: each turned a few
 * degrees outward and overlapping a little at the middle, on the site's
 * gradient glow. Pointing at, focusing or tapping one brings it forward,
 * straightens it and lifts it; the other steps back. The services are
 * lettered on the artwork, so nothing is printed over it.
 */
const POSTERS = [
  {
    src: "/influence/creators-face.jpg",
    alt: "Genesis Influence: influencer marketing, bulk activations, UGC campaigns and celebrity collaborations.",
    rest: "-rotate-[5deg] translate-x-[6%]",
  },
  {
    src: "/influence/creators-group.jpg",
    alt: "Genesis Influence: event amplification, BFSI creator campaigns, regional influencers and creator content production. Have a campaign in mind?",
    rest: "rotate-[5deg] -translate-x-[6%] translate-y-[4%]",
  },
];

export function InfluenceShowcase({ className }: { className?: string }) {
  const [lit, setLit] = useState<number | null>(null);

  return (
    <div className={cn("relative mx-auto w-full max-w-[36rem] select-none", className)}>
      {/* The glow the cards stand in: the site's amber → coral → violet. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[3rem] opacity-60 blur-3xl"
        style={{ background: "radial-gradient(60% 55% at 50% 50%, rgb(245 146 62 / 0.45), rgb(180 92 224 / 0.25) 60%, transparent 75%)" }}
      />
      <ul className="relative grid grid-cols-2 items-center py-4">
        {POSTERS.map((poster, index) => {
          const isLit = lit === index;
          const dimmed = lit !== null && !isLit;
          return (
            <li key={poster.src} className={cn("relative", isLit ? "z-[3]" : index === 1 ? "z-[2]" : "z-[1]")}>
              <button
                type="button"
                aria-label={poster.alt}
                /*
                  A MOUSE OR A KEYBOARD ONLY (Genesis, 6 Oct 2026: "remove the
                  hover effect on phone"): a tap no longer lifts a poster.
                */
                onPointerEnter={(event) => event.pointerType === "mouse" && setLit(index)}
                onPointerLeave={(event) => event.pointerType === "mouse" && setLit(null)}
                onFocus={(event) => event.currentTarget.matches(":focus-visible") && setLit(index)}
                onBlur={() => setLit(null)}
                className={cn(
                  "relative block aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border outline-none transition-[transform,opacity,box-shadow,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-brand",
                  isLit
                    ? "-translate-y-2 rotate-0 scale-[1.06] border-white/30 shadow-[0_34px_70px_-28px_rgb(0_0_0/0.9),0_0_40px_-10px_rgb(245_146_62/0.55)]"
                    : cn(poster.rest, "border-white/15 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.85)]"),
                  dimmed && "opacity-70 saturate-[0.8]",
                )}
              >
                <Image
                  src={poster.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 18rem, 45vw"
                  className={cn("object-cover transition-transform duration-700 ease-out", isLit && "scale-[1.04]")}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
