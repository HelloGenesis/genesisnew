import { isPending } from "./home-content";
import { findCopy } from "./case-study-copy";
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
  /**
   * What the work IS, shown as the poster's label. A list where Genesis gave
   * a card two ("event shoot and aftermovie - two tabs"); each is its own pill.
   */
  discipline: string | string[];
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
  /**
   * Which study in Genesis's case-study master this card is (lib/
   * case-study-copy, numbered 1-40). Where set, its brand, headline and
   * write-up replace this entry's own — see `caseStudyList`.
   */
  copy?: number;
  /** Slugs in lib/work.ts that belong to this campaign. */
  work?: string[];
};

const studies: CaseStudy[] = [
  {
    slug: "mahindra-finance-influencer-campaign",
    copy: 35,
    client: "Mahindra Finance",
    vertical: "Studios",
    discipline: "Event film",
    work: ["mahindra-finance-brand-film"],
    heroClip: "studios-mahindra-cut-44",
    campaign: "Founders' Day 2025",
  },
  {
    slug: "aditya-birla-capital-content-campaign",
    copy: 1,
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
    copy: 15,
    client: "Aditya Birla Capital",
    campaign: "Adi · AI Avatar",
    vertical: "AI Lab",
    discipline: "AI avatar",
    work: ["aditya-birla-capital-ai-content"],
    heroClip: 29,
  },
  {
    slug: "mahindra-finance-content-production",
    copy: 8,
    client: "Mahindra Finance",
    vertical: "Studios",
    discipline: "UGC",
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
    copy: 2,
    client: "Aditya Birla Capital",
    campaign: "#JumpForHealth",
    vertical: "Influence",
    discipline: "UGC",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 8,
  },
  {
    slug: "abhi-ka-star",
    copy: 27,
    client: "Aditya Birla Health Insurance",
    campaign: "ABHI Ka Star",
    vertical: "Studios",
    discipline: "Reels",
    work: ["abhi-health-content"],
    heroClip: "studios-abhi-ka-star",
  },
  {
    slug: "abhi-100-health",
    copy: 38,
    client: "Aditya Birla Health Insurance",
    campaign: "100% Health & 100% Health Insurance",
    vertical: "Studios",
    discipline: ["Event shoot", "Aftermovie"],
    work: ["abhi-health-content"],
    heroClip:
      "studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance",
  },
  {
    slug: "income-protect",
    copy: 33,
    client: "Genesis Studios",
    campaign: "Income Protect",
    vertical: "Studios",
    discipline: "Motion graphics & design",
    work: ["studios-motion-design"],
    heroClip: "studios-7-draft6-income-protect",
  },
  {
    slug: "aditya-birla-capital-bombay-running",
    copy: 6,
    client: "Aditya Birla Capital",
    campaign: "Bombay Running Crew",
    vertical: "Influence",
    discipline: "Influencer community campaign",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 13,
  },
  {
    slug: "aditya-birla-capital-lets-face-it",
    copy: 4,
    client: "Aditya Birla Capital",
    campaign: "#LetsFaceIt 2024",
    vertical: "Influence",
    discipline: "Influencer campaign",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 3,
  },
  {
    slug: "aditya-birla-capital-vikrant-massey",
    copy: 3,
    client: "Aditya Birla Capital",
    campaign: "BTS with Vikrant Massey",
    vertical: "Influence",
    discipline: ["BTS", "Celebrity"],
    work: ["aditya-birla-capital-campaign"],
    heroClip: 2,
  },
  {
    slug: "abhi-world-menopause-day",
    copy: 28,
    client: "Aditya Birla Health Insurance",
    campaign: "World Menopause Day",
    vertical: "Studios",
    discipline: ["Studios", "Shoot & post"],
    work: ["abhi-health-content"],
    heroClip: "studios-final-menopause-abhi-02",
  },
  {
    slug: "house-of-hiranandani",
    copy: 17,
    client: "House of Hiranandani",
    campaign: "Brand Content",
    vertical: "AI Lab",
    discipline: "Real estate",
    work: ["house-of-hiranandani-content"],
    heroClip: 32,
  },
  {
    slug: "aditya-birla-capital-matcha",
    copy: 6,
    client: "Aditya Birla Capital",
    campaign: "Matcha",
    vertical: "Influence",
    discipline: "Influencer campaign",
    work: ["aditya-birla-capital-campaign"],
    heroClip: 9,
  },
  {
    slug: "ai-avatar-bharat",
    copy: 18,
    client: "Bharat",
    campaign: "AI Avatar",
    vertical: "AI Lab",
    discipline: ["AI avatar", "Founder-led"],
    work: ["ai-avatar-bharat"],
    heroClip: "ai-lab-bharat-bharat",
  },
  {
    slug: "ai-avatar-tanvi",
    copy: 19,
    client: "Tanvi",
    campaign: "AI Avatar",
    vertical: "AI Lab",
    discipline: ["AI avatar", "Founder-led"],
    work: ["ai-avatar-tanvi"],
    heroClip: "ai-lab-tanvi-uiiui",
  },
];

