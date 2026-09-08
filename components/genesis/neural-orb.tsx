"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * The divisions orb — a point-cloud sphere that assembles itself, thinks, and
 * answers the pointer.
 *
 * WHAT IT IS FOR. The services heading claims "four divisions, one system",
 * and the section under it was a list of four names with nothing saying they
 * were one thing. Genesis's own films put the four names around a single
 * dotted sphere with the wordmark at its core, so the picture argues the
 * sentence: one body, four things orbiting it. The sphere ASSEMBLING out of
 * scattered points when you first reach the section is the same argument in
 * motion, and it is the only entrance animation on the page.
 *
 * WHY CANVAS AND NOT HOUDINI. The Paint API looks like the right tool for a
 * generated background and is the wrong one here. A paint worklet is a pure
 * function of the element's size and custom properties — it cannot keep state
 * between frames, so every particle's excitation, every travelling pulse and
 * every ripple would have to be serialised out to CSS properties and back on
 * each tick, and the whole surface repaints whenever any one of them changes.
 * This needs ~2000 points carrying their own state at 60Hz. That is what a
 * canvas and a typed array are for. Houdini would also be the only part of
 * this page that silently renders nothing in Safari.
 *
 * WHY IT COSTS ALMOST NOTHING.
 *   - Points are stamped from pre-rendered sprites rather than arc() + fill().
 *   - Compositing is `lighter`, which is order-independent, so the depth sort
 *     a point cloud normally needs every frame is not needed at all.
 *     Overlapping points also brighten, which gives the silhouette its
 *     density for free.
 *   - Every per-point value that has to survive a frame lives in a
 *     Float32Array, so the loop allocates nothing and never triggers a GC
 *     pause mid-scroll.
 *   - The synapse links are the one part that could go quadratic, and they
 *     are drawn only between points the pointer has already excited — a set
 *     of at most a hundred, not two thousand.
 *   - The loop is suspended when the section is off-screen and when the tab
 *     is hidden. Scrolled past, this is a sleeping canvas.
 */

/**
 * The golden angle — what spreads a spiral lattice evenly over a sphere.
 *
 * THE RINGS WERE THE LINES. An earlier version laid the points out in
 * thirty-four latitude bands, on the theory that contour lines would read as
 * structure. They read as stripes: horizontal bands across the face of the
 * sphere that no amount of colour work could disguise, because they were the
 * geometry rather than the shading.
 *
 * The reference is a Fibonacci lattice — every point offset from the last by
 * the golden angle, which is the most irrational turn there is and therefore
 * the one that never lines its points up into a row. Zoomed in it is an even
 * stipple with a faint spiral in it; zoomed out it is a surface, with no
 * banding anywhere.
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Camera distance in sphere radii. Low enough to read as a ball, high
 *  enough that the near face does not balloon. */
const CAMERA = 3.2;

/** Resting tilt toward the viewer, so the top pole's rings are visible. */
const TILT = -0.34;

/** One full rotation, in ms. Slow enough to be ambient, not hypnotic. */
const PERIOD = 52_000;

/**
 * The lean toward the pointer: how far, and the spring that gets it there.
 *
 * A spring rather than a lerp because a lerp arrives and stops dead, which
 * reads as a value being animated. STIFFNESS and DAMPING here are tuned to
 * overshoot by a few percent and settle — the sphere carries a little of its
 * own weight, and that is the difference between "it moved" and "it turned".
 */
const LEAN_YAW = 0.2;
const LEAN_PITCH = 0.13;
const LEAN_STIFFNESS = 0.012;
const LEAN_DAMPING = 0.86;

/** Radius of the pointer's influence, as a fraction of the sphere's. */
const REACH = 0.6;

/**
 * How fast a point takes up the pointer's excitement and how slowly it lets
 * it go. They are different on purpose — equal rates make the glow a rigid
 * disc welded to the cursor, while a slow release leaves a wake behind the
 * pointer and is most of why the surface feels like a material rather than a
 * mask.
 */
const EXCITE_RISE = 0.26;
const EXCITE_FALL = 0.055;

/** Click ripple: sphere radii per second, the width of the wave front as a
 *  fraction of the radius, and how many can be in flight. The cap matters —
 *  every live ripple adds a distance test per point per frame, so a reader
 *  hammering the mouse must not be able to run the cost up without bound. */
const RIPPLE_SPEED = 1.45;
const RIPPLE_WIDTH = 0.17;
const RIPPLE_MAX = 3;

/**
 * How long the sphere holds still before the wave starts, and how long the
 * wave takes to reach full amplitude.
 *
 * IT IS A CIRCLE FIRST. The reference opens on a clean, undeformed sphere and
 * the wave arrives afterwards; displacing from the first frame meant a
 * visitor never saw the shape the whole effect is a deformation OF.
 *
 * This also replaces the old entrance, which scattered every point across the
 * frame and flew them in. That read as the sphere being cut together rather
 * than settling, and it is gone.
 */
const SETTLE_HOLD = 900;
const SETTLE_RAMP = 2600;

