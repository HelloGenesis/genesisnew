/**
 * Genesis memberships and one-time products — the MRR model.
 *
 * EVERY STRING HERE IS GENESIS'S OWN, copied from "Website - Vertical pages
 * pricing Design and copy" (the pricing brief). Nothing is paraphrased and
 * nothing is invented: if a price, an inclusion or a button label is not in
 * that document it is not on these pages. Change the copy here and the four
 * vertical pages follow.
 *
 * TWO LINKS ARE STILL TO COME from Genesis and are left empty on purpose:
 *
 *   `bookingUrl` — the 15-minute calendar every page closes with.
 *   `joinUrl`    — each membership's Razorpay link ("Join today").
 *
 * Empty, a button falls back to the WhatsApp chat with a message naming what
 * was clicked, which is how every other contact CTA on the site already
 * behaves. Paste the link in and the button goes straight there instead.
 */

import { whatsappLink } from "./site-config";

/** The 15-minute call calendar. TODO(genesis): paste the booking link. */
export const bookingUrl = "";

export type PricingSlug = "influence" | "ai-labs" | "studios" | "brand-design";

export type OneTimeProduct = {
  name: string;
  price: string;
  lead?: string;
  body?: string[];
  includesLabel?: string;
  includes?: string[];
  cta: string;
};

export type Membership = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  description: string;
  /** Heading over the inclusions list — the brief words it per vertical. */
  includedHeading: string;
  included: string[];
  /** Short lines printed above the list (Design Desk's queue rules). */
  includedLead?: string[];
  turnaround?: { heading: string; rows: { label: string; value: string }[]; notes?: string[] };
  revisions?: string[];
  notIncluded: string;
  quarterly: { price: string; note?: string };
  cta: string;
  /** Razorpay link. TODO(genesis): paste the link for this membership. */
  joinUrl: string;
};

export type VerticalPricing = {
  slug: PricingSlug;
  /** "Genesis Influence" — the brief's own heading for the vertical. */
  division: string;
  /** The key DivisionLockup files the division's artwork under. */
  short: string;
  /** The existing division page, where the work lives. */
  workHref: string;
  /** The homepage card: the brief's one-line summary and its price button. */
  home: { blurb: string; from: string };
  membership: Membership;
  /** Anything the brief prints between the membership and its CTA. */
  addOns?: { name: string; price: string; body?: string[] }[];
  credits?: {
    heading: string;
    sub: string;
    tiers: { credits: string; items: string[] }[];
    examples: string[];
    examplesOutro: string;
  };
  oneTimeHeading: string;
  oneTime: OneTimeProduct[];
};

