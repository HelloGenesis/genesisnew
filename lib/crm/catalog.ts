import type { VerticalKey } from "@/lib/verticals/types";
import type {
  AccountKind,
  AccountStatus,
  CampaignCreatorStatus,
  CreatorTier,
  DeliverableStatus,
  Division,
  LeadSource,
  LeadStatus,
  OrderStatus,
  ProjectStatus,
  QuoteStatus,
  RequestKind,
  RequestStatus,
  StaffRoleKind,
  SubscriptionStatus,
} from "@/lib/generated/prisma/enums";

/**
 * GENESIS'S OWN VOCABULARY FOR THE CRM — divisions, how each division's work
 * moves from brief to delivery, and the words every status is shown as.
 *
 * The stages are the processes the site already promises buyers (lib/products'
 * four-step process and the AI approval workflow in the terms: script lock →
 * Draft 1 → generation → Draft 2), so what a client sees in the portal is the
 * same journey the product page described when they bought it.
 */

export const DIVISIONS: readonly Division[] = ["AI_LAB", "STUDIOS", "BRAND_DESIGN", "INFLUENCE"];

export const DIVISION_LABEL: Record<Division, string> = {
  AI_LAB: "AI Lab",
  STUDIOS: "Studios",
  BRAND_DESIGN: "Brand & Design",
  INFLUENCE: "Influence",
  CRM: "Nova by Genesis",
};

const FROM_VERTICAL: Record<VerticalKey, Division> = {
  "ai-labs": "AI_LAB",
  studios: "STUDIOS",
  "brand-design": "BRAND_DESIGN",
  influence: "INFLUENCE",
};

export const divisionOf = (vertical: VerticalKey): Division => FROM_VERTICAL[vertical];


/**
 * How many pieces a product includes, read from its own "What's included"
 * ("4 Standard AI Videos", "8 Reels / month", "3 creator videos"), for the
 * "2 of 4 delivered" count. Null when the list does not say.
 */
export function quotaFrom(includes: readonly string[] | undefined): number | null {
  for (const line of includes ?? []) {
    const match = /^(\d+)\s+(?:standard |advanced |premium |short[- ]form |long[- ]form |ugc |ai |reels?|videos?|posts?|creatives?|creators?)/i.exec(line.trim());
    if (match) return Number(match[1]);
  }
  return null;
}

type Tone = "good" | "warn" | "bad" | "info" | "muted";

export const LEAD_STATUS: Record<LeadStatus, { label: string; tone: Tone }> = {
  NEW: { label: "New", tone: "info" },
  CONTACTED: { label: "Contacted", tone: "muted" },
  QUALIFIED: { label: "Qualified", tone: "info" },
  CALL_BOOKED: { label: "Call booked", tone: "info" },
  PROPOSAL_SENT: { label: "Proposal sent", tone: "warn" },
  NEGOTIATION: { label: "Negotiation", tone: "warn" },
  WON: { label: "Won", tone: "good" },
  LOST: { label: "Lost", tone: "bad" },
  NURTURE: { label: "Nurture", tone: "muted" },
};

/** What a lead can be interested in: the "Interested in" dropdown (Genesis, 12 Oct 2026); anything else can still be typed. */
export const SERVICES = [
  "AI videos", "AI avatar / clone", "Voice & localisation", "Automation", "Games & apps",
  "Influencer marketing", "UGC videos", "Celebrity partnership", "Creator activation", "Regional campaign",
  "Studio shoot", "Ad film", "Podcast / video series", "Event coverage",
  "Brand identity", "Packaging", "Social media design", "Website",
  "Monthly content plan", "Other",
];

/** The board's columns, left to right; Lost and Nurture sit off the board. */
export const PIPELINE: readonly LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CALL_BOOKED", "PROPOSAL_SENT", "NEGOTIATION", "WON"];

export const LEAD_SOURCE: Record<LeadSource, string> = {
  WEBSITE_FORM: "Website form",
  CHECKOUT: "Checkout",
  WHATSAPP: "WhatsApp",
  CALL: "Call",
  REFERRAL: "Referral",
  PARTNER: "Partner agency",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  EVENT: "Event",
  OUTBOUND: "Outbound",
  CHATGPT: "ChatGPT",
  CALENDAR_BOOKING: "Website calendar booking",
  EMAIL: "Email (Gmail)",
  GOOGLE_DRIVE: "Google Drive",
  SHEET_IMPORT: "Sheet import",
  OTHER: "Other",
};

