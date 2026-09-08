import { cn } from "@/lib/utils";

/**
 * The picture under AI Lab's automation copy.
 *
 * IT WAS TWO. Genesis supplied two references — this fan of sources
 * converging into one node, and a branching workflow graph — and has since
 * asked for the workflow graph to be removed. That component and its node and
 * edge tables are deleted rather than left exported and unused: an unreferenced
 * diagram is a thing the next person has to work out is dead before they can
 * safely change anything near it. It is in the history if it comes back.
 *
 * WHY IT IS DRAWN AND NOT PLACED. The references were screenshots of other
 * companies' marketing pages — references for what the picture should SAY,
 * not assets to paste. Shipping someone else's artwork on a client site is a
 * licensing problem, and they carry a different brand's palette (cyan and
 * electric blue), which is nowhere in the six colours Genesis fixed. So this
 * is rebuilt in the brand's own colours and it describes Genesis's pipeline
 * rather than a workflow SaaS's.
 *
 * WHAT THE FIRST DRAW GOT WRONG, because it is the reason for most of the
 * numbers below. Three faults, all of them visible at a glance:
 *
 *   THE LINES LOOKED BROKEN. Each connector was a single travelling dash and
 *     nothing else, so at any given moment most of every strand was simply
 *     absent — the picture read as a scatter of unconnected fragments rather
 *     than as six things joined to one. Every connector now draws TWICE: a
 *     continuous base at low opacity that says "these are connected", and the
 *     travelling highlight on top that says "something is moving through".
 *
 *   THE GLOW SWALLOWED THE PANEL. A 190-unit radial at 35% over a 420-unit
 *     canvas is a light source occupying most of the frame; it washed the
 *     surrounding glass yellow and left the hub sitting in fog. It is a third
 *     of that radius now and half the alpha — a bloom behind a node, not a
 *     sunrise.
 *
 *   THE COMPOSITION WAS MOSTLY GAP. Labels ended at x=194 and the hub began
 *     at x=574 on an 820 canvas: nearly half the width was empty middle, so
 *     the two halves read as two separate graphics. The span is tighter and
 *     the hub is a real node with an edge around it rather than loose text
 *     floating at the end of some lines.
 *
 * INLINE SVG RATHER THAN AN IMAGE FILE, for the reasons that always apply to
 * a diagram: the labels are real text, so they are selectable, searchable and
 * read aloud; it is sharp at any size; it follows the theme because its
 * colours are the page's own tokens; and it weighs a couple of kilobytes
 * against a couple of hundred.
 *
 * IT IS `aria-hidden` WITH A REAL CAPTION BESIDE IT. A screen reader
 * hearing "Brand brief, Brand guidelines, Product shots… Genesis AI" as a
 * loose bag of words learns nothing; the paragraph above it is the
 * accessible version of the same claim, which is the honest arrangement for a
 * picture that illustrates prose rather than carrying data of its own.
 */

/** The diagram's two colours, named once. */
const ACCENT = "var(--color-brand, #ffc516)";
const MUTED = "var(--ink-faint, #85848a)";

/**
 * The inputs an automation run actually starts from.
 *
 * DELIBERATELY NOT A ROW OF THIRD-PARTY LOGOS, which is what the reference
 * does — YouTube, GitHub, Medium. Printing another company's mark here is a
 * claim that Genesis has an integration with them, and an integration either
 * exists or does not. These are the materials a campaign is actually built
 * from, which is a claim Genesis can stand behind on any project.
 */
const SOURCES = [
  "Brand brief",
  "Brand guidelines",
  "Product shots",
  "Scripts",
  "Past campaigns",
  "Performance data",
];

export function AutomationSources({ className }: { className?: string }) {
  /*
    Geometry is computed rather than typed out, so adding a seventh source
    re-spaces the fan instead of landing on top of the sixth.
  */
  const width = 760;
  const height = 300;
  const dotX = 250;
  const hub = { x: 452, y: height / 2, w: 268, h: 96 };
  const top = 30;
  const gap = (height - top * 2) / (SOURCES.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="presentation"
      aria-hidden
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id="gm-conv-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={MUTED} stopOpacity="0.5" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="1" />
        </linearGradient>
        <radialGradient id="gm-conv-glow">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* A bloom behind the node. Small and faint — see the note above. */}
      <circle cx={hub.x + hub.w / 2} cy={hub.y} r="132" fill="url(#gm-conv-glow)" />

      {SOURCES.map((source, index) => {
        const y = top + index * gap;
        /*
          A cubic with both handles pulled horizontally, so a strand leaves
          its label flat and arrives at the node flat. A quadratic curves out
          at an angle and reads as a wire under tension.
        */
        const d = `M ${dotX} ${y} C ${dotX + 96} ${y}, ${hub.x - 96} ${hub.y}, ${hub.x} ${hub.y}`;
        return (
          <g key={source}>
            {/*
              THE BASE. Always whole, always visible. Without it the strand
              exists only where the travelling dash happens to be, which is
              what made the first version look like a broken picture.
            */}
            <path
              d={d}
              fill="none"
              stroke="url(#gm-conv-line)"
              strokeWidth="1.25"
              opacity="0.32"
            />
            {/* And the highlight travelling along it. */}
            <path
              d={d}
              fill="none"
              stroke={ACCENT}
              strokeWidth="1.75"
              strokeLinecap="round"
              className="gm-flow motion-reduce:[animation:none] motion-reduce:hidden"
              style={{ animationDelay: `${index * -0.75}s` }}
            />
            <circle cx={dotX} cy={y} r="3" fill={ACCENT} />
            <text
              x={dotX - 14}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="16"
              fill="var(--ink-muted, #d1cfcf)"
            >
              {source}
            </text>
          </g>
        );
      })}

      {/*
        THE NODE, as a node. It was loose text at the end of the strands,
        which is why the right half read as a caption rather than as the thing
        everything else points at.
      */}
      <rect
        x={hub.x}
        y={hub.y - hub.h / 2}
        width={hub.w}
        height={hub.h}
        rx="18"
        fill="var(--surface-raised, #18181a)"
        stroke={ACCENT}
        strokeOpacity="0.4"
      />
      <text
        x={hub.x + hub.w / 2}
        y={hub.y - 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="27"
        fontWeight="500"
        fill="var(--ink-strong, #ffffff)"
      >
        Genesis AI
      </text>
      <rect
        x={hub.x + hub.w / 2 - 46}
        y={hub.y + 8}
        width="92"
        height="2"
        rx="1"
        fill={ACCENT}
        opacity="0.7"
      />
      <text
        x={hub.x + hub.w / 2}
        y={hub.y + 27}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        letterSpacing="0.22em"
        fill="var(--ink-faint, #85848a)"
      >
        AUTOMATED
      </text>
    </svg>
  );
}
