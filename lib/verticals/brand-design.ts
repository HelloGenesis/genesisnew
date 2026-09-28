/**
 * Genesis Brand & Design — /brand-design.
 *
 * Verbatim from the vertical-pages brief ("GENESIS BRAND & DESIGN", sections
 * 01–09). The brief's own note on the mockup — "Missed one point here.
 * 48-hour delivery timeline in 65k monthly design" — is honoured by the
 * Creative Desk card carrying its delivery line, which the mockup dropped.
 */

import { monthlyListFigure, price } from "../money";
import { enquiryHref, joinHref } from "../pricing";
import type { AddOns, Closing, IconCard, Steps, Turnaround } from "./types";

const DESK = "Genesis Creative Desk";
const BUILD = "Genesis Brand Build";

export const deskHref = joinHref("brand-design", "Creative Desk", DESK);
export const buildHref = enquiryHref(BUILD);

export const designHero = {
  label: "Genesis Brand & Design",
  heading: "Your creative team.",
  headingLine2: "Without the",
  headingAccent: "hiring queue.",
  lead: "Get ongoing design support for the everyday creative requirements your marketing team needs to keep moving.",
  body: "Add requests whenever you need them. We work through your active queue, send work for review, complete revisions and move straight to the next.",
  primary: "Start Creative Desk",
  secondary: "Explore Brand Build",
  strip: [
    { label: "Social", icon: "grid" },
    { label: "Ads", icon: "megaphone" },
    { label: "Campaigns", icon: "target" },
    { label: "Presentations", icon: "presentation" },
    { label: "Emailers", icon: "mail" },
    { label: "Brand Systems", icon: "palette" },
  ],
  images: ["/brand/activ-health/5.png", "/brand/activ-health/2.png", "/brand/activ-health/1.png"],
} as const;

/*
  THE TWO PRODUCTS, AS PLANS.

  THE MEMBERSHIP IS NAMED "ALWAYS-ON" (Genesis asked for a meaningful name for
  the ₹65K package, 28 Sep 2026). It says the one thing that separates it from
  a project: the design team keeps running for you, month after month. The
  product is still the Genesis Creative Desk; Always-On is its plan, the way
  AI Labs and Studios have Starter / Growth / Enterprise.

  Every line under each plan is the brief's own; only the layout changed.
*/
export const designProducts = {
  label: "Our products",
  heading: "Two ways to work with us.",
  body: "Ongoing creative support or a complete brand identity — choose what your business needs right now.",
  desk: {
    eyebrow: "01 — Genesis Creative Desk",
    name: "Always-On",
    badge: "Membership",
    tagline: "Ongoing creative support for your brand.",
    body: "A monthly subscription for the design work your marketing team needs — from everyday social creatives and ads to campaigns, presentations and collateral.",
    /* The list figure per month on quarterly billing — see lib/money. */
    rate: 65000,
    highlights: [
      { icon: "queue", label: "Requests", value: "Unlimited in your queue" },
      { icon: "layers", label: "Active", value: "1 request at a time" },
      { icon: "palette", label: "Brand", value: "1 primary brand" },
      { icon: "clock", label: "Delivery", value: "Typically 48–72 hrs for standard requests" },
      { icon: "check", label: "Quotes", value: "No quotation for every creative" },
    ] satisfies { icon: IconCard["icon"]; label: string; value: string }[],
    cta: { label: "Start Creative Desk", href: deskHref },
  },
  build: {
    eyebrow: "02 — Genesis Brand Build",
    name: "Brand Build",
    badge: "One-time project",
    tagline: "Complete brand identity and guidelines.",
    body: "A structured one-time engagement for businesses launching, repositioning or upgrading their brand.",
    from: price(150000),
    points: [
      "Brand strategy & positioning",
      "Visual identity & logo system",
      "Colour & typography",
      "Brand voice & messaging direction",
      "Brand guidelines",
      "Selected launch applications",
    ],
    facts: ["Typical timeline: 3–4 weeks", "2 consolidated identity revision rounds"],
    cta: { label: "Build My Brand", href: "#brand-build" },
  },
} as const;

