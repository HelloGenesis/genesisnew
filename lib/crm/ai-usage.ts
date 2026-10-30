import "server-only";

import { getPrisma } from "@/lib/db";

/**
 * AI USAGE (Genesis, 30 Oct 2026: "show usage to each user"): every call the
 * CRM makes to Claude, with its tokens and what it cost, so each person sees
 * their own Copilot use and the owners see everyone's (/admin/usage).
 * Background reading of the inbox and sheet imports are recorded without a
 * person.
 */

export type UsageSource = "copilot" | "inbox" | "import";
export const SOURCE_LABEL: Record<UsageSource, string> = { copilot: "Nova Copilot", inbox: "Reading the inbox", import: "Sheet imports" };

/** The parts of a response's `usage` this keeps. */
export type Usage = { input_tokens?: number | null; output_tokens?: number | null; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };

/*
 * US dollars per million tokens, input / output (Anthropic's prices, Oct 2026).
 * Haiku 5.5 has a second, higher card for a prompt over 100K tokens. Cache
 * reads cost 0.1x the input rate and 5-minute cache writes 1.25x.
 */
const RATES: [match: RegExp, small: [number, number], large?: [number, number]][] = [
  [/haiku-5-5/, [0.1, 0.5], [0.5, 2.5]],
  [/sonnet-5-5/, [2, 10]],
  [/opus-5-5/, [4, 20]],
];

/** What one response cost, in millionths of a dollar. Unknown models are priced as Opus, so they're never undercounted. */
export function costMicros(model: string, u: Usage) {
  const input = u.input_tokens ?? 0, output = u.output_tokens ?? 0, read = u.cache_read_input_tokens ?? 0, write = u.cache_creation_input_tokens ?? 0;
  const rate = RATES.find(([m]) => m.test(model)) ?? RATES.at(-1)!;
  const [inRate, outRate] = rate[2] && input + read + write > 100_000 ? rate[2] : rate[1];
  return Math.round(inRate * (input + read * 0.1 + write * 1.25) + outRate * output);
}

/** Adds one response's usage to a running total (a Copilot answer is several responses). */
export function addUsage(total: Required<{ [K in keyof Usage]: number }> & { cost: number }, model: string, u: Usage | null | undefined) {
  if (!u) return total;
  total.input_tokens += u.input_tokens ?? 0;
  total.output_tokens += u.output_tokens ?? 0;
  total.cache_read_input_tokens += u.cache_read_input_tokens ?? 0;
  total.cache_creation_input_tokens += u.cache_creation_input_tokens ?? 0;
  total.cost += costMicros(model, u);
  return total;
}
export const emptyUsage = () => ({ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, cost: 0 });

/** Saves a call's (or an answer's) usage. Never throws: a missed record mustn't break the answer. */
export async function recordUsage(row: { userId: string | null; source: UsageSource; model: string; chatId?: string | null; usage: ReturnType<typeof emptyUsage> }) {
  const u = row.usage;
  if (!u.input_tokens && !u.output_tokens && !u.cache_read_input_tokens && !u.cache_creation_input_tokens) return;
  await getPrisma()
    .aiUsage.create({
      data: {
        userId: row.userId,
        source: row.source,
        model: row.model,
        chatId: row.chatId ?? null,
        inputTokens: u.input_tokens,
        outputTokens: u.output_tokens,
        cacheReadTokens: u.cache_read_input_tokens,
        cacheWriteTokens: u.cache_creation_input_tokens,
        costMicros: u.cost,
      },
    })
    .catch((error) => console.error("[crm] AI usage not recorded", (error as Error).message));
}

/** A raw response's usage, recorded for a background call. */
export const recordCall = (source: UsageSource, model: string, usage: Usage | undefined, userId: string | null = null) => recordUsage({ userId, source, model, usage: addUsage(emptyUsage(), model, usage) });

/** Dollars from millionths, for the page: "$0.42", "$0.0031" for tiny sums. */
export function dollars(micros: number) {
  const d = micros / 1e6;
  return d === 0 ? "$0" : d < 0.01 ? `$${d.toFixed(4)}` : `$${d.toFixed(2)}`;
}
