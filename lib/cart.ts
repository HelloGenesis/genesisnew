/**
 * THE CART — every product the site sells, and what a basket of them costs.
 *
 * ONE CATALOGUE, BUILT FROM THE PRICES ALREADY ON THE PAGES. Nothing here
 * restates a figure: memberships come from each plan's `rate`, add-ons from
 * the add-on lists, one-time products from the one-time lists. Change a price
 * in lib/verticals/* and the cart charges the new one.
 *
 * THE SERVER PRICES THE ORDER, NOT THE BROWSER. The cart in the browser holds
 * only product ids and quantities; /api/checkout looks each id up here and
 * works the total out again before it asks Razorpay for a payment link, so a
 * visitor editing their cart in dev tools cannot change what they pay.
 *
 * TWO KINDS OF LINE:
 *   priced — a fixed figure ("₹24,999/-", "₹4,999/- per video"). Paid at checkout.
 *   quoted — "From ₹…", "On request", "Custom", "At actual". Rides along
 *            with the order as a request; Genesis quotes it after.
 */

import { inr, monthlyListFigure, price } from "./money";
import { taxFor } from "./regions";
import { oneTimeProjects } from "./pricing";
import { aiAddOns, aiPlans, aiStarterPack } from "./verticals/ai-labs";
import { designAddOns, designProducts } from "./verticals/brand-design";
import { studiosAddOns, studiosPlans, studiosShoot } from "./verticals/studios";
import type { AddOns, VerticalKey } from "./verticals/types";

export type ProductKind = "membership" | "add-on" | "one-time";
export type Billing = "quarterly" | "monthly";

export type Product = {
  id: string;
  name: string;
  /** What it belongs to — "AI Content Studio", "Content Shoot". */
  group: string;
  vertical: VerticalKey;
  kind: ProductKind;
  /**
   * Rupees per unit, as shown (₹1 off already taken). For a membership this
   * is the QUARTERLY rate per month; see `unitCharge` for what is charged.
   */
  amount?: number;
  /** "per video", "per month" — when a unit is not the whole product. */
  unit?: string;
  /** The price as the page writes it, for a quoted line ("From ₹35,000/-"). */
  quote?: string;
  /** Memberships only: the plan's list figure, from which both billings follow. */
  rate?: number;
  /** What the buyer gets — shown under "What's included" on the tile and in the cart. */
  includes?: readonly string[];
  /** A Studios plan with a monthly shoot in it — the half the AI + Studios combo needs. */
  withShoot?: boolean;
  /** Needs a physical shoot — Mumbai only, for now (lib/regions). */
  inPerson?: boolean;
  /** The most one order may hold — the AI Content Starter is two per brand. */
  maxQty?: number;
};

/* ---------------------------------------------------------------- catalogue */

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const productId = (vertical: VerticalKey, kind: ProductKind, name: string) =>
  `${vertical}.${kind}.${slug(name)}`;

/** "₹24,999/-", "+₹14,999/- per video", "₹20,000/- per month" → a figure; anything else is quoted. */
function parsePrice(text: string): { amount?: number; unit?: string } {
  const match = text.trim().match(/^\+?₹([\d,]+)\/-(?:\s+(per\s+\w+))?$/);
  if (!match) return {};
  return { amount: Number(match[1].replace(/,/g, "")), unit: match[2] };
}

function addOns(data: AddOns, vertical: VerticalKey, group: string): Product[] {
  return data.items.map((item) => {
    const { amount, unit } = parsePrice(item.price);
    return {
      id: productId(vertical, "add-on", item.name),
      name: item.name,
      group,
      vertical,
      kind: "add-on",
      amount,
      unit,
      quote: amount === undefined ? item.price : undefined,
      includes: item.includes ?? (item.body ? [item.body.replace(/\.$/, "")] : undefined),
      inPerson: item.inPerson,
    };
  });
}

function membership(
  vertical: VerticalKey,
  group: string,
  name: string,
  rate: number,
  includes?: readonly string[],
  inPerson?: boolean,
): Product {
  return {
    id: productId(vertical, "membership", name),
    name,
    group,
    vertical,
    kind: "membership",
    rate,
    amount: rate - 1,
    unit: "per month",
    includes,
    inPerson,
    /* A monthly shoot in the plan ("1 Half-Day Shoot / month") — what the AI + Studios combo needs. */
    withShoot: includes?.some((line) => /shoot \/ month/i.test(line)),
  };
}

const GROUP: Record<VerticalKey, string> = {
  "ai-labs": "AI Content Studio",
  studios: "Genesis Studios",
  "brand-design": "Brand & Design",
  influence: "Influence",
};

