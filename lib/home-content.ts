
/**
 * All homepage copy in one place.
 *
 * SOURCE OF TRUTH: "Genesis Website Content.pdf" (Layout(Gaurav): FINAL).
 * Names, clients, services and section order below come from that document.
 * Anything still invented is marked TODO and must not ship.
 *
 * The document also specifies behaviour, recorded here next to the content it
 * applies to so it does not get lost:
 *   - Services → Portfolio: "the camera turns 180°"
 *   - Client logos + testimonials: "movable like Apple Watch apps"
 *   - Blogs: "each paper is a blog … papers moving like magnetics" (igloo.inc)
 *   - Overall background: "gradient + noise"
 *   - Footer: "liquid glass"
 */

/**
 * True for any field still waiting on a real value.
 *
 * Placeholders are written as "TODO — …" here so they stay greppable, but they
 * must never reach the page. These sections carry REAL client names — Mahindra,
 * Aditya Birla — and printing "TODO — real quote required." beside one reads to
 * a visitor as a claim Genesis is making about that client. Components call
 * this and omit the element rather than rendering the token.
 *
 * Omission is the safe direction: a missing figure is invisible, an invented
 * one is a lie that has to be retracted.
 */
import { proof } from "./proof";

export function isPending(value: string | null | undefined): boolean {
  return !value || value.trimStart().startsWith("TODO");
}

// --- Hero -------------------------------------------------------------------

export const hero = {
  eyebrow: "Content · Influencers · AI",
  // Verbatim from the spec, Section 1.
  headlineLead: "Empowering brands that want to win at content, influencer activations &",
  headlineAccent: "AI",
  // The spec asks for "a good hook" and keeps the form to last. Expertise line
  // is drawn from Section 1's note on where the expertise lies.
  body:
    "Quality production and edits, creative direction, strategy and scripting. These are the parts that decide whether content performs, and Genesis builds all of it in-house.",
  primaryCta: { label: "Start a project", href: "/#contact" },
  secondaryCta: { label: "See our work", href: "/#library" },
} as const;

/**
 * The hero reel. Spec: "Update this reel video with new content."
 * TODO(assets): supply a short muted loop and its poster frame.
 */
export const heroReel = {
  src: undefined as string | undefined,
  poster: undefined as string | undefined,
  label: "Showreel",
} as const;

// --- Services (Section 2) ---------------------------------------------------

