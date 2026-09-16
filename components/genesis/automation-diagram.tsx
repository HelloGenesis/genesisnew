import { cn } from "@/lib/utils";

/**
 * The picture under AI Lab's automation copy: the applications a run draws
 * on, converging into the Lab.
 *
 * IT WAS TWO DIAGRAMS. Genesis supplied two references, this fan and a
 * branching workflow graph, and has since asked for the graph to be removed.
 * That component and its node and edge tables are deleted rather than left
 * exported and unused; it is in the history if it comes back.
 *
 * WHY IT IS DRAWN AND NOT PLACED. The reference was a screenshot of another
 * company's marketing page, and a reference for what the picture should SAY
 * is not an asset to paste: shipping someone else's artwork on a client site
 * is a licensing problem, and it carries a palette (cyan and electric blue)
 * that is nowhere in the six colours Genesis fixed.
 *
 * WHAT THE FIRST DRAW GOT WRONG, because it is the reason for most of the
 * numbers below:
 *
 *   THE LINES LOOKED BROKEN. Each connector was a single travelling dash and
 *     nothing else, so at any moment most of every strand was absent and the
 *     picture read as a scatter of fragments. Every connector now draws
 *     TWICE: a continuous base that says "these are connected", and the
 *     travelling highlight that says "something is moving through".
 *
 *   THE GLOW SWALLOWED THE PANEL. A 190-unit radial at 35% over a 420-unit
 *     canvas is a light source filling most of the frame. It is a third of
 *     that radius now and half the alpha.
 *
 *   THE COMPOSITION WAS MOSTLY GAP. Nearly half the width was empty middle,
 *     so the two halves read as separate graphics.
 *
 * INLINE SVG RATHER THAN AN IMAGE FILE: the labels are real text, so they are
 * selectable, searchable and read aloud; it is sharp at any size; and it
 * follows the theme because its colours are the page's own tokens.
 */

/**
 * The applications a run actually draws on, as their own marks.
 *
 * NAMED BY GENESIS, AND NOW DRAWN BY THEM TOO: they supplied the logo files,
 * which is what makes this legitimate to show. Earlier passes set the names
 * as type precisely because redrawing a third-party mark from memory gets it
 * subtly wrong and lifting one off the web is a licensing problem. Supplied
 * artwork settles both.
 *
 * `ratio` IS THE FILE'S OWN WIDTH OVER ITS HEIGHT, measured after trimming
 * the transparent padding off each one — Google Drive's arrived as a wordmark
 * floating in a 768-square, which would have rendered it at a third the size
 * of everything else however carefully the boxes were matched.
 *
 * `mark` FLAGS THE SQUARE ONES. Four of these are icons rather than
 * wordmarks, and setting an icon to the same HEIGHT as a wordmark makes it
 * look smaller than everything around it — matching heights is the thing
 * people mean by "uniform" for wordmarks, and it is the wrong rule for a
 * square. Icons take a larger height so the SET reads as one size, which is
 * what Genesis asked for: "koi alag size koi alag size" is the fault.
 *
 * Google Veo and Nano Banana came off at Genesis's instruction, replaced by
 * one Google Gemini.
 *
 * SYMBOLS ONLY, NO NAMES, at Genesis's instruction — and larger. The
 * `-mark` files are the icon cut from the left of each supplied wordmark
 * (the SVGs by a narrowed viewBox, the PNGs by a crop to the icon's own ink),
 * so every entry is now roughly square and one shared height makes the set
 * read as one size. The wordmark files stay beside them.
 */
