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
  /* Added at Genesis's request for the animated and designed pieces. */
  "Motion Graphics & Design",
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

/** A clip id: a number from the first Drive folder, or a name slug from the portfolio one. */
export type ReelId = number | string;

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
   * The clips in Genesis's Drive folder that belong to this piece.
   *
   * ONE ID ADDRESSES THREE FILES, because the naming is identical in all
   * three places: `/work/clips/<id>.mp4` is the 4-second preview,
   * `/work/posters/<id>.jpg` is its frame, and the Drive holds the master.
   * Storing paths instead would be three strings per clip that can disagree
   * with each other, and there are seventy of them.
   *
   * NUMBERS OR NAMES. The first folder Genesis shared was 1.mp4..42.mp4, so
   * these were numbers. The portfolio folder is named work — "ABHI KA
   * STAR.mp4" — which the ingest slugs to `studios-abhi-ka-star`, keeping the
   * division it came from in the id. Both kinds address files the same way,
   * so the type widened rather than the scheme changing.
   *
   * THE FIRST ONE IS THE TILE. `clip`, `poster` and `art` are all derived from
   * `reel[0]` below unless a piece sets them itself, which is what turns the
   * artwork-less placeholder tiles into real footage without touching a
   * component.
   */
  reel?: ReelId[];
  /** Shown in the homepage Work section. */
  featured?: boolean;
  /**
   * Set only by `expandToClips`, where one engagement becomes several tiles
   * and `slug` is no longer unique. React needs a stable distinct key and the
   * slug still has to point at the parent piece, so the two are separated.
   */
  key?: string;

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
    /*
      SPLIT AT 28, WHICH IS WHERE THE DIVISIONS DIVIDE. This reel used to run
      [1..15, 29, 30, 31] and carry one vertical for all of it. Genesis's Drive
      puts 1..28 under Influence and 29..32 under AI Lab, so those last three
      were a different division's work filed under this one's byline — and
      because a piece has exactly one `vertical`, no amount of tagging here
      could have made both true. They are their own entry below.
    */
    reel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  {
    /*
      THE SAME CLIENT, THE OTHER DIVISION. Clips 29, 30 and 31 sit in the AI
      Lab folder, so this is Aditya Birla's AI work rather than its creator
      campaign. Separate entry rather than a tag, because `vertical` is what
      the portfolio filters on and one row cannot answer to two.
    */
    slug: "aditya-birla-capital-ai-content",
    client: "Aditya Birla Capital Health Insurance",
    title: "AI Content",
    vertical: "AI Labs",
    format: "Reels",
    tags: ["BFSI"],
    reel: [29, 30, 31],
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
    /*
      IT HAD NO FOOTAGE UNTIL NOW. This entry existed on a client name alone
      and rendered a typographic placeholder. The portfolio Drive named two
      files for it outright — "HDFC x ABHI_SAMPOORNA2.0" and "With HDFC
      Slide" — so it has a tile like everything else.
    */
    reel: ["studios-hdfc-x-abhi-sampoorna2-0", "studios-with-hdfc-slide"],
  },

  /*
   * The four clients that were only ever footage — in the Drive folder and on
   * the Studios reel wall, but with no entry here, so nothing in the portfolio
   * knew they existed.
   *
   * THE VERTICALS ARE GENESIS'S NOW, NOT A GUESS. This block used to carry a
   * TODO saying Studios was a safe default because nothing in a 1080x1920
   * social cut tells you which division ran the account. Genesis has since
   * shared the portfolio Drive sorted into three folders — Influence, Studios
   * and AI Lab — and that is exactly the missing mapping:
   *
   *     Influence  1.mp4 .. 28.mp4
   *     AI Lab     29.mp4 .. 32.mp4  (plus its own named work)
   *
   * VERIFIED, NOT ASSUMED, because a coincidence of numbering would have been
   * an easy way to mis-file the whole catalogue. Every numbered master was
   * re-transcoded from the new folder and compared against the poster already
   * in the repo: mean absolute luma difference at 8x8 was 0 for every sample,
   * so these are the same files, now grouped by the division that made them.
   *
   * So the four below move to Influence, and House of Hiranandani — whose one
   * clip is 32 — moves to AI Labs. `format` is untouched: the folder says who
   * made a piece, not what shape it is.
   */
  {
    slug: "the-worldgrad-study-abroad",
    client: "The WorldGrad",
    title: "Study Abroad Content",
    vertical: "Influence",
    format: "Reels",
    reel: [21, 24],
    featured: true,
  },
  {
    slug: "foy-social-content",
    client: "FOY",
    title: "Social Content",
    vertical: "Influence",
    format: "Reels",
    reel: [22, 23, 25],
    featured: true,
  },
  {
    slug: "loreal-hair-care",
    client: "L'Oreal",
    title: "Hair Care Content",
    vertical: "Influence",
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
    vertical: "Influence",
    format: "Reels",
    reel: [26],
    featured: true,
  },
  {
    slug: "house-of-hiranandani-content",
    client: "House of Hiranandani",
    title: "Brand Content",
    vertical: "AI Labs",
    format: "Reels",
    tags: ["Real Estate"],
    reel: [32],
    featured: true,
  },

  /*
   * ---------------------------------------------------------------------
   * THE PORTFOLIO DRIVE, September 2026.
   *
   * Genesis shared a second folder sorted into Influence / Studios / AI Lab.
   * Its Influence and AI Lab halves were the clips already here, which is
   * what settled the verticals above; its Studios half is twenty-six pieces
   * that had never reached the site, plus three more under AI Lab.
   *
   * HOW THE CLIENTS BELOW WERE DECIDED, because it is not all the same
   * confidence and the difference should be visible rather than buried:
   *
   *   NAMED BY THE FILE. "ABHI KA STAR", "Mahindra Cut_44", "With HDFC
   *     Slide", "Women's Day | ABHI", "Mr. Mayank Bathwal CEO Aditya Birla
   *     Health Insurance" — the client is written into the filename, so these
   *     are read rather than inferred. Activ Travel and Activ Yuva are ABHI
   *     product lines, and "100% health and 100% health insurance" is ABHI's
   *     own line, so those go the same way.
   *
   *   FORMAT READ FROM THE FILE, not guessed. Portrait cuts are Reels, the
   *     landscape ones are films, the two Activ Travel plan pieces call
   *     themselves explainers and the two event pieces call themselves an
   *     aftermovie and a year. Measured with ffprobe rather than assumed.
   *
   *   TODO(content): ELEVEN PIECES NAME NOTHING. "1x1", "b1", "ddddd",
   *     "dfv", "video_001", "video_02", "wo vo sales pro", "Friends Final",
   *     "6) Common Mistakes", "7) Draft6_Income Protect" and "1) Draft
   *     9_EAT MOVE HEAL" carry no client anywhere in them. They are in the
   *     portfolio under Genesis Studios' own byline rather than attributed to
   *     a client I would be inventing. Name any of them and it moves.
   *
   *   TODO(content): THE EVENT FILMS. UMANG 2024 and Utsav are event names,
   *     not clients. Whose events they were is not in the file.
   * ---------------------------------------------------------------------
   */
  {
    slug: "abhi-health-content",
    client: "Aditya Birla Health Insurance",
    title: "Health & Awareness Content",
    vertical: "Studios",
    format: "Reels",
    tags: ["BFSI"],
    featured: true,
    reel: [
      "studios-abhi-ka-star",
      "studios-final-menopause-abhi-02",
      "studios-women-s-day-abhi",
      "studios-dha-1",
      "studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance",
    ],
  },
  {
    slug: "abhi-activ-travel-explainers",
    client: "Aditya Birla Health Insurance",
    title: "Activ Travel Plan Explainers",
    vertical: "Studios",
    format: "Product Explainers",
    tags: ["BFSI"],
    reel: [
      "studios-activ-travel-leisure-plan-finalhd-1",
      "studios-activ-travel-senior-plan-02",
    ],
  },
  {
    slug: "abhi-leadership-films",
    client: "Aditya Birla Health Insurance",
    title: "Leadership & Internal Films",
    vertical: "Studios",
    format: "Launch Films",
    tags: ["BFSI"],
    reel: [
      "studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance",
      "studios-abhi-ex-coms",
    ],
  },
  {
    slug: "mahindra-finance-brand-film",
    client: "Mahindra Finance",
    title: "Brand Film",
    vertical: "Studios",
    format: "Launch Films",
    tags: ["BFSI"],
    reel: ["studios-mahindra-cut-44"],
  },
  {
    slug: "tripgate-travel-content",
    client: "TripGate",
    title: "Travel Content",
    vertical: "Studios",
    format: "Reels",
    reel: ["studios-tripagetet"],
  },
  {
    slug: "genesis-event-films",
    client: "Genesis Studios",
    title: "Event Films",
    vertical: "Studios",
    format: "Event Shoots",
    reel: ["studios-umang-2024", "studios-utsav-aftermovie"],
  },
  {
    /*
      The eleven unnamed pieces, under Genesis Studios' own byline. See the
      TODO above: every one of them is real work and belongs in the portfolio,
      and none of them says who it was for.
    */
    slug: "studios-selected-production",
    client: "Genesis Studios",
    title: "Selected Production Work",
    vertical: "Studios",
    format: "Reels",
    reel: [
      "studios-friends-final-1",
      "studios-wo-vo-sales-pro",
      "studios-1x1",
      "studios-b1",
      "studios-dfv",
      "studios-ddddd",
      "studios-video-001",
      "studios-video-02",
    ],
  },
  {
    /*
     * THE ANIMATED PIECES, out of "Selected Production Work" and into their
     * own entry so Genesis's Motion Graphics & Design filter has something
     * behind it. The pixel-art explainers and the app walkthrough are design
     * work, not shoots.
     */
    slug: "studios-motion-design",
    client: "Genesis Studios",
    title: "Motion Graphics & Design",
    vertical: "Studios",
    format: "Motion Graphics & Design",
    reel: [
      "studios-7-draft6-income-protect",
      "studios-1-draft-9-eat-move-heal",
      "studios-6-common-mistakes",
    ],
  },
  {
    slug: "abhi-activ-yuva-ai-explainers",
    client: "Aditya Birla Health Insurance",
    title: "Activ Yuva Explainers",
    vertical: "AI Labs",
    format: "Product Explainers",
    tags: ["BFSI"],
    reel: [
      "ai-lab-1-2-9x16-main-product-explainer-activ-yuva",
      "ai-lab-2-1-9x16-health-returns-activ-yuva",
    ],
  },
  {
    slug: "sinet-ai-film",
    client: "SiNet",
    title: "AI Brand Film",
    vertical: "AI Labs",
    format: "AI Content",
    reel: ["ai-lab-sinet-english-v004"],
  },
  /*
   * THE AI AVATARS' OWN WORK, from the per-avatar folders under AI Lab in
   * Genesis's Drive. The roster in lib/home-content lists the same ids in
   * each avatar's `reel`, so a video shows in the avatar window, here, and
   * — for Tanvi and Bharat — in the case-study slider, from one file.
   * Ivaanat, Jesko, Adi and Diya have folders with nothing in them yet.
   */
  {
    slug: "ai-avatar-tanvi",
    client: "Tanvi · AI Avatar",
    title: "AI Avatar Content",
    vertical: "AI Labs",
    format: "AI Content",
    featured: true,
    reel: [
      "ai-lab-tanvi-uiiui",
      "ai-lab-tanvi-b2813828",
      "ai-lab-tanvi-photos",
    ],
  },
  {
    slug: "ai-avatar-bharat",
    client: "Bharat · AI Avatar",
    title: "AI Avatar Content",
    vertical: "AI Labs",
    format: "AI Content",
    featured: true,
    reel: ["ai-lab-bharat-bharat"],
  },
  {
    slug: "ai-avatar-shivam",
    client: "Shivam · AI Avatar",
    title: "AI Avatar Content",
    vertical: "AI Labs",
    format: "AI Content",
    reel: ["ai-lab-shivam-sh1"],
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
export const CLIP_LABELS: Record<ReelId, string> = {
  /*
    THE PORTFOLIO DRIVE'S FILES CARRY REAL NAMES, unlike the first folder's
    numbers, so the ones that describe their own contents are captioned here.
    Only those: "ddddd" and "b1" are filenames, not titles, and a caption
    repeating them is worse than none.
  */
  "studios-abhi-ka-star": "ABHI Ka Star",
  "studios-final-menopause-abhi-02": "Menopause",
  "studios-women-s-day-abhi": "Women's Day",
  "studios-dha-1": "DHA",
  "studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance":
    "100% Health & 100% Health Insurance",
  "studios-activ-travel-leisure-plan-finalhd-1": "Activ Travel — Leisure Plan",
  "studios-activ-travel-senior-plan-02": "Activ Travel — Senior Plan",
  "studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance":
    "Mayank Bathwal, CEO",
  "studios-abhi-ex-coms": "Executive Communications",
  "studios-hdfc-x-abhi-sampoorna2-0": "HDFC x ABHI Sampoorna 2.0",
  "studios-with-hdfc-slide": "With HDFC",
  "studios-umang-2024": "UMANG 2024",
  "studios-utsav-aftermovie": "Utsav Aftermovie",
  "studios-1-draft-9-eat-move-heal": "Eat Move Heal",
  "studios-6-common-mistakes": "Common Mistakes",
  "studios-7-draft6-income-protect": "Income Protect",
  "studios-friends-final-1": "Friends",
  "ai-lab-1-2-9x16-main-product-explainer-activ-yuva":
    "Activ Yuva — Product Explainer · Adi",
  "ai-lab-2-1-9x16-health-returns-activ-yuva":
    "Activ Yuva — Health Returns · Diya",
  29: "Activ Yuva — OPD Cover · Adi",
  30: "Activ Yuva — Worldwide Maternity Cover · Diya",
  31: "Activ Yuva — Launch · Adi & Diya",
  "ai-lab-sinet-english-v004": "SiNet (English)",
  "ai-lab-tanvi-uiiui": "Tanvi",
  "ai-lab-tanvi-b2813828": "Tanvi",
  "ai-lab-tanvi-photos": "Tanvi — Photo Series",
  "ai-lab-bharat-bharat": "Bharat",
  "ai-lab-shivam-sh1": "Shivam",
  2: "BTS with Vikrant Massey",
  3: "#LetsFaceIt 2024",
  8: "#JumpForHealth",
  9: "Matcha",
  13: "Bombay Running Crew",
  32: "House of Hiranandani",
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

/** Where a clip and its frame live. The naming mirrors Drive. */
export const reelClip = (n: ReelId) => `/work/clips/${n}.mp4`;
export const reelPoster = (n: ReelId) => `/work/posters/${n}.jpg`;

export const work: WorkItem[] = catalogue
  /*
    NOTHING WITHOUT FOOTAGE OR A STILL REACHES THE PAGE. A piece with neither
    fell back to its client's name set as a poster, and a long name —
    "Aditya Birla Sun Life Insurance" — broke out of a portfolio tile one word
    per line. A portfolio is pictures of work; a client with nothing to show
    stays in the catalogue for when footage arrives, and appears the moment
    a reel or artwork is added.
  */
  .filter((item) => item.reel?.length || item.art || item.clip || item.poster)
  .map((item) => {
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
  /*
    GENESIS'S TWELVE, AND ONLY THOSE. This offered all four verticals as well
    — Influence, Studios, AI Labs and Brand & Design — which was three chips
    they never asked for. Their list is the eight formats, the three sectors
    and AI Labs; the note on WORK_TAGS says as much, explaining that AI Labs
    is left out of the sector list precisely because it arrives as a vertical.
    That was true, but the row then printed the other three alongside it.

    Influence and Studios stay in the DATA — every piece still carries its
    vertical, the portfolio's division shelves are built from it, and the
    reorganisation that came out of Genesis's Drive depends on it. What
    changed is only what the filter row offers.
  */
  const aiLabs = items.some((i) => i.vertical === "AI Labs") ? ["AI Labs"] : [];
  const formats = CATEGORIES.filter((c) => items.some((i) => i.format === c));
  const tags = WORK_TAGS.filter((t) =>
    items.some((i) => i.tags?.includes(t)),
  );
  return ["All", ...aiLabs, ...formats, ...tags];
}

/**
 * One entry per CLIP rather than per piece of work.
 *
 * WHY THE PORTFOLIO NEEDS IT. The catalogue is a list of ENGAGEMENTS — twenty
 * of them — and most carry several cuts: Aditya Birla is fifteen clips, the
 * property films are ten. The grid drew one tile per engagement, so "All"
 * showed twenty tiles while seventy-one videos sat in /public. Genesis's
 * report was exactly that: All does not have all the videos.
 *
 * Each clip inherits its parent's client, title, vertical, format and tags,
 * so every filter keeps working unchanged and a clip is reachable under the
 * same chips its engagement was. `slug` is left alone, so a tile still opens
 * the piece the clip belongs to; only `key` has to be unique, which is what
 * the composed id is for.
 */
export function expandToClips(items: WorkItem[]): WorkItem[] {
  return items.flatMap((item) => {
    if (!item.reel?.length) return [item];
    return item.reel.map((id) => ({
      ...item,
      key: `${item.slug}-${id}`,
      clip: mediaUrl(reelClip(id)),
      poster: mediaUrl(reelPoster(id)),
      art: mediaUrl(reelPoster(id)),
    }));
  });
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
function divisionOf(title: string, name?: string): WorkRow["division"] {
  const service = services.items.find((item) => item.title === title);
  if (!service) return undefined;
  return {
    /*
      "Genesis.Influence" -> "Influence", which is what DivisionLockup keys on.

      `name` OVERRIDES IT WHERE THE TWO SPELLINGS DIFFER, and AI Lab is why
      this parameter exists. The service card is titled "Genesis.AILab" with
      no space, so stripping the prefix yields "AILab" — and DivisionLockup's
      artwork table is keyed "AI Lab". The mismatch does not throw; it just
      finds no lockup and renders the shelf heading as the bare string
      "GENESIS.AILab", which is exactly what it did until this was caught.
    */
    name: name ?? title.replace(/^Genesis\./, ""),
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
  {
    /*
      AI LABS HAD NO SHELF, which is why its work was reachable by filter and
      nowhere on the page itself. It was written when the catalogue held four
      Influence pieces and ten Studios ones and AI Labs was empty — a division
      shelf for nothing would have been an empty row. The portfolio Drive
      brought four AI Labs pieces, so the row earns its place, and `workRows`
      would have hidden it on its own if it had not.

      `divisionOf` keys on the service card's own title, which is
      "Genesis.AILab" — no space, matching lib/home-content. Getting that
      string wrong returns undefined and silently drops the lockup rather than
      failing, so it is worth stating why it looks like a typo and is not.
    */
    id: "ai-labs",
    title: "Genesis.AI Lab",
    division: divisionOf("Genesis.AILab", "AI Lab"),
    test: (i) => i.vertical === "AI Labs",
  },
  {
    /*
      THE LONG-FORM SHELF. Three formats arrived with the portfolio Drive that
      the page had no room for — Launch Films, Product Explainers and Event
      Shoots — and all three are the opposite of a feed cut: landscape brand
      films, plan explainers and event aftermovies. "Reels & short form" is
      explicitly the shelf they are NOT, so they get their own rather than
      being filed under a name that contradicts them.
    */
    id: "films",
    title: "Films & explainers",
    blurb: "Brand films, product explainers and event coverage.",
    test: (i) =>
      i.format === "Launch Films" ||
      i.format === "Product Explainers" ||
      i.format === "Event Shoots",
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
