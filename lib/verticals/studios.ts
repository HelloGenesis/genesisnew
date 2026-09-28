/**
 * Genesis Studios — /content-production.
 *
 * Verbatim from the vertical-pages brief ("GENESIS STUDIOS", sections 01–11).
 * The brief's asides to the builder ("This keeps the distinction clear…",
 * "Pasted markdown", "The plan details above are drawn directly from…") are
 * notes to us and are not printed.
 */

import { inr, price } from "../money";
import { enquiryHref, joinHref } from "../pricing";
import type { Closing, IconCard, PlanGrid, Steps, Turnaround } from "./types";

const MONTHLY = "Content Monthly";
const SHOOT = "Content Shoot";

export const studiosHero = {
  label: "Genesis Studios",
  heading: "From brief",
  headingAccent: "to publish.",
  lead: "Strategy, scripting, production and post — one connected content studio built for every screen.",
  body: "Create founder content, reels, product videos, campaign assets, motion content and branded films without rebuilding a production team for every brief.",
  primary: "Explore Content Monthly",
  secondary: "Book a Content Shoot",
  strip: ["Reels & Short-Form", "Product Videos", "Campaign Content", "Branded Films"],
  note: "One studio for every screen.",
  /* The hero's video rail — Studios shoot work; each card opens its case study. */
  videos: [
    { id: "studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance", eyebrow: "Leadership Film", title: "Mayank Bathwal, CEO" },
    { id: "studios-umang-2024", eyebrow: "Event Film", title: "UMANG 2024" },
    { id: "studios-utsav-aftermovie", eyebrow: "Aftermovie", title: "ABHI Utsav" },
    { id: "studios-mahindra-cut-44", eyebrow: "Brand Film", title: "Mahindra Finance" },
    { id: "studios-hdfc-x-abhi-sampoorna2-0", eyebrow: "Campaign Content", title: "HDFC × ABHI" },
    { id: "studios-tripagetet", eyebrow: "Travel Content", title: "TripGate" },
  ],
  image: "/work/posters/studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance.jpg",
  thumbs: [
    "/work/posters/studios-umang-2024.jpg",
    "/work/posters/studios-mahindra-cut-44.jpg",
    "/work/posters/studios-with-hdfc-slide.jpg",
  ],
} as const;

export const studiosTwoWays = {
  label: "Two ways to create",
  heading: "Choose how you want to create.",
  body: ["Recurring content or one concentrated production day.", "Same studio. Different needs."],
  items: [
    {
      index: "01",
      name: MONTHLY,
      /* A Studios subscription — Mumbai only, for now. */
      inPerson: true,
      tagline: "Always-on content production.",
      body: [
        "Your ongoing content production team for brands that need consistent output every month.",
        "Plan your content, add requests to your queue, and let Genesis handle production from brief to final export.",
      ],
      points: ["Fixed monthly output", "Optional monthly shoot", "Active request system", "No quotation for every reel"],
      from: `From ${price(85000)} per month`,
      cta: { label: "Explore Monthly Plans", href: "#pricing" },
      image: "/work/posters/studios-abhi-ex-coms.jpg",
      /* Genesis's illustration (28 Sep 2026): one engine, every format — reel, static, carousel, AI video. */
      art: { src: "/studios/content-monthly-orbit.webp", width: 969, height: 992 },
      featured: true,
    },
    {
      index: "02",
      name: SHOOT,
      /* A shoot happens in person — Mumbai only, for now (Genesis, 28 Sep 2026). */
      inPerson: true,
      tagline: "One shoot. A ready-to-publish content library.",
      body: [
        "Book a dedicated production day for your brand, product, founder or campaign.",
        "We handle everything from pre-production to final edits.",
      ],
      /* The shoot products in Genesis's one-time listing (lib/products), 28 Sep 2026. */
      points: ["Founder / CEO video shoots", "Half-day content shoots", "Event coverage", "Edited videos + photographs"],
      from: `From ${inr(44999)}`,
      cta: { label: "See shoot products", href: "#studios-one-time" },
      image: "/work/posters/studios-utsav-aftermovie.jpg",
      /* Genesis's illustration: the lens — one day, multi-cam, ready to publish. */
      art: { src: "/studios/content-shoot-lens.webp", width: 1080, height: 977 },
      featured: false,
    },
  ],
} as const;

