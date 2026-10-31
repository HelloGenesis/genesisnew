/**
 * DESIGNED EMAILS WITH BUTTONS (Genesis, 31 Oct 2026: "an email with an
 * approval button right there"; "an embedded email for quotes with a confirm
 * button"). A light card, the words, then the buttons; tables and inline
 * styles, as every mail app understands them. The text version is always sent
 * alongside (lib/crm/notify).
 */
export type EmailButton = { label: string; url: string; tone?: "primary" | "secondary" | "danger" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* Lines with **bold** and bare links, as the text version writes them. */
const line = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#b7791f">$1</a>');

const BUTTON: Record<NonNullable<EmailButton["tone"]>, string> = {
  primary: "background:#ffc516;color:#141216;",
  secondary: "background:#ffffff;color:#141216;border:1px solid #d8d4cc;",
  danger: "background:#ffffff;color:#b42318;border:1px solid #f1c6c0;",
};

export function emailHtml(e: { preheader?: string; heading: string; paragraphs: string[]; buttons?: EmailButton[]; note?: string; signOff?: string }) {
  const buttons = (e.buttons ?? [])
    .map((b) => `<td style="padding:0 8px 8px 0"><a href="${esc(b.url)}" style="${BUTTON[b.tone ?? "primary"]}display:inline-block;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none">${esc(b.label)}</a></td>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f2ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#141216">
<span style="display:none;max-height:0;overflow:hidden">${esc(e.preheader ?? e.heading)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;padding:32px">
<tr><td style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8a857c;padding-bottom:16px">Genesis Media</td></tr>
<tr><td style="font-size:22px;font-weight:600;line-height:1.3;padding-bottom:16px">${esc(e.heading)}</td></tr>
${e.paragraphs.filter(Boolean).map((p) => `<tr><td style="font-size:15px;line-height:1.6;color:#3a3630;padding-bottom:12px">${p.split("\n").map(line).join("<br>")}</td></tr>`).join("")}
${buttons ? `<tr><td style="padding-top:12px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${buttons}</tr></table></td></tr>` : ""}
${e.note ? `<tr><td style="font-size:13px;line-height:1.5;color:#8a857c;padding-top:16px">${line(e.note)}</td></tr>` : ""}
<tr><td style="font-size:13px;line-height:1.5;color:#8a857c;padding-top:24px;border-top:1px solid #eee9e1">${(e.signOff ?? "— Genesis Media\nhello@genesismedia.co · genesismedia.co").trim().split("\n").map(line).join("<br>")}</td></tr>
</table></td></tr></table></body></html>`;
}