// The spec replaces the old services section with exactly these five, and asks
// that the AI tooling be visible in the framing.
export const services = {
  label: "What we do",
  heading: "Four divisions,",
  headingAccent: "one system",
  body:
    "Genesis is an AI-native culture and growth studio building the future of influence. Human creativity, AI generation, creator marketing and performance thinking in one creative system.",
  /*
   * THE FOUR DIVISIONS, named by the brand guidelines rather than by us.
   *
   * The captions are the subtitles from Genesis's own division lockups, word
   * for word, replacing four descriptions written before those lockups
   * existed. "creator & celebrity marketing" was ours; "Influencer marketing
   * | Celeb | UGC activations" is theirs, and it is the one that will match
   * whatever else the division is printed on.
   *
   * The deck sets these out as Genesis.Influence, Genesis.BrandDesign,
   * Genesis.Studios and Genesis.AILab — four pillars, each on its own page.
   * The site had five services under different names (Content Production, AI
   * Content, Influencer Marketing, Branding & Design, Apps & Games), which
   * were written from the original brief before the guidelines existed.
   *
   * The mapping: Content Production became Studios, AI Content became AILab,
   * Influencer Marketing became Influence, Branding & Design became
   * BrandDesign. "Apps & Games" has no pillar of its own in the deck — the
   * product and interactive work now sits inside Studios, where the deck's
   * own "Technology & Integration" step puts it.
   *
   * The dotted names are set as one word deliberately; that is how the deck
   * writes them, and the dot is the system's own connector.
   */
  items: [
    {
      title: "Genesis.Influence",
      /*
       * THE DIVISION'S SERVICES, READ OFF PAGE 3 OF THE CREDENTIALS DECK.
       *
       * Verbatim, which is the point: these are the lines Genesis already
       * sells against in the room, so the site should not paraphrase them
       * into something adjacent. They are also the answer to what each
       * division actually DOES, which the tagline gestures at and the body
       * copy talks around.
       */
      services: [
        "Influencer Marketing",
        "Bulk Creator Activations",
        "UGC & Regional Campaigns",
      ],
      /*
       * THE SHORT NAME, used where the Genesis wordmark is already in the
       * picture. The divisions board sets the four around the mark and drops
       * the prefix off each one, because the centre is saying it — printing
       * "Genesis." four more times around a Genesis logo is a stutter.
       */
      short: "Influence",
      /* Where the Brain sends you. Two verticals have a page of their own;
         the other two anchor to their homepage section until they do. */
      href: "/#influence",
      /*
       * PIPES, NOT COMMAS. Genesis asked for the separator in every division
       * tagline to be a pipe. It is the deck's own convention for these lists
       * and it reads as a set of capabilities rather than as a sentence that
       * ran out of room. The ampersand before the last pair stays, which is
       * how Genesis wrote the example.
       *
       * READ OFF THE 2026 LOCKUP, verbatim. Each division's artwork carries
       * its tagline burned in under the wordmark, and this string is set
       * beneath the same lockup rendered as live text — so where the two
       * disagree the page is contradicting its own logo. Three of the four
       * did: the pipes are the old separators and "UGC activations",
       * "Positioning" and the pipe-delimited AI Lab list are not what the
       * new artwork says.
       */
      caption: "Influencer Marketing | Celeb Partnerships & UGC",
      /*
       * ONE GRADIENT PER DIVISION, from the deck's "What we do" board, where
       * each name is set in its own warm-to-cool ramp rather than in the
       * brand yellow. The yellow stays the interface accent; these are the
       * divisions' own identity and appear nowhere else.
       *
       * LIFTED to match the board. The first pass sat these in the mid tones
       * — 5.4 to 6.7 against the ground — and the board's names are far more
       * luminous than that, sitting high in value so they glow off the black
       * rather than sinking into it. Every stop is now 7.0 to 14.7.
       *
       * They are light ramps, so they only hold on a dark ground — which is
       * why the section is pinned dark, exactly as the board is.
       */
      ramp: "linear-gradient(100deg, #ff8a4c 0%, #f7719e 46%, #c3a2ff 100%)",
      body: "Creator and celebrity activations across every genre, from a database of over a lakh creators. Briefed, matched, run and measured.",
    },
    {
      title: "Genesis.BrandDesign",
      /*
       * THE DIVISION'S SERVICES, READ OFF PAGE 3 OF THE CREDENTIALS DECK.
       *
       * Verbatim, which is the point: these are the lines Genesis already
       * sells against in the room, so the site should not paraphrase them
       * into something adjacent. They are also the answer to what each
       * division actually DOES, which the tagline gestures at and the body
       * copy talks around.
       */
      services: [
        "Brand Positioning & Guidelines",
        "Social-First Design & Campaigns",
        "Pitch Decks & Brand Collaterals",
      ],
      short: "Brand & Design",
      href: "/#brand-design",
      // See the note on Influence above — read off the 2026 lockup.
      caption: "Branding Positioning | Design & Collaterals",
      ramp: "linear-gradient(100deg, #f0dcff 0%, #f5a3cd 50%, #ffbe8f 100%)",
      body: "Identity systems, brand guidelines, motion design and the rules that keep a brand recognisable everywhere it appears.",
    },
    {
      title: "Genesis.Studios",
      /*
       * THE DIVISION'S SERVICES, READ OFF PAGE 3 OF THE CREDENTIALS DECK.
       *
       * Verbatim, which is the point: these are the lines Genesis already
       * sells against in the room, so the site should not paraphrase them
       * into something adjacent. They are also the answer to what each
       * division actually DOES, which the tagline gestures at and the body
       * copy talks around.
       */
      services: [
        "Strategy, Scripting & Production",
        "Reels, Podcasts & Product Videos",
        "Founder-Led Content",
      ],
      short: "Studios",
      href: "/#studios",
      // The one that already agreed with its lockup, bar capitalisation.
      caption: "Strategy | Scripting & Content Production",
      ramp: "linear-gradient(100deg, #ff9147 0%, #ffb057 58%, #ffd27a 100%)",
      body: "Creative direction, strategy, scripting, production and post, plus the product and interactive work. All of it built to hold up on any feed.",
    },
    {
      title: "Genesis.AILab",
      /*
       * THE DIVISION'S SERVICES, READ OFF PAGE 3 OF THE CREDENTIALS DECK.
       *
       * Verbatim, which is the point: these are the lines Genesis already
       * sells against in the room, so the site should not paraphrase them
       * into something adjacent. They are also the answer to what each
       * division actually DOES, which the tagline gestures at and the body
       * copy talks around.
       */
      services: [
        "AI Avatars & Voice Cloning",
        "Multilingual & Personalised Videos",
        "Scalable AI Content",
        "AI-Powered Automations, Games & Apps",
      ],
      short: "AI Lab",
      href: "/#ai-lab",
      // See the note on Influence above — read off the 2026 lockup.
      caption: "Avatars | Multilingual Content | Games & Apps",
      ramp: "linear-gradient(100deg, #ff8fb8 0%, #ffa25c 100%)",
      body: "AI avatars and influencers, image and video generation, digital fashion, and the automation that compresses a content workflow from weeks into days.",
    },
  ],
} as const;

// --- Portfolio (Section 3) --------------------------------------------------

// Real clients, named in the spec. TODO(assets): real thumbnails/reels needed.
export const portfolio = {
  label: "Selected work",
  heading: "The work behind",
  headingAccent: "the names",
  body: "Content, campaigns and films made for brands that do not get second takes.",
  clients: [
    { id: "aditya-birla-capital", client: "Aditya Birla Capital", title: "Content & campaign work", category: "Campaign" },
    { id: "hdfc", client: "HDFC", title: "Content production", category: "Content" },
    { id: "absli", client: "Aditya Birla Sun Life Insurance", title: "Brand & performance content", category: "Brand" },
    { id: "mahindra-finance", client: "Mahindra Finance", title: "Influencer & content campaign", category: "Campaign" },
  ],
} as const;

// --- Case studies (Section 4) -----------------------------------------------

export const caseStudies = {
  label: "Case studies",
  heading: "Work that",
  headingAccent: "moved a number",
  body: "Campaigns where the outcome was measured, not just delivered.",
  // Clients are real (from the spec). TODO(data): every RESULT figure below is
  // still a placeholder — replace with reported numbers before launch.
  items: [
    { id: "cs-mahindra", client: "Mahindra", title: "TODO — case study headline", result: "TODO — result", discipline: "Content" },
    { id: "cs-abc", client: "Aditya Birla Capital", title: "TODO — case study headline", result: "TODO — result", discipline: "Campaign" },
    { id: "cs-absli", client: "Aditya Birla Sun Life Insurance", title: "TODO — case study headline", result: "TODO — result", discipline: "Brand" },
    { id: "cs-ab", client: "Aditya Birla", title: "TODO — case study headline", result: "TODO — result", discipline: "Content" },
  ],
} as const;

// --- Who we are -------------------------------------------------------------

/*
 * STRAIGHT FROM THE BRAND GUIDELINES, and none of it was on the site.
 *
 * The positioning page sets Genesis against the four kinds of agency the
 * market already has; the philosophy page gives three ideas, each with its
 * own line. Both are quoted rather than paraphrased — "AI isn't software. AI
 * is our creative medium." is the deck's sentence and it is better than
 * anything written to replace it.
 *
 * The sectors are the deck's own list, in its own order.
 */
