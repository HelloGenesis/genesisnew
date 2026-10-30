import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { aiConfigured } from "@/lib/crm/ai";
import { type ChatEvent, runChat } from "@/lib/crm/assistant";
import { inWorkspace } from "@/lib/crm/request-workspace";
import { NoCredits, refundNovaAi, spendNovaAi } from "@/lib/crm/nova-ai";
import { usesAi, usesNovaAi } from "@/lib/crm/scope";
import { getViewer, staffAccess } from "@/lib/crm/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* A turn with several tool calls can take a few minutes. */
export const maxDuration = 300;

/* Attachments arrive base64 (images shrunk in the browser); the whole request stays under the host's ~4.5 MB limit. */
const Body = z.object({
  chatId: z.string().max(40).nullable().optional(),
  text: z.string().max(20_000),
  mode: z.enum(["quick", "balanced", "deep"]).optional(),
  files: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("image"), media_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]), data: z.string().max(3_000_000), name: z.string().max(200) }),
        z.object({ kind: z.literal("pdf"), data: z.string().max(4_000_000), name: z.string().max(200) }),
        z.object({ kind: z.literal("sheet"), text: z.string().max(400_000), name: z.string().max(200) }),
      ]),
    )
    .max(12),
});

/** The CRM assistant (lib/crm/assistant): one message in, the answer streamed back as lines of JSON. */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (staffAccess(viewer) !== "granted") return NextResponse.json({ error: "Sign in to the CRM first." }, { status: 401 });
  const nova = !usesAi(viewer!) && usesNovaAi(viewer!);
  if (!usesAi(viewer!) && !nova) return NextResponse.json({ error: "Genesis Copilot is open to the owners only." }, { status: 403 });
  if (viewer!.demo) return NextResponse.json({ error: "NOVA AI isn't part of the demo. Start your free trial to get 5 free requests." }, { status: 403 });
  if (!aiConfigured()) return NextResponse.json({ error: "The AI isn't set up yet (ANTHROPIC_API_KEY)." }, { status: 503 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That message or its files are too large, or not a supported type." }, { status: 400 });
  /* NOVA AI: one credit a request, quick mode only (lib/crm/nova-ai). */
  let useId: string | null = null;
  if (nova) {
    try {
      useId = await spendNovaAi(viewer!.workspaceId!, viewer!.id);
    } catch (error) {
      if (error instanceof NoCredits) return NextResponse.json({ error: error.message, topUp: true }, { status: 402 });
      throw error;
    }
    parsed.data.mode = "quick";
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
      try {
        /* In this person's own CRM (an agency's, or Genesis's). */
        await inWorkspace(viewer!.ws, () => runChat(viewer!, parsed.data, emit));
      } catch (error) {
        const m =
          error instanceof Anthropic.RateLimitError ? "The AI is busy right now; try again in a minute."
          : error instanceof Anthropic.AuthenticationError ? "The AI key isn't valid; ask an admin to check ANTHROPIC_API_KEY."
          : error instanceof Anthropic.BadRequestError ? `The AI couldn't take that: ${error.message.slice(0, 200)}`
          : error instanceof Anthropic.APIError ? `The AI had a problem (${error.status}). Try again.`
          : "Something went wrong. Try again.";
        console.error("[assistant]", error);
        if (useId) await refundNovaAi(useId).catch(() => undefined);
        emit({ t: "error", m });
        emit({ t: "done" });
      }
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
