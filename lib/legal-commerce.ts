/**
 * THE TERMS OF SALE — Terms & Conditions, and the Cancellation & Refund
 * Policy, for everything the site sells: memberships, one-time products,
 * shoots and AI work (Genesis, 28 Sep 2026: "write and add a
 * privacy policy and terms and conditions … for everything — products,
 * subscriptions — and make sure we take their intent while checking out").
 *
 * The terms page was removed earlier at Genesis's request; it returns here
 * because the site now takes payment, and a buyer must agree to terms before
 * paying — the checkout asks for that agreement and records it with the
 * order. Razorpay's account review also looks for both pages.
 *
 * DRAFTED BY THE WEBSITE BUILD, NOT BY A LAWYER. The commercial terms follow
 * what the site already promises (quarterly billing, the monthly stop, the
 * pause, GST, Mumbai-only shoots, the one-time products); everything
 * else is standard practice for an Indian creative agency. TODO(genesis):
 * have your lawyer review both documents before the Razorpay keys go live.
 * The version date is what the checkout records — change `TERMS_VERSION`
 * whenever either document changes.
 */

import { LEGAL_EMAIL, type LegalDocument } from "./legal";

export const TERMS_VERSION = "29 September 2026";

/* The legal entity and the name it trades under — both named on every policy (Genesis, 29 Sep 2026). */
const ENTITY = "Genesis Events and Media Group";
const BRAND = "Genesis Media";
const REGISTERED = "004, Sankalp Siddhi\nNew Panvel (E), Navi Mumbai\nMaharashtra – 410206\nIndia";