// --- AI content -------------------------------------------------------------

// Spec: "AI tools, Image Generations, AI Avatars, Video Generations, AI videos
// and AI content to speed up your content workflows and engagement."
export const aiContent = {
  label: "AI Lab",
  heading: "Speed up the workflow,",
  headingAccent: "not the standard",
  /*
   * THE COPY ABOVE THE ROSTER, and all three lines of it are Genesis's own.
   *
   * IT MOVED, AND IT REPLACED SOMETHING. This block used to sit BELOW the
   * avatar fan, under a gradient heading that read "AI Avatars & Realism"
   * with "AI content that works like magic." beneath it. Genesis supplied
   * this copy as the replacement for that heading and asked for it above the
   * avatars, in the same style. So the old heading and its one-liner are
   * gone, not demoted: there is one piece of copy over the roster now, not
   * two competing for the same slot.
   *
   * THREE PARTS, IN THE ORDER GENESIS WROTE THEM. `lead` says who the
   * avatars are for, `heading` is the claim that takes the gradient the old
   * heading had, and `line` is what that claim means in practice. Splitting
   * them is what lets the middle one carry the ramp while the other two stay
   * legible body copy; run together as one paragraph the claim disappears
   * into the qualification around it.
   */
  avatarsIntro: {
    /*
     * "AI Content & Avatars" IS THE HEADLINE. It was the opening clause of a
     * single long sentence set at body size, with "One Setup. Real-Time.
     * Every Time" taking the gradient above the roster. Genesis pointed at
     * this phrase as the main thing, so it takes the large type and the
     * division ramp, and the qualification breaks to its own line under it
     * with a capital T — which is what makes it a standfirst rather than a
     * sentence that has been cut in half.
     */
    heading: "AI Content & Avatars",
    lead: "Tailored for founders, creators, influencers, and artists that look real. For Real!",
    /*
     * The recurring-service claim, now the SECOND heading rather than the
     * first. It keeps its own line beneath it.
     */
    promise: "One Setup. Real-Time. Every Time",
    line: "Automated AI Content for Your Brand and Personal Social Media.",
  },
  /*
   * THE AUTOMATION BLOCK, Genesis's copy verbatim. It is the third claim in
   * this section and the largest one — the roster says what the avatars are,
   * the promise says the content keeps coming, and this says the workflow
   * itself is the product. It is the only part of AI Lab that is about the
   * client's own business rather than about Genesis's output, which is why it
   * gets the diagrams and its own heading rather than another paragraph.
   */
  automation: {
    heading: "AI-Powered Automation",
    body:
      "Discover the unseen opportunities in your startup or business through AI Automation. By automating your workflows, you can simplify your daily business tasks. Let us handle it for you!",
  },
  /*
   * THE AVATAR BOARD, from the AI Lab page of the deck.
   *
   * That board is a fanned hand of cards with one held upright in the middle,
   * each carrying the avatar's name and — this is the part the site was
   * missing entirely — WHO THEY ARE. An avatar with a brief behind it ("Adi,
   * Aditya Birla Health Insurance") is a case study; a name floating under a
   * frame is a mood board. The roles below are read off that board.
   *
   * Two of the five names the spec gave us do not appear on it, so they carry
   * no role rather than an invented one. The component omits the line.
   *
   * ORDER IS THE FAN'S ORDER, left to right, and it is deliberate: the centre
   * card is the one held upright and lit, so the roster is arranged to put
   * the brand-work avatar there rather than whoever happened to be listed
   * first.
   */
  /*
    THE PORTRAITS ARE IN. Genesis supplied one card per name at 1080x1920,
    which is why `portrait` is a real path on every entry rather than the
    placeholder ramp the fan used to paint. They are photographs with no
    transparency and no burned-in type, so the card keeps drawing its own
    scrim and name over them.

    TODO(content): `bio`, `languages` and `useCases` are Genesis's to write.
    Each avatar has a page of its own at /avatars/<slug>; the detail view
    omits whatever is still pending rather than printing a placeholder.

    `reel` AND `stills` ARE THE SAMPLES THE DETAIL WINDOW SHOWS — what this
    avatar has actually been used to make. Both are empty, and they are empty
    rather than filled with something plausible on purpose: the work clips in
    /public/work are Genesis's production reel, not any avatar's output, and
    captioning one of them "Adi" would be inventing a credit. The section
    renders nothing at all until a file is listed here.

    TODO(assets): per avatar, drop the files under public/avatars/<id>/ and
    list them below — reel takes .mp4 paths, stills take images.
  */
  avatars: [
    { id: "ivaanat", portrait: "/avatars/ivaanat.jpg", name: "Ivaanat", role: "Fashion & Beauty" as string | undefined,
      bio: undefined as string | undefined, languages: [] as string[], useCases: [] as string[],
      reel: [] as string[], stills: [] as string[] },
    { id: "tanvi", portrait: "/avatars/tanvi.jpg", name: "Tanvi", role: "Head of Creatives | Genesis" as string | undefined,
      bio: undefined as string | undefined, languages: [] as string[], useCases: [] as string[],
      reel: [] as string[], stills: [] as string[] },
    { id: "jesko", portrait: "/avatars/jesko.jpg", name: "Jesko", role: "DJ | Techno artist",
      bio: undefined as string | undefined, languages: [] as string[], useCases: [] as string[],
      reel: [] as string[], stills: [] as string[] },
    { id: "adi", portrait: "/avatars/adi.jpg", name: "Adi", role: "Aditya Birla Health Insurance",
      bio: undefined as string | undefined, languages: [] as string[], useCases: [] as string[],
      reel: [] as string[], stills: [] as string[] },
    { id: "diya", portrait: "/avatars/diya.jpg", name: "Diya", role: "Aditya Birla Health Insurance",
      bio: undefined as string | undefined, languages: [] as string[], useCases: [] as string[],
      reel: [] as string[], stills: [] as string[] },
    { id: "bharat", portrait: "/avatars/bharat.jpg", name: "Bharat", role: "Advocate",
      bio: undefined as string | undefined, languages: [] as string[], useCases: [] as string[],
      reel: [] as string[], stills: [] as string[] },
    { id: "shivam", portrait: "/avatars/shivam.jpg", name: "Shivam", role: "Founder & CEO | Genesis",
      bio: undefined as string | undefined, languages: [] as string[], useCases: [] as string[],
      reel: [] as string[], stills: [] as string[] },
  ],
  // The deck's own subtitle for the division, verbatim, in place of four
  // categories written before the guidelines existed.
  capabilities: ["Avatars", "Multilingual content", "Games & apps"],
  /**
   * The stack feeding the lab. Spec says "TOOLS WE USE" but does not name
   * them, so these are the categories rather than vendors.
   * TODO(content): replace with the actual tools Genesis runs on.
   */
  tools: [
    { label: "Image generation", detail: "stills & keyframes" },
    { label: "Video generation", detail: "motion & b-roll" },
    { label: "AI avatars", detail: "presenters" },
    { label: "Voice & dubbing", detail: "multi-language" },
    { label: "Edit & post", detail: "assembly" },
    { label: "Scripting", detail: "concept to board" },
  ],
  destination: "Genesis.AILab",
} as const;

