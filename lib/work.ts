import { mediaUrl } from "./media-url";
import { isPending, services } from "./home-content";

/**
 * THE WORK CATALOGUE — one list, read by everything.
 *
 * Before this there were two: four clients in `portfolio.clients` driving the
 * homepage rail, and ten pieces in `ourWork.items` driving the library at
 * /our-work. They shared no shape, no ids and no vertical, so the homepage
 * and the portfolio were showing different work with no way to move between
 * them, and nothing had a URL.
 *
 * WORK vs PORTFOLIO, the way the brief settles it: "Work" is the homepage
 * section showing the strongest pieces — that is `featured` below. "Portfolio"
 * is the complete library at /our-work. Same data, two views.
 *
 * EVERY PIECE HAS A SLUG, and that is the point of the rewrite. A project can
 * be opened as a modal while browsing and still live at /work/<slug> — a real
 * page that can be shared into a WhatsApp thread, pasted into a proposal and
 * indexed by Google.
 *
 * THE NARRATIVE FIELDS ARE EMPTY ON PURPOSE. Objective, ask, approach,
 * execution and results are Genesis's to write; they are typed and wired and
 * the components omit whatever is still pending, so filling one in makes it
 * appear with no code change. What is NOT done is inventing them — these are
 * real clients, and a fabricated result attributed to Mahindra is a claim
 * about Mahindra.
 */

/**
 * THE FILTER VOCABULARY, rewritten to the list Genesis supplied for the
 * portfolio dashboard.
 *
 * IT IS TWO LISTS, BECAUSE THE SUPPLIED ONE IS TWO KINDS OF THING. Genesis's
 * twelve filters mix what a piece IS — Reels, UGC, Launch Films, Product
 * Explainers — with the sector it was made FOR: Real Estate, F&B, BFSI. Those
 * are independent facets, and collapsing them into the single `format` field
 * this file had would force a false choice on every entry: the Mahindra
 * Finance work is an influencer campaign AND it is BFSI, and tagging it as
 * one loses the other. So `format` keeps the first kind and `tags` carries
 * the second, and a piece can appear under both.
 *
 * WHAT CAME OUT. "Influencer marketing", "Shoots", "Fashion", "Campaigns",
 * "Creators" and "Design & creatives" are not on Genesis's list. Two of them
 * survive under new names — "Campaigns" is now "Influencer Campaigns" and
 * "UGC" is spelled out — and the rest are gone.
 *
 * THE ROW STILL ONLY OFFERS WHAT HAS WORK BEHIND IT. Printing all twelve when
 * five match nothing gives a visitor five ways to empty the grid. The unused
 * ones appear the moment something is tagged with them, which is the point of
 * declaring the whole vocabulary here rather than deriving it.
 */
