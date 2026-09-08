"use client";

import Image from "next/image";

import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

/**
 * The creator network — built to the Genesis mockup on page 7.
 *
 * A wireframe globe with orbital rings, creator cards suspended in front of
 * it, and small portrait badges riding the same orbits carrying platform
 * chips. Red nodes pulse along the network to suggest activity without
 * animating the whole scene.
 *
 * THE MOCKUP IS NOT A RING OF EQUAL CARDS. One card — the lifestyle creator —
 * is roughly twice the size of the others and sits near the centre, and the
 * rest are scattered around it at two different depths. A single ring of
 * identical cards reads as a carousel widget; this reads as a network. So the
 * featured card orbits at a small radius and a large scale, and the others
 * alternate between two radii for parallax.
 *
 * Everything is driven by MotionValues off the render loop, so nothing here
 * re-renders per frame.
 */

export type Creator = {
  id: string;
  /** The niche. Stays as the accessible description of the card. */
  label: string;
  /** The creator's own name, once Genesis supplies it. Empty until then. */
  name?: string;
  followers: string;
  /** Portrait cropped from the mockup; a warm gradient stands in without one. */
  image?: string;
  /** The one large, near-centre card. */
  feature?: boolean;
};

/** Deterministic pseudo-random, so SSR and the client agree. */
function seeded(index: number, salt: number) {
  const v = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function portrait(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 360;
  return `radial-gradient(120% 90% at 30% 15%, hsl(${hash} 34% 46% / 0.95) 0%, transparent 62%),
          linear-gradient(165deg, #2a2530 0%, #14121a 100%)`;
}

/**
 * The outer badges: a real portrait with a platform chip clipped to its
 * corner. lucide-react v1 dropped brand icons, so the glyphs are drawn inline.
 */
const PLATFORMS = [
  { key: "instagram", fill: "linear-gradient(135deg,#ffc516,#ee2a7b 48%,#6228d7)" },
  { key: "youtube", fill: "#ff0000" },
  { key: "linkedin", fill: "#0a66c2" },
  { key: "instagram", fill: "linear-gradient(135deg,#ffc516,#ee2a7b 48%,#6228d7)" },
  { key: "threads", fill: "#ffffff" },
  { key: "youtube", fill: "#ff0000" },
  { key: "instagram", fill: "linear-gradient(135deg,#ffc516,#ee2a7b 48%,#6228d7)" },
] as const;

function PlatformGlyph({ platform }: { platform: string }) {
  const common = { viewBox: "0 0 24 24", className: "size-full", "aria-hidden": true } as const;

  if (platform === "youtube") {
    return (
      <svg {...common} fill="#fff">
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5 3-5 3Z" />
      </svg>
    );
  }
  if (platform === "linkedin") {
    return (
      <svg {...common} fill="#fff">
        <path d="M6.9 8.4H3.6V20h3.3V8.4ZM5.25 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM20.4 20h-3.3v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.8V8.4h3.16v1.59h.05c.44-.84 1.52-1.72 3.12-1.72 3.34 0 3.96 2.2 3.96 5.05V20Z" />
      </svg>
    );
  }
  if (platform === "threads") {
    return (
      <svg {...common} fill="#000">
        <path d="M16.3 11.5c-.1-.05-.2-.1-.3-.14-.18-3.3-1.98-5.19-5-5.21h-.04c-1.81 0-3.31.77-4.24 2.18l1.66 1.14c.69-1.05 1.78-1.27 2.58-1.27h.03c1 .01 1.75.3 2.23.86.35.41.59.98.7 1.7a12.6 12.6 0 0 0-2.86-.14c-2.88.17-4.73 1.85-4.6 4.19.06 1.19.65 2.21 1.67 2.88.86.56 1.96.84 3.11.78 1.51-.08 2.7-.66 3.53-1.71.63-.8 1.03-1.84 1.2-3.15.72.43 1.25 1 1.55 1.68.5 1.16.53 3.07-1.02 4.62-1.36 1.36-3 1.95-5.47 1.97-2.75-.02-4.83-.9-6.18-2.62C3.6 17.63 3.945 15.36 3.93 12c.015-3.36-.33-5.63.94-7.23C6.22 3.05 8.3 2.17 11.05 2.15c2.77.02 4.88.9 6.28 2.63.69.85 1.2 1.91 1.55 3.15l1.95-.52c-.42-1.52-1.07-2.83-1.96-3.92C17.08 1.28 14.44.16 11.06.14h-.01C7.68.16 5.07 1.28 3.31 3.5 1.74 5.47 1.93 8.2 1.93 12s-.19 6.53 1.38 8.5c1.76 2.22 4.37 3.34 7.74 3.36h.01c3-.02 5.11-.8 6.85-2.54 2.28-2.27 2.21-5.12 1.46-6.87-.54-1.25-1.57-2.27-2.99-2.95Zm-5.08 5.05c-1.27.07-2.59-.5-2.65-1.7-.05-.89.63-1.88 2.73-2 .24-.01.47-.02.7-.02.76 0 1.48.07 2.13.21-.24 3.03-1.66 3.45-2.91 3.51Z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="#fff">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z" />
    </svg>
  );
}

export function CreatorConstellation({
  creators,
  className,
}: {
  creators: Creator[];
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const angle = useMotionValue(0);
  const [paused, setPaused] = useState(false);

  useAnimationFrame((_t, delta) => {
    if (paused || prefersReducedMotion) return;
    // A full turn every ~90s. Slow reads premium; fast reads like a widget.
    angle.set(angle.get() + (delta / 1000) * (360 / 90));
  });

  const orbiting = creators.filter((creator) => !creator.feature);

  return (
    <div
      /*
        Wider than it is tall now, 850/620 rather than 850/720. It sits beside
        the copy in a two-column grid, so its height sets the whole section's
        — and that height was most of why Influence ran over a screen.
      */
      className={cn("relative isolate mx-auto aspect-[850/620] w-full", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <Globe />

      {/*
        Portrait badges ride the widest orbit, behind the cards.

        THE RADIUS IS CAPPED BY ARITHMETIC, NOT BY EYE. A badge is centred on
        `50% + radius%` and is 36px wide with a 4px platform chip hanging off
        its corner, so it reaches `50 + radius + (22 / boxWidth)%`. At the old
        44-to-49 that put the far edge past 100% on every width — the badge
        Genesis kept seeing sliced at the edge of the block. The narrowest box
        the constellation renders in is about 320px, where 22px is 6.9%, so 42
        is the largest radius that is safe everywhere. Vertically the orbit is
        already flattened to 0.72, which leaves the top and bottom clear.
      */}
      {PLATFORMS.map((platform, index) => (
        <PlatformBadge
          key={index}
          platform={platform}
          angle={angle}
          offset={(360 / PLATFORMS.length) * index + 26}
          radius={38 + seeded(index, 3) * 4}
          avatar={mediaUrl(`/creators/avatars/a${index + 1}.webp`)}
        />
      ))}

      {creators.map((creator, index) => (
        <OrbitCard
          key={creator.id}
          creator={creator}
          angle={angle}
          // The feature card barely moves; the rest are spread evenly.
          offset={creator.feature ? 0 : (360 / orbiting.length) * index}
          /*
            Same arithmetic as the badges. A card is 19% wide and grows to
            1.06x at the front of its orbit, so its half-width is 10.1% and 37
            put its edge at 97.1% — inside, but with nothing to spare once the
            scale peaked. 35 and 25 leave a two-point margin.
          */
          radius={creator.feature ? 7 : index % 2 === 0 ? 35 : 25}
          avatar={mediaUrl(`/creators/avatars/a${(index % 6) + 1}.webp`)}
        />
      ))}
    </div>
  );
}

/** Wireframe sphere with orbital rings and pulsing nodes. */
function Globe() {
  return (
    <svg aria-hidden viewBox="0 0 400 400" className="absolute inset-0 size-full">
      <defs>
        <radialGradient id="genesis-globe-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc516" stopOpacity="0.09" />
          <stop offset="70%" stopColor="#ffc516" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffc516" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="118" fill="url(#genesis-globe-core)" />

      {/* Latitude bands — ellipses flattening toward the poles. */}
      <g stroke="rgb(255 255 255 / 0.11)" fill="none" strokeWidth="0.9">
        <circle cx="200" cy="200" r="118" />
        {[0.3, 0.58, 0.82, 0.96].map((k) => (
          <ellipse key={k} cx="200" cy="200" rx="118" ry={118 * k} />
        ))}
        {[0.3, 0.58, 0.82].map((k) => (
          <ellipse key={`v${k}`} cx="200" cy="200" rx={118 * k} ry="118" />
        ))}
      </g>

      {/* Wider orbits the cards and badges travel on. */}
      <g stroke="rgb(255 255 255 / 0.07)" fill="none" strokeWidth="0.8">
        <ellipse cx="200" cy="200" rx="176" ry="150" transform="rotate(-12 200 200)" />
        <ellipse cx="200" cy="200" rx="188" ry="112" transform="rotate(8 200 200)" />
      </g>

      {/* Nodes. Staggered so the network reads as live, not blinking in unison. */}
      {[
        [286, 96], [318, 208], [252, 316], [126, 300], [92, 176], [156, 84], [340, 148],
      ].map(([cx, cy], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r="2.6"
          fill="#ffc516"
          className=""
          style={
            {
              "--pulse": `${(2.6 + seeded(index, 5) * 2.4).toFixed(2)}s`,
              animationDelay: `-${(seeded(index, 6) * 3).toFixed(2)}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}

function OrbitCard({
  creator,
  angle,
  offset,
  radius,
  avatar,
}: {
  creator: Creator;
  angle: MotionValue<number>;
  offset: number;
  radius: number;
  avatar: string;
}) {
  const rad = (deg: number) => ((deg + offset) * Math.PI) / 180;
  // Fixed precision: Framer serialises style values at reduced precision during
  // SSR, so an unrounded float mismatches on hydration.
  const round = (v: number) => Number(v.toFixed(3));
  const base = creator.feature ? 1 : 0.86;

  const left = useTransform(angle, (v) => `${round(50 + radius * Math.cos(rad(v)))}%`);
  const top = useTransform(angle, (v) => `${round(50 + radius * 0.74 * Math.sin(rad(v)))}%`);
  // Cards toward the front sit larger and above.
  const scale = useTransform(angle, (v) =>
    round(base + (creator.feature ? 0.04 : 0.2) * ((Math.sin(rad(v)) + 1) / 2)),
  );

  return (
    <motion.div
      style={{ left, top, scale }}
      // The width lives HERE, on the positioned element, so the percentage
      // resolves against the constellation container. On the inner card it
      // resolved against a shrink-to-fit parent and came out ~24% too wide.
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2",
        // Measured off the mockup: the centre card is 27% of the constellation
        // width and the rest are ~17%.
        creator.feature ? "z-30 w-[27%]" : "z-20 w-[19%]",
      )}
    >
      <div className="glass glass-lit w-full overflow-hidden rounded-card">
        <div
          className="relative aspect-[4/5]"
          style={{ backgroundImage: creator.image ? undefined : portrait(creator.id) }}
        >
          {creator.image && (
            <Image
              src={creator.image}
              alt=""
              fill
              // Cards sit at roughly a fifth of the frame on desktop.
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover"
            />
          )}

          <span
            className={cn(
              "glass absolute right-2 top-2 grid place-items-center rounded-full text-bone",
              creator.feature ? "size-9" : "size-6",
            )}
          >
            <Play className={creator.feature ? "size-4 fill-current" : "size-2.5 fill-current"} aria-hidden />
          </span>

          {/*
            THE NAME BAR CARRIES THE CREATOR'S NAME, not their niche.
            Genesis asked for the name here; the niche is what the whole
            section is about, so printing it on every card said the same
            thing eight times and was most of the clutter.

            It renders only when a name exists. Until Genesis supplies them
            the cards are simply photographs — which is the decluttering, and
            is honest: these are real faces and a made-up name under one is a
            claim about a person. The niche and reach stay in the sr-only
            description below, so nothing is lost to a screen reader.
          */}
          {creator.name && (
          <div
            className={cn(
              "glass glass-strong absolute inset-x-2 bottom-2 flex items-center rounded-card",
              creator.feature ? "gap-3 px-3 py-3" : "gap-2 px-2 py-2",
            )}
          >
            <Image
              src={avatar}
              alt=""
              // Fixed 36px and 20px on screen; 72 is the 2x source.
              width={72}
              height={72}
              className={cn(
                "shrink-0 rounded-full object-cover",
                creator.feature ? "size-9" : "size-5",
              )}
            />
            <span className="min-w-0">
              <span
                /*
                  line-clamp, not truncate. `truncate` forces one line, and
                  the name bar is 73-99px wide — so "Lifestyle Creator" lost
                  its last word to an ellipsis even on a featured card. Two
                  short lines carry the whole name; one line carries most of
                  it and a full stop that is not there.
                */
                className={cn(
                  "block line-clamp-2 font-medium leading-tight text-bone",
                  creator.feature ? "text-small" : "text-micro",
                )}
              >
                {creator.name}
              </span>
              {/*
                The follower count only appears on the featured cards. A
                small card's name bar is 73px wide, and at 11px "Travel
                Creator" alone needs 121px — so both lines were truncating to
                "Travel Crea…" and "856K Follo…", which is not a smaller
                version of the information, it is a broken version of it.

                One line fits. The full string is still in the sr-only label
                below, so nothing is lost to a screen reader.
              */}
              {creator.feature && (
                <span className="block line-clamp-1 text-micro leading-tight text-ash">
                  {creator.followers}
                </span>
              )}
            </span>
          </div>
          )}
        </div>
      </div>
      <span className="sr-only">{`${creator.label}, ${creator.followers}`}</span>
    </motion.div>
  );
}

function PlatformBadge({
  platform,
  angle,
  offset,
  radius,
  avatar,
}: {
  platform: (typeof PLATFORMS)[number];
  angle: MotionValue<number>;
  offset: number;
  radius: number;
  avatar: string;
}) {
  const rad = (deg: number) => ((deg + offset) * Math.PI) / 180;
  const round = (v: number) => Number(v.toFixed(3));

  const left = useTransform(angle, (v) => `${round(50 + radius * Math.cos(rad(v)))}%`);
  const top = useTransform(angle, (v) => `${round(50 + radius * 0.72 * Math.sin(rad(v)))}%`);
  const opacity = useTransform(angle, (v) => round(0.45 + 0.55 * ((Math.sin(rad(v)) + 1) / 2)));

  return (
    <motion.div
      aria-hidden
      style={{ left, top, opacity }}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
    >
      { }
      <Image
        src={avatar}
        alt=""
        width={72}
        height={72}
        className="block size-9 rounded-full object-cover ring-1 ring-white/15"
      />
      {/* The platform chip clipped to the badge's corner, as in the mockup. */}
      <span
        className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-field p-0.5 ring-1 ring-black/40"
        style={{ background: platform.fill }}
      >
        <PlatformGlyph platform={platform.key} />
      </span>
    </motion.div>
  );
}
