import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

import { mcpForChat } from "./ai-connectors";
import { CRM_INSTRUCTIONS, TOOLS } from "./mcp-tools";
import type { Viewer } from "./session";

/**
 * THE CRM'S OWN AI ASSISTANT (Genesis, 27 Oct 2026: "add the AI chat box
 * inside the CRM as well"). The same tools as the ChatGPT / Claude connector
 * (lib/crm/mcp-tools), run as the person chatting with the same rules: find
 * creators, make and update plans from screenshots, sheets and roster PDFs,
 * log reach-outs. Each conversation is kept (crm_ai_chats) so attachments are
 * sent once and the chat can be picked up later.
 *
 * Built so more abilities can join the same tool list later (image, video,
 * avatar and voice generation for Genesis AI Lab): each is one more tool.
 *
 * Env: ANTHROPIC_API_KEY; CRM_CHAT_MODEL to change the model.
 */

const MODEL = () => process.env.CRM_CHAT_MODEL || "claude-opus-5-5";
/* Room for a whole job from one message: a lead, its quote, a project, a task… (Genesis, 28 Oct 2026). */
const MAX_TURNS = 30;

export type ChatEvent =
  | { t: "chat"; id: string }
  | { t: "text"; d: string }
  | { t: "tool"; name: string; label: string }
  | { t: "tool_done"; name: string; ok: boolean }
  | { t: "error"; m: string }
  | { t: "done" };

/* What the person sees while a tool runs. */
const LABEL: Record<string, string> = {
  today: "Checking today's date",
  search_influencers: "Searching the influencer database",
  get_influencer: "Looking up the influencer",
  save_influencers: "Saving to the influencer database",
  list_plans: "Finding plans",
  get_plan: "Reading the plan",
  create_plan: "Making the plan",
  update_plan: "Updating the plan",
  update_plan_sheets: "Updating the Google Sheets",
  log_reachout: "Logging the reach-out",
  search_crm: "Searching the CRM",
  get_quote: "Reading the quote",
  create_quote: "Making the quote",
  update_quote: "Updating the quote",
  save_lead: "Saving the lead",
  save_client: "Saving the client",
  log_note: "Adding a note",
  save_task: "Saving the task",
  save_subscription: "Saving the subscription",
  crm_overview: "Checking the numbers",
  save_project: "Saving the project",
  create_invoice: "Making the invoice",
  add_expense: "Recording the expense",
  save_brief: "Saving the brief",
  update_request: "Updating the request",
  assign_vendor: "Offering the job",
  find_work: "Looking it up",
};

/* The tools in the shape the model takes, inputs streamed as they're written. */
const API_TOOLS: Anthropic.Beta.BetaTool[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: z.toJSONSchema(t.input) as Anthropic.Beta.BetaTool["input_schema"],
  eager_input_streaming: true,
}));

function system(viewer: Viewer) {
  return `You are Genesis Media's CRM assistant, chatting with ${viewer.name ?? viewer.email ?? "a team member"} inside the CRM. Answer in plain, short English; use the tools to read and change the CRM rather than guessing, and say what you changed with links to it. Files the person attaches (screenshots, Excel/CSV as text, PDFs) are in their message.

${CRM_INSTRUCTIONS}

Right now it is ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}, ${new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} (India time); work out dates like "a week ago" or "next Friday" from it, or call today for the exact dates.`;
}

export type Attachment = { kind: "image"; media_type: string; data: string; name: string } | { kind: "pdf"; data: string; name: string } | { kind: "sheet"; text: string; name: string };

/** The person's message, with what they attached, as the model's content blocks. */
function userContent(text: string, files: Attachment[]): Anthropic.Beta.BetaContentBlockParam[] {
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const f of files) {
    if (f.kind === "image") blocks.push({ type: "image", source: { type: "base64", media_type: f.media_type as "image/jpeg", data: f.data } });
    else if (f.kind === "pdf") blocks.push({ type: "document", title: f.name, source: { type: "base64", media_type: "application/pdf", data: f.data } });
    else blocks.push({ type: "text", text: `Attached spreadsheet "${f.name}" (tab-separated, first row is the header):\n${f.text}` });
  }
  blocks.push({ type: "text", text: text || "(see the attachments)" });
  return blocks;
}

type StreamLike = {
  on(event: "text", cb: (delta: string) => void): unknown;
  finalMessage(): Promise<Anthropic.Beta.BetaMessage>;
};
/** The model call; a stand-in can be passed for tests. */
export type ModelCall = (params: Anthropic.Beta.MessageCreateParamsStreaming) => StreamLike;

const defaultCall: ModelCall = (params) => new Anthropic().beta.messages.stream(params);

/**
 * One turn of a conversation: the person's message, then the model and the
 * tools back and forth until it answers. Events go to `emit` as they happen;
 * the conversation is saved whenever it's in a complete state.
 */
/** How hard it thinks, from the chat box's mode (Genesis, 27 Oct 2026): a quick answer, balanced (the model's default), or deep. */
const EFFORT = { quick: "low", balanced: "medium", deep: "high" } as const;
export type ChatMode = keyof typeof EFFORT;

