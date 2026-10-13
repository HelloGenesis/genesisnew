/**
 * REACHING CREATORS FOR THEIR COSTING (Genesis, 12 Oct 2026). One message,
 * written once and saved as the template, filled in per creator: their first
 * name, the campaign, the cities, the deliverables, who's asking. WhatsApp opens
 * with it ready (one tap to send); email sends from the CRM.
 */

export const DEFAULT_OUTREACH = `Hi {first_name}, hope you're safe & sound.

We're reaching out for a potential {campaign} targeting {audience} in {cities}.

Can you please share your commercials for these deliverables:

{deliverables}

Best,
{sender}
{sender_title}
genesismedia.co`;

export const DEFAULT_DELIVERABLES = ["1 IG Reel", "1 IG Story", "Link in bio", "1 month digital usage rights"];

export type OutreachFields = { campaign: string; audience: string; cities: string; deliverables: string[]; sender: string; senderTitle: string };

/** The template with one creator's details in it. Unknown {words} are left as written. */
export function fillOutreach(template: string, f: OutreachFields, creatorName: string) {
  const first = creatorName.replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, "").split(/\s+/)[0] || creatorName;
  const values: Record<string, string> = {
    first_name: first,
    name: creatorName,
    campaign: f.campaign,
    audience: f.audience,
    cities: f.cities,
    deliverables: f.deliverables.filter(Boolean).map((d) => `- ${d}`).join("\n"),
    sender: f.sender,
    sender_title: f.senderTitle,
  };
  return template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all).replace(/\n{3,}/g, "\n\n").trim();
}

/** A WhatsApp click-to-chat link: to their number when we have one (India by default), else WhatsApp's contact picker. */
/**
 * One phone number from whatever a sheet held: Excel's "8888620133.0", two
 * numbers in one cell, spaces and dashes (Genesis, 13 Oct 2026). The first
 * number wins.
 */
export function firstPhone(raw: string | null | undefined): string | null {
  const t = (raw ?? "").replace(/(\d)\.0+(?!\d)/g, "$1");
  for (const seg of t.split(/[^\d+\s-]+/)) {
    const digits = seg.replace(/\D/g, "");
    if (digits.length < 10) continue;
    /* One number (with a country code at most): as written. Longer: two numbers side by side, so the first. */
    if (digits.length <= 13) return seg.trim().replace(/[\s-]+/g, " ");
    const first = seg.trim().split(/\s+/).find((p) => p.replace(/\D/g, "").length >= 10);
    if (first) return first;
  }
  return null;
}

export function whatsappLink(phone: string | null | undefined, text: string) {
  let digits = (firstPhone(phone) ?? "").replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith("0") && digits.length === 11) digits = `91${digits.slice(1)}`;
  return digits.length >= 11 ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** The first phone number and email in free text ("Arundhati +91 73893 90602 · a@x.com"). */
export function contactBits(text: string | null | undefined) {
  const t = text ?? "";
  return { phone: firstPhone(t), email: t.match(/[^\s@·,]+@[^\s@·,]+\.[a-z]{2,}/i)?.[0] ?? null };
}
