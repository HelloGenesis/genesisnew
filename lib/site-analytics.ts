/**
 * WEBSITE ANALYTICS, THE SORTING (Genesis, 31 Oct 2026: "a visitor analytics
 * page and the entire dashboard for the websites"). Where a visit came from,
 * on what device: worked out once, when it starts (app/api/track).
 */

const SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, "Google (organic)"],
  [/(^|\.)bing\.com$/, "Bing (organic)"],
  [/duckduckgo\.com$/, "DuckDuckGo (organic)"],
  [/(^|\.)instagram\.com$|^l\.instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|^l\.facebook\.com$|^m\.facebook\.com$/, "Facebook"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X (Twitter)"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/whatsapp\.com$|^wa\.me$/, "WhatsApp"],
  [/chatgpt\.com$|openai\.com$/, "ChatGPT"],
  [/perplexity\.ai$/, "Perplexity"],
  [/gemini\.google\.com$/, "Gemini"],
  [/claude\.ai$/, "Claude"],
  [/naukri\.com$/, "Naukri"],
  [/mail\.google\.com$|outlook\./, "Email"],
];

/** "Google (organic)", "Instagram", "Direct", or the referring site's name. */
export function sourceOf(referrer: string | null, utmSource: string | null, ownHost: string | null): string {
  if (utmSource) {
    const u = utmSource.toLowerCase();
    if (/google/.test(u)) return "Google (paid/campaign)";
    if (/insta|ig/.test(u)) return "Instagram";
    if (/facebook|fb|meta/.test(u)) return "Facebook";
    if (/linkedin/.test(u)) return "LinkedIn";
    if (/whatsapp|wa/.test(u)) return "WhatsApp";
    if (/mail|newsletter/.test(u)) return "Email";
    return utmSource.slice(0, 40);
  }
  if (!referrer) return "Direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
  if (!host || (ownHost && host.endsWith(ownHost.replace(/^www\./, "").split(".").slice(-2).join(".")))) return "Direct";
  if (/gemini\.google\.com$/.test(host)) return "Gemini";
  for (const [re, name] of SOURCES) if (re.test(host)) return name;
  return host.slice(0, 60);
}

export function deviceOf(ua: string) {
  const tablet = /ipad|tablet|(android(?!.*mobile))/i.test(ua);
  const mobile = !tablet && /mobi|iphone|android/i.test(ua);
  const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";
  const os = /iphone|ipad|ios/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /mac os/i.test(ua) ? "macOS" : /windows/i.test(ua) ? "Windows" : /linux/i.test(ua) ? "Linux" : "Other";
  return { device: tablet ? "Tablet" : mobile ? "Mobile" : "Desktop", browser, os };
}

export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|curl|wget|python|axios|node-fetch/i.test(ua);
