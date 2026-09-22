"use client";

import { useRef } from "react";

import { Reveal } from "@/components/genesis/reveal";
import { studios } from "@/lib/home-content";
import { mediaUrl } from "@/lib/media-url";
import Link from "next/link";

import { caseStudyPathForClip } from "@/lib/case-study-pages";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { useInViewPlayback } from "@/components/genesis/use-in-view-playback";
import { cn } from "@/lib/utils";

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

/**
 * Which clip sits in each card — STUDIOS WORK, which it was not.
 *
 * The five here were 3, 11, 19, 26 and 32: four Influence pieces and one AI
 * Labs one. Genesis's note was exactly that ("this is all Genesis.influence
 * and AI"), and it is the worst kind of wrong for this section — a timeline
 * of how Studios makes a film, illustrated with another division's work.
 *
 * These five are all Studios work, and they are ORDERED BY SHAPE to match
 * the row below: the two landscape films first, the square one in the
 * middle, the two portrait reels last. That is what lets each card grow
 * without anything being cropped into a shape it was not shot in.
 *
 * Two of the first picks were dropped on sight rather than on principle:
 * their opening frame is a white title card, so the first and last stage
 * were plain slabs where every other card was a photograph.
 */
const CLIPS = [
  "studios-umang-2024",
  "studios-mahindra-cut-44",
  "studios-1x1",
  "studios-abhi-ka-star",
  "studios-activ-travel-leisure-plan-finalhd-1",
];

/**
 * The shape of each stage's card, and how much of the row it takes.
 *
 * NOT FIVE EQUAL BOXES, AND NOT RANDOM ONES EITHER. Genesis asked first for
 * unequal cards — "like horizontal and then a square / should look like
 * videos of different duration" — and then, seeing them, for the variation
 * to be a PROGRESSION rather than a scatter: "harr ek me size badte jaaye
 * not uneven". Both notes point the same way once you take the scrubber
 * seriously. A clip's width on a timeline is its duration, and this row runs
 * Brief to Deliver: the work accumulates, so the cards should grow with it.
 * Uneven widths said the five stages differ in length for no reason anybody
 * could read.
 *
 * So every step is wider AND taller than the one before it — 0.74 of a share
 * of the track up to 1.25, with the shape turning from landscape through
 * square to portrait, which is what makes the height climb faster than the
 * width. Measured at 1440: 85, 134, 205, 292 and 341 points tall.
 *
 * The shapes follow each clip's own orientation (see CLIPS), so the growth
 * costs no cropping.
 */