const all: Product[] = [
  ...aiPlans.plans.map((plan) => membership("ai-labs", GROUP["ai-labs"], plan.name, plan.rate, plan.features)),
  ...studiosPlans.plans.map((plan) =>
    membership("studios", "Content Monthly", plan.name, plan.rate, plan.features, plan.inPerson),
  ),
  membership(
    "brand-design",
    "Genesis Creative Desk",
    designProducts.desk.name,
    designProducts.desk.rate,
    designProducts.desk.highlights.map((row) => `${row.label}: ${row.value}`),
  ),

  <Product>{
    id: productId("ai-labs", "one-time", aiStarterPack.name),
    name: aiStarterPack.name,
    group: GROUP["ai-labs"],
    vertical: "ai-labs",
    kind: "one-time",
    amount: 24000,
    maxQty: 2,
    includes: aiStarterPack.includes,
  },
  ...studiosShoot.packages.map((pack): Product => {
    const { amount } = parsePrice(pack.price);
    return {
      id: productId("studios", "one-time", pack.name),
      name: pack.name,
      group: "Content Shoot",
      vertical: "studios",
      kind: "one-time",
      amount,
      quote: amount === undefined ? pack.price : undefined,
      includes: pack.features,
      inPerson: true,
    };
  }),
  ...oneTimeProjects
    .filter((project) => project.name !== aiStarterPack.name)
    .map((project): Product => {
      const { amount } = parsePrice(project.from);
      return {
        id: productId(project.vertical, "one-time", project.name),
        name: project.name,
        group: GROUP[project.vertical],
        vertical: project.vertical,
        kind: "one-time",
        amount,
        quote: amount === undefined ? `From ${project.from}` : undefined,
        includes: [project.body.replace(/\.$/, "")],
      };
    }),
  <Product>{
    id: productId("brand-design", "one-time", designProducts.build.name),
    name: designProducts.build.name,
    group: GROUP["brand-design"],
    vertical: "brand-design",
    kind: "one-time",
    quote: `From ${designProducts.build.from}`,
    includes: designProducts.build.points,
  },

  ...addOns(aiAddOns, "ai-labs", GROUP["ai-labs"]),
  ...addOns(studiosAddOns, "studios", GROUP.studios),
  ...addOns(designAddOns, "brand-design", GROUP["brand-design"]),
];

/* One entry per id — a product listed in two places (a page and /pricing) is one product. */
export const catalog = all.filter((product, index) => all.findIndex((other) => other.id === product.id) === index);

const byId = new Map(catalog.map((product) => [product.id, product]));

/**
 * A DIVISION'S ADD-ONS, AS PRODUCTS ANYONE CAN BUY ONCE (Genesis, 28 Sep
 * 2026: "all the add-on products should also be written … as one-time
 * products … making it easy for normal users to buy").
 *
 * Only the ones that stand on their own. Left out: a monthly extra to a
 * membership ("Additional Brand … per month"), a surcharge on other work
 * ("+30%"), and costs passed through at actuals ("At actual") — none of
 * those is a thing a visitor can buy by itself.
 */
export function oneTimeAddOns(vertical: VerticalKey): Product[] {
  return catalog.filter((product) => product.vertical === vertical && product.kind === "add-on" && standsAlone(product));
}

/** The rest of a division's add-ons — the ones that only go with a membership or a shoot. */
export function attachedAddOns(vertical: VerticalKey): Product[] {
  return catalog.filter((product) => product.vertical === vertical && product.kind === "add-on" && !standsAlone(product));
}

function standsAlone(product: Product) {
  return product.unit !== "per month" && !/^\+\d+%|^At actual/i.test(product.quote ?? "");
}

export const findProduct = (id: string) => byId.get(id);

/* ------------------------------------------------------------------- totals */

export type CartLine = { id: string; qty: number; billing?: Billing };

/**
 * THE BUNDLE DISCOUNT — "we can offer discounts as well if many things are
 * added" (Genesis, 28 Sep 2026). Counted on add-ons and one-time products,
 * the things bought by the piece; memberships already carry their own saving
 * (quarterly billing, 10%), so they neither count towards it nor take it.
 *
 * TODO(genesis): confirm the tiers. Highest one reached applies.
 */
export const bundleTiers = [
  { minItems: 3, percent: 5 },
  { minItems: 5, percent: 10 },
] as const;


/**
 * ONE PLAN PER PACKAGE (Genesis, 28 Sep 2026: "1 person can't choose 2 plans
 * from the same package — Growth and Starter both can't be added"). A
 * package is a membership's `group`; adding a second plan from it replaces
 * the first, and the server keeps only the last one it is sent.
 */
export function samePackage(a: Product, b: Product) {
  return a.kind === "membership" && b.kind === "membership" && a.group === b.group && a.id !== b.id;
}

/**
 * THE AI + STUDIOS COMBO — "if you combine AI content + Studios plan it will
 * work magic for your brand, and there will be a 10% discount … you need a
 * plan from Studios that has a shoot in it, so we capture the best of
 * things" (Genesis, 28 Sep 2026). Taken off both memberships when the cart
 * holds an AI plan and a Studios plan WITH a monthly shoot; suggested when
 * it holds only one, or a Studios plan without a shoot.
 */
export const COMBO_PERCENT = 10;
/** What the suggestion offers: AI's first tier, and Studios' first tier with a shoot. */
const COMBO_AI = productId("ai-labs", "membership", aiPlans.plans[0].name);
const COMBO_STUDIOS = productId(
  "studios",
  "membership",
  (studiosPlans.plans.find((plan) => plan.features.some((line) => /shoot \/ month/i.test(line))) ?? studiosPlans.plans[0])
    .name,
);

