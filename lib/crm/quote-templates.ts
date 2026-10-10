import { products } from "@/lib/products";
import { aiPlans } from "@/lib/verticals/ai-labs";
import { designProducts } from "@/lib/verticals/brand-design";
import { studiosPlans } from "@/lib/verticals/studios";
import type { VerticalKey } from "@/lib/verticals/types";

import type { Division } from "@/lib/generated/prisma/enums";

/**
 * THE QUOTE'S STANDARD PARTS — the company block, the catalogue to pick from
 * (Genesis's own plans, products and their add-ons, at their real prices),
 * and the terms, modelled on Genesis's Price Quote #0000039 (6 Oct 2026).
 *
 * Everything here is a starting point: every line, note and term can be
 * changed on the quote itself.
 */

/** As printed on Genesis's quotes. */
export const COMPANY = {
  name: "Genesis Events and Media Group",
  lines: ["Sankalp Siddhi CHS Ltd.", "Sector-10, plot-122/123", "New Panvel, Maharashtra 410206", "India"],
  email: "hello@genesismedia.co",
  phone: "9653454848",
  deck: "https://canva.link/nhqmxnwzzdfpbyy",
};

const DIVISION_OF: Record<VerticalKey, Division> = { "ai-labs": "AI_LAB", studios: "STUDIOS", "brand-design": "BRAND_DESIGN", influence: "INFLUENCE" };

export type CatalogLine = {
  id: string;
  kind: "plan" | "product" | "addon";
  group: string;
  division: Division;
  title: string;
  subtitle?: string;
  details: string;
  note?: string;
  /** Rupees. */
  price: number;
};

/** "₹14,999/- per avatar" → 14999; "quoted separately" → null. */
function priceOf(text: string): number | null {
  const m = /₹\s?([\d,]+)/.exec(text);
  return m ? Number(m[1]!.replace(/,/g, "")) : null;
}

const plans: CatalogLine[] = [
  ...aiPlans.plans.map((p) => ({
    id: `plan.ai.${p.name}`,
    kind: "plan" as const,
    group: "AI Content Studio plans",
    division: "AI_LAB" as const,
    title: `AI Content Studio · ${p.name}`,
    subtitle: `Monthly plan${p.contactOnly ? " (custom)" : ""}`,
    details: p.features.join("\n"),
    note: p.description,
    price: p.rate - 1,
  })),
  ...studiosPlans.plans.map((p) => ({
    id: `plan.studios.${p.name}`,
    kind: "plan" as const,
    group: "Studios Content Monthly plans",
    division: "STUDIOS" as const,
    title: `Content Monthly · ${p.name}`,
    subtitle: p.tagline ?? "Monthly plan",
    details: p.features.join("\n"),
    note: p.description,
    price: p.rate - 1,
  })),
  {
    id: "plan.design.desk",
    kind: "plan",
    group: "Brand & Design plans",
    division: "BRAND_DESIGN",
    title: `Genesis Creative Desk · ${designProducts.desk.name}`,
    subtitle: "Monthly design subscription",
    details: designProducts.desk.highlights.map((h) => `${h.label}: ${h.value}`).join("\n"),
    note: designProducts.desk.body,
    price: designProducts.desk.rate - 1,
  },
];

const oneTime: CatalogLine[] = products.map((p) => ({
  id: `product.${p.vertical}.${p.index}`,
  kind: "product",
  group: `${{ "ai-labs": "AI Lab", studios: "Studios", "brand-design": "Brand & Design", influence: "Influence" }[p.vertical]} products`,
  division: DIVISION_OF[p.vertical],
  title: p.name,
  subtitle: p.pitch.split(/(?<=\.)\s/)[0],
  details: p.includes.join("\n"),
  note: p.note?.split("\n\n")[0],
  price: p.price ?? 0,
}));

