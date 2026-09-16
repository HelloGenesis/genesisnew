import { isPending } from "./home-content";
import { findWork, type ReelId, type Vertical } from "./work";

/**
 * CASE STUDIES — a different question from the portfolio.
 *
 * The brief draws the line and the site did not: Portfolio answers "what has
 * Genesis made?", Case Studies answers "can Genesis solve my business
 * problem?". So this is not a prettier gallery. Every entry is shaped
 * Problem -> Strategy -> Execution -> Result, and a piece of work belongs here
 * only when there is a measured outcome to put at the end of it.
 *
 * IT IS A PAGE, NOT AN ANCHOR. "Case Studies" in the nav pointed at a section
 * on the homepage, which is the one thing the brief says it must not be — a
 * marketing head evaluating Genesis needs a URL they can send to a colleague,
 * and a homepage anchor is not that.
 *
 * THE NARRATIVE IS EMPTY AND THAT IS DELIBERATE. The four clients are real and
 * confirmed. Problem, strategy, execution and every metric are Genesis's to
 * write; each block is rendered and omitted while pending. A "Results" heading
 * over invented figures beside Aditya Birla's name is not a placeholder, it is
 * a claim about Aditya Birla.
 */

export type CaseMetric = { label: string; value: string };

export type CaseStudy = {
  /** URL segment. Permanent — changing it breaks every shared link. */
  slug: string;
  client: string;
  /** The campaign's own name, where it has one. */
  campaign?: string;
  vertical: Vertical;
  discipline: string;
  /** Pulled from the work catalogue where a piece of this campaign exists. */
  hero?: string;
  heroPoster?: string;
  /**
   * Which numbered clip this study leads with.
   *
   * Without it a study's poster is `work[0]`'s lead clip, so two studies of
   * the SAME client show the same video — Aditya Birla Capital has eighteen
   * films and both of their studies would have opened on the first one. The
   * number addresses /work/clips/<n>.mp4 and its poster, the same convention
   * the catalogue uses.
   */
  heroClip?: ReelId;

  /** The one figure a card leads with. */
  headline?: string;
  problem?: string;
  strategy?: string;
  execution?: string;
  results?: CaseMetric[];
  /** Slugs in lib/work.ts that belong to this campaign. */
  work?: string[];
};