export const verticals: VerticalPricing[] = [
  {
    slug: "influence",
    division: "Genesis Influence",
    short: "Influence",
    workHref: "/influencer-marketing",
    home: {
      blurb: "Creator sourcing, negotiation and campaign management.",
      from: "Membership from ₹69k/month",
    },
    membership: {
      name: "Influence Desk",
      price: "₹69,000",
      period: "/ month",
      tagline: "Your influencer marketing desk, on demand.",
      description:
        "Send us your campaign brief. We handle creator discovery, outreach, negotiation, coordination and campaign management while your team stays focused on the brand.",
      includedHeading: "What's included",
      included: [
        "Unlimited campaign briefs in your queue",
        "One active campaign workflow at a time",
        "Creator discovery and research",
        "Up to 25 shortlisted profiles per standard brief",
        "Category, geography and audience filtering",
        "Creator outreach",
        "Rate collection",
        "Commercial negotiation",
        "Final shortlist",
        "Creator briefing",
        "Deliverable coordination",
        "Posting follow-ups",
        "Campaign tracker",
        "Basic campaign reporting",
        "Up to 10 actively managed creators at a time",
      ],
      turnaround: {
        heading: "Turnaround",
        rows: [{ label: "Initial shortlist for a standard brief:", value: "1–3 business days" }],
        notes: ["Creator response and final costing timelines depend on creator availability."],
      },
      notIncluded:
        "Creator fees, paid media, product shipping, travel, celebrity fees, production costs and extended usage-rights costs are billed separately.",
      quarterly: { price: "₹2,07,000 + GST" },
      cta: "Start Influence Desk",
      joinUrl: "",
    },
    addOns: [{ name: "Additional creator management", price: "₹3,000 / additional creator" }],
    oneTimeHeading: "One-Time Influence Products",
    oneTime: [
      {
        name: "Influencer Sourcing Sprint",
        price: "₹35,000",
        lead: "Need the right creators without full campaign management?",
        includesLabel: "Get:",
        includes: [
          "1 campaign brief",
          "up to 30 shortlisted creators",
          "profile links",
          "fit assessment",
          "rate/availability outreach",
          "final recommendation sheet",
        ],
        cta: "Start Sourcing Sprint",
      },
      {
        name: "Influencer Campaign Management",
        price: "From ₹50,000 + creator costs",
        body: [
          "For one-time influencer campaigns requiring creator sourcing, negotiation, coordination, approvals and campaign management.",
        ],
        cta: "Get Campaign Quote",
      },
      {
        name: "UGC Campaign",
        price: "Custom Pricing",
        body: [
          "Creator-led content built for organic social, performance ads or brand campaigns.",
          "Creator fees and production requirements are scoped separately.",
        ],
        cta: "Build a UGC Campaign",
      },
    ],
  },
  {
    slug: "ai-labs",
    division: "Genesis AI Labs",
    short: "AI Lab",
    workHref: "/ai-content-automation",
    home: {
      blurb: "AI avatars, AI video, product visuals and automated content.",
      from: "Membership from ₹79k/month",
    },
    membership: {
      name: "AI Content Engine",
      price: "₹79,000",
      period: "/ month",
      tagline: "Create more content without continuously shooting more content.",
      description:
        "Use AI avatars, generative visuals, AI video, motion design and automated content workflows to create branded content consistently.",
      includedHeading: "What's included",
      included: [
        "Unlimited AI content requests in your queue",
        "One active production request at a time",
        "AI image generation",
        "AI video generation",
        "AI avatar content",
        "Founder-led AI content",
        "Product integration",
        "Script assistance",
        "Authorized voice cloning",
        "Lip-sync and avatar videos",
        "Basic motion graphics",
        "Captions and subtitles",
        "Platform resizing",
        "1080p standard delivery",
      ],
      turnaround: {
        heading: "Typical turnaround",
        rows: [
          { label: "AI images and simple content:", value: "1–2 business days" },
          { label: "Standard AI video:", value: "2–4 business days" },
          { label: "Complex AI + motion content:", value: "5–7 business days" },
        ],
      },
      notIncluded:
        "Large-scale VFX, 3D, actors, physical shoots, premium third-party licenses, external voice artists and long-form film production.",
      quarterly: {
        price: "₹2,37,000 + GST",
        note: "Includes one AI Avatar Setup at no additional charge.",
      },
      cta: "Start AI Content Engine",
      joinUrl: "",
    },
    addOns: [
      {
        name: "AI Avatar Setup",
        price: "₹25,000 one-time setup",
        body: [
          "Real-person and virtual avatars can be added to your membership.",
          "Real-person avatars require consent and approved reference material.",
        ],
      },
    ],
    oneTimeHeading: "One-Time AI Products",
    oneTime: [
      {
        name: "AI Avatar Setup",
        price: "₹25,000",
        body: [
          "Build a realistic digital avatar for a founder, creator, executive or virtual brand character.",
        ],
        includesLabel: "Includes:",
        includes: [
          "avatar creation",
          "visual testing",
          "voice setup where applicable",
          "one test output",
          "base content configuration",
        ],
        cta: "Create My AI Avatar",
      },
      {
        name: "AI Creative Sprint",
        price: "₹35,000",
        body: ["A quick AI-powered campaign/content package."],
        includesLabel: "Includes:",
        includes: [
          "campaign direction",
          "AI visual concepts",
          "5 final AI creatives",
          "2 short AI video assets",
          "resizing for social",
          "one revision round",
        ],
        cta: "Start AI Creative Sprint",
      },
      {
        name: "AI Video",
        price: "From ₹25,000",
        body: [
          "Short-form AI-generated product, explainer, campaign or social videos.",
          "Pricing depends on duration and production complexity.",
        ],
        cta: "Create an AI Video",
      },
      {
        name: "AI + Motion Film",
        price: "From ₹45,000",
        body: [
          "Generative AI combined with motion graphics, typography and branded storytelling.",
        ],
        cta: "Start a Film",
      },
    ],
  },
  {
    slug: "studios",
    division: "Genesis Studios",
    short: "Studios",
    workHref: "/content-production",
    home: {
      blurb: "Shoots, reels, editing and content production.",
      from: "Membership from ₹89k/month",
    },
    membership: {
      name: "Content Studio",
      price: "₹89,000",
      period: "/ month",
      tagline: "Your flexible content production team.",
      description:
        "Use your monthly production capacity for reels, shoots, edits, social content and AI-assisted production based on what your brand needs that month.",
      includedHeading: "Included",
      included: [
        "content ideation",
        "scripts for selected content",
        "editing",
        "basic sound design",
        "captions/subtitles",
        "social resizing",
        "creative direction",
        "monthly production planning",
      ],
      notIncluded:
        "Actors, creators, models, studio rentals, travel outside agreed zones, specialist equipment, locations, sets, props, licensed music and large external production expenses.",
      quarterly: {
        price: "₹2,67,000 + GST",
        note: "Includes 3 bonus production credits in Month 1.",
      },
      cta: "Start Content Studio",
      joinUrl: "",
    },
    credits: {
      heading: "Includes 24 Production Credits every month",
      sub: "Choose how to use them.",
      tiers: [
        { credits: "1 Credit", items: ["static creative", "story set", "short-form script"] },
        { credits: "2 Credits", items: ["carousel", "basic reel edit", "AI-assisted reel"] },
        { credits: "3 Credits", items: ["premium reel edit", "advanced short-form edit"] },
        { credits: "5 Credits", items: ["short motion graphics asset"] },
        { credits: "6 Credits", items: ["half-day shoot", "talking-head shoot setup"] },
        { credits: "10 Credits", items: ["full-day shoot"] },
      ],
      examples: [
        "1 half-day shoot + 5 premium reels + 3 statics",
        "8 AI/basic reels + 4 carousels",
      ],
      examplesOutro: "or build your own combination.",
    },
    oneTimeHeading: "One-Time Studio Products",
    oneTime: [
      {
        name: "Performance Creative Sprint",
        price: "₹35,000",
        body: ["Built for brands running ads or needing fresh campaign creative quickly."],
        includesLabel: "Includes:",
        includes: [
          "5 static ad creatives",
          "story adaptations",
          "2 short 15–20 second videos",
          "AI image/video generation",
          "3 creative directions/hooks",
          "resizing",
          "one revision round",
        ],
        cta: "Start Creative Sprint",
      },
      {
        name: "Content Shoot",
        price: "From ₹45,000",
        body: [
          "A focused shoot for founder content, social campaigns, products, interviews or talking-head content.",
        ],
        cta: "Plan a Shoot",
      },
      {
        name: "Brand / Corporate Film",
        price: "Custom Pricing",
        body: [
          "For launch films, explainers, internal films, employer branding, testimonials and larger productions.",
        ],
        cta: "Discuss a Film",
      },
      {
        name: "Video Editing",
        price: "From ₹5,000",
        body: ["Short-form editing, social cut-downs, campaign adaptations and platform resizing."],
        cta: "Start an Edit",
      },
    ],
  },
  {
    slug: "brand-design",
    division: "Genesis Brand & Design",
    short: "Brand & Design",
    workHref: "/brand-design",
    home: {
      blurb: "Design, campaigns, decks, collateral and brand systems.",
      from: "Membership from ₹59k/month",
    },
    membership: {
      name: "Design Desk",
      price: "₹59,000",
      period: "/ month",
      tagline: "A design team without adding another full-time hire.",
      description:
        "Add as many design requests as you need to your queue. We work through them one at a time, complete revisions and move directly onto the next request.",
      includedLead: ["Unlimited requests in your queue", "One active request at a time."],
      includedHeading: "What you can request",
      included: [
        "social creatives",
        "performance ads",
        "carousels",
        "campaign key visuals",
        "emailers",
        "pitch decks",
        "presentation design",
        "brochures",
        "sales collateral",
        "business cards",
        "stationery",
        "event creatives",
        "digital banners",
        "packaging adaptations",
        "menus",
        "reports",
        "infographics",
        "basic motion creatives",
        "brand-system applications",
      ],
      turnaround: {
        heading: "Typical turnaround",
        rows: [{ label: "Most standard requests:", value: "48–72 hours" }],
        notes: ["Complex requests are broken into manageable milestones."],
      },
      revisions: [
        "Revisions are included while the request remains active.",
        "Once approved, we move to the next item in your queue.",
      ],
      notIncluded: "",
      quarterly: { price: "₹1,77,000 + GST" },
      cta: "Start Design Desk",
      joinUrl: "",
    },
    oneTimeHeading: "One-Time Brand & Design Products",
    oneTime: [
      {
        name: "Genesis Brand Launch",
        price: "₹95,000",
        body: ["Build the foundation your brand needs before marketing begins."],
        includesLabel: "Includes:",
        includes: [
          "brand discovery",
          "positioning direction",
          "logo system",
          "colour palette",
          "typography",
          "visual language",
          "brand personality",
          "tone of voice",
          "mission",
          "vision",
          "key messaging",
          "business card",
          "letterhead",
          "social templates",
          "essential brand guidelines",
        ],
        cta: "Launch My Brand",
      },
      {
        name: "Logo / Identity Refresh",
        price: "From ₹25,000",
        body: [
          "For brands that already exist but need a more relevant, polished or scalable visual identity.",
        ],
        cta: "Refresh My Identity",
      },
      {
        name: "Pitch Deck / Presentation Design",
        price: "From ₹15,000",
        body: [
          "Sales decks, investor presentations, company profiles and client-facing presentations designed to communicate clearly.",
        ],
        cta: "Design My Deck",
      },
      {
        name: "Campaign Design Sprint",
        price: "From ₹35,000",
        body: ["A focused visual system for a launch, seasonal campaign, offer or event."],
        cta: "Build a Campaign",
      },
    ],
  },
];