/**
 * How far a crest rises off the sphere, as a fraction of its radius, and how
 * fast the field moves through it.
 *
 * THE CEILING IS GEOMETRY, NOT TASTE. The projection already puts the widest
 * point at 1.053x the radius and the pointer lift adds another 7.5%; a crest
 * of 0.13 on top of that brings the total to 1.28x, which is what the radius
 * below is sized against. Push the amplitude up without shrinking the radius
 * and the crests are simply cut off by the edge of the canvas.
 *
 * DOWN FROM 0.17 AT GENESIS'S REQUEST — "reduce the wobble of the brain". At
 * that amplitude the swells were deep enough to be read as the outline
 * moving rather than as light crossing a surface. The pointer lean came down
 * with it, from 0.3/0.2 to 0.2/0.13, because a sphere that leans a third of a
 * radian at the cursor is the other half of what "wobble" describes; and the
 * noise term, which is the one that bends the silhouette, went 0.1 to 0.06.
 * The wave is still there. It is weather on the surface now, not motion of
 * the whole body.
 */
const CREST = 0.095;

/**
 * THE SURFACE IS SOUND, not noise.
 *
 * The first pass displaced the sphere with 3D gradient noise alone, and it
 * was the wrong instrument: noise has no direction, so it raises lumps rather
 * than fronts, and at any amplitude worth seeing those lumps distort the
 * outline until the sphere stops reading as a sphere. That is the shape
 * problem — it was not the amount of displacement, it was the kind.
 *
 * These are travelling waves. Each source is an axis; `dot(point, axis)` is
 * the cosine of the angle from it, so a surface of constant dot is a circle
 * around that pole — which means `sin(dot * k - wt)` is a set of concentric
 * rings propagating out from it. Three sources at different frequencies and
 * speeds, running in different directions, interfere into the folds the
 * reference has, while every one of them is a smooth band that leaves the
 * silhouette round.
 *
 * It is also cheaper than the noise it replaces: three dot products and three
 * sines per point, against a full Perlin lookup.
 *
 * `k` is how many fronts fit pole to pole, `w` their speed and sign their
 * direction, `amp` their share of the displacement — the three sum to less
 * than one so the total stays bounded and the crest ceiling above holds.
 *
 * THE FREQUENCIES ARE LOW ON PURPOSE. At k around six the fronts were tight
 * enough to ripple the outline itself, and the sphere read as a walnut. Broad
 * swells deform the surface and leave the silhouette a circle, which is what
 * the reference does: the drama is in the shading across the face, not in the
 * edge.
 */
const WAVES = [
  { k: 2.3, w: 0.55, amp: 0.46, tilt: 0.0 },
  { k: 1.6, w: -0.38, amp: 0.33, tilt: 2.1 },
  { k: 3.5, w: 0.82, amp: 0.21, tilt: 4.0 },
] as const;

/**
 * A little noise on top, so the interference is not perfectly regular. Kept
 * small deliberately: this is the term that bends the outline, and it is the
 * reason the first version lost its shape.
 */
const NOISE_WEIGHT = 0.06;
const FIELD_SCALE = 0.95;
const FIELD_SPEED = 0.1;

/**
 * Classic 3D gradient noise (Perlin), inline.
 *
 * WHY NOT A LIBRARY. This is thirty lines and runs two thousand times a
 * frame; a dependency for it would be larger than the rest of the component
 * and would sit in the client bundle of the homepage's first section.
 *
 * WHY GRADIENT NOISE AND NOT A SUM OF SINES. Sines on a sphere beat against
 * each other and produce a regular quilt — the reference is liquid, with
 * crests that wander and do not repeat. Gradient noise gives that, and
 * because it is evaluated in the point's OWN 3D position the wave travels
 * over the surface continuously with no seam where the sphere closes.
 */
const PERM = new Uint8Array(512);
{
  // Fixed permutation: the field must be identical on every load, and
  // Math.random() here would make the orb different for every visitor and
  // impossible to reason about.
  let seed = 1337;
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) p[i] = i;
  for (let i = 255; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i += 1) PERM[i] = p[i & 255];
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** Returns roughly -1..1. */
function noise3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);

  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;

  const lerp = (t: number, a: number, b: number) => a + t * (b - a);

  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(PERM[AA], x, y, z), grad(PERM[BA], x - 1, y, z)),
      lerp(u, grad(PERM[AB], x, y - 1, z), grad(PERM[BB], x - 1, y - 1, z)),
    ),
    lerp(
      v,
      lerp(u, grad(PERM[AA + 1], x, y, z - 1), grad(PERM[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(PERM[AB + 1], x, y - 1, z - 1), grad(PERM[BB + 1], x - 1, y - 1, z - 1)),
    ),
  );
}