export const CATEGORIES = [
  "Influencer Campaigns",
  "Reels",
  "User-Generated Content (UGC)",
  "AI Content",
  "Event Shoots",
  "Launch Films",
  "Photo Gallery",
  "Product Explainers",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * The sector facet — the other half of Genesis's filter list.
 *
 * BFSI is written as the acronym because that is how the filter row has to
 * read; the expansion Genesis gives it — Banking, Financial Services & Health
 * Insurance — is the same one the sectors strip carries, and it lives with
 * that strip in lib/home-content rather than being retyped here.
 *
 * "AI Labs" is deliberately NOT here. It is already one of the four verticals
 * and the filter row offers those first, so declaring it a second time would
 * print the same chip twice.
 */
export const WORK_TAGS = [
  "Real Estate",
  "Food & Beverage (F&B)",
  "BFSI",
] as const;

export type WorkTag = (typeof WORK_TAGS)[number];

/**
 * The four verticals, used for filtering and for the project byline.
 *
 * A VALUE AS WELL AS A TYPE, so the filter row can offer them in the brand's
 * own order rather than in whatever order the catalogue happens to mention
 * them. It was a bare union, which a filter builder cannot iterate.
 */
export const VERTICALS = [
  "Influence",
  "Studios",
  "AI Labs",
  "Brand & Design",
] as const;

export type Vertical = (typeof VERTICALS)[number];

export type WorkResult = { label: string; value: string };

export type WorkItem = {
  /** URL segment. Permanent — changing it breaks every shared link. */
  slug: string;
  client: string;
  title: string;
  vertical: Vertical;
  /** What the piece IS. From CATEGORIES. */
  format: Category;
  /**
   * What the piece was made FOR — the sector facet. From WORK_TAGS.
   *
   * Optional and usually short: a piece is tagged only where the sector is
   * something the catalogue actually knows, not inferred from the footage.
   * An untagged piece simply does not appear under a sector filter, which is
   * the right failure — a wrong sector on a named client is a claim about
   * that client.
   */
  tags?: WorkTag[];
  /** Still. Every piece has one; the clip is the upgrade. */
  art?: string;
  /** Muted loop played on hover. Derived from `reel` when that is set. */
  clip?: string;
  poster?: string;
  /**
   * The clips in Genesis's Drive folder that belong to this piece, by number.
   *
   * ONE NUMBER ADDRESSES THREE FILES, because the numbering is identical in
   * all three places: `/work/clips/<n>.mp4` is the 4-second preview,
   * `/work/posters/<n>.jpg` is its frame, and `<n>.mp4` in the Drive folder is
   * the master. Storing paths instead would be three strings per clip that can
   * disagree with each other, and there are thirty-two of them.
   *
   * THE FIRST ONE IS THE TILE. `clip`, `poster` and `art` are all derived from
   * `reel[0]` below unless a piece sets them itself, which is what turns the
   * artwork-less placeholder tiles into real footage without touching a
   * component.
   */
  reel?: number[];
  /** Shown in the homepage Work section. */
  featured?: boolean;

  // --- The mini case study, per the brief -----------------------------------
  objective?: string;
  ask?: string;
  approach?: string;
  whatWeDid?: string[];
  execution?: string;
  results?: WorkResult[];
  /** Set once a full case study page exists for this piece. */
  caseStudyHref?: string;
};

/**
 * VERTICALS ARE INFERRED FROM THE FORMAT, not invented. Reels, films, ads and
 * event coverage are production, so they sit under Studios; the campaign work
 * for the finance clients is creator-led and sits under Influence. Anything
 * that cannot be inferred is left for Genesis to assign rather than guessed.
 *
 * The distribution is lopsided — ten Studios pieces, four Influence, none for
 * AI Labs or Brand & Design — because that is the artwork that exists. The
 * filter row hides tags with nothing behind them rather than presenting empty
 * categories.
 */
const catalogue: WorkItem[] = [

  /*
   * The finance work. Real relationships, named in the brief, with no artwork
   * yet — the grid gives these a typographic tile rather than a grey box, so
   * they read as work awaiting a still rather than as broken images.
   * TODO(assets): key stills or reels for the four below.
   */
  {
    slug: "mahindra-finance-influencer-campaign",
    client: "Mahindra Finance",
    title: "Influencer & Content Campaign",
    vertical: "Influence",
    format: "Influencer Campaigns",
    tags: ["BFSI"],
    featured: true,
    reel: [16, 17, 18, 19, 20],
  },
  {
    slug: "aditya-birla-capital-campaign",
    client: "Aditya Birla Capital Health Insurance",
    title: "Content & Campaign Work",
    vertical: "Influence",
    format: "Influencer Campaigns",
    tags: ["BFSI"],
    featured: true,
    reel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 29, 30, 31],
  },
  {
    slug: "absli-brand-performance",
    client: "Aditya Birla Sun Life Insurance",
    title: "Brand & Performance Content",
    vertical: "Influence",
    format: "Influencer Campaigns",
    tags: ["BFSI"],
  },
  {
    slug: "hdfc-content-production",
    client: "HDFC",
    title: "Content Production",
    vertical: "Studios",
    format: "User-Generated Content (UGC)",
    tags: ["BFSI"],
  },

  /*
   * The four clients that were only ever footage — in the Drive folder and on
   * the Studios reel wall, but with no entry here, so nothing in the portfolio
   * knew they existed.
   *
   * TODO(content): THE VERTICAL AND FORMAT ARE MY GUESS, not Genesis's. The
   * mapping I was given is client names against clip numbers and nothing else,
   * and all thirty-two are 1080x1920 social cuts, so "Reels" is the honest
   * read of the FILE. Which division ran each account is not something the
   * footage can tell me — Studios is the safer default because it claims
   * production rather than a creator partnership I cannot verify. Correct any
   * of these and the shelves re-sort themselves.
   */
  {
    slug: "the-worldgrad-study-abroad",
    client: "The WorldGrad",
    title: "Study Abroad Content",
    vertical: "Studios",
    format: "Reels",
    reel: [21, 24],
    featured: true,
  },
  {
    slug: "foy-social-content",
    client: "FOY",
    title: "Social Content",
    vertical: "Studios",
    format: "Reels",
    reel: [22, 23, 25],
    featured: true,
  },
  {
    slug: "loreal-hair-care",
    client: "L'Oreal",
    title: "Hair Care Content",
    vertical: "Studios",
    format: "Reels",
    reel: [27, 28],
    featured: true,
  },
  /*
   * The second Drive folder — "Website Content Temporary", eleven property
   * films. Ten of them are here; the eleventh is House of Hiranandani, which
   * is 47.4MB at 47s and 1080x1920, the same file as clip 32, already in the
   * catalogue above. Ingested as one piece rather than ten because they are
   * one body of work, and the property names survive on the detail page
   * through CLIP_LABELS.
   *
   * TODO(content): THE CLIENT IS AN INFERENCE. The folder names the properties
   * and not who they were made for. "Genesis Estate" is Genesis's own
   * real-estate arm — it appears in their milestones — so attributing their
   * own property films to it invents no third party, which naming an outside
   * client would. Correct it if these belong to a brokerage instead.
   */
  {
    slug: "genesis-estate-property-films",
    client: "Genesis Estate",
    title: "Property Films",
    vertical: "Studios",
    format: "Reels",
    tags: ["Real Estate"],
    reel: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    featured: true,
  },
  {
    slug: "ht-brunch-content",
    client: "HT Brunch",
    title: "Editorial Content",
    vertical: "Studios",
    format: "Reels",
    reel: [26],
    featured: true,
  },
  {
    slug: "house-of-hiranandani-content",
    client: "House of Hiranandani",
    title: "Brand Content",
    vertical: "Studios",
    format: "Reels",
    tags: ["Real Estate"],
    reel: [32],
    featured: true,
  },
];