const APPLICATIONS = [
  { name: "ChatGPT", src: "/brand/apps/chatgpt.svg", ratio: 1 },
  { name: "Claude", src: "/brand/apps/claude-mark.png", ratio: 1 },
  /* `scale` is the one hand-set number here. Midjourney's mark is line art
     — a hairline boat in a 1024 box — where every other icon is solid, so at
     the shared height its strokes render under a pixel and it reads as an
     empty space in the row. */
  { name: "Midjourney", src: "/brand/apps/midjourney.svg", ratio: 1, scale: 1.3 },
  { name: "Runway", src: "/brand/apps/runway.png", ratio: 1 },
  { name: "Kling", src: "/brand/apps/kling-mark.png", ratio: 0.99 },
  { name: "Google Gemini", src: "/brand/apps/gemini-mark.png", ratio: 1.01 },
  { name: "ElevenLabs", src: "/brand/apps/elevenlabs-mark.png", ratio: 0.63 },
  { name: "Higgsfield", src: "/brand/apps/higgsfield-mark.png", ratio: 1.09 },
  { name: "GitHub", src: "/brand/apps/github-mark.svg", ratio: 1.03 },
  { name: "Google Docs", src: "/brand/apps/google-docs-mark.svg", ratio: 0.72 },
  { name: "Google Sheets", src: "/brand/apps/google-sheets-mark.svg", ratio: 0.74 },
  { name: "Google Drive", src: "/brand/apps/google-drive-mark.png", ratio: 1.12 },
];

/**
 * One logo's box, at a size that makes the whole set look equal.
 *
 * Wordmarks share a cap height, capped by `maxWidth` so a very long one
 * cannot dwarf the rest: ElevenLabs is 7.79:1, nearly twice the next widest,
 * and at a matched height it read as the biggest thing in the picture. Width
 * is the honest measure of how large a wordmark looks, so it gives up a
 * little height to keep the SET even.
 *
 * Square marks take 1.5x the height, which is the opposite correction: an
 * icon set to a wordmark's cap height looks smaller than everything by it.
 */
function logoBox(app: (typeof APPLICATIONS)[number], height: number) {
  const scale = "scale" in app ? (app.scale as number) : 1;
  const h = height * scale;
  return { w: h * app.ratio, h };
}

/**
 * THE AI LAB LOCKUP AT THE CENTRE, not the words "Genesis AI".
 *
 * Genesis asked for the division's own logo here and for the GENESIS prefix
 * to stay off it. That artwork already exists: it is the name-only crop made
 * for the divisions board, which is the AI Lab wordmark with the prefix and
 * the tagline cut away. So this is the real mark rather than a placeholder,
 * and it needs no theme pair — the crop's ink is a gradient that reads on
 * either ground, which is why the board uses one file for both themes.
 */
const AI_LAB_MARK = {
  src: "/brand/divisions/name/ai-lab.png",
  width: 250,
  height: 98,
};

/**
 * Where the lettering sits inside that file, as a share of its height.
 *
 * The name marks were re-cut to a common baseline so the four line up on the
 * orb board (see scripts/normalise-division-names.py). That normalisation
 * pads every file to leave headroom above the cap line and depth below the
 * baseline for a descender — "AI Lab" has neither, so a third of its box is
 * deliberately empty air. Centring the BOX in the node would therefore hang
 * the visible lettering high, so the BODY is what gets centred here.
 */
const BODY_MIDPOINT = 0.41;

/**
 * The diagram, in the shape that suits the screen.
 *
 * TWO DRAWINGS, NOT ONE SCALED. The wide one is 760 units across with its
 * labels at 16, so on a phone it rendered 277px wide with the application
 * names at 5.8px: a diagram that technically fitted and could not be read.
 * Scaling type up inside it would only have pushed the labels into each
 * other. A phone gets a tall arrangement instead — half the applications
 * above the node and half below, two to a row — with the labels at 16 units
 * in a 360-unit-wide drawing, which lands them near 14px on a 375px screen.
 *
 * TWELVE APPLICATIONS, up from four, which is what set both layouts. The
 * list is split down the middle and fed in from BOTH sides: left and right
 * of the node on a wide screen, two columns above it on a phone. One column
 * of thirteen would be taller than anything it points at, and a phone cannot
 * carry two labels side by side and a node between them at a readable size.
 *
 * DISTINCT GRADIENT IDS, which is load-bearing rather than tidy. Both drawings
 * are in the page and CSS hides one. An SVG `url(#id)` resolves to the FIRST
 * element with that id in the document, and a gradient inside a display:none
 * SVG does not render, so if the two shared ids the visible drawing would
 * reference the hidden one's gradients and paint its lines with nothing.
 */