/*
  WHAT'S INCLUDED, PER PLAN — shown inside each card when a reader opens
  "View What's Included", as on AI Labs. The shared lines are the brief's own
  "Starter includes … each can include" list, which every higher plan also
  gets; the lines that differ are each plan's own card, restated as included,
  not included, or included in a limited form.
*/
const EVERY_VIDEO: { item: string; included: boolean | string }[] = [
  { item: "Ideation", included: true },
  { item: "Scriptwriting", included: true },
  { item: "Brand / product integration", included: true },
  { item: "Background music", included: true },
  { item: "Standard sound treatment", included: true },
  { item: "Basic transitions", included: true },
  { item: "Basic motion graphics", included: true },
  { item: "Captions & supers", included: true },
  { item: "Brand fonts, colours and styling", included: true },
  { item: "Stock / B-roll where appropriate", included: true },
  { item: "Basic colour correction", included: true },
  { item: "1080p export", included: true },
];

export const studiosPlans: PlanGrid = {
  label: "Content Monthly",
  heading: "Plans for every stage.",
  body: ["Choose the production capacity your brand needs.", "Upgrade as your content needs grow."],
  /*
    THE TOGGLE, WITHOUT A DISCOUNT: "keep the UI toggle but not show a
    discount yet unless you formally decide one, because the current
    commercial document does not define quarterly pricing." A quarter reads
    as three months at the monthly rate.
  */
  billing: true,
  billingNote: "Quarterly plans are billed every 3 months.",
  plans: [
    {
      name: "Starter",
      inPerson: true,
      tagline: "Keep your content moving.",
      description: "Built for teams with existing footage that need consistent editing, scripting and content support.",
      rate: 85000,
      features: [
        "6 Standard Videos",
        "Up to 30–45 sec",
        "No included shoot",
        "Up to 1 motion-heavy video",
        "Up to 2 adaptations",
        "9:16 format",
        "Monthly content planning",
        "1 active request",
        "Standard project support",
      ],
      cta: { label: "Start with Starter", href: joinHref("studios", "Starter", MONTHLY) },
      inclusions: [
        { item: "Footage", included: "Editing of supplied footage" },
        { item: "Monthly shoot", included: false },
        { item: "Edited photographs", included: false },
        { item: "Motion-heavy videos", included: "Up to 1" },
        { item: "Delivery formats", included: "Primary 9:16" },
        { item: "Dedicated coordinator", included: false },
        { item: "Priority production", included: false },
        ...EVERY_VIDEO,
      ],
    },
    {
      name: "Growth",
      inPerson: true,
      badge: "Recommended",
      featured: true,
      tagline: "Capture once. Keep publishing.",
      description: "For brands that want Genesis to handle both monthly capture and ongoing production.",
      rate: 145000,
      features: [
        "8 Premium Videos",
        "Up to 60 sec",
        "1 Half-Day Shoot / month",
        "Up to 5 hours",
        "1 camera setup",
        "15 edited photographs",
        "Up to 2 motion-heavy videos",
        "Up to 6 adaptations",
        "9:16 + selected 16:9",
        "Monthly calendar + shoot planning",
        "1 active request",
        "Dedicated coordinator",
      ],
      cta: { label: "Choose Growth", href: joinHref("studios", "Growth", MONTHLY) },
      inclusions: [
        { item: "Footage", included: "Genesis-shot or supplied" },
        { item: "Monthly shoot", included: "Half-day, up to 5 hours, 1 camera" },
        { item: "Edited photographs", included: "15" },
        { item: "Motion-heavy videos", included: "Up to 2" },
        { item: "Delivery formats", included: "9:16 + selected 16:9" },
        { item: "Dedicated coordinator", included: true },
        { item: "Priority production", included: false },
        ...EVERY_VIDEO,
      ],
    },
    {
      name: "Enterprise",
      inPerson: true,
      tagline: "A complete monthly content engine.",
      description: "For marketing teams running multiple campaigns, content pillars or business units.",
      rate: 250000,
      features: [
        "12 Premium Videos",
        "Up to 60 sec*",
        "1 Full-Day Shoot / month",
        "Up to 9 hours",
        "Up to 2 cameras",
        "25 edited photographs",
        "Up to 3 motion-heavy videos",
        "Up to 12 adaptations",
        "9:16 + 1:1 + 16:9",
        "Campaign architecture + monthly review",
        "Up to 2 active requests",
        "Priority production",
        "Dedicated creative + account owner",
      ],
      cta: { label: "Talk to Genesis", href: enquiryHref(`${MONTHLY} — Enterprise`) },
      contactOnly: true,
      inclusions: [
        { item: "Footage", included: "Genesis-shot or supplied" },
        { item: "Monthly shoot", included: "Full-day, up to 9 hours, up to 2 cameras" },
        { item: "Edited photographs", included: "25" },
        { item: "Motion-heavy videos", included: "Up to 3" },
        { item: "Delivery formats", included: "9:16 + 1:1 + 16:9" },
        { item: "Dedicated creative + account owner", included: true },
        { item: "Priority production", included: true },
        ...EVERY_VIDEO,
      ],
    },
  ],
  footnote: "*Longer films or large campaign pieces may require separate production scope.",
  /*
    "Use two large expandable buttons" — View What's Included and Compare
    Plans. The first opens Starter's own inclusion list, the only per-video
    list the brief defines ("Starter includes … Each can include").
  */
  included: {
    heading: "View What's Included",
    sub: "See exactly what's included across planning, production, editing and delivery.",
    lead: "Starter includes",
    items: [
      "Ideation",
      "Scriptwriting",
      "Editing of supplied footage",
      "Brand / product integration",
      "Background music",
      "Standard sound treatment",
      "Basic transitions",
      "Basic motion graphics",
      "Captions & supers",
      "Brand fonts, colours and styling",
      "Stock / B-roll where appropriate",
      "Basic colour correction",
      "1080p export",
      "Primary 9:16 delivery",
    ],
  },
  compare: {
    lead: "See the detailed side-by-side comparison.",
    rows: [
      { label: "Videos", values: ["6 Standard Videos", "8 Premium Videos", "12 Premium Videos"] },
      { label: "Length", values: ["Up to 30–45 sec", "Up to 60 sec", "Up to 60 sec*"] },
      { label: "Shoot", values: ["No included shoot", "1 Half-Day Shoot / month · up to 5 hours", "1 Full-Day Shoot / month · up to 9 hours"] },
      { label: "Cameras", values: ["—", "1 camera setup", "Up to 2 cameras"] },
      { label: "Edited photographs", values: ["—", "15", "25"] },
      { label: "Motion-heavy videos", values: ["Up to 1", "Up to 2", "Up to 3"] },
      { label: "Adaptations", values: ["Up to 2", "Up to 6", "Up to 12"] },
      { label: "Formats", values: ["9:16", "9:16 + selected 16:9", "9:16 + 1:1 + 16:9"] },
      { label: "Planning", values: ["Monthly content planning", "Monthly calendar + shoot planning", "Campaign architecture + monthly review"] },
      { label: "Active requests", values: ["1", "1", "Up to 2"] },
      { label: "Support", values: ["Standard project support", "Dedicated coordinator", "Priority production · Dedicated creative + account owner"] },
    ],
    footnote: "*Longer films or large campaign pieces may require separate production scope.",
  },
};

