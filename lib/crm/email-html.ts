/**
 * DESIGNED EMAILS WITH BUTTONS (Genesis, 31 Oct 2026: "an email with an
 * approval button right there"; "an embedded email for quotes with a confirm
 * button"). Tables and inline styles, as every mail app understands them. The
 * text version is always sent alongside (lib/crm/notify).
 *
 * GENESIS'S LOOK (Genesis, 3 Nov 2026: "some design … the Genesis Media logo
 * on the right, the orb somewhere, and the slider gif"): a black band with the
 * orb on the left and the header's sliding wordmark on the right
 * (public/brand/email: a GIF made from public/brand/header's video; Outlook
 * shows its first frame, GENESIS.MEDIA), a gradient rule, the card, a summary
 * box, pill buttons, and a footer. An agency CRM's emails go out plain, with
 * none of Genesis's marks.
 */
export type EmailButton = { label: string; url: string; tone?: "primary" | "secondary" | "danger" };

/* Images in mail must load from the open web, so always the live site. */
const SITE = (() => {
  const base = process.env.APP_BASE_URL ?? "";
  return /^https:\/\/(?!localhost)/.test(base) ? base.replace(/\/$/, "") : "https://www.genesismedia.co";
})();

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* Lines with **bold** and bare links, as the text version writes them. */
const line = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#141216">$1</strong>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#c2410c;text-decoration:underline">$1</a>');
const lines = (s: string) => s.split("\n").map(line).join("<br>");

const BUTTON: Record<NonNullable<EmailButton["tone"]>, string> = {
  primary: "background:#ffc516;color:#141216;border:1px solid #ffc516;",
  secondary: "background:#ffffff;color:#141216;border:1px solid #d8d4cc;",
  danger: "background:#ffffff;color:#b42318;border:1px solid #f1c6c0;",
};

/*
 * EVERY GENESIS VERTICAL UNDER THE CARD (Genesis, 3 Nov 2026: "add Nova,
 * Coworking, Elite AI and the other verticals as well"). Each goes to its page
 * on the live site; Elite AI goes to the home page until its own is up.
 */
const VERTICALS: [string, string][] = [
  ["Genesis Media", `${SITE}/`],
  ["AI Lab", `${SITE}/ai-content-automation`],
  ["Studios", `${SITE}/content-production`],
  ["Brand &amp; Design", `${SITE}/brand-design`],
  ["Influence", `${SITE}/influencer-marketing`],
  ["Nova", `${SITE}/resellers`],
  ["Elite AI", `${SITE}/`],
  ["Coworking", "https://coworking.genesismedia.co"],
];

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function emailHtml(e: { preheader?: string; kicker?: string; heading: string; paragraphs: string[]; summary?: string; buttons?: EmailButton[]; note?: string; signOff?: string; agency?: boolean }) {
  const genesis = !e.agency;
  const buttons = (e.buttons ?? [])
    /* Side by side, and onto the next line on a phone rather than squeezed. */
    .map((b) => `<a href="${esc(b.url)}" style="${BUTTON[b.tone ?? "primary"]}display:inline-block;margin:0 10px 10px 0;padding:13px 26px;border-radius:999px;font-weight:700;font-size:15px;line-height:1;white-space:nowrap;text-decoration:none;font-family:${FONT}">${esc(b.label)}</a>`)
    .join("");
  const header = genesis
    ? `<tr><td style="background:#000000;padding:20px 28px;border-radius:24px 24px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td align="left" valign="middle" width="56"><img src="${SITE}/brand/email/genesis-orb.png" width="44" height="44" alt="" style="display:block;border:0;width:44px;height:44px"></td>
<td align="right" valign="middle"><a href="${SITE}" style="text-decoration:none"><img src="${SITE}/brand/email/genesis-slider.gif" width="246" height="28" alt="GENESIS.MEDIA" style="display:block;border:0;width:246px;height:28px;color:#ffffff;font-weight:700;font-size:20px"></a></td>
</tr></table></td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:#f06144;background-image:linear-gradient(90deg,#ffaf18,#f06144,#ac84fe)">&nbsp;</td></tr>`
    : "";
  const footer = genesis
    ? `<tr><td style="background:#faf8f5;padding:22px 32px;border-top:1px solid #eee9e1;border-radius:0 0 24px 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="font-size:13px;line-height:1.6;color:#6b665e;font-family:${FONT}">${lines((e.signOff ?? "— Genesis Media\nhello@genesismedia.co · genesismedia.co").trim())}</td>
<td align="right" valign="top" width="40"><img src="${SITE}/brand/email/genesis-orb.png" width="28" height="28" alt="" style="display:block;border:0;width:28px;height:28px;opacity:.9"></td>
</tr></table></td></tr>`
    : `<tr><td style="padding:22px 32px;border-top:1px solid #eee9e1;font-size:13px;line-height:1.6;color:#6b665e;font-family:${FONT}">${lines((e.signOff ?? "").trim())}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#f1eee9;font-family:${FONT};color:#141216">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(e.preheader ?? e.heading)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1eee9;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;box-shadow:0 8px 30px rgba(20,18,22,.08)">
${header}
<tr><td style="padding:32px 32px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${e.kicker ?? genesis ? `<tr><td style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a857c;font-weight:600;padding-bottom:10px">${esc(e.kicker ?? "Genesis Media")}</td></tr>` : ""}
<tr><td style="font-size:24px;font-weight:700;line-height:1.3;color:#141216;padding-bottom:18px">${esc(e.heading)}</td></tr>
${e.paragraphs.filter(Boolean).map((p) => `<tr><td style="font-size:15px;line-height:1.65;color:#3a3630;padding-bottom:14px">${lines(p)}</td></tr>`).join("")}
${e.summary ? `<tr><td style="padding:6px 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border:1px solid #eee9e1;border-radius:16px"><tr><td style="padding:18px 20px;font-size:14px;line-height:1.7;color:#3a3630">${lines(e.summary)}</td></tr></table></td></tr>` : ""}
${buttons ? `<tr><td style="padding-top:6px">${buttons}</td></tr>` : ""}
${e.note ? `<tr><td style="font-size:13px;line-height:1.6;color:#8a857c;padding:14px 0 18px">${line(e.note)}</td></tr>` : `<tr><td style="height:18px"></td></tr>`}
</table></td></tr>
${footer}
</table>
${genesis ? `<p style="font-size:11px;line-height:1.9;color:#a29d94;margin:16px 0 0;font-family:${FONT}">${VERTICALS.map(([name, url]) => `<a href="${url}" style="color:#8a857c;text-decoration:none">${name}</a>`).join(" &nbsp;·&nbsp; ")}</p>` : ""}
</td></tr></table></body></html>`;
}
