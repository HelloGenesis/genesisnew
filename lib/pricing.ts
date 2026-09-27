/**
 * Genesis's pricing — what is shared across the four verticals.
 *
 * EVERY STRING HERE IS GENESIS'S OWN, from "Website - Vertical pages pricing
 * Design and copy" (the vertical-pages brief), which replaces the earlier
 * pricing brief. Each vertical's plans, add-ons and page copy live in
 * lib/verticals/<vertical>.ts; this file holds what they all lean on — the
 * links, the /pricing page, the one-time projects and the footer calendar.
 *
 * TWO KINDS OF LINK ARE STILL TO COME from Genesis and are left empty on
 * purpose:
 *
 *   `bookingUrl` — the 15-minute calendar. Until it exists the footer
 *                  calendar still lets a visitor pick a day and a time, and
 *                  sends that slot to Genesis on WhatsApp.
 *   `joinUrls`   — a Razorpay link per plan ("Start Starter →" and the rest).
 *
 * Empty, a button opens the WhatsApp chat with a message naming what was
 * clicked, which is how every other contact CTA on the site behaves. Paste a
 * link in and the button goes straight there instead.
 */

import { whatsappLink } from "./site-config";
import type { VerticalKey } from "./verticals/types";

/** The 15-minute call calendar. TODO(genesis): paste the booking link. */
export const bookingUrl = "";

/**
 * Razorpay links, by "<vertical>:<plan>" — e.g. "ai-labs:Starter".
 * TODO(genesis): paste each plan's payment link.
 */
export const joinUrls: Record<string, string> = {};

/*
  WHERE A BUTTON GOES WHILE ITS REAL LINK IS MISSING.

  The message only names what was clicked — the plan or product, in the
  brief's own words — so the first reply does not have to ask. It is the
  visitor's compose box, not page copy.
*/
function chat(message: string) {
  return whatsappLink(message) ?? "/#contact";
}

export function bookingHref(subject = "Genesis Media") {
  return bookingUrl || chat(`Hi Genesis! I'd like to book a 15-minute call about ${subject}.`);
}

/** A plan's own button: its Razorpay link, or a chat naming the plan. */
export function joinHref(vertical: VerticalKey, plan: string, product: string) {
  return joinUrls[`${vertical}:${plan}`] || chat(`Hi Genesis! I'd like to start ${product} — ${plan}.`);
}

export function enquiryHref(subject: string) {
  return chat(`Hi Genesis! I'm interested in ${subject}.`);
}

/** A slot picked on the footer calendar, sent as a chat until the calendar is live. */
export function slotHref(slot: string) {
  return chat(`Hi Genesis! I'd like to book a 15-minute call on ${slot}.`);
}

/*
  THE QUARTERLY LINE. The brief: "when Quarterly is selected … the cards
  change to show, for example: ₹95K/mo, ₹2.85L billed quarterly, rather than
  making the user calculate it." No discount is applied — none is defined —
  so a quarter is three months, written the way the brief writes money.
*/
export function formatInr(rupees: number) {
  if (rupees >= 100000) {
    const lakh = rupees / 100000;
    return `₹${Number(lakh.toFixed(2)).toString()}L`;
  }
  return `₹${Math.round(rupees / 1000)}K`;
}

export function quarterlyLine(monthly: number) {
  return `${formatInr(monthly * 3)} billed quarterly`;
}

/**
 * The four verticals as one row of cards — the /pricing page's opening, which
 * the brief calls the "vibe" of the page, and the price line under each name
 * on the Brain.
 *
 * THE FIGURES ARE THE NEW BRIEF'S. The earlier cards read ₹69k / ₹79k / ₹89k /
 * ₹59k; the plans this brief defines start at ₹95K (AI Labs), ₹85K (Studios)
 * and ₹65K (Brand & Design), and Influence is now priced as a commission
 * rather than a membership. A "from" figure lower than the cheapest plan on
 * the same page would be a price nobody can buy, so these follow the plans.
 */