export async function runChat(viewer: Viewer, input: { chatId?: string | null; text: string; files: Attachment[]; mode?: ChatMode }, emit: (e: ChatEvent) => void, call: ModelCall = defaultCall) {
  const prisma = getPrisma();
  const existing = input.chatId ? await prisma.aiChat.findFirst({ where: { id: input.chatId, userId: viewer.id } }) : null;
  const chat = existing ?? (await prisma.aiChat.create({ data: { userId: viewer.id, title: (input.text || input.files[0]?.name || "New chat").slice(0, 80), messages: [] } }));
  emit({ t: "chat", id: chat.id });
  const messages = [...((chat.messages ?? []) as unknown as Anthropic.Beta.BetaMessageParam[]), { role: "user", content: userContent(input.text, input.files) } as Anthropic.Beta.BetaMessageParam];
  const save = (list: Anthropic.Beta.BetaMessageParam[]) => prisma.aiChat.update({ where: { id: chat.id }, data: { messages: list as unknown as Prisma.InputJsonValue } });
  await save(messages);

  /* The apps connected to this CRM (lib/crm/ai-connectors): their tools, run by Anthropic's MCP connector. */
  const apps = await mcpForChat(viewer.ws ?? null);
  let retries = 0;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = call({
      model: MODEL(),
      max_tokens: 64000,
      system: system(viewer),
      tools: [...API_TOOLS, ...apps.toolsets],
      ...(apps.servers.length ? { mcp_servers: apps.servers } : {}),
      messages,
      stream: true,
      /* Effort: the chosen mode; balanced (medium) is this model's default. */
      output_config: { effort: EFFORT[input.mode ?? "balanced"] },
      /* Caches the conversation so far: later turns re-read it at a fraction of the cost. */
      cache_control: { type: "ephemeral" },
      /* A request the model declines is answered by Anthropic's recommended stand-in model instead. */
      betas: ["server-side-fallback-2026-07-01", ...(apps.servers.length ? ["mcp-client-2025-11-20" as const] : [])],
      fallbacks: "default",
    });
    stream.on("text", (d) => emit({ t: "text", d }));
    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
      retries = 0;
    } catch (error) {
      /* A tool input that couldn't be read at all: asked again, twice at most. API errors go up. */
      if (error instanceof Anthropic.APIError || retries++ >= 2) throw error;
      continue;
    }

    if (message.stop_reason === "refusal") {
      emit({ t: "text", d: "\n\nI can't help with that request." });
      break;
    }
    /* A connected app's tools it used (run by Anthropic's MCP connector): "Canva: create design". */
    for (const b of message.content) if (b.type === "mcp_tool_use") emit({ t: "tool", name: b.name, label: `${apps.names[b.server_name] ?? b.server_name}: ${b.name.replace(/[_-]+/g, " ")}` });
    messages.push({ role: "assistant", content: message.content as Anthropic.Beta.BetaContentBlockParam[] });
    if (message.stop_reason === "pause_turn") continue;
    const uses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (!uses.length) {
      await save(messages);
      break;
    }
    if (message.stop_reason === "max_tokens") {
      /* A tool call cut off mid-input is never run. */
      messages.pop();
      emit({ t: "error", m: "That answer ran too long. Try asking for less at once." });
      break;
    }

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const use of uses) {
      const tool = TOOLS.find((t) => t.name === use.name);
      emit({ t: "tool", name: use.name, label: LABEL[use.name] ?? use.name });
      if (!tool) {
        results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: `Unknown tool ${use.name}` });
        emit({ t: "tool_done", name: use.name, ok: false });
        continue;
      }
      /* Checked against the tool's schema before it runs (inputs are streamed and not checked by the API). */
      const parsed = tool.input.safeParse(use.input);
      if (!parsed.success) {
        results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: `Invalid input: ${parsed.error.message.slice(0, 600)}` });
        emit({ t: "tool_done", name: use.name, ok: false });
        continue;
      }
      try {
        const out = await tool.run(viewer, parsed.data as never);
        results.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify(out).slice(0, 100_000) });
        emit({ t: "tool_done", name: use.name, ok: true });
      } catch (error) {
        results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: (error as Error).message.slice(0, 600) });
        emit({ t: "tool_done", name: use.name, ok: false });
      }
    }
    /* All results together in one message. */
    messages.push({ role: "user", content: results });
    await save(messages);
  }
  emit({ t: "done" });
}

/** The person's recent chats, for the list. */
export async function recentChats(userId: string) {
  return getPrisma().aiChat.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 30, select: { id: true, title: true, updatedAt: true } });
}

/** A chat's messages as the page shows them: the person's words and files, the assistant's words, and which tools ran. */
export async function chatForView(userId: string, id: string) {
  const chat = await getPrisma().aiChat.findFirst({ where: { id, userId } });
  if (!chat) return null;
  const out: { role: "user" | "assistant"; text: string; files?: string[]; tools?: string[] }[] = [];
  for (const m of (chat.messages ?? []) as unknown as Anthropic.Beta.BetaMessageParam[]) {
    const blocks = typeof m.content === "string" ? [{ type: "text", text: m.content }] : (m.content as { type: string; text?: string; name?: string; title?: string }[]);
    if (m.role === "user") {
      if (blocks.every((b) => b.type === "tool_result")) continue;
      const texts = blocks.filter((b) => b.type === "text" && !b.text?.startsWith("Attached spreadsheet")).map((b) => b.text ?? "");
      const files = blocks.flatMap((b) => (b.type === "image" ? ["Image"] : b.type === "document" ? [b.title ?? "PDF"] : b.type === "text" && b.text?.startsWith("Attached spreadsheet") ? [b.text.match(/"([^"]+)"/)?.[1] ?? "Sheet"] : []));
      out.push({ role: "user", text: texts.join("\n"), files });
    } else {
      const text = blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
      const tools = blocks.filter((b) => b.type === "tool_use").map((b) => LABEL[b.name ?? ""] ?? b.name ?? "");
      const last = out.at(-1);
      /* Turns of one answer shown as one message. */
      if (last?.role === "assistant") {
        last.text += text;
        last.tools = [...(last.tools ?? []), ...tools];
      } else out.push({ role: "assistant", text, tools });
    }
  }
  return { id: chat.id, title: chat.title, messages: out };
}
