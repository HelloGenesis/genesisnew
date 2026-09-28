/**
 * THE PRICING COLOURS — one gradient per kind of thing a visitor can buy, so
 * the tiers read apart at a glance (Genesis, 28 Sep 2026: "differentiate the
 * blocks into 3 different gradients so it's user friendly and easier to
 * understand").
 *
 *   Tier 1 (Starter)     emerald → cyan
 *   Tier 2 (Growth)      gold → orange — the brand's end of the spectrum, for
 *                        the plan most brands pick
 *   Tier 3 (Enterprise)  blue → violet
 *   One-time             violet → coral → amber — the orb's colours
 *
 * Every stop is dark enough to read as text on the light theme's #f9f9f9 as
 * well as on the dark theme's near-black; names are set in these gradients.
 */
export const TIER_GRADIENTS = [
  "linear-gradient(115deg, #10b981 0%, #06b6d4 100%)",
  "linear-gradient(115deg, #e8a100 0%, #f2552c 100%)",
  "linear-gradient(115deg, #3b82f6 0%, #8b5cf6 100%)",
] as const;

/** The glow behind each tier's card, in its first colour. */
export const TIER_GLOWS = ["rgb(16 185 129 / 0.22)", "rgb(232 161 0 / 0.24)", "rgb(59 130 246 / 0.24)"] as const;

export const ONE_TIME_GRADIENT = "linear-gradient(115deg, #8b5cf6 0%, #f7788f 55%, #ffb35c 100%)";

export const tierGradient = (index: number) => TIER_GRADIENTS[index % TIER_GRADIENTS.length];
export const tierGlow = (index: number) => TIER_GLOWS[index % TIER_GLOWS.length];