// --- Genesis Studios --------------------------------------------------------

/**
 * The production vertical, and the one the brief says to SHOW rather than
 * describe: "Show the actual production capability rather than simply
 * describing it."
 *
 * So the section leads with footage. The clips are Genesis's own work,
 * transcoded from the masters — the capability list underneath is the
 * caption, not the argument.
 *
 * THE CLIPS CARRY NO CLIENT NAMES, deliberately. They arrived as 1.mp4 to
 * 32.mp4 with no attribution anywhere in them, and a wall of real footage
 * labelled with guessed brands would be worse than a wall of unlabelled
 * footage. They stay anonymous until Genesis maps them; the work grid is
 * where named work lives.
 */
export const studios = {
  label: "Genesis Studios",
  heading: "Production at",
  headingAccent: "the standard",
  body:
    "Creative direction, scripting, shoot and post. The whole pipeline in-house, so a campaign never loses its thread between the idea and the published cut.",
  /*
   * THE CAPABILITY LIST, REPLACED BY GENESIS'S OWN.
   *
   * Thirteen became nine, and they are not a subset — the old list was
   * written from the original brief and named OUTPUTS ("Brand films",
   * "Corporate films", "Motion graphics"). Genesis's list names the parts of
   * the pipeline they sell, which is a different and more useful claim: two
   * of them ("Studio and venue rentals", "Founder-led shoots") are services
   * the old list had no way to express at all.
   *
   * `heading` is theirs too. The list sits under "Strategy" in the document
   * rather than under a label written here.
   */
  capabilitiesHeading: "Strategy",
  capabilities: [
    "Scripting",
    "Editing",
    "Shooting",
    "Studio and venue rentals",
    "DVCs",
    "Founder-led shoots",
    "Ideation",
    "Post-production",
    "Podcast planning and shoot",
  ],
  /**
   * THE PIPELINE, AS GENESIS WROTE IT.
   *
   * Supplied with a reference layout: a timeline with a stage at each stop.
   * The reference gave every stage its own hue — orange, violet, blue, green
   * — which is four colours that are not in the six Genesis fixed, so the
   * progression here is carried by the accent and by VALUE instead. See
   * StudiosPipeline.
   *
   * NO DASH IN THE STANDFIRST. Genesis's line was "Strategy, scripting,
   * production and post — one connected studio system"; they have asked for
   * dashes out of the copy, so it is a colon, which is what the sentence was
   * doing anyway.
   */
  pipeline: {
    heading: "From brief to",
    headingAccent: "final cut",
    lead:
      "Strategy, scripting, production and post: one connected studio system built for every screen.",
    stages: [
      { n: "01", name: "Brief", body: "Goal, audience, format" },
      { n: "02", name: "Script", body: "Concept, script, storyboard" },
      { n: "03", name: "Shoot", body: "Direction, set, performance" },
      { n: "04", name: "Edit", body: "Cut, colour, sound, motion" },
      { n: "05", name: "Deliver", body: "Every platform. Ready to play." },
    ],
  },
  /**
   * Which transcoded previews the wall plays. Sixteen of the thirty-two, in
   * two rows — enough to read as a body of work without putting every poster
   * frame on the homepage at once.
   */
  reel: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 26, 28, 30, 32],
} as const;

// --- Creative process (BTS) -------------------------------------------------

/**
 * Spec, twice: "Add creative process (BTS)" and "Add creative process 2 lines
 * or sections". Written as what actually happens rather than a tidy funnel —
 * the unglamorous steps are the ones clients ask about.
 * TODO(assets): the spec wants behind-the-scenes stills and video per step.
 */
export const creativeProcess = {
  label: "How we work",
  heading: "Our Art",
  headingAccent: "of Doing",
  body: "The process to keep your brand on everyone's eye.",
  /*
   * THE SIX STEPS ARE THE DECK'S, VERBATIM. The guidelines set out "Our Art
   * of Doing" as six named stages, under the line "the process to keep your
   * brand on everyone's eye" — both used here as written.
   *
   * The four steps this replaced were invented for the original build: "The
   * brief argument", "Direction, then casting", "Production", "Publish and
   * read the numbers". They described a production pipeline. The deck's six
   * describe a growth engagement, which is a different and larger claim —
   * it starts at the brand and ends at technology, with content in the
   * middle rather than as the whole of it.
   *
   * `caption` is the one-line gloss the layout shows. Nothing here invents a
   * promise the deck does not make; each is a plain reading of its step.
   */
  steps: [
    {
      title: "Building the Brand",
      caption: "identity, positioning and the rules that hold them",
    },
    {
      title: "Designing the Journey",
      caption: "how someone arrives, and what they meet when they do",
    },
    {
      title: "Creating Attention & Culture",
      caption: "ideas people want to share, not ads people tolerate",
    },
    {
      title: "Content at Scale",
      caption: "production that keeps feeding every channel",
    },
    {
      title: "Drive Growth",
      caption: "performance thinking against numbers agreed up front",
    },
    {
      title: "Technology & Integration",
      caption: "AI tooling and automation wired into the work",
    },
  ],
} as const;