/** The copy every vertical page shares, in the brief's words. */
export const pricingCommon = {
  intro: {
    label: "Memberships",
    heading: "One team. One monthly fee.",
    headingAccent: "A constantly moving creative queue.",
    body: "Add requests whenever you need them. We work through your active queue based on your membership, send work for review, complete revisions and move to the next request.",
    points: [
      "No quotation for every small job.",
      "No searching for another freelancer.",
      "No rebuilding your team every month.",
    ],
    gst: "All membership prices are exclusive of GST.",
  },
  unlimited: {
    label: "Need more than one team?",
    name: "Genesis Unlimited",
    price: "From ₹1,99,000 / month",
    body: "For businesses that regularly need multiple Genesis capabilities.",
    accessLabel: "Access:",
    access: ["Influence", "AI Labs", "Studios", "Brand & Design"],
    accessNote: "with up to two active production requests at once.",
    footnote:
      "Third-party costs, creator fees and major physical production expenses remain separate.",
    cta: "Talk to Us About Genesis Unlimited",
  },
  enterprise: {
    label: "Enterprise",
    heading: "Bigger brief? Different model.",
    lead: "Some work should not fit inside a subscription.",
    body: "For enterprise campaigns, high-volume content production, large influencer programmes, corporate films, major shoots, events and complex AI projects, we build a custom Genesis team around your requirement.",
    cta: "Talk to Genesis Enterprise",
  },
  steps: {
    heading: "How Memberships Work",
    items: [
      { n: "01", title: "Choose", body: "Select the Genesis vertical your team needs." },
      { n: "02", title: "Subscribe", body: "Memberships are billed in advance." },
      { n: "03", title: "Onboard", body: "Share your brand assets, goals and priorities." },
      { n: "04", title: "Request", body: "Submit work directly into your Genesis request queue." },
      { n: "05", title: "Create", body: "Your active request moves into production." },
      { n: "06", title: "Review", body: "Approve or request revisions." },
      { n: "07", title: "Repeat", body: "Once completed, we immediately move to the next request." },
    ],
  },
  faq: {
    heading: "Frequently Asked Questions",
    items: [
      {
        q: "Is it really unlimited?",
        a: [
          "You can add unlimited eligible requests to your queue.",
          "Production capacity is controlled through active-request limits, turnaround times, production credits or campaign limits depending on your membership.",
        ],
      },
      {
        q: "Can we cancel?",
        a: [
          "Monthly memberships can be stopped before the next billing cycle subject to the applicable subscription terms.",
        ],
      },
      {
        q: "Can we pause?",
        a: [
          "Where available, memberships can be paused according to the applicable membership terms.",
        ],
      },
      {
        q: "Are third-party expenses included?",
        a: [
          "No.",
          "Creator fees, actors, locations, production rentals, media spend, paid software/licenses, models and other external costs are quoted separately where required.",
        ],
      },
      {
        q: "How quickly do you start?",
        a: [
          "Onboarding typically starts after successful payment and receipt of the required brand assets and brief.",
        ],
      },
      {
        q: "Can we buy a one-time project first?",
        a: [
          "Absolutely.",
          "Many brands start with a sprint or one-time project before moving into a Genesis membership.",
        ],
      },
    ],
  },
  closing: {
    heading: "Stop building a different creative team for every brief.",
    headingAccent: "Build with Genesis.",
    sub: "Influence. AI. Content. Design.",
    cta: "Choose Your Membership",
  },
  /** The booking band from the brief's pricing mockup. */
  booking: {
    label: "Not sure what you need?",
    heading: "Let's find the right solution for",
    headingAccent: "your brand.",
    body: "Book a 15-minute call and we'll help you choose the right membership or project based on your goals.",
    cta: "Book a 15 min call",
  },
} as const;

