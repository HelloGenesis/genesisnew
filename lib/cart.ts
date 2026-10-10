/**
 * THE CART — every product the site sells, and what a basket of them costs.
 *
 * ONE CATALOGUE, BUILT FROM THE PRICES ALREADY ON THE PAGES. Nothing here
 * restates a figure: memberships come from each plan's `rate` (lib/verticals),
 * one-time products from Genesis's product listing (lib/products). Change a
 * price there and the cart charges the new one. There are no add-ons any
 * more — the fifteen one-time products replaced them (28 Sep 2026).
 *
 * THE SERVER PRICES THE ORDER, NOT THE BROWSER. The cart in the browser holds
 * only product ids and quantities; /api/checkout looks each id up here and
 * works the total out again before it asks Razorpay for a payment link, so a
 * visitor editing their cart in dev tools cannot change what they pay.
 *
 * Every product in the cart has a fixed price. The one whose price depends
 * on the campaign — Influencer Campaign Management — books a call instead
 * and never reaches the cart. (A line with no `amount` would still be
 * carried as a quote request, not charged; nothing uses that today.)
 */

import { inr, monthlyListFigure, price } from "./money";
import { cleanChoice, priceExtras, type ExtraLine, type ExtrasChoice } from "./extras";
import { products } from "./products";
import { taxFor } from "./regions";
import { aiPlans } from "./verticals/ai-labs";
import { designProducts } from "./verticals/brand-design";
import { studiosPlans } from "./verticals/studios";
import type { VerticalKey } from "./verticals/types";

export type ProductKind = "membership" | "one-time";
export type Billing = "quarterly" | "monthly";

export type Product = {
  id: string;
  name: string;
  /** What it belongs to — "AI Content Studio", "Genesis Studios". */
  group: string;
  vertical: VerticalKey;
  kind: ProductKind;
  /**
   * Rupees per unit, as shown (₹1 off already taken). For a membership this
   * is the QUARTERLY rate per month; see `unitCharge` for what is charged.
   */
  amount?: number;
  /** "per month" — when a unit is not the whole product. */
  unit?: string;
  /** The price as the page writes it, for a quoted line. */
  quote?: string;
  /** Memberships only: the plan's list figure, from which both billings follow. */
  rate?: number;
  /** What the buyer gets — shown under "What's included" on the tile and in the cart. */
  includes?: readonly string[];
  /** A Studios plan with a monthly shoot in it — the half the AI + Studios combo needs. */
  withShoot?: boolean;
  /** Needs a physical shoot — Mumbai only, for now (lib/regions). */
  inPerson?: boolean;
  /** The most one order may hold. */
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
  /* Enterprise plans are sold by conversation, never at checkout — `contactOnly`. */
  ...aiPlans.plans
    .filter((plan) => !plan.contactOnly)
    .map((plan) => membership("ai-labs", GROUP["ai-labs"], plan.name, plan.rate, plan.features)),
  ...studiosPlans.plans
    .filter((plan) => !plan.contactOnly)
    .map((plan) => membership("studios", "Content Monthly", plan.name, plan.rate, plan.features, plan.inPerson)),
  membership(
    "brand-design",
    "Genesis Creative Desk",
    designProducts.desk.name,
    designProducts.desk.rate,
    designProducts.desk.highlights.map((row) => `${row.label}: ${row.value}`),
  ),

  /* The fifteen one-time products, less the one that books a call (lib/products). */
  ...products
    .filter((product) => product.cta === "buy" && product.price !== undefined)
    .map(
      (product): Product => ({
        id: productId(product.vertical, "one-time", product.name),
        name: product.name,
        group: GROUP[product.vertical],
        vertical: product.vertical,
        kind: "one-time",
        amount: product.price,
        includes: product.includes,
        inPerson: product.inPerson,
      }),
    ),
];

/* One entry per id — a product listed in two places (a page and /pricing) is one product. */
export const catalog = all.filter((product, index) => all.findIndex((other) => other.id === product.id) === index);

const byId = new Map(catalog.map((product) => [product.id, product]));

export const findProduct = (id: string) => byId.get(id);