export const verticalCards: {
  key: VerticalKey;
  /** The key DivisionLockup files the division's name artwork under. */
  short: string;
  name: string;
  href: string;
  blurb: string;
  fromLabel: string;
  from: string;
  /** The line under the division's name on the Brain. */
  brain: string;
}[] = [
  {
    key: "influence",
    short: "Influence",
    name: "Genesis Influence",
    href: "/influencer-marketing",
    blurb: "Creator sourcing, negotiation and campaign management.",
    fromLabel: "Agency commission",
    from: "15% + creator fees",
    brain: "Creator fees + 15% commission",
  },
  {
    key: "ai-labs",
    short: "AI Lab",
    name: "Genesis AI Labs",
    href: "/ai-content-automation",
    blurb: "AI avatars, AI video, product visuals and automated content.",
    fromLabel: "Membership from",
    from: "₹95K/month",
    brain: "Membership from ₹95K/month",
  },
  {
    key: "studios",
    short: "Studios",
    name: "Genesis Studios",
    href: "/content-production",
    blurb: "Shoots, reels, editing and content production.",
    fromLabel: "Membership from",
    from: "₹85K/month",
    brain: "Membership from ₹85K/month",
  },
  {
    key: "brand-design",
    short: "Brand & Design",
    name: "Genesis Brand & Design",
    href: "/brand-design",
    blurb: "Design, campaigns, decks, collateral and brand systems.",
    fromLabel: "Membership from",
    from: "₹65K/month",
    brain: "Membership from ₹65K/month",
  },
];

export function verticalCard(key: VerticalKey) {
  return verticalCards.find((card) => card.key === key)!;
}

/** The /pricing page, in the brief's words. */
export const pricingHub = {
  label: "Memberships",
  heading: "One team. One monthly fee.",
  headingAccent: "A constantly moving creative queue.",
  body: "Add requests whenever you need them. We work through your active queue based on your membership, send work for review, complete revisions and move to the next request.",
  plans: {
    label: "Genesis Memberships",
    heading: "Choose your creative team.",
  },
  /*
    THE THREE WAYS GENESIS CHARGES, SAID ONCE, before the tabs — so a reader
    who opens Influence and finds a commission instead of a membership is
    not surprised by it.
  */
  models: [
    {
      label: "One-time project",
      bestFor: "Trying Genesis, or a single brief.",
      price: "From ₹25K",
      tab: null,
    },
    {
      label: "Membership",
      bestFor: "Content, AI or design every month.",
      price: "From ₹65K/month",
      tab: "ai-labs",
    },
    {
      label: "Commission",
      bestFor: "Running an influencer campaign.",
      price: "Creator fees + 15%",
      tab: "influence",
    },
  ],
  /* From the first pricing brief — "How Genesis Memberships Work". */
  steps: {
    heading: "How Genesis Memberships Work",
    items: [
      { title: "Subscribe", body: "Choose the creative capability you need." },
      { title: "Add requests", body: "Submit as many requests to your queue as you like." },
      { title: "We create", body: "We work through them based on your membership's capacity." },
      { title: "Review & repeat", body: "Approve, revise, and move on to the next request." },
    ],
    note: "Onboarding typically starts after successful payment and receipt of the required brand assets and brief.",
  },
  oneTime: {
    label: "One-time projects",
    heading: "Need a one-time project instead?",
    body: "From campaign sprints to brand identity, we offer clearly scoped, one-time projects.",
  },
} as const;

/**
 * The one-time projects slider on /pricing. The brief marks this block
 * "FINAL PRICING PAGE WILL BE GIVEN — ADD THIS AS OF NOW", so it is the
 * mockup's five cards as drawn, each opening a chat about that project.
 */