export const ACCOUNT_KIND: Record<AccountKind, string> = { BRAND: "Brand", AGENCY: "Agency", VENDOR: "Vendor" };

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; tone: Tone }> = {
  PROSPECT: { label: "Prospect", tone: "muted" },
  ACTIVE: { label: "Active", tone: "good" },
  PAUSED: { label: "Paused", tone: "warn" },
  CHURNED: { label: "Churned", tone: "bad" },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Awaiting payment", tone: "warn" },
  PAID: { label: "Paid", tone: "good" },
  FAILED: { label: "Failed", tone: "bad" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  REFUNDED: { label: "Refunded", tone: "muted" },
};

export const SUBSCRIPTION_STATUS: Record<SubscriptionStatus, { label: string; tone: Tone }> = {
  CREATED: { label: "Awaiting first payment", tone: "warn" },
  AUTHENTICATED: { label: "Authorised", tone: "info" },
  ACTIVE: { label: "Active", tone: "good" },
  PENDING: { label: "Renewal failing", tone: "bad" },
  HALTED: { label: "Halted", tone: "bad" },
  PAUSED: { label: "Paused", tone: "warn" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  COMPLETED: { label: "Completed", tone: "muted" },
};

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "In progress", tone: "info" },
  ON_HOLD: { label: "On hold", tone: "warn" },
  DELIVERED: { label: "Delivered", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

export const DELIVERABLE_STATUS: Record<DeliverableStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft (internal)", tone: "muted" },
  INTERNAL_REVIEW: { label: "Internal review", tone: "info" },
  IN_REVIEW: { label: "Waiting for your review", tone: "warn" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "bad" },
  APPROVED: { label: "Approved", tone: "good" },
};

export const REQUEST_KIND: Record<RequestKind, string> = {
  NEW_BRIEF: "New brief",
  REVISION: "Revision",
  NEW_CONTENT: "New content request",
  SUPPORT: "Support",
  BILLING: "Billing",
  CANCELLATION: "Cancellation",
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  OPEN: { label: "Open", tone: "info" },
  IN_PROGRESS: { label: "In progress", tone: "warn" },
  WAITING_ON_CLIENT: { label: "Waiting on you", tone: "warn" },
  DONE: { label: "Done", tone: "good" },
  DECLINED: { label: "Declined", tone: "muted" },
};

export const CAMPAIGN_CREATOR_STATUS: Record<CampaignCreatorStatus, { label: string; tone: Tone }> = {
  SHORTLISTED: { label: "Shortlisted", tone: "muted" },
  APPROACHED: { label: "Approached", tone: "info" },
  NEGOTIATING: { label: "Negotiating", tone: "warn" },
  CONFIRMED: { label: "Confirmed", tone: "good" },
  CONTENT_RECEIVED: { label: "Content received", tone: "info" },
  APPROVED: { label: "Content approved", tone: "good" },
  POSTED: { label: "Posted", tone: "good" },
  PAID: { label: "Paid", tone: "good" },
  DROPPED: { label: "Dropped", tone: "bad" },
};

export const CREATOR_TIER: Record<CreatorTier, string> = {
  NANO: "Nano (<10K)",
  MICRO: "Micro (10K–100K)",
  MID: "Mid-tier (100K–500K)",
  MACRO: "Macro (500K–1M)",
  MEGA: "Mega (1M+)",
  CELEBRITY: "Celebrity",
};

export function tierFor(followers: number): CreatorTier {
  if (followers >= 1_000_000) return "MEGA";
  if (followers >= 500_000) return "MACRO";
  if (followers >= 100_000) return "MID";
  if (followers >= 10_000) return "MICRO";
  return "NANO";
}

/** What vendors and freelancers do — the skills dropdown (Genesis, 22 Oct 2026); anything else can be typed in. */
export const VENDOR_SKILLS = [
  "Video editor",
  "DOP / cinematographer",
  "Motion designer",
  "Graphic designer",
  "AI artist",
  "Photographer",
  "Scriptwriter / copywriter",
  "Influencer marketing (freelancer)",
  "Social media manager",
  "Production house",
  "Makeup & styling",
  "Sound & music",
] as const;

export const STAFF_ROLE: Record<StaffRoleKind, { label: string; does: string }> = {
  OWNER: { label: "Owner", does: "Everything, including staff and money" },
  ADMIN: { label: "Admin", does: "Everything except staff roles" },
  SALES: { label: "Sales", does: "Leads, accounts, proposals" },
  PRODUCER: { label: "Producer", does: "Projects, deliverables, vendors" },
  FINANCE: { label: "Finance", does: "Orders, payments, commissions, vendor invoices" },
  INFLUENCER: { label: "Influencer team", does: "Influencer plans and the influencer database" },
  CREATIVE: { label: "Creative (designer, editor)", does: "The projects and tasks given to them" },
};

/** Integer paise → "₹24,999" (paise shown only when there are any). */
export function money(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "—";
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: rupees % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** A rupee figure typed into a form ("24,999" or "24999.50") → paise; null when it is not a number. */
export function toPaise(input: FormDataEntryValue | null | undefined): number | null {
  const text = String(input ?? "").replace(/[₹,\s]/g, "");
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}

const IST = "Asia/Kolkata";

export const date = (value: Date | string | null | undefined) =>
  value ? new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";

export const dateTime = (value: Date | string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value))
    : "—";

/** Today in India, as the YYYY-MM-DD a date column stores. */
export const todayIst = () => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());

/** "GM-P-0042" for a project, "GM-R-0107" for a request. */
export const projectRef = (number: number) => `P-${String(number).padStart(4, "0")}`;
export const requestRef = (number: number) => `R-${String(number).padStart(4, "0")}`;

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "muted" },
  SENT: { label: "Sent", tone: "info" },
  VIEWED: { label: "Viewed by client", tone: "warn" },
  ACCEPTED: { label: "Accepted", tone: "good" },
  PAID: { label: "Paid", tone: "good" },
  DECLINED: { label: "Declined", tone: "bad" },
  EXPIRED: { label: "Expired", tone: "muted" },
};