/**
 * THE SLIDER'S ORDER, Genesis's for the first five: Adi, Vikrant, Akash's
 * #JumpForHealth, Bharat, Mahindra Finance. The rest follow in an order that
 * alternates clients and divisions so no two neighbours look alike. Anything
 * not named here keeps its place at the end.
 */
const ORDER = [
  "aditya-birla-capital-brand-performance",
  "aditya-birla-capital-vikrant-massey",
  "aditya-birla-capital-jump-for-health",
  "ai-avatar-bharat",
  "mahindra-finance-content-production",
  "abhi-ka-star",
  "ai-avatar-tanvi",
  "aditya-birla-capital-lets-face-it",
  "house-of-hiranandani",
  "abhi-world-menopause-day",
  "aditya-birla-capital-bombay-running",
  "income-protect",
  "abhi-100-health",
  "aditya-birla-capital-matcha",
  "mahindra-finance-influencer-campaign",
  "aditya-birla-capital-content-campaign",
  /*
    THE ONE EVENT CARD SITS LAST. The interleaving above exists so no two
    neighbours look alike, and this is the only card on the board whose
    footage is an aftermovie rather than a campaign cut.

    NHPS AND GENESISDRIP WERE HERE AND ARE NOT ANY MORE. Both were added at
    Genesis's request and both have since been withdrawn — GenesisDrip from
    the site entirely, NHPS with the events section it was built to support.
    Neither had a written study behind it yet, so nothing is lost but the
    placeholder.
  */
  "genesis-event-films",
];

const rank = (slug: string) => {
  const index = ORDER.indexOf(slug);
  return index === -1 ? ORDER.length : index;
};

/*
  THE MASTER'S COPY WINS. A card linked to a study takes that study's brand
  name — the PDF files clips 1-15 under Aditya Birla Health Insurance, not
  Capital — and its headline and write-up. The brief, approach and execution
  are carried as the three narrative fields, which is also what marks the
  study published.
*/
export const caseStudyList: CaseStudy[] = [...studies]
  .sort((a, b) => rank(a.slug) - rank(b.slug))
  .map((study) => {
    const copy = study.copy === undefined ? undefined : findCopy(study.copy);
    if (!copy) return study;
    return {
      ...study,
      client: copy.brand,
      headline: copy.headline,
      problem: copy.brief.join("\n\n"),
      strategy: copy.approach.join("\n\n"),
      execution: copy.execution.join(" · "),
    };
  });

export function findCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudyList.find((study) => study.slug === slug);
}

/** A study's labels as a list, whichever way it was written. */
export function disciplines(study: CaseStudy): string[] {
  return Array.isArray(study.discipline) ? study.discipline : [study.discipline];
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
  headingAccent: "moved a number.",
  body:
    "Not a gallery. The problem, what we decided to do about it, and what changed. Every study here ends in a number the client agreed to.",
  /*
    THE HOMEPAGE RAIL'S OWN STANDFIRST, and it is a different sentence from
    `body` on purpose.

    `body` is written for the /case-studies PAGE, where every card below it
    is a published study and the promise "ends in a number the client agreed
    to" is one the page keeps. On the homepage the same line sat over four
    posters that mostly cannot keep it yet, so it was taken off and the
    heading stood alone — which Genesis then read as a section with nothing
    under its title.

    This is the line they wrote for that slot. It says what the rail IS
    without promising what each card contains, which is the difference that
    lets it ship today.
  */
  lead:
    "Selected campaigns, content and creative work built to deliver real business outcomes.",
} as const;
