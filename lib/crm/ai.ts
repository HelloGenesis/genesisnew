import "server-only";

import { recordCall, type Usage } from "./ai-usage";

/**
 * THE AI THAT READS THE INBOX (Genesis, 12 Oct 2026: "AI reads it"). Claude
 * sorts an email or a document into what Genesis cares about and pulls out
 * the details, as structured fields (a forced tool call, so the answer is
 * always JSON in one shape).
 *
 * Env: ANTHROPIC_API_KEY; CRM_AI_MODEL to override the model.
 */

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = () => process.env.CRM_AI_MODEL || "claude-haiku-5-5";

export type Reading = {
  kind: "BRIEF" | "CLIENT" | "VENDOR" | "INVOICE" | "PROPOSAL" | "LINK" | "OTHER";
  confidence: number;
  summary: string;
  contact?: { name?: string; email?: string; phone?: string; company?: string; role?: string };
  brief?: {
    title?: string;
    division?: "AI_LAB" | "STUDIOS" | "BRAND_DESIGN" | "INFLUENCE";
    services?: string[];
    objective?: string;
    audience?: string;
    deliverables?: string;
    platforms?: string[];
    budgetRupees?: number;
    deadline?: string;
  };
  company?: { name?: string; legalName?: string; gstin?: string; address?: string; city?: string; website?: string; services?: string; rates?: string };
  invoice?: { number?: string; direction?: "RECEIVED" | "SENT"; party?: string; amountRupees?: number; gstRupees?: number; date?: string; dueDate?: string; description?: string };
  links?: { url: string; label?: string }[];
};

const SCHEMA = {
  type: "object",
  required: ["kind", "confidence", "summary"],
  properties: {
    kind: {
      type: "string",
      enum: ["BRIEF", "CLIENT", "VENDOR", "INVOICE", "PROPOSAL", "LINK", "OTHER"],
      description:
        "BRIEF: someone (a brand, agency or person) asking Genesis for work, a quote, a proposal, a campaign or a collaboration, or a brief being shared. CLIENT: a client's business details (billing name, GSTIN, address, contacts) without a new ask. VENDOR: a supplier, freelancer, creator or creator agency offering services or sharing their details and rates. INVOICE: a bill or invoice, received or sent. PROPOSAL: a proposal, quote, deck or pitch Genesis made or shared. LINK: important working links worth keeping on a client (Canva, Drive folders, decks, reference videos). OTHER: anything else (newsletters, personal, internal chatter, notifications).",
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    summary: { type: "string", description: "One or two plain sentences: who, what they want or what this is." },
    contact: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, company: { type: "string" }, role: { type: "string" } } },
    brief: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short title, e.g. 'Cosmx app launch — influencer campaign'" },
        division: { type: "string", enum: ["AI_LAB", "STUDIOS", "BRAND_DESIGN", "INFLUENCE"] },
        services: { type: "array", items: { type: "string" } },
        objective: { type: "string" },
        audience: { type: "string" },
        deliverables: { type: "string" },
        platforms: { type: "array", items: { type: "string" } },
        budgetRupees: { type: "number" },
        deadline: { type: "string", description: "YYYY-MM-DD if a date is given" },
      },
    },
    company: { type: "object", properties: { name: { type: "string" }, legalName: { type: "string" }, gstin: { type: "string" }, address: { type: "string" }, city: { type: "string" }, website: { type: "string" }, services: { type: "string" }, rates: { type: "string" } } },
    invoice: {
      type: "object",
      properties: {
        number: { type: "string" },
        direction: { type: "string", enum: ["RECEIVED", "SENT"], description: "RECEIVED: a bill Genesis has to pay. SENT: Genesis billing a client." },
        party: { type: "string" },
        amountRupees: { type: "number", description: "Total including GST" },
        gstRupees: { type: "number" },
        date: { type: "string" },
        dueDate: { type: "string" },
        description: { type: "string" },
      },
    },
    links: { type: "array", items: { type: "object", required: ["url"], properties: { url: { type: "string" }, label: { type: "string" } } } },
  },
};

