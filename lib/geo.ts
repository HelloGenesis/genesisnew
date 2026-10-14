import { CRM_PLAN_PRICES, crmCycleCharge, crmPerMonth } from "@/lib/crm-plans";
import { caseStudyPages } from "@/lib/case-study-pages";
import { footerCta } from "@/lib/home-content";
import { monthlyListFigure } from "@/lib/money";
import { verticalCards } from "@/lib/pricing";
import { products } from "@/lib/products";
import { absoluteUrl, ORGANIZATION_ID, SITE_URL, type JsonLdNode } from "@/lib/seo";
import { servicePages } from "@/lib/services";
import { siteConfig } from "@/lib/site-config";
import { aiPlans } from "@/lib/verticals/ai-labs";
import { campaignPricing } from "@/lib/verticals/influence";
import { studiosPlans } from "@/lib/verticals/studios";
import type { Plan, VerticalKey } from "@/lib/verticals/types";

/**
 * GEO: BEING THE ANSWER IN AI SEARCH (Genesis, 14 Oct 2026: "fix GEO for
 * this, every vertical, every page, and other platforms").
 *
 * ChatGPT, Perplexity, Gemini, Copilot, Claude and Google's AI Overviews
 * quote what they can read plainly: prices as numbers, questions with their
 * answers, and a short summary of who does what. So, from the same data the
 * pages are built from (never a second copy that can drift):
 *   - every plan and product as an Offer with its price in rupees;
 *   - the CRM as a SoftwareApplication with its three plans;
 *   - FAQPage data for any list of questions on a page;
 *   - /llms.txt and /llms-full.txt, the site in plain Markdown for AI readers.
 */

/** A list of questions as FAQPage data — the same words the reader sees. */
export function faqJsonLd(items: readonly (readonly [string, string])[], path: string): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/* Prices are shown ₹1 off the list figure (lib/money); the schema says what a buyer pays. */
const shown = (listFigure: number) => listFigure - 1;

/** The monthly plans a vertical sells, as they appear on its page. */
function plansFor(vertical: VerticalKey): Plan[] {
  if (vertical === "ai-labs") return aiPlans.plans;
  if (vertical === "studios") return studiosPlans.plans;
  return [];
}

function planOffer(plan: Plan, url: string, category: string): JsonLdNode {
  return {
    "@type": "Offer",
    name: `${category}: ${plan.name}`,
    description: plan.description,
    url,
    priceCurrency: "INR",
    ...(plan.contactOnly
      ? {}
      : {
          price: shown(plan.rate),
          priceSpecification: [
            { "@type": "UnitPriceSpecification", price: shown(plan.rate), priceCurrency: "INR", unitCode: "MON", billingDuration: "P3M", name: "Per month, billed quarterly", valueAddedTaxIncluded: false },
            { "@type": "UnitPriceSpecification", price: shown(monthlyListFigure(plan.rate)), priceCurrency: "INR", unitCode: "MON", name: "Per month, billed monthly", valueAddedTaxIncluded: false },
          ],
        }),
    availability: "https://schema.org/InStock",
    seller: { "@id": ORGANIZATION_ID },
    itemOffered: { "@type": "Service", name: `${category} ${plan.name}`, provider: { "@id": ORGANIZATION_ID } },
  };
}

function productOffer(p: (typeof products)[number], url: string): JsonLdNode {
  return {
    "@type": "Offer",
    name: p.name,
    description: p.pitch,
    url,
    priceCurrency: "INR",
    ...(p.price ? { price: p.price, priceSpecification: { "@type": "PriceSpecification", price: p.price, priceCurrency: "INR", valueAddedTaxIncluded: false } } : {}),
    availability: "https://schema.org/InStock",
    seller: { "@id": ORGANIZATION_ID },
    itemOffered: { "@type": "Service", name: p.name, description: p.pitch, provider: { "@id": ORGANIZATION_ID } },
  };
}

