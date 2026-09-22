import type { CSSProperties } from "react";

import { softRadial } from "@/lib/soft-gradient";

/**
 * ONE ATMOSPHERE FOR THE WHOLE PAGE, instead of one per section.
 *
 * THE BUG THIS EXISTS TO KILL. Every section painted its own ground and its
 * own wash into a box with `overflow: hidden`. The washes are radial
 * gradients whose hot spots sit near the section's own edges — 6%, 16%, 88%,
 * 92% down the box — so at the section boundary the gradient was still
 * bright, and the clip cut it off mid-value. The next section started its
 * own wash from nothing. The result is a hard horizontal line across the
 * page at every join: the "cut". Measured before this change, the page had
 * eight of them, the worst a 17-point jump in luminance over a single pixel
 * row. No amount of tuning the per-section gradients fixes that, because the
 * edge is drawn by the CLIP, not by the colour.
 *
 * THE FIX IS STRUCTURAL. The light now belongs to the page, not to the
 * section. One element spans the entire document and carries the whole
 * field; sections are transparent and let it through. A single gradient
 * cannot draw an edge inside itself, so there is nothing left to cut.
 *
 * IT IS ALSO THE BETTER DESIGN. Because the sources are placed against the
 * whole document rather than against each box, the light drifts as you
 * scroll — neutral over the Brain, the accent warming through Influence and
 * Studios, neutral again through the library, and the accent into the close.
 * The page reads as one continuous scene that changes temperature, which is
 * what the sectioned version was trying and failing to say.
 *
 * ANYTHING STILL PAINTING A FULL-BLEED WASH INSIDE A SECTION — the two
 * chapters that pin themselves dark, and so hide this field behind their own
 * ground — must carry `.seamless`, which masks it to zero at its own edges.
 */

/**
 * The field, as sources rather than as a string.
 *
 * `y` is a percentage of the WHOLE DOCUMENT, so each entry is anchored to a
 * chapter of the page rather than to a box. The radii are absolute so a short
 * page (a division page, /team) gets blobs of the same physical size as the
 * homepage rather than the same fraction of a much smaller box — at 6% of
 * 2,000px a source would be a hard little spot.
 */
type Source = {
  /** rgb triplet, space separated. */
  color: string;
  x: string;
  y: string;
  /** Horizontal and vertical radius. */
  rx: string;
  ry: string;
  alpha: number;
};

/**
 * THE DARK THEME'S FIELD — grey and yellow, and nothing else.
 */
const NEUTRAL: Source[] = [
  /*
    GREY AND YELLOW, AND THAT IS THE WHOLE PALETTE.

    These eighteen sources used to run violet, blue, orange, pink and lilac
    down the page — a drift in TEMPERATURE, which was the point, but built
    from five hues the brand does not have.

    THE FIRST NEUTRAL PASS WENT TOO FAR THE OTHER WAY. Every source came down
    to white or grey at six to twelve percent, and Genesis's report was that
    the dark theme had no gradients worth the name. They were right: a field
    of near-white blooms at 6% over a charcoal wall is not a light field, it
    is a faint haze, and it left the whole page reading as one flat tone.

    So the accent does the work now. #ffc516 is the only hue in the palette
    and it is a LIGHT source as much as a colour — the sources that carry it
    run at sixteen to twenty percent, roughly double what they were, and the
    neutral ones stay quiet so the warm passages have something to be warm
    against. The drift survives: neutral over the Brain, the accent through
    Influence and Studios, neutral again for the library, the accent into the
    close.

    TWENTY PERCENT IS THE CEILING, and it is a legibility number rather than a
    taste one. #ffc516 at 0.20 over the ground's #1a1a1d resolves to about
    #48401f — 9.8:1 against white body copy and 5.4:1 against --ink-muted.
    Past that the muted text on the warmest stretches starts to fail.
  */
  // The Brain — neutral, so the charcoal chapter behind it stays charcoal.
  { color: "255 255 255", x: "14%", y: "2%", rx: "44rem", ry: "30rem", alpha: 0.07 },
  { color: "209 207 207", x: "88%", y: "7%", rx: "40rem", ry: "28rem", alpha: 0.12 },
  // Work, then the client wall — grey, then the accent arrives.
  { color: "209 207 207", x: "18%", y: "13%", rx: "42rem", ry: "28rem", alpha: 0.1 },
  { color: "255 197 22", x: "82%", y: "18%", rx: "44rem", ry: "30rem", alpha: 0.16 },
  // Influence — the accent, warming.
  { color: "255 197 22", x: "10%", y: "24%", rx: "44rem", ry: "30rem", alpha: 0.18 },
  { color: "255 255 255", x: "78%", y: "29%", rx: "40rem", ry: "28rem", alpha: 0.06 },
  // Studios — the warmest stretch of the page.
  { color: "255 197 22", x: "16%", y: "35%", rx: "46rem", ry: "30rem", alpha: 0.2 },
  { color: "224 173 19", x: "86%", y: "41%", rx: "40rem", ry: "28rem", alpha: 0.17 },
  // The library — cools off so the posters carry the colour.
  { color: "209 207 207", x: "12%", y: "47%", rx: "42rem", ry: "30rem", alpha: 0.11 },
  // AI Lab — the accent again, because the automation diagrams are drawn in it.
  { color: "255 197 22", x: "84%", y: "53%", rx: "42rem", ry: "28rem", alpha: 0.16 },
  { color: "209 207 207", x: "14%", y: "58%", rx: "42rem", ry: "28rem", alpha: 0.1 },
  // Brand & Design.
  { color: "255 255 255", x: "82%", y: "64%", rx: "44rem", ry: "30rem", alpha: 0.07 },
  // Who we are, then the journey.
  { color: "209 207 207", x: "16%", y: "70%", rx: "42rem", ry: "28rem", alpha: 0.1 },
  { color: "255 197 22", x: "84%", y: "76%", rx: "42rem", ry: "30rem", alpha: 0.16 },
  { color: "209 207 207", x: "12%", y: "81%", rx: "40rem", ry: "26rem", alpha: 0.1 },
  // Case studies and testimonials, closing on the accent.
  { color: "255 197 22", x: "80%", y: "87%", rx: "44rem", ry: "30rem", alpha: 0.18 },
  { color: "255 255 255", x: "18%", y: "92%", rx: "42rem", ry: "28rem", alpha: 0.06 },
  { color: "255 197 22", x: "72%", y: "98%", rx: "46rem", ry: "32rem", alpha: 0.2 },
];

