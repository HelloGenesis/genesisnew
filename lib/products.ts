/**
 * THE ONE-TIME PRODUCTS — Genesis's own listing (28 Sep 2026), verbatim:
 * four per division for AI Labs, Studios and Brand & Design, three for
 * Influence. Fifteen in all. They replace every add-on and every earlier
 * one-time product (the AI Content Starter, the Content Shoot packages, the
 * one-time projects rail); the memberships are untouched and live with each
 * division in lib/verticals.
 *
 * Fixed-price products end in "Buy Now" and "+ Add to Cart". The one whose
 * price depends on creators, scope, location or requirements — Influencer
 * Campaign Management — ends in "Book a 15-min Call" and is never in the
 * cart.
 *
 * `price` is the figure Genesis gave (₹24,999 → 24999), shown the house way
 * ("₹24,999/-") by lib/money. `inPerson` marks a product that needs a
 * physical shoot by a Genesis crew — Mumbai only, for now (lib/regions).
 */

import type { VerticalKey } from "./verticals/types";

export type OneTimeProduct = {
  vertical: VerticalKey;
  index: string;
  name: string;
  pitch: string;
  includes: readonly string[];
  /** Rupees, as sold. Absent where the price is quoted (`priceLabel`). */
  price?: number;
  priceLabel?: string;
  /** A line under the list — "No influencer posting included." */
  note?: string;
  /** Needs a physical shoot by a Genesis crew — Mumbai only, for now. */
  inPerson?: boolean;
  /** "buy": Buy Now + Add to Cart. "call": Book a 15-min Call. */
  cta: "buy" | "call";
};

