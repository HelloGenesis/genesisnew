import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

import { getPrisma } from "@/lib/db";
import { razorpayKeys } from "@/lib/razorpay";

import { googleConfigured } from "./google";
import { connectorKeys } from "./mcp-keys";
import { emailConfigured } from "./notify";
import type { Viewer } from "./session";

/**
 * CONNECTORS FOR THE CRM ASSISTANT (Genesis, 27 Oct 2026: "add connectors
 * here, show what all is connected, and other plugins like Canva, Higgsfield,
 * other AI models; basically any platform can be connected here").
 *
 * Two kinds. BUILT IN: what the CRM itself is wired to (Google, Razorpay,
 * email, Claude, the ChatGPT/Claude connector, Higgsfield), shown with whether
 * it's on. ADDED: any app with a remote MCP server (Canva, Notion, Linear,
 * Zapier — which reaches thousands of apps — and so on). An owner adds its
 * link (and a token if the app needs one); the assistant then uses that app's
 * tools through Anthropic's MCP connector (lib/crm/assistant). Each CRM (an
 * agency's too) has its own list; tokens are sealed at rest.
 */

export type AddedConnector = { id: string; name: string; slug: string; url: string; token: string | null; enabled: boolean; addedBy: string | null; addedAt: string };
export type ConnectorView = Omit<AddedConnector, "token"> & { hasToken: boolean };

const keyOf = (ws: string | null) => `ai-connectors:${ws ?? "genesis"}`;

function key(): Buffer {
  const secret = process.env.CRM_SESSION_SECRET || process.env.AUTH0_SECRET || process.env.CRM_DEV_SECRET || "genesis-local-development-only";
  return createHash("sha256").update(`crm-connectors:${secret}`).digest();
}
const seal = (value: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
};
const unseal = (sealed: string) => {
  try {
    const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv!);
    decipher.setAuthTag(tag!);
    return Buffer.concat([decipher.update(body!), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
};

async function read(ws: string | null): Promise<AddedConnector[]> {
  const row = await getPrisma().appSetting.findUnique({ where: { key: keyOf(ws) } });
  try {
    return row ? (JSON.parse(row.value) as AddedConnector[]) : [];
  } catch {
    return [];
  }
}
async function write(ws: string | null, list: AddedConnector[]) {
  const value = JSON.stringify(list);
  await getPrisma().appSetting.upsert({ where: { key: keyOf(ws) }, create: { key: keyOf(ws), value }, update: { value } });
}

/** The added connectors, without their tokens. */
export async function addedConnectors(ws: string | null): Promise<ConnectorView[]> {
  return (await read(ws)).map(({ token, ...c }) => ({ ...c, hasToken: Boolean(token) }));
}

export async function addConnector(ws: string | null, by: string, input: { name: string; url: string; token?: string | null }) {
  const list = await read(ws);
  const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "app";
  let slug = base;
  for (let n = 2; list.some((c) => c.slug === slug); n++) slug = `${base}-${n}`;
  const made: AddedConnector = { id: randomUUID(), name: input.name.slice(0, 60), slug, url: input.url, token: input.token ? seal(input.token) : null, enabled: true, addedBy: by, addedAt: new Date().toISOString() };
  await write(ws, [...list, made]);
  return made.id;
}

export async function setConnector(ws: string | null, id: string, change: { enabled?: boolean; remove?: boolean }) {
  const list = await read(ws);
  await write(ws, change.remove ? list.filter((c) => c.id !== id) : list.map((c) => (c.id === id ? { ...c, ...(change.enabled !== undefined ? { enabled: change.enabled } : {}) } : c)));
}

/** For the assistant's request: the switched-on connectors as MCP servers and their toolsets. */
export async function mcpForChat(ws: string | null) {
  const on = (await read(ws)).filter((c) => c.enabled);
  return {
    servers: on.map((c) => {
      const token = c.token ? unseal(c.token) : null;
      return { type: "url" as const, url: c.url, name: c.slug, ...(token ? { authorization_token: token } : {}) };
    }),
    toolsets: on.map((c) => ({ type: "mcp_toolset" as const, mcp_server_name: c.slug })),
    names: Object.fromEntries(on.map((c) => [c.slug, c.name])) as Record<string, string>,
  };
}

/** What the CRM itself is wired to, and whether each is on, for this person. */
export async function builtInConnectors(viewer: Viewer) {
  const google = googleConfigured() ? await getPrisma().googleConnection.findUnique({ where: { userId: viewer.id }, select: { status: true, scopes: true } }) : null;
  const googleOn = google?.status === "ACTIVE";
  return [
    { key: "claude", name: "Claude (Anthropic)", what: "The assistant's AI model", on: Boolean(process.env.ANTHROPIC_API_KEY) },
    { key: "google", name: "Google: Gmail, Drive, Sheets", what: googleOn ? `Connected${google?.scopes.includes("auth/contacts") ? ", with Contacts" : ""}` : "Connect in Inbox", on: googleOn, href: "/admin/inbox" },
    { key: "razorpay", name: "Razorpay", what: "Payment links on quotes and invoices", on: Boolean(razorpayKeys()) },
    { key: "email", name: "Email (Resend)", what: "Quotes, invoices and alerts by email", on: emailConfigured() },
    { key: "chatgpt", name: "ChatGPT / Claude connector", what: "Use this CRM from your own ChatGPT or Claude", on: (await connectorKeys(viewer.id)).length > 0, href: "/admin/settings" },
    { key: "higgsfield", name: "Higgsfield", what: "Images and video for Genesis AI Lab", on: Boolean(process.env.HIGGSFIELD_API_KEY_ID && process.env.HIGGSFIELD_API_KEY_SECRET) },
  ];
}
