"use client";

import Image from "next/image";

import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import type { CaseStudy } from "@/lib/case-studies";
import { caseStudyForPageSlug } from "@/lib/case-study-pages";
import { mediaUrl } from "@/lib/media-url";
import { CaseStudyDialog } from "./case-study-dialog";
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
  /** The accessible description of the card — the creator's name. */
  label: string;
  /** The name printed on the card. */
  name?: string;
  /**
   * Reach, WHERE IT IS A REAL FIGURE. Optional because the counts that used
   * to sit here were illustrative, and an invented number under a real
   * person's photograph is a claim about them.
   */
  followers?: string;
  /**
   * Their Instagram. Given one, the whole card becomes a link to it —
   * Genesis's instruction when they supplied the roster: "when somebody
   * clicks on their image they can be redirected to their instagram".
   */
  instagram?: string;
  /**
   * The slug of the case study this creator appears in, under /case-studies.
   *
   * IT WINS OVER `instagram`, which is Genesis's correction: "right now
   * clicking any of the profile opens their instagram — I want ki jab click
   * kare influencer pe unse juda hua case study khule." A face on this ring
   * is evidence of work, and the work is the thing a visitor came to see;
   * their Instagram is a detour off the site in the middle of the pitch.
   *
   * A CREATOR WITHOUT ONE STILL OPENS INSTAGRAM. Only three of the eleven are
   * mapped so far (see lib/home-content), so falling through preserves the
   * behaviour every other card already had rather than making eight of them
   * dead. It also means adding a study is one line of data, here and nowhere
   * else.
   */
  caseStudy?: string;
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
  /*
    Declared ABOVE useAnimationFrame, which reads it. Declared below, the React
    Compiler cannot see it is a ref by the time the hook captures it, and
    flags the write in step() as mutating a value passed to a hook.
  */
  const stepping = useRef(false);

  useAnimationFrame((_t, delta) => {
    if (paused || prefersReducedMotion || stepping.current) return;
    // A full turn every ~90s. Slow reads premium; fast reads like a widget.
    angle.set(angle.get() + (delta / 1000) * (360 / 90));
  });

  const orbiting = creators.filter((creator) => !creator.feature);
  /*
    WHICH STUDY IS OPEN OVER THE PAGE. The cards used to navigate to
    /case-studies/<slug>; Genesis asked for the study to open where the reader
    already is. Held as the study itself rather than as a slug because the
    dialog wants the object and there is exactly one open at a time.
  */
  const [study, setStudy] = useState<CaseStudy | null>(null);

  /*
    LEFT AND RIGHT, BETWEEN INFLUENCERS. Genesis asked for the constellation to
    stay interactive and to gain buttons that move from one creator to the next.
    A step turns the ring by exactly one card's share of the circle, so the
    next creator lands where the last one was, and it is tweened rather than
    jumped so the eye can follow which card moved.

    The ambient drift is held off while a step is running. Both write the same
    angle, and letting the drift keep adding during the tween is what would
    make a step overshoot by a few degrees and stop looking deliberate.
  */
  const step = (direction: 1 | -1) => {
    stepping.current = true;
    animate(angle, angle.get() + direction * (360 / Math.max(orbiting.length, 1)), {
      duration: prefersReducedMotion ? 0 : 0.7,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => {
        stepping.current = false;
      },
    });
  };

  return (
    <div className={cn("mx-auto w-full", className)}>
    <div
      /*
        Wider than it is tall now, 850/620 rather than 850/720. It sits beside
        the copy in a two-column grid, so its height sets the whole section's
        — and that height was most of why Influence ran over a screen.
      */
      /*
        CAPPED BY THE VIEWPORT'S HEIGHT. The box keeps its 850:620 shape, so
        its width is what decides how tall it stands: on a tablet the column
        went full width and the ring alone was 560 points of a 1024 screen.
        The max-width is that ratio expressed against vh, which holds the
        whole constellation inside a share of the window however wide the
        column gets.

        44vh, UP FROM 31 — "woh circle ghumne wale ko bada karo". This cap,
        not the column's max-width, is what was actually deciding the ring's
        size: at 31vh on a 900-point window it was held to 425px however much
        room the column had, which is why raising the column cap on its own
        changed nothing. Two blocks have since left the column beside it (the
        niches moved out and the figures bar left the section entirely), so
        the height is there to spend.
      */
      className="relative isolate mx-auto aspect-[850/620] w-full max-w-[calc(44vh*850/620)]"
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
          onOpenStudy={() => setStudy(caseStudyForPageSlug(creator.caseStudy) ?? null)}
          /*
            The feature card barely moves; the rest are spread evenly — by
            their position among the ORBITING cards, not among all of them.
            Indexing into the whole list skips whatever slot the feature card
            occupies and hands the last card the first one's angle, so two of
            eleven rode the ring stacked on each other.
          */
          offset={
            creator.feature
              ? 0
              : (360 / orbiting.length) * orbiting.indexOf(creator)
          }
          /*
            Same arithmetic as the badges. A card is 19% wide and grows to
            1.06x at the front of its orbit, so its half-width is 10.1% and 37
            put its edge at 97.1% — inside, but with nothing to spare once the
            scale peaked. 35 and 25 leave a two-point margin.
          */
          /*
            38 and 26, out from 35 and 25. Eleven cards ride where eight did,
            so the two rings are pushed apart to keep them from reading as one
            pile. The outer figure is set by the edge: a card is 17% wide and
            peaks at 1.06x, so its half-width is 9% and 38 lands its edge at
            96% — inside, with room to spare.
          */
          radius={creator.feature ? 7 : index % 2 === 0 ? 38 : 26}
        />
      ))}
    </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        {([-1, 1] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            onClick={() => step(direction)}
            aria-label={direction < 0 ? "Previous influencer" : "Next influencer"}
            className="grid size-10 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] text-bone transition-colors hover:border-brand hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {direction < 0 ? (
              <ChevronLeft className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
          </button>
        ))}
      </div>

      {/*
        THE STUDY, OVER THE PAGE — the same window the case-study posters and
        the Studios stage cards open, so every route into a study on this page
        behaves identically and none of them costs a reader their place.

        NO PAGER. The posters walk a rail and the stage cards walk a row;
        these eleven faces are not an ordered set of studies — three have one
        and eight do not — so "next" would either skip most of the ring or
        walk a list the reader cannot see. Close and pick another face.
      */}
      <CaseStudyDialog study={study} onClose={() => setStudy(null)} />
    </div>
  );
}

