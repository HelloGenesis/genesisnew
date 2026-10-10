"use client";

import { Check, ChevronDown } from "lucide-react";

import { aiVideoTiers } from "@/lib/verticals/ai-labs";
import { cn } from "@/lib/utils";

/*
  "6 Standard AI Videos", "Up to 2 Advanced Videos", "8 Premium Videos" — a
  kind of video named in a list. Not "Advanced Video Edit" (an add-on) or
  "Standard AI Video format" (which is itself the definition).
*/
const TIER_IN_TEXT = /\b(Standard|Premium|Advanced)\b(?:\s+(?:AI|Short-Form))?\s+Videos?\b(?!\s+(?:Edit|format))/i;

export type TierDetail = { lead?: string; items: readonly string[] };

/*
  LINES THAT DEFINE A KIND OF VIDEO rather than add to the package — "Standard
  AI Video format: …", "1–3 AI-generated motion clips per video …". In a
  list they fold into the "What's in each video" dropdown of the line they
  explain (Genesis, 3 Oct 2026: "hide this from here, and add it below
  What's in each video").
*/
export const DEFINES_VIDEO = /^(Standard AI Video format\b|1–3 AI-generated motion clips per)/i;

/** A video type's list, led by the product's own lines that define it. */
export function withDefinitions(detail: TierDetail | undefined, includes: readonly string[]): TierDetail | undefined {
  if (!detail) return undefined;
  const own = includes.filter((item) => DEFINES_VIDEO.test(item));
  return own.length ? { ...detail, items: [...own, ...detail.items.filter((item) => !own.includes(item))] } : detail;
}

/** The kind of video a line names, if any: "standard", "premium" or "advanced". */
export function tierIn(text: string): "standard" | "premium" | "advanced" | null {
  const match = text.match(TIER_IN_TEXT);
  return match ? (match[1].toLowerCase() as "standard" | "premium" | "advanced") : null;
}

/** What an AI video of the kind a line names includes — from aiVideoTiers. */
export function aiTierDetail(text: string): TierDetail | undefined {
  const tier = tierIn(text);
  if (!tier) return undefined;
  const found = aiVideoTiers.tiers.find((t) => t.name.toLowerCase().startsWith(tier));
  if (!found) return undefined;
  return { lead: "lead" in found ? found.lead : undefined, items: found.includes };
}

/**
 * A LINE THAT NAMES A KIND OF VIDEO, WITH WHAT IT INCLUDES UNDER IT (Genesis,
 * 3 Oct 2026: "wherever Standard and Advanced videos are mentioned, add a
 * dropdown inside it only to see what's mentioned"). The line reads as it
 * did; a small "What's in each video" opens the list in place. A click on it
 * never reaches the card around it, which opens a pop-up of its own.
 */
export function VideoTierLine({ text, detail, className }: { text: string; detail?: TierDetail; className?: string }) {
  if (!detail?.items.length || !tierIn(text)) return <span className={className}>{text}</span>;
  return (
    <span className={cn("block min-w-0", className)}>
      {text}
      <details className="group/tier mt-1" onClick={(event) => event.stopPropagation()}>
        <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-full text-small text-ash transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
          What&rsquo;s in each video
          <ChevronDown aria-hidden className="size-3.5 transition-transform duration-300 group-open/tier:rotate-180" />
        </summary>
        {detail.lead && <span className="mt-2 block text-small text-faint">{detail.lead}</span>}
        <ul className="mt-2.5 space-y-1.5">
          {detail.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-small leading-snug text-bone/90">
              <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-brand-ink" />
              {item}
            </li>
          ))}
        </ul>
      </details>
    </span>
  );
}