export const designIncluded: {
  label: string;
  heading: string;
  body: string;
  groups: { icon: IconCard["icon"]; title: string; lead?: string; items: string[] }[];
  elsewhere: { heading: string; items: { what: string; where: string }[] };
} = {
  label: "What's included",
  heading: "Everything your marketing team needs.",
  body: "One creative partner for your everyday marketing requirements.",
  groups: [
    { icon: "grid", title: "Social & Digital", items: ["Static social creatives", "Instagram & LinkedIn posts", "Stories", "Carousels", "Banners", "Digital assets"] },
    { icon: "megaphone", title: "Performance Creative", items: ["Static ad creatives", "Performance ads", "Ad variations", "Campaign adaptations"] },
    { icon: "presentation", title: "Presentations", items: ["Sales decks", "Company presentations", "Credentials decks", "Internal decks", "Presentation redesign"] },
    { icon: "mail", title: "Marketing Design", items: ["Emailers", "One-pagers", "Sales collateral", "Brochures", "Flyers", "Event creatives"] },
    { icon: "target", title: "Campaign Design", items: ["Campaign adaptations", "Promotional assets", "Launch creatives", "Existing campaign extensions"] },
    {
      icon: "palette",
      title: "Brand Applications",
      lead: "Apply your existing identity across new formats.",
      items: ["Typography", "Colour", "Graphic systems", "Templates", "Collateral"],
    },
    { icon: "motion", title: "Basic Motion", items: ["Simple animated posts", "Basic text animation", "Lightweight motion creatives"] },
  ],
  /*
    WHAT ALWAYS-ON DOES NOT COVER, AND WHERE IT LIVES INSTEAD — the brief's
    "Not included" list, each pointed at the product or add-on that does it,
    so a reader who wanted a logo or a landing page is not turned away.
  */
  elsewhere: {
    heading: "Not in Always-On — but we do it",
    items: [
      { what: "Logos & full brand identity", where: "Brand Build" },
      { what: "Landing page design", where: "Add-on" },
      { what: "Pitch deck design", where: "Add-on" },
      { what: "Video production", where: "Genesis Studios" },
      { what: "Advanced animation / 3D", where: "Not included" },
      { what: "Web development", where: "Not included" },
    ],
  },
};

export const designHowItWorks: Steps = {
  label: "How it works",
  heading: "Add requests.",
  headingAccent: "We keep it moving.",
  body: ["Your team can keep multiple requirements in your queue.", "We work on one active request at a time."],
  steps: [
    { title: "Add to Queue", body: "Share your brief, references, copy and requirements.", icon: "queue" },
    { title: "We Design", body: "Our creative team turns the brief into polished brand-ready work.", icon: "create" },
    { title: "Review", body: "Review the work and send consolidated feedback.", icon: "review" },
    { title: "Next Request", body: "Once approved or completed, we move directly to the next priority.", icon: "repeat" },
  ],
  note: "Add as many upcoming requests as you need. We simply work through them one at a time.",
};

export const designOverview = {
  label: "Plan overview",
  heading: "Genesis Creative Desk.",
  body: ["One subscription.", "Everything you need."],
  price: price(65000),
  priceSuffix: "per month + GST, billed quarterly",
  monthlyNote: `Monthly billing: ${price(monthlyListFigure(65000))} per month + GST`,
  rows: [
    { label: "Requests", value: "Unlimited in queue" },
    { label: "Active Requests", value: "1 at a time" },
    { label: "Brands", value: "1 primary brand" },
    { label: "Typical Delivery", value: "48–72 hrs for standard requests" },
    { label: "Revisions", value: "2 consolidated rounds" },
    { label: "Social & Digital", value: "Included" },
    { label: "Performance Creative", value: "Included" },
    { label: "Carousels & Emailers", value: "Included" },
    { label: "Presentations", value: "Included" },
    { label: "Campaign Adaptations", value: "Included" },
    { label: "Basic Motion", value: "Included" },
    { label: "Brand Applications", value: "Included" },
  ],
  notIncludedLabel: "Not included",
  notIncluded: ["Full brand creation", "Video production", "Web development", "Advanced animation / 3D"],
  cta: "Start Creative Desk",
} as const;

