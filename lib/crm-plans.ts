/**
 * GENESIS CRM PLANS (Genesis, 13 Oct 2026: "three options, monthly and
 * annual"; 14 Oct: "monthly will be 10% more than annual — annual is what you
 * see now"). `rate` is the plan's price per month on ANNUAL billing, paid as
 * twelve months upfront; monthly billing is 10% more, a month at a time.
 * Prices exclude 18% GST. Plain data (not in a client component) so the
 * pages, the schema, /llms.txt and the Razorpay checkout all read one list.
 */

export type CrmBilling = "annual" | "monthly";
export const CRM_MONTHLY_UPLIFT = 0.1;
export const CRM_GST = 0.18;

export const CRM_PLAN_PRICES = [
  {
    key: "Starter",
    rate: 4999,
    blurb: "For a small agency getting off spreadsheets.",
    features: ["Up to 5 users", "Leads & pipeline, tasks, team roles", "Influencer database with Excel & Google Sheets import", "Quotes, proposals & influencer plans (PDF, Excel)", "GST tax invoices", "Email support"],
  },
  {
    key: "Growth",
    rate: 9999,
    popular: true,
    blurb: "For a working agency with brands to look after.",
    features: ["Everything in Starter", "Up to 15 users", "AI inbox: briefs in Gmail & Drive become leads (2,000 a month)", "Live Google Sheets, internal & external", "Client portal for your brands", "WhatsApp & email outreach templates", "Your logo (white-label)", "Priority support on WhatsApp"],
  },
  {
    key: "Scale",
    rate: 24999,
    blurb: "For agency networks, and brands with many agencies.",
    features: ["Everything in Growth", "Up to 50 users", "Brands with several agencies in one place", "10,000 AI reads a month", "Your own domain", "Onboarding and data import included", "A dedicated account manager"],
  },
] as const;

export type CrmPlan = (typeof CRM_PLAN_PRICES)[number];
export const findCrmPlan = (key: string) => CRM_PLAN_PRICES.find((p) => p.key.toLowerCase() === key.toLowerCase());

/** The price per month a buyer sees for a plan on this billing, before GST. */
export const crmPerMonth = (plan: CrmPlan, billing: CrmBilling) => (billing === "annual" ? plan.rate : Math.round(plan.rate * (1 + CRM_MONTHLY_UPLIFT)));
/** What one billing cycle charges, before GST: twelve months on annual, one on monthly. */
export const crmCycleCharge = (plan: CrmPlan, billing: CrmBilling) => crmPerMonth(plan, billing) * (billing === "annual" ? 12 : 1);
/** The same with GST, in whole rupees — what Razorpay charges each cycle. */
export const crmCycleTotal = (plan: CrmPlan, billing: CrmBilling) => Math.round(crmCycleCharge(plan, billing) * (1 + CRM_GST));
