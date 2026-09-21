import { services as divisions } from "./home-content";
import { divisionPages } from "./site-config";
import type { Vertical } from "./work";

/**
 * THE FOUR DIVISION PAGES — the copy a search engine reads for each service.
 *
 * WHY THIS IS NEW COPY AND NOT THE HOMEPAGE SECTIONS. The sections are built
 * to be seen: a lockup, a constellation, a pipeline, a hundred words between
 * them. That is the right amount for a scroll and far too little for a page
 * that has to rank for "influencer marketing agency in Mumbai" — Google needs
 * the page to say, in text, what the service is, how it is run, who it is for
 * and what it has done. Each page renders its homepage section as the
 * showcase and this underneath it.
 *
 * NOTHING HERE IS INVENTED, which is the same rule lib/home-content keeps.
 * Every claim is read off material Genesis already publishes:
 *   - the service lines are the credentials deck's, verbatim (they arrive
 *     through `divisions` from lib/home-content);
 *   - the process, niches, pipeline and capability lists are the site's own
 *     copy for those sections;
 *   - every figure is a VERIFIED highlight from the case-study master
 *     (lib/case-study-copy). The flagged ones — Shubh Utsav, Let's Face It,
 *     Activ Yuva — are named for what was done and never for a number.
 *   - the unconfirmed proof figures (50+ campaigns, 30+ brands, 50M+ reach —
 *     see lib/proof) are not used at all. The creator network is the one
 *     figure marked confirmed.
 *
 * TODO(copy): Genesis to read all four pages before launch. The facts are
 * theirs; the sentences joining them are new.
 */

export type ServiceItem = { title: string; body: string };

export type ServiceBlock = {
  heading: string;
  paragraphs?: string[];
  /** A list of named capabilities, each with one line on what it is. */
  items?: ServiceItem[];
};

export type ServiceFaq = { question: string; answer: string };

export type ServicePage = {
  /** The route, without its slash. Permanent — it is the URL. */
  slug: (typeof divisionPages)[number]["href"] extends `/${infer S}` ? S : never;
  /** The division as DivisionLockup keys it. */
  division: "Influence" | "Studios" | "AI Lab" | "Brand & Design";
  /** How the case-study master files this division's work. */
  vertical: Vertical;
  seo: { title: string; description: string };
  /** For the Service schema. */
  schema: { name: string; serviceType: string };
  /** The page's h1, in the site's lead-plus-accent pattern. */
  heading: { lead: string; accent: string };
  intro: string;
  blocks: ServiceBlock[];
  faqs: ServiceFaq[];
  /** Case studies this page points to, by slug, in order. */
  proof: string[];
};

const INFLUENCE = divisions.items[0];
const BRAND_DESIGN = divisions.items[1];
const STUDIOS = divisions.items[2];
const AI_LAB = divisions.items[3];

