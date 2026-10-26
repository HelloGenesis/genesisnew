/**
 * THE PROPOSAL'S BOXES IN ANY ORDER (Genesis, 26 Oct 2026: "this entire
 * section should be movable"). The standard boxes and the added sections are
 * one list: `order` holds the standard keys and a "section" for each added
 * section, which fill those places in their own order. Saved with the
 * quote's plan settings; the builder and the client view both follow it.
 */
export const STANDARD_BOXES = ["tg", "problems", "objectives", "influencers", "ideas"] as const;
export const SECTION = "section";

/** The order, made whole: every standard box once, and as many "section" places as there are added sections. */
export function proposalOrder(order: readonly string[] | undefined, sections: number): string[] {
  const std = new Set<string>(STANDARD_BOXES);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of order ?? []) {
    if (t === SECTION) out.push(t);
    else if (std.has(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  /* Older documents, and anything missing: the standard boxes in their usual place, ahead of the sections. */
  const missing = STANDARD_BOXES.filter((k) => !seen.has(k));
  const firstSection = out.indexOf(SECTION);
  out.splice(firstSection < 0 ? out.length : firstSection, 0, ...missing);
  let count = out.filter((t) => t === SECTION).length;
  while (count < sections) {
    out.push(SECTION);
    count++;
  }
  while (count > sections) {
    out.splice(out.lastIndexOf(SECTION), 1);
    count--;
  }
  return out;
}
