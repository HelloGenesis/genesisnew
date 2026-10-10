/**
 * EXTRAS ON A PAY-PER-PROJECT PRODUCT — what a buyer can add before paying
 * (Genesis, 3 Oct 2026: "build this … go with suggestions"):
 *
 *  - LONGER VIDEOS. +30 sec steps, up to +90 sec, on as many of the
 *    product's videos as the buyer picks. Each step costs EXTEND_PERCENT of
 *    the product's price per video.
 *  - ADAPTATIONS. An alternate cut or aspect ratio (a design product: an
 *    extra size or version), each ADAPT_PERCENT of the price per video or
 *    per item.
 *  - THE PRICED ADD-ONS from Genesis's sheet that are bought with the work —
 *    an AI avatar, an advanced voice clone, an extra UGC creator, a second
 *    camera. Charges that only arise after delivery (post-final edits, AI
 *    regeneration) are not offered here; they stay in the pop-up's list.
 *
 * "PRICE PER VIDEO" is the product's price over the videos (or items) it
 * makes — with three of Genesis's own rulings: Build Your AI Avatar Clone's
 * avatar setup counts as ₹14,999 of its price; Event Content Coverage's
 * aftermovie as half its price; Half-Day Content Shoot's whole price as its
 * four videos. Every figure is rounded to end in 99, the house way.
 *
 * Extras are charged with GST and are not counted toward the bundle
 * discount, which stays on the products themselves (see lib/cart).
 */

import { products, type OneTimeProduct } from "./products";

export const EXTEND_PERCENT = 30;
export const ADAPT_PERCENT = 20;
export const EXTEND_STEP_SEC = 30;
export const EXTEND_MAX_STEPS = 3;
export const ADAPT_MAX = 10;

/** How each product divides into videos (or items), and what one is worth. */
const UNITS: Record<string, { count: number; base: number; noun: "video" | "reel" | "film" | "item" | "slide"; extend: boolean }> = {
  "Build Your AI Avatar Clone": { count: 3, base: (24999 - 14999) / 3, noun: "video", extend: true },
  "AI Video Campaign Content Pack": { count: 4, base: 39999 / 4, noun: "video", extend: true },
  "AI Product Explainer + Advance Motion Graphics": { count: 1, base: 44999, noun: "video", extend: true },
  "AI Campaign Film + Advanced Motion Graphic Video": { count: 1, base: 67999, noun: "film", extend: true },
  "Reel Editing Pack": { count: 7, base: 24999 / 7, noun: "reel", extend: true },
  "Founder / CEO Video Shoot": { count: 7, base: 44999 / 7, noun: "video", extend: true },
  "Half-Day Content Shoot": { count: 4, base: 59999 / 4, noun: "video", extend: true },
  "Event Content Coverage": { count: 1, base: 37500, noun: "film", extend: true },
  "UGC Starter Pack": { count: 4, base: 39999 / 4, noun: "video", extend: true },
  "UGC Performance Pack": { count: 10, base: 64999 / 10, noun: "video", extend: true },
  /* Design: adaptations only, per creative / slide / logo. */
  "Logo Refresh": { count: 1, base: 24999, noun: "item", extend: false },
  "Campaign Creative Kit": { count: 8, base: 29999 / 8, noun: "item", extend: false },
  "Pitch Deck Makeover": { count: 22, base: 32999 / 22, noun: "slide", extend: false },
  "Marketing Launch Kit": { count: 24, base: 39999 / 24, noun: "item", extend: false },
};

/** ₹3,000 → ₹2,999; ₹1,071 → ₹1,099. Never under ₹99. */
export const r99 = (value: number) => Math.max(99, Math.round(value / 100) * 100 - 1);

export type FixedAddOn = {
  id: string;
  label: string;
  price: number;
  /** "video", "avatar", "creator" — bought by the piece; absent for a single tick. */
  per?: string;
  max: number;
};

