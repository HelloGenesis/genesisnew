/**
 * Genesis AI Labs — the AI Content Studio, at /ai-content-automation.
 *
 * Verbatim from the vertical-pages brief ("GENESIS AI CONTENT STUDIO",
 * sections 1–9, plus its FAQs). Where the brief gives its own advice about
 * the UI rather than copy — "I would NOT immediately show a giant feature
 * matrix here" — the advice is followed and not printed.
 */

import { bookingHref, enquiryHref, joinHref } from "../pricing";
import type { AddOns, Closing, Faq, IconCard, PlanGrid, Steps, Turnaround } from "./types";

const PRODUCT = "AI Content Studio";

export const aiHero = {
  label: "Genesis AI Labs",
  heading: "Build once.",
  headingAccent: "Publish continuously.",
  lead: "Turn your founder, spokesperson or brand character into an AI-powered content engine.",
  body: "Create videos, visuals, campaigns and founder-led content without scheduling a new shoot every time.",
  primary: "Start AI Content Studio",
  secondary: "See AI Work",
  trust: ["AI Avatars", "AI Videos", "Campaign Creatives", "Founder Content"],
  note: "Same you. More content.",
  /* The collage: Genesis's own AI Lab output. */
  images: [
    { src: "/work/posters/ai-lab-shivam-sh1.jpg", label: "AI Video" },
    { src: "/avatars/tanvi.jpg", label: "AI Avatar" },
    { src: "/work/posters/35.jpg", label: "Product Visual" },
    { src: "/work/posters/ai-lab-2-1-9x16-health-returns-activ-yuva.jpg", label: "Campaign Creative" },
  ],
} as const;

export const aiFormats = {
  label: "AI Content Studio",
  heading: "See what you",
  headingAccent: "can create.",
  body: "One system. Multiple formats. Ready to publish across your brand.",
  items: [
    { title: "AI Videos", body: "Scroll-stopping AI-powered brand content.", image: "/work/posters/38.jpg" },
    { title: "AI Avatars", body: "Realistic digital versions of founders, creators and spokespeople.", image: "/avatars/diya.jpg" },
    { title: "Campaign Creatives", body: "Campaign-ready visuals built around your message.", image: "/work/posters/ai-lab-tanvi-b2813828.jpg" },
    { title: "Product Visuals", body: "Put your product into environments without another production day.", image: "/work/posters/34.jpg" },
    { title: "Founder Content", body: "Consistent founder-led content without constant shoots.", image: "/work/posters/ai-lab-bharat-bharat.jpg" },
    { title: "Explainers", body: "Turn complex ideas into easy-to-understand visual content.", image: "/work/posters/ai-lab-1-2-9x16-main-product-explainer-activ-yuva.jpg" },
  ],
} as const;

