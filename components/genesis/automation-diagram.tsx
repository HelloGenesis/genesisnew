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
 * The applications a run actually draws on.
 *
 * NAMED BY GENESIS. An earlier version listed the raw materials instead — the
 * brief, the guidelines, past campaigns — on the reasoning that printing
 * another company's product name is a claim to use it. Genesis has since
 * asked for the applications by name, which settles that: it is their stack
 * and their claim to make.
 *
 * WORDS RATHER THAN LOGOS, for now. Redrawing four third-party marks from
 * memory would get them subtly wrong, and reproducing them from the web is
 * the licensing problem this whole file exists to avoid. The labels read
 * correctly at this size and swapping any one for supplied artwork is a
 * one-line change.
 *
 * ADDING A FIFTH re-spaces the fan on its own; nothing below is hard-coded to
 * four.
 */
const APPLICATIONS = ["Google Docs", "Higgsfield", "Seedance", "Claude"];

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
 * other. A phone gets a tall arrangement instead, two applications above the
 * node and two below, with the labels at 18 units in a 360-unit-wide drawing,
 * which lands them near 14px on a 375px screen.
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
  const height = 270;
  const dotX = 250;
  const hub = { x: 452, y: height / 2, w: 268, h: 92 };
  const top = 46;
  const gap = (height - top * 2) / (APPLICATIONS.length - 1);

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
        */}
        <linearGradient id="gm-ai-line" x1="0" y1="0" x2="1" y2="0">
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

      {APPLICATIONS.map((app, index) => {
        const y = top + index * gap;
        /*
          A cubic with both handles pulled horizontally, so a strand leaves
          its label flat and arrives at the node flat. A quadratic curves out
          at an angle and reads as a wire under tension.
        */
        const d = `M ${dotX} ${y} C ${dotX + 96} ${y}, ${hub.x - 96} ${hub.y}, ${hub.x} ${hub.y}`;
        return (
          <g key={app}>
            {/* The base: always whole, always visible. */}
            <path
              d={d}
              fill="none"
              stroke="url(#gm-ai-line)"
              strokeWidth="1.25"
              opacity="0.4"
            />
            {/* And the highlight travelling along it. */}
            <path
              d={d}
              fill="none"
              stroke="url(#gm-ai-dash)"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="gm-flow motion-reduce:[animation:none] motion-reduce:hidden"
              style={{ animationDelay: `${index * -1.1}s` }}
            />
            <circle cx={dotX} cy={y} r="3" fill="#ff8fb8" />
            <text
              x={dotX - 14}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="16"
              fill="var(--ink-muted, #d1cfcf)"
            >
              {app}
            </text>
          </g>
        );
      })}

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
  const height = 440;
  const hub = { x: 80, y: 180, w: 200, h: 80 };
  const cx = hub.x + hub.w / 2;
  const half = Math.ceil(APPLICATIONS.length / 2);
  const rows = [
    { apps: APPLICATIONS.slice(0, half), dotY: 64, labelY: 40, toY: hub.y, down: true },
    { apps: APPLICATIONS.slice(half), dotY: 376, labelY: 410, toY: hub.y + hub.h, down: false },
  ];

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
          The strands here run mostly vertically, so the ramp is laid along y
          in user space: faint at the application, full orange at the node,
          for the rows above and below alike.
        */}
        <linearGradient id="gm-ai-line-down" gradientUnits="userSpaceOnUse" x1="0" y1="64" x2="0" y2={hub.y}>
          <stop offset="0%" stopColor="#ff8fb8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffa25c" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="gm-ai-line-up" gradientUnits="userSpaceOnUse" x1="0" y1="376" x2="0" y2={hub.y + hub.h}>
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

      {rows.map((row) =>
        row.apps.map((app, index) => {
          const x = (index + 0.5) * (width / row.apps.length);
          const bend = row.down ? 70 : -70;
          const d = `M ${x} ${row.dotY} C ${x} ${row.dotY + bend}, ${cx} ${row.toY - bend * 0.85}, ${cx} ${row.toY}`;
          const line = row.down ? "url(#gm-ai-line-down)" : "url(#gm-ai-line-up)";
          return (
            <g key={app}>
              <path d={d} fill="none" stroke={line} strokeWidth="1.5" opacity="0.55" />
              <path
                d={d}
                fill="none"
                stroke={line}
                strokeWidth="2"
                strokeLinecap="round"
                className="gm-flow motion-reduce:[animation:none] motion-reduce:hidden"
                style={{ animationDelay: `${(index + (row.down ? 0 : 2)) * -1.1}s` }}
              />
              <circle cx={x} cy={row.dotY} r="3.5" fill="#ff8fb8" />
              <text
                x={x}
                y={row.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                fill="var(--ink-muted, #d1cfcf)"
              >
                {app}
              </text>
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