// --- Influencer marketing ---------------------------------------------------

export const influencer = {
  /*
   * THE NICHES, NOT THREE ADJECTIVES. This line read "Strategic · Targeted ·
   * Impactful", which is a claim any agency could make about anything and
   * told a reader nothing they could act on. Genesis asked for the categories
   * here instead, and they are the better line for the same reason: a brand
   * arriving at this section is looking for whether their category is covered,
   * and this answers it in the eyebrow rather than making them read on.
   *
   * Read off `creators` below rather than typed again — the niches are already
   * the source of truth for the constellation, and two lists of the same eight
   * things is one list that goes stale.
   */
  get label() {
    return influencer.niches.join(" · ");
  },
  /**
   * THE CATEGORIES, OFF GENESIS'S OWN INFLUENCER BOARD — the one with 100K+
   * at the centre of a ring and ten niches around it.
   *
   * They are NOT read off `creators` any more, and the split is deliberate.
   * The constellation is capped at eight cards because twelve overlapping in
   * one orbit read as a pile rather than a network — that is a composition
   * limit, and it has no business deciding how many categories the database
   * is described as covering. Two lists, two jobs: these say what Genesis
   * briefs across, those are the faces that fit in an orbit.
   *
   * Named in the board's own order, down one side and then the other.
   */
  niches: [
    "Fashion",
    "Finance",
    "Gaming",
    "Tech",
    "Parenting",
    "Fitness",
    "Beauty",
    "Lifestyle",
    "Food",
    "Travel",
  ] as string[],
  /**
   * What the board counts beyond the ten it names. Genesis's own figure from
   * their own artwork — ten listed against sixty-six covered — so it is a
   * claim they already make rather than one inferred here.
   */
  moreNiches: 56,
  heading: "Influencer marketing,",
  headingAccent: "UGC & celebrity",
  body:
    "From discovery to delivery, we connect brands with the right voices. Creators across every genre, and celebrity collaborations at the top end.",
  databaseStat: {
    ...proof.creatorDatabase,
    /* NO LABEL. Genesis asked for the "Influencer database" caption gone
       from this card on both mobile and desktop; the figure and the line
       under it already say what it is. */
    label: "",
    description: "A curated network of creators across every niche and platform.",
  },
  /**
   * These four are read off Genesis's own mockup (spec page 7), which states
   * them as finished artwork — so they are the client's numbers, not invented
   * ones. They still want confirming against current reporting before launch,
   * because a design comp can lag the business.
   */
  /*
    These were the mockup's numbers and they disagreed with the journey
    board's by an order of magnitude — 500+ campaigns here against 50+ there,
    200+ brands against 30+. Both were on the same page. They now come from
    lib/proof.ts, which records the conflict rather than picking a side
    silently.
  */
  stats: [proof.campaigns, proof.brands, proof.reach, proof.platforms],
  /**
   * The constellation cards. The mockup labels these by NICHE and follower
   * count — "Travel Creator · 856K Followers" — not by celebrity name, so the
   * named celebrity collaborations below are a separate list and are not what
   * rides the orbits.
   *
   * Portraits are cropped from that same mockup and live in public/creators.
   * INTERIM: they are stills lifted from a design comp, at comp resolution.
   * Replace with real shot photography before launch.
   */
  /*
   * THE CONSTELLATION IS A MAP OF CATEGORIES, not a cast list. Genesis briefs
   * creators across every genre, and five dots read as five creators rather
   * than as a network — so the roster covers the niches the database actually
   * spans. Only the five with artwork carry an `image`; the rest fall through
   * to the cycling avatars, which is what the component already does for
   * anything orbiting.
   *
   * TODO(content): real creators and real reach, per the brief's note about
   * replacing generic placeholders. The CATEGORIES are real; the follower
   * counts are illustrative and must be signed off or removed before launch.
   */
  /*
   * EIGHT, NOT TWELVE. Twelve cards overlapping in one orbit read as a pile
   * rather than as a network — the labels collided and half the photographs
   * were behind another card.
   *
   * `name` IS THE LABEL, not the category. Genesis asked for the creator's
   * name on the card; the niche is what the section is already about, so
   * printing it eight times was saying the same thing eight times. The chip
   * renders only when a name exists, so until they arrive the cards are
   * simply photographs — which is also the decluttering.
   *
   * TODO(content): real creator names and reach. The `label` values below
   * are the niches and stay as the accessible description; `name` is empty
   * and must not be invented — these sit next to real photographs.
   */
  creators: [
    { id: "lifestyle", label: "Lifestyle", name: "", followers: "1.2M Followers", image: "/creators/lifestyle.webp", feature: true },
    { id: "travel", label: "Travel", name: "", followers: "856K Followers", image: "/creators/travel.webp" },
    { id: "fitness", label: "Fitness", name: "", followers: "2.4M Followers", image: "/creators/fitness.webp" },
    { id: "fashion", label: "Fashion", name: "", followers: "947K Followers", image: "/creators/fashion.webp" },
    { id: "finance", label: "Finance", name: "", followers: "1.1M Followers", image: "/creators/finance.webp" },
    { id: "beauty", label: "Beauty & skincare", name: "", followers: "1.6M Followers" },
    { id: "comedy", label: "Comedy & entertainment", name: "", followers: "3.1M Followers" },
    { id: "tech", label: "Tech & gadgets", name: "", followers: "610K Followers" },
  ],
  // Celebrity collaborations named in the spec.
  // TODO(spelling/legal): the document writes "Vikhrant Messay" and "Ajay
  // Devgan"; confirm correct spellings and that each is cleared for display.
  celebrities: [
    { id: "vikrant", label: "Vikrant Massey", sublabel: "Celebrity collaboration" },
    { id: "ajay", label: "Ajay Devgn", sublabel: "Celebrity collaboration", accent: "brand" as const },
    { id: "akash", label: "Akash", sublabel: "Creator" },
    { id: "rashmi", label: "Rashmi", sublabel: "Creator" },
    { id: "parvi", label: "Parvi", sublabel: "Creator" },
  ],
} as const;