const SYSTEM = `You read emails and documents for Genesis Media, a Mumbai agency with four divisions: AI Lab (AI videos, AI avatars, voice and localisation, automation, games and apps), Studios (shoots, UGC, ad films, events), Brand & Design (identity, packaging, social design, websites) and Influence (influencer and UGC campaigns, creator collaborations). Genesis staff use @genesismedia.co addresses.

Sort what you're given into one kind and pull out every detail that's actually there. Never invent values: leave a field out if it isn't stated. Amounts are in Indian rupees (convert "2.5L" to 250000, "1 cr" to 10000000). Treat automated notifications, newsletters, promotions, OTPs, calendar invites and personal mail as OTHER. A brand or agency asking for a quote, pricing, a proposal, a campaign, a shoot or a collaboration is a BRIEF even if it's short.`;

/** Reads one email or document. Null when the AI isn't configured or the call fails (the item is retried next run). */
export async function readItem(input: { source: string; from?: string; to?: string; subject: string; date?: string; text: string; links: string[]; attachments?: string[] }): Promise<Reading | null> {
  if (!aiConfigured()) return null;
  const content = [
    `Source: ${input.source}`,
    input.from ? `From: ${input.from}` : "",
    input.to ? `To: ${input.to}` : "",
    input.date ? `Date: ${input.date}` : "",
    `Subject / title: ${input.subject}`,
    input.attachments?.length ? `Attachments: ${input.attachments.join(", ")}` : "",
    input.links.length ? `Links in it:\n${input.links.slice(0, 30).join("\n")}` : "",
    "",
    input.text.slice(0, 12_000),
  ]
    .filter(Boolean)
    .join("\n");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL(),
      max_tokens: 1500,
      system: SYSTEM,
      tools: [{ name: "record", description: "Record what this is and its details.", input_schema: SCHEMA }],
      tool_choice: { type: "tool", name: "record" },
      messages: [{ role: "user", content }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    console.error("[crm] AI read failed", response.status, (await response.text()).slice(0, 300));
    return null;
  }
  const body = (await response.json()) as { content?: { type: string; input?: unknown }[]; usage?: Usage };
  await recordCall("inbox", MODEL(), body.usage);
  const call = body.content?.find((c) => c.type === "tool_use");
  return (call?.input as Reading | undefined) ?? null;
}

/** Matches a sheet's columns to CRM fields: returns { column header: field }. */
export async function mapColumns(kind: string, fields: Record<string, string>, headers: string[], sample: string[][]): Promise<Record<string, string>> {
  if (!aiConfigured()) return {};
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL(),
      max_tokens: 1000,
      tools: [
        {
          name: "map",
          description: "Map spreadsheet columns to CRM fields.",
          input_schema: { type: "object", required: ["mapping"], properties: { mapping: { type: "array", items: { type: "object", required: ["column", "field"], properties: { column: { type: "string" }, field: { type: "string", enum: Object.keys(fields) } } } } } },
        },
      ],
      tool_choice: { type: "tool", name: "map" },
      messages: [
        {
          role: "user",
          content: `Importing ${kind} into a CRM. Fields: ${Object.entries(fields).map(([k, v]) => `${k} (${v})`).join("; ")}.\nColumns: ${JSON.stringify(headers)}\nFirst rows: ${JSON.stringify(sample.slice(0, 5))}\nMap each column that clearly fits a field; leave the rest out. One column per field.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) return {};
  const body = (await response.json()) as { content?: { type: string; input?: { mapping?: { column: string; field: string }[] } }[]; usage?: Usage };
  await recordCall("import", MODEL(), body.usage);
  const pairs = body.content?.find((c) => c.type === "tool_use")?.input?.mapping ?? [];
  return Object.fromEntries(pairs.filter((p) => headers.includes(p.column) && p.field in fields).map((p) => [p.column, p.field]));
}