const addOns: CatalogLine[] = products.flatMap((p) =>
  (p.addOns ?? []).flatMap((a, i) => {
    const [label] = a.split(/:\s+/);
    const price = priceOf(a);
    return price === null
      ? []
      : [{ id: `addon.${p.vertical}.${p.index}.${i}`, kind: "addon" as const, group: `Add-ons · ${p.name}`, division: DIVISION_OF[p.vertical], title: label!, subtitle: `Add-on to ${p.name}`, details: "", price }];
  }),
);

/** Everything the quote builder can add in one click, grouped. */
export const CATALOG: readonly CatalogLine[] = [...plans, ...oneTime, ...addOns];

// --- Terms --------------------------------------------------------------------------

const COMMON_HEAD = [
  "The above quoted amount is exclusive of GST.",
  "100% advance payment is required before production begins, unless otherwise agreed in writing.",
];
const COMMON_TAIL = [
  "Turnaround begins after receipt of all required products, brand assets, approvals and information.",
  "Any delay in approvals, product delivery, location access or client feedback may impact the final delivery timeline.",
  "Cancellation or postponement after booking or production confirmation may attract cancellation/rescheduling charges based on costs already committed.",
  "Genesis Media's Website Terms and Cancellation & Refund Policy apply (genesismedia.co/terms).",
];

export type TermsTemplate = { key: string; label: string; division: Division | null; notes: string; terms: string[] };