export const aiPlans: PlanGrid = {
  label: "Memberships",
  heading: "Your AI content team.",
  headingAccent: "Without building one in-house.",
  body: ["Choose the content capacity your brand needs. Upgrade whenever you need more."],
  billing: true,
  billingNote: "Quarterly plans are billed every 3 months.",
  plans: [
    {
      name: "Starter",
      description: "For brands getting started with always-on AI content.",
      price: "₹95K",
      monthly: 95000,
      period: "/ month",
      features: ["6 AI Videos", "1 AI Avatar", "8 Campaign Creatives", "1 Language", "1 Active Request"],
      cta: { label: "Start with Starter", href: joinHref("ai-labs", "Starter", PRODUCT) },
      note: "Cancel or upgrade your membership as your content needs change.",
    },
    {
      name: "Growth",
      badge: "Most Popular",
      featured: true,
      description: "For brands that need consistent, high-volume content across formats.",
      price: "₹1.85L",
      monthly: 185000,
      period: "/ month",
      features: [
        "8 Premium Videos",
        "1 AI Avatar",
        "15 Campaign Creatives",
        "Up to 2 Advanced Videos",
        "2 Languages",
        "8 Adaptations",
        "1 Active Request",
      ],
      cta: { label: "Choose Growth", href: joinHref("ai-labs", "Growth", PRODUCT) },
    },
    {
      name: "Enterprise",
      description: "For larger brands running multiple campaigns, personas and content streams.",
      price: "₹3.5L",
      monthly: 350000,
      period: "/ month",
      features: [
        "16 Premium Videos",
        "Up to 3 Personas",
        "30 Campaign Creatives",
        "Up to 4 Advanced Videos",
        "3 Languages",
        "20 Adaptations",
        "2 Active Requests",
      ],
      cta: { label: "Talk to Genesis", href: enquiryHref(`${PRODUCT} — Enterprise`) },
    },
  ],
  included: {
    heading: "Want to see everything included?",
    sub: "Expand to see what's included in every plan.",
    lead: "Every membership includes",
    items: [
      "Creative direction",
      "Ideation & scripting",
      "AI production",
      "Brand integration",
      "Voice / lip-sync",
      "Music & sound",
      "Captions & supers",
      "Brand fonts & colours",
      "Revision workflow",
      "Ready-to-publish exports",
      "Content queue management",
    ],
  },
  /*
    THE FULL MATRIX IS ONLY PARTLY IN THE BRIEF. Its comparison table is cut
    off after the Starter column, so the Growth and Enterprise values for the
    rows only Starter shows (typical length, formats, planning, priority,
    support) do not exist yet and are not invented. What is compared here is
    every line the three cards themselves state. TODO(genesis): send the full
    table and the remaining rows go in.
  */
  compare: {
    lead: "Monthly investment",
    rows: [
      { label: "Monthly Investment", values: ["₹95K/month", "₹1.85L/month", "₹3.5L/month"] },
      { label: "AI Videos", values: ["6 Standard AI Videos", "8 Premium Videos", "16 Premium Videos"] },
      { label: "AI Avatar / Persona", values: ["1 included", "1 AI Avatar", "Up to 3 Personas"] },
      { label: "AI Campaign Creatives", values: ["8 / month", "15 / month", "30 / month"] },
      { label: "Advanced AI / Motion", values: ["—", "Up to 2 Advanced Videos", "Up to 4 Advanced Videos"] },
      { label: "Content Adaptations", values: ["Basic brand adaptations", "8 Adaptations", "20 Adaptations"] },
      { label: "Languages", values: ["1 Language", "2 Languages", "3 Languages"] },
      { label: "Active Requests", values: ["1 at a time", "1 at a time", "2 at a time"] },
    ],
  },
};

export const aiEveryVideo: { label: string; heading: string; body: string; items: IconCard[] } = {
  label: "Every video",
  heading: "From idea to ready-to-publish.",
  body: "You give us the brief. We handle the creative workflow.",
  items: [
    { icon: "idea", label: "01 — Idea", title: "Ideation & Script", body: "Concept development and scripting around your objective." },
    { icon: "brand", label: "02 — Brand", title: "Product Integration", body: "Your product, service or message built naturally into the content." },
    { icon: "voice", label: "03 — Voice", title: "Voice & Lip-Sync", body: "AI voice, voice cloning or realistic lip-sync where required." },
    { icon: "sound", label: "04 — Sound", title: "Music & Sound", body: "Background music and sound design that support the content." },
    { icon: "motion", label: "05 — Motion", title: "Motion & Graphics", body: "Transitions, animation and supporting graphic elements." },
    { icon: "text", label: "06 — Text", title: "Captions & Supers", body: "On-screen copy designed for easy consumption." },
    { icon: "palette", label: "07 — Brand system", title: "Your Brand, Every Time", body: "Fonts, colours and visual styling aligned to your identity." },
    { icon: "delivery", label: "08 — Delivery", title: "Ready to Publish", body: "Final files prepared for your required platform and format." },
  ],
};