/** Everything a vertical sells, priced: its monthly plans, then its one-time products. */
export function verticalOffers(vertical: VerticalKey): JsonLdNode[] {
  const card = verticalCards.find((c) => c.key === vertical)!;
  const url = absoluteUrl(card.href);
  const offers = [
    ...plansFor(vertical).map((plan) => planOffer(plan, url, card.name)),
    ...products.filter((p) => p.vertical === vertical).map((p) => productOffer(p, url)),
  ];
  if (vertical === "brand-design") {
    offers.unshift(planOffer({ name: "Creative Desk · Always-On", description: "A monthly design subscription: social creatives, ads, campaigns, presentations and collateral.", rate: 65000, features: [], cta: { label: "", href: "" } }, url, card.name));
  }
  if (vertical === "influence") {
    offers.unshift({
      "@type": "Offer",
      name: `${card.name}: influencer & UGC campaign management`,
      description: `${campaignPricing.figure} agency commission ${campaignPricing.figureSub}. ${campaignPricing.includes} ${campaignPricing.example}`,
      url,
      priceCurrency: "INR",
      seller: { "@id": ORGANIZATION_ID },
      itemOffered: { "@type": "Service", name: "Influencer marketing campaign management", provider: { "@id": ORGANIZATION_ID } },
    });
  }
  return offers;
}

/** The /pricing page: every vertical's plans and products in one catalogue. */
export function pricingCatalogJsonLd(): JsonLdNode {
  return {
    "@type": "OfferCatalog",
    "@id": `${absoluteUrl("/pricing")}#catalog`,
    name: "Genesis Media pricing: subscriptions and pay-per-project",
    url: absoluteUrl("/pricing"),
    provider: { "@id": ORGANIZATION_ID },
    itemListElement: verticalCards.map((card) => ({
      "@type": "OfferCatalog",
      name: card.name,
      description: `${card.blurb} ${card.fromLabel} ${card.from}.`,
      url: absoluteUrl(card.href),
      itemListElement: verticalOffers(card.key),
    })),
  };
}

/** Genesis CRM, the product on /resellers, with its three plans monthly and annual. */
export function crmSoftwareJsonLd(): JsonLdNode {
  const url = absoluteUrl("/resellers");
  return {
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: "Genesis CRM",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "CRM for marketing, influencer and creative agencies",
    operatingSystem: "Web browser",
    url,
    description:
      "The CRM Genesis Media runs on: leads and pipeline, an influencer database, proposals, quotes and influencer plans, GST invoices, a client portal and an AI inbox that turns briefs in Gmail and Drive into leads. For agencies, brands and partner agencies in India.",
    publisher: { "@id": ORGANIZATION_ID },
    provider: { "@id": ORGANIZATION_ID },
    inLanguage: "en-IN",
    featureList: [...new Set(CRM_PLAN_PRICES.flatMap((p) => p.features.filter((f) => !f.startsWith("Everything in"))))],
    offers: CRM_PLAN_PRICES.flatMap((p) => [
      { "@type": "Offer", name: `${p.key} (annual)`, description: `${p.blurb} ${crmPerMonth(p, "annual")} rupees a month, billed yearly.`, price: crmCycleCharge(p, "annual"), priceCurrency: "INR", priceSpecification: { "@type": "UnitPriceSpecification", price: crmCycleCharge(p, "annual"), priceCurrency: "INR", unitCode: "ANN", valueAddedTaxIncluded: false }, url, seller: { "@id": ORGANIZATION_ID } },
      { "@type": "Offer", name: `${p.key} (monthly)`, description: `${p.blurb} Billed monthly.`, price: crmPerMonth(p, "monthly"), priceCurrency: "INR", priceSpecification: { "@type": "UnitPriceSpecification", price: crmPerMonth(p, "monthly"), priceCurrency: "INR", unitCode: "MON", valueAddedTaxIncluded: false }, url, seller: { "@id": ORGANIZATION_ID } },
    ]),
  };
}

/* ------------------------------------------------------------------ */
/* /llms.txt — the site for AI readers (https://llmstxt.org).          */
/* ------------------------------------------------------------------ */

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function offerLines(vertical: VerticalKey): string[] {
  const plans = plansFor(vertical).map((p) => `- ${p.name} plan: ${p.contactOnly ? "custom pricing (talk to Genesis)" : `${rupees(shown(p.rate))} a month billed quarterly, or ${rupees(shown(monthlyListFigure(p.rate)))} billed monthly`}. ${p.description}`);
  const one = products.filter((p) => p.vertical === vertical).map((p) => `- ${p.name} (one-time): ${p.price ? rupees(p.price) : (p.priceLabel ?? "quoted")}. ${p.pitch}`);
  return [...plans, ...one];
}