/** The homepage's memberships block, in the brief's words. */
export const homeMemberships = {
  hero: {
    heading: "Your creative team.",
    headingAccent: "On demand.",
    body: "Influence, AI, Content Production and Design — available through flexible Genesis memberships or one-time projects.",
    explore: "Explore Memberships",
    start: "Start a Project",
  },
  steps: {
    heading: "How Genesis Memberships Work",
    items: [
      { title: "Subscribe", body: "Choose the creative capability you need." },
      { title: "Add requests", body: "Submit as many requests to your queue as you like." },
      { title: "We create", body: "We work through them based on your membership's capacity." },
      { title: "Review & repeat", body: "Approve, revise, and move on to the next request." },
    ],
  },
  oneTime: {
    heading: "Need a one-time project instead?",
    items: [
      { label: "Performance Creative Sprint — ₹35k", slug: "studios" },
      { label: "AI Avatar Setup — ₹25k", slug: "ai-labs" },
      { label: "Brand Launch — ₹95k", slug: "brand-design" },
      { label: "Logo / Identity projects", slug: "brand-design" },
      { label: "AI films", slug: "ai-labs" },
      { label: "Influencer campaigns", slug: "influence" },
      { label: "Shoots", slug: "studios" },
      { label: "UGC campaigns", slug: "influence" },
    ] satisfies { label: string; slug: PricingSlug }[],
  },
  enterprise: {
    label: "Enterprise",
    heading: "Large campaign? We'll build around you.",
    cta: "Talk to Genesis Enterprise",
  },
  /** The three buttons each vertical section on the homepage now carries. */
  sectionCtas: { join: "Join Today", book: "Book a Call", work: "View Work" },
} as const;

