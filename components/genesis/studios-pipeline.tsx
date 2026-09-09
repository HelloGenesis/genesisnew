"use client";

import { Reveal } from "@/components/genesis/reveal";
import { studios } from "@/lib/home-content";
import { mediaUrl } from "@/lib/media-url";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { useInViewPlayback } from "@/components/genesis/use-in-view-playback";

/**
 * FROM BRIEF TO FINAL CUT — the five stages of a Studios job, laid out as the
 * editing timeline Genesis supplied as the reference.
 *
 * IT IS BUILT TO MATCH THAT REFERENCE PART FOR PART, because an earlier pass
 * kept the idea and dropped the furniture, and Genesis's answer was that they
 * wanted the reference itself. So everything in it is here: the scrubber
 * across the top with its origin dot and the rule dropping down the left
 * edge, the tick marks between stops, a bordered media card per stage, a
 * circled arrow in every gap, a dotted number-and-name label under each card,
 * the line of copy, and an outline icon beneath that.
 *
 * THE ONE THING THAT IS NOT COPIED IS THE PALETTE, and that is Genesis's own
 * earlier instruction rather than a liberty taken here. The reference gives
 * each stage a hue of its own — orange, violet, blue, green — which is four
 * colours outside the six the brand fixed. The progression is carried in
 * VALUE instead: every stage's dot, border, label and icon share one accent
 * and step up in strength from Brief to Deliver, so the eye still reads
 * left-to-right travel and the last card still looks like an arrival. See
 * STRENGTH.
 *
 * THE RULER IS LABELLED IN STAGES, NOT SECONDS. The reference is scrubbing a
 * twenty-second edit, so its marks read 0s, 5s, 10s. This is a timeline of
 * the WORK rather than of one film, and "10s" printed over "Shoot" would be
 * saying the shoot takes ten seconds. The stops are numbered instead, which
 * keeps the scrubber reading as a measure while the number over each card
 * matches the label beneath it.
 *
 * THE CARDS CARRY GENESIS'S OWN FOOTAGE. The reference fills each card with a
 * picture of that stage; these play five clips from the catalogue. It is also
 * where the reel wall's job went when that wall was removed from this section
 * — five clips instead of thirty-two, which is the same argument at a
 * fraction of the weight.
 */

/**
 * How strongly each stage is lit, as a share of the accent.
 *
 * Linear from a quiet grey-gold to full #ffc516, so the row reads as a
 * progress bar filling. "Deliver" should look like the end of something.
 */
const STRENGTH = [0.3, 0.475, 0.65, 0.825, 1];

/** Which clip sits in each card. */
const CLIPS = [3, 11, 19, 26, 32];

const accent = (alpha: number) => `rgb(255 197 22 / ${alpha})`;

/**
 * One outline glyph per stage, in the reference's position under the copy.
 * Drawn rather than pulled from an icon set: five shapes at one stroke weight
 * is less code than a dependency, and they inherit the stage's own strength
 * through `currentColor`.
 */
const ICONS: Record<string, React.ReactNode> = {
  Brief: (
    <>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M15 3v5h5M9 13h7M9 17h5" />
    </>
  ),
  Script: (
    <>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M14 6.5 17.5 10" />
    </>
  ),
  Shoot: (
    <>
      <rect x="2" y="7" width="13" height="11" rx="2" />
      <path d="m15 12 6-3.5v9L15 14z" />
    </>
  ),
  Edit: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M7 5v14M17 5v14M2 12h20" />
    </>
  ),
  Deliver: (
    <>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </>
  ),
};