export const aiCreatives = {
  label: "AI Campaign Creatives",
  heading: "One campaign.",
  headingAccent: "More ways to show up.",
  body: "Take one campaign idea and expand it across multiple branded visual formats.",
  support:
    "AI Campaign Creatives are finished static marketing assets created around your campaign, product, offer or brand message.",
  items: [
    { title: "Product Environment", body: "Your product placed inside campaign-specific environments.", image: "/work/posters/37.jpg" },
    { title: "Founder Visual", body: "Founder or spokesperson-led campaign imagery.", image: "/avatars/adi.jpg" },
    { title: "Lifestyle Visual", body: "Your product shown naturally within lifestyle scenarios.", image: "/work/posters/ai-lab-tanvi-uiiui.jpg" },
    { title: "Campaign KV", body: "Hero visual for the overall campaign.", image: "/avatars/bharat.jpg" },
    { title: "Launch Creative", body: "Assets built around launches, announcements and drops.", image: "/avatars/ivaanat.jpg" },
    { title: "Promotional Creative", body: "Offer, product and conversion-focused creatives.", image: "/work/posters/ai-lab-tanvi-photos.jpg" },
  ],
  monthlyLabel: "Included every month",
  monthly: [
    { plan: "Starter", value: "8" },
    { plan: "Growth", value: "15" },
    { plan: "Enterprise", value: "30" },
  ],
} as const;

export const aiHowItWorks: Steps = {
  label: "How it works",
  heading: "Content on demand.",
  headingAccent: "Without the production chaos.",
  body: [
    "Add requests whenever you need them. We work through your active queue according to your membership capacity.",
  ],
  steps: [
    { title: "Add to Queue", body: "Send your idea, reference, campaign or requirement.", icon: "queue" },
    { title: "We Create", body: "Our creative team and AI workflow bring it to life.", icon: "create" },
    { title: "Review", body: "Review the output and request changes where required.", icon: "review" },
    { title: "Next Request", body: "Once approved, we move directly to the next item in your queue.", icon: "repeat" },
  ],
  capacity: {
    heading: "Capacity",
    rows: ["Starter · 1 Active Request", "Growth · 1 Active Request", "Enterprise · 2 Active Requests"],
  },
  note: "Your queue can keep growing. Your active request limit determines how many pieces we work on simultaneously.",
};

export const aiTurnaround: Turnaround = {
  label: "Turnaround",
  heading: "From brief to content. Fast.",
  body: "Most requests move through production within a few working days.",
  tiers: [
    { time: "1–2 Days", title: "Images & Simple Creatives", items: ["Static campaign assets, product visuals and simpler outputs."], icon: "images" },
    { time: "2–4 Days", title: "Standard Videos", items: ["AI avatar videos, founder content and standard branded videos."], icon: "video" },
    { time: "5–7 Days", title: "AI + Motion", items: ["Advanced AI production, heavier animation and complex visual treatments."], icon: "bolt" },
  ],
  notes: ["Timelines depend on complexity, feedback and the scope of each request."],
};

export const aiAddOns: AddOns = {
  label: "Add-ons",
  heading: "Need more?",
  body: "Scale your membership when a campaign needs something extra.",
  chips: [
    { label: "Additional Videos", icon: "video" },
    { label: "Additional Avatars", icon: "avatar" },
    { label: "Additional Languages", icon: "language" },
    { label: "Advanced Motion", icon: "motion" },
    { label: "Campaign Visuals", icon: "images" },
    { label: "Priority Delivery", icon: "bolt" },
  ],
  button: "View Add-ons",
  /* "Do not show all those prices on the default page" — they open on click. */
  items: [
    { name: "Additional Standard AI Video", price: "₹25,000" },
    { name: "Additional AI Avatar / Persona", price: "₹25,000" },
    { name: "Advanced Motion Upgrade", price: "+₹15,000/video" },
    { name: "Additional Language Version", price: "₹5,000/video" },
    { name: "Additional Aspect-Ratio Master", price: "₹4,000/video" },
    { name: "AI Product / Campaign Creative Pack — 10 images", price: "₹20,000" },
    { name: "AI Creative Pack — 30 images", price: "₹45,000" },
    /* The brief leaves this price blank; it is quoted, not invented. */
    { name: "Priority 48-Hour Production", price: "On request" },
    { name: "Bulk Personalised Video Generation", price: "Custom" },
  ],
};