/** The most of one product a cart may hold. */
export const maxQty = (product: Product) => (product.kind === "membership" ? 1 : (product.maxQty ?? 99));

/** What one unit of a product costs at checkout, in rupees. */
export function unitCharge(product: Product, billing: Billing = "quarterly") {
  if (product.amount === undefined) return 0;
  if (product.kind !== "membership" || product.rate === undefined) return product.amount;
  /* A quarter is paid upfront; monthly is the +10% figure, one month at a time. */
  return billing === "quarterly" ? product.amount * 3 : monthlyListFigure(product.rate) - 1;
}

export function billingNote(product: Product, billing: Billing = "quarterly") {
  if (product.kind !== "membership") return product.unit ?? "";
  return billing === "quarterly"
    ? `${price(product.rate!)} per month · 3 months upfront`
    : `Billed monthly`;
}

export type PricedLine = CartLine & { product: Product; charge: number; quoted: boolean };

/** `country` sets the tax — GST in India, none on an export (see taxFor). India when not yet chosen. */
export function priceCart(lines: readonly CartLine[], options: { country?: string } = {}) {
  const tax = taxFor(options.country);
  /* One plan per package: a later plan from the same package wins. */
  const kept = lines.filter((line, index) => {
    const product = findProduct(line.id);
    if (!product || product.kind !== "membership") return true;
    return !lines.slice(index + 1).some((later) => {
      const other = findProduct(later.id);
      return other !== undefined && samePackage(product, other);
    });
  });
  const priced: PricedLine[] = [];
  for (const line of kept) {
    const product = findProduct(line.id);
    if (!product) continue;
    const qty = product.kind === "membership" ? 1 : Math.max(1, Math.min(maxQty(product), Math.floor(line.qty) || 1));
    const quoted = product.amount === undefined;
    priced.push({
      id: line.id,
      qty: quoted ? 1 : qty,
      billing: product.kind === "membership" ? (line.billing ?? "quarterly") : undefined,
      product,
      quoted,
      charge: quoted ? 0 : unitCharge(product, line.billing) * qty,
    });
  }

  const payable = priced.filter((line) => !line.quoted);
  const subtotal = payable.reduce((sum, line) => sum + line.charge, 0);

  const bundle = payable.filter((line) => line.product.kind !== "membership");
  const bundleItems = bundle.reduce((sum, line) => sum + line.qty, 0);
  const bundleBase = bundle.reduce((sum, line) => sum + line.charge, 0);
  const tier = [...bundleTiers].reverse().find((entry) => bundleItems >= entry.minItems);
  const discount = tier ? Math.round((bundleBase * tier.percent) / 100) : 0;
  const nextTier = bundleTiers.find((entry) => bundleItems < entry.minItems);

  /* AI + Studios together: COMBO_PERCENT off both memberships. */
  const members = payable.filter((line) => line.product.kind === "membership");
  const aiPlan = members.find((line) => line.product.vertical === "ai-labs");
  const studiosPlan = members.find((line) => line.product.vertical === "studios");
  const studiosWithShoot = studiosPlan?.product.withShoot ? studiosPlan : undefined;
  const comboDiscount =
    aiPlan && studiosWithShoot ? Math.round(((aiPlan.charge + studiosWithShoot.charge) * COMBO_PERCENT) / 100) : 0;
  /*
    What would complete it: the AI plan for a Studios-with-shoot cart; a
    Studios plan with a shoot for an AI cart, or an upgrade from a Studios
    plan without one. A Studios plan without a shoot, alone, is not offered
    the combo — it would need both an upgrade and a second plan.
  */
  const comboSuggest =
    comboDiscount > 0
      ? undefined
      : aiPlan
        ? findProduct(COMBO_STUDIOS)
        : studiosWithShoot
          ? findProduct(COMBO_AI)
          : undefined;
  /** The cart already has a Studios plan, just not one with a shoot — so the suggestion is an upgrade. */
  const comboUpgrade = Boolean(comboSuggest && studiosPlan && !studiosWithShoot);

  const taxable = subtotal - discount - comboDiscount;
  const gst = Math.round(taxable * tax.rate);

  return {
    lines: priced,
    payable,
    quoted: priced.filter((line) => line.quoted),
    subtotal,
    discount,
    discountPercent: tier?.percent ?? 0,
    bundleItems,
    /** "Add 2 more add-ons or one-time products to save 5%." */
    nextTier: nextTier ? { itemsToGo: nextTier.minItems - bundleItems, percent: nextTier.percent } : undefined,
    comboDiscount,
    /** The other half of the AI + Studios combo, when the cart has only one. */
    comboSuggest,
    comboUpgrade,
    /** Lines that need a physical shoot — checkout only for a Mumbai shoot. */
    inPerson: priced.some((line) => line.product.inPerson),
    gst,
    taxLabel: tax.label,
    total: taxable + gst,
  };
}

export const rupees = (value: number) => inr(value);
