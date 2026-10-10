import type { ReelId, Vertical } from "./work";

/**
 * GENESIS'S WEBSITE CASE STUDIES, 3 OCT 2026 ("Website Case studies.pdf") —
 * ten studies written for the site, each with its card copy, its story, its
 * outcome in figures and its films in the order Genesis listed them.
 *
 * EACH IS LAID OVER AN EXISTING WRITE-UP (lib/case-study-copy), keyed by that
 * write-up's number, rather than added beside it. All ten were already on the
 * site under the earlier master; replacing them in place keeps their page
 * addresses (and every link already shared) and stops a second copy of the
 * same campaign appearing on the index.
 *
 * THE FILMS are Drive masters, ingested by scripts/ingest-drive-clips.mjs
 * from the three folders the PDF links — "Website Case Study Library_Videos",
 * "Activ Yuva | Product Launch Campaign" and "World Menopause Day". Each id
 * is the ingest's slug: a four-second preview and a poster under /public/
 * work, and the full film streamed from Drive by its id (lib/drive-media).
 */
export type Outcome = { value: string; label: string };

export type WebsiteStudy = {
  division: Vertical;
  headline: string;
  campaign: string;
  subtitle?: string;
  /** The short line a card carries. */
  card: string;
  /** The case study itself, as Genesis wrote it. */
  story: string[];
  /** "Outcome" or "Impact" — the PDF uses both. */
  outcomeLabel: "Outcome" | "Impact";
  outcome: Outcome[];
  /** A press mention, shown under the figures. */
  featured?: string;
  /** The films, first one leads. */
  films: ReelId[];
};