/** Wireframe sphere with orbital rings and pulsing nodes. */
function Globe() {
  return (
    /*
      THE GLOBE IS DRAWN IN `currentColor`, NOT IN WHITE.

      Its latitude bands and orbits were rgb(255 255 255 / 0.11) and / 0.07 —
      white lines, which is correct on the dark theme and completely invisible
      on the light one, where the ground is #f9f9f9. Genesis saw the globe
      disappear and reasonably assumed it had been deleted.

      `text-bone` is the ink token that flips with the theme — near-white on
      dark, near-black on light — so the same two opacities now read on both
      grounds, and the strokes inherit it through currentColor.
    */
    <svg aria-hidden viewBox="0 0 400 400" className="absolute inset-0 size-full text-bone">
      <defs>
        <radialGradient id="genesis-globe-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc516" stopOpacity="0.09" />
          <stop offset="70%" stopColor="#ffc516" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffc516" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="118" fill="url(#genesis-globe-core)" />

      {/* Latitude bands — ellipses flattening toward the poles. */}
      <g stroke="currentColor" strokeOpacity="0.17" fill="none" strokeWidth="0.9">
        <circle cx="200" cy="200" r="118" />
        {[0.3, 0.58, 0.82, 0.96].map((k) => (
          <ellipse key={k} cx="200" cy="200" rx="118" ry={118 * k} />
        ))}
        {[0.3, 0.58, 0.82].map((k) => (
          <ellipse key={`v${k}`} cx="200" cy="200" rx={118 * k} ry="118" />
        ))}
      </g>

      {/* Wider orbits the cards and badges travel on. */}
      <g stroke="currentColor" strokeOpacity="0.12" fill="none" strokeWidth="0.8">
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
  onOpenStudy,
}: {
  creator: Creator;
  angle: MotionValue<number>;
  offset: number;
  radius: number;
  /** Opens this creator's study over the page. Undefined where there is none. */
  onOpenStudy?: () => void;
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
        /*
          17%, down from 19: the orbit carries eleven real creators where it
          carried eight, and at the old width the two rings touched.
        */
        creator.feature ? "z-30 w-[26%]" : "z-20 w-[17%]",
      )}
    >
      {/*
        THE WHOLE CARD IS THE LINK, and where it goes has changed. It opened
        the creator's Instagram; Genesis asked for it to open the case study
        that creator worked on, and to keep Instagram for the ones that have
        no study yet. See `caseStudy` on the type.

        A STUDY IS AN INTERNAL PAGE AND INSTAGRAM IS NOT, which is why
        CardShell has to decide between two kinds of anchor rather than just
        swapping an href. A study opens in the same tab, like every other link
        on this site; Instagram opens in its own with the usual rel tokens, so
        a reader who follows one does not lose their place on the page.

        Anyone with neither falls back to a div, so a roster that is only half
        supplied still renders rather than linking nowhere.
      */}
      <CardShell
        href={
          creator.caseStudy
            ? `/case-studies/${creator.caseStudy}`
            : creator.instagram
        }
        external={!creator.caseStudy}
        onOpen={creator.caseStudy ? onOpenStudy : undefined}
        /*
          NO HOVER RING. A yellow outline snapped around whichever card the
          pointer crossed, and on a ring that is already drifting under the
          cursor that fires constantly — Genesis's note was simply that they
          do not want it. The keyboard ring stays: it appears only on
          focus-visible, which a mouse never triggers, and without it a
          keyboard user cannot see which photograph they are about to open.
        */
        className="glass glass-lit block w-full overflow-hidden rounded-card outline-none focus-visible:shadow-[0_0_0_2px_var(--color-brand)]"
      >
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

          {/*
            NO BADGE IN THE CORNER. It was a play triangle, then an Instagram
            glyph once the cards became links, and Genesis's answer to both is
            that the photograph is the button: "direvtly image pe click karne
            se khulna chahiye". A glyph floating over somebody's face is one
            more thing on a card whose whole job is the face.
          */}
          {/*
            AND NO NAME BAR. A white slab across the bottom of every card is
            what Genesis called out — "ya toh dont add their names because it
            is not looking good, woh white box is not looking good" — and on
            a phone, where an orbiting card is about 60px wide, the name broke
            to three clipped lines inside it.

            The names are NOT lost: each card's accessible description below
            still carries the creator's name, so a screen reader announces who
            the link opens, and the photograph is what a sighted reader sees.
          */}
        </div>
        {/*
          INSIDE THE LINK, which is the whole point of it. It sat after
          CardShell, so the <a> held nothing but an alt="" photograph: eleven
          links with no name at all, announced as bare links and followed by
          crawlers with no anchor text. In here it IS the link's name.
        */}
        {/*
          The link's accessible name has to say where it GOES, not only who is
          in the picture — "Vikrant Massey" and "Vikrant Massey, on Instagram"
          are different promises, and now a third one is possible.
        */}
        <span className="sr-only">
          {[
            creator.label,
            creator.followers,
            creator.caseStudy
              ? "view the case study"
              : creator.instagram
                ? "on Instagram"
                : "",
          ]
            .filter(Boolean)
            .join(", ")}
        </span>
      </CardShell>
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

/**
 * The card's own box: a link when there is somewhere to go, a div otherwise.
 */
function CardShell({
  href,
  external = true,
  onOpen,
  className,
  children,
}: {
  href?: string;
  /**
   * Whether the destination leaves the site. An external card opens a new tab
   * with the rel tokens that stop it reaching back into this one.
   */
  external?: boolean;
  /**
   * Opens the study over the page instead of navigating to it.
   *
   * Genesis: "kisi video ko click kiya toh uska case study udhar hi khulna
   * chahiye, page redirect nahi." A face on this ring is the same kind of
   * target as a stage card in Studios, and both now open the same window.
   */
  onOpen?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (!href) return <div className={className}>{children}</div>;
  if (!external) {
    /*
      A REAL ANCHOR WITH A REAL HREF, WHOSE PLAIN CLICK IS INTERCEPTED — and
      a bare <a> rather than a <Link>, so next/link is not in the path to
      fight over the click. The href is the study's own URL, so a crawler
      follows it and cmd-click still opens a tab: every click carrying a
      modifier or a different button is handed straight to the browser.
    */
    return (
      <a
        href={href}
        onClick={(event) => {
          if (!onOpen) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          if (event.button !== 0) return;
          event.preventDefault();
          onOpen();
        }}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
