"use client";

import { DivisionServices } from "@/components/genesis/division-services";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/genesis/reveal";
import { studios } from "@/lib/home-content";
import { RailProgress } from "@/components/genesis/rail-progress";

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

/** How long the playhead rests on each stage. */
const STEP_MS = 2600;

/**
 * `bare`: the five stages alone, for the Studios page's opening, where they sit
 * in a glass card beside the headline (Genesis, 4 Oct 2026) — no heading, no
 * services and no ruler, and smaller stage labels for the narrower column.
 */
export function StudiosPipeline({ bare = false }: { bare?: boolean } = {}) {
  const cardsRail = useRef<HTMLOListElement>(null);
  const { heading, headingAccent, stages } = studios.pipeline;
  /*
    INTERACTIVE (Genesis, 4 Oct 2026: "make each element of this very
    interactive"). One stage is lit at a time: the playhead walks the five on
    its own, and pointing at, tabbing to or tapping a stage's label or card
    takes it there and holds it. The lit stage's label fills, its card lifts
    and its picture leans in, the arrow out of it glows, and its line is
    spelled out under the row.
  */
  /* Only the Studios page's hero card is interactive; the homepage section stays still (Genesis, 4 Oct 2026: "remove this hover effect from here"). */
  const live = bare;
  const [lit, setActive] = useState(0);
  const active = live ? lit : -1;
  const [hold, setHold] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!live || hold || reduce) return;
    const timer = window.setInterval(() => setActive((at) => (at + 1) % stages.length), STEP_MS);
    return () => window.clearInterval(timer);
  }, [live, hold, reduce, stages.length]);
  const point = (index: number) => !live ? {} : ({
    onPointerEnter: () => {
      setActive(index);
      setHold(true);
    },
    onPointerLeave: () => setHold(false),
    onFocus: () => {
      setActive(index);
      setHold(true);
    },
    onBlur: () => setHold(false),
    onClick: () => setActive(index),
  });

  return (
    <div>
      {!bare && (
      <Reveal className="mx-auto max-w-5xl text-center">
        <h3 className="text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
          {heading}{" "}
          <span className="font-serif font-normal italic text-brand-ink">{headingAccent}</span>
        </h3>
      </Reveal>
      )}
      {/*
        THE SERVICES IN PLACE OF THE LINE UNDER THE HEADING (Genesis, 4 Oct
        2026: "remove … add the icons from below"). The sentence named them;
        the icons now do.
      */}
      {!bare && <DivisionServices division="Studios" className="mt-6 sm:mt-8" />}

      <Reveal variant="scene" delay={0.08} className={bare ? "relative" : "relative mt-[var(--block-gap)]"}>
        {/* THE RULER — laptop and up. The origin dot, its rule down the left, the marks along the top. */}
        <div aria-hidden className={bare ? "hidden" : "relative hidden md:block"}>
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
          className={`relative hidden grid-cols-5 overflow-hidden rounded-card md:grid ${bare ? "" : "mt-6"}`}
          style={{ background: BAR, boxShadow: `0 18px 50px -24px ${TONES[2]}` }}
        >
          {stages.map((stage, index) => (
            <li
              key={stage.n}
              {...point(index)}
              tabIndex={live ? 0 : undefined}
              aria-current={active === index ? "step" : undefined}
              className={`relative outline-none ${live ? "cursor-pointer" : ""} transition-[background-color,opacity] duration-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${bare ? "px-1.5 py-2" : "px-3 py-3"} text-center text-[#1d130c] ${index > 0 ? "border-l border-black/10" : ""} ${active === index ? "bg-white/25" : live ? "opacity-75 hover:opacity-100" : ""}`}
            >
              {/* The playhead through the lit stage. */}
              {active === index && !reduce && (
                <span
                  key={`fill-${active}-${hold}`}
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#1d130c]/60"
                  style={hold ? undefined : { animation: `pipeline-fill ${STEP_MS}ms linear forwards` }}
                />
              )}
              <p className={bare ? "text-[0.6875rem] font-semibold uppercase leading-tight tracking-[0.03em]" : "text-small font-semibold uppercase tracking-[0.04em] lg:text-body"}>
                {stage.n}&nbsp;&nbsp;{stage.name}
              </p>
              <p className={bare ? "mt-0.5 text-[0.625rem] leading-snug text-[#1d130c]/75" : "mt-0.5 text-[0.75rem] leading-snug text-[#1d130c]/75 lg:text-small"}>{stage.body}</p>
            </li>
          ))}
        </ol>

        {/* THE CARDS — a swiping row on a phone, five across from md. */}
        <ol
          ref={cardsRail}
          aria-label="The five stages"
          data-lenis-prevent
          className={`no-scrollbar -mx-6 flex snap-x ${bare ? "mt-3 md:gap-2.5" : "mt-4"} snap-mandatory gap-4 overflow-x-auto scroll-pl-6 px-6 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:p-0`}
        >
          {stages.map((stage, index) => {
            const tone = TONES[index];
            return (
              <li
                key={stage.n}
                {...point(index)}
                className={`relative w-[70%] shrink-0 snap-start ${live ? "cursor-pointer" : ""} min-[480px]:w-[45%] md:w-auto`}
              >
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
                  className={`relative overflow-hidden rounded-[1.25rem] border bg-ink transition-[transform,opacity,box-shadow,filter] duration-500 ease-out ${
                    active === index ? "-translate-y-1 scale-[1.04]" : live ? "opacity-70 saturate-[0.7]" : ""
                  }`}
                  style={{
                    borderColor: active === index ? tone : `${tone}b3`,
                    boxShadow:
                      active === index
                        ? `0 0 0 1px ${tone}, 0 0 28px -4px ${tone}, 0 24px 50px -20px ${tone}`
                        : `0 0 0 1px ${tone}26, 0 20px 50px -24px ${tone}`,
                    aspectRatio: "4 / 5",
                  }}
                >
                  <Image
                    src={ART[index]}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 20vw, 70vw"
                    className={`object-cover transition-transform duration-700 ease-out ${active === index ? "scale-110" : "scale-100"}`}
                  />
                  {/* The stage's number on its lit card. */}
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold text-[#1d130c] transition-opacity duration-300 ${active === index ? "opacity-100" : "opacity-0"}`}
                    style={{ background: tone }}
                  >
                    {stage.n}
                  </span>
                </div>
                {/* The circled arrow into the next stage — in the gap, on a laptop. */}
                {index < stages.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute top-1/2 z-[1] hidden -translate-y-1/2 place-items-center rounded-full border bg-ink text-bone transition-transform duration-300 md:grid ${
                      bare ? "-right-[1.05rem] size-8" : "-right-5 size-10"
                    } ${active === index ? "scale-110" : ""}`}
                    style={{
                      borderColor: TONES[index + 1],
                      ...(active === index ? { background: TONES[index + 1], color: "#1d130c" } : {}),
                      boxShadow: `0 0 ${active === index ? 24 : 16}px -2px ${TONES[index + 1]}`,
                    }}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <RailProgress rail={cardsRail} className="mt-3 md:hidden" />
        {/* The lit stage, spelled out. */}
        {live && (
        <p aria-live="polite" className="mt-3 hidden min-h-[1.5em] text-center text-small text-ash md:block">
          <span className="font-semibold text-bone">
            {stages[active].n}&nbsp;&nbsp;{stages[active].name}
          </span>
          {" · "}
          {stages[active].body}
        </p>
        )}
        <style>{"@keyframes pipeline-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}"}</style>
      </Reveal>
    </div>
  );
}