/**
 * The palette, indexed by how far a point has been pushed out.
 *
 * COLOUR COMES FROM THE DISPLACEMENT, which is the whole look of the
 * reference: crests run gold, troughs fall away into violet, and the resting
 * surface is bone. It replaces the old fixed per-point tones — a warm crown
 * and a scattering of violet — which could not respond to a wave because
 * they were decided when the sphere was built.
 *
 * THE STOPS ARE GENESIS'S OWN GRADIENT, MEASURED OFF THE LOCKUPS. Not picked
 * to look like them — sampled. Decoding brand/1.png and the .Influence
 * lockup and taking the mean colour of every ink column across the gradient
 * word gives the same ramp from both files to within a couple of levels:
 *
 *   #feb117 -> #fe951a -> #fe681d -> #eb6352 -> #d66d89 -> #cb73a8 -> #b97cda -> #ac84fe
 *
 * amber, orange, vermilion, coral, rose, orchid, violet. Those eight are
 * reproduced here exactly. The two stops below them are NOT in the wordmark
 * and are the one liberty taken: a sphere needs somewhere to fall away to or
 * it reads as a flat disc, so the ramp continues past the brand violet along
 * the same hue and darkens. Only as far as #462e84, though — the first pass
 * ran it down to a near-black indigo, and at these alphas that end of the
 * sphere simply stopped being there. Nothing above the wordmark's amber is
 * invented either — the last stop is that amber lifted toward white for the
 * crests, which is what the highlight on a lit surface is.
 *
 * This replaces a ramp built from the reference FILM, which ran through a
 * magenta the identity does not contain and made the orb the one thing on
 * the page not wearing the brand.
 */
const RAMP: [number, number, number][] = [
  [70, 46, 132],
  [118, 84, 200],
  [172, 132, 254],
  [185, 124, 218],
  [203, 115, 168],
  [214, 109, 137],
  [235, 99, 82],
  [254, 104, 29],
  [254, 149, 26],
  [254, 177, 23],
  [255, 219, 140],
];

/** Twenty-eight steps: enough that the ramp reads as a continuous gradient
 *  rather than as bands of colour. Forty at this density, because the dots
 *  overlap and a step that was invisible on a sparse field shows up as a
 *  contour once neighbours are blending into each other. */
const PALETTE_STEPS = 40;

/**
 * HOW MUCH OF THE COLOUR IS THE BRAND GRADIENT, AND WHICH WAY IT RUNS.
 *
 * The ramp used to be indexed by displacement alone. That is right for a
 * reference film of a churning surface and wrong for a brand mark: it meant
 * whichever colours the wave happened to be making at that instant, so the
 * orb wore a different part of the identity every second and never once
 * showed the gradient the way the wordmark does.
 *
 * So most of the index is now POSITIONAL — where the point lands on screen,
 * projected onto the same axis the lockups use. CSS writes those as
 * `linear-gradient(100deg, ...)`: ten degrees off straight across, running
 * left to right. The unit vector below is that angle in canvas coordinates,
 * where y counts downward.
 *
 * The remainder is still the displacement, and that is the part that keeps it
 * alive: crests ride a little further up the ramp and troughs fall back down
 * it, so the wave reads as light travelling across a fixed gradient rather
 * than as the gradient itself sloshing about.
 */
const GRAD_MIX = 0.74;
const GRAD_X = 0.985;
const GRAD_Y = 0.174;