export const websiteStudies: Record<number, WebsiteStudy> = {
  /* 1) Activ Yuva — written over the earlier "Activ Yuva: Adi & Diya" (15). */
  15: {
    division: "AI Lab",
    headline: "Activ Yuva Product Launch: A repeatable AI Avatar Content System",
    campaign: "Activ Yuva Product Launch",
    card: "Genesis created Adi and Diya, two realistic AI avatars who made Activ Yuva’s health insurance features easier to understand across launch films, reels, ads and product explainers.",
    story: [
      "Activ Yuva needed a recognisable content style for a youth focused, app led health insurance product. Genesis developed Adi and Diya, defined how they speak and built a repeatable production approach around them. Clear scripts, motion design and app visuals carried that style from the launch film into explainers for HealthReturns, maternity cover, OPD, Travel ON/OFF, Income Protect and Unlimited Sum Insured, as well as short feature introductions.",
    ],
    outcomeLabel: "Outcome",
    outcome: [
      { value: "17M+", label: "views" },
      { value: "2", label: "AI avatars" },
      { value: "16:9 + 9:16", label: "video formats" },
    ],
    films: [
      "8-activ-yuva-male-vo-launch-film-24",
      "1-2-9x16-main-product-explainer-activ-yuva",
      "2-1-9x16-health-returns-activ-yuva",
      "3-9x16-world-wide-maternity-cover-activ-yuva",
      "4-9x16-opd-cover-activ-yuva",
      "5-9x16-travel-on-off-activ-yuva",
      "6-9x16-income-protect-activ-yuva",
    ],
  },

  /* 2) Activ One BTS with Vikrant Massey (3). */
  3: {
    division: "Studios",
    headline: "Activ One Product Launch: Behind the scenes with Vikrant Massey",
    campaign: "Activ One Product Launch",
    card: "Genesis turned on-set access into a fast, social-first behind-the-scenes film that extended the energy of ABHI's Activ One product launch campaign.",
    story: [
      "ABHI wanted audiences to see more than the finished campaign. Genesis shaped the behind-the-scenes material around Vikrant Massey's presence, the pace of the set and the commitment behind the work. Tight filming and editing turned production access into a standalone digital asset rather than a conventional making-of.",
    ],
    outcomeLabel: "Outcome",
    outcome: [
      { value: "100K+", label: "views" },
      { value: "2K+", label: "likes" },
      { value: "200+", label: "shares" },
      { value: "9:16", label: "format" },
    ],
    films: ["1-bts-with-vikrant-massey"],
  },

  /* 3) Jump For Health 2023 (1). */
  1: {
    division: "Influence",
    headline: "Jump For Health 2023: A Movement with a Measurable Social Purpose",
    campaign: "Jump For Health 2023",
    card: "Genesis turned a simple jumping challenge into 60K+ jumps, six prosthetic leg donations and 800K+ views for Aditya Birla Health Insurance.",
    story: [
      "Jump For Health invited people to jump for their health while supporting a social cause: for every 10,000 jumps, Aditya Birla Health Insurance donated one prosthetic leg. The campaign needed to make the action easy to understand, easy to join and meaningful enough to share.",
      "Genesis collaborated with fitness influencer Rashmi Rai to lead the challenge and encourage participation. She contributed 20,000 jumps, while the wider UGC community added 40K+ jumps by tagging the brand with #ABHIxRashmi. Creator content explained the cause, showed how to take part and invited more people to join.",
    ],
    outcomeLabel: "Impact",
    outcome: [
      { value: "60K+", label: "jumps" },
      { value: "6", label: "prosthetic legs donated" },
      { value: "800K+", label: "views" },
      { value: "54K+", label: "likes" },
      { value: "2K+", label: "comments" },
      { value: "2.6K+", label: "shares" },
    ],
    films: ["2-rashmi-rai-jumpforhealth-2023"],
  },

  /* 4) Jump For Health 2024 (2). */
  2: {
    division: "Influence",
    headline: "Jump For Health 2024: Scaling the movement through UGC Creators",
    campaign: "Jump For Health 2024",
    card: "The #JumpForHealth2024 wave paired four lead creators with a broad UGC network, delivering more than 500K views and 30K likes.",
    story: [
      "Jump For Health is a challenge that invites people to jump for their health while supporting a social cause. The second consecutive campaign needed to move beyond a few anchor posts and feel like a movement appearing across many different feeds.",
      "Genesis used four lead creators to establish the idea, then expanded distribution through a large UGC network. The structure made the participation recognisable while giving each contributor room to show the challenge in a personal way through dance moves and fun social-first trends.",
    ],
    outcomeLabel: "Impact",
    outcome: [
      { value: "500K", label: "views" },
      { value: "30K", label: "likes" },
      { value: "30K+", label: "jumps" },
    ],
    films: ["3-jumpforhealth-2024-1", "4-jumpforhealth-2024-2", "5-jumpforhealth-2024-3", "6-jumpforhealth-2024-4"],
  },

  /* 5) Mahindra Finance Shubh Utsav (8). */
  8: {
    division: "Influence",
    headline: "Mahindra Finance Shubh Utsav: A Festive Creator Surge at Scale",
    campaign: "Mahindra Finance Shubh Utsav",
    card: "Genesis brought Mahindra Finance’s #ShubhUtsav vehicle-loan campaign to life with 130+ UGC creators and 130+ live videos published in just three days.",
    story: [
      "Mahindra Finance wanted to build festive-season attention for its vehicle-loan offering. Genesis created #ShubhUtsav as a reward-based selfie contest, coordinated more than 130 creators and managed approvals and publishing across the campaign.",
      "The simple challenge gave people a way to participate, while the chance to win rewards encouraged them to engage with the vehicle-loan offer. Publishing 130+ videos within three days put the contest across many feeds at once and made the campaign feel like a shared festive celebration before Diwali 2025.",
    ],
    outcomeLabel: "Impact",
    outcome: [
      { value: "20M+", label: "views" },
      { value: "700K+", label: "likes" },
      { value: "130+", label: "creators" },
      { value: "130+", label: "live videos" },
      { value: "3", label: "days" },
    ],
    films: ["7-shubhutsav-1", "8-shubhutsav-2", "9-shubhutsav-3", "10-shubhutsav-4", "11-shubhutsav-5", "12-shubhutsav-6", "13-shubhutsav-7"],
  },

  /* 6) The WorldGrad (9). */
  9: {
    division: "Influence",
    headline: "The WorldGrad: Study Abroad Guidance Made Social",
    campaign: "The WorldGrad",
    card: "Genesis partnered with 25 education and travel creators to turn real student questions into practical social content, reaching 500K+ people and generating 50K+ engagements.",
    story: [
      "The WorldGrad, a study-abroad education provider offering pathways with international university partners, needed to reach students considering international education without relying on generic campus imagery.",
      "Genesis selected creators who could speak credibly about studying, travelling and living abroad, then built trend-aware content around the questions students actually ask. Their perspectives made decisions about studying overseas feel more human, practical and shareable.",
    ],
    outcomeLabel: "Impact",
    outcome: [
      { value: "25", label: "creators" },
      { value: "500K+", label: "reach" },
      { value: "50K+", label: "engagements" },
    ],
    films: ["14-worldgrad-1", "15-worldgrad-2", "16-worldgrad-3", "17-worldgrad-4", "18-worldgrad-5"],
  },

  /* 7) #LetsFaceIt, World Heart Day 2024 (4). */
  4: {
    division: "Influence",
    headline: "#LetsFaceIt with Comedy, Skincare and Photography Creators",
    campaign: "#LetsFaceIt",
    subtitle: "World Heart Day 2024",
    card: "Genesis partnered with comedy, skincare and photography influencers to bring ABHI’s #LetsFaceIt heart-health campaign into familiar social formats.",
    story: [
      "For World Heart Day 2024, Aditya Birla Health Insurance launched #LetsFaceIt to encourage people to pay attention to their heart health and try the Face Scan feature in the Activ Health App.",
      "Genesis partnered with comedy, skincare and photography influencers, shaping the message around the content their audiences already enjoyed. The creators tried the scan, shared their health scores and invited followers to take part. The campaign was also featured by Social Samosa, a publication covering advertising, marketing and social media.",
    ],
    outcomeLabel: "Impact",
    outcome: [
      { value: "1.6M+", label: "views" },
      { value: "90K+", label: "likes" },
      { value: "3K+", label: "shares" },
    ],
    featured: "Featured on Social Samosa",
    films: ["19-let-sfaceit-1", "20-let-sfaceit-2", "21-let-sfaceit-3"],
  },

  /* 8) ABHI Ka Star (27). */
  27: {
    division: "Studios",
    headline: "ABHI Ka Star: Making Employee App Access Easy to Follow",
    campaign: "ABHI Ka Star",
    card: "Genesis created a motion-graphics how-to video for ABHI Ka Star, guiding employees through Activ Health App access and feedback.",
    story: [
      "ABHI Ka Star encouraged employees to explore the Activ Health App with free premium access and share feedback on their experience. Genesis turned the instructions into a playful, step-by-step video.",
      "It showed employees how to download the app, log in with their corporate account, switch from a personal account if needed and submit feedback, including screenshots. The film kept the practical steps clear while carrying the campaign’s “star” energy.",
    ],
    outcomeLabel: "Outcome",
    outcome: [
      { value: "Complete", label: "app walkthrough" },
      { value: "9:16", label: "motion graphics video" },
    ],
    films: ["22-abhi-ka-star"],
  },

  /* 9) Dr Ameya Kanakiya on Menopause (28). */
  28: {
    division: "Studios",
    headline: "Dr Ameya Kanakiya on Menopause: Facts, Food and Real Talk",
    campaign: "International Menopause Day 2025",
    subtitle: "International Menopause Day 2025",
    card: "Genesis worked with gynaecologist Dr Ameya Kanakiya and ABHI to make menopause education direct, medically grounded and social-first, earning 1.2M+ views.",
    story: [
      "Menopause is a natural stage of life when menstrual periods end. The transition can also bring changes to sleep, mood and physical wellbeing, yet many women receive too little information about what to expect.",
      "For World Menopause Day 2025, Activ Living wanted to open that conversation with credible, approachable guidance. Genesis built a three-video series with Dr Ameya Kanakiya: a fun 30-second reel rating internet advice to grab attention, a one-minute video on five foods to include during the menopause transition, and a five-minute main film offering a detailed menopause debrief.",
    ],
    outcomeLabel: "Outcome",
    outcome: [
      { value: "1.2M+", label: "views" },
      { value: "200+", label: "shares" },
      { value: "3", label: "videos" },
      { value: "9:16", label: "format" },
    ],
    films: [
      "1-final-menopause-abhi",
      "2-as-a-gynecologist-menopause-specialist",
      "3-rating-intenet-advice-menopause-day-abhi",
    ],
  },

  /* 10) Tanvi, Reimagined (19). */
  19: {
    division: "AI Lab",
    headline: "Tanvi, Reimagined: Digital Avatar for Fashion Advertising",
    campaign: "Tanvi, Reimagined",
    card: "Genesis Media’s Creative Head, Tanvi Panchal, uses her digital avatar made with AI, to explore fashion ads & ideas that move beyond the limits of a conventional shoot.",
    story: [
      "Fashion campaigns often begin with ideas that are difficult to produce in the real world. Tanvi uses a digital version of herself to test how one recognisable face can move through different styling, settings and visual directions.",
      "The avatar gives her space to try surreal campaign concepts, build fashion-led worlds and see how far an idea can go before committing to production with large scale teams. Each experiment begins with creative direction: the look, the mood and the story the image needs to tell. Through this work, she is building a strong personal brand identity in the fields of fashion, design & creative direction.",
    ],
    outcomeLabel: "Outcome",
    outcome: [
      { value: "1", label: "digital avatar" },
      { value: "Fashion-led", label: "visual experiments" },
      { value: "New", label: "campaign directions to develop further" },
    ],
    films: [
      "23-tanvi-ailab-1",
      "24-tanvi-ailab-2mp4",
      "25-tanvi-ailab-3",
      "26-tanvi-ailab-4",
      "27-tanvi-ailab-5",
      "28-tanvi-ailab-6",
      "29-tanvi-ailab-7",
    ],
  },
};

/** The PDF's order — the featured studies, first on every list. */
export const WEBSITE_STUDY_ORDER = [15, 3, 1, 2, 8, 9, 4, 27, 28, 19];