export const terms: LegalDocument = {
  slug: "terms",
  title: "Terms & Conditions",
  updated: TERMS_VERSION,
  standfirst:
    "The terms on which Genesis Events and Media Group (Genesis Media) sells memberships, one-time products, shoots and AI content through genesismedia.co.",
  intro: [
    `These Terms & Conditions (“Terms”) govern every purchase made through genesismedia.co and every service ${ENTITY}, operating as ${BRAND} (“Genesis”, “Genesis Media”, “we”, “us”, “our”), provides under it — memberships (subscriptions), one-time products, content shoots and AI content — across Genesis AI Labs, Genesis Studios, Genesis Brand & Design, Genesis Influence and our other divisions.`,
    "By ticking the agreement box at checkout, paying a Genesis payment link, or accepting a proposal or quotation that refers to these Terms, you (“Client”, “you”) agree to them on behalf of yourself and the business you name at checkout, and confirm you are authorised to do so.",
    "Where a signed agreement, statement of work or written quotation exists between you and Genesis, it prevails over these Terms to the extent they differ.",
  ],
  sections: [
    {
      heading: "1. What We Sell",
      paragraphs: [
        "Memberships are recurring plans (for example Starter, Growth and Enterprise) that give you a monthly content capacity, worked through as a queue of requests. One-time products are single purchases with a fixed scope and price — for example Build Your AI Avatar, a Half-Day Content Shoot, a Logo Refresh or a UGC Starter Pack. Influencer Campaign Management is priced as an agency commission plus creator fees, agreed after a call, and is not bought through the cart.",
        "Items shown “From”, “On request”, “Custom” or “At actual” are not sold at a fixed price. Adding them to the cart is a request for a quotation; the work begins only once you accept the written quotation and pay the amount it states.",
        "What each plan and product includes is described on its card and under “What’s included”. Anything not listed there is outside its scope and can be bought as another product or quoted separately.",
      ],
    },
    {
      heading: "2. Orders, Prices and Taxes",
      paragraphs: [
        "Prices on the website are in Indian Rupees (INR) and exclusive of taxes unless stated. For Clients in India, GST at the applicable rate (currently 18%) is added at checkout and shown on your invoice with your GSTIN, if provided. For Clients outside India, services are billed as an export of services and Indian GST is not charged; any taxes, duties or withholding due in your own country are your responsibility.",
        "An order is confirmed when payment is received in full. We may decline or cancel an order — and refund anything paid — if the details provided are incomplete or incorrect, the service is not available in your location, or the order would breach these Terms or the law.",
        "Discounts shown at checkout (for example the bundle saving or the AI + Studios combo) apply only to the order and billing period they were calculated for, cannot be combined unless the checkout combines them, and end if the conditions for them stop being met — for example, if one of the two memberships in a combo is cancelled.",
        "Payments are processed by Razorpay. Genesis does not see or store your full card, UPI or bank details. International payments may carry bank or currency-conversion charges, which are borne by you.",
      ],
    },
    {
      heading: "3. Memberships (Subscriptions)",
      paragraphs: [
        "Billing. Memberships are billed quarterly (three months paid upfront) or monthly (billed month to month at the monthly rate, which is higher than the quarterly rate). Your billing period starts on the date of your onboarding call or the date payment is received, whichever is later.",
        "Renewal. Unless you have enrolled in automatic payments, each new billing period is invoiced to you before it begins, and your membership continues when that invoice is paid. If a renewal is not paid by its due date, work pauses until it is.",
        "Stopping. A monthly membership can be stopped at any time before the next billing cycle, by writing to us; it then ends at the end of the period already paid for. A quarterly membership can be stopped before the next quarter begins; the quarter already paid for is not refundable except as set out in our Cancellation & Refund Policy.",
        "Pausing. Where available for your plan, a membership may be paused once per quarter for up to 30 days by giving us at least 7 days’ written notice. The paused days are added to the end of your billing period.",
        "Changing plans. You may upgrade at any time; the higher plan applies from the next billing period, or immediately if you pay the difference for the current period. Downgrades apply from the next billing period. One membership per package can be active at a time.",
        "Capacity and the queue. Your plan’s monthly output (videos, creatives, shoots, adaptations and so on) and its number of active requests set how much we work on and how fast. You may add as many requests to your queue as you like; we work through them in the order you set. Monthly capacity does not roll over to later months unless we agree in writing.",
        "Turnaround and revisions. Turnaround times on the website are typical times from a complete brief, not guarantees, and depend on approvals and complexity. Each deliverable includes the revision rounds stated for its plan or product; further revisions, or changes to an approved brief, may count as a new request.",
      ],
    },
    {
      heading: "4. One-Time Products",
      paragraphs: [
        "One-time products are delivered once, to the scope listed under “Includes” on the website, and to the turnaround we confirm after your brief. They are not subscriptions and do not renew.",
        "Revisions are those listed for the product (for example “1 revision per video” or “2 revision rounds”). Products that use your own footage or materials (for example the Reel Editing Pack) depend on you supplying them in usable form.",
        "UGC packs are produced for your own channels and paid social; they do not include posting by influencers. Creator fees for Influencer Campaign Management are separate and agreed per campaign.",
      ],
    },
    {
      heading: "5. Content Shoots",
      paragraphs: [
        "Studios memberships and any product that requires a physical shoot by a Genesis crew (the Founder / CEO Video Shoot, Half-Day Content Shoot and Event Content Coverage) are currently available for shoots in Mumbai (including Navi Mumbai and Thane) only. The checkout will not accept them for another location.",
        "Shoot dates are confirmed after pre-production and are subject to crew availability. Rescheduling requested at least 72 hours before the shoot is free once; later changes are treated under our Cancellation & Refund Policy.",
        "Talent, creators, paid locations, studios, hair and makeup, props and set builds are not included unless listed under a product’s “Includes”; where you ask for them, they are charged at actual cost plus any coordination fee we quote, and are payable before the shoot. You are responsible for permissions to shoot at premises you provide, and for the conduct and releases of any people you bring to the shoot.",
        "If a shoot cannot proceed because of weather, a government order, a venue withdrawal or another event outside our reasonable control, we will reschedule it at no additional Genesis fee; third-party costs already incurred may still be payable.",
      ],
    },
    {
      heading: "6. AI Content, Avatars and Voice",
      paragraphs: [
        "When you ask us to create an AI avatar, persona, voice clone or lip-synced content of a real person, you confirm that you have that person’s written consent to create and use their likeness and voice for the stated purpose, and you will provide that consent to us on request. We will not create AI content of a real person without it.",
        "We will not create AI content that impersonates a person without consent, misleads viewers about a real person’s words or actions, infringes someone’s rights, or breaks the law or a platform’s rules. We may refuse or stop any request that we reasonably believe does.",
        "You are responsible for how AI content is published, including any disclosure that content is AI-generated where the law or a platform requires it.",
        "AI tools can produce imperfect or unexpected results. We review everything before delivery, but you should check deliverables — particularly claims about products, health, finance or law — before publishing them.",
      ],
    },
    {
      heading: "7. Your Materials and Responsibilities",
      paragraphs: [
        "You are responsible for the briefs, brand assets, footage, product information, claims, music and other materials you give us, and confirm you have the rights to let us use them for your work. You are responsible for the accuracy and legality of claims in your content, including regulated claims in financial services, insurance, health and similar categories.",
        "Timely feedback and approvals are part of the service. If a request waits for your input for more than 14 days, we may move to the next request in your queue.",
      ],
    },
    {
      heading: "8. Ownership and Use of the Work",
      paragraphs: [
        "When your order or billing period is paid in full, you own the final deliverables we make for you and may use them for any lawful purpose. Until then, you may use them for review only.",
        "Genesis keeps ownership of its pre-existing materials, templates, tools, workflows, prompts, AI models and know-how, and of raw footage, project files and working files unless we agree in writing to hand them over. Stock footage, music, fonts and other licensed third-party assets are used under their own licences, which may limit their use.",
        "Unless you ask us not to in writing, or our agreement says otherwise, we may show the work in our portfolio, case studies and credentials once it has been published.",
      ],
    },
    {
      heading: "9. Confidentiality",
      paragraphs: [
        "Each of us will keep the other’s non-public business information confidential and use it only for the work. This does not cover information that is public, already known, independently developed, or required to be disclosed by law.",
      ],
    },
    {
      heading: "10. Liability",
      paragraphs: [
        "Genesis’s total liability for any claim arising from an order or membership is limited to the amount you paid for that order, or for the membership in the three months before the claim arose. Neither of us is liable for indirect or consequential losses, lost profits, or lost opportunities.",
        "Nothing in these Terms limits liability that cannot be limited under applicable law.",
      ],
    },
    {
      heading: "11. Suspension and Termination",
      paragraphs: [
        "We may suspend work if an invoice is unpaid, or suspend or end a membership if these Terms are seriously breached — including a request covered by section 6 — after telling you and, where the breach can be fixed, giving you 7 days to fix it. Either of us may end a membership as set out in section 3.",
      ],
    },
    {
      heading: "12. Governing Law and Disputes",
      paragraphs: [
        "These Terms are governed by the laws of India. We will first try to resolve any dispute by good-faith discussion. If it is not resolved within 30 days, the courts at Mumbai, Maharashtra have exclusive jurisdiction.",
      ],
    },
    {
      heading: "13. Changes to These Terms",
      paragraphs: [
        "We may update these Terms from time to time. The version you accepted at checkout applies to that order and its billing period; changes apply to renewals after we have notified you of them.",
      ],
    },
    {
      heading: "14. Contact",
      paragraphs: [`${ENTITY} (${BRAND})\n${REGISTERED}`, `Email: ${LEGAL_EMAIL}`],
    },
  ],
};

