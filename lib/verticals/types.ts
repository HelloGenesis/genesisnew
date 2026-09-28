/**
 * The shapes the four vertical pages and the /pricing tabs are built from.
 *
 * Every string that fills them is Genesis's own, from "Website - Vertical
 * pages pricing Design and copy" (the vertical-pages brief). The components
 * only lay these out, so a price or a line of copy changes in one place.
 */

/**
 * An icon is named, not imported, so the copy files stay plain data and the
 * one map from name to glyph lives with the components (offer/icons.tsx).
 */
export type IconName =
  | "idea"
  | "brand"
  | "avatar"
  | "voice"
  | "sound"
  | "motion"
  | "text"
  | "palette"
  | "delivery"
  | "script"
  | "camera"
  | "edit"
  | "queue"
  | "create"
  | "review"
  | "repeat"
  | "calendar"
  | "images"
  | "video"
  | "bolt"
  | "layers"
  | "users"
  | "star"
  | "target"
  | "building"
  | "heart"
  | "home"
  | "bag"
  | "rocket"
  | "megaphone"
  | "briefcase"
  | "language"
  | "presentation"
  | "mail"
  | "grid"
  | "sparkles"
  | "drone"
  | "clock"
  | "check"
  | "plus";

export type Cta = { label: string; href: string };

/** One tier on a monthly plan grid. */
export type Plan = {
  name: string;
  /** "Most Popular" / "Recommended" — the brief words it per vertical. */
  badge?: string;
  /** The one-line promise under the name (Studios writes one; AI Labs does not). */
  tagline?: string;
  description: string;
  /**
   * The plan's list figure per month on QUARTERLY billing, in rupees — the
   * brief's price (95000 for "₹95K"). Everything shown is worked out from it
   * in lib/money: ₹1 off, monthly billing +10%, the quarter paid upfront.
   */
  rate: number;
  features: string[];
  cta: Cta;
  /** The featured tier takes the brand fill; the rest stay glass. */
  featured?: boolean;
  /** A line for the whole grid, printed once under the cards. */
  note?: string;
  /**
   * What this plan includes and what it does not, shown inside the card when
   * a reader opens "View What's Included". `true` is included, `false` is
   * not, and a string is included in that limited form ("Basic AI voiceover").
   */
  inclusions?: { item: string; included: boolean | string }[];
};

/**
 * The detailed side-by-side, shown only when a reader asks for it ("Compare
 * Plans … opens the full comparison table only for users who actually want
 * the detail").
 */
export type Comparison = {
  rows: { label: string; values: string[] }[];
  footnote?: string;
};

export type PlanGrid = {
  label: string;
  heading: string;
  headingAccent?: string;
  body: string[];
  plans: Plan[];
  /** Whether the Monthly / Quarterly switch is offered. */
  billing: boolean;
  /** "Quarterly plans are billed every 3 months." */
  billingNote?: string;
  footnote?: string;
  included?: { heading: string; sub?: string; lead?: string; items: string[] };
  compare?: Comparison & { lead?: string };
};

export type IconCard = {
  icon: IconName;
  label?: string;
  title: string;
  body?: string;
  /** Which video tiers get this, when not every tier does ("Premium & Advanced"). */
  tier?: string;
};

export type Steps = {
  label: string;
  heading: string;
  headingAccent?: string;
  body?: string[];
  steps: { title: string; body: string; icon?: IconName }[];
  capacity?: { heading: string; rows: string[] };
  note?: string;
};

export type Turnaround = {
  label: string;
  heading: string;
  body?: string;
  tiers: { time: string; title: string; items?: string[]; icon?: IconName }[];
  notes?: string[];
};

export type AddOns = {
  label: string;
  heading: string;
  body?: string;
  chips?: { label: string; icon?: IconName }[];
  button: string;
  items: { name: string; price: string; body?: string }[];
};

export type Closing = {
  label: string;
  heading: string;
  headingAccent?: string;
  body: string[];
  primary: Cta;
  secondary?: Cta;
  footnote?: string[];
};

export type Faq = { q: string; a: string[] };

/** The four verticals, keyed the way the tabs and the /pricing panel find them. */
export type VerticalKey = "influence" | "ai-labs" | "studios" | "brand-design";
