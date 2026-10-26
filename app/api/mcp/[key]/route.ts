import { NextResponse } from "next/server";
import { z } from "zod";

import { userForConnectorKey } from "@/lib/crm/mcp-keys";
import { CRM_INSTRUCTIONS as INSTRUCTIONS, TOOLS } from "@/lib/crm/mcp-tools";
import { inWorkspace } from "@/lib/crm/request-workspace";
import { staffAccess, viewerForUser } from "@/lib/crm/session";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * THE CRM AS A CONNECTOR FOR CHATGPT AND CLAUDE (Model Context Protocol,
 * "Streamable HTTP", answered statelessly as plain JSON). The secret link
 * (lib/crm/mcp-keys) says who is asking; the tools (lib/crm/mcp-tools) run
 * as them. GET (a server-sent event stream) isn't offered: every answer
 * comes straight back on the POST.
 */


type RpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const result = (id: RpcRequest["id"], value: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result: value });
const failure = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

export async function GET() {
  return new NextResponse("Use POST (MCP Streamable HTTP).", { status: 405, headers: { Allow: "POST" } });
}
export const DELETE = GET;

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!isDatabaseConfigured()) return NextResponse.json(failure(null, -32603, "Not configured"), { status: 503 });
  const { key } = await params;
  const userId = await userForConnectorKey(key);
  const viewer = userId ? await viewerForUser(userId) : null;
  if (!viewer || staffAccess(viewer) === "forbidden" || staffAccess(viewer) === "signin") {
    return NextResponse.json(failure(null, -32001, "This connector link isn't valid any more. Make a new one in the CRM: Setup → Integrations → ChatGPT / Claude."), { status: 401 });
  }
  let body: RpcRequest | RpcRequest[];
  try {
    body = (await request.json()) as RpcRequest | RpcRequest[];
  } catch {
    return NextResponse.json(failure(null, -32700, "Parse error"), { status: 400 });
  }
  const batch = Array.isArray(body) ? body : [body];
  const answers = [];
  for (const msg of batch) {
    /* Notifications (no id) need no answer. */
    if (msg.id === undefined || msg.id === null) continue;
    answers.push(await handle(msg, viewer));
  }
  if (!answers.length) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? answers : answers[0]);
}

async function handle(msg: RpcRequest, viewer: NonNullable<Awaited<ReturnType<typeof viewerForUser>>>) {
  switch (msg.method) {
    case "initialize":
      return result(msg.id, {
        protocolVersion: typeof msg.params?.protocolVersion === "string" ? msg.params.protocolVersion : "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "genesis-crm", title: "Genesis Media CRM", version: "1.0.0" },
        instructions: INSTRUCTIONS,
      });
    case "ping":
      return result(msg.id, {});
    case "tools/list":
      return result(msg.id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: z.toJSONSchema(t.input),
          annotations: { readOnlyHint: Boolean(t.readOnly), destructiveHint: false, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return failure(msg.id, -32602, `Unknown tool: ${name}`);
      const parsed = tool.input.safeParse(msg.params?.arguments ?? {});
      if (!parsed.success) return result(msg.id, { isError: true, content: [{ type: "text", text: `Invalid arguments: ${parsed.error.message.slice(0, 800)}` }] });
      try {
        /* In this person's own CRM (an agency's, or Genesis's): lib/crm/request-workspace. */
        const out = await inWorkspace(viewer.ws, () => tool.run(viewer, parsed.data as never));
        const structured = out && typeof out === "object" && !Array.isArray(out) ? (out as Record<string, unknown>) : { result: out };
        return result(msg.id, { content: [{ type: "text", text: JSON.stringify(out, null, 1) }], structuredContent: structured });
      } catch (error) {
        return result(msg.id, { isError: true, content: [{ type: "text", text: (error as Error).message.slice(0, 600) }] });
      }
    }
    default:
      return failure(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}