export const caseStudyList: CaseStudy[] = [
  {
    slug: "mahindra-finance-influencer-campaign",
    client: "Mahindra Finance",
    vertical: "Influence",
    discipline: "Influencer + content campaign",
    work: ["mahindra-finance-influencer-campaign"],
  },
  {
    slug: "aditya-birla-capital-content-campaign",
    client: "Aditya Birla Capital",
    vertical: "Influence",
    discipline: "Content & campaign",
    work: ["aditya-birla-capital-campaign"],
  },
  /*
   * THESE TWO CHANGED CLIENT, at Genesis's instruction, and the slugs changed
   * with them. They were Aditya Birla Sun Life Insurance and HDFC — real
   * relationships with no footage in either Drive folder, so both cards sat
   * blank under a play control that started nothing.
   *
   * Genesis asked for a second Aditya Birla Capital film and a second Mahindra
   * Finance one in their place, and for the names to change to match. That
   * last part is what makes it sound: the earlier version of this idea would
   * have run Capital's reel under Sun Life's name, which is a different
   * company and a false claim about both. Renaming the card removes the claim.
   *
   * The slug moves too. A URL reading /case-studies/absli-brand-performance
   * showing Aditya Birla Capital is the same untruth one level down, and
   * nothing links to these yet.
   *
   * `heroClip` gives each its own film — without it both Capital studies would
   * open on clip 1.
   */
  {
    slug: "aditya-birla-capital-brand-performance",
    client: "Aditya Birla Capital",
    vertical: "Influence",
    discipline: "Brand & performance content",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 29,
  },
  {
    slug: "mahindra-finance-content-production",
    client: "Mahindra Finance",
    vertical: "Studios",
    discipline: "Content production",
    work: ["mahindra-finance-influencer-campaign"],
    heroClip: 18,
  },
  /*
   * THE SLIDER'S OTHER TWELVE, added at Genesis's request after the four
   * above, which stay as they were. Six are the portfolio tiles Genesis
   * pointed at; the rest they named — Vikrant Massey, Menopause, House of
   * Hiranandani, Matcha, and the Tanvi and Bharat avatar films.
   *
   * Each one leads with a clip that already lives in the portfolio, so the
   * same file plays in both places. `work` names the catalogue piece it
   * belongs to and `client` is that piece's client, never a new one.
   */
  {
    slug: "aditya-birla-capital-jump-for-health",
    client: "Aditya Birla Capital",
    campaign: "#JumpForHealth",
    vertical: "Influence",
    discipline: "Influencer campaign",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 8,
  },
  {
    slug: "abhi-ka-star",
    client: "Aditya Birla Health Insurance",
    campaign: "ABHI Ka Star",
    vertical: "Studios",
    discipline: "Reels",
    work: ["abhi-health-content"],
    heroClip: "studios-abhi-ka-star",
  },
  {
    slug: "abhi-100-health",
    client: "Aditya Birla Health Insurance",
    campaign: "100% Health & 100% Health Insurance",
    vertical: "Studios",
    discipline: "Reels",
    work: ["abhi-health-content"],
    heroClip:
      "studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance",
  },
  {
    slug: "income-protect",
    client: "Genesis Studios",
    campaign: "Income Protect",
    vertical: "Studios",
    discipline: "Reels",
    work: ["studios-selected-production"],
    heroClip: "studios-7-draft6-income-protect",
  },
  {
    slug: "aditya-birla-capital-bombay-running",
    client: "Aditya Birla Capital",
    campaign: "Bombay Running Crew",
    vertical: "Influence",
    discipline: "Influencer campaign",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 13,
  },
  {
    slug: "aditya-birla-capital-lets-face-it",
    client: "Aditya Birla Capital",
    campaign: "#LetsFaceIt 2024",
    vertical: "Influence",
    discipline: "Influencer campaign",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 3,
  },
  {
    slug: "aditya-birla-capital-vikrant-massey",
    client: "Aditya Birla Capital",
    campaign: "BTS with Vikrant Massey",
    vertical: "Influence",
    discipline: "Celebrity content",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 2,
  },
  {
    slug: "abhi-world-menopause-day",
    client: "Aditya Birla Health Insurance",
    campaign: "World Menopause Day",
    vertical: "Studios",
    discipline: "Reels",
    work: ["abhi-health-content"],
    heroClip: "studios-final-menopause-abhi-02",
  },
  {
    slug: "house-of-hiranandani",
    client: "House of Hiranandani",
    campaign: "Brand Content",
    vertical: "AI Labs",
    discipline: "Real estate",
    work: ["house-of-hiranandani-content"],
    heroClip: 32,
  },
  {
    slug: "aditya-birla-capital-matcha",
    client: "Aditya Birla Capital",
    campaign: "Matcha",
    vertical: "Influence",
    discipline: "Influencer campaign",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 9,
  },
  {
    slug: "ai-avatar-bharat",
    client: "Bharat",
    campaign: "AI Avatar",
    vertical: "AI Labs",
    discipline: "AI avatar",
    work: ["ai-avatar-bharat"],
    heroClip: "ai-lab-bharat-bharat",
  },
  {
    slug: "ai-avatar-tanvi",
    client: "Tanvi",
    campaign: "AI Avatar",
    vertical: "AI Labs",
    discipline: "AI avatar",
    work: ["ai-avatar-tanvi"],
    heroClip: "ai-lab-tanvi-uiiui",
  },
];

export function findCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudyList.find((study) => study.slug === slug);
}

/**
 * The clip a study leads with: its own `heroClip`, else the first clip of the
 * catalogue piece it covers. The poster and the dialog both ask this, so the
 * card and the window it opens can never show two different films.
 */
export function leadClip(study: CaseStudy): ReelId | undefined {
  if (study.heroClip !== undefined) return study.heroClip;
  const piece = study.work?.[0] ? findWork(study.work[0]) : undefined;
  return piece?.reel?.[0];
}

/**
 * True once there is enough written for the page to be worth opening.
 *
 * The index links only to studies that pass this, because the alternative is
 * a card promising "View case study" that opens a client's name and nothing
 * else — which reads as a broken site rather than an unfinished one.
 */
export function isPublished(study: CaseStudy): boolean {
  return Boolean(
    !isPending(study.problem) ||
      !isPending(study.strategy) ||
      !isPending(study.execution) ||
      (study.results && study.results.length > 0),
  );
}

export const caseStudiesPage = {
  label: "Case studies",
  heading: "Work that",
  headingAccent: "moved a number",
  body:
    "Not a gallery. The problem, what we decided to do about it, and what changed. Every study here ends in a number the client agreed to.",
} as const;
