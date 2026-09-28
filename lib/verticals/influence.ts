/**
 * Genesis Influence — /influencer-marketing.
 *
 * Verbatim from the vertical-pages brief. The one line the brief marks
 * "Pricing (don't write this)" is its note to us and appears nowhere; what
 * the pricing card says is the copy under it.
 */

import { proof } from "../proof";
import { servicePage } from "../services";
import type { IconName, Steps } from "./types";

const page = servicePage("influencer-marketing");

/** "Influencer & UGC Campaigns — Creator fees + 15% Agency Commission." */
export const campaignPricing = {
  label: "Campaign management",
  heading: "Influencer &",
  headingAccent: "UGC Campaigns",
  body: "End-to-end creator campaigns that drive real results — from strategy to reporting.",
  figure: "15%",
  figureLabel: "Agency Commission",
  figureSub: "+ creator fees",
  cta: "Start a campaign",
  /*
    A WORKED EXAMPLE, because a percentage alone is hard to picture. Pure
    arithmetic on the brief's own rate — not a quote, and labelled as one.
  */
  example: "Example: ₹5,00,000/- in creator fees → ₹75,000/- Genesis commission.",
  includesLabel: "Includes",
  includes:
    "Strategy, sourcing influencers. Verification, negotiation, briefing, posting & reporting.",
  image: "/work/posters/12.jpg",
} as const;

export const builtFor: { label: string; items: { label: string; icon: IconName }[] } = {
  label: "Built for",
  items: [
    { label: "Brands", icon: "bag" },
    { label: "Marketing Teams", icon: "users" },
    { label: "Agencies", icon: "briefcase" },
    { label: "Startups", icon: "rocket" },
    { label: "D2C Businesses", icon: "target" },
    { label: "BFSI", icon: "building" },
    { label: "Healthcare", icon: "heart" },
    { label: "Real Estate", icon: "home" },
    { label: "Consumer Brands", icon: "star" },
  ],
};

/*
  THE FOUR SERVICE CARDS take their bodies from the division page's own
  services block (lib/services) — the mockup prints those same sentences — so
  the two cannot drift.
*/
const serviceBodies = page.blocks[0].items ?? [];

export const influenceServices = {
  label: "Influence",
  heading: "Influencer marketing",
  headingAccent: "services",
  body: [
    "From one idea to the right creators, content and results.",
    "We plan, execute and manage influencer campaigns across platforms, with full approvals, publishing and reporting.",
  ],
  primary: "Plan a campaign",
  secondary: "View case studies",
  /*
    ONE SET OF NUMBERS ACROSS THE SITE. The brief printed "50+ brands worked
    with" and "1M+ combined views generated" here, beside the homepage's 45+
    brands and 500M+ views — the figures Genesis confirmed directly and
    lib/proof records. A buyer who reads 45+ on one page and 50+ on the next
    stops trusting both, so the two shared figures now come from lib/proof.
    The two that are Influence's own (influencer campaigns, the creator
    database) stay as the brief wrote them.
  */
  stats: [
    { value: "30+", label: "Influencer campaigns" },
    { value: "100K+", label: "Creator database" },
    { value: proof.brands.value, label: "Brands worked with" },
    { value: proof.reach.value, label: "Views generated" },
  ],
  cards: [
    { title: "Influencer Marketing", icon: "users" as IconName, image: "/work/posters/6.jpg" },
    { title: "Celebrity Partnerships", icon: "star" as IconName, image: "/work/posters/2.jpg" },
    { title: "Bulk Creator Activations", icon: "bolt" as IconName, image: "/work/posters/17.jpg" },
    { title: "UGC & Regional Campaigns", icon: "target" as IconName, image: "/work/posters/23.jpg" },
  ].map((card, index) => ({ ...card, body: serviceBodies[index]?.body ?? "" })),
  platforms: [
    { label: "Instagram", icon: "instagram" },
    { label: "YouTube", icon: "youtube" },
    { label: "TikTok", icon: "tiktok" },
    { label: "X (Twitter)", icon: "x" },
    { label: "Meta", icon: "meta" },
    { label: "Snapchat", icon: "snapchat" },
    { label: "YouTube Shorts", icon: "youtubeshorts" },
  ] as const,
} as const;

export const influenceProcess: Steps = {
  label: "Our process",
  heading: "How we run an",
  headingAccent: "influencer campaign",
  body: ["Creators.", "Content.", "Conversions."],
  steps: [
    { title: "Requirement", body: "Set KPIs, campaign goals, target audience and platforms.", icon: "target" },
    { title: "Discovery", body: "Identify the right influencers using our in-house creator database and audience fit.", icon: "users" },
    { title: "Onboarding", body: "Finalise deliverables, commercials, timelines, contracts and creator onboarding.", icon: "script" },
    { title: "Content", body: "Shape concepts, scripts, content direction and approvals around the brand brief.", icon: "idea" },
    { title: "Execution", body: "Coordinate publishing, campaign tracking and creator management across the campaign.", icon: "delivery" },
    { title: "Audit & Reporting", body: "Measure reach, engagement, clicks and campaign performance against agreed KPIs.", icon: "layers" },
  ],
};

export const influenceCtas = {
  schedule: "Schedule a 15-Minute Call",
  touch: "Get in Touch with Us",
};

export const influenceClosing = {
  label: "Let's create together",
  heading: "From brief to creator shortlisting,",
  headingAccent: "without the chaos.",
  body: "Strategy, creators, content and campaign management — all in one place.",
  primary: "Start an Influencer Project",
  secondary: "Book a 15-min Call",
} as const;
