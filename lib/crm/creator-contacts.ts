/**
 * A CREATOR'S NUMBERS AND EMAILS (Genesis, 27 Oct 2026: "keep a standard
 * Contact and Email … make sure we can add multiple emails and contacts, and
 * it reflects wherever needed"). Each is a list, kept as one ", "-separated
 * text on the influencer database (Creator.phone / .email) and on every plan
 * row (QuoteCreator.phone / .email); lib/crm/reachout keeps them the same (lib/crm/creator-contacts).
 * Safe in the browser: no server imports.
 */

const PHONE = /\+?\d[\d\s-]{7,}\d/g;
const EMAIL = /[^\s@·,;<>()]+@[^\s@·,;<>()]+\.[a-z]{2,}/gi;

const digits = (p: string) => p.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");

/** Every phone number in the text, once each (the same number written two ways counts once). */
export function phoneList(text: string | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of (text ?? "").match(PHONE) ?? []) {
    const p = m.replace(/\s+/g, " ").trim();
    const key = digits(p);
    if (key.length < 7 || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/** Every email in the text, lowercased, once each. */
export function emailList(text: string | null | undefined): string[] {
  return [...new Set(((text ?? "").match(EMAIL) ?? []).map((e) => e.toLowerCase()))];
}

/** What's left of a contact cell without its numbers and emails ("Collective Artists", "via manager"), or nothing. */
export const contactRest = (text: string | null | undefined) =>
  (text ?? "")
    /* Excel's "8888620133.0" is a number too. */
    .replace(/(\d)\.0+(?!\d)/g, "$1")
    .replace(EMAIL, "")
    .replace(PHONE, "")
    .split(/\s*[·,;|/\n]\s*/)
    .map((x) => x.replace(/^[\s:()-]+|[\s:()-]+$/g, "").trim())
    .filter((x) => /[a-z]/i.test(x))
    .join(" · ") || null;

/** A list as stored: ", "-separated, or nothing. */
export const joinList = (xs: string[]) => (xs.length ? xs.join(", ").slice(0, 1000) : null);

/** Phones and emails tidied for saving: only real numbers and emails, each once. */
export const tidyPhones = (text: string | null | undefined) => joinList(phoneList(text));
export const tidyEmails = (text: string | null | undefined) => joinList(emailList(text));

/** The values as typed into separate boxes, for the editors (components/crm/multi-value). */
export const splitList = (text: string | null | undefined) =>
  (text ?? "")
    .split(/\s*[,;\n]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Same list? (Order and spacing don't matter.) */
export const sameList = (a: string | null | undefined, b: string | null | undefined, kind: "phone" | "email") => {
  const key = (t: string | null | undefined) => (kind === "phone" ? phoneList(t).map(digits) : emailList(t)).sort().join("|");
  return key(a) === key(b);
};

/** Tiers by followers, as the plan shows them; a plan row can name its own (QuoteCreator.tier). */
export const TIERS = ["Nano", "Micro", "Mid", "Macro", "Mega", "Celebrity"] as const;
export const autoTier = (followers: number) => (followers < 10_000 ? "Nano" : followers < 100_000 ? "Micro" : followers < 500_000 ? "Mid" : followers < 1_000_000 ? "Macro" : "Mega");
export const tierLabel = (tier: string | null | undefined, followers: number) => tier?.trim() || autoTier(followers);