/**
 * The catalogue with every media path resolved.
 *
 * ONE PLACE, AND IT IS THIS ONE. The paths in the array above are written the
 * way a person writes them — /work/clips/16.mp4 — and `mediaUrl` decides
 * whether that is where the bytes are actually read from or whether they come
 * out of Genesis's Drive instead. Doing it here rather than at each render
 * means the twelve components that show a still, a poster or a clip never
 * learn that there is a choice, and none of them can be the one that forgets.
 *
 * With Drive off — which is the default — mediaUrl returns its argument
 * unchanged, so this map is the identity and the site serves exactly what it
 * served before. See lib/media-url.ts.
 */
/**
 * What a numbered clip actually shows, where the file says so.
 *
 * The first thirty-two arrived as `1.mp4` to `32.mp4` and carry no name of
 * their own — the client is the only thing identifying them, which is why they
 * are absent here. The property films came out of a second Drive folder with
 * their subject in the filename, and throwing that away to renumber them would
 * be discarding the only description anyone has written of these ten.
 */
export const CLIP_LABELS: Record<number, string> = {
  33: "Panvel Hospital Plot",
  34: "Ghatkopar Godown",
  35: "Chembur Commercial Office",
  36: "Vashi Petrol Pump",
  37: "Prajapati Ornate",
  38: "Sea Facing Alibag",
  39: "Alibag Plot 1",
  40: "Chembur Plot",
  41: "Karjat Agricultural Land",
  42: "Sarda Village",
};

/** Where a numbered clip and its frame live. The numbering mirrors Drive. */
export const reelClip = (n: number) => `/work/clips/${n}.mp4`;
export const reelPoster = (n: number) => `/work/posters/${n}.jpg`;