export const studiosEveryVideo: { label: string; heading: string; body: string[]; items: IconCard[] } = {
  label: "Every video",
  heading: "From idea to ready-to-publish.",
  body: ["You bring us the brief.", "We handle the production workflow."],
  items: [
    { icon: "idea", label: "Idea", title: "Concept & Ideation", body: "Shape the direction before production starts." },
    { icon: "script", label: "Script", title: "Scriptwriting", body: "Scripts and talking points where required." },
    { icon: "camera", label: "Shoot / Footage", title: "Capture or Supplied Assets", body: "We work with Genesis-shot footage or content you already have." },
    { icon: "edit", label: "Edit", title: "Professional Editing", body: "Story, pacing and polished post-production." },
    { icon: "sound", label: "Sound", title: "Music + Sound Treatment", body: "Background music and standard audio finishing." },
    { icon: "motion", label: "Motion", title: "Graphics + Transitions", body: "Motion graphics, titles and supporting visual elements." },
    { icon: "text", label: "Text", title: "Captions + Supers", body: "On-screen messaging designed for easy consumption." },
    { icon: "palette", label: "Brand", title: "Brand Styling", body: "Fonts, colours and visual treatment aligned to your identity." },
    { icon: "delivery", label: "Delivery", title: "Ready to Publish", body: "Final exports prepared for your required platform." },
  ],
};