/** The /pricing page's opening, in the brief's words. */
export const pricingHub = {
  heading: "Creative support, without the",
  headingAccent: "agency complexity.",
  body: [
    "Choose the Genesis team you need — Influence, AI, Content Production or Brand & Design.",
    "Subscribe for ongoing creative capacity, or start with a one-time project.",
  ],
  explore: "Explore Memberships",
  oneTime: "View One-Time Projects",
  talk: "Talk to Genesis",
} as const;

export function findVertical(slug: string) {
  return verticals.find((vertical) => vertical.slug === slug);
}

export function pricingPath(slug: PricingSlug) {
  return `/pricing/${slug}`;
}

/*
  WHERE A BUTTON GOES WHILE ITS REAL LINK IS MISSING.

  The message only names what was clicked — the product or membership, in
  the brief's own words — so the first reply does not have to ask. It is the
  visitor's compose box, not page copy, and it says nothing the button did
  not.
*/
function chat(message: string) {
  return whatsappLink(message) ?? "/#contact";
}

export function bookingHref(division: string) {
  return bookingUrl || chat(`Hi Genesis! I'd like to book a 15 min call about ${division}.`);
}

export function joinHref(membership: Membership) {
  return membership.joinUrl || chat(`Hi Genesis! I'd like to start ${membership.name}.`);
}

export function enquiryHref(subject: string) {
  return chat(`Hi Genesis! I'm interested in ${subject}.`);
}
