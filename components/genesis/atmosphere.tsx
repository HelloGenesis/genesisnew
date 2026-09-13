import { cn } from "@/lib/utils";

/**
 * Background atmosphere primitives.
 *
 * Every reference image shares the same three-layer recipe: a near-black
 * ground, one soft directional glow, and a grain pass over the top. These are
 * the reusable pieces — no section should hand-roll its own gradient.
 */

type AuroraProps = {
  /** Where the light comes from. The references favour top and top-right. */
  origin?: "top" | "top-right" | "top-left" | "center" | "bottom";
  /** Which accent lights the scene. */
  tone?: "brand" | "neutral";
  /** 0–1. The references sit low; heavy glow reads as cheap. */
  intensity?: number;
  className?: string;
};

const ORIGIN_POSITION: Record<NonNullable<AuroraProps["origin"]>, string> = {
  top: "50% 0%",
  "top-right": "80% 5%",
  "top-left": "20% 5%",
  center: "50% 50%",
  bottom: "50% 100%",
};

const TONE_COLOR: Record<NonNullable<AuroraProps["tone"]>, string> = {
  brand: "255 197 22",
  neutral: "209 207 207",
};

/**
 * The ambient spectrum — grey and yellow on dark, the original four on light.
 *
 * IT WAS A FOUR-HUE FIELD: violet #7a3cff, blue #3b5bff, pink #ff8fb8 and the
 * yellow, on the reasoning that the deck's vector art carries more than the
 * accent. Genesis has since fixed the primaries — grey, yellow, white, black —
 * and three of those four sources were painting a palette the brand does not
 * have. On the homepage they were most of the reason the page read violet.
 *
 * On DARK what is left is the accent and the grey ramp: one warm source,
 * three neutral. On LIGHT the original four are kept — Genesis's report was
 * that the light theme was right as it stood. Both are placed at different
 * corners so no two sections light the same way, and both are scaled by
 * --spectrum, which is 1 on dark and 0.5 on light because the same alpha
 * reads about twice as strongly on paper as on black.
 *
 * Deliberately a TINT. The guidelines set the ratio at 70% white/black, 20%
 * grey, 10% yellow and say plainly that yellow is never the background — so
 * these sit where the light is felt rather than seen. The measured lift on
 * the section ground is under two points of luminance.
 */
const SPECTRUM_NEUTRAL = [
  { color: "255 197 22", at: "14% 6%", size: "52% 46%", alpha: 0.06 },
  { color: "243 154 60", at: "88% 16%", size: "46% 42%", alpha: 0.1 },
  { color: "255 197 22", at: "78% 88%", size: "54% 48%", alpha: 0.05 },
  /* The accent carries this wash, at the same strength the page-wide field
     now uses. At 0.09 it was a rumour; see the note in page-atmosphere. */
  { color: "208 106 138", at: "18% 92%", size: "48% 42%", alpha: 0.17 },
];

/**
 * The light theme's wash is now the palette too: the grey and the accent,
 * where it used to be violet, blue and pink. Genesis asked for the light
 * theme to be built on #f9f9f9 with a little yellow in it. See
 * page-atmosphere.tsx for why both lists have to be emitted and let CSS
 * choose between them.
 */
const SPECTRUM_COLOUR = [
  { color: "255 197 22", at: "14% 6%", size: "52% 46%", alpha: 0.25 },
  { color: "243 154 60", at: "88% 16%", size: "46% 42%", alpha: 0.13 },
  { color: "255 197 22", at: "78% 88%", size: "54% 48%", alpha: 0.2 },
  { color: "208 106 138", at: "18% 92%", size: "48% 42%", alpha: 0.15 },
];

/** Every source stacked into one background-image. */
function spectrumWash(sources: typeof SPECTRUM_NEUTRAL) {
  return sources
    .map(
      (s) =>
        `radial-gradient(${s.size} at ${s.at}, rgb(${s.color} / calc(${s.alpha} * var(--spectrum, 1))) 0%, transparent 70%)`,
    )
    .join(", ");
}

const WASH_NEUTRAL = spectrumWash(SPECTRUM_NEUTRAL);
const WASH_COLOUR = spectrumWash(SPECTRUM_COLOUR);

/** A single soft directional light source — the "aurora" wash. */
export function Aurora({
  origin = "top",
  tone = "brand",
  intensity = 0.22,
  className,
}: AuroraProps) {
  const color = TONE_COLOR[tone];
  const position = ORIGIN_POSITION[origin];

  return (
    <div
      aria-hidden
      /*
        `.seamless` is not decoration. An Aurora with origin="top" puts its
        brightest point ON the section's top edge, which is precisely where
        the clip happens — so unmasked it guarantees the very line it is
        supposed to be atmosphere for. Masked, the light ramps in.
      */
      className={cn("seamless pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        background: `radial-gradient(60% 50% at ${position}, rgb(${color} / ${intensity}) 0%, rgb(${color} / ${intensity * 0.35}) 35%, transparent 70%)`,
      }}
    />
  );
}

/** The ambient wash on its own, for sections that build their own ground. */
export function Spectrum({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "section-wash seamless pointer-events-none absolute inset-0",
        className,
      )}
      /*
        The properties only; the `background` that reads them is in
        globals.css, keyed off the theme. See the note in page-atmosphere.tsx
        — an inline background would outrank the light theme's override, and
        a switch declared at :root cannot see variables defined here.
      */
      style={
        {
          "--wash-neutral": WASH_NEUTRAL,
          "--wash-colour": WASH_COLOUR,
        } as React.CSSProperties
      }
    />
  );
}

/**
 * Film grain. Applied as a sibling overlay rather than on the section itself
 * so it composites above content without needing a stacking-context hack.
 */
export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("grain pointer-events-none absolute inset-0", className)}
    />
  );
}

/**
 * The standard Genesis section shell: dark ground + one light source + grain.
 * Sections compose this instead of repeating the recipe.
 */
export function Atmosphere({
  children,
  origin,
  tone,
  intensity,
  className,
  style,
}: AuroraProps & {
  children: React.ReactNode;
  /**
   * A ground of this section's own.
   *
   * Normally there is none — see the note below, the field is one
   * document-wide layer. A page whose whole height fits in a screen or two is
   * the exception: PageAtmosphere's ramp is written to unroll over many, and
   * compressed it resolves into its own middle. /careers passes
   * --page-ground-compact for exactly that reason.
   */
  style?: React.CSSProperties;
}) {
  return (
    /*
      NO GROUND AND NO SPECTRUM OF ITS OWN, and both removals are the same
      fix. This used to paint bg-void and stack the four spectrum sources
      into its own box — a box with `overflow: hidden`, whose edge therefore
      sliced the wash and drew a line at every section join. The field is now
      one document-wide layer in PageAtmosphere, and this is transparent so
      it shows through. What is left here is the section's own directional
      key light, masked so it cannot reach the boundary either.
    */
    <div className={cn("relative isolate overflow-hidden", className)} style={style}>
      <Aurora origin={origin} tone={tone} intensity={intensity} />
      {/* No <Grain /> here. It blends `overlay`, this box is `isolate`, and
          a section with no ground of its own gives it nothing to blend with
          — which measured as a hard step at every boundary. PageAtmosphere
          runs one grain layer across the whole document instead. */}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
