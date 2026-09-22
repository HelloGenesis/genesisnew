/**
 * Single source of truth for navigation and site-wide strings.
 * Defined once so the nav, footer, sitemap and mobile menu never drift.
 */

export type NavItem = {
  label: string;
  href: string;
  /** One-line description, used by the Capabilities menu. */
  blurb?: string;
  /** Marks routes that do not exist until Phase 4. */
  planned?: boolean;
  /**
   * Leaves the site. Rendered as a plain anchor with target/rel rather than
   * through next/link, which would try to route it. "Build Your AI Avatar"
   * in the footer is the only one today — it opens WhatsApp.
   */
  external?: boolean;
  /**
   * Turns this item into a menu rather than a link.
   *
   * The bar has exactly one — Services, holding the four divisions. It is
   * written as data rather than special-cased in GlassNav so the desktop bar
   * and the mobile sheet can render the same tree two ways without either of
   * them deciding what is in it.
   *
   * An item with children still carries an `href`: it is where the menu goes
   * if a reader clicks the trigger itself, and it is what a crawler follows.
   */
  children?: NavItem[];
};

export const siteConfig = {
  name: "Genesis Media",
  // TODO(copy): pulled from the current genesismedia.co hero (docs/reference/
  // img-019). Confirm before launch — the live site has a typo in "Technolgy".
  tagline: "Empowering brands with influencer marketing, creative content & technology.",
  /*
    NOT "A GEN Z-LED FULL-SERVICE AGENCY" ANY MORE, at Genesis's instruction,
    and the reason is that it has stopped being true rather than that it
    reads badly. The business now sells influencer marketing, content
    production, AI content and avatars, branding, design, games, apps,
    automation, events and interactive work — and "full-service agency" is
    the line that makes a buyer assume the first two and none of the rest.

    IT IS LONG, AND THAT IS THE POINT OF THIS ONE. This string is the
    Organization schema's description and the fallback meta description: a
    place where naming the ten things is worth more than a sharp sentence,
    because it is read by machines matching a query to a company. The SHORT
    version of the same claim is the homepage's own standfirst — "We help
    brands grow through creators, content, AI, technology and design" — which
    is what a person reads.
  */
  description:
    "Genesis Media is a creative company specialising in influencer marketing, content production, AI solutions, branding, design, games, apps, automation, events and interactive digital experiences.",
  /*
    THE CANONICAL ORIGIN, AND IT IS THE WWW HOST ON PURPOSE. The site this
    replaces is served from www.genesismedia.co — the bare domain 301s to it —
    so every URL Google has indexed for Genesis is on www. Launching on the
    bare domain would be a host migration on top of a platform migration, for
    no gain. If the Vercel project is set up with the bare domain as primary
    instead, change it here (or set SITE_URL) and nowhere else: canonicals,
    Open Graph, the sitemap, robots.txt and the JSON-LD all read it from
    lib/seo.ts.
  */
  url: "https://www.genesismedia.co",
  /*
    NAP — name, address, phone — for the Organization schema. Written once so
    the schema and anything that prints the address later cannot disagree.

    The office, as Genesis gave it. Panvel is in the Mumbai Metropolitan
    Region, which is why the copy says Mumbai and the schema says Panvel.
    Keep this identical to the Google Business Profile, character for
    character.
  */
  address: {
    streetAddress: "104, Plot-122/123, Sector-10, New Panvel East" as string | undefined,
    postalCode: "410206" as string | undefined,
    locality: "Panvel",
    region: "Maharashtra",
    country: "IN",
  },
  /** The two accounts the footer links to. Read by SocialStars and the schema. */
  social: {
    instagram: "https://www.instagram.com/genesismedia.co/",
    linkedin: "https://www.linkedin.com/company/genesismediaa/",
  },
  /**
   * Genesis's business WhatsApp line. Written the way a person writes a phone
   * number rather than the way wa.me wants it — the button strips everything
   * that is not a digit before building the link, so the readable form is the
   * one that lives here and the country code is the only part that matters.
   *
   * The floating button renders only when this holds a number; setting it
   * back to an empty string switches the button off rather than leaving it
   * opening a chat with nobody.
   */
  whatsapp: "+91 96534 54848",
  /**
   * THE BUSINESS LINE, AND IT IS THE SAME NUMBER AS THE WHATSAPP ONE.
   *
   * Written as its own field rather than read off `whatsapp` because the two
   * are not the same fact: `whatsapp` is an input to a URL builder that
   * strips everything but the digits, and this is a phone number PRINTED for
   * a person to read and tap. The day Genesis has a landline for the office
   * and a mobile for WhatsApp, this changes and that one does not.
   *
   * Genesis asked for it added and for it to be clickable on mobile, which
   * is what `telHref` below is for — a tel: URI wants the digits and the
   * plus and nothing else.
   */
  phone: "+91 96534 54848",
  /**
   * THE MESSAGE THE CHAT OPENS WITH, so the visitor never faces an empty
   * compose box. Two jobs: read like something a person would actually send,
   * and tell Genesis where the lead came from — a message that opens with the
   * website saves the first reply from being "how did you find us?". It stops
   * short of naming a division on purpose. The button floats on every page,
   * so it cannot know which one they were reading, and a wrong guess printed
   * in the visitor's own compose box is worse than no guess.
   */
  whatsappMessage:
    "Hi Genesis! I found you through your website and I'd like to talk about a project.",
  /**
   * THE AVATAR ENQUIRY, written by Genesis, opened by two different controls:
   * AI Lab's "Create Your AI Avatar" and the footer's "Build Your AI Avatar".
   *
   * It sits here rather than with the AI Lab copy precisely because there are
   * two callers. The floating button's message above cannot name a division —
   * it floats on every page and does not know what the reader was looking at
   * — but both of these do, so the first reply does not have to open by
   * asking what the enquiry is about.
   */
  avatarWhatsappMessage:
    "Hello Team Genesis! I would like to inquire about AI avatars and AI content creation. Could you please provide me with further guidance?",
} as const;

