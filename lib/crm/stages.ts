import type { Division } from "@/lib/generated/prisma/enums";

/**
 * HOW A PROJECT MOVES, FROM WON TO DELIVERED (Genesis, 10 Oct 2026):
 *
 *   Lead won → Ideation & scripting → Influencer / creator or AI avatar (if
 *   any) → Approvals → First cut (for AI: images only, with music and the
 *   rest) → Second cut → Third cut / final delivery.
 *
 * "It may vary from service to service", so each service has its own
 * template, picked when the project opens (from the product, the quote or the
 * division) and copied onto the project, where the producer can still change
 * it. A project's stages are its own list from then on (Project.stages).
 */

export type StageTemplate = { key: string; label: string; stages: readonly string[] };

export const TEMPLATES: readonly StageTemplate[] = [
  {
    key: "ai-video",
    label: "AI video (no avatar)",
    stages: ["Lead won", "Ideation & scripting", "Approvals", "First cut: image draft + music", "Second cut", "Third cut / final delivery"],
  },
  {
    key: "ai-avatar",
    label: "AI avatar videos",
    stages: ["Lead won", "Ideation & scripting", "AI avatar & voice clone", "Approvals", "First cut: image draft + music", "Second cut", "Third cut / final delivery"],
  },
  {
    key: "ugc",
    label: "UGC / creator content",
    stages: ["Lead won", "Ideation & scripting", "Creator selection", "Approvals", "Shoot / creator drafts", "First cut", "Second cut", "Third cut / final delivery"],
  },
  {
    key: "influencer-campaign",
    label: "Influencer campaign",
    stages: ["Lead won", "Ideation & briefs", "Influencer shortlist", "Approvals", "Creator drafts", "Content live", "Report"],
  },
  {
    key: "studio-shoot",
    label: "Studios shoot & edit",
    stages: ["Lead won", "Ideation & scripting", "Talent & shoot planning", "Approvals", "Shoot", "First cut", "Second cut", "Third cut / final delivery"],
  },
  {
    key: "event",
    label: "Event coverage",
    stages: ["Lead won", "Event brief & run sheet", "Crew planning", "Approvals", "Event shoot", "First cut", "Final delivery"],
  },
  {
    key: "design",
    label: "Brand & design",
    stages: ["Lead won", "Discovery & moodboard", "Concepts", "Approvals", "First draft", "Second draft", "Final files"],
  },
  {
    key: "monthly-plan",
    label: "Monthly content plan",
    stages: ["Month opened", "Ideation & scripting", "Approvals", "First cut", "Second cut", "Final delivery"],
  },
];

const byKey = new Map(TEMPLATES.map((t) => [t.key, t]));

/** The template for a piece of work: from the product's name when there is one, otherwise the division. */
export function templateFor(division: Division, productName?: string | null, membership = false): StageTemplate {
  const name = (productName ?? "").toLowerCase();
  if (membership) return byKey.get("monthly-plan")!;
  if (/avatar/.test(name)) return byKey.get("ai-avatar")!;
  if (/ugc/.test(name)) return byKey.get("ugc")!;
  if (/influencer|campaign management/.test(name)) return byKey.get("influencer-campaign")!;
  if (/event/.test(name)) return byKey.get("event")!;
  switch (division) {
    case "AI_LAB":
      return byKey.get("ai-video")!;
    case "STUDIOS":
      return byKey.get("studio-shoot")!;
    case "BRAND_DESIGN":
      return byKey.get("design")!;
    case "INFLUENCE":
      return byKey.get(/ugc/.test(name) ? "ugc" : "influencer-campaign")!;
    case "CRM":
      return byKey.get("monthly-plan")!;
  }
}

export const templateByKey = (key: string | null | undefined) => (key ? byKey.get(key) : undefined);

/** A project's stages: its own list, or (for one opened before templates) the division's template. */
export function stagesOf(project: { stages: string[]; division: Division }): readonly string[] {
  return project.stages.length ? project.stages : templateFor(project.division).stages;
}

export function stageName(project: { stages: string[]; division: Division; stage: number }): string {
  const list = stagesOf(project);
  return list[Math.max(0, Math.min(project.stage, list.length - 1))]!;
}