export const studiosStarter = {
  label: "Plan breakdown",
  heading: "What does Starter",
  headingAccent: "actually mean?",
  body: [
    "Built for brands already creating content internally — through past shoots, founder recordings or their own team — but needing a reliable production partner to keep it moving.",
    "Perfect if you mainly need editing, motion, scripting and consistent short-form output.",
  ],
  items: [
    { icon: "edit", title: "Edit Existing Footage", body: "Turn internally captured or previously shot footage into polished content." },
    { icon: "motion", title: "Motion Graphics", body: "Add simple animations, transitions and supporting graphics." },
    { icon: "text", title: "Captions & Branding", body: "Captions, supers, brand fonts, colours and visual styling." },
    { icon: "calendar", title: "Content Planning", body: "Monthly ideation and content planning." },
    { icon: "review", title: "Revisions Included", body: "Defined revision rounds keep the workflow structured." },
    { icon: "delivery", title: "Ready to Publish", body: "Final exports prepared for social and digital platforms." },
  ] satisfies IconCard[],
  includesHeading: "Starter includes",
  includesLead: "6 Standard Short-Form Videos",
  includesSub: "Each can include:",
  image: "/work/posters/studios-video-001.jpg",
};

export const studiosHowItWorks: Steps = {
  label: "How it works",
  heading: "Simple process.",
  headingAccent: "Consistent output.",
  body: [
    "Add requests to your queue.",
    "We work through them according to your plan's active-request capacity.",
  ],
  steps: [
    { title: "Plan", body: "Share what you want to create. Ideas, references, campaigns or upcoming requirements.", icon: "idea" },
    { title: "Shoot / Submit Footage", body: "We capture your content where included, or you send us the footage you already have.", icon: "camera" },
    { title: "We Edit", body: "Our production team turns it into finished content.", icon: "edit" },
    { title: "Review", body: "Review the output and request changes where needed.", icon: "review" },
    { title: "Publish & Repeat", body: "Once completed, we move to the next priority in your queue.", icon: "repeat" },
  ],
  capacity: {
    heading: "Active request capacity",
    rows: ["Starter — 1 Active Request", "Growth — 1 Active Request", "Enterprise — Up to 2 Active Requests"],
  },
  note: "Your queue can contain more ideas than your active capacity. Your monthly production allocation determines how much is completed within each billing cycle.",
};

export const studiosTurnaround: Turnaround = {
  label: "Turnaround",
  heading: "From brief to content. Fast.",
  tiers: [
    { time: "1–2 Business Days", title: "Simple Edits & Adaptations", icon: "edit" },
    { time: "2–4 Business Days", title: "Standard Short-Form Content", icon: "video" },
    { time: "5–7 Business Days", title: "Premium / Motion-Heavy Content", icon: "bolt" },
  ],
  notes: [
    "Monthly Shoot — First batch typically delivered approximately 4–5 working days after the shoot.",
    "Full monthly production typically takes approximately 7–10 working days, depending on approvals and complexity.",
  ],
};

export const studiosClosing: Closing = {
  label: "Genesis Studios",
  heading: "Your brand.",
  headingAccent: "In motion. Always.",
  body: [
    "Stop briefing a different production team for every video.",
    "Build one content system with Genesis Studios.",
    "Plan once. Produce consistently. Keep publishing.",
  ],
  primary: { label: "Start Content Monthly", href: "#pricing" },
  secondary: { label: "Book a Content Shoot", href: "#shoot" },
  footnote: ["Strategy. Production. Post.", "One studio for every screen."],
};

export const studiosTab = {
  label: "Genesis Studios",
  heading: MONTHLY,
  sub: "Plans for every stage.",
  body: "Choose the production capacity your brand needs. Upgrade as your content needs grow.",
};
