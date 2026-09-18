import { caseStudyList, disciplines } from "./case-studies";
import { caseStudyCopy, type CaseStudyCopy } from "./case-study-copy";
import { clipRatio } from "./clip-shape";
import { filmUrl } from "./films";
import { mediaUrl } from "./media-url";
import { reelClip, reelPoster } from "./work";

/**
 * ONE PAGE PER WRITTEN STUDY, at /case-studies/<slug>.
 *
 * THE WRITE-UPS WERE INVISIBLE TO SEARCH. All thirty-six lived in a dialog
 * that a button opened, so the server sent them only as serialised props for
 * the client to render on demand — measured, the Jump For Health brief was in
 * the page's RSC payload and nowhere in its HTML. Roughly 8,700 words of
 * Genesis's best material, written from an "SEO Case Study Blog Master" with
 * a slug and a target keyword per study, and not one word of it indexable.
 *
 * THE SLUG IS THE MASTER'S. Each study in lib/case-study-copy carries the
 * URL Genesis's SEO document chose for it ("abhi-jump-for-health-2023"), so
 * that is the URL. The four film-only pieces have no write-up and so no page;
 * they stay on the index as films.
 *
 * THE DIALOG STAYS. The index and the homepage rail still open a study over
 * the page on a plain click — cards are now links to these URLs, so a
 * crawler, a cmd-click or a shared link reaches the page, and a reader gets
 * the window they always had.
 */

export type CaseStudyPage = {
  slug: string;
  path: string;
  copy: CaseStudyCopy;
  /** The slider's labels where the study has a card there, else its division. */
  labels: string[];
  poster: string;
  preview: string;
  /** The full-length film where Drive serves one. */
  film?: string;
  ratio: number;
  seo: { title: string; description: string };
};

const BRAND = " | Genesis Media";

/**
 * "<campaign> Case Study", when that fits Google's ~60-character title
 * without the brand being cut off; the campaign alone when it does not.
 * Every one of the thirty-six lands between 35 and 57 characters.
 */
function titleFor(copy: CaseStudyCopy): string {
  const full = `${copy.campaign} Case Study`;
  return `${full}${BRAND}`.length <= 60 ? full : copy.campaign;
}

const MIN = 140;
const MAX = 160;

const sentences = (text: string) =>
  text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text.trim()];

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * A 140–160 character description, built from WHOLE SENTENCES of the
 * study's own copy — never cut off mid-thought with an ellipsis.
 *
 * The brief's first sentence or the headline, followed by the first of these
 * that fits: the verified result, the service and client, the service, or
 * just the client. Whichever combination lands in range wins; failing that,
 * the longest that fits. Measured over all thirty-six: thirty-four land
 * in 140–160, none is truncated, and no two are the same.
 */
function descriptionFor(copy: CaseStudyCopy): string {
  const bodies = [sentences(copy.brief[0])[0], `${copy.headline}.`];
  const tails = [
    copy.highlight ? `Results: ${copy.highlight}` : undefined,
    `${capitalise(copy.service)} for ${copy.brand}.`,
    `${capitalise(copy.service)} by Genesis Media.`,
    `Case study for ${copy.brand}.`,
    "",
  ].filter((tail): tail is string => tail !== undefined);

  let best = { text: sentences(copy.brief[0])[0], score: Infinity };
  for (const [b, body] of bodies.entries()) {
    for (const [t, tail] of tails.entries()) {
      const text = tail ? `${body} ${tail}` : body;
      if (text.length > MAX) continue;
      // In range beats out of range; then the brief over the headline, and
      // the earlier tail — the result — over the later ones.
      const score = (text.length >= MIN ? 0 : 100 + MIN - text.length) + b * 5 + t;
      if (score < best.score) best = { text, score };
    }
  }
  return best.text;
}

/** The slider's labels for a study where it has a card, else its division. */
export function labelsFor(copy: CaseStudyCopy): string[] {
  const card = caseStudyList.find((study) => study.copy === copy.n);
  return card ? disciplines(card) : [copy.division];
}

export const caseStudyPages: CaseStudyPage[] = caseStudyCopy.map((copy) => ({
  slug: copy.slug,
  path: `/case-studies/${copy.slug}`,
  copy,
  labels: labelsFor(copy),
  poster: mediaUrl(reelPoster(copy.clip)),
  preview: mediaUrl(reelClip(copy.clip)),
  film: filmUrl(copy.clip),
  ratio: clipRatio(copy.clip),
  seo: { title: titleFor(copy), description: descriptionFor(copy) },
}));

export function findCaseStudyPage(slug: string): CaseStudyPage | undefined {
  return caseStudyPages.find((page) => page.slug === slug);
}

/** The page for a study by its number in the master, for linking cards. */
export function caseStudyPath(n: number | undefined): string | undefined {
  if (n === undefined) return undefined;
  return caseStudyPages.find((page) => page.copy.n === n)?.path;
}

/**
 * THE OLD SLUGS. Before the pages folded into the landing page, studies
 * lived at /case-studies/<slug from lib/case-studies> — "aditya-birla-capital-
 * jump-for-health" and so on. Anything still linking there is sent to the
 * study's page under its new name rather than to a 404.
 */
export function currentSlugFor(legacySlug: string): string | undefined {
  const study = caseStudyList.find((entry) => entry.slug === legacySlug);
  if (study?.copy === undefined) return undefined;
  return caseStudyPages.find((page) => page.copy.n === study.copy)?.slug;
}

/** Other studies from the same division, for the foot of a study. */
export function relatedStudies(page: CaseStudyPage, count = 3): CaseStudyPage[] {
  return caseStudyPages
    .filter(
      (other) => other.slug !== page.slug && other.copy.division === page.copy.division,
    )
    .slice(0, count);
}