/*
  THE GROWTH RUNS ON A PHONE TOO. It was taken off the small screen to kill
  the whitespace under the first cards, but that was the wrong culprit: the
  gap came from the rail being a row of FLEX items, which stretch to the
  tallest of them, so a short card carried 300 points of nothing under its
  caption. `items-start` on the row fixes that at the source and the cards
  keep their shapes at every width — which is what Genesis asked for twice
  now, most recently "phone me box ka size difference nahi aa raaha".
*/
const SHAPE = [
  { span: "0.78fr", aspect: "aspect-[16/9]" },
  { span: "0.9fr", aspect: "aspect-[4/3]" },
  { span: "1fr", aspect: "aspect-square" },
  { span: "1.12fr", aspect: "aspect-[5/6]" },
  { span: "1.2fr", aspect: "aspect-[4/5]" },
];

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

  /*
    ARROWS FOR THE PHONE RAIL ("manually scroll rakho - and arrow button as
    well"). The rail already swipes; these step it exactly one stage at a
    time, measured from the first card so they stay right at every width.
  */
  const rail = useRef<HTMLOListElement>(null);
  const step = (direction: 1 | -1) => {
    const el = rail.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: direction * (card.offsetWidth + 16), behavior: "smooth" });
  };

  return (
    <div>
      <Reveal className="mx-auto max-w-2xl text-center">
        <h3 className="text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
          {heading}{" "}
          <span className="font-serif font-normal italic text-brand-ink">
            {headingAccent}
          </span>
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
          {lead}
        </p>
      </Reveal>

      <Reveal variant="scene" delay={0.08} className="relative mt-[var(--block-gap)]">
        {/*
          THE ORIGIN, at the far left: the filled dot the reference hangs its
          timeline from, and the hairline that drops from it down the side of
          the whole block. It sits outside the scroller so it stays put on a
          phone while the stages travel past it.
        */}
        <span
          aria-hidden
          /*
            AT THE RULER'S HEIGHT, NOT THE TOP OF THE BLOCK. It sat at
            top-0, which is where the first stop's "01" label is, and the dot
            was painted straight over the zero. The rule runs 31px down; the
            dot is 10px, so 26px centres it on the line, which is also where
            the reference hangs it.
          */
          className="pointer-events-none absolute -left-1 top-[26px] hidden md:block"
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

        {/*
          THE TRACK'S COLUMNS ARE UNEVEN, which is the whole point — see
          SHAPE. Written as a style rather than a Tailwind class because the
          five weights are data, and a class string would have to be kept in
          sync with the array by hand.
        */}
        <ol
          ref={rail}
          /*
            FIVE ROWS THE COLUMNS SHARE, via subgrid. The cards are
            deliberately different heights, and with each column laying itself
            out alone that pushed all five labels, all five lines of copy and
            all five icons to different heights — a staircase of text that
            Genesis called out. The row heights are declared once here and
            every stage borrows them, so the cards sit on a common baseline
            and everything under them lines up.
          */
          /*
            A GUTTER BEFORE THE FIRST CARD. The rail is pulled full-bleed so
            a card can run to the edge as you swipe, and its own padding is
            what stands the first one off the screen edge — at the page's own
            24 it read as flush. 32, and `scroll-pl` so a swipe back to the
            start lands on the same gutter rather than snapping it away.
          */
          className="no-scrollbar -mx-6 flex snap-x scroll-smooth snap-mandatory gap-4 overflow-x-auto scroll-pl-8 pb-2 pl-8 pr-6 md:mx-0 md:grid md:gap-x-5 md:gap-y-0 md:overflow-visible md:p-0 md:[grid-template-columns:var(--pipeline-track)] md:[grid-template-rows:auto_1fr_auto_auto_auto]"
          style={{ "--pipeline-track": SHAPE.map((s) => s.span).join(" ") } as React.CSSProperties}
        >
          {stages.map((stage, index) => {
            const s = STRENGTH[index];
            return (
              <li
                key={stage.n}
                /*
                  NARROWER ON A PHONE, 54vw from 72. The cards grow to a 3:4
                  card at the end of the run, so their WIDTH sets the whole
                  section's height on a single-column screen: at 72vw the last
                  card stood 360 points tall and Studios ran 1088 against an
                  812-point screen.
                */
                /*
                  THE SAME FIVE ROWS ON A PHONE, laid out per card rather than
                  shared across the row — a flex item cannot take a subgrid
                  from a flex parent. The effect is what matters and it is the
                  same: the card hangs from the bottom of its cell, so five
                  cards of five heights still put their captions on one line
                  and the space a short card leaves sits ABOVE it, under the
                  scrubber, instead of as a hole beneath its caption.
                */
                className="grid w-[40vw] shrink-0 snap-start grid-rows-[auto_1fr_auto_auto_auto] sm:w-[34vw] md:row-span-5 md:w-auto md:grid-rows-subgrid"
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
                <div className="relative mt-3 flex items-end md:mt-0">
                  {/*
                    THE CARD OPENS ITS STUDY, where one is written. Genesis:
                    "genesis studios me bhi clicking the videos shd open its
                    case study." The lookup runs clip -> work -> study and
                    returns nothing for a clip with no published write-up, so
                    a stage whose footage has no story behind it renders as
                    the plain frame it always was rather than as a link to
                    somewhere invented. Two of the five have studies today;
                    the rest become links the moment one is written, with no
                    change here.

                    `CardFrame` is what keeps that from being an if-statement
                    around forty lines of styling — same border, same glow,
                    same box, different element.
                  */}
                  <CardFrame
                    href={caseStudyPathForClip(CLIPS[index])}
                    className="w-full overflow-hidden rounded-2xl border bg-ink"
                    style={{
                      borderColor: accent(s * 0.55),
                      boxShadow: `0 0 24px -12px ${accent(s * 0.7)}`,
                    }}
                  >
                    <StageClip
                      id={CLIPS[index]}
                      label={stage.name}
                      aspect={SHAPE[index].aspect}
                    />
                  </CardFrame>

                  {index < stages.length - 1 && (
                    <span
                      aria-hidden
                      /*
                        ON THE BASELINE THE CARDS SHARE, not at a fixed
                        distance from the top. The cards bottom-align and are
                        deliberately different heights, so a top offset put
                        the arrows above the shorter ones — floating in the
                        gap, against the section's own background, which is
                        why Genesis could not see them. Measured up from the
                        bottom they land inside every card in the row.

                        They also carry a filled disc now: a hairline ring on
                        a dark ground at this size was the other half of the
                        invisibility.
                      */
                      className="absolute -right-[1.9rem] bottom-10 hidden size-7 items-center justify-center rounded-full border bg-[var(--surface-raised)] shadow-[0_2px_10px_-2px_rgb(0_0_0/0.6)] md:flex"
                      style={{
                        borderColor: accent(Math.max(s * 0.8, 0.5)),
                        color: accent(Math.max(s, 0.75)),
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* The dotted number-and-name label, as the reference sets it. */}
                <div className="mt-3 flex items-center gap-2">
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

                {/*
                  TWO LINES' WORTH, WHETHER IT USES THEM OR NOT. On a phone
                  each card lays out on its own, so a one-line stage ("Goal,
                  audience, format") pulled its caption a line higher than
                  its neighbours and the row of labels went ragged again. The
                  desktop grid shares its rows and needs no floor.
                */}
                <p className="mt-2 min-h-[3.2em] text-pretty text-small leading-relaxed text-ash md:min-h-0">
                  {stage.body}
                </p>

                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="mt-3 size-6"
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

        <div className="mt-5 flex justify-center gap-3 md:hidden">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => step(direction)}
              aria-label={direction < 0 ? "Previous stage" : "Next stage"}
              className="grid size-10 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={direction < 0 ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
              </svg>
            </button>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

function StageClip({
  id,
  label,
  aspect,
}: {
  id: string;
  label: string;
  aspect: string;
}) {
  /*
    Plays while on screen and pauses off it — the same hook the work tiles and
    the case-study posters use. Five of these is a cost worth paying where the
    reel wall's thirty-two was not.
  */
  const ref = useInViewPlayback<HTMLVideoElement>();

  return (
    <video
      ref={ref}
      src={mediaUrl(`/work/clips/${id}.mp4`)}
      poster={mediaUrl(`/work/posters/${id}.jpg`)}
      muted
      loop
      playsInline
      // Loaded on arrival by useInViewPlayback; the poster covers until then.
      preload="none"
      aria-label={`${label} — Genesis Studios work`}
      {...VIDEO_GUARD_CLIENT}
      /*
        The aspect gives the card its shape; the vh cap keeps the tallest of
        them inside a short laptop screen, cropping a little off a portrait
        reel rather than pushing the section past one screen.
      */
      className={cn("w-full object-cover", aspect, "md:max-h-[32vh]")}
    />
  );
}

/**
 * A stage card's frame: a link to its case study, or a plain box.
 *
 * ONE SET OF STYLES, TWO ELEMENTS. The border colour, the glow and the
 * rounding are per-stage values computed from that stage's position in the
 * run, so branching at the call site would mean writing them twice and
 * keeping them in step by hand. This branches on the element and nothing
 * else.
 *
 * THE HOVER ONLY EXISTS ON THE LINK, which is the point: a card that lifts
 * when you point at it has promised a click, and three of the five stages
 * have no study to open. A reader should be able to tell which is which
 * without clicking to find out.
 */
function CardFrame({
  href,
  className,
  style,
  children,
}: {
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        className,
        "group/stage block outline-none transition-transform duration-300 ease-out",
        "motion-safe:hover:-translate-y-1",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
      )}
      style={style}
    >
      {children}
    </Link>
  );
}
