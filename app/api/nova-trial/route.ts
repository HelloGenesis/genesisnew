import { NextResponse } from "next/server";
import { z } from "zod";

import { startTrial, TrialProblem } from "@/lib/crm/nova-trial";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,16}$/),
  company: z.string().trim().min(1).max(160),
  agreed: z.literal(true),
});

/** Starts a Nova by Genesis free trial from the Nova page (lib/crm/nova-trial). No card. */
export async function POST(request: Request) {
  const limited = await checkRateLimit(rateLimitKey(request, "nova-trial"));
  if (!limited.success) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path.at(-1));
    const why: Record<string, string> = { email: "Please check the email address.", phone: "Please check the phone number.", agreed: "Please accept the terms to start." };
    return NextResponse.json({ error: why[field] ?? "Please fill in your name, email, phone and agency." }, { status: 400 });
  }
  try {
    const t = await startTrial(parsed.data);
    return NextResponse.json({ ok: true, signIn: "/login?next=/admin", cardDueAt: t.cardDueAt, endsAt: t.endsAt });
  } catch (error) {
    if (error instanceof TrialProblem) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("[nova-trial] start failed", error);
    return NextResponse.json({ error: "The trial couldn't be started. Please try again, or message us on WhatsApp." }, { status: 500 });
  }
}
