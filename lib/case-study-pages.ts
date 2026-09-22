import { caseStudyList, disciplines, isPublished, type CaseStudy } from "./case-studies";
import { caseStudyCopy, type CaseStudyCopy } from "./case-study-copy";
import { clipRatio } from "./clip-shape";
import { filmUrl } from "./films";
import { mediaUrl } from "./media-url";
import { findWork, reelClip, reelPoster, type ReelId } from "./work";

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

/**
 * The published study a given CLIP belongs to, as a path under /case-studies.
 *
 * WHY THIS IS A SEARCH AND NOT A LOOKUP. A clip id addresses a file; a study
 * names the WORK it covers, and a piece of work owns several clips. So the
 * link between a video on screen and the story behind it runs
 * clip -> work item -> study, and no one of those three holds the whole
 * chain. Two ways in, in order of confidence:
 *
 *   ITS OWN HERO. A study that names this exact clip as its `heroClip` is the
 *     strongest possible match — that is the film the study leads with.
 *   ITS PARENT ENGAGEMENT. Otherwise, find the catalogue piece whose `reel`
 *     contains this clip and return a study that covers that piece. Fifteen
 *     Aditya Birla cuts belong to one engagement, and a reader clicking the
 *     ninth of them means the campaign, not the file.
 *
 * IT LIVES HERE AND NOT IN lib/case-studies, WHICH IS A CYCLE AND NOT A
 * preference. It needs `caseStudyPath` to turn a study into a URL, and that
 * lives in this file — which already imports `caseStudyList` from
 * case-studies. Putting the function on the other side of that edge made the
 * two modules import each other, and the build failed the way a circular
 * import always does: "Cannot access 'i' before initialization", from a
 * route that touches neither function. The rule is one-directional —
 * case-studies holds the DATA, this file holds everything that needs a page.
 *
 * UNDEFINED WHERE THERE IS NO STUDY, which is the common case and must stay
 * cheap to handle. Genesis asked that clicking a video open its case study;
 * where none is written, there is nothing to open, and a caller is expected
 * to render something unclickable rather than invent a destination. It also
 * returns undefined for a study that exists but is not PUBLISHED — a link to
 * a client's name and an empty page is worse than no link.
 */
export function caseStudyPathForClip(id: ReelId | undefined): string | undefined {
  const study = caseStudyForClip(id);
  return study && caseStudyPath(study.copy);
}

/**
 * The STUDY behind a clip, rather than its URL.
 *
 * WHY BOTH EXIST. `caseStudyPathForClip` answers "where does this link go",
 * which is what an <a href> needs so a crawler can follow it and a reader can
 * cmd-click it into a tab. This answers "what is the study", which is what a
 * dialog needs to render it over the page without navigating anywhere. The
 * same card wants both — see StudiosPipeline, where the href is the honest
 * destination and the click is intercepted.
 *
 * The matching rules are `caseStudyPathForClip`'s, and deliberately shared:
 * its own body now calls this, so a clip can never resolve to one study for
 * the link and a different one for the window.
 */
export function caseStudyForClip(id: ReelId | undefined): CaseStudy | undefined {
  if (id === undefined) return undefined;

  const direct = caseStudyList.find((study) => study.heroClip === id);
  const viaWork = caseStudyList.find((study) =>
    study.work?.some((slug) => findWork(slug)?.reel?.includes(id)),
  );

  const study = direct ?? viaWork;
  return study && isPublished(study) ? study : undefined;
}

/**
 * The study a PAGE slug belongs to — "activ-one-bts-with-vikrant-massey" back
 * to the entry in the catalogue.
 *
 * THE TWO VOCABULARIES ARE NOT THE SAME and this is the bridge. A study in
 * lib/case-studies has its own slug ("aditya-birla-capital-vikrant-massey")
 * and a `copy` number pointing into the master, which has a slug of its own —
 * and it is the MASTER'S slug that the URL is built from. Anything holding a
 * URL-shaped reference (a creator's `caseStudy`, a link somebody pasted) is
 * therefore speaking the second language and has to be translated before a
 * dialog can render it.
 */
export function caseStudyForPageSlug(slug: string | undefined): CaseStudy | undefined {
  if (!slug) return undefined;
  const page = caseStudyPages.find((entry) => entry.slug === slug);
  if (!page) return undefined;
  return caseStudyList.find((study) => study.copy === page.copy.n);
}
