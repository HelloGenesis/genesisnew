"use client";

import Image from "next/image";

import { divisionMark } from "@/components/genesis/division-lockup";
import { WordCycler } from "@/components/genesis/word-cycler";
import { cn } from "@/lib/utils";

/**
 * THE DIVISION PAGES' HEADLINE (Genesis, 2 Oct 2026): "Plug Genesis.Influence
 * into your brand. Whenever you need … [their services]", the same sentence
 * on all four pages.
 *
 * The division is its logo, the N and the name, set in the line at the
 * height of the capitals; the h1 still reads "Genesis.Influence" to a screen
 * reader or a search engine. The services take turns after "Whenever you
 * need", sliding up one at a time in the gradient — see WordCycler.
 */
export function PlugHeadline({
  division,
  services,
  align = "start",
  className,
}: {
  /** "Influence", "AI Lab": the name on the artwork. */
  division: string;
  services: readonly string[];
  /** Centred where nothing sits beside it — the Influence page's opening. */
  align?: "start" | "center";
  className?: string;
}) {
  const mark = divisionMark(division);

  return (
    <h1
      className={cn(
        "text-balance text-h1 font-normal leading-[1.02] tracking-tight text-bone xl:text-[3.75rem]",
        align === "center" && "text-center",
        className,
      )}
    >
      <span className="sr-only">
        Plug Genesis.{division} into your brand. Whenever you need {services.join(", ")}.
      </span>
      <span aria-hidden className="block">
        Plug{" "}
        {mark ? (
          /* 66% of the artwork's box is the lettering, so 1.06em of box stands its capitals at the line's own; the baseline is 74% down. */
          <Image
            src={mark.src}
            alt=""
            width={mark.width}
            height={mark.height}
            sizes="(min-width: 1024px) 420px, 70vw"
            preload
            className="division-art inline-block"
            style={{ height: "1.06em", width: "auto", verticalAlign: "-0.275em" }}
          />
        ) : (
          `Genesis.${division}`
        )}{" "}
        into your brand.
      </span>
      <span aria-hidden className="mt-3 block text-[0.62em] leading-tight">
        <span className="font-serif italic text-brand-ink">Whenever you need</span>
        <WordCycler
          words={services.map(midSentence)}
          align={align}
          suffix={<span className="text-brand-ink">.</span>}
          /* A grid of its own line — "block" here replaced the stacking grid, and the words fell out of line. */
          className="grid"
        />
      </span>
    </h1>
  );
}

/** "Digital avatars" → "digital avatars", mid-sentence; "AI automation" keeps its capitals. */
function midSentence(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}
