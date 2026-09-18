/**
 * The Privacy Policy — GENESIS'S OWN COPY, supplied on 18 September 2026.
 *
 * This replaces the interim policy written for launch. It is Genesis's text,
 * verbatim, split into its numbered sections; nothing here is paraphrased or
 * added to, and edits belong to Genesis. The "interim" notice the old page
 * carried is gone with it.
 *
 * THE TERMS PAGE IS GONE. Genesis asked for it to be removed; /terms and
 * /terms-conditions redirect here (see next.config).
 *
 * A section's `paragraphs` may hold a line break ("\n") where the copy is a
 * block of lines rather than prose — the postal address. `bullets` is the one
 * list in the document (section 3).
 */

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Prose that follows the bullets. */
  after?: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  /** "Last Updated", as the document states it. */
  updated: string;
  /** The paragraphs before the numbered sections. */
  intro: string[];
  /** A one-line summary for search results and link previews. */
  standfirst: string;
  sections: LegalSection[];
};

export const LEGAL_EMAIL = "hello@genesismedia.co";

export const privacy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  updated: "18 September 2026",
  standfirst:
    "How Genesis Events & Media Group collects, uses, stores, shares and protects personal information.",
  intro: [
    "Genesis Events & Media Group (“Genesis”, “Genesis Media”, “we”, “us”, or “our”) respects your privacy and is committed to handling personal information responsibly and transparently.",
    "This Privacy Policy explains how we collect, use, store, share, and protect personal information when you visit our website, contact us, submit an enquiry, register as a creator or talent, participate in campaigns or events, engage our services, or otherwise interact with Genesis.",
    "This policy applies to Genesis Events & Media Group and its brands, divisions, services, and business verticals, which may include Genesis Media, Genesis Influence, Genesis Studios, Genesis AI Labs, Genesis Brand & Design, Genesis EMG, and other services operated by us from time to time.",
    "By using our website or voluntarily providing information to us, you acknowledge the practices described in this Privacy Policy.",
  ],
  sections: [
    {
      heading: "1. Information We May Collect",
      paragraphs: [
        "Depending on how you interact with Genesis, we may collect personal and contact information such as your name, email address, phone number, company or organisation name, job title, city or location, social media profiles, website links, and information voluntarily submitted through our forms.",
        "For business enquiries and client relationships, we may collect company details, campaign briefs, project requirements, budgets or commercial information, billing details, communications, and other information necessary to prepare proposals or provide our services.",
        "For creators, influencers, artists, and talent, we may collect social media handles, publicly available profile information, audience and engagement information, content category, commercial rates, portfolio information, location, contact information, campaign participation details, and payment or invoicing information.",
        "For events and activations, we may collect registration details, guest information, attendance information, organisation or affiliation, and photographs or videos captured during an event where applicable.",
        "For creative, production, AI, avatar, design, video, or content-related services, you may provide photographs, videos, audio or voice recordings, brand assets, logos, scripts, creative references, and other materials required to perform the requested service.",
        "When you use our website, certain technical information may also be collected automatically, including IP address, browser and device information, operating system, pages visited, referring website, approximate location, website interactions, cookies, and analytics information.",
      ],
    },
    {
      heading: "2. How We Collect Information",
      paragraphs: [
        "We may collect information when you visit our website, complete a contact or enquiry form, request a proposal, communicate with us through email, telephone, WhatsApp or social media, register for an event, participate in a campaign, enter into a business relationship with us, or work with Genesis as a creator, influencer, artist, vendor, freelancer, partner, or client.",
        "We may also receive information from business partners, publicly available sources, social platforms, professional databases, referral partners, and service providers where permitted by applicable law.",
      ],
    },
    {
      heading: "3. How We Use Your Information",
      paragraphs: ["We may use information to:"],
      bullets: [
        "Respond to enquiries and communicate with you",
        "Prepare proposals, quotations, presentations, and commercial offers",
        "Provide our advertising, influencer marketing, content, production, social media, branding, design, event, AI, automation, and related services",
        "Identify creators, influencers, artists, or talent for campaigns",
        "Manage campaigns, projects, events, and deliverables",
        "Process transactions, invoices, and payments",
        "Provide project and customer support",
        "Manage business relationships",
        "Improve our website, services, and user experience",
        "Conduct analytics and measure website performance",
        "Send relevant business or marketing communications where permitted",
        "Protect our systems and prevent fraud or misuse",
        "Maintain necessary business records",
        "Comply with applicable legal, regulatory, accounting, tax, and contractual requirements",
      ],
      after: [
        "We seek to limit processing to information reasonably necessary for the relevant purpose.",
      ],
    },
    {
      heading: "4. AI, Avatar and Generative Content Services",
      paragraphs: [
        "Genesis may provide services involving artificial intelligence, generative AI, AI avatars, synthetic images or video, voice generation, voice cloning, automated content creation, and related technologies.",
        "Where a client or individual provides photographs, videos, voice recordings, likenesses, or other personal material for these services, the material may be processed using technology platforms and service providers necessary to deliver the requested work.",
        "We use such materials for the agreed project or purpose unless additional permission has been obtained for another use.",
        "Clients are responsible for ensuring that they possess the necessary rights, permissions, and consents for third-party photographs, voices, likenesses, footage, intellectual property, and other materials supplied to Genesis for processing.",
      ],
    },
    {
      heading: "5. Cookies and Analytics",
      paragraphs: [
        "Our website may use cookies, pixels, analytics tools, and similar technologies to enable website functionality, understand traffic, analyse visitor behaviour, improve performance, remember preferences, measure marketing effectiveness, and support advertising or remarketing activities.",
        "Some of these technologies may be provided by third-party services.",
        "Where required, visitors may manage their preferences through available cookie controls or their browser settings. Disabling certain cookies may affect website functionality.",
      ],
    },
    {
      heading: "6. Marketing Communications",
      paragraphs: [
        "Where permitted by applicable law, we may use contact information to communicate with you regarding our services, projects, campaigns, business opportunities, events, company announcements, and other relevant Genesis offerings.",
        "Where consent is required, we will seek appropriate consent.",
        `You may request to stop receiving marketing communications at any time by using an available unsubscribe mechanism or by contacting us at ${LEGAL_EMAIL}.`,
        "Opting out of marketing communications does not prevent us from sending communications necessary for an existing project, transaction, or business relationship.",
      ],
    },
    {
      heading: "7. How We Share Information",
      paragraphs: [
        "Genesis does not sell your personal information as a standalone commercial product.",
        "Where reasonably necessary, information may be shared with employees, authorised team members, clients, brands, creators, influencers, production partners, freelancers, contractors, event partners, technology providers, cloud and hosting providers, CRM platforms, analytics providers, AI technology providers, payment processors, professional advisers, or government and regulatory authorities where legally required.",
        "Third parties may process information only as necessary for the relevant service, contractual requirement, legal requirement, or legitimate business purpose.",
      ],
    },
    {
      heading: "8. Third-Party Platforms and Links",
      paragraphs: [
        "Our website may contain links to external websites, social media platforms, portfolio platforms, payment services, or other third-party services.",
        "Genesis does not control the privacy practices of these third parties. Visitors should review the applicable third-party privacy policies before providing personal information through those services.",
      ],
    },
    {
      heading: "9. Data Storage and International Processing",
      paragraphs: [
        "Genesis may use cloud, software, analytics, communications, marketing, AI, and other technology providers whose infrastructure operates in India or other countries.",
        "Accordingly, information may be processed or stored outside the jurisdiction in which it was originally collected, subject to applicable legal requirements.",
        "We take reasonable measures when selecting service providers and protecting personal information under our control.",
      ],
    },
    {
      heading: "10. Data Security",
      paragraphs: [
        "We take reasonable technical, administrative, and organisational measures designed to protect personal information against unauthorised access, misuse, loss, alteration, disclosure, or accidental destruction.",
        "However, no internet transmission, website, electronic communication, or storage system can be guaranteed to be completely secure.",
      ],
    },
    {
      heading: "11. Data Retention",
      paragraphs: [
        "We retain personal information for as long as reasonably necessary for the purpose for which it was collected, completion of projects or campaigns, maintaining business relationships, fulfilling accounting or regulatory requirements, resolving disputes, enforcing contracts, or establishing and defending legal claims.",
        "When information is no longer reasonably required, we may delete, anonymise, or securely dispose of it, subject to applicable legal requirements.",
      ],
    },
    {
      heading: "12. Your Privacy Rights",
      paragraphs: [
        "Subject to applicable law, you may have rights relating to your personal data, including the right to request information about personal data processed by us, request correction or updating of information, request deletion or erasure where applicable, withdraw consent where processing is based on consent, and raise grievances regarding the processing of your information.",
        "Where processing is based on consent, you may withdraw your consent by contacting us. Withdrawal will not affect processing that lawfully occurred before withdrawal.",
        "We may need to verify your identity before processing certain privacy-related requests.",
      ],
    },
    {
      heading: "13. Children's Privacy",
      paragraphs: [
        "Our website and services are primarily intended for businesses, professionals, creators, artists, and individuals capable of entering into lawful commercial relationships.",
        "We do not knowingly seek to collect children's personal information in circumstances where parental or guardian consent is legally required.",
        "Where a campaign, production, project, or event involves a minor, appropriate consent from a parent or lawful guardian should be obtained as required by applicable law.",
      ],
    },
    {
      heading: "14. Client and Third-Party Responsibilities",
      paragraphs: [
        "Where clients provide Genesis with customer information, databases, photographs, footage, employee information, creator information, voice recordings, or other personal data relating to third parties, the client is responsible for ensuring that the information has been collected and shared lawfully and that all necessary permissions and consents have been obtained.",
        "Genesis may rely upon the client's confirmation that it has lawful authority to provide such information for the agreed project.",
      ],
    },
    {
      heading: "15. Publicly Available Information",
      paragraphs: [
        "As part of influencer marketing, talent discovery, business development, research, or campaign planning, Genesis may review information that individuals or organisations have made publicly available, including information available through professional websites and public social-media profiles.",
        "Where such information is maintained internally, we aim to use it for relevant business, campaign, research, or professional communication purposes and in accordance with applicable law.",
      ],
    },
    {
      heading: "16. Changes to This Privacy Policy",
      paragraphs: [
        "We may update this Privacy Policy periodically to reflect changes to our services, business practices, technology, or applicable legal and regulatory requirements.",
        "Any revised Privacy Policy will be published on this page with an updated “Last Updated” date.",
      ],
    },
    {
      heading: "17. Governing Law",
      paragraphs: [
        "This Privacy Policy is governed by the applicable laws of India, including applicable data-protection and information-technology laws and regulations as they come into force and apply to our activities.",
      ],
    },
    {
      heading: "18. Contact and Privacy Grievances",
      paragraphs: [
        "For questions, requests, complaints, withdrawal of consent, correction or deletion requests, or other privacy-related concerns, please contact:",
        "Genesis Events & Media Group\n104, Plot-122/123, Sector-10\nNew Panvel East, Panvel\nMaharashtra – 410206\nIndia",
        `Email: ${LEGAL_EMAIL}`,
        "Please mention “Privacy Request” in the subject line for privacy-related enquiries.",
        "We will endeavour to review and respond to legitimate privacy requests within a reasonable period and in accordance with applicable law.",
      ],
    },
  ],
};