export const work: WorkItem[] = catalogue.map((item) => {
  /*
    The lead clip fills in whatever the piece did not state. A piece with a
    reel and no artwork was rendering a typographic placeholder while its own
    footage sat in /public under a number nobody had connected to it; this is
    the connection, and it is one line rather than a field on every entry.
  */
  const lead = item.reel?.[0];
  const clip = item.clip ?? (lead === undefined ? undefined : reelClip(lead));
  const poster =
    item.poster ?? (lead === undefined ? undefined : reelPoster(lead));
  const art = item.art ?? poster;

  return {
    ...item,
    ...(art ? { art: mediaUrl(art) } : {}),
    ...(clip ? { clip: mediaUrl(clip) } : {}),
    ...(poster ? { poster: mediaUrl(poster) } : {}),
  };
});


/** Fast lookup for the project route. */
export function findWork(slug: string): WorkItem | undefined {
  return work.find((item) => item.slug === slug);
}

export const featuredWork = work.filter((item) => item.featured);

/**
 * The filter row, built from the data rather than hardcoded.
 *
 * ONLY WHAT HAS WORK BEHIND IT. Genesis's list runs to twelve and the
 * catalogue currently answers five of them; printing all twelve would give a
 * visitor seven ways to empty the grid. The rest appear on their own as the
 * catalogue fills, with no code change.
 *
 * THE ORDER IS THE VOCABULARY'S, NOT THE CATALOGUE'S. This used to push each
 * tag as it was first encountered, so the row's order was an accident of
 * which entry happened to sit at the top of the array — and re-ordering the
 * catalogue silently re-ordered the filters. Verticals first, since they are
 * the coarsest cut, then the formats and the sectors in the order Genesis
 * wrote them down.
 */
export function workFilters(items: WorkItem[]): string[] {
  const verticals = VERTICALS.filter((v) => items.some((i) => i.vertical === v));
  const formats = CATEGORIES.filter((c) => items.some((i) => i.format === c));
  const tags = WORK_TAGS.filter((t) =>
    items.some((i) => i.tags?.includes(t)),
  );
  return ["All", ...verticals, ...formats, ...tags];
}

/**
 * A piece matches on ANY of its three facets. `tags` is the addition: a
 * filter row that offers BFSI and then returns nothing for it, because the
 * Mahindra work is filed as an influencer campaign, is a row that lies.
 */
export function matchesFilter(item: WorkItem, filter: string): boolean {
  return (
    filter === "All" ||
    item.vertical === filter ||
    item.format === filter ||
    Boolean(item.tags?.includes(filter as WorkTag))
  );
}

/** True when a piece has enough written to be worth opening a case study for. */
export function hasStory(item: WorkItem): boolean {
  return Boolean(
    !isPending(item.objective) ||
      !isPending(item.ask) ||
      !isPending(item.approach) ||
      !isPending(item.execution) ||
      (item.whatWeDid && item.whatWeDid.length > 0) ||
      (item.results && item.results.length > 0),
  );
}

/**
 * THE BROWSE ROWS — the Portfolio's shelves.
 *
 * WHY ROWS AND NOT A WALL. /our-work was a masonry dump of everything behind
 * one filter bar: fourteen tiles of five different shapes in five columns,
 * with no order and nothing to tell you what you were looking at. Genesis
 * asked for it to work like Netflix, and the thing that actually makes that
 * layout work is not the horizontal scroll — it is that every row is a
 * SENTENCE about the work in it. A piece can sit in three rows, which is a
 * feature: it is how a catalogue this size fills a page without repeating
 * itself visually.
 *
 * TODO(content): THESE SHOULD BE THE DRIVE FOLDERS. Genesis's instruction is
 * that the filters come from the folders in the shared Drive, and that link
 * has not been shared yet — asked for three times now. So the rows are built
 * from the taxonomy the project already has: `featured`, then the CATEGORIES
 * Genesis fixed, then the four verticals. Swapping them is an edit to THIS
 * ARRAY and nothing else, because the page reads its shelves from here rather
 * than deciding them itself. Adding a row is one entry; renaming one is one
 * string.
 */