// --- Branding & design ------------------------------------------------------

/*
 * The spec listed "Tripgate Branding & Guidelines, Abhi App logo, Doja and
 * more". Genesis has since corrected it: Doja comes off the list, and the
 * Abhi App entry is the Activ Health App — a logo redesign rather than an
 * identity built from nothing, which is what the caption now says.
 */
export const branding = {
  label: "Branding & design",
  heading: "Identity that survives",
  headingAccent: "contact with the feed",
  /*
   * "Content production" came off the capabilities list at Genesis's
   * instruction and was still sitting in this line, one paragraph above the
   * list it had been removed from — so the section contradicted itself in
   * view. Collaterals takes its place here too, which is what the division's
   * own tagline says it does.
   */
  body:
    "Brand guidelines, design, motion videos and brand collaterals, built for the sixth-second crop and not just the pitch deck.",
  work: [
    /*
      TRIPGATE'S LOCKED PALETTE, read off Genesis's own guidelines slide —
      "OPTION 3 is Locked", with the hex codes printed under each swatch. It
      is here as VALUES rather than as a picture of the slide on purpose: five
      hex codes render sharp at any size and in any theme, where a screenshot
      of a colour board is a JPEG of colours that cannot be copied, sampled or
      read by anything.
    */
    {
      title: "Tripgate",
      caption: "Branding & guidelines",
      palette: ["#0f5c56", "#b7e3ff", "#ffe5a9", "#f89423", "#ffffff"],
    },
    /*
      `assets` names a folder under /public/brand. Where one exists, the
      section shows that mark's ROUTE — the sketch phases in order, then the
      finished logo — because "Logo redesign" as a caption is a claim and the
      sketches are the evidence. See branding-design.tsx: the strip appears on
      its own when the files are there and the caption stands alone when they
      are not, so this needs no second flag to keep in sync.
    */
    { title: "Activ Health App", caption: "Logo redesign", assets: "activ-health" },
  ],
  /*
    "Content production" comes off at Genesis's instruction and "Brand
    collaterals" goes on — which also settles a contradiction: collaterals are
    named in this division's own tagline ("Branding Positioning, Design &
    Collaterals") and were missing from the list under it, while content
    production is Studios' whole job and was being claimed here as well.
  */
  capabilities: [
    "Brand guidelines",
    "Visual identity",
    "Motion design",
    "Campaign toolkits",
    "Curated content",
    "Brand collaterals",
  ],
} as const;

// --- Clients (Section 5) ----------------------------------------------------

