/*
 * NOVA'S LETTERS (Genesis, 31 Oct 2026, from a reference: "N Ø V Λ … in this
 * font, white, just the orb in the gradient"). Thin, even strokes on a
 * 100-unit cap height: N, V and a crossbarless Λ for the A. Drawn rather than
 * set, as no font Genesis owns has that A. Each stroke runs past the cap and
 * baseline and is clipped flush, which gives the joins their sharp, flat
 * points. scripts/nova-lockup.mjs draws the same lines for the logo files.
 */
export const NOVA_STROKE = 7;
export const NOVA_GLYPHS = {
  N: { width: 82, lines: [[4, 0, 4, 100], [4, 0, 78, 100], [78, 0, 78, 100]] },
  V: { width: 96, lines: [[5, 0, 48, 100], [91, 0, 48, 100]] },
  A: { width: 96, lines: [[5, 100, 48, 0], [91, 100, 48, 0]] },
} as const;

/* A line stretched 20 units past each end, so the clip, not the line, ends it. */
function long([x1, y1, x2, y2]: readonly number[]) {
  const dx = x2 - x1, dy = y2 - y1, k = 20 / Math.hypot(dx, dy);
  return [x1 - dx * k, y1 - dy * k, x2 + dx * k, y2 + dy * k];
}

/** One letter, in currentColor, `height` tall at its cap. */
export function NovaGlyph({ letter, className }: { letter: keyof typeof NOVA_GLYPHS; className?: string }) {
  const g = NOVA_GLYPHS[letter];
  const id = `nova-clip-${letter}`;
  return (
    <svg aria-hidden viewBox={`0 0 ${g.width} 100`} className={className} style={{ aspectRatio: `${g.width} / 100` }}>
      <clipPath id={id}>
        <rect width={g.width} height="100" />
      </clipPath>
      <g clipPath={`url(#${id})`} stroke="currentColor" strokeWidth={NOVA_STROKE} strokeLinecap="butt">
        {g.lines.map((l, i) => {
          const [x1, y1, x2, y2] = long(l);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
    </svg>
  );
}