/**
 * THE LIGHT THEME'S FIELD — the original, and it is back at Genesis's request.
 *
 * The neutral pass above was applied to both themes, on the reading that the
 * brand's four primaries are grey, yellow, white and black. On the dark theme
 * that was right and Genesis kept it. On the LIGHT theme it took a page that
 * drifted through warm and cool tints over its full height and flattened it
 * to grey on white — Genesis's word for the old one was that it was fine, so
 * it is restored rather than argued about.
 *
 * The two are not a hue swap of one list; they are two different lists, which
 * is the point. A tint that reads as "a warm room" at 14% on black reads as
 * "a stain" at 14% on paper, and the alphas here are the ones that were
 * measured against paper.
 */
const COLOUR: Source[] = [
  /*
    THE LIGHT THEME'S FIELD IS THE PALETTE NOW TOO.

    It kept the original violet-through-pink drift for a while, on Genesis's
    word that the light theme was right as it stood. They have since asked for
    it rebuilt on #f9f9f9 with "thoda sa yellow", so the hues are gone from
    here as well and the drift runs in VALUE and warmth: the palette's grey
    for the cool passages, the accent for the warm ones.

    THE ALPHAS ARE NOT THE DARK LIST'S. --spectrum halves everything on light
    already, and a tint reads about twice as strongly on paper as on black, so
    the greys run high (they are barely-there shading) and the accent stays
    low enough to be felt rather than seen. The guidelines are explicit that
    yellow is never the background.
  */
  { color: "209 207 207", x: "14%", y: "2%", rx: "44rem", ry: "30rem", alpha: 0.55 },
  { color: "255 197 22", x: "88%", y: "7%", rx: "40rem", ry: "28rem", alpha: 0.1 },
  { color: "209 207 207", x: "18%", y: "13%", rx: "42rem", ry: "28rem", alpha: 0.45 },
  { color: "255 197 22", x: "82%", y: "18%", rx: "44rem", ry: "30rem", alpha: 0.14 },
  { color: "255 197 22", x: "10%", y: "24%", rx: "44rem", ry: "30rem", alpha: 0.16 },
  { color: "209 207 207", x: "78%", y: "29%", rx: "40rem", ry: "28rem", alpha: 0.4 },
  { color: "255 197 22", x: "16%", y: "35%", rx: "46rem", ry: "30rem", alpha: 0.18 },
  { color: "224 173 19", x: "86%", y: "41%", rx: "40rem", ry: "28rem", alpha: 0.12 },
  { color: "209 207 207", x: "12%", y: "47%", rx: "42rem", ry: "30rem", alpha: 0.5 },
  { color: "255 197 22", x: "84%", y: "53%", rx: "42rem", ry: "28rem", alpha: 0.13 },
  { color: "209 207 207", x: "14%", y: "58%", rx: "42rem", ry: "28rem", alpha: 0.45 },
  { color: "255 197 22", x: "82%", y: "64%", rx: "44rem", ry: "30rem", alpha: 0.12 },
  { color: "209 207 207", x: "16%", y: "70%", rx: "42rem", ry: "28rem", alpha: 0.45 },
  { color: "255 197 22", x: "84%", y: "76%", rx: "42rem", ry: "30rem", alpha: 0.14 },
  { color: "209 207 207", x: "12%", y: "81%", rx: "40rem", ry: "26rem", alpha: 0.45 },
  { color: "255 197 22", x: "80%", y: "87%", rx: "44rem", ry: "30rem", alpha: 0.16 },
  { color: "209 207 207", x: "18%", y: "92%", rx: "42rem", ry: "28rem", alpha: 0.4 },
  { color: "255 197 22", x: "72%", y: "98%", rx: "46rem", ry: "32rem", alpha: 0.18 },
];

