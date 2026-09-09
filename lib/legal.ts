/**
 * Privacy and Terms — INTERIM, AND SAYING SO ON THE PAGE.
 *
 * Genesis asked for temporary pages. Two things follow from "temporary" and
 * both are deliberate:
 *
 * 1. Nothing here is invented. The policy describes what the site actually
 *    does — three forms writing to a Google Sheet, Vercel Analytics, Sentry,
 *    a WhatsApp link — and stops. It names no retention period, no legal
 *    basis under a named statute and no jurisdiction, because those are
 *    decisions Genesis and their counsel make, not ones a placeholder should
 *    make for them.
 * 2. Every page carries a visible interim notice with the contact address, so
 *    a visitor is never misled about what they are reading and always has a
 *    way to ask.
 *
 * TODO(legal): replace wholesale with counsel-reviewed copy before launch.
 * Do not edit these paragraphs into the real policy — start from the real
 * one. See the same TODO in components/genesis/site-footer.tsx.
 */

export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDocument = {
  slug: string;
  title: string;
  standfirst: string;
  sections: LegalSection[];
};

/** Shown at the top of both documents, so the status is never in doubt. */
export const LEGAL_NOTICE =
  "This is an interim version, published so the site is not without a policy. It is not legal advice and it is being replaced. If anything here matters to you, write to us and we will answer directly.";

export const LEGAL_EMAIL = "hello@genesismedia.co";

export const privacy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  standfirst:
    "What Genesis Media collects when you use this site, why, and how to have it removed.",
  sections: [
    {
      heading: "What you give us",
      paragraphs: [
        "Three forms on this site collect information, and each one collects only what it asks for on screen: the enquiry form (your name, email, company, budget range and message), the creator form (your name, contact details, platforms, handles and audience size) and the careers form (your name, contact details, the position you are applying for, your portfolio or profile links and anything you write in the message field).",
        "Submissions are written to a Google Workspace spreadsheet that only Genesis Media staff can open. We use them to reply to you and to keep track of the conversation. We do not sell them and we do not pass them to anyone outside Genesis Media except the service providers named below, who process them on our behalf.",
        "If you message us on WhatsApp from the button on this site, that conversation lives in WhatsApp under Meta's terms, not ours.",
      ],
    },
    {
      heading: "What the site collects on its own",
      paragraphs: [
        "Vercel Web Analytics records page views without cookies and without building a profile of you across sites. Sentry records technical details when something on the site errors: the page, the browser and the fault, so we can fix it.",
        "Video and images on the work pages are served from Genesis Media's own Google Drive through this site, so Google receives the request as our hosting provider.",
      ],
    },
    {
      heading: "Who processes it",
      paragraphs: [
        "Vercel (hosting and analytics), Google (Workspace, Drive and Sheets) and Sentry (error monitoring). Each holds data under its own terms as our processor.",
      ],
    },
    {
      heading: "Your data, your call",
      paragraphs: [
        `Write to ${LEGAL_EMAIL} and ask to see, correct or delete what we hold about you, and we will do it. You do not need to give a reason and you will not be charged.`,
      ],
    },
  ],
};

export const terms: LegalDocument = {
  slug: "terms",
  title: "Terms of Use",
  standfirst:
    "The terms on which this website is offered. Client work is governed by its own signed agreement, not by this page.",
  sections: [
    {
      heading: "This site",
      paragraphs: [
        "genesismedia.co is Genesis Media's own marketing site. You may read it, share links to it and quote it with attribution.",
        "Nothing on it is an offer, a quote or a commitment to deliver anything. Every engagement with Genesis Media runs on a separate written agreement, and where that agreement and this page disagree, the agreement wins.",
      ],
    },
    {
      heading: "The work shown here",
      paragraphs: [
        "The films, campaigns, identities and case studies on this site are the property of Genesis Media or of the clients they were made for, and are shown here as a portfolio. Client names and logos are their owners' trade marks and appear here to identify work Genesis Media did for them. None of it may be reproduced, redistributed or used to train a model without written permission.",
      ],
    },
    {
      heading: "What you send us",
      paragraphs: [
        "When you submit a form you confirm that what you have entered is accurate and that you are entitled to share it. You keep ownership of anything you send; you give us permission to use it to assess and respond to your enquiry, application or pitch.",
      ],
    },
    {
      heading: "Accuracy and availability",
      paragraphs: [
        "We keep this site accurate but do not warrant that it is complete, current or uninterrupted, and it may change without notice. Links to other sites are for convenience; what is on them is not ours.",
      ],
    },
    {
      heading: "Getting in touch",
      paragraphs: [
        `Questions about these terms go to ${LEGAL_EMAIL}.`,
      ],
    },
  ],
};