export const refunds: LegalDocument = {
  slug: "refund-policy",
  title: "Cancellation & Refund Policy",
  updated: TERMS_VERSION,
  standfirst: "When Genesis Media memberships, products and shoots can be cancelled, and what is refunded.",
  intro: [
    `This policy explains how cancellations and refunds work for purchases from ${ENTITY}, operating as ${BRAND} (“Genesis”, “Genesis Media”), through genesismedia.co. It forms part of our Terms & Conditions.`,
    "To cancel or request a refund, email " + LEGAL_EMAIL + " from the email address used at checkout, with your order reference. We confirm every request in writing.",
  ],
  sections: [
    {
      heading: "1. Before Work Begins",
      paragraphs: [
        "If you cancel within 48 hours of payment, and before your onboarding call or the start of any work, we refund the full amount paid, less any non-refundable payment-gateway charges.",
      ],
    },
    {
      heading: "2. Memberships",
      paragraphs: [
        "Monthly memberships can be stopped at any time before the next billing cycle; no further payment is taken and the membership ends at the end of the month already paid for. The current month is not refunded once work has begun.",
        "Quarterly memberships are paid three months upfront at a discounted rate. Stopping one ends it at the end of the current quarter. The quarter already paid for is not refunded once work has begun, except under section 5.",
        "Unused monthly capacity (for example videos or creatives not requested in a month) is not refunded or credited.",
      ],
    },
    {
      heading: "3. One-Time Products",
      paragraphs: [
        "One-time products can be cancelled for a full refund until we have accepted your brief and begun work. After that, they are not refundable, because the work is made to order for you.",
        "Quoted items follow the cancellation terms in their quotation.",
      ],
    },
    {
      heading: "4. Content Shoots",
      paragraphs: ["For shoot products (Founder / CEO Video Shoot, Half-Day Content Shoot, Event Content Coverage) and shoots included in a membership:"],
      bullets: [
        "Cancelled 7 days or more before the shoot date: full refund of the Genesis fee.",
        "Cancelled 3 to 7 days before: 50% of the Genesis fee is refunded.",
        "Cancelled less than 72 hours before, or a no-show: not refundable.",
        "Third-party costs already committed — talent, locations, studios, hair and makeup, props and set builds — are not refundable once booked.",
      ],
      after: ["A shoot rescheduled at least 72 hours in advance is not a cancellation; see our Terms & Conditions."],
    },
    {
      heading: "5. If We Cannot Deliver",
      paragraphs: [
        "If Genesis cannot deliver a paid product, or cannot provide a membership’s capacity for reasons within our control, we refund the undelivered part of what you paid, calculated pro rata, or — if you prefer — credit it to a future billing period.",
      ],
    },
    {
      heading: "6. How Refunds Are Paid",
      paragraphs: [
        "Approved refunds are made to the original payment method through Razorpay within 7 working days of approval. Your bank or card issuer may take a further 5–10 working days to show it. Refunds are made in INR; any currency-conversion difference is not covered.",
        "Discounts are recalculated on a partial refund: if cancelling one item removes a bundle saving or the AI + Studios combo, the refund is reduced by the discount that no longer applies.",
      ],
    },
    {
      heading: "7. Delivery",
      paragraphs: [
        "All Genesis deliverables are digital. They are delivered by download link, shared drive or the platform agreed with you; nothing is shipped physically. Delivery times are those confirmed for your plan, product or brief.",
      ],
    },
    {
      heading: "8. Contact",
      paragraphs: [`${ENTITY} (${BRAND})\n${REGISTERED}`, `Email: ${LEGAL_EMAIL}`],
    },
  ],
};
