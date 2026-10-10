"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

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
/*
  "PLUG GENESIS.<DIVISION>" ON ONE PHONE LINE: the line's width in ems,
  measured from each wordmark's artwork ("Brand & Design" is the longest), so
  the phone size fits each page's own line to the screen.
*/
const PHONE_LINE_EM: Record<string, number> = {
  "AI Lab": 9.1,
  Studios: 9.1,
  "Brand & Design": 11.1,
  Influence: 9.8,
};

const WORDMARKS: Record<string, string> = {
  "AI Lab": "ai-lab",
  Studios: "studios",
  "Brand & Design": "brand-design",
  Influence: "influence",
};

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
  const wordmark = WORDMARKS[division];

  return (
    <h1
      className={cn(
        /* On a phone, two lines: "Plug Genesis.AI Lab" / "into your brand." — sized so the first fits the screen. */
        "text-balance text-h1 font-normal leading-[1.14] tracking-tight text-bone max-sm:text-[min(2.25rem,calc((100vw-3rem)/var(--plug-line,9.2)))] lg:text-[3.25rem] xl:text-[3.5rem]",
        align === "center" && "text-center",
        className,
      )}
      style={{ "--plug-line": PHONE_LINE_EM[division] ?? 9.2 } as CSSProperties}
    >
      <span className="sr-only">
        Plug Genesis.{division} into your brand. Whenever you need {services.join(", ")}.
      </span>
      <span aria-hidden className="block">
        <span className="max-sm:whitespace-nowrap">
        Plug{" "}
        {wordmark ? (
          /*
            THE GENESIS.<DIVISION> LOCKUP (Genesis, 4 Oct 2026: "add the
            Genesis.Studios logo here … for other verticals as well, just in
            this section"). A theme pair, crossfaded by --logo-invert like the
            master wordmark: white GENESIS on the dark theme, ink on the light.
            The lettering fills about 88% of the file's height, so 0.8em of
            box stands its capitals level with the line's.
          */
          <span className="relative inline-block align-[-0.06em]" style={{ height: "0.8em" }}>
            <Image
              src={`/brand/divisions/wordmark/${wordmark}-light.png`}
              alt=""
              width={1374}
              height={171}
              sizes="(min-width: 1024px) 520px, 80vw"
              preload
              className="h-full w-auto"
              style={{ opacity: "calc(1 - var(--logo-invert, 0))" }}
            />
            <Image
              src={`/brand/divisions/wordmark/${wordmark}-dark.png`}
              alt=""
              width={1374}
              height={171}
              sizes="(min-width: 1024px) 520px, 80vw"
              className="absolute inset-0 h-full w-auto"
              style={{ opacity: "var(--logo-invert, 0)" }}
            />
          </span>
        ) : (
          `Genesis.${division}`
        )}
        </span>{" "}
        <span className="max-sm:block">into your brand.</span>
      </span>
      <span aria-hidden className="mt-6 block text-[0.62em] leading-snug max-sm:mt-3">
        {/* Thin over bold (Genesis, 4 Oct 2026): the lead-in in Mont ExtraLight; the service in Codec Pro, a touch heavier, the weight of the "AI Lab" wordmark ("not that bold"). */}
        <span className="font-display font-extralight italic text-brand-ink">Whenever you need</span>
        <WordCycler
          words={services.map(midSentence)}
          align={align}
          suffix={<span className="text-brand-ink">.</span>}
          /* A grid of its own line — "block" here replaced the stacking grid, and the words fell out of line. */
          className="grid font-sans font-semibold"
        />
      </span>
    </h1>
  );
}

/** "Digital avatars" → "digital avatars", mid-sentence; "AI automation" keeps its capitals. */
function midSentence(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}
