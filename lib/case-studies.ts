import { isPending } from "./home-content";
import type { Vertical } from "./work";

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
  heroClip?: number;

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
];

export function findCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudyList.find((study) => study.slug === slug);
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