export type ProductExtras = {
  /** Videos (or items) in the product, and the noun for them. */
  count: number;
  noun: string;
  extend?: { price: number };
  adapt: { price: number };
  addOns: FixedAddOn[];
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The sheet's add-on lines that carry a price and are bought with the work. */
function fixedAddOns(product: OneTimeProduct, count: number): FixedAddOn[] {
  return (product.addOns ?? []).flatMap((line) => {
    if (/post-final|generation/i.test(line)) return [];
    const money = line.match(/₹\s?([\d,]+)/);
    if (!money) return [];
    const price = Number(money[1].replace(/,/g, ""));
    const per = line.match(/per\s+(video|avatar|creator)\b/i)?.[1].toLowerCase();
    /* "AI Avatar Creation: ₹14,999/- per avatar"; "Additional camera + cinematographer, Still camera setup: ₹19,999/-". */
    const label = line.split(/:\s*(?=₹)/)[0].trim();
    return [{ id: slug(label), label, price, per, max: per === "video" ? Math.max(count, 1) * 2 : per ? 10 : 1 }];
  });
}

const cache = new Map<string, ProductExtras | null>();

/** What can be added to a product, or null where nothing can (quoted products). */
export function extrasFor(name: string): ProductExtras | null {
  if (cache.has(name)) return cache.get(name)!;
  const product = products.find((p) => p.name === name);
  const units = UNITS[name];
  let out: ProductExtras | null = null;
  if (product && units && product.cta === "buy") {
    out = {
      count: units.count,
      noun: units.noun,
      extend: units.extend ? { price: r99((units.base * EXTEND_PERCENT) / 100) } : undefined,
      adapt: { price: r99((units.base * ADAPT_PERCENT) / 100) },
      addOns: fixedAddOns(product, units.count),
    };
  }
  cache.set(name, out);
  return out;
}

/**
 * A line's chosen extras, as stored in the cart. `extendSteps` and
 * `extendVideos` together: +30 sec × steps, on that many videos.
 */
export type ExtrasChoice = {
  extendSteps?: number;
  extendVideos?: number;
  adaptations?: number;
  addOns?: Record<string, number>;
};

/** Clamps a choice to what the product allows — the server runs this on whatever it is sent. */
export function cleanChoice(name: string, choice: ExtrasChoice | undefined, qty = 1): ExtrasChoice | undefined {
  const extras = extrasFor(name);
  if (!extras || !choice) return undefined;
  const int = (value: unknown, max: number) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
  const steps = extras.extend ? int(choice.extendSteps, EXTEND_MAX_STEPS) : 0;
  const videos = steps ? Math.max(1, int(choice.extendVideos, extras.count * qty)) : 0;
  const addOns: Record<string, number> = {};
  for (const addOn of extras.addOns) {
    const n = int(choice.addOns?.[addOn.id], addOn.max);
    if (n) addOns[addOn.id] = n;
  }
  const cleaned: ExtrasChoice = {
    ...(steps ? { extendSteps: steps, extendVideos: videos } : {}),
    ...(int(choice.adaptations, ADAPT_MAX) ? { adaptations: int(choice.adaptations, ADAPT_MAX) } : {}),
    ...(Object.keys(addOns).length ? { addOns } : {}),
  };
  return Object.keys(cleaned).length ? cleaned : undefined;
}

export type ExtraLine = { label: string; amount: number };

/** The chosen extras as priced lines — what the cart shows and the order records. */
export function priceExtras(name: string, choice: ExtrasChoice | undefined): ExtraLine[] {
  const extras = extrasFor(name);
  if (!extras || !choice) return [];
  const lines: ExtraLine[] = [];
  if (extras.extend && choice.extendSteps && choice.extendVideos) {
    const sec = choice.extendSteps * EXTEND_STEP_SEC;
    const n = choice.extendVideos;
    lines.push({
      label: `+${sec} sec on ${n} ${extras.noun}${n > 1 ? "s" : ""}`,
      amount: extras.extend.price * choice.extendSteps * n,
    });
  }
  if (choice.adaptations) {
    lines.push({
      label: `${choice.adaptations} adaptation${choice.adaptations > 1 ? "s" : ""}`,
      amount: extras.adapt.price * choice.adaptations,
    });
  }
  for (const addOn of extras.addOns) {
    const n = choice.addOns?.[addOn.id];
    if (n) lines.push({ label: n > 1 ? `${addOn.label} × ${n}` : addOn.label, amount: addOn.price * n });
  }
  return lines;
}

export const extrasTotal = (name: string, choice: ExtrasChoice | undefined) =>
  priceExtras(name, choice).reduce((sum, line) => sum + line.amount, 0);
