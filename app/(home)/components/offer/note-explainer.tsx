import { ArrowRight } from "lucide-react";

import { GlassIcon, type GlassIconName } from "@/components/genesis/glass-icon";

/* Which icon a workflow step or a note wears, read from its words. */
function stepIcon(text: string): GlassIconName {
  if (/script|brief/i.test(text)) return "script";
  if (/image|timeline|storyboard|keyframe/i.test(text)) return "images";
  if (/generat|video|shoot|production/i.test(text)) return "video";
  if (/final|deliver/i.test(text)) return "delivery";
  return "check";
}

function noteIcon(text: string): GlassIconName {
  if (/reuse|reus|once created|future/i.test(text)) return "repeat";
  if (/charged|quoted|cost|price/i.test(text)) return "receipt";
  if (/posting|influencer/i.test(text)) return "megaphone";
  if (/timeline|week|days/i.test(text)) return "clock";
  return "idea";
}

/** "Script lock" → "Script lock", "Draft 1 image/timeline approval" stays as written. */
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * A PRODUCT'S NOTE, AS A GRAPHIC (Genesis, 3 Oct 2026: "can you explain this
 * in icon graphics or explainer"). A workflow written "a → b → c" becomes a
 * numbered row of icon cards with arrows between them, and every other line
 * gets an icon and its first sentence set as a heading — the words are
 * Genesis's own, only the layout changes.
 */
const FLOW = /^([^:]*?):\s*([^.]*→[^.]*)\.\s*([\s\S]*)$/;

/*
  TWO PARTS, TWO PLACES (Genesis, 3 Oct 2026: "everything below this should be
  out of the box"): the plain notes stay in the panel under what's included;
  a workflow comes out, full width under both boxes, its steps in one row.
*/
export function NoteExplainer({ note, part = "all" }: { note: string; part?: "notes" | "flow" | "all" }) {
  const paragraphs = note
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => part === "all" || (part === "flow") === FLOW.test(p));
  if (paragraphs.length === 0) return null;
  return (
    <div className={part === "flow" ? "mt-10 space-y-5" : "mt-6 space-y-5 rounded-card bg-[var(--hover-wash)] p-4 sm:p-5"}>
      {paragraphs.map((paragraph) => {
        /* "Lead-in: a → b → c. The rest." */
        const flow = paragraph.match(FLOW);
        if (flow) {
          const [, lead, chain, rest] = flow;
          const steps = chain.split("→").map((step) => step.trim()).filter(Boolean);
          return (
            <div key={paragraph}>
              <h3 className="font-sans text-lead text-bone">{sentence(lead.replace(/\s+in Terms & glossary$/i, ""))}</h3>
              <ol className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {steps.map((step, index) => (
                  <li key={step} className="relative flex">
                    <span className="glass-card flex w-full items-center gap-3 rounded-card p-3.5 sm:p-4">
                      <GlassIcon name={stepIcon(step)} className="size-8 shrink-0" />
                      <span>
                        <span className="block text-[0.6875rem] uppercase tracking-[0.12em] text-faint">Step {index + 1}</span>
                        <span className="block text-small leading-snug text-bone">{sentence(step)}</span>
                      </span>
                    </span>
                    {/* The arrow between steps, on the gap — from lg, where they sit in one row. */}
                    {index < steps.length - 1 && (
                      <ArrowRight aria-hidden className="absolute -right-[0.7rem] top-1/2 z-[1] hidden size-4 -translate-y-1/2 text-brand-ink lg:block" />
                    )}
                  </li>
                ))}
              </ol>
              {rest && <p className="mt-4 text-pretty text-small leading-relaxed text-ash sm:text-body">{rest}</p>}
            </div>
          );
        }
        /* A plain note: its icon, the first sentence as a heading, the rest under it. */
        const [first, ...others] = paragraph.split(/(?<=\.)\s+/);
        return (
          <div key={paragraph} className="flex items-start gap-3">
            <GlassIcon name={noteIcon(paragraph)} className="size-9 shrink-0" />
            <p className="text-pretty text-small leading-relaxed text-ash sm:text-body">
              <span className="block text-bone">{first}</span>
              {others.join(" ")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