export function AutomationSources({ className }: { className?: string }) {
  return (
    <>
      {/*
        THE BOARD HOLDS UNTIL md, NOT sm. At 640-768 the fan was being asked
        to fit a 760-unit drawing into about 600 points of column, which put
        the labels back under 13px and crowded the strands — the tablet half
        of Genesis's report. The board has no such problem: it reflows as two
        columns of cells at any width.
      */}
      <WideDiagram className={cn("hidden md:block", className)} />
      <TallDiagram className={cn("md:hidden", className)} />
    </>
  );
}

function WideDiagram({ className }: { className?: string }) {
  const width = 760;
  /*
    THE CANVAS GREW WITH THE LIST. Seven labels a side at the old 300 units
    left 36 units between baselines for 16-unit type, which is lines of text
    touching. At 420 they sit 56 apart, the spacing four of them had.
  */
  const height = 420;
  const hub = { x: 246, y: height / 2, w: 268, h: 92 };
  /* Where the strands start, and therefore how much room a logo has: 140
     units outside the dot, which is what the widest mark needs. */
  const leftX = 168;
  const rightX = width - leftX;
  const half = Math.ceil(APPLICATIONS.length / 2);
  const sides = [
    { apps: APPLICATIONS.slice(0, half), x: leftX, dir: 1 },
    { apps: APPLICATIONS.slice(half), x: rightX, dir: -1 },
  ];
  const top = 44;

  /*
    The mark, sized to sit inside the node with air around it.

    THIS NUMBER CAME DOWN FROM 196 WITHOUT THE LOGO CHANGING SIZE. The old
    file carried 215px of transparent padding on each side, so a 196-unit box
    held about 72 units of actual lettering. The re-cut file is its ink and
    nothing else, so the box and the mark are now the same thing and 150 units
    of box is more lettering than 196 units of the old one was.
  */
  const markW = 150;
  const markH = Math.round((markW / AI_LAB_MARK.width) * AI_LAB_MARK.height);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="presentation"
      aria-hidden
      className={cn("h-auto w-full", className)}
    >
      <defs>
        {/*
          THE AI LAB RAMP, which Genesis asked the flowing lines to carry. It
          is the division's own gradient from lib/home-content — pink into
          orange — rather than the interface yellow every other diagram on the
          site uses. Written out here rather than read from a CSS variable
          because an SVG gradient needs its stops as elements, and a
          `linear-gradient()` string cannot be handed to <stop>.

          MIRRORED FOR THE RIGHT-HAND HALF. A gradient runs left to right in
          its own box whichever way the strand travels, so the right side
          reuses the same stops reversed and arrives at the node at full
          strength like its opposite number.
        */}
        <linearGradient id="gm-ai-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff8fb8" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#ff8fb8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffa25c" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="gm-ai-line-flip" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff8fb8" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#ff8fb8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffa25c" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="gm-ai-dash" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff8fb8" />
          <stop offset="100%" stopColor="#ffa25c" />
        </linearGradient>
        <radialGradient id="gm-ai-glow">
          <stop offset="0%" stopColor="#ff9a86" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ff9a86" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* A bloom behind the node. Small and faint. */}
      <circle cx={hub.x + hub.w / 2} cy={hub.y} r="128" fill="url(#gm-ai-glow)" />

      {sides.map((side) =>
        side.apps.map((app, index) => {
          const gap = (height - top * 2) / Math.max(side.apps.length - 1, 1);
          const y = top + index * gap;
          const box = logoBox(app, 40);
          const arrive = side.dir === 1 ? hub.x : hub.x + hub.w;
          /*
            A cubic with both handles pulled horizontally, so a strand leaves
            its label flat and arrives at the node flat. A quadratic curves out
            at an angle and reads as a wire under tension.
          */
          const d = `M ${side.x} ${y} C ${side.x + 96 * side.dir} ${y}, ${arrive - 96 * side.dir} ${hub.y}, ${arrive} ${hub.y}`;
          const stroke = side.dir === 1 ? "url(#gm-ai-line)" : "url(#gm-ai-line-flip)";
          return (
            <g key={app.name}>
              {/* The base: always whole, always visible. */}
              <path d={d} fill="none" stroke={stroke} strokeWidth="1.25" opacity="0.4" />
              {/* And the highlight travelling along it. */}
              <path
                d={d}
                fill="none"
                stroke="url(#gm-ai-dash)"
                strokeWidth="1.75"
                strokeLinecap="round"
                className="gm-flow motion-reduce:[animation:none] motion-reduce:hidden"
                style={{ animationDelay: `${index * -1.1 - (side.dir === 1 ? 0 : 0.55)}s` }}
              />
              <circle cx={side.x} cy={y} r="3" fill="#ff8fb8" />
              <image
                href={app.src}
                x={side.dir === 1 ? side.x - 16 - box.w : side.x + 16}
                y={y - box.h / 2}
                width={box.w}
                height={box.h}
                preserveAspectRatio="xMidYMid meet"
                className="app-mark"
              >
                <title>{app.name}</title>
              </image>
            </g>
          );
        }),
      )}

      {/* The node. */}
      {/*
        THE NODE'S EDGES HAVE TO READ. Genesis asked for the ends of this box
        to be visible, and they were not: a 1-unit stroke at 40% opacity in a
        760-unit viewBox renders as roughly one pixel at barely a third
        strength, so the box was a slightly darker patch with no discernible
        outline. It is a full-strength stroke at 1.75 units now, which is the
        same weight the connectors carry, so the node reads as the object they
        arrive at rather than as a shadow behind the lockup.
      */}
      <rect
        x={hub.x}
        y={hub.y - hub.h / 2}
        width={hub.w}
        height={hub.h}
        rx="18"
        fill="var(--surface-raised, #18181a)"
        stroke="url(#gm-ai-dash)"
        strokeWidth="1.75"
        strokeOpacity="0.95"
      />
      {/*
        The lockup, centred in the node. "AUTOMATED" used to sit under it and
        Genesis asked for it gone: the mark is the label, and a word in
        letterspaced caps beneath a logo is the sort of caption that explains
        what the picture is already saying.
      */}
      <image
        href={AI_LAB_MARK.src}
        x={hub.x + (hub.w - markW) / 2}
        y={hub.y - markH * BODY_MIDPOINT}
        width={markW}
        height={markH}
      />
    </svg>
  );
}

