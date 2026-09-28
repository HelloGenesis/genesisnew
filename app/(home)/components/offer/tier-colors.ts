/**
 * THE PRICING COLOURS — Genesis's own palette, the orb's violet → coral →
 * amber, in three variations so the tiers read apart at a glance while
 * plainly belonging together (Genesis, 28 Sep 2026: "the gradients … should
 * look similar to [the one-time card], which is our colour palette … make
 * these 3 blocks similar but with different variations of the same
 * gradient", everywhere subscription pricing appears).
 *
 *   Tier 1 (Starter)     violet → orchid        the palette's cool end
 *   Tier 2 (Growth)      coral → amber          its warm end, for the plan
 *                                               most brands pick
 *   Tier 3 (Enterprise)  indigo → violet → coral  the deep, full sweep
 *   One-time             violet → coral → amber  the whole palette
 *
 * Every stop is dark enough to read as text on the light theme's #f9f9f9 as
 * well as on the dark theme's near-black; names are set in these gradients.
 */
export const TIER_GRADIENTS = [
  "linear-gradient(115deg, #8b5cf6 0%, #c066d9 100%)",
  "linear-gradient(115deg, #f2607e 0%, #f5923e 100%)",
  "linear-gradient(115deg, #5b45e0 0%, #9b5cf0 55%, #e8708f 100%)",
] as const;

/** The glow behind each tier's card, in its leading colour. */
export const TIER_GLOWS = ["rgb(139 92 246 / 0.26)", "rgb(242 96 126 / 0.24)", "rgb(91 69 224 / 0.28)"] as const;

/** The three tiers' colours in one sweep — for what belongs to all the plans at once. */
export const PLANS_GRADIENT = "linear-gradient(115deg, #8b5cf6 0%, #c066d9 30%, #f2607e 65%, #f5923e 100%)";

export const ONE_TIME_GRADIENT = "linear-gradient(115deg, #8b5cf6 0%, #f7788f 55%, #ffb35c 100%)";

export const tierGradient = (index: number) => TIER_GRADIENTS[index % TIER_GRADIENTS.length];
export const tierGlow = (index: number) => TIER_GLOWS[index % TIER_GLOWS.length];
