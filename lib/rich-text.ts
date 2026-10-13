/**
 * RICH TEXT FOR PROPOSALS (Genesis, 13 Oct 2026: "a tool section for text
 * edits, highlights … adding images, link, embed"). The editor writes HTML;
 * this keeps only what a proposal needs — bold, italic, underline, highlight,
 * headings, lists, links, images and embeds from known video/design hosts —
 * and drops everything else (scripts, styles, event handlers), both when it
 * is saved and again when a client's page shows it.
 *
 * Text written before the editor existed (plain lines) is turned into a list.
 */

const BLOCKS = new Set(["p", "div", "br", "ul", "ol", "li", "h3", "h4", "blockquote", "figure"]);
const INLINE = new Set(["b", "strong", "i", "em", "u", "mark", "s", "span", "a", "img", "iframe"]);
const VOID = new Set(["br", "img"]);

/* Embeds allowed: YouTube, Vimeo, Instagram, Google Drive/Docs/Slides, Canva, Loom, Figma. */
const EMBED_HOSTS = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|www\.youtube\.com\/embed\/|player\.vimeo\.com\/video\/|www\.instagram\.com\/(p|reel)\/[\w-]+\/embed|drive\.google\.com\/file\/d\/[\w-]+\/preview|docs\.google\.com\/(presentation|document|spreadsheets)\/d\/[\w-]+\/(embed|preview|pubhtml)|www\.canva\.com\/design\/[\w-]+\/[\w-]+\/view\?embed|www\.loom\.com\/embed\/|www\.figma\.com\/embed\?)/i;

const escapeText = (s: string) => s.replace(/&(?!(#\d+|#x[\da-f]+|[a-z]+);)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const decodeAttr = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

function attr(raw: string, name: string): string | null {
  const m = raw.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodeAttr(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

const safeUrl = (u: string | null, img = false) => {
  if (!u) return null;
  const v = u.trim();
  if (/^https?:\/\//i.test(v)) return v;
  /* Images uploaded to the CRM, on whichever domain the page is served from. */
  if (img && /^\/api\/crm\/images\/[\w-]{10,120}$/.test(v)) return v;
  if (!img && /^mailto:/i.test(v)) return v;
  return null;
};

/** Keeps the allowed tags and attributes; everything else is dropped (its text kept, except script/style). */
export function sanitizeHtml(html: string): string {
  const src = html.replace(/<(script|style|noscript|template|object|embed|svg|math)[\s\S]*?<\/\1\s*>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  let out = "";
  /* What each <span> and <iframe> became, so its closing tag matches. */
  const spans: string[] = [];
  const frames: boolean[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)|(<)/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m[3] !== undefined) {
      out += escapeText(m[3]);
      continue;
    }
    if (m[4]) {
      out += "&lt;";
      continue;
    }
    const tag = m[1]!.toLowerCase();
    const closing = m[0].startsWith("</");
    if (!BLOCKS.has(tag) && !INLINE.has(tag)) continue;
    if (closing) {
      if (tag === "span") out += `</${spans.pop() ?? "span"}>`;
      else if (tag === "iframe") out += frames.pop() ? "</iframe>" : "";
      else if (!VOID.has(tag)) out += `</${tag}>`;
      continue;
    }
    const raw = m[2] ?? "";
    if (tag === "a") {
      const href = safeUrl(attr(raw, "href"));
      out += href ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">` : "<a>";
    } else if (tag === "img") {
      const s = safeUrl(attr(raw, "src"), true);
      if (s) out += `<img src="${escapeAttr(s)}" alt="${escapeAttr((attr(raw, "alt") ?? "").slice(0, 200))}" loading="lazy">`;
    } else if (tag === "iframe") {
      const s = attr(raw, "src");
      const ok = Boolean(s && EMBED_HOSTS.test(s));
      frames.push(ok);
      if (ok) out += `<iframe src="${escapeAttr(s!)}" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen">`;
    } else if (tag === "mark" || tag === "span") {
      /* A highlight is the one style kept: as <mark>. */
      const style = attr(raw, "style") ?? "";
      const as = tag === "mark" || /background(-color)?\s*:\s*(?!transparent|initial|inherit|rgba\(0,\s*0,\s*0,\s*0\))/i.test(style) ? "mark" : "span";
      if (tag === "span") spans.push(as);
      out += `<${as}>`;
    } else {
      out += `<${tag}>`;
    }
  }
  /* Tidy empty wrappers. */
  return out.replace(/<(p|div|span|mark|b|strong|i|em|u)>\s*<\/\1>/g, "").trim().slice(0, 60_000);
}

export const looksLikeHtml = (s: string | null | undefined) => Boolean(s && /<(p|div|br|ul|ol|li|b|strong|i|em|u|mark|a|img|iframe|h3|h4)\b/i.test(s));

/** Plain lines from before the editor → a bulleted list (one line, one bullet). */
export function textToHtml(s: string | null | undefined): string {
  if (!s) return "";
  if (looksLikeHtml(s)) return s;
  const lines = s.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  if (lines.length <= 1) return lines[0] ? `<p>${escapeText(lines[0])}</p>` : "";
  return `<ul>${lines.map((l) => `<li>${escapeText(l)}</li>`).join("")}</ul>`;
}

/** The words alone, for sheets and emails. */
export function htmlToText(s: string | null | undefined): string {
  if (!s) return "";
  if (!looksLikeHtml(s)) return s;
  return s
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|div|li|h3|h4|blockquote)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A pasted video/design link as an embed address, when it's one we can embed. */
export function embedUrl(link: string): string | null {
  const u = link.trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  m = u.match(/instagram\.com\/(p|reel|reels)\/([\w-]+)/i);
  if (m) return `https://www.instagram.com/${m[1] === "p" ? "p" : "reel"}/${m[2]}/embed`;
  m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  m = u.match(/docs\.google\.com\/(presentation|document|spreadsheets)\/d\/([\w-]+)/i);
  if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
  m = u.match(/canva\.com\/design\/([\w-]+)\/([\w-]+)/i);
  if (m) return `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed`;
  m = u.match(/loom\.com\/share\/([\w-]+)/i);
  if (m) return `https://www.loom.com/embed/${m[1]}`;
  if (/figma\.com\/(file|design|proto)\//i.test(u)) return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(u)}`;
  return null;
}
