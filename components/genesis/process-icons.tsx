import { Fragment } from "react";

import { GlassIcon, type GlassIconName } from "@/components/genesis/glass-icon";
import { Reveal } from "@/components/genesis/reveal";
import { cn } from "@/lib/utils";

/**
 * A DIVISION'S PARAGRAPH, AS A PROCESS (Genesis, 4 Oct 2026: "explain this in
 * process icons, for the other verticals as well — desktop"). The sentence
 * under each homepage division, broken into its steps: a glass icon and a
 * short label each, joined by a gradient rule. Desktop only — a phone keeps
 * the sentence, where five steps across would not fit.
 */
export type ProcessStep = { icon: GlassIconName; label: string };

export const DIVISION_PROCESS: Record<"Influence" | "AI Lab" | "Brand & Design" | "AI Avatars", ProcessStep[]> = {
  /* "From creator discovery to campaign delivery, we connect brands with creators who fit the audience, the idea and the platform…" */
  Influence: [
    { icon: "users", label: "Creator discovery" },
    { icon: "target", label: "Audience fit" },
    { icon: "idea", label: "The idea" },
    { icon: "phone", label: "Right platform" },
    { icon: "rocket", label: "Campaign delivery" },
  ],
  /* "…videos and visuals to branded content … automate the process from ideas and scripts to ready-to-post content." */
  "AI Lab": [
    { icon: "idea", label: "Idea" },
    { icon: "script", label: "Script" },
    { icon: "create", label: "AI production" },
    { icon: "bolt", label: "Automated workflow" },
    { icon: "rocket", label: "Ready to post" },
  ],
  /* "We create realistic AI avatars for founders, creators, artists and brands … consistent content, showcase your products … fewer repeated shoots … automate the entire content workflow." */
  "AI Avatars": [
    /* Genesis's own wording (4 Oct 2026). */
    { icon: "avatar", label: "Create your realistic AI avatar" },
    { icon: "users", label: "For founders, influencers & brands" },
    { icon: "video", label: "Who want consistent content" },
    { icon: "bag", label: "Integrate any products & services" },
    { icon: "bolt", label: "With an automated workflow" },
  ],
  /* "From positioning and visual identity to campaign systems and everyday brand communication … consistent wherever they show up." */
  "Brand & Design": [
    { icon: "target", label: "Positioning" },
    { icon: "brand", label: "Visual identity" },
    { icon: "layers", label: "Campaign systems" },
    { icon: "chat", label: "Brand communication" },
    { icon: "check", label: "Consistent everywhere" },
  ],
};

export function ProcessIcons({
  steps,
  align = "center",
  label,
  className,
  chips = false,
}: {
  steps: readonly ProcessStep[];
  align?: "start" | "center";
  /** What the steps describe, for a screen reader — the sentence they replace. */
  label: string;
  className?: string;
  /** Each step a dark glass pill, joined by arrows (Genesis, 4 Oct 2026). */
  chips?: boolean;
}) {
  if (chips) {
    return (
      <Reveal delay={0.1} className={cn("hidden lg:block", className)}>
        <ol aria-label={label} className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {steps.map((step, index) => (
            <Fragment key={step.label}>
              {index > 0 && (
                <li aria-hidden className="text-[#ffa25c]/70">→</li>
              )}
              <li className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-[rgb(20_18_22/0.72)] py-2 pl-2 pr-4 text-small text-bone shadow-[0_14px_34px_-14px_rgb(0_0_0/0.9),0_0_22px_-12px_rgb(255_143_184/0.5)]">
                <span className="grid size-7 place-items-center rounded-full bg-white/[0.06]">
                  <GlassIcon name={step.icon} className="size-5" />
                </span>
                {step.label}
              </li>
            </Fragment>
          ))}
        </ol>
      </Reveal>
    );
  }
  return (
    <Reveal delay={0.1} className={cn("hidden lg:block", className)}>
      <ol
        aria-label={label}
        className={cn("flex items-start", align === "center" ? "mx-auto max-w-4xl justify-center" : "w-full")}
      >
        {steps.map((step, index) => (
          <Fragment key={step.label}>
            {index > 0 && (
              <li aria-hidden className={cn("mt-6 h-px bg-gradient-to-r from-[#8b5cf6]/50 via-[#ec4899]/50 to-[#f59e0b]/50", align === "start" ? "w-3 shrink-0" : "min-w-3 flex-1")} />
            )}
            {/* In a narrow card the steps share the width, so the last never runs past the edge. */}
            <li className={cn("flex flex-col items-center text-center", align === "start" ? "min-w-0 flex-1" : "w-[8.5rem] shrink-0")}>
              <span className="grid size-12 place-items-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] shadow-[var(--shadow-raised)]">
                <GlassIcon name={step.icon} className="size-8" />
              </span>
              <span className={cn("mt-2.5 text-balance leading-snug text-bone/90", align === "start" ? "text-[0.8125rem]" : "text-small")}>{step.label}</span>
            </li>
          </Fragment>
        ))}
      </ol>
    </Reveal>
  );
}