export type WorkRow = {
  id: string;
  title: string;
  blurb?: string;
  /**
   * Renders the division's own lockup in place of the row's title.
   *
   * A shelf named after a division should be announced the way the division
   * is announced everywhere else on the site — its supplied artwork, with the
   * gradient — not set in the same weight as "Shoots & films". Genesis asked
   * for the images here specifically.
   *
   * The lockup brings its OWN tagline as text, so a row that has one must not
   * also carry a `blurb`; that is the doubled line that has been reported
   * three times on this site, and here it is prevented by there being nothing
   * to double.
   */
  division?: { name: string; tagline: string; ramp: string };
  test: (item: WorkItem) => boolean;
};

/** A division's tagline and ramp, looked up by the name on its service card. */
function divisionOf(title: string): WorkRow["division"] {
  const service = services.items.find((item) => item.title === title);
  if (!service) return undefined;
  return {
    // "Genesis.Influence" -> "Influence", which is what DivisionLockup keys on.
    name: title.replace(/^Genesis\./, ""),
    tagline: service.caption,
    ramp: service.ramp,
  };
}

export const WORK_ROWS: WorkRow[] = [
  {
    id: "featured",
    title: "Featured work",
    blurb: "The pieces we lead with.",
    test: (i) => Boolean(i.featured),
  },
  {
    id: "reels",
    title: "Reels & short form",
    blurb: "Shot vertical, cut for the feed.",
    test: (i) =>
      i.format === "Reels" || i.format === "User-Generated Content (UGC)",
  },
  {
    id: "campaigns",
    title: "Influencer campaigns",
    blurb: "Multi-format work built around one idea.",
    test: (i) => i.format === "Influencer Campaigns",
  },
  /*
    THE SECTOR SHELVES. Genesis's filter list names Real Estate and BFSI, and
    a filter worth offering is usually a shelf worth having — the property
    films in particular are ten pieces that read as a body of work rather than
    as ten reels. `workRows` drops any shelf with fewer than two pieces, so
    these appear and disappear with the catalogue.
  */
  {
    id: "real-estate",
    title: "Real estate",
    blurb: "Property films, shot on location.",
    test: (i) => Boolean(i.tags?.includes("Real Estate")),
  },
  {
    id: "bfsi",
    title: "BFSI",
    blurb: "Banking, financial services and health insurance.",
    test: (i) => Boolean(i.tags?.includes("BFSI")),
  },
  {
    id: "influence",
    title: "Genesis.Influence",
    /*
      The tagline and ramp come from `services` rather than being retyped, so
      a division cannot say one thing on its own section and another on its
      shelf. Indexed by title so re-ordering that list cannot silently swap
      Studios' gradient onto Influence.
    */
    division: divisionOf("Genesis.Influence"),
    test: (i) => i.vertical === "Influence",
  },
  {
    id: "studios",
    title: "Genesis.Studios",
    division: divisionOf("Genesis.Studios"),
    test: (i) => i.vertical === "Studios",
  },
];

/**
 * The rows that actually have work behind them.
 *
 * A shelf with one thing on it is not a shelf — it reads as a mistake, and
 * horizontally scrolling a single tile is worse than not offering the row. So
 * a row needs `min` pieces to appear, and the ones that do not clear it come
 * back on their own as the catalogue fills, with no code change.
 */
export function workRows(
  items: WorkItem[],
  min = 2,
): { row: WorkRow; items: WorkItem[] }[] {
  return WORK_ROWS.map((row) => ({ row, items: items.filter(row.test) })).filter(
    (shelf) => shelf.items.length >= min,
  );
}

/**
 * The piece the Portfolio leads with.
 *
 * It must have ARTWORK — a billboard is a picture with words on it, and the
 * four finance pieces have no still yet, so leading with one would put a
 * typographic placeholder at the top of the page as the first thing anyone
 * sees. Featured first, then anything with art, then nothing at all, which
 * the page handles by simply not drawing a billboard.
 */
export function billboardItem(items: WorkItem[]): WorkItem | undefined {
  return (
    items.find((i) => i.featured && (i.art || i.clip)) ??
    items.find((i) => i.art || i.clip)
  );
}