export const servicePages: ServicePage[] = [
  {
    slug: "influencer-marketing",
    division: "Influence",
    vertical: "Influence",
    seo: {
      title: "Influencer Marketing Agency in Mumbai",
      description:
        "Influencer marketing, celebrity partnerships and UGC campaigns from Genesis Media in Mumbai, matching brands with 1,00,000+ creators across India. Plan yours.",
    },
    schema: { name: "Influencer marketing", serviceType: "Influencer marketing" },
    heading: { lead: "Influencer marketing agency", accent: "in Mumbai" },
    intro:
      "Genesis.Influence is the influencer marketing division of Genesis Media. We plan, cast, run and report creator campaigns for brands across India, from celebrity partnerships at the top end to bulk creator activations and UGC at scale, drawing on a network of more than 1,00,000 creators.",
    blocks: [
      {
        heading: "Influencer marketing services",
        items: [
          {
            title: INFLUENCE.services[0],
            body: "One idea, briefed to the creators whose audience matches yours and run on Instagram, YouTube and the other platforms your customers use, with approvals, publishing and reporting handled for you.",
          },
          {
            title: "Celebrity partnerships",
            body: "Collaborations for campaigns that need a household name, like the behind-the-scenes series we built around Vikrant Massey for Aditya Birla Health Insurance's Activ One.",
          },
          {
            title: INFLUENCE.services[1],
            body: "Many creators publishing around one simple mechanic in a concentrated window, so a launch or a festive moment reads as a surge rather than as isolated posts. It is the approach behind Mahindra Finance's Shubh Utsav.",
          },
          {
            title: INFLUENCE.services[2],
            body: "User-generated content that lets one brief speak in many creators' voices, so the same message feels native in every feed it lands in while the campaign keeps one identity.",
          },
        ],
      },
      {
        heading: "How we run an influencer campaign",
        items: [
          { title: "Discovery", body: "Brief, audience and channel strategy, before a single creator is approached." },
          { title: "Matching", body: "Creators shortlisted from the database against the audience, not the follower count." },
          { title: "Production", body: "Scripting, direction and edit support so the content clears the bar." },
          { title: "Delivery", body: "Publishing, tracking and reporting against the numbers agreed up front." },
        ],
      },
      {
        heading: "Creators in every niche",
        paragraphs: [
          "Our network covers fashion, finance, gaming, tech, parenting, fitness, beauty, lifestyle, food and travel, and 56 more categories besides. We match on audience first: who follows a creator, and what they respond to, matters more than how many of them there are.",
          "That is how yoga creator Kamya Sidana became the voice of a seven-day International Yoga Day series for ABHI, and how The WorldGrad reached students through 25 education and travel creators.",
        ],
      },
      {
        heading: "Results from our campaigns",
        paragraphs: [
          "For Aditya Birla Health Insurance's Jump For Health, creator-led videos turned a jumping challenge into a social cause: 60,324 jumps, 806,736 views and 54,877 likes, supporting six prosthetic-leg donations.",
          "For The WorldGrad, 25 creators delivered 500K+ reach and 50K+ engagement, and the brand's following grew from 400 to 5,000.",
        ],
      },
      {
        heading: "Sectors we work in",
        paragraphs: [
          "Banking, financial services and insurance make up much of our work, for clients including Aditya Birla Health Insurance, Aditya Birla Sun Life Insurance and Mahindra Finance. We also run campaigns in education, fashion, beauty, lifestyle, food and beverage, travel, technology and real estate.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do you choose the right influencers for a brand?",
        answer:
          "We start from the audience, not the follower count. Creators are shortlisted from our network of more than 1,00,000 against who the brand needs to reach, then checked against the brief before anyone is approached.",
      },
      {
        question: "Do you work with celebrities as well as creators?",
        answer:
          "Yes. Genesis.Influence runs celebrity partnerships alongside creator campaigns, from behind-the-scenes content with Vikrant Massey for ABHI Activ One to creator-led series across health, finance and lifestyle.",
      },
      {
        question: "Can you run UGC campaigns at scale?",
        answer:
          "Yes. Bulk creator activations and UGC campaigns are core services: we design the mechanic, brief and coordinate the creators, manage approvals and concentrate publishing so the campaign is seen as one moment.",
      },
      {
        question: "How do you measure an influencer campaign?",
        answer:
          "Against numbers agreed before launch. We track and report views, reach and engagement, meaning likes, comments and shares, and tie them back to the campaign's own goal, whether that is participation, traffic or awareness.",
      },
      {
        question: "Where is Genesis Media based?",
        answer:
          "In Mumbai. We run influencer campaigns with creators across India, for brands based anywhere.",
      },
    ],
    proof: [
      "abhi-jump-for-health-2023",
      "the-worldgrad",
      "abhi-yogabae",
      "activ-one-bts-with-vikrant-massey",
      "mahindra-finance-shubh-utsav",
      "absli-pun-se-policy-tak",
    ],
  },
  {
    slug: "content-production",
    division: "Studios",
    vertical: "Studios",
    seo: {
      title: "Video & Content Production Agency in Mumbai",
      description:
        "Genesis Studios handles strategy, scripting, shoots and post-production in-house in Mumbai: reels, brand films, product explainers, podcasts and event films.",
    },
    schema: { name: "Video and content production", serviceType: "Video production" },
    heading: { lead: "Video & content production", accent: "in Mumbai" },
    intro:
      "Genesis.Studios is the production division of Genesis Media. Strategy, scripting, shooting, editing and post-production sit with one team, so a campaign never loses its thread between the idea and the published cut, whether that is a single founder-led reel or a six-film customer education library.",
    blocks: [
      {
        heading: "Production services",
        items: [
          {
            title: STUDIOS.services[0],
            body: "Ideation, scripts and storyboards written for the placement a film will actually run in, then shot and cut by the same team that wrote them.",
          },
          {
            title: STUDIOS.services[1],
            body: "Reels and short-form content, podcast planning and shoots, DVCs and product explainers, delivered in vertical and landscape versions for every platform.",
          },
          {
            title: STUDIOS.services[2],
            body: "Founder-led shoots that put the people behind a brand on camera, directed so they still sound like themselves.",
          },
          {
            title: "Studio & venue rentals",
            body: "Studio and venue rentals for shoots that need a controlled set, with or without our crew.",
          },
          {
            title: "Editing & post-production",
            body: "Cut, colour, sound and motion: the stage where timing decides whether content works.",
          },
        ],
      },
      {
        heading: "From brief to final cut",
        paragraphs: [
          "Every project runs through the same five stages. Brief sets the goal, the audience and the format. Script covers the concept, the script and the storyboard. Shoot is direction, set and performance. Edit is the cut, colour, sound and motion. Delivery is every platform, ready to play.",
        ],
      },
      {
        heading: "What we produce",
        paragraphs: [
          "Product explainers and customer education: six claims-education films for Aditya Birla Health Insurance, Activ Travel plan films that combined real performances with AI environments, and a presenter-led guide to the DHA face scan.",
          "Brand, launch and leadership films, including the launch of ABHI Activ One, Mahindra Finance's Founders' Day 2025 film and CEO and executive communications.",
          "Health content made with experts: World Menopause Day with gynaecologist Dr Ameya Kanakiya, and Mpower Minds with psychologist Dr Reet Patel, whose four films drew 20K+ views.",
        ],
      },
      {
        heading: "Event films and coverage",
        paragraphs: [
          "We cover corporate events and shape them into social-first films rather than chronological records. At UMANG 2024 we coordinated direction, videography and editing across multiple zones and stages and delivered 29 videos within one week. For Manthan, Power of Ten, we mastered two high-resolution films for a live LED environment.",
        ],
      },
    ],
    faqs: [
      {
        question: "What kind of videos does Genesis Studios produce?",
        answer:
          "Reels and short-form content, brand and launch films, DVCs, product explainers, podcasts, founder-led content, leadership communications and event films, with vertical and landscape versions for every platform.",
      },
      {
        question: "Do you handle scripting and post-production in-house?",
        answer:
          "Yes. Strategy, scripting, shooting, editing and post-production all sit with one team in Mumbai, so nothing is lost in a handover between suppliers.",
      },
      {
        question: "Can you produce founder-led content and podcasts?",
        answer:
          "Yes. Founder-led shoots and podcast planning and production are both part of what Genesis Studios offers.",
      },
      {
        question: "Do you shoot corporate events?",
        answer:
          "Yes. We plan the coverage, shoot and edit event films and aftermovies. At UMANG 2024 that meant 29 videos delivered within one week.",
      },
      {
        question: "Do you offer studio or venue rentals?",
        answer:
          "Yes, for shoots that need a controlled set. Tell us the dates and the format you have in mind.",
      },
    ],
    proof: [
      "umang-2024",
      "abhi-claims-education",
      "unveiling-activ-one",
      "mahindra-finance-founders-day-2025",
      "abhi-diabetes-awareness",
      "mpower-minds-x-abhi",
    ],
  },
  {
    slug: "ai-content-automation",
    division: "AI Lab",
    vertical: "AI Lab",
    seo: {
      title: "AI Avatars, AI Content & Automation Agency",
      description:
        "Genesis AI Lab builds realistic AI avatars, voice clones, multilingual AI videos and AI-powered automations that help brands and businesses in India scale.",
    },
    schema: { name: "AI avatars, AI content and automation", serviceType: "AI content production" },
    heading: { lead: "AI avatars, AI content", accent: "& automation" },
    intro:
      "Genesis.AI Lab is the AI division of Genesis Media. We build realistic AI avatars and voice clones, produce multilingual and personalised AI video at scale, and design AI-powered automations, games and apps, so content keeps coming without a shoot behind every post.",
    blocks: [
      {
        heading: "AI services",
        items: [
          {
            title: AI_LAB.services[0],
            body: "Realistic presenter avatars with calibrated voice direction and lip-sync, tailored for founders, creators, influencers and artists, and for brands that need one consistent face across many videos.",
          },
          {
            title: AI_LAB.services[1],
            body: "One script versioned for different languages and audiences, so a message reaches each of them in its own words without a new shoot for every version.",
          },
          {
            title: AI_LAB.services[2],
            body: "Modular storytelling systems that keep producing. For ABHI Activ Yuva, avatars Adi and Diya front a framework covering product explainers, HealthReturns, OPD and maternity cover.",
          },
          {
            title: AI_LAB.services[3],
            body: "AI-powered workflows for MSMEs, SMEs, startups and growing businesses that automate repetitive tasks, simplify operations and save time, alongside AI games and apps.",
          },
        ],
      },
      {
        heading: "AI avatars that look real",
        paragraphs: [
          "Our roster includes Adi and Diya, who front Aditya Birla Health Insurance's Activ Yuva films; Advocate Bharat, who presents concise legal-awareness videos; and custom avatars of Genesis's own team, built from real references to prove the workflow for explainers and internal communications.",
          "Every avatar is built for the person or brand it represents, whether that is a founder, a creator, an influencer or an artist, and it keeps delivering automated AI content for brand and personal social media.",
        ],
      },
      {
        heading: "AI video without a conventional shoot",
        paragraphs: [
          "For SINet Seervi Township we generated more than 70 visual clips and assembled them into one township story without a property shoot. For House of Hiranandani's Maitri Park, AI-led architectural and lifestyle visualisation carried the project's character in a cinematic social format.",
          "AI also extends live action: ABHI's Activ Travel films combined real performances with AI environments instead of a multi-country shoot.",
        ],
      },
      {
        heading: "Automate your business with AI",
        paragraphs: [
          "We build AI-powered workflows for MSMEs, SMEs, startups and growing businesses to automate repetitive tasks, simplify operations and save time. Less manual work. Smarter workflows. Faster growth.",
          "Our stack includes ChatGPT, Claude, Google Gemini, Midjourney, Runway, Kling, Higgsfield and ElevenLabs, connected to the tools teams already use, from Google Docs, Sheets and Drive to GitHub.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is an AI avatar?",
        answer:
          "A digital presenter, built from a real person's likeness or designed from scratch, with a cloned or directed voice and lip-sync, that can front videos without a shoot for each one. Genesis builds them for brands, founders, creators and artists.",
      },
      {
        question: "Can AI avatars speak different languages?",
        answer:
          "Yes. Multilingual and personalised videos are a core AI Lab service, so one avatar and one script can be versioned for different languages and audiences.",
      },
      {
        question: "Can you create an AI avatar of our founder or team?",
        answer:
          "Yes. We have built custom avatars from real team references, including Genesis's own founder and head of creative, covering image preparation, motion, lip-sync and short-form presenter formats.",
      },
      {
        question: "What can AI automation do for a small business?",
        answer:
          "Take repetitive work off the team. We design AI-powered workflows for MSMEs, SMEs and startups that simplify operations and save time. Tell us where the manual work is and we will map what can be automated.",
      },
      {
        question: "Which brands use Genesis AI content?",
        answer:
          "Aditya Birla Health Insurance's Activ Yuva films are fronted by our avatars Adi and Diya, Advocate Bharat uses an AI avatar for legal-awareness videos, and House of Hiranandani and SINet have used our AI video production for real estate.",
      },
    ],
    proof: [
      "abhi-activ-yuva-adi-and-diya",
      "sinet-seervi-township",
      "house-of-hiranandani-maitri-park",
      "advocate-bharat",
      "custom-ai-avatar-prototypes",
      "abhi-activ-travel",
    ],
  },
  {
    slug: "brand-design",
    division: "Brand & Design",
    vertical: "Brand & Design",
    seo: {
      title: "Brand Identity & Design Agency in Mumbai",
      description:
        "Genesis Brand & Design builds brand positioning, visual identities, guidelines, social-first design, motion, pitch decks and collaterals for brands in India.",
    },
    schema: { name: "Brand identity and design", serviceType: "Brand design" },
    heading: { lead: "Brand identity & design", accent: "in Mumbai" },
    intro:
      "Genesis.Brand & Design is the branding division of Genesis Media. We build brand positioning and guidelines, visual identities, social-first design, motion and brand collaterals, made for the sixth-second crop and not just the pitch deck.",
    blocks: [
      {
        heading: "Branding and design services",
        items: [
          {
            title: BRAND_DESIGN.services[0],
            body: "Where the brand stands, and the rules that keep it recognisable everywhere it appears: identity, typography, colour and usage, written down as guidelines a team can follow.",
          },
          {
            title: BRAND_DESIGN.services[1],
            body: "Campaign toolkits, curated content and design systems made for the feed first, so the identity survives contact with it.",
          },
          {
            title: BRAND_DESIGN.services[2],
            body: "Pitch decks, presentations and brand collaterals that carry the same system into the room.",
          },
          {
            title: "Motion design",
            body: "Motion graphics and animated explainers, from award-show typography to game-inspired health content.",
          },
        ],
      },
      {
        heading: "Selected branding work",
        paragraphs: [
          "TripGate: branding and guidelines for a luxury travel brand, down to a locked five-colour palette, then carried into a fast, aspirational destination film by Genesis Studios.",
          "Activ Health App: a logo redesign for Aditya Birla Health Insurance's app, developed through a sequence of sketch phases to the finished mark.",
        ],
      },
      {
        heading: "Design that works with production",
        paragraphs: [
          "Brand & Design sits alongside Studios, Influence and the AI Lab, so the identity we build is the one the films, creator content and AI videos use. Motion pieces like Income Protect and Eat Move Heal for Aditya Birla Health Insurance, and the award-show world of ABHI Ka Star, show that system in motion.",
        ],
      },
    ],
    faqs: [
      {
        question: "What does a brand identity project include?",
        answer:
          "Positioning, a visual identity covering logo, colour and typography, and guidelines that set out how to use it, followed by the collaterals and social templates the brand needs first.",
      },
      {
        question: "Do you redesign existing logos?",
        answer:
          "Yes. The Activ Health App logo was a redesign rather than a new identity, developed through sketch phases to the finished mark.",
      },
      {
        question: "Can you design pitch decks and brand collaterals?",
        answer:
          "Yes. Pitch decks and brand collaterals are one of the division's three core services.",
      },
      {
        question: "Do you create motion design and social media templates?",
        answer:
          "Yes. Motion design, campaign toolkits and social-first design are part of the service, built to be used by your team as well as by our Studios and Influence teams.",
      },
    ],
    proof: ["tripgate", "income-protect-cover", "eat-move-heal", "abhi-ka-star"],
  },
];

export function findServicePage(slug: string): ServicePage | undefined {
  return servicePages.find((page) => page.slug === slug);
}

/** For the four route files, which name their own page and cannot miss. */
export function servicePage(slug: ServicePage["slug"]): ServicePage {
  const page = findServicePage(slug);
  if (!page) throw new Error(`No service page "${slug}" in lib/services`);
  return page;
}

/** The division page a vertical's work belongs to, for case-study backlinks. */
export function servicePageForVertical(vertical: Vertical): ServicePage | undefined {
  return servicePages.find((page) => page.vertical === vertical);
}

/** The deck's service lines for a division, for the Service schema. */
export function serviceOffers(page: ServicePage): readonly string[] {
  const division = {
    Influence: INFLUENCE,
    Studios: STUDIOS,
    "AI Lab": AI_LAB,
    "Brand & Design": BRAND_DESIGN,
  }[page.division];
  return division.services;
}

/** The division's tagline and ramp, from the homepage copy, for the lockup. */
export function divisionArt(page: ServicePage): { caption: string; ramp: string } {
  const division = {
    Influence: INFLUENCE,
    Studios: STUDIOS,
    "AI Lab": AI_LAB,
    "Brand & Design": BRAND_DESIGN,
  }[page.division];
  return { caption: division.caption, ramp: division.ramp };
}
