/**
 * Radial washes that do not show their own edge.
 *
 * THE PROBLEM, AND IT IS ARITHMETIC RATHER THAN TASTE. A radial gradient
 * written the obvious way — `rgb(c / 0.2) 0%, transparent 70%` — fades its
 * alpha LINEARLY. Linear is the one falloff the eye is guaranteed to catch:
 * the rate of change is constant through the middle and then stops dead at
 * the last stop, and that discontinuity in the slope reads as a ring. Genesis
 * has been looking at those rings across the whole site — "gradient shapes ko
 * theek karo, its clearly visible the circles".
 *
 * Softening the colour does not fix it. Neither does pushing the last stop
 * further out: it moves the ring, it does not remove it. What removes it is a
 * curve whose VALUE and whose SLOPE both reach zero at the edge, so there is
 * no point along the radius where anything changes abruptly.
 *
 * THE CURVE IS (1 - t²)³, the poly6 kernel from particle simulation, sampled
 * at nine stops. It is 1 at the centre, falls away gently at first, drops
 * fastest through the middle third, and flattens onto zero — f(1) = 0 and
 * f'(1) = 0, which is exactly the pair of conditions a visible edge needs
 * both of to disappear. Nine stops is enough that the browser's own linear
 * interpolation between them is below the threshold anyone can see; more
 * makes the declaration longer and changes nothing.
 *
 * WHY STOPS AND NOT A BLUR. `filter: blur()` on a large element is a
 * full-screen offscreen pass on every paint, and these washes sit behind
 * scrolling content on every page. This costs nothing at runtime — it is
 * still one gradient, just with more stops in it.
 */

/**
 * Where the samples are taken along the radius, and the kernel's value there.
 * Precomputed rather than evaluated per call: there are four or five washes
 * per page and the answer never changes.
 *
 *   f(t) = (1 - t²)³
 */
const FALLOFF: [percent: number, weight: number][] = [
  [0, 1],
  [12, 0.958],
  [24, 0.841],
  [36, 0.672],
  [48, 0.483],
  [60, 0.303],
  [72, 0.153],
  [84, 0.049],
  [92, 0.014],
  [100, 0],
];

/**
 * The colour stops for one wash, as a comma-separated list.
 *
 * `color` is a bare `r g b` triple, matching how the rest of this codebase
 * writes them, and `alpha` is the strength at the centre. `scale` lets a
 * caller multiply the whole curve by a custom property — the spectrum washes
 * dim themselves per theme that way, and the expression has to stay inside
 * each stop for it to keep working.
 */
export function softStops(color: string, alpha: number, scale?: string): string {
  return FALLOFF.map(([percent, weight]) => {
    if (weight === 0) return `transparent ${percent}%`;
    const value = alpha * weight;
    const a = scale ? `calc(${value.toFixed(4)} * ${scale})` : value.toFixed(4);
    return `rgb(${color} / ${a}) ${percent}%`;
  }).join(", ");
}

/**
 * A complete `radial-gradient(...)` with the soft falloff already in it.
 *
 * `shape` is whatever goes before the first colour stop — "60% 50% at 50% 0%",
 * "closest-side at 50% 46%", and so on — so callers keep full control of the
 * geometry and only hand the falloff over.
 */
export function softRadial(
  shape: string,
  color: string,
  alpha: number,
  scale?: string,
): string {
  return `radial-gradient(${shape}, ${softStops(color, alpha, scale)})`;
}