export const aiClosing: Closing = {
  label: "Your content engine",
  heading: "Stop scheduling another shoot",
  headingAccent: "every time you need content.",
  body: [
    "Build your AI Content Studio once.",
    "Create founder content. Launch campaigns. Produce videos. Generate visuals. Again and again.",
    "Build once. Keep creating every month.",
  ],
  primary: { label: "Start My AI Content Studio", href: joinHref("ai-labs", "Starter", PRODUCT) },
  secondary: { label: "Talk to Genesis", href: bookingHref("Genesis AI Labs") },
};

export const aiFaqs: { heading: string; items: Faq[] } = {
  heading: "Genesis AI Labs — FAQs",
  items: [
    {
      q: "What does Genesis AI Labs do?",
      a: [
        "Genesis AI Labs helps brands create and scale content using generative AI.",
        "We work across AI avatars, AI videos, campaign creatives, product visuals, founder-led content, virtual characters, voice workflows and AI-powered content automation.",
      ],
    },
    {
      q: "Is Genesis AI Labs just an AI avatar service?",
      a: [
        "No.",
        "AI avatars are one part of the system.",
        "The broader goal is to help brands create more content with less dependency on repeated shoots, manual production and disconnected creative workflows.",
      ],
    },
    {
      q: "Can you create an AI avatar of a real person?",
      a: [
        "Yes, with the person's explicit approval and the required reference material.",
        "Real-person likeness and voice replication require authorisation from the individual being represented.",
      ],
    },
    {
      q: "Can you create completely virtual AI characters?",
      a: [
        "Yes.",
        "We can create virtual founders, spokespersons, campaign characters and branded personalities that do not represent a real individual.",
      ],
    },
    {
      q: "What can an AI avatar be used for?",
      a: [
        "Common use cases include:",
        "social reels · founder content · product explainers · educational videos · campaign communication · internal communication · multilingual content · brand storytelling · performance creative",
      ],
    },
    {
      q: "Can AI content replace physical shoots completely?",
      a: [
        "Not in every situation.",
        "AI is particularly useful for increasing content volume, creating variations and reducing the need for repeated shoots.",
        "For campaigns where live production is more appropriate, Genesis Studios and AI Labs can work together.",
      ],
    },
    {
      q: "Can you create content in multiple languages?",
      a: [
        "Yes.",
        "Selected plans support additional language and voice versions.",
        "Language availability depends on the avatar, voice workflow and production requirement.",
      ],
    },
    {
      q: "Can you integrate our actual product into AI content?",
      a: [
        "Yes.",
        "Products, services, packaging, properties and other brand elements can be integrated into AI videos and campaign creatives where technically suitable.",
      ],
    },
    {
      q: "How realistic is the AI content?",
      a: [
        "We aim for content that feels polished, branded and intentional rather than obviously AI-generated.",
        "However, generative AI may occasionally introduce small inconsistencies, which is why testing, review and production refinement are part of the process.",
      ],
    },
    {
      q: "Can Genesis automate our content workflow too?",
      a: [
        "Yes.",
        "Depending on the business, we can build workflows across: ideas → scripts → approvals → asset generation → organisation → publishing.",
        "Automation projects are scoped separately based on the tools and workflow involved.",
      ],
    },
  ],
};

/** The /pricing tab's header for this vertical — the mockup's own lines. */
export const aiTab = {
  label: "Genesis AI Labs",
  heading: PRODUCT,
  sub: "Build once. Publish continuously.",
  body: "AI videos, campaign creatives and avatar-led content produced every month without rebuilding a production setup each time.",
};