export const TERMS: readonly TermsTemplate[] = [
  {
    key: "production-ugc",
    label: "Production & UGC (as Quote #0000039)",
    division: "INFLUENCE",
    notes: [
      "Shoot Location: Mumbai / Client-approved location",
      "Call Time: To be finalised post-shoot confirmation.",
      "Final creator confirmation and commercials will be locked post client intent and shortlisting.",
      "Products, access, and shoot location requirements must be arranged/confirmed before the shoot date.",
      "Any creator posting, collaboration, or extended paid-media usage outside the quoted scope will be charged separately.",
      `Corporate Deck: ${COMPANY.deck}`,
    ].join("\n"),
    terms: [
      "The above quoted amount is exclusive of GST.",
      "The quotation covers the scope and number of UGC videos specifically mentioned in the proposal.",
      "Final creator selection, commercials and availability will be confirmed only after client intent and final shortlisting.",
      "The professional shoot includes one confirmed production schedule as mentioned in the quotation.",
      "Shoot date, location and call time will be mutually finalised after creator and product confirmation.",
      "Products and all required brand/product information must be received before the agreed production date.",
      "One consolidated revision round per final video is included unless otherwise mentioned in the quotation.",
      "Once the script/concept is approved and production has started, major changes to the brief, script, product or creative direction may be charged additionally.",
      "Any reshoot required due to a change in the approved brief, script, product, location or client-side requirement will be billed separately.",
      "Reshoots required due to production-side technical issues will be handled by Genesis Media at no additional production charge.",
      "Additional shoot days, specialised equipment, studio/location rental, travel, props or production requirements outside the quoted scope will be charged separately.",
      "Creator posting/collaboration is not included unless specifically mentioned in the quotation.",
      "Extended digital advertising, whitelisting, paid-media or usage rights are subject to the selected creator's commercial and will be quoted separately where applicable.",
      "Turnaround begins after completion of the shoot and receipt of all required products, brand assets, approvals and information.",
      "Any delay in creator approval, product delivery, location access or client feedback may impact the final delivery timeline.",
      "Cancellation or postponement after creator booking or production confirmation may attract cancellation/rescheduling charges based on costs already committed.",
    ],
  },
  {
    key: "influencer",
    label: "Influencer campaign",
    division: "INFLUENCE",
    notes: [
      "Creator list, deliverables and fees as below; final availability is confirmed at booking.",
      "Posting dates to be mutually finalised after content approval.",
      `Corporate Deck: ${COMPANY.deck}`,
    ].join("\n"),
    terms: [
      ...COMMON_HEAD,
      "Creator fees are as quoted per creator and are confirmed only once the plan is approved and the creator is booked.",
      "If a creator becomes unavailable, Genesis will propose a replacement of comparable reach and category fit.",
      "Each creator's content is shared for one consolidated round of client feedback before posting.",
      "Paid-media usage, whitelisting, boosting and usage rights beyond organic posting are subject to each creator's commercial and quoted separately.",
      "Reported reach and views are as published by the platforms; Genesis does not guarantee specific performance.",
      ...COMMON_TAIL,
    ],
  },
  {
    key: "ai",
    label: "AI content & avatars",
    division: "AI_LAB",
    notes: "AI production follows the approval workflow: script lock → first cut (image draft with music) → AI video generation → final delivery.",
    terms: [
      ...COMMON_HEAD,
      "Written consent is required for any real person whose likeness or voice is cloned.",
      "Script/brief approval locks the scope. The first cut covers AI images/keyframes and the video timeline with music; video generation starts only after those visuals are approved.",
      "One consolidated revision round per included video is allowed at the first cut. The final cut is delivered in 1080p.",
      "Post-final edit-only changes: ₹5,499 + GST per video. Fresh AI video regeneration: ₹999 + GST per 5–10 sec generated clip. New scripts/concepts, added duration or scope changes are quoted separately.",
      "AI output may vary by generation and source quality. Raw models, prompts and working files are not included unless agreed in writing.",
      ...COMMON_TAIL,
    ],
  },
  {
    key: "studios",
    label: "Studios shoot & edit",
    division: "STUDIOS",
    notes: "Shoot Location: Mumbai / Client-approved location\nCall Time: To be finalised after confirmation.",
    terms: [
      ...COMMON_HEAD,
      "The quotation covers the shoot days, crew and deliverables specifically mentioned.",
      "One consolidated revision round per final video is included unless otherwise mentioned.",
      "Reshoots due to changes in the approved brief, script, talent, product or location are billed separately; reshoots due to production-side technical issues are handled by Genesis at no additional production charge.",
      "Additional shoot days, specialised equipment, studio/location rental, travel or props outside the quoted scope are charged separately.",
      "Raw footage and project files are not included unless agreed in writing.",
      ...COMMON_TAIL,
    ],
  },
  {
    key: "design",
    label: "Brand & design",
    division: "BRAND_DESIGN",
    notes: "Final files are delivered in the formats listed once the final design is approved.",
    terms: [
      ...COMMON_HEAD,
      "The quotation covers the deliverables and concept routes specifically mentioned.",
      "Revision rounds are as listed per deliverable; further rounds or new concept routes are charged separately.",
      "Ownership of the final approved artwork passes to the client on full payment. Fonts, stock and third-party licences are the client's to hold.",
      ...COMMON_TAIL,
    ],
  },
];

export const termsByKey = (key: string | null | undefined) => TERMS.find((t) => t.key === key);
export const termsFor = (division: Division | null | undefined) => TERMS.find((t) => t.division === division && t.key !== "influencer") ?? TERMS[0]!;

// --- Totals -------------------------------------------------------------------------

export type QuoteMath = { lines: { qty: number; unitPaise: number }[]; creatorFees: (number | null)[]; discountPaise: number; addGst: boolean; gstPercent: number };

/** Subtotal of every line and creator fee, less the discount, plus GST when it's added on top. */
export function quoteTotals(q: QuoteMath) {
  const lines = q.lines.reduce((s, l) => s + l.qty * l.unitPaise, 0);
  const creators = q.creatorFees.reduce<number>((s, f) => s + (f ?? 0), 0);
  const subtotal = lines + creators;
  const taxable = Math.max(0, subtotal - q.discountPaise);
  const tax = q.addGst ? Math.round((taxable * q.gstPercent) / 100) : 0;
  return { subtotal, creators, discount: Math.min(q.discountPaise, subtotal), tax, total: taxable + tax };
}

export const quoteRef = (number: number) => `#${String(number).padStart(7, "0")}`;
