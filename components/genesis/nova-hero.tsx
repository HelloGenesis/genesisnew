"use client";

import { NeuralOrb } from "@/components/genesis/neural-orb";
import { NovaGlyph } from "@/components/genesis/nova-glyphs";

/**
 * THE NOVA BY GENESIS OPENING (Genesis, 31 Oct 2026: "make NOVA the hero, its
 * O the orb … white, just the orb in the gradient … remove all this, just keep
 * minimal NOVA and the dashboard"). Only the word, huge, in Nova's thin drawn
 * capitals (components/genesis/nova-glyphs), its O the Brain's live orb
 * (components/genesis/neural-orb). The dashboard follows it on the page.
 */
export function NovaHero() {
  return (
    <div className="relative z-[2] mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-14 pt-36 sm:pb-16 sm:pt-44">
      <h1 aria-label="Nova by Genesis" className="flex items-center gap-[0.2em] text-[clamp(5rem,17vw,13rem)] leading-none text-bone">
        <NovaGlyph letter="N" className="h-[0.66em]" />
        {/* The O: the live orb, a touch larger than the capitals as a round letter is. */}
        <span aria-hidden className="relative block size-[0.86em]">
          <NeuralOrb className="absolute inset-0" />
        </span>
        <NovaGlyph letter="V" className="h-[0.66em]" />
        <NovaGlyph letter="A" className="h-[0.66em]" />
      </h1>
    </div>
  );
}