export function StudiosPipeline() {
  const { heading, headingAccent, lead, stages } = studios.pipeline;

  return (
    <div>
      <Reveal className="mx-auto max-w-3xl text-center">
        <h3 className="text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
          {heading}{" "}
          <span className="font-serif font-normal italic text-brand-ink">
            {headingAccent}
          </span>
        </h3>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
          {lead}
        </p>
      </Reveal>

      <Reveal variant="scene" delay={0.08} className="relative mt-12 sm:mt-14">
        {/*
          THE ORIGIN, at the far left: the filled dot the reference hangs its
          timeline from, and the hairline that drops from it down the side of
          the whole block. It sits outside the scroller so it stays put on a
          phone while the stages travel past it.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-1 top-0 hidden md:block"
        >
          <span
            className="block size-2.5 rounded-full"
            style={{
              background: accent(1),
              boxShadow: `0 0 0 5px ${accent(0.13)}`,
            }}
          />
          <span
            className="absolute left-1/2 top-2.5 w-px -translate-x-1/2"
            style={{
              height: "var(--pipeline-drop, 22rem)",
              background: `linear-gradient(180deg, ${accent(0.5)}, transparent)`,
            }}
          />
        </span>

        <ol className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-5 md:overflow-visible md:px-0">
          {stages.map((stage, index) => {
            const s = STRENGTH[index];
            return (
              <li
                key={stage.n}
                className="w-[72vw] shrink-0 snap-start sm:w-[46vw] md:w-auto"
              >
                {/*
                  THE SCRUBBER SEGMENT for this stage: the numbered stop, the
                  rule running right from it, and three ticks between this
                  stop and the next. Drawn per stage rather than as one bar
                  behind the row, so it inherits the grid's own geometry and
                  stays aligned at every breakpoint and inside the phone
                  scroller, with nothing measured in JS.
                */}
                <div aria-hidden className="relative h-9">
                  <span
                    className="absolute left-0 top-0 text-micro font-medium tabular-nums tracking-[0.14em]"
                    style={{ color: accent(Math.max(s, 0.55)) }}
                  >
                    {stage.n}
                  </span>
                  <span
                    className="absolute inset-x-0 bottom-1 h-px"
                    style={{ background: accent(s * 0.5) }}
                  />
                  <span
                    className="absolute bottom-[1px] left-0 size-1.5 rounded-full"
                    style={{ background: accent(s) }}
                  />
                  {[1, 2, 3].map((tick) => (
                    <span
                      key={tick}
                      className="absolute bottom-[3px] h-[5px] w-px"
                      style={{ left: `${tick * 25}%`, background: accent(s * 0.32) }}
                    />
                  ))}
                </div>

                {/*
                  THE CARD, and the circled arrow that points at the next one.
                  The arrow is a child of the card it points AWAY from and
                  sits in the gap to its right, so it cannot drift out of
                  alignment with a card whose height changed.
                */}
                <div className="relative mt-3">
                  <div
                    className="overflow-hidden rounded-2xl border bg-ink"
                    style={{
                      borderColor: accent(s * 0.55),
                      boxShadow: `0 0 24px -12px ${accent(s * 0.7)}`,
                    }}
                  >
                    <StageClip n={CLIPS[index]} label={stage.name} />
                  </div>

                  {index < stages.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute -right-[1.85rem] top-1/2 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border md:flex"
                      style={{
                        borderColor: accent(s * 0.5),
                        color: accent(Math.max(s, 0.6)),
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* The dotted number-and-name label, as the reference sets it. */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: accent(s) }}
                  />
                  <span
                    className="text-micro font-medium tabular-nums tracking-[0.14em]"
                    style={{ color: accent(Math.max(s, 0.6)) }}
                  >
                    {stage.n}
                  </span>
                  <span className="text-micro font-medium uppercase tracking-[0.14em] text-bone">
                    {stage.name}
                  </span>
                </div>

                <p className="mt-2.5 text-pretty text-small leading-relaxed text-ash">
                  {stage.body}
                </p>

                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="mt-5 size-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: accent(Math.max(s, 0.5)) }}
                >
                  {ICONS[stage.name]}
                </svg>
              </li>
            );
          })}
        </ol>
      </Reveal>
    </div>
  );
}

function StageClip({ n, label }: { n: number; label: string }) {
  /*
    Plays while on screen and pauses off it — the same hook the work tiles and
    the case-study posters use. Five of these is a cost worth paying where the
    reel wall's thirty-two was not.
  */
  const ref = useInViewPlayback<HTMLVideoElement>();

  return (
    <video
      ref={ref}
      src={mediaUrl(`/work/clips/${n}.mp4`)}
      poster={mediaUrl(`/work/posters/${n}.jpg`)}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={`${label} — Genesis Studios work`}
      {...VIDEO_GUARD_CLIENT}
      className="aspect-[4/5] w-full object-cover md:aspect-[3/4]"
    />
  );
}