function TallDiagram({ className }: { className?: string }) {
  /*
    THE NODE IN THE MIDDLE, EVERY APPLICATION RUNNING INTO IT — Genesis's
    own instruction after two passes that missed: "ai lab ko thoda beech me
    rakho and fir sabse ek connection".

    It is the wide drawing's sentence at a phone's proportions. Three
    applications a side above the Lab and three below, each with one curve of
    its own into the nearest edge of it. Six strands meet at the top and six
    at the bottom, which is few enough that they gather rather than tangle —
    the fault in the first attempt, where twelve ran the full height of the
    drawing through each other and behind the logos.

    THE CONNECTORS ARE DRAWN IN A USER-SPACE GRADIENT, and that is a fix
    rather than a detail. A gradient in the default objectBoundingBox units
    has nothing to resolve against on a path whose box has no height — a flat
    horizontal run — so the previous version's taps were painted with an
    empty paint server and Genesis saw dots joined to nothing.
  */
  const width = 360;
  const cx = width / 2;

  /*
    ROOM FOR THE SYMBOLS. With names gone each application is a square
    mark, and at 32 units on 44-unit rows they touched their neighbours and
    sat ragged against their dots — the "ajeeb" Genesis saw on a phone.
    Marks are 26 now, on 50-unit rows, each centred in a fixed slot beside
    its dot so the two columns line up.
  */
  const rowGap = 50;
  const perSide = 3;
  const markSize = 26;
  const slot = 36;

  const topRows = [0, 1, 2].map((i) => 24 + i * rowGap);
  const hub = { w: 150, h: 58, x: (width - 150) / 2, y: 24 + perSide * rowGap + 14 };
  const bottomRows = [0, 1, 2].map((i) => hub.y + hub.h + 30 + i * rowGap);
  const height = bottomRows[bottomRows.length - 1] + 30;

  const markW = 120;
  const markH = Math.round((markW / AI_LAB_MARK.width) * AI_LAB_MARK.height);

  /* Where a strand leaves its logo. */
  const tap = 118;

  const taps = APPLICATIONS.map((app, index) => {
    const above = index < perSide * 2;
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor((above ? index : index - perSide * 2) / 2);
    return {
      app,
      x: side === -1 ? tap : width - tap,
      y: above ? topRows[row] : bottomRows[row],
      side,
      toY: above ? hub.y : hub.y + hub.h,
      bend: above ? 1 : -1,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="presentation"
      aria-hidden
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id="gm-ai-dash-tall" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
          <stop offset="0%" stopColor="#ff8fb8" />
          <stop offset="100%" stopColor="#ffa25c" />
        </linearGradient>
        <linearGradient
          id="gm-ai-line-down"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={topRows[0]}
          x2="0"
          y2={hub.y}
        >
          <stop offset="0%" stopColor="#ff8fb8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffa25c" stopOpacity="1" />
        </linearGradient>
        <linearGradient
          id="gm-ai-line-up"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={bottomRows[bottomRows.length - 1]}
          x2="0"
          y2={hub.y + hub.h}
        >
          <stop offset="0%" stopColor="#ff8fb8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffa25c" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="gm-ai-glow-tall">
          <stop offset="0%" stopColor="#ff9a86" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ff9a86" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={hub.y + hub.h / 2} r="104" fill="url(#gm-ai-glow-tall)" />

      {taps.map(({ app, x, y, side, toY, bend }, index) => {
        const pull = 34 * bend;
        const d = `M ${x} ${y} C ${x} ${y + pull}, ${cx} ${toY - pull * 1.1}, ${cx} ${toY}`;
        const stroke = bend === 1 ? "url(#gm-ai-line-down)" : "url(#gm-ai-line-up)";
        const box = logoBox(app, markSize);
        const centre = side === -1 ? x - 12 - slot / 2 : x + 12 + slot / 2;
        return (
          <g key={app.name}>
            <path d={d} fill="none" stroke={stroke} strokeWidth="1.4" opacity="0.6" />
            <path
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              className="gm-flow motion-reduce:[animation:none] motion-reduce:hidden"
              style={{ animationDelay: `${index * -0.55}s` }}
            />
            <circle cx={x} cy={y} r="3" fill="#ff8fb8" />
            <image
              href={app.src}
              x={centre - box.w / 2}
              y={y - box.h / 2}
              width={box.w}
              height={box.h}
              preserveAspectRatio="xMidYMid meet"
              className="app-mark"
            >
              <title>{app.name}</title>
            </image>
          </g>
        );
      })}

      <rect
        x={hub.x}
        y={hub.y}
        width={hub.w}
        height={hub.h}
        rx="16"
        fill="var(--surface-raised, #18181a)"
        stroke="url(#gm-ai-dash-tall)"
        strokeWidth="1.75"
        strokeOpacity="0.95"
      />
      <image
        href={AI_LAB_MARK.src}
        x={cx - markW / 2}
        y={hub.y + hub.h / 2 - markH * BODY_MIDPOINT}
        width={markW}
        height={markH}
      />
    </svg>
  );
}