/**
 * Builds a wa.me link, with the compose box already filled in.
 *
 * ONE PLACE, because there are two callers now and they must not disagree
 * about how a phone number becomes a URL. The floating button opens the
 * generic message above; AI Lab's "Create Your AI Avatar" opens one Genesis
 * wrote for that button specifically, so the first reply does not have to
 * start by asking what the enquiry is about.
 *
 * Returns undefined when there is no number, which is the same switch the
 * floating button already honours: a WhatsApp link that opens a chat with
 * nobody is worse than no link, and every caller has to be able to render
 * something else instead.
 */
/**
 * The number as a `tel:` URI: the plus and the digits, nothing else.
 *
 * Spaces in a tel: href are legal and some dialers still mis-parse them, and
 * every other formatting character (brackets, dashes) reliably breaks one, so
 * the readable form lives in siteConfig and the machine form is derived.
 */
export function telHref(number: string = siteConfig.phone) {
  const digits = number.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

export function whatsappLink(message: string = siteConfig.whatsappMessage) {
  const number = siteConfig.whatsapp.replace(/\D/g, "");
  if (!number) return undefined;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * WHAT A CONTEXTUAL CTA SAYS WHEN IT OPENS WHATSAPP.
 *
 * Genesis: "for every contact us type button open whatsapp. Jisko ek main
 * form bharna hoga woh bharega, par waise me jo bhi hai direct whatsapp
 * karo." So the buttons scattered through the sections stop opening a popup
 * form and open a chat instead; the long enquiry form at the foot of the page
 * stays exactly where it is for anyone who wants to fill one in.
 *
 * WHY IT IS A PREFIX MATCH ON THE CTA'S OWN NAME. Every one of those buttons
 * already carries a source string — "influence:plan-a-campaign",
 * "brand-design:build-a-brand", "case-study:<slug>" — which existed so the
 * form submission could record which CTA produced it. That string is exactly
 * the context a first WhatsApp message wants, and it is already threaded to
 * the one place that handles these clicks, so nothing new has to be wired:
 * the part before the colon names the division and picks the sentence.
 *
 * THE MESSAGE NAMES THE DIVISION AND NOTHING ELSE. It is written into the
 * visitor's own compose box, so a wrong guess is worse than a vague one —
 * "I'd like to talk about an influencer campaign" is true of every button
 * under Influence, where anything more specific would be putting words in
 * someone's mouth about a page they may have only scrolled past.
 */
const CTA_MESSAGES: Record<string, string> = {
  influence:
    "Hi Genesis! I'd like to talk about an influencer campaign.",
  studios:
    "Hi Genesis! I'd like to talk about content production with Genesis Studios.",
  "ai-labs": "Hi Genesis! I'd like to talk about AI content and automation.",
  "ai-lab": "Hi Genesis! I'd like to talk about AI content and automation.",
  "brand-design": "Hi Genesis! I'd like to talk about branding and design.",
  "case-study":
    "Hi Genesis! I was reading one of your case studies and I'd like to talk about a project.",
  "case-studies":
    "Hi Genesis! I was reading your case studies and I'd like to talk about a project.",
};

/**
 * The chat link for a contextual CTA, or undefined when there is no number.
 *
 * UNDEFINED IS A REAL ANSWER and every caller has to handle it — the same
 * switch the floating button and the footer's avatar link already honour.
 * Emptying `whatsapp` in siteConfig puts every one of these buttons back to
 * opening the enquiry form rather than leaving them opening a chat with
 * nobody.
 */
export function ctaWhatsappLink(source?: string | null) {
  const key = (source ?? "").split(":")[0];
  return whatsappLink(CTA_MESSAGES[key] ?? siteConfig.whatsappMessage);
}


/**
 * WHERE THE WORDMARK GOES.
 *
 * Genesis asked for the logo in the top-left to lead back to the Brain rather
 * than to "/" — which on the homepage did nothing at all, because the Brain
 * IS the top of the homepage and the browser was already there. As a hash it
 * scrolls from anywhere on the homepage and still loads the homepage from any
 * other route, so one href covers both.
 */
export const homeHref = "/#services";

/**
 * THE FOUR DIVISION PAGES, and the homepage section each one is the long
 * form of.
 *
 * WHY THE DIVISIONS HAVE URLS AGAIN. They were folded into the landing page
 * as anchors — /#influence and the rest — and an anchor is not a page to a
 * search engine: Google indexes one document at "/", so none of the four
 * could rank for its own service, and "influencer marketing agency" had
 * nothing to land on. Each is now a real, server-rendered route with its own
 * title, copy and schema.
 *
 * THE ONE-PAGE SCROLL IS UNTOUCHED. Every link to a division carries the
 * page's URL, which is what a crawler follows; on the homepage itself
 * SmoothScroll maps a plain click on one of these to its `section` and
 * scrolls there, exactly as the old anchor did. A visitor on "/" sees no
 * difference. From any other page, or with cmd-click, the link opens the
 * division's own page.
 */
export const divisionPages = [
  { label: "Influencer Marketing", href: "/influencer-marketing", section: "influence", blurb: "Creator-led growth" },
  { label: "Content Production", href: "/content-production", section: "studios", blurb: "Production & content" },
  { label: "AI Content & Automation", href: "/ai-content-automation", section: "ai-lab", blurb: "Creative technology" },
  { label: "Brand & Design", href: "/brand-design", section: "brand-design", blurb: "Identity & communication" },
] as const;

/** The homepage section a division page stands for, keyed by its path. */
export const sectionForPage: Record<string, string> = Object.fromEntries(
  divisionPages.map((page) => [page.href, page.section]),
);

/*
  DECLARED AFTER divisionPages AND homeHref, WHICH IS A REAL CONSTRAINT AND
  NOT A TIDYING CHOICE. The Services menu builds its children from the first
  and its own href from the second, and a `const` cannot be read above its own
  declaration — the module threw at import before this moved. If the bar ever
  stops depending on either, it can go back up top.
*/
/**
 * Primary navigation — four items, and that is the whole bar.
 *
 * THE FOUR VERTICALS ARE OFF IT, at Genesis's instruction. Influence,
 * Studios, AI Labs and Brand & Design each had a link here; they are now
 * reached from the Brain, which is the first thing on the page and is a
 * picture of exactly that choice. Naming them twice — once as a row of small
 * grey words in a pill, once as four gradient marks around the orb — made the
 * pill compete with the composition that was built to be the way in.
 *
 * WORK AND CASE STUDIES ARE TWO ITEMS, NOT ONE. They were briefly merged
 * into a single "Work | Case Studies" link — that was a misreading of the
 * brief and Genesis corrected it. They are different things and they go to
 * different places:
 *
 *   WORK is the Portfolio — the full library of films, reels and campaigns at
 *     /our-work. Browsing.
 *   CASE STUDIES is the written argument: the problem, what was decided, and
 *     the number the client agreed to. It scrolls to that section on the
 *     homepage, whose own button leads on to the full studies.
 *
 * Merging them pointed both readings at the library, so anyone looking for
 * the results got a wall of thumbnails.
 *
 * WHAT THIS BUYS BACK. Eight items needed about 1150px alongside the
 * wordmark, the toggle and the CTA, which is why the full bar waited for xl
 * and every laptop under 1280 got the hamburger. Five short ones fit
 * comfortably at lg — "Work" and "Case Studies" together are narrower than
 * the single "Work | Case Studies" they replace.
 */
export const navItems: NavItem[] = [
  /*
    SERVICES, AND IT IS THE ONE MENU ON THE BAR.

    IT REPLACED "PORTFOLIO", at Genesis's instruction, and the trade is a good
    one. Portfolio pointed at #library — a section a reader reaches by
    scrolling anyway, and one the footer, the case-study section and three
    division CTAs all already link to. The four divisions had no route from
    the bar at all: they were taken off it when the Brain became the first
    thing on the page, on the reasoning that a diagram of four names is a
    better way in than four grey words. That holds for a visitor who LANDS on
    the homepage and fails for everyone else — from a case study, a division
    page or a form, there was no way to reach Influence but to go home first.

    A MENU RATHER THAN FOUR ITEMS, because four more links across the bar is
    what was removed. Folded behind one word they cost the width of one word.

    The href is the Brain. A reader who clicks the trigger instead of picking
    from the menu gets the picture the menu is a text version of.
  */
  {
    label: "Services",
    href: homeHref,
    children: divisionPages.map(({ label, href, blurb }) => ({
      label,
      href,
      blurb,
    })),
  },
  // The page, not the homepage rail: Genesis asked the bar to open it.
  { label: "Case Studies", href: "/case-studies" },
  /*
    THE TWO FORMS, ON THE BAR. Both pages existed and neither was reachable
    from the nav — the only routes to them were a button inside a section you
    had to scroll to first, which for a creator or an applicant who arrived
    looking for exactly this is not a route at all. Genesis asked for them up
    here by name.
  */
  { label: "I'm a Creator", href: "/creator" },
  { label: "Career", href: "/careers" },
  { label: "Contact", href: "/#contact" },
];

/** The one navigation item that is meant to look like an action. */
export const primaryCta = { label: "Start a Project", href: "/#contact" } as const;

/**
 * Footer groupings — Genesis's own list of links, in three columns.
 *
 * WHAT THIS REPLACED. Three columns headed Genesis / Capabilities / Connect,
 * carrying About, Portfolio, Team and the four division names. Genesis
 * supplied a flat list of eleven links and asked for the "About Genesis"
 * blurb above it to come off; both are done. About, Portfolio and Team are
 * gone from here because they are not on that list — Portfolio survives as
 * "Library", which is the same destination under the name Genesis uses for
 * it, and the divisions are reached from the Brain now rather than from a
 * column of small grey words.
 *
 * THE GROUPING IS MINE, THE LINKS ARE THEIRS. A flat eleven in one column is
 * a long thin list beside a wide empty footer; three headed groups is the
 * shape the panel is built for. Nothing is added or dropped in the process —
 * the eleven below are the eleven supplied, in their order.
 *
 * THE LOG IN COLUMN IS GONE, at Genesis's request. It offered a Client Login
 * and an Employee Login that both opened /insider, the only authenticated
 * door there is; two labels for one door in the footer of a site that has no
 * accounts yet was promising something the site does not do. /insider itself
 * is untouched and still reachable by typing it — see robots.ts, which keeps
 * it out of search.
 *
 * SERVICES IS THE THIRD COLUMN, and it is the four division pages. The
 * footer is on every page, so this is what gives each division a link from
 * every other page on the site — the internal linking a new URL needs before
 * it can rank. "Influencer Marketing" moved here from Work; the other three
 * are new. On the homepage they still scroll, like every link in this footer
 * (see divisionPages).
 */
/**
 * Footer groupings.
 *
 * NO "GENESIS ECOSYSTEM" COLUMN. One was built — GenesisDrip and Genesis
 * Estate, sitting beside the media links rather than under them, because they
 * are siblings of Genesis Media rather than sections of it — and Genesis has
 * since asked for both off the site entirely. The column went with them: two
 * groups short of its only reason to exist, it would have been a heading over
 * nothing.
 *
 * The structure it introduced stays, because that part was not about the
 * ecosystem: Genesis Media's own pages in the first column, everything a
 * person might want to DO in the second.
 *
 * WHAT CAME OFF WITH THE RESTRUCTURE. "Campaigns" and "Library" both pointed
 * at /#library — two labels for one destination, which is the same fault as
 * the two Log In links that were removed from here for the same reason.
 * Library survives under the name the section now uses for itself.
 */
export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Genesis Media",
    items: [
      /*
        THESE SCROLL, THEY DO NOT NAVIGATE (except the two that have no
        section). Genesis's instruction is that the footer should take you to
        the section rather than open a new page, which is right for a
        single-page site: a reader at the bottom clicking "Events" wants the
        block they just scrolled past, not a fresh document and a lost scroll
        position. The division hrefs are real pages, and SmoothScroll maps
        them to their sections while you are on the homepage.
      */
      { label: "Work", href: "/#library" },
      { label: "Case Studies", href: "/case-studies" },
      ...divisionPages.map(({ label, href }) => ({ label, href })),
      /*
        NO "EVENTS" LINK. There was one, pointing at /#events, and that
        section has been removed — a footer link to an anchor that does not
        exist scrolls nowhere and reads as a broken site. The event work is
        still reachable: it is a division in the portfolio's filter row.
      */
    ],
  },
  {
    heading: "General",
    items: [
      { label: "Start a Project", href: "/#contact" },
      /*
        The same chat, with the same message, as AI Lab's own CTA — built
        from whatsappLink rather than typed out, so the two cannot drift.
      */
      {
        label: "Build Your AI Avatar",
        /*
          Falls back to the enquiry form when there is no number in
          siteConfig — the same switch the floating button honours. A footer
          link that opens a chat with nobody is worse than one that opens the
          form.
        */
        href: whatsappLink(siteConfig.avatarWhatsappMessage) ?? "/#contact",
        external: Boolean(whatsappLink(siteConfig.avatarWhatsappMessage)),
      },
      { label: "I'm a Creator", href: "/creator" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/#contact" },
    ],
  },
];