/* ------------------------------------------------------------------- totals */

/** `extras`: a pay-per-project line's longer videos, adaptations and add-ons — see lib/extras. */
export type CartLine = { id: string; qty: number; billing?: Billing; extras?: ExtrasChoice };

/**
 * THE BUNDLE DISCOUNT — "we can offer discounts as well if many things are
 * added" (Genesis, 28 Sep 2026). Counted on one-time products, the things
 * bought by the piece; memberships already carry their own saving
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

export type PricedLine = CartLine & {
  product: Product;
  /** The product itself, qty included. */
  charge: number;
  quoted: boolean;
  /** Its extras, priced line by line, and their sum. */
  extraLines: ExtraLine[];
  extrasCharge: number;
};

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
  /*
    ONE BILLING CYCLE PER ORDER. A Razorpay subscription has exactly one
    period, and every membership in an order is charged on one subscription,
    so they share a cycle: the last membership's choice, which is the one the
    buyer touched most recently (the cart keeps them in step as well).
  */
  const orderBilling: Billing =
    [...kept].reverse().find((line) => findProduct(line.id)?.kind === "membership")?.billing ?? "quarterly";
  const priced: PricedLine[] = [];
  for (const line of kept) {
    const product = findProduct(line.id);
    if (!product) continue;
    const qty = product.kind === "membership" ? 1 : Math.max(1, Math.min(maxQty(product), Math.floor(line.qty) || 1));
    const quoted = product.amount === undefined;
    /* Extras, clamped to what the product allows whatever the browser sent. */
    const extras = product.kind === "one-time" && !quoted ? cleanChoice(product.name, line.extras, qty) : undefined;
    const extraLines = priceExtras(product.name, extras);
    priced.push({
      id: line.id,
      qty: quoted ? 1 : qty,
      billing: product.kind === "membership" ? orderBilling : undefined,
      extras,
      product,
      quoted,
      charge: quoted ? 0 : unitCharge(product, product.kind === "membership" ? orderBilling : undefined) * qty,
      extraLines,
      extrasCharge: extraLines.reduce((sum, extra) => sum + extra.amount, 0),
    });
  }

  const payable = priced.filter((line) => !line.quoted);
  const extrasSum = payable.reduce((sum, line) => sum + line.extrasCharge, 0);
  const subtotal = payable.reduce((sum, line) => sum + line.charge, 0) + extrasSum;

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

  /*
    THE TWO PARTS OF AN ORDER, each taxed on its own so they add up exactly:
    the MEMBERSHIPS, charged every cycle on a Razorpay subscription, and the
    ONE-TIME products, charged once (on the subscription's first invoice when
    there is one, or on a payment link when there is not).
  */
  const recurringTaxable = members.reduce((sum, line) => sum + line.charge, 0) - comboDiscount;
  const recurringTax = Math.round(recurringTaxable * tax.rate);
  /* Extras are charged once, taxed, and take no bundle discount (lib/extras). */
  const oneTimeTaxable = bundleBase - discount + extrasSum;
  const oneTimeTax = Math.round(oneTimeTaxable * tax.rate);
  const taxable = recurringTaxable + oneTimeTaxable;
  const gst = recurringTax + oneTimeTax;

  return {
    lines: priced,
    payable,
    quoted: priced.filter((line) => line.quoted),
    subtotal,
    /** Of the subtotal, what the extras come to. */
    extrasSum,
    discount,
    discountPercent: tier?.percent ?? 0,
    bundleItems,
    /** "Add 2 more one-time products to save 5%." */
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
    /** The memberships' shared cycle; see orderBilling. */
    billing: members.length > 0 ? orderBilling : undefined,
    /** Charged every cycle, tax included. 0 when the order has no membership. */
    recurring: { taxable: recurringTaxable, tax: recurringTax, total: recurringTaxable + recurringTax },
    /** Charged once, tax included. */
    oneTime: { taxable: oneTimeTaxable, tax: oneTimeTax, total: oneTimeTaxable + oneTimeTax },
  };
}

export const rupees = (value: number) => inr(value);
