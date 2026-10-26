/**
 * REACH-OUT STATUSES, ONE LIST EVERYWHERE (Genesis, 27 Oct 2026: "just give a
 * dropdown here, all across, where there's reach-out status"): the Reach out
 * page, the plan table and the influencer database. The older values (the
 * channels) stay valid; a status that isn't here (from an old plan or a
 * file) still shows, and can be changed to one of these.
 */
export const REACH_STATUSES = [
  "WhatsApp",
  "Email",
  "Call / DM",
  "Agency/Freelancer",
  "Hashfame",
  "Awaiting reply",
  "Quoted",
  "Costs received",
  "Brand shared",
  "Brand shortlisted",
  "Brand reviewed",
  "Confirmed",
  "Not relevant",
  "Declined",
] as const;

/** The dropdown's choices: "Not contacted", the list, and the current value when it's something else. */
export const reachOptions = (current?: string | null) => ["", ...REACH_STATUSES, ...(current && !(REACH_STATUSES as readonly string[]).includes(current) ? [current] : [])];

/** How recently counts as "already contacted": asked before contacting again. */
export const RECENT_DAYS = 30;

export type LastReach = { status: string; at: string; by: string | null; plan: string | null; planId: string | null };

export const reachLine = (r: LastReach | null | undefined) =>
  r ? `${r.status} · ${new Date(r.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${r.by ? ` · ${r.by}` : ""}${r.plan ? ` · ${r.plan}` : ""}` : "";

export const isRecent = (r: LastReach | null | undefined) => Boolean(r && Date.now() - new Date(r.at).getTime() < RECENT_DAYS * 864e5);