/**
 * The short version: who Genesis is, what each division does and costs, and
 * links to every page. `full` adds every FAQ and every case study.
 */
export function llmsText(full = false): string {
  const out: string[] = [];
  out.push(`# ${siteConfig.name}`, "");
  out.push(`> ${siteConfig.description} Based in ${siteConfig.address.locality}, India; working with brands across India. Legal name: ${siteConfig.legalName}.`, "");
  out.push(`Contact: ${footerCta.email} · WhatsApp ${siteConfig.whatsapp} · ${SITE_URL}`, "");
  out.push("Genesis Media has four divisions (verticals) and a software product, Genesis CRM. Prices are in Indian rupees and exclude 18% GST.", "");

  out.push("## Divisions");
  for (const card of verticalCards) {
    const page = servicePages.find((s) => `/${s.slug}` === card.href);
    out.push(`- [${card.name}](${absoluteUrl(card.href)}): ${page?.seo.description ?? card.blurb} ${card.fromLabel} ${card.from}.`);
  }
  out.push("");

  for (const card of verticalCards) {
    const page = servicePages.find((s) => `/${s.slug}` === card.href);
    out.push(`## ${card.name}`, "");
    if (page) out.push(page.intro, "");
    if (card.key === "influence") out.push(`- Campaign management: ${campaignPricing.figure} agency commission ${campaignPricing.figureSub}. ${campaignPricing.includes} ${campaignPricing.example}`);
    if (card.key === "brand-design") out.push(`- Creative Desk · Always-On subscription: ${rupees(shown(65000))} a month. Social creatives, ads, campaigns, presentations and collateral.`);
    out.push(...offerLines(card.key), "");
    if (full && page?.faqs.length) {
      out.push(`### ${card.name}: questions`, "");
      for (const f of page.faqs) out.push(`**${f.question}**`, f.answer, "");
    }
  }

  out.push("## Genesis CRM", "");
  out.push(`A CRM for marketing, influencer and creative agencies, the one Genesis runs on: leads and pipeline, an influencer database (Excel and Google Sheets import), proposals, quotes and influencer plans as a link, PDF, Excel or Google Sheet, GST invoices, a client portal and an AI inbox that turns briefs in Gmail and Drive into leads. Resellers earn 20% of every payment from agencies they bring, for 12 months. [Plans and demo](${absoluteUrl("/resellers")})`, "");
  for (const p of CRM_PLAN_PRICES) out.push(`- ${p.key}: ${rupees(crmPerMonth(p, "annual"))} a month billed yearly (${rupees(crmCycleCharge(p, "annual"))} a year), or ${rupees(crmPerMonth(p, "monthly"))} billed monthly. ${p.blurb} ${p.features.join("; ")}.`);
  out.push("");

  out.push("## Pages");
  out.push(`- [Home](${absoluteUrl("/")})`);
  out.push(`- [Pricing & subscriptions](${absoluteUrl("/pricing")}): every plan and one-time product.`);
  out.push(`- [Case studies](${absoluteUrl("/case-studies")}): campaigns and films for Indian brands.`);
  out.push(`- [Genesis CRM for agencies & resellers](${absoluteUrl("/resellers")})`);
  out.push(`- [For creators](${absoluteUrl("/creator")}): creators who want brand work with Genesis.`);
  out.push(`- [Careers](${absoluteUrl("/careers")})`);
  out.push(`- [Terms](${absoluteUrl("/terms")}) · [Privacy](${absoluteUrl("/privacy")}) · [Refunds](${absoluteUrl("/refund-policy")})`, "");

  out.push("## Case studies");
  for (const c of caseStudyPages) out.push(`- [${c.copy.campaign} for ${c.copy.brand}](${absoluteUrl(c.path)})${full ? `: ${c.seo.description}` : ""}`);
  out.push("");

  if (!full) out.push("## Optional", `- [Everything above in full, with every FAQ](${absoluteUrl("/llms-full.txt")})`, "");
  return out.join("\n");
}