// Spec: "Same as the existing website ++ @ Ask tanvi" — so this list is the
// confirmed subset. TODO(assets): full logo dump still owed by Tanvi.
export const clients = {
  /*
   * The eyebrow used to be "Clients we've worked with" and the section had NO
   * heading at all — just a label, a line of instruction and the wall. Genesis
   * asked for a heading you can actually see, so the eyebrow gives up saying
   * what the heading now says and carries the sectors instead, which is the
   * one thing twenty-nine marks cannot tell you on their own.
   */
  /* NO EYEBROW. Genesis asked for "Trusted by" off this section: the
     heading already says "Our clients" and the marks say the rest. */
  label: "",
  heading: "Our",
  headingAccent: "clients",
  body: "Thirty brands across banking, hospitality, FMCG, media, real estate and education.",
  /*
   * THE REAL LOGO FILES, at last. This was a list of NAMES rendered as text
   * wordmarks under a standing TODO ("Ask tanvi"); it is Genesis's own
   * "Pallete of Brand Works", twenty-nine marks, one per client.
   *
   * THIRTY WERE SUPPLIED AND TWENTY-NINE ARE HERE (SiNet arrived separately
   * and makes thirty on the wall). The missing one is set in
   * script inside a yellow ticket and cannot be read with enough confidence
   * to print a client's name on a public page — which is the SAME mark, and
   * the same reason, recorded against the old text list. A misspelled client
   * is worse than a missing one. It goes in the moment someone names it.
   * TODO(content): identify file 21 of the Pallete of Brand Works.
   *
   * `treat` IS THE CORRECTION EACH MARK NEEDS, AND IT IS MEASURED.
   *
   * The chips are gone at Genesis's request — only the PNGs — and that turned
   * a solved problem back into an open one. With a white chip there was one
   * ground for all thirty and the fix could be a constant. Without one the
   * ground is the page: near-black in one theme, paper in the other, and a
   * mark needs the OPPOSITE treatment in each.
   *
   * THE FIELD NAMES THE FIX, NOT THE ARTWORK, and that is the second attempt.
   * The first classified each file by its ink's mean luminance — dark, mid,
   * light — and it was wrong for a whole category: a logo that is a SOLID
   * DARK PLAQUE with light lettering (Grand Hyatt, Four Points, HDFC) reads
   * as "dark" by the mean, and inverting it turns the plaque WHITE. Which is
   * to say the first pass reintroduced the white blocks this change exists to
   * remove, on five of the thirty.
   *
   * So the choice is made by simulation rather than by classification. Each
   * file is composited over the dark page under all three candidate filters,
   * and each result is scored on two numbers: VISIBILITY (alpha-weighted mean
   * distance from the ground) and BLOCKINESS (the share of the frame that
   * ends up opaque AND far from the ground — which is exactly what a "block"
   * is). The winner is the most visible option whose blockiness stays under
   * 30%.
   *
   *   "invert" — five files. Ordinary dark ink on transparent, with little
   *     enough of it that flipping cannot produce a slab.
   *   "lift"   — twenty-three. Brightness rather than inversion, because
   *     brightening a dark plaque lifts it to grey while brightening thin
   *     dark ink lifts it to near-white: it is the one operation that helps
   *     the ink without ever manufacturing a white rectangle.
   *   "asis"   — two. Already light artwork; any correction would hide them.
   *
   * The light theme mirrors all three — see .client-mark in globals.css.
   *
   * TWO ARE STILL COMPROMISED and it is worth knowing which. Grand Hyatt and
   * Four Points are drawn as filled plaques, so under any filter their box
   * remains a visible rectangle; "lift" makes it grey rather than white,
   * which is the best a filter can do. SiNet is the only file of the thirty
   * with no transparency at all — measured, 0% transparent pixels — so its
   * background is part of the picture.
   * TODO(assets): transparent, single-colour exports of those three would
   * remove every special case here.
   *
   * `ratio` IS THE FILE'S OWN WIDTH/HEIGHT, and it is here because it is what
   * decides how big each mark is allowed to be. These range from 0.89 (LN
   * Construction, near square) to 12.63 (Mahindra Finance, a long strip), and
   * a set of marks that different by fourteen times CANNOT share one box: in
   * the square chip this replaced, object-contain left Mahindra Finance 5.7px
   * tall while a square mark stood at 72. That is the size problem Genesis
   * kept pointing at, and it was never a padding value — it was the geometry.
   * See client-logos.tsx for what the number is used for.
   *
   * TODO(assets): dark-ink versions of those seven would let every mark run
   * untouched. Dimming a client's colour is a compromise, not a preference.
   */
  /*
   * THE SECTORS, AND THEY LIVE HERE NOW.
   *
   * They were part of the positioning section, which Genesis has asked to be
   * removed entirely — except for this line, which they asked to keep and to
   * move under the client logos. It belongs there better than it did where
   * it was: a list of the industries Genesis works in is a caption on thirty
   * client marks, not a footnote to a philosophy.
   *
   * Twelve became ten. "Finance" and "Health" both came out because BFSI
   * already covers them — the acronym expands to Banking, Financial Services
   * and Health Insurance, so the strip was naming two of its own three parts
   * a second time. "Tech" is written out as Technology.
   *
   * `expands` is the acronym's own long form, and it is a separate field
   * rather than part of the label because the strip is set in letterspaced
   * uppercase micro type: "BFSI (BANKING, FINANCIAL SERVICES & HEALTH
   * INSURANCE)" printed there is wider than the other nine put together. It
   * renders as the <abbr> title instead, so the expansion is available to
   * anyone who wants it and to a screen reader, without the line becoming
   * one sector and a paragraph.
   */
  sectors: [
    {
      label: "BFSI",
      expands: "Banking, Financial Services & Health Insurance",
    },
    { label: "Fashion" },
    { label: "Beauty" },
    { label: "Lifestyle" },
    { label: "Entertainment" },
    { label: "Food & Beverage" },
    { label: "Education" },
    { label: "Travel" },
    { label: "Technology" },
    { label: "Real Estate" },
  ] as ReadonlyArray<{ label: string; expands?: string }>,

  logos: [
    { name: "Aditya Birla Capital", file: "aditya-birla-capital", treat: "invert", ratio: 2.55 },
    { name: "Mahindra Finance", file: "mahindra-finance", treat: "lift", ratio: 12.63 },
    { name: "HDFC Bank", file: "hdfc-bank", treat: "asis", ratio: 5.7 },
    { name: "IDBI Bank", file: "idbi-bank", treat: "lift", ratio: 5.93 },
    { name: "House of Hiranandani", file: "house-of-hiranandani", treat: "lift", ratio: 2.02 },
    { name: "The WorldGrad", file: "the-worldgrad", treat: "lift", ratio: 3.24 },
    { name: "The Lalit Mumbai", file: "the-lalit-mumbai", treat: "lift", ratio: 1.22 },
    { name: "Social Samosa", file: "social-samosa", treat: "lift", ratio: 1.97 },
    { name: "Four Points", file: "four-points", treat: "asis", ratio: 1.47 },
    { name: "Someplace Else", file: "someplace-else", treat: "lift", ratio: 6.32 },
    { name: "Matahaari", file: "matahaari", treat: "lift", ratio: 1.76 },
    /*
      THESE THREE HAD THEIR PLAQUES KEYED OUT — see scripts/key-client-plaques.
      They shipped as the brand's coloured block with the mark reversed out of
      it (navy, blue and maroon), and since the wall greyscales everything,
      those blocks flattened to exactly the grey rectangle Genesis asked to be
      rid of. What is left is white ink on transparency, so they take `asis`:
      the artwork is already light and `lift`'s brightness would only blow it
      out. The ratios moved because cropping to the ink changed their shape —
      Four Points was a square plaque and is a wide wordmark now.
    */
    { name: "Grand Hyatt", file: "grand-hyatt", treat: "asis", ratio: 5.68 },
    { name: "MNR", file: "mnr", treat: "invert", ratio: 1.4 },
    { name: "BNI", file: "bni", treat: "lift", ratio: 2.55 },
    { name: "Imagicaa", file: "imagicaa", treat: "lift", ratio: 2.39 },
    { name: "Kitty Su", file: "kitty-su", treat: "invert", ratio: 1.29 },
    { name: "Royal Tulip", file: "royal-tulip", treat: "lift", ratio: 2.21 },
    { name: "Radcliffe", file: "radcliffe", treat: "lift", ratio: 3.53 },
    { name: "HT Brunch", file: "ht-brunch", treat: "asis", ratio: 4.21 },
    { name: "Bumble", file: "bumble", treat: "lift", ratio: 5.85 },
    { name: "Lizol", file: "lizol", treat: "asis", ratio: 0.98 },
    { name: "Dove", file: "dove", treat: "lift", ratio: 1.42 },
    { name: "Bacardi", file: "bacardi", treat: "lift", ratio: 1.36 },
    { name: "Vivo", file: "vivo", treat: "lift", ratio: 3.78 },
    { name: "Budweiser", file: "budweiser", treat: "lift", ratio: 2.94 },
    { name: "LN Construction", file: "ln-construction", treat: "lift", ratio: 0.89 },
    { name: "Kamdhenu", file: "kamdhenu", treat: "lift", ratio: 1.56 },
    { name: "Aditya Birla Sun Life Insurance", file: "aditya-birla-sun-life", treat: "invert", ratio: 2.54 },
    { name: "TripGate", file: "tripgate", treat: "invert", ratio: 3.24 },
    /*
      SINET WAS "invert" AND THAT IS WHAT PUT A BLACK SQUARE ON THE PAGE. Its
      export was a fully opaque file — dark ink on a white plaque, 100% of the
      frame — so inverting it to lift the ink on a dark page also flipped the
      white ground to black, which is the block Genesis asked to be rid of.
      The file has since had that ground keyed out (13% of it is ink now), so
      it takes the default lift like the rest of the dark-on-transparent set.
    */
    { name: "SiNet", file: "sinet", treat: "lift", ratio: 1.09 },
  ],
} as const;