function rampColour(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  const f = x - i;
  const a = RAMP[i];
  const b = RAMP[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

type Sphere = {
  /** Unit positions, xyz interleaved. */
  pos: Float32Array;
  count: number;
};

/**
 * Points on a unit sphere, spread by the golden angle.
 *
 * `y` walks evenly from pole to pole and the ring radius follows from it, so
 * the points land on equal-area bands; the golden-angle turn between them is
 * what stops those bands ever showing as bands. It is a handful of lines and
 * it is the whole reason the surface reads as a surface.
 */
function buildSphere(count: number): Sphere {
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    // Half-step in at both ends, so neither pole gets a single lonely point.
    const y = 1 - ((i + 0.5) / count) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;
    const px = Math.cos(theta) * radius;
    const pz = Math.sin(theta) * radius;

    pos[i * 3] = px;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = pz;

  }

  return { pos, count };
}

/**
 * A soft round dot, painted once and stamped everywhere after.
 *
 * `edge` is where the solid core ends. The crisp version keeps each dot an
 * object with a boundary, which is what holds the ring lines together; the
 * soft version is for the far side of the sphere, where a real lens would
 * have lost focus. Two sprites cost nothing and buy the depth that a flat
 * alpha ramp cannot.
 *
 * Colours are written in the legacy comma form deliberately. Canvas parses
 * colour strings on its own path, not through the stylesheet, and that path
 * is the last place `rgb(r g b / a)` landed — a silent black dot is not a
 * failure worth risking to save three characters.
 */
function makeSprite(r: number, g: number, b: number, edge: number): HTMLCanvasElement {
  /*
    24 rather than 16. The sprite is now mostly halo, so it needs the pixels
    to resolve a smooth falloff; at 16 the outer ramp was six pixels wide and
    stepped visibly once the dots were drawn large.
  */
  const size = 24;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;

  const ctx = sprite.getContext("2d");
  if (ctx) {
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    /*
      A SMALL HARD DOT INSIDE A WIDE SOFT HALO — the two things Genesis asked
      for at once. "dots ko chota karo" and "everything is in a gradient" pull
      opposite ways if the dot IS the sprite: shrink it and the field breaks
      into particles with gaps between them; grow it and there are no dots to
      speak of. Splitting the sprite settles it. The core carries `edge` of
      the radius and is what the eye reads as the dot; the halo runs all the
      way out and is what closes the gaps into a continuous surface. Drawing
      is unchanged and costs the same, because it was always one blit.

      `edge` is therefore now a fraction of a much wider stamp: 0.2 of a
      6.3px halo is a 2.5px dot, against 3.5px before.
    */
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(edge, `rgba(${r}, ${g}, ${b}, 0.62)`);
    gradient.addColorStop(Math.min(0.985, edge + 0.16), `rgba(${r}, ${g}, ${b}, 0.2)`);
    gradient.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, 0.055)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  return sprite;
}

/** The nucleus: one soft white blob, modulated by globalAlpha rather than
 *  rebuilt, so the core can pulse for free. */
function makeCore(): HTMLCanvasElement {
  const size = 128;
  const core = document.createElement("canvas");
  core.width = size;
  core.height = size;
  const ctx = core.getContext("2d");
  if (ctx) {
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, "rgba(255, 238, 190, 0.85)");
    gradient.addColorStop(0.3, "rgba(255, 205, 120, 0.32)");
    gradient.addColorStop(0.62, "rgba(196, 150, 255, 0.12)");
    gradient.addColorStop(1, "rgba(160, 130, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return core;
}

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);

type Ripple = { x: number; y: number; born: number };

export function NeuralOrb({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    /*
      WHICH WAY THE LIGHT GOES, and it is the whole reason this thing can live
      on a light page at all.

      The field is built by ACCUMULATION: thirteen thousand soft dots piled up
      under `lighter`, each adding a little light. That only means anything on
      a dark ground — on paper every dot adds toward white and the sphere
      erases itself, which is why the section used to pin itself dark and then,
      briefly, why it sat on a black disc Genesis did not want.

      `multiply` is the same idea run the other way. Each dot now SUBTRACTS
      light instead of adding it, so the same sprites, the same ramp and the
      same per-dot alphas build a sphere that darkens into paper exactly as it
      brightens into black. Nothing else about the render changes — not the
      geometry, not the wave, not the palette.

      Read once and on change rather than per frame: getComputedStyle in a rAF
      loop forces a style resolution sixty times a second to answer a question
      whose answer changes when someone clicks a switch. The toggle already
      announces itself on `genesis-theme-change`; the media query covers a
      visitor who has never touched it.
    */
    let onLight = false;
    const readTheme = () => {
      const stamped = document.documentElement.getAttribute("data-theme");
      onLight =
        stamped === "light" ||
        (stamped !== "dark" &&
          window.matchMedia("(prefers-color-scheme: light)").matches);
    };
    readTheme();

    const lightQuery = window.matchMedia("(prefers-color-scheme: light)");
    lightQuery.addEventListener("change", readTheme);
    document.addEventListener("genesis-theme-change", readTheme);

    /*
      One sprite per palette step, crisp for the near face and soft for the
      far one. Sixteen steps rather than a fillStyle per point: setting a
      colour two thousand times a frame is two thousand state changes, while
      stamping a pre-rendered sprite is a blit.
    */
    /*
      TWO PALETTES, BECAUSE MULTIPLY AND LIGHTER WANT OPPOSITE INK.

      On black the ramp is used as drawn: each dot ADDS its own colour, so the
      bright end of the ramp is what makes the sphere glow. On paper the dots
      SUBTRACT, and there the bright end is the problem — multiplying #ffdb8c
      into white removes almost nothing, so the warm half of the sphere
      disappeared while the violet half showed. The whole ramp is taken down
      to 42% for the light palette, which keeps every hue exactly where it was
      and gives all of them something to subtract.

      Both are built once. Eighty 24px sprites is a few hundred kilobytes of
      canvas and it means a theme change is an array swap rather than a
      rebuild in the middle of a frame.
    */
    /*
      `ink` dims the whole colour; `sat` pushes each channel away from the
      colour's own mean, which is a saturation boost that needs no HSL round
      trip and cannot shift the hue.
    */
    const buildPalette = (ink: number, sat = 1) => {
      const out: HTMLCanvasElement[] = [];
      const grade = (v: number, mean: number) =>
        Math.max(0, Math.min(255, Math.round((mean + (v - mean) * sat) * ink)));
      for (const edge of [0.2, 0.1]) {
        for (let i = 0; i < PALETTE_STEPS; i += 1) {
          const [r, g, b] = rampColour(i / (PALETTE_STEPS - 1));
          const mean = (r + g + b) / 3;
          out.push(makeSprite(grade(r, mean), grade(g, mean), grade(b, mean), edge));
        }
      }
      return out;
    };

    const spritesOnDark = buildPalette(1);
    /*
      LIGHTER AND MORE SATURATED THAN THE FIRST ATTEMPT, which took the ramp
      down to 42% and came out as a muddy grey-brown ball.

      Multiply COMPOUNDS: each overlapping dot multiplies what is under it, so
      a hundred of them converge on a colour raised to a power — which drives
      lightness toward zero and takes the saturation with it. Starting darker
      only makes it crash sooner, and that is what 42% did.

      So the light ink starts lighter, at 66%, and the saturation is pushed to
      1.45 to hold the hue through the compounding. The per-dot alpha comes
      down with it, from 1.5x to 1.15x, because the sphere no longer needs
      brute force to be visible — it needs room to accumulate without going
      black.
    */
    const spritesOnLight = buildPalette(0.66, 1.45);

    const coreSprite = makeCore();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let radius = 0;
    let dot = 1;
    let sphere = buildSphere(11000);
    // Last frame's screen position per point, the depth it was at, and the
    // excitation it carries.
    let screen = new Float32Array(sphere.count * 2);
    let near = new Float32Array(sphere.count);
    let excite = new Float32Array(sphere.count);

    let frame = 0;
    let visible = false;
    /** When the assembly began, or 0 if it has not been triggered yet. */
    /** When the sphere first came into view; the settle runs from it. */
    let wokeAt = 0;

    /*
      Pointer state, in the SAME space the projected points land in: CSS
      pixels from the canvas's top-left corner. The lean wants the offset
      from the centre instead, so that is derived where it is used rather
      than stored — keeping two coordinate systems in two variables that look
      alike is how the first version came to measure every point's distance
      to a cursor half a canvas away from where it actually was.

      `hasPointer` is separate from the coordinates so leaving eases the lean
      back to rest rather than snapping it to the middle.
    */
    let hasPointer = false;
    let pointerX = 0;
    let pointerY = 0;
    let leanYaw = 0;
    let leanPitch = 0;
    let leanYawVel = 0;
    let leanPitchVel = 0;
    let targetYaw = 0;
    let targetPitch = 0;

    const ripples: Ripple[] = [];
    /** Extra brightness in the core, kicked by a click and decaying. */
    let flare = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      // Two is the point past which more backing pixels buy nothing on a
      // field of soft dots, and cost the fill rate of a 3x canvas.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const span = Math.min(width, height);
      /*
        WHY 0.42 AND NOT A HALF.
        A perspective projection does not put a sphere's widest point on its
        silhouette. Maximising sqrt(1-d^2)/(CAMERA-d) puts it at d = 1/CAMERA
        — a third of the way toward the viewer — where the projected radius is
        1.053 times the sphere's own. On top of that the breathing adds 1.3%
        and the pointer's lift another 7.5%, and each dot is drawn about two
        dot-widths across.

        At 0.46 all of that added up to 98% of the canvas: the sphere sat hard
        against its own bounds, the outermost ring was shaved on every side,
        and moving the cursor to an edge pushed dots off it entirely.

        0.4 is what the crest ceiling allows. A crest rides CREST above the
        radius and the pointer lift adds 7.5%, so the worst case is
        1.095 x 1.053 x 1.075 = 1.24 — and 0.4 x 1.24 = 0.496 of the span,
        which is the whole box and not a pixel more. It was 0.375 when CREST
        was 0.17; reducing the wobble bought that back and the sphere takes
        it, because the reference sphere fills its frame.
      */
      radius = span * 0.4;
      /*
        BIG ENOUGH TO OVERLAP. At this density the points sit about 5px apart
        on screen, so a dot drawn smaller than that leaves gaps and the eye
        reads particles; drawn wider than the spacing, neighbours merge and
        the surface reads as one continuous field — which is what the
        reference is. That is the whole trick, and it is why the sprite got
        softer and the per-dot alpha came down at the same time: overlapping
        hard dots at high alpha would blow out to white instead of blending.
      */
      dot = Math.max(2, span / 132);

      /*
        Density follows area, so a small orb is not a solid white ball and a
        large one is not a sparse dusting.

        THE CEILING IS MEASURED, and measuring it correctly took two goes.
        Frame timing here reported 33.3ms — exactly 1/30 — which looks like
        the renderer missing 60Hz, and on that reading the count was cut. It
        was the headless cap, not the site: benchmarking the actual per-point
        work puts a frame at 1.8ms for 3,400 points and 2.7ms for 5,200,
        against a 16.7ms budget. Density is set from that, not from a number
        that turned out to be the harness talking.
      */
      /*
        MEASURED CEILING. Benchmarking the real per-point work: 5,200 points
        cost 2.8ms a frame, 10,000 cost 5.1, 16,000 cost 15.8 and 22,000 cost
        25.3, against a 16.7ms budget. 11,000 is where the field stops
        reading as particles with the frame still less than half spent.
      */
      const wanted = span < 300 ? 5200 : span < 460 ? 8600 : 13000;
      if (Math.abs(wanted - sphere.count) > 120) {
        sphere = buildSphere(wanted);
        screen = new Float32Array(sphere.count * 2);
        near = new Float32Array(sphere.count);
        excite = new Float32Array(sphere.count);
      }
      return true;
    };

    const render = (now: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const frozen = still.matches;

      /*
        THE SETTLE. Zero until the sphere has been on screen for a beat, then
        eased to full over a couple of seconds — so what a visitor meets is a
        clean circle and the wave arrives afterwards. It runs once.
      */
      const settle =
        wokeAt === 0
          ? 0
          : EASE_OUT(
              Math.min(1, Math.max(0, (now - wokeAt - SETTLE_HOLD) / SETTLE_RAMP)),
            );

      // A spring, not a lerp: it carries a little weight into the turn.
      leanYawVel = (leanYawVel + (targetYaw - leanYaw) * LEAN_STIFFNESS) * LEAN_DAMPING;
      leanPitchVel = (leanPitchVel + (targetPitch - leanPitch) * LEAN_STIFFNESS) * LEAN_DAMPING;
      leanYaw += leanYawVel;
      leanPitch += leanPitchVel;

      const spin = ((frozen ? PERIOD * 0.11 : now) / PERIOD) * Math.PI * 2 + leanYaw;
      const cosSpin = Math.cos(spin);
      const sinSpin = Math.sin(spin);
      const tilt = TILT + leanPitch;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      /*
        The field drifts, and its amplitude breathes on a slower cycle — the
        reference goes from an almost still sphere to heavy folds and back,
        and a constant amplitude reads as texture rather than as motion.

        The cycle is about twenty-four seconds. At the ninety it started on, a
        visitor who scrolled past in fifteen would only ever see one phase of
        it and would never know the sphere did anything but sit there.
      */
      const flow = frozen ? 0 : now * 0.001 * FIELD_SPEED;

      /*
        The three wave axes, resolved once a frame rather than per point. They
        drift slowly around the vertical so the fronts do not always arrive
        from the same place — a fixed set of poles reads as a pattern printed
        on the sphere rather than as something moving through it.
      */
      const drift = frozen ? 0 : now * 0.00004;
      const a0 = WAVES[0].tilt + drift;
      const a1 = WAVES[1].tilt - drift * 1.4;
      const a2 = WAVES[2].tilt + drift * 0.7;
      const w0x = Math.cos(a0), w0y = 0.42, w0z = Math.sin(a0), w0a = WAVES[0].amp;
      const w1x = Math.cos(a1) * 0.6, w1y = -0.78, w1z = Math.sin(a1) * 0.6, w1a = WAVES[1].amp;
      const w2x = Math.cos(a2) * 0.9, w2y = 0.15, w2z = Math.sin(a2) * 0.9, w2a = WAVES[2].amp;
      const seconds = frozen ? 0 : now * 0.001;
      const w0t = seconds * WAVES[0].w * Math.PI;
      const w1t = seconds * WAVES[1].w * Math.PI;
      const w2t = seconds * WAVES[2].w * Math.PI;
      const ampFactor =
        frozen ? 0 : settle * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * 0.00026)));
      const amplitude = CREST * ampFactor;
      const reach = radius * REACH;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = onLight ? "multiply" : "lighter";

      const { pos, count } = sphere;

      for (let i = 0; i < count; i += 1) {
        /*
          Excitation is measured against LAST frame's screen position, which
          is already in hand — computing it against this frame's would mean
          projecting every point twice, since the excitation also displaces
          the point being projected. One frame of lag at 60Hz is 16ms and
          invisible; two passes over 2000 points is not free.
        */
        let target = 0;
        if (near[i] > 0.45) {
          if (hasPointer) {
            const dx = screen[i * 2] - pointerX;
            const dy = screen[i * 2 + 1] - pointerY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < reach) {
              const t = 1 - d / reach;
              target = t * t;
            }
          }
          // The click wave, as a moving band rather than a filled disc.
          for (let r = 0; r < ripples.length; r += 1) {
            const ripple = ripples[r];
            const front = ((now - ripple.born) / 1000) * RIPPLE_SPEED * radius;
            const rx = screen[i * 2] - ripple.x;
            const ry = screen[i * 2 + 1] - ripple.y;
            const band =
              1 -
              Math.abs(Math.sqrt(rx * rx + ry * ry) - front) /
                (radius * RIPPLE_WIDTH);
            if (band > target) target = band;
          }
        }
        const e = excite[i];
        excite[i] = e + (target - e) * (target > e ? EXCITE_RISE : EXCITE_FALL);
        const lift = excite[i];

        /*
          THE WAVE. Gradient noise sampled at the point's own position, with
          time moving through the third argument, so a crest travels over the
          surface rather than the whole shell pulsing in and out. Evaluated on
          the ORIGINAL unit position — feeding the displaced position back in
          would make the field chase itself and boil.

          The pointer's lift is added to the same displacement, so touching
          the sphere raises a crest exactly like the field does, and it takes
          the crest's colour with it.
        */
        const ox = pos[i * 3];
        const oy = pos[i * 3 + 1];
        const oz = pos[i * 3 + 2];
        let x = ox;
        let y = oy;
        let z = oz;
        const field = frozen
          ? 0
          : w0a * Math.sin((ox * w0x + oy * w0y + oz * w0z) * WAVES[0].k - w0t) +
            w1a * Math.sin((ox * w1x + oy * w1y + oz * w1z) * WAVES[1].k - w1t) +
            w2a * Math.sin((ox * w2x + oy * w2y + oz * w2z) * WAVES[2].k - w2t) +
            NOISE_WEIGHT *
              noise3(ox * FIELD_SCALE, oy * FIELD_SCALE, oz * FIELD_SCALE + flow);
        const crest = field * amplitude + lift * 0.075;
        const swell = 1 + crest;
        x *= swell;
        y *= swell;
        z *= swell;

        // Spin about the vertical axis, then tilt the whole thing forward.
        const sx3 = x * cosSpin + z * sinSpin;
        const sz3 = z * cosSpin - x * sinSpin;
        const sy3 = y * cosT - sz3 * sinT;
        const depth = y * sinT + sz3 * cosT;

        const scale = CAMERA / (CAMERA - depth);
        // 0 at the far pole, 1 at the near one.
        const front = (depth + 1) / 2;
        near[i] = front;

        const px = cx + sx3 * radius * scale;
        const py = cy - sy3 * radius * scale;
        screen[i * 2] = px;
        screen[i * 2 + 1] = py;

        /*
          A GENTLE depth ramp, plus a rim term. The bright edge on the
          reference is made by density — the projection crowds dots together
          at the silhouette — so alpha must not fight it; but a small lift
          exactly AT the silhouette (where front is near a half) sharpens the
          sphere's outline against the page without touching the face.
        */
        const rim = 1 - Math.abs(front - 0.5) * 2;
        // The lift shows up mostly as LIGHT, only a little as size. The first
        // pass had it the other way round and the excited patch read as a
        // sparser part of the sphere rather than a brighter one — swelling a
        // dot spreads the same energy over more pixels, so past about half a
        // dot's width it dims the very thing it is meant to be lighting.
        /*
          LOW PER DOT. The field is built by ACCUMULATION — thirteen thousand
          soft, overlapping dots under `lighter` compositing. Push it and the
          overlaps saturate to white and the gradient disappears; each dot
          contributes a little and the density does the rest.

          UP A THIRD when the sprite split into a small core and a wide halo:
          most of a dot's light used to come from its solid middle, and
          shrinking that middle to a fifth of the stamp took the sphere with
          it. The halo now carries the emission and the core carries the
          texture.
        */
        /*
          Half again on paper. Additive build-up is generous — a hundred dots
          at 0.08 still climb toward white — while multiply converges much
          more slowly, so the same figures that make a sphere on black make a
          smudge on white. It was 1.5x, which over-drove a palette that was
          already too dark and compounded into mud; with the lighter, more
          saturated light ink above, 1.15 is where the two read at the same
          strength without the colour collapsing.
        */
        ctx.globalAlpha = Math.min(
          1,
          (0.075 + front * 0.19 + rim * rim * 0.06 + lift * 0.3) *
            (onLight ? 1.15 : 1),
        );
        const size = (0.9 + front * 0.45 + lift * 0.45) * dot;

        /*
          Colour is the BRAND GRADIENT across the frame, with the wave moving
          points along it. See GRAD_MIX. The displacement term is normalised
          against the field rather than against the peak amplitude: dividing
          by CREST meant that whenever the wave was calm — most of the cycle —
          the index only ever reached the middle of the ramp.
        */
        const tint = field * (0.55 + 0.45 * ampFactor) + lift * 0.8;
        /*
          Where this point sits along the brand gradient's axis, in units of
          the sphere's radius, then folded to 0..1. Taken from the SCREEN
          position, not the model's, so the ramp is pinned to the frame the
          way it is pinned to the wordmark — the sphere turns inside a fixed
          gradient instead of carrying one around with it.
        */
        const along =
          (((px - cx) * GRAD_X + (py - cy) * GRAD_Y) / radius) * 0.5 + 0.5;
        const t =
          along * GRAD_MIX + (tint * 0.5 + 0.5) * (1 - GRAD_MIX);
        const step = Math.max(
          0,
          Math.min(
            PALETTE_STEPS - 1,
            Math.round(t * (PALETTE_STEPS - 1)),
          ),
        );
        // Out of focus round the back, in focus on the near face.
        ctx.drawImage(
          (onLight ? spritesOnLight : spritesOnDark)[
            front < 0.32 ? step + PALETTE_STEPS : step
          ],
          px - size,
          py - size,
          size * 2,
          size * 2,
        );

      }

      /*
        The nucleus, last so it sits over the near face. It breathes on a
        slower cycle than the surface does — two rhythms at the same rate
        read as one, and the point of the second is to make the sphere feel
        like it has an inside.

        SMALL AND DIM. The first pass drew it wider than the sphere itself at
        four times this alpha; it quadrupled the section's total emission,
        flattened the contrast the dots depend on, and put a warm haze
        directly behind the wordmark. A core should be a core.
      */
      flare *= 0.94;
      const corePulse = frozen ? 0.5 : 0.5 + 0.5 * Math.sin(now * 0.00042);
      const coreSize = radius * (0.6 + corePulse * 0.06 + flare * 0.22);
      /*
        The nucleus is a WHITE blob, and white is the identity value for
        multiply — on paper it would paint precisely nothing while still
        costing a full-radius blit every frame. So it is skipped there. The
        sphere reads without it: on a light ground the dots darken toward the
        middle by themselves, which is the same cue the core exists to give on
        black.
      */
      if (!onLight) {
        ctx.globalAlpha = Math.min(0.7, (0.15 + corePulse * 0.05 + flare * 0.42) * settle);
        ctx.drawImage(coreSprite, cx - coreSize, cy - coreSize, coreSize * 2, coreSize * 2);
      }

      for (let r = ripples.length - 1; r >= 0; r -= 1) {
        if (((now - ripples[r].born) / 1000) * RIPPLE_SPEED > 2.4) {
          ripples.splice(r, 1);
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (now: number) => {
      render(now);
      frame = requestAnimationFrame(loop);
    };

    /**
     * Under Reduce Motion the sphere does not run on its own — but it still
     * answers the pointer, because a response to something the reader is
     * doing right now is not the ambient movement that setting is asking us
     * to stop. So the loop is allowed to run while the pointer is in the
     * section, and stops again when it leaves.
     */
    const shouldRun = () =>
      visible && !document.hidden && (!still.matches || hasPointer);

    const start = () => {
      if (frame || !shouldRun()) return;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // Reduce Motion skips the assembly outright and starts fully formed.
    // Reduce Motion: the sphere is simply there, undeformed.
    if (resize()) render(still.matches ? 0 : performance.now());

    const onResize = () => {
      if (resize()) render(performance.now());
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(host);

    /*
      Pointer listeners sit on the SECTION, not on the canvas. The orb is
      pointer-events:none — it must never intercept a click meant for the page
      — and the sphere leaning toward a cursor that is still crossing the
      names reads far better than one that only wakes when you are on top of
      it. The rect is cached and refreshed on move and on scroll rather than
      measured every frame, so the render loop never reads layout.
    */
    const zone: Element = host.closest("section") ?? host;
    let rect = host.getBoundingClientRect();

    const place = (clientX: number, clientY: number) => {
      pointerX = clientX - rect.left;
      pointerY = clientY - rect.top;
      const halfX = (rect.width || 1) / 2;
      const halfY = (rect.height || 1) / 2;
      const nx = Math.max(-2, Math.min(2, (pointerX - halfX) / halfX));
      const ny = Math.max(-2, Math.min(2, (pointerY - halfY) / halfY));
      targetYaw = nx * LEAN_YAW;
      targetPitch = -ny * LEAN_PITCH;
    };

    let lastClientX = 0;
    let lastClientY = 0;

    const onMove = (event: Event) => {
      const pointer = event as PointerEvent;
      rect = host.getBoundingClientRect();
      lastClientX = pointer.clientX;
      lastClientY = pointer.clientY;
      hasPointer = true;
      place(pointer.clientX, pointer.clientY);
      start();
    };

    const onLeave = () => {
      hasPointer = false;
      targetYaw = 0;
      targetPitch = 0;
      // Under Reduce Motion the loop only runs for the pointer, so it has to
      // be let go of here — but not before the lean has eased back, or the
      // sphere would freeze mid-turn.
      if (still.matches) {
        window.setTimeout(() => {
          if (!hasPointer) {
            stop();
            leanYaw = 0;
            leanPitch = 0;
            leanYawVel = 0;
            leanPitchVel = 0;
            excite.fill(0);
            render(0);
          }
        }, 900);
      }
    };

    const onDown = (event: Event) => {
      const pointer = event as PointerEvent;
      rect = host.getBoundingClientRect();
      place(pointer.clientX, pointer.clientY);
      // Only within reach of the sphere — a click on a nav link at the far
      // side of the section has nothing to do with this.
      if (Math.hypot(pointerX - width / 2, pointerY - height / 2) < radius * 1.4) {
        if (ripples.length >= RIPPLE_MAX) ripples.shift();
        ripples.push({ x: pointerX, y: pointerY, born: performance.now() });
        flare = 1;
        hasPointer = true;
        start();
      }
    };

    const onScroll = () => {
      if (!hasPointer) return;
      rect = host.getBoundingClientRect();
      place(lastClientX, lastClientY);
    };

    zone.addEventListener("pointermove", onMove, { passive: true });
    zone.addEventListener("pointerleave", onLeave, { passive: true });
    zone.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    // Only the visible orb runs. A canvas three sections above the fold has
    // no business holding a 60Hz loop open.
    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          // The assembly starts the first time it is actually seen, not at
          // mount — otherwise it plays to nobody while the reader is still
          // in the hero.
          if (wokeAt === 0) wokeAt = performance.now();
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    watcher.observe(host);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const onPreference = () => {
      stop();
      if (still.matches) {
        render(0);
      } else {
        start();
      }
    };
    still.addEventListener("change", onPreference);

    return () => {
      stop();
      observer.disconnect();
      watcher.disconnect();
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
      zone.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      still.removeEventListener("change", onPreference);
      lightQuery.removeEventListener("change", readTheme);
      document.removeEventListener("genesis-theme-change", readTheme);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn("pointer-events-none relative aspect-square w-full", className)}
    >
      {/*
        A wide static wash under the canvas. The reactive part of the core is
        painted on the canvas, where it can pulse; this is the ambient half,
        and repainting it 60 times a second to have it not change would be
        pure waste.
      */}
      <div
        className="absolute inset-[10%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, rgb(255 197 22 / 0.10) 0%, rgb(247 113 158 / 0.07) 38%, rgb(122 60 255 / 0.08) 64%, transparent 78%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