export const oneTimeProjects: {
  name: string;
  body: string;
  from: string;
  vertical: VerticalKey;
  image: string;
}[] = [
  {
    name: "Performance Creative Sprint",
    body: "Ad creatives for performance marketing.",
    from: "₹35K",
    vertical: "studios",
    image: "/work/posters/studios-b1.jpg",
  },
  {
    name: "AI Avatar Setup",
    body: "Create a realistic AI avatar for your brand.",
    from: "₹25K",
    vertical: "ai-labs",
    image: "/avatars/tanvi.jpg",
  },
  {
    name: "Brand Launch",
    body: "Complete brand identity and guidelines.",
    from: "₹95K",
    vertical: "brand-design",
    image: "/brand/activ-health/1.png",
  },
  {
    name: "Logo / Identity",
    body: "Logo and identity design projects.",
    from: "₹50K",
    vertical: "brand-design",
    image: "/brand/activ-health/5.png",
  },
  {
    name: "AI Films",
    body: "AI-powered brand films and explainers.",
    from: "₹1.5L",
    vertical: "ai-labs",
    image: "/work/posters/ai-lab-shivam-sh1.jpg",
  },
];

/**
 * The calendar at the head of every footer — "ADD A CALENDAR ON ALL THE
 * FOOTERS (KEEP THIS SAME EVERYWHERE)", with the Genesis Media logo where the
 * reference had its illustration.
 */
export const bookingCalendar = {
  heading: "Discover If Genesis Media Is the Perfect Match for You",
  headingAccent: "(It Truly Is)",
  body: "Schedule a brief 15-minute guided call through GenesisMedia.",
  /*
    THE BOOKABLE HOURS ARE A PLACEHOLDER until the real calendar is linked:
    weekdays, 11:00 to 18:00 IST, every 30 minutes. Nothing is reserved by
    picking one — the slot is sent to Genesis on WhatsApp to confirm.
  */
  slots: ["11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"],
  timezone: "IST",
  /*
    "REQUEST", NOT "BOOK", while there is no calendar behind it — a picked slot
    is a WhatsApp message, and a button that says "Book" promises a
    confirmed booking the page cannot make. Switches to `confirmLive` the
    moment `bookingUrl` is set.
  */
  confirm: "Request this slot",
  confirmLive: "Book a 15-minute call",
  pending: "We'll confirm your slot on WhatsApp.",
} as const;

/**
 * The line under the orb — the earlier pricing brief's homepage hero, which
 * the new brief keeps: "just keep section 1 as the same". Its first button now
 * opens /pricing, where the memberships live.
 */
export const homeHero = {
  heading: "Your creative team.",
  headingAccent: "On demand.",
  body: "Influence, AI, Content Production and Design — available through flexible Genesis memberships or one-time projects.",
  explore: "Explore Memberships",
  start: "Start a Project",
  /*
    THE WAY IN, IN ONE LINE. The orb's price buttons only appear on hover, so
    on a phone the homepage never said what Genesis costs. ₹25K is the
    lowest entry Genesis has set (AI Avatar Setup, a one-time project); ₹65K
    is the lowest membership (Creative Desk).
  */
  entry: "Projects from ₹25K · Memberships from ₹65K/month",
} as const;

/**
 * THE TERMS, UNDER EVERY PLAN GRID — the reassurance a buyer looks for
 * before committing to a monthly fee. Each line is Genesis's own, from the
 * first pricing brief's FAQ and its GST note.
 */
export const planTerms = [
  "Monthly memberships can be stopped before the next billing cycle.",
  "Where available, memberships can be paused.",
  "All membership prices are exclusive of GST.",
] as const;

/**
 * WHAT THE PLAN WORDS MEAN. A buyer who does not understand the unit will
 * not pay for it, and "active request" in particular decides how much a
 * membership delivers. Only terms the brief itself defines are here; its
 * wording, lightly joined. TODO(genesis): define "adaptation" and
 * "premium" vs "standard" video, which the brief uses but never explains.
 */
export const planGlossary = [
  {
    term: "Active request",
    meaning:
      "How many pieces we work on at the same time. Your queue can keep growing; your active request limit determines how many pieces we work on simultaneously.",
  },
  {
    term: "Campaign creatives",
    meaning:
      "Finished static marketing assets created around your campaign, product, offer or brand message.",
  },
  {
    term: "Advanced / motion-heavy videos",
    meaning: "Advanced AI production, heavier animation and complex visual treatments.",
  },
] as const;

/** The lowest price a buyer can start at — Genesis's entry pricing. */
export const entryPrice = "₹25K";
