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
 */
const APPLICATIONS = [
  { name: "ChatGPT", src: "/brand/apps/chatgpt.svg", ratio: 1, mark: true },
  { name: "Claude", src: "/brand/apps/claude.png", ratio: 4.65 },
  /* `scale` is the one hand-set number here. Midjourney's mark is line art
     — a hairline boat in a 1024 box — where every other icon is solid, so at
     the shared height its strokes render under a pixel and it reads as an
     empty space in the row. */
  { name: "Midjourney", src: "/brand/apps/midjourney.svg", ratio: 1, mark: true, scale: 1.3 },
  { name: "Runway", src: "/brand/apps/runway.png", ratio: 1, mark: true },
  { name: "Kling", src: "/brand/apps/kling.png", ratio: 3.69 },
  { name: "Google Gemini", src: "/brand/apps/gemini.png", ratio: 4.44 },
  { name: "ElevenLabs", src: "/brand/apps/elevenlabs.png", ratio: 7.79 },
  { name: "Higgsfield", src: "/brand/apps/higgsfield.png", ratio: 4.92 },
  { name: "GitHub", src: "/brand/apps/github.svg", ratio: 3.53 },
  { name: "Google Docs", src: "/brand/apps/google-docs.svg", ratio: 5.21 },
  { name: "Google Sheets", src: "/brand/apps/google-sheets.svg", ratio: 5.8 },
  { name: "Google Drive", src: "/brand/apps/google-drive.png", ratio: 5.96 },
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
function logoBox(app: (typeof APPLICATIONS)[number], height: number, maxWidth: number) {
  const scale = "scale" in app ? (app.scale as number) : 1;
  const h = app.mark
    ? height * 1.5 * scale
    : Math.min(height, maxWidth / app.ratio) * scale;
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
      <WideDiagram className={cn("hidden sm:block", className)} />
      <TallDiagram className={cn("sm:hidden", className)} />
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
          const box = logoBox(app, 18, 112);
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
  const width = 360;
  /*
    TWO COLUMNS ABOVE THE NODE, rather than the node in the middle with rows
    either side of it. With four applications a phone could carry two above
    and two below; with thirteen that arrangement is a column of seven
    stacked over the node and six under it, which is a drawing taller than
    the screen. Stacked in two columns with everything converging DOWNWARD
    into the Lab, the whole list is one glance and the labels keep their
    size.
  */
  const half = Math.ceil(APPLICATIONS.length / 2);
  const columns = [
    { apps: APPLICATIONS.slice(0, half), dotX: 156, dir: 1 as const },
    { apps: APPLICATIONS.slice(half), dotX: 204, dir: -1 as const },
  ];
  const rowTop = 30;
  const rowGap = 42;
  const rows = Math.max(...columns.map((c) => c.apps.length));
  const hubY = rowTop + rows * rowGap + 26;
  const hub = { x: 80, y: hubY, w: 200, h: 80 };
  const cx = hub.x + hub.w / 2;
  const height = hubY + hub.h + 24;

  const markW = 140;
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
          The strands here run vertically, so the ramp is laid along y in user
          space: faint at the application, full orange where it meets the node.
        */}
        <linearGradient
          id="gm-ai-line-down"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={rowTop}
          x2="0"
          y2={hub.y}
        >
          <stop offset="0%" stopColor="#ff8fb8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffa25c" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="gm-ai-dash-tall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff8fb8" />
          <stop offset="100%" stopColor="#ffa25c" />
        </linearGradient>
        <radialGradient id="gm-ai-glow-tall">
          <stop offset="0%" stopColor="#ff9a86" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ff9a86" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={hub.y + hub.h / 2} r="110" fill="url(#gm-ai-glow-tall)" />

      {columns.map((column, side) =>
        column.apps.map((app, index) => {
          const y = rowTop + index * rowGap;
          const box = logoBox(app, 17, 108);
          /*
            Straight down out of the dot, then a flat arrival on the node's
            top edge — the same handle discipline the wide drawing uses, so
            thirteen strands gather instead of crossing.
          */
          const d = `M ${column.dotX} ${y} C ${column.dotX} ${y + 48}, ${cx} ${hub.y - 48}, ${cx} ${hub.y}`;
          return (
            <g key={app.name}>
              <path
                d={d}
                fill="none"
                stroke="url(#gm-ai-line-down)"
                strokeWidth="1.5"
                opacity="0.55"
              />
              <path
                d={d}
                fill="none"
                stroke="url(#gm-ai-line-down)"
                strokeWidth="2"
                strokeLinecap="round"
                className="gm-flow motion-reduce:[animation:none] motion-reduce:hidden"
                style={{ animationDelay: `${(index * 2 + side) * -0.55}s` }}
              />
              <circle cx={column.dotX} cy={y} r="3.5" fill="#ff8fb8" />
              <image
                href={app.src}
                x={column.dir === 1 ? column.dotX - 12 - box.w : column.dotX + 12}
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

      <rect
        x={hub.x}
        y={hub.y}
        width={hub.w}
        height={hub.h}
        rx="18"
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
