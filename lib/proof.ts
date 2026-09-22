/**
 * PROOF FIGURES — one source of truth.
 *
 * The site was carrying three different answers to "how many campaigns?"
 * (500+, 50+, and 70 in the brief), two to "how many brands?" (200+ and 30+)
 * and two to "what reach?" (50M+ and 500M+), across the Influence section, the
 * journey board and the influencer page. A visitor who reads two sections
 * stops believing either.
 *
 * Every figure on the site now comes from here. That does not make them
 * right — it makes them one edit instead of five, and it makes the contested
 * ones greppable.
 *
 * `confirmed: false` marks a figure with more than one source. Where sources
 * disagreed the value below is the one with the strongest provenance, and the
 * alternatives are recorded beside it so nothing is quietly lost. These need
 * signing off against current reporting before launch — which is the client's
 * call, not ours, and is why they are flagged rather than reconciled.
 */

export type Figure = {
  value: string;
  label: string;
  confirmed: boolean;
  /** Where the number came from, and what else the site used to claim. */
  note?: string;
};

export const proof = {
  /** Agrees everywhere it appears, and is confirmed in the brief. */
  creatorDatabase: {
    value: "1,00,000+",
    label: "Creators in the network",
    confirmed: true,
  },

  /** From the company's own journey board. Appears once, uncontested. */
  events: {
    value: "1,500+",
    label: "Successful events",
    confirmed: true,
    note: "Journey board.",
  },

  /*
    BOTH GIVEN DIRECTLY BY GENESIS, which settles two more of this file's open
    conflicts — see `reach` below for the same thing happening to the third.

    CAMPAIGNS keeps its number and changes its verb. The journey board said
    50+, the Influence mockup 500+ and the brief 70; Genesis has confirmed 50+
    and called them DELIVERED rather than developed, which is the more useful
    word — developed describes work that was made, delivered describes work
    that shipped, and this is a list of campaigns that ran.

    BRANDS moves to 45+, which is neither of the two figures on record: the
    journey board said 30+ and the mockup 200+. That is the point of asking
    rather than splitting the difference, and it is also a sanity check the
    old number was failing — the client wall alone carries thirty marks, so
    "30+ brands collaborated" was claiming barely more than the logos on the
    same page could be counted to.
  */
  campaigns: {
    value: "50+",
    label: "Campaigns delivered",
    confirmed: true,
    note: "Given directly by Genesis, settling the 50+/500+/70 split between the journey board, the Influence mockup and the brief.",
  },

  brands: {
    value: "45+",
    label: "Brands collaborated",
    confirmed: true,
    note: "Given directly by Genesis. Supersedes the journey board's 30+ and the Influence mockup's 200+.",
  },

  /*
    SETTLED BY GENESIS, AND IT WAS THE SHARPEST CONFLICT IN THIS FILE. The
    Influence mockup said 50M+ and the brief said 500M+ — a factor of ten
    apart, so one of them was a typo and nothing in either document said
    which. That is exactly the kind of question this file exists to hold open
    rather than quietly pick a side on.

    Genesis has now given the figure directly: "500M+ views generated". Both
    halves of that are the answer — the number resolves the conflict, and
    "views" resolves what was being counted, which "content reach" left
    vague enough that a reader could have taken it as impressions,
    followers or reach in the platform sense.
  */
  reach: {
    value: "500M+",
    label: "Views generated",
    confirmed: true,
    note: "Given directly by Genesis, settling the 50M+/500M+ split between the Influence mockup and the brief.",
  },

  platforms: {
    value: "20+",
    label: "Platforms covered",
    confirmed: false,
    note: "Influence mockup only.",
  },

  creatorsActivated: {
    value: "1,000+",
    label: "Creators activated",
    confirmed: false,
    note: "Brief only; not yet shown anywhere on the site.",
  },
} as const satisfies Record<string, Figure>;

/** Everything still waiting on sign-off, for a pre-launch check. */
export function unconfirmedFigures(): Figure[] {
  return Object.values(proof).filter((figure) => !figure.confirmed);
}