export const products: readonly OneTimeProduct[] = [
  /* ------------------------------------------------------------ AI Labs */
  {
    vertical: "ai-labs",
    index: "01",
    name: "Build Your AI Avatar",
    price: 24999,
    pitch: "Turn a real person into a reusable AI avatar for future content.",
    includes: [
      "1 realistic AI avatar",
      "Avatar setup & visual calibration",
      "Basic voice setup",
      "1 test video",
      "1 revision",
      "Avatar ready for future AI content production",
    ],
    cta: "buy",
  },
  {
    vertical: "ai-labs",
    index: "02",
    name: "AI Video Pack",
    price: 39999,
    pitch: "Three ready-to-publish AI videos without organising a traditional shoot.",
    includes: [
      "3 AI videos",
      "Up to 30 sec each",
      "Ideation",
      "Scriptwriting",
      "AI production",
      "Basic AI voiceover",
      "Background music",
      "Captions",
      "Brand styling",
      "9:16 delivery",
      "1 revision per video",
    ],
    cta: "buy",
  },
  {
    vertical: "ai-labs",
    index: "03",
    name: "AI Product Explainer",
    price: 44999,
    pitch: "Explain your product, service or feature through a polished AI-powered video.",
    includes: [
      "1 AI explainer video",
      "Up to 60 sec",
      "Concept & scripting",
      "AI visual production",
      "Product / brand integration",
      "AI voiceover",
      "Motion graphics",
      "Music & sound treatment",
      "Captions & supers",
      "9:16 master",
      "1 revision",
    ],
    cta: "buy",
  },
  {
    vertical: "ai-labs",
    index: "04",
    name: "AI Campaign Film",
    price: 67999,
    pitch: "A premium AI-produced film built around one campaign idea.",
    includes: [
      "Creative concept",
      "Scriptwriting",
      "Advanced AI production",
      "Custom AI scenes",
      "Product / brand integration",
      "Advanced motion & compositing",
      "Voiceover",
      "Music & sound design",
      "Captions & supers",
      "1 hero film",
      "Up to 60–75 sec",
      "2 revisions",
    ],
    cta: "buy",
  },

  /* ------------------------------------------------------------ Studios */
  {
    vertical: "studios",
    index: "01",
    name: "Reel Editing Pack",
    price: 24999,
    pitch: "Turn your existing footage into polished short-form content.",
    includes: [
      "Up to 5 edited reels",
      "Client-supplied footage",
      "Up to 30–45 sec each",
      "Video editing",
      "Captions",
      "Branding",
      "Basic motion graphics",
      "Background / licensed music",
      "Basic colour correction",
      "Primary 9:16 exports",
      "1 revision per reel",
    ],
    cta: "buy",
  },
  {
    vertical: "studios",
    index: "02",
    name: "Founder / CEO Video Shoot",
    price: 44999,
    pitch: "A professional talking-head production setup for founders, CEOs and spokespersons.",
    includes: [
      "Professional camera setup",
      "2-point soft lighting",
      "Lapel microphone",
      "Teleprompter + operator",
      "Videographer + assistant",
      "On-location shoot",
      "1 final edited video",
      "Up to 3–4 min final output",
      "Audio clean-up",
      "Colour correction",
      "Basic graphics & supers",
    ],
    inPerson: true,
    cta: "buy",
  },
  {
    vertical: "studios",
    index: "03",
    name: "Half-Day Content Shoot",
    price: 59999,
    pitch: "Capture a bank of branded content in one focused shoot.",
    includes: [
      "Up to 5-hour shoot",
      "1 camera setup",
      "1 location",
      "Content planning",
      "Shoot planning",
      "Up to 4 short-form videos",
      "10 edited photographs",
      "Basic lighting & audio",
      "Video editing",
      "Captions & branding",
      "9:16 exports",
    ],
    inPerson: true,
    cta: "buy",
  },
  {
    vertical: "studios",
    index: "04",
    name: "Event Content Coverage",
    price: 74999,
    pitch: "Capture the key moments, people and energy of your event.",
    includes: [
      "Up to 4 hours of coverage",
      "Video coverage",
      "Candid photography",
      "Stage / speaker moments",
      "Audience reactions",
      "Guest interactions",
      "1 event aftermovie",
      "25 edited photographs",
      "Basic colour correction",
      "Music & branded edit",
    ],
    inPerson: true,
    cta: "buy",
  },

  /* ----------------------------------------------------- Brand & Design */
  {
    vertical: "brand-design",
    index: "01",
    name: "Logo Refresh",
    price: 24999,
    pitch: "Modernise an existing logo without rebuilding your entire brand.",
    includes: [
      "Existing logo review",
      "Creative direction",
      "Logo refinement / redesign",
      "Colour refinement",
      "Typography refinement",
      "Primary logo",
      "Secondary logo variation",
      "PNG / JPG / SVG / PDF exports",
      "2 revision rounds",
    ],
    cta: "buy",
  },
  {
    vertical: "brand-design",
    index: "02",
    name: "Campaign Creative Kit",
    price: 29999,
    pitch: "Build the core visual system for your next campaign.",
    includes: [
      "1 key visual",
      "Campaign visual direction",
      "5 campaign creatives",
      "Brand typography & colour styling",
      "Up to 3 selected adaptations",
      "Social-ready exports",
      "2 revision rounds",
    ],
    cta: "buy",
  },
  {
    vertical: "brand-design",
    index: "03",
    name: "Pitch Deck Makeover",
    price: 34999,
    pitch: "Turn your existing content into a polished, structured and on-brand presentation.",
    includes: [
      "Up to 15 slides",
      "Presentation design direction",
      "Complete layout redesign",
      "Typography styling",
      "Colour system",
      "Charts / infographic styling",
      "Image treatment",
      "Editable final presentation",
      "PDF export",
      "2 revision rounds",
    ],
    cta: "buy",
  },
  {
    vertical: "brand-design",
    index: "04",
    name: "Marketing Launch Kit",
    price: 39999,
    pitch: "Everything visually needed to launch one product, service or campaign.",
    includes: [
      "1 hero key visual",
      "5 social creatives",
      "2 story adaptations",
      "1 digital banner",
      "1 email / mailer creative",
      "Campaign design system",
      "Brand styling",
      "Ready-to-publish exports",
      "2 revision rounds",
    ],
    cta: "buy",
  },

  /* ---------------------------------------------------------- Influence */
  {
    vertical: "influence",
    index: "01",
    name: "UGC Starter Pack",
    price: 39999,
    pitch: "Three creator-style videos designed to feel native, relatable and ready for social.",
    includes: [
      "3 UGC videos",
      "Phone-shot production",
      "Creator coordination",
      "Brief development",
      "Scripting support",
      "Product / service integration",
      "Video editing",
      "Captions",
      "Basic music & sound",
      "9:16 delivery",
      "1 revision per video",
    ],
    note: "No influencer posting included.",
    cta: "buy",
  },
  {
    vertical: "influence",
    index: "02",
    name: "UGC Performance Pack",
    price: 64999,
    pitch: "Six phone-shot UGC videos built with multiple hooks, angles and messages for paid or organic use.",
    includes: [
      "6 UGC videos",
      "Phone-shot production",
      "Creator coordination",
      "Multiple content hooks & angles",
      "Scripting",
      "Product / service integration",
      "Full video editing",
      "Captions & supers",
      "Music & sound treatment",
      "Paid-social-ready exports",
      "9:16 delivery",
      "1 revision per video",
    ],
    note: "No influencer posting included.",
    cta: "buy",
  },
  {
    vertical: "influence",
    index: "03",
    name: "Influencer Campaign Management",
    priceLabel: "15% Agency Commission + Creator Fees",
    pitch: "Run an end-to-end influencer campaign with Genesis managing everything from creator discovery through reporting.",
    includes: [
      "Campaign strategy",
      "Creator discovery",
      "Creator verification",
      "Shortlisting",
      "Creator outreach",
      "Rate negotiation",
      "Briefing",
      "Content coordination",
      "Approval management",
      "Posting coordination",
      "Campaign tracking",
      "Final campaign report",
    ],
    note: "Creator fees are separate and depend on the creators selected, deliverables, platform and usage rights.",
    cta: "call",
  },
];

export const productsFor = (vertical: VerticalKey) => products.filter((product) => product.vertical === vertical);

/** The lowest one-time price on the site — what "from" means for one-time work. */
export const lowestProductPrice = Math.min(...products.flatMap((product) => (product.price ? [product.price] : [])));