export const designTurnaround: Turnaround = {
  label: "Turnaround",
  heading: "Designed to keep marketing moving.",
  tiers: [
    { time: "1–2 Business Days", title: "Standard Creative", items: ["Static posts", "Stories", "Banners", "Simple ads", "Simple adaptations"], icon: "images" },
    { time: "2–3 Business Days", title: "Medium Request", items: ["Carousels", "Emailers", "Presentation sections", "Brochure page sets"], icon: "layers" },
    { time: "3–5 Business Days", title: "Larger / Complex Request", items: ["Campaign key visuals", "Motion creatives", "Large deck sections", "Complex collateral"], icon: "bolt" },
  ],
  notes: [
    "Larger requests are broken into manageable milestones so work keeps moving instead of waiting for one massive delivery.",
  ],
};

export const designAddOns: AddOns = {
  label: "Add-ons",
  heading: "Need something extra?",
  body: "Add specialist work when your brief goes beyond your everyday Creative Desk subscription.",
  chips: [
    { label: "Additional Brand", icon: "plus" },
    { label: "Campaign Concept Sprint", icon: "target" },
    { label: "Pitch Deck Design", icon: "presentation" },
    { label: "Landing Page Design", icon: "grid" },
    { label: "Motion Creative Pack", icon: "motion" },
    { label: "Rush Production", icon: "bolt" },
  ],
  button: "View Add-ons",
  items: [
    { name: "Additional Brand", price: `${price(20000)} per month`, body: "Add another brand or visual system to your Creative Desk." },
    { name: "Campaign Concept Sprint", price: `From ${price(35000)}`, body: "Campaign idea, visual direction, key visual and basic campaign system." },
    { name: "Pitch Deck Design", price: `From ${price(45000)}`, body: "Premium presentation design for sales, credentials or investor decks. Up to approximately 15 slides." },
    { name: "Landing Page Design", price: `From ${price(75000)}`, body: "Strategic landing-page UI and visual design. Development separate." },
    { name: "Motion Creative Pack", price: price(40000), body: "Up to 4 lightweight motion creatives." },
    { name: "Rush Production", price: "+30%", body: "Priority production where capacity allows." },
  ],
};

export const brandBuild = {
  label: "Genesis Brand Build",
  heading: "Building something new?",
  headingAccent: "Build the system first.",
  body: "Create a recognisable brand foundation before scaling the content around it.",
  groups: [
    {
      title: "Brand Foundation",
      items: ["Discovery", "Positioning direction", "Brand personality", "Brand attributes", "Tone of voice", "Messaging direction"],
    },
    {
      title: "Visual Identity",
      items: ["Logo system", "Primary & secondary lockups", "Colour palette", "Typography", "Graphic language", "Visual direction"],
    },
    {
      title: "Brand Guidelines",
      items: ["Logo usage", "Colour rules", "Typography hierarchy", "Visual system", "Graphic rules", "Basic image direction", "Do's & don'ts"],
    },
    {
      title: "Launch Applications",
      lead: "Selected launch-ready assets such as:",
      items: ["Business cards", "Letterheads", "Social templates", "Email signatures", "Presentation covers", "Digital banners"],
    },
  ],
  price: `From ${price(150000)} + GST`,
  facts: ["Typical timeline: 3–4 weeks", "2 consolidated identity revision rounds"],
  cta: { label: "Build My Brand", href: buildHref },
  /* Activ Health's logo redesign, sketch to final — Genesis's own identity work. */
  images: ["/brand/activ-health/1.png", "/brand/activ-health/3.png", "/brand/activ-health/5.png"],
} as const;

export const designClosing: Closing = {
  label: "Genesis Brand & Design",
  heading: "Your marketing team",
  headingAccent: "shouldn't wait for design.",
  body: [
    "Add the brief. We take it from there.",
    "One creative subscription for the everyday work that keeps your brand moving.",
    `${price(65000)} per month + GST · One active request at a time.`,
  ],
  primary: { label: "Start Creative Desk", href: deskHref },
  secondary: { label: "Build My Brand", href: "#brand-build" },
  footnote: ["Ideas. Design. Campaigns. Everywhere."],
};

export const designTab = {
  label: "Genesis Brand & Design",
  heading: "Creative Desk & Brand Build",
  sub: "Two ways to work with us.",
  body: "Ongoing creative support or a complete brand identity — choose what your business needs right now.",
};
