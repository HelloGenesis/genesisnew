/**
 * GENESIS CRM PLANS (Genesis, 13 Oct 2026: "add a pricing page… three options,
 * monthly and annual"). Prices exclude GST; annual is ten months' price for
 * twelve. Plain data (not in the client component) so the page's schema and
 * /llms.txt can read it on the server. Choosing a plan opens the application with it filled in — the
 * workspace is set up on a short call, then billed by Razorpay.
 */

export const CRM_PLAN_PRICES = [
  {
    key: "Starter",
    monthly: 4999,
    blurb: "For a small agency getting off spreadsheets.",
    features: ["Up to 5 users", "Leads & pipeline, tasks, team roles", "Influencer database with Excel & Google Sheets import", "Quotes, proposals & influencer plans (PDF, Excel)", "GST tax invoices", "Email support"],
  },
  {
    key: "Growth",
    monthly: 9999,
    popular: true,
    blurb: "For a working agency with brands to look after.",
    features: ["Everything in Starter", "Up to 15 users", "AI inbox: briefs in Gmail & Drive become leads (2,000 a month)", "Live Google Sheets, internal & external", "Client portal for your brands", "WhatsApp & email outreach templates", "Your logo (white-label)", "Priority support on WhatsApp"],
  },
  {
    key: "Scale",
    monthly: 24999,
    blurb: "For agency networks, and brands with many agencies.",
    features: ["Everything in Growth", "Up to 50 users", "Brands with several agencies in one place", "10,000 AI reads a month", "Your own domain", "Onboarding and data import included", "A dedicated account manager"],
  },
] as const;
