"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/genesis/reveal";
import { studios } from "@/lib/home-content";

/**
 * FROM BRIEF TO FINAL CUT — the five stages of a Studios job, drawn to
 * Genesis's design (29 Sep 2026): an edit timeline across the top (00:00 to
 * 00:25, the origin dot and its rule dropping down the left), one gradient
 * bar holding the five stages, and an illustrated card per stage, each edged
 * in its stage's colour, with a circled arrow between them.
 *
 * THE PALETTE RUNS ALONG THE ROW — amber at Brief to violet at Deliver, the
 * same sweep as the stats bar and the plan cards — so the row reads as a
 * progress bar filling.
 *
 * THE ILLUSTRATIONS ARE GENESIS'S OWN (public/studios/pipeline), replaced
 * 29 Sep 2026 with their glowing set: the call, the storyboard, the camera,
 * the grade, the publish stack — 800×1000 WebP, so the cards are 4:5. They replace the five Studios clips the cards
 * used to play; the clips are still in the case studies and the portfolio.
 *
 * ON A PHONE the bar and the ruler step aside and each stage becomes a card
 * with its own label, in a row that swipes.
 */

/** Each stage's colour, Brief to Deliver. */
const TONES = ["#f4b04a", "#ef8a4a", "#ec6d6a", "#dc6aa5", "#9b6ae0"] as const;

/** The bar's sweep — the same five colours as one gradient. */
const BAR = `linear-gradient(90deg, ${TONES[0]} 0%, ${TONES[1]} 25%, ${TONES[2]} 48%, ${TONES[3]} 72%, ${TONES[4]} 100%)`;

/** The ruler's marks, as the design writes them. */
const TIMES = ["00:00", "00:05", "00:10", "00:15", "00:20", "00:25"];

const ART = [1, 2, 3, 4, 5].map((n) => `/studios/pipeline/${n}.webp`);

export function StudiosPipeline() {
  const { heading, headingAccent, lead, stages } = studios.pipeline;

  return (
    <div>
      <Reveal className="mx-auto max-w-5xl text-center">
        <h3 className="text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
          {heading}{" "}
          <span className="font-serif font-normal italic text-brand-ink">{headingAccent}</span>
        </h3>
        <p className="mx-auto mt-3 max-w-none text-pretty text-body leading-relaxed text-ash sm:text-lead">{lead}</p>
      </Reveal>

      <Reveal variant="scene" delay={0.08} className="relative mt-[var(--block-gap)]">
        {/* THE RULER — laptop and up. The origin dot, its rule down the left, the marks along the top. */}
        <div aria-hidden className="relative hidden md:block">
          <div className="flex justify-between text-[0.75rem] tabular-nums text-ash">
            {TIMES.map((time) => (
              <span key={time}>{time}</span>
            ))}
          </div>
          <div className="relative mt-2 h-px" style={{ background: BAR }}>
            {TIMES.slice(1).map((time, index) => (
              <span
                key={time}
                className="absolute -top-1.5 h-3 w-px bg-white/50"
                style={{ left: `${((index + 1) / (TIMES.length - 1)) * 100}%` }}
              />
            ))}
            <span
              className="absolute -left-1.5 -top-1.5 size-3 rounded-full"
              style={{ background: TONES[0], boxShadow: `0 0 0 5px ${TONES[0]}33, 0 0 18px ${TONES[0]}` }}
            />
            <span
              className="absolute left-0 top-0 w-px"
              style={{ height: "calc(100% + 30rem)", background: `linear-gradient(180deg, ${TONES[0]}, transparent)` }}
            />
          </div>
        </div>

        {/* THE STAGE BAR — laptop and up: one gradient, five stages. */}
        <ol
          aria-label="From brief to final cut"
          className="relative mt-6 hidden grid-cols-5 overflow-hidden rounded-card md:grid"
          style={{ background: BAR, boxShadow: `0 18px 50px -24px ${TONES[2]}` }}
        >
          {stages.map((stage, index) => (
            <li
              key={stage.n}
              className={`px-3 py-3 text-center text-[#1d130c] ${index > 0 ? "border-l border-black/10" : ""}`}
            >
              <p className="text-small font-semibold uppercase tracking-[0.04em] lg:text-body">
                {stage.n}&nbsp;&nbsp;{stage.name}
              </p>
              <p className="mt-0.5 text-[0.75rem] leading-snug text-[#1d130c]/75 lg:text-small">{stage.body}</p>
            </li>
          ))}
        </ol>

        {/* THE CARDS — a swiping row on a phone, five across from md. */}
        <ol
          aria-label="The five stages"
          data-lenis-prevent
          className="no-scrollbar -mx-6 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-6 px-6 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:p-0"
        >
          {stages.map((stage, index) => {
            const tone = TONES[index];
            return (
              <li key={stage.n} className="relative w-[70%] shrink-0 snap-start min-[480px]:w-[45%] md:w-auto">
                {/* On a phone, the stage's label rides on its card. */}
                <div
                  className="mb-2 rounded-card px-3 py-2 text-center text-[#1d130c] md:hidden"
                  style={{ background: tone }}
                >
                  <p className="text-small font-semibold uppercase tracking-[0.04em]">
                    {stage.n}&nbsp;&nbsp;{stage.name}
                  </p>
                  <p className="text-[0.75rem] leading-snug text-[#1d130c]/75">{stage.body}</p>
                </div>
                <div
                  className="relative overflow-hidden rounded-[1.25rem] border bg-ink"
                  style={{
                    borderColor: `${tone}b3`,
                    boxShadow: `0 0 0 1px ${tone}26, 0 20px 50px -24px ${tone}`,
                    aspectRatio: "4 / 5",
                  }}
                >
                  <Image
                    src={ART[index]}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 20vw, 70vw"
                    className="object-cover"
                  />
                </div>
                {/* The circled arrow into the next stage — in the gap, on a laptop. */}
                {index < stages.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-5 top-1/2 z-[1] hidden size-10 -translate-y-1/2 place-items-center rounded-full border bg-ink text-bone md:grid"
                    style={{ borderColor: TONES[index + 1], boxShadow: `0 0 16px -2px ${TONES[index + 1]}` }}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </Reveal>
    </div>
  );
}