/**
 * `--spectrum` is 1 on dark and 0.5 on light: the same alpha of colour reads
 * about twice as strongly on paper as it does on black. It is declared with
 * the rest of the theme tokens, so this stays one string for both themes.
 */
function field(sources: Source[]) {
  return sources
    .map((s) =>
      /*
        SOFT STOPS. This ran to 100% already, so the wash reached zero at the
        ellipse's own edge — and still showed a circle, because a LINEAR fade
        changes at a constant rate right up to that edge and then stops. It is
        the slope that has to arrive at zero, not just the value. See
        lib/soft-gradient.
      */
      softRadial(
        `${s.rx} ${s.ry} at ${s.x} ${s.y}`,
        s.color,
        s.alpha,
        "var(--spectrum, 1)",
      ),
    )
    .join(", ");
}

/*
  BOTH FIELDS ARE HANDED TO CSS AND CSS PICKS, which is the only way this can
  work at all. The theme is decided in the browser — an attribute on <html>,
  or the OS preference — and this component renders on the server, so it
  cannot know which list to emit. It emits both as custom properties and
  globals.css points --page-field at the right one; see the light theme
  blocks there. The unused string costs a few hundred bytes of style
  attribute and no work, because a custom property that nothing references is
  never parsed as a background.
*/
const FIELD_NEUTRAL = field(NEUTRAL);
const FIELD_COLOUR = field(COLOUR);

export function PageAtmosphere({ children }: { children: React.ReactNode }) {
  return (
    /*
      NO `overflow: hidden` HERE. The field is inset-0 and cannot escape, and
      clipping the page wrapper would break every `position: sticky` inside
      it — the work rail and the journey both use one.
    */
    <div
      className="relative isolate min-h-dvh"
      /*
        THE GROUND IS A GRADIENT, not a flat fill with light thrown at it.
        This was `bg-void` — #111111 — with the eighteen sources below floated
        over it, and at ten to twenty percent alpha eighteen soft blobs on a
        black wall still read as a black wall. --page-ground is that wall
        redrawn as the drift itself; see globals.css, where both themes'
        versions live and where the contrast figures are recorded.

        Painted on this element rather than on <body> so it spans the whole
        document — the wrapper is min-h-dvh but grows to the page's real
        height, so the gradient's stops stretch across every section rather
        than repeating per screen. body keeps the flat token underneath it,
        which is what shows through on overscroll and is correct there.
      */
      style={{ background: "var(--page-ground)" }}
    >
      <div
        aria-hidden
        className="page-field pointer-events-none absolute inset-0 -z-10"
        /*
          THE PROPERTIES ONLY — the `background` that reads them is in
          globals.css, and that split is load-bearing twice over.

          An inline `background` would WIN over the stylesheet, so the light
          theme could never override it; inline styles beat class rules.

          And the switch cannot be a variable set at :root either, which was
          the first attempt: `--page-field: var(--field-colour)` declared on
          :root is computed there, where --field-colour does not exist, so it
          resolves to the guaranteed-invalid value and inherits down as
          nothing. The custom properties live here because they are enormous
          strings; the rule that chooses between them has to live somewhere it
          can see them, which is a selector matching THIS element.
        */
        style={
          {
            "--field-neutral": FIELD_NEUTRAL,
            "--field-colour": FIELD_COLOUR,
          } as CSSProperties
        }
      />
      {/*
        GRAIN IS PAGE-WIDE TOO, and for a sharper reason than the field.
        `.grain::after` blends `overlay`, which needs a backdrop — and each
        section is `isolate`, so the noise could only ever see that section's
        own box. Once the sections went transparent it was blending against
        nothing, and each section's grain lifted it by a different amount
        from its neighbour's: measured, that alone was a step of up to 8
        luminance points at six of the boundaries, larger than anything left
        in the gradients. One layer, one backdrop, no edges.
      */}
      <div aria-hidden className="grain pointer-events-none absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
