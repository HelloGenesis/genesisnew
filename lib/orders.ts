import "server-only";

import { appendToTab } from "./google-sheets";
import { LEGAL_EMAIL } from "./legal";

/**
 * WHERE A PAYMENT GOES ONCE RAZORPAY CONFIRMS IT (Genesis, 29 Sep 2026: "paid
 * orders and renewals go to email and Google Sheet", and the team is alerted
 * when a renewal fails so the work queue can be paused).
 *
 * Every event is a row in the "Orders" tab of the forms spreadsheet
 * (GOOGLE_SHEETS_ID) and an email to the team. Either can be missing — the
 * other still lands, and the event is always in the server log.
 *
 * EMAIL is sent through Resend (RESEND_API_KEY), from ORDER_EMAIL_FROM — an
 * address on a domain verified in Resend — to ORDER_EMAIL_TO (comma-separated,
 * hello@genesismedia.co when unset).
 */

export type OrderEvent = {
  /** Short, and the email's subject: "New membership", "Renewal failed — pause the queue". */
  event: string;
  /** Needs someone to act, not just to know. Flagged in the subject. */
  alert?: boolean;
  reference?: string;
  amount?: number;
  items?: string;
  billing?: string;
  company?: string;
  contact?: string;
  taxId?: string;
  address?: string;
  /** Razorpay ids — payment, subscription, link. */
  razorpay?: string;
  notes?: string;
};

const rupees = (value?: number) => (value === undefined ? "" : value.toLocaleString("en-IN"));

export async function recordOrderEvent(order: OrderEvent) {
  console.info("[orders]", order.event, order.reference ?? "", order.amount ?? "", order.razorpay ?? "");
  const [sheeted, emailed] = await Promise.all([
    appendToTab("orders", { ...order, alert: undefined, event: `${order.alert ? "⚠️ " : ""}${order.event}`, amount: rupees(order.amount) }, "razorpay").catch(() => false),
    emailTeam(order).catch((error) => {
      console.error("[orders] email failed", error);
      return false;
    }),
  ]);
  if (!sheeted) console.warn("[orders] not written to the sheet, is GOOGLE_SHEETS_ID set and shared with the service account?");
  if (!emailed) console.warn("[orders] no email sent, is RESEND_API_KEY / ORDER_EMAIL_FROM set?");
}

async function emailTeam(order: OrderEvent) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!key || !from) return false;
  const to = (process.env.ORDER_EMAIL_TO || LEGAL_EMAIL)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  const rows: [string, string | undefined][] = [
    ["Reference", order.reference],
    ["Amount", order.amount === undefined ? undefined : `₹${rupees(order.amount)}`],
    ["Items", order.items],
    ["Billing", order.billing],
    ["Company", order.company],
    ["Contact", order.contact],
    ["Tax ID", order.taxId],
    ["Billing address", order.address],
    ["Razorpay", order.razorpay],
    ["Notes", order.notes],
  ];
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const html = `<h2 style="font-family:sans-serif">${escape(order.event)}</h2><table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">${rows
    .filter(([, value]) => value && value !== "—")
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">${label}</td><td style="padding:4px 0">${escape(value!)}</td></tr>`,
    )
    .join("")}</table>`;
  const text = rows
    .filter(([, value]) => value && value !== "—")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: `${order.alert ? "⚠️ " : ""}${order.event}${order.company ? `: ${order.company}` : ""}`,
      html,
      text: `${order.event}\n\n${text}`,
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text().catch(() => "")}`);
  return true;
}