// --- Testimonials (Section 6) -----------------------------------------------

// Names and companies are REAL, from the spec. The spec also notes "Start
// video testimonial project", so these become video cards later.
// TODO(copy): every QUOTE below is invented placeholder text — real quotes
// must be collected before launch. Names/roles are as given in the document.
export const testimonials = {
  label: "What clients say",
  heading: "In their",
  headingAccent: "words",
  /**
   * THESE QUOTES ARE WRITTEN, NOT COLLECTED, AND THE NAMES ARE REAL.
   *
   * I flagged that once: a sentence I wrote, printed under a real person at a
   * named company, is a quote they never gave, and it ships when the site
   * does. Genesis has asked twice for the names to be on them, which is their
   * call — it is their client list and their relationship, and they have said
   * these get replaced with the real thing.
   *
   * So the risk is written down here instead of argued about. Every one of
   * these is `approved: false`. Nothing renders that flag today, but it means
   * a person or a script can find every unapproved quote on the site in one
   * grep, and the day a real one arrives you swap the text and set the flag
   * rather than trying to remember which of the six were ours.
   *
   * TODO(content): replace each quote with the client's own words and set
   * `approved: true`. Until then, do not put these in a deck, an ad, or
   * anywhere they cannot be taken back down.
   */
  items: [
    {
      quote:
        "They came back with a plan for the whole quarter, not a set of posts. That is the difference we were looking for and had not found anywhere else.",
      name: "Anu Raj",
      role: "Mahindra",
      approved: false,
    },
    {
      quote:
        "Scripting, shoot and edit all sat with one team, so nothing got lost in a handover. We went from brief to published in under three weeks.",
      name: "Shreya",
      role: "Mahindra Finance",
      approved: false,
    },
    {
      quote:
        "The creators they put us in front of actually matched the brief. Reach was the easy part. The fit is what moved the numbers.",
      name: "Amey Khopte",
      role: "Aditya Birla Sun Life Insurance",
      approved: false,
    },
    {
      quote:
        "We came in with a rough idea and left with a campaign. They pushed back where it mattered and were right to.",
      name: "Aditya Rane",
      role: "IndusInd Nippon Life Insurance",
      approved: false,
    },
    {
      quote:
        "Turnaround was the thing. Two weeks of footage cut, approved and live while we were still writing the next brief.",
      name: "Anandkumar",
      role: "QuiteBox",
      approved: false,
    },
    {
      quote:
        "A set that runs on time and a team that knows what it wants on the day. That is rarer than it should be.",
      name: "Rishabh Wala",
      role: "Cinematographer",
      approved: false,
    },
  ],
} as const;

// --- Journal / blog teaser --------------------------------------------------

// Spec: "Write 2 new blogs on AI", "each paper is a blog (floating animation)",
// "papers moving like magnetics (for reference motion check igloo.inc)".
// TODO(content): real posts arrive as MDX in Phase 4.
export const journal = {
  label: "Journal",
  heading: "Thinking out",
  headingAccent: "loud",
  body: "Notes on creators, content and the technology reshaping both.",
  posts: [
    { slug: "ai-content-workflows", title: "TODO — AI blog #1 (spec: write 2 new blogs on AI)", category: "AI", readingTime: "TODO" },
    { slug: "ai-avatars-in-campaigns", title: "TODO — AI blog #2 (spec: write 2 new blogs on AI)", category: "AI", readingTime: "TODO" },
    { slug: "creative-process", title: "TODO — creative process / BTS", category: "Inside Genesis", readingTime: "TODO" },
  ],
} as const;

// --- Insider teaser ---------------------------------------------------------

export const insider = {
  label: "Genesis Insider",
  heading: "The workspace",
  headingAccent: "behind the work",
  body:
    "Clients, projects, content pipelines and invoicing. The internal operating system the team runs on, and access is invite-only.",
  cta: { label: "Sign in to Insider", href: "/insider" },
} as const;

// --- Footer CTA -------------------------------------------------------------

export const footerCta = {
  heading: "Let's build something",
  headingAccent: "iconic",
  body: "Tell us what you're launching. We'll tell you how we'd approach it.",
  primaryCta: { label: "Contact us", href: "/#contact" },
  // TODO(contact): confirm the routing address.
  email: "hello@genesismedia.co",
} as const;
