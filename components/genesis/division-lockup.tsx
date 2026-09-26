import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * A division's lockup — GENESIS.Influence over its own tagline.
 *
 * ONE DEFINITION, used by the section shell, the two sections that build
 * their own headers, and the division pages. It was written inline in the
 * shell first; the moment a second section needed it, three copies were one
 * refactor away from disagreeing about the dot.
 *
 * THE SUPPLIED ARTWORK, at Genesis's instruction. This was live text in the
 * division's ramp, and the reason was written down: a heading that is an
 * image cannot be selected, searched, translated or read aloud, and goes soft
 * on a retina display. Genesis has asked for the logos to be used wherever
 * the name appears, which is their call to make — so the reasoning is
 * answered rather than ignored:
 *
 *   - SELECTED, SEARCHED, READ ALOUD. Every lockup carries an sr-only heading
 *     with the full name and tagline. It is in the DOM, in the accessibility
 *     tree, and in the page source for a crawler; what it is not is visible,
 *     because the picture above it says the same thing.
 *   - SOFT ON RETINA. The sources are 1347-2017px wide for marks that render
 *     at most 766, so next/image has three times the pixels it needs at 1x
 *     and enough at 3x.
 *
 * THE ARTWORK IS THE WORDMARK ONLY. Each supplied file carries the tagline
 * burned in under the name, and cropping to the whole thing was what made the
 * tagline unable to re-wrap — on a 375px screen Brand & Design's sat at about
 * 10px because a 7.36:1 picture can only scale. Genesis asked for just the
 * name and the rest cropped out, which is also the fix: the files split
 * cleanly into two bands of ink with a gap between them, so the crop stops at
 * the wordmark and the tagline goes back to being text. It sets in the page's
 * own type, at the page's own size, and wraps.
 */

/**
 * THE MARK SET: the yellow N beside the division's name in its gradient, and
 * the default wherever a division is introduced.
 *
 * It replaces the GENESIS.<name> lockups, at Genesis's request. Their
 * "Rebranding 3" folder carries a set with the small N standing in for the
 * full wordmark, and they asked for that on the division sections. The full
 * GENESIS wordmark is still in the header and at the centre of the orb, so the
 * sections no longer repeat it four more times.
 *
 * ONE FILE PER DIVISION, NOT A THEME PAIR. The old lockups needed a light and a
 * dark cut because "GENESIS" was white on one and black on the other. This set
 * has no neutral ink in it at all: the N is the brand yellow and the name is
 * its gradient. Both were checked composited over #242426 and #f9f9f9, so
 * there is nothing to cross-fade.
 *
 * NORMALISED, NOT AS EXPORTED. The squares came at different lettering sizes
 * (Brand & Design's is 28% smaller, to fit its longer name), so they were cut
 * by scripts/cut-division-marks.py to the same 66% body and 74% baseline the
 * name set uses. Re-run that script if the artwork changes; do not hand-edit.
 */
const MARK: Record<string, { slug: string; width: number; height: number }> = {
  Influence: { slug: "influence", width: 688, height: 165 },
  Studios: { slug: "studios", width: 571, height: 168 },
  "AI Lab": { slug: "ai-lab", width: 492, height: 167 },
  "Brand & Design": { slug: "brand-design", width: 803, height: 120 },
};

/**
 * THE BOARD SET — the second supply, and a different mark rather than a
 * different crop of the same one.
 *
 * These carry the SHORT name and no GENESIS prefix: "Influence", not
 * "GENESIS.Influence". That is what the divisions board around the orb wants,
 * because the wordmark is already at the sphere's core — with the full lockup
 * in all four corners the composition said GENESIS five times.
 *
 * They also keep their tagline burned in, so a caller using these must NOT
 * print the tagline again underneath. That double line is exactly what
 * Genesis kept seeing, and here it is prevented by the component rather than
 * by remembering.
 */
const BOARD: Record<string, { slug: string; width: number; height: number }> = {
  Influence: { slug: "influence", width: 728, height: 147 },
  Studios: { slug: "studios", width: 623, height: 148 },
  "AI Lab": { slug: "ai-lab", width: 684, height: 145 },
  "Brand & Design": { slug: "brand-design", width: 648, height: 148 },
};

/**
 * THE NAME SET — the board artwork with the tagline cut off.
 *
 * Genesis asked for the divisions' subtitles to appear only while the reader
 * is pointing at the name. A tagline burned into a picture cannot be revealed
 * on hover, so the board marks were re-cropped to their first band of ink and
 * the tagline goes back to being live text, exactly as it is on the wordmark
 * set. See scripts/crop-division-names — the cut is taken at the transparent
 * gap the files already have between the two bands.
 *
 * ONE FILE, NOT A THEME PAIR, and that is measured rather than assumed. The
 * board's light and dark variants differ ONLY in the tagline band — rows 106
 * to 136 of Influence's 147, and the equivalent in the other three — because
 * the NAME is a gradient that reads on either ground and only the subtitle
 * flips between white and dark ink. Cropping the tagline away therefore
 * removes the entire difference between the two files, so there is nothing
 * left to cross-fade and the second <Image> is dropped rather than rendered
 * at zero opacity forever.
 */
/*
  THESE ARE THE NORMALISED CUTS. The files were re-cut by
  scripts/normalise-division-names.py, which is where the reasoning lives; the
  short version is that the four were exported with whatever padding their
  artboards had, and sizing from the file box meant the LETTERS ended up at
  four different offsets and four different sizes even though the boxes lined
  up perfectly. Every file is now cropped tight to its ink horizontally and
  padded so the cap-to-baseline body is 66% of the box with the baseline at
  74%, in all four. Re-run that script if the artwork is ever re-exported —
  do not hand-edit these numbers.
*/
const NAME: Record<string, { slug: string; width: number; height: number }> = {
  Influence: { slug: "influence", width: 362, height: 98 },
  Studios: { slug: "studios", width: 296, height: 103 },
  "AI Lab": { slug: "ai-lab", width: 250, height: 98 },
  "Brand & Design": { slug: "brand-design", width: 616, height: 100 },
};

/**
 * How tall a lockup stands at full size, in px.
 *
 * WIDTH IS WHAT IS CAPPED, NOT HEIGHT, and the difference matters on a phone.
 * The four marks are not the same shape — Brand & Design is 7.36:1 against AI
 * Lab's 5.01 — so pinning them all to one height would make Brand & Design
 * 766px wide and burst a 375px screen. Capping the WIDTH at this height's
 * worth instead means each lockup stands at the same height wherever there is
 * room for it, and shrinks to fit where there is not.
 *
 * 58px, AND THE NUMBER HAD TO COME DOWN WHEN THE ARTWORK CHANGED. It was 104
 * — measured against the live text it replaced, which was 56px of heading,
 * 12px of gap and 29px of tagline stacked. But that figure described the
 * WHOLE block, and the artwork then carried the whole block too. Cropping the
 * tagline out of the picture left 104 applying to the wordmark alone, so
 * every division lockup silently grew by the height of a tagline and a gap —
 * Influence went from 575px wide to 932. Nothing in the code changed; the
 * meaning of the number did.
 *
 * 58 is the wordmark's own share of that original 104 (its ink was 148 of the
 * 252 in the full lockup), which puts the mark back at the size the page was
 * built around.
 *
 * THE TAGLINE CANNOT RE-WRAP, which is the real cost of using artwork here
 * and is worth knowing rather than discovering. As live text the tagline
 * wrapped to two lines on a phone; burned into the mark it can only scale, so
 * on a 375px screen Brand & Design's sits at around 10px. Every other
 * division clears 13. If that reads too small on a real phone, the fix is a
 * stacked mobile crop from Genesis, not a CSS change here.
 */
/*
  65 SINCE THE MARK SET ARRIVED, and it follows the LETTERS, not the box. The
  GENESIS.<name> lockups put their cap-to-baseline body at 74% of the box, so
  58px stood the lettering at about 43px. The N-mark cuts are normalised to
  66%, so the same 43px needs a 65px box. Kept equal on purpose: the section
  headers were built around that letter size, and a new logo is not a reason
  for every division heading on the page to shrink.
*/
/*
  58 AGAIN, ON THE ONE-SCREEN PASS. The note above kept 65 so a new logo
  would not shrink every heading — the right call then. The constraint that
  overrode it is Genesis's: every section has to fit a screen, and this box
  is the first thing in eight of them, so seven points off it is 56 points
  off the page for nothing anyone can see at a glance.
*/
const TARGET_HEIGHT = 58;

/**
 * The widest of the four, in aspect terms — Brand & Design, at 7.36:1.
 *
 * It is the one that decides how tall a set of lockups can stand in a given
 * column, because it is the one that runs out of width first. Derived rather
 * than typed, so a fifth division cannot leave it stale.
 */
const MAX_RATIO = Math.max(
  ...Object.values(MARK).map((l) => l.width / l.height),
);

/** The same figure for the board set, which has its own proportions. */
const BOARD_MAX_RATIO = Math.max(
  ...Object.values(BOARD).map((l) => l.width / l.height),
);

/**
 * And for the name set, which is the widest of the three — cropping the
 * tagline away leaves the same ink over less than half the height, so
 * Brand & Design leads the set at 6.16:1.
 *
 * DERIVED, NOT TYPED, which is what makes the normalisation hold: every mark
 * is sized as its own ratio over this one, so all four end up the same height
 * and, now that the files are cropped to their ink, the same body height with
 * their left edges flush. Re-cutting the artwork changes the table above and
 * this follows.
 */
/**
 * What `sizes` a fluid lockup declares, and it is a fix rather than a tidy-up.
 *
 * IT WAS "30vw", WHICH ASKED FOR RENDERS FOUR TIMES THE ARTWORK. `sizes` is
 * how the browser picks a srcset candidate: 30vw on a 1440 display is 432 CSS
 * pixels, doubled for a retina screen is 864, so it reached for the 1080-wide
 * candidate — of source files that are between 250 and 616 pixels wide. Next
 * clamps to the source rather than upscaling, so every one of those requests
 * did the work of a large resize and handed back the same small image.
 *
 * The board holds each mark to at most 360px, so that is what it declares.
 * The browser now picks the 750 candidate on a retina display, which is the
 * first one at or above the widest source in the set.
 *
 * IT ALSO STOPPED THE BOARD FROM HANGING. Four marks sharing one declared
 * size meant four simultaneous, identical w=1080 requests on first paint, and
 * Next 16.3.1's dev image cache coalesces concurrent requests for one key —
 * when that coalescing wedged, three of the four never resolved and their
 * lockups never appeared. Measured against the running server: studios at
 * w=750, 828, 1200 and 1920 all return in under 120ms while w=1080 hangs
 * indefinitely, and a client logo at w=1080 is fine. Asking for a sane width
 * sidesteps it; the payload win is the reason to keep it either way.
 */
const FLUID_SIZES = "(min-width: 1024px) 360px, 45vw";

const NAME_MAX_RATIO = Math.max(
  ...Object.values(NAME).map((l) => l.width / l.height),
);

/**
 * HOW MUCH INK EACH NAME CARRIES, relative to the heaviest — and why the four
 * are not set at the same height any more.
 *
 * GENESIS: "AI Lab kyu chup gaya." On the Brain, and most visibly in the
 * share card where the whole thing is two inches wide, AI Lab reads as
 * faded next to the other three. It was measured before being changed, and
 * the obvious explanations are all wrong: composited over the page's own
 * ground at display size, the four marks' mean ink luminance is 138, 128,
 * 138 and 140 — AI Lab is not darker. Its ARTWORK is not weaker either; per
 * opaque pixel its colour is within a point of Brand & Design's.
 *
 * What differs is how much of it there is. At a common height the four cover
 * 1894, 1472, 1226 and 3171 square pixels of ink: "AI Lab" is two short words
 * and carries a QUARTER of what "Brand & Design" does. Same height, same
 * colour, a third of the presence — and shrunk to a thumbnail the smallest
 * one is the one that disappears.
 *
 * EQUAL HEIGHT IS THE WRONG KIND OF EQUAL, which this codebase already knows:
 * the client logo wall sizes each mark so that "every logo ends up covering a
 * comparable area — which is what the eye reads as the same size" (see
 * client-logos). The Brain was the one place still normalising height alone.
 *
 * HALF COMPENSATION, NOT FULL. Area goes as the square of the scale, so
 * equalising it outright would stand AI Lab 61% taller than Brand & Design —
 * a two-word name towering over a three-word one, which is a different
 * mistake. The exponent below is a quarter rather than a half, which closes
 * half the gap in perceived size: AI Lab comes up about 27% on Brand & Design
 * and the row still reads as one set. It also answers Genesis's older note,
 * "AI Lab ka logo shd be bigger", which the height-uniform pass overrode.
 *
 * The numbers are measured, not guessed: each PNG drawn at its display size,
 * alpha summed over every pixel. Re-measure if the artwork is re-cut.
 */
const NAME_INK: Record<string, number> = {
  Influence: 1894,
  Studios: 1472,
  "AI Lab": 1226,
  "Brand & Design": 3171,
};

const NAME_INK_MAX = Math.max(...Object.values(NAME_INK));

/** See NAME_INK. A quarter power closes half the gap in area. */
const INK_COMPENSATION = 0.25;

function inkScale(name: string): number {
  const ink = NAME_INK[name];
  if (!ink) return 1;
  return (NAME_INK_MAX / ink) ** INK_COMPENSATION;
}

export function DivisionLockup({
  name,
  tagline,
  ramp,
  as: Tag = "h2",
  height = TARGET_HEIGHT,
  fluid = false,
  board = false,
  nameOnly = false,
  taglineClassName,
  priority = false,
  className,
}: {
  /** The part after the dot — "Influence", "AI Lab". */
  name: string;
  tagline: string;
  /** Kept for the text fallback below. */
  ramp: string;
  as?: "h1" | "h2" | "h3";
  /**
   * Overrides how tall the lockup stands, in px. The divisions board around
   * the orb has four of these in two narrow side columns rather than one
   * across a section, so it asks for a smaller one.
   */
  height?: number;
  /**
   * Sizes by a share of the container instead of a pixel cap, so a set of
   * lockups in one composition all stand the same height. See `sizing`.
   */
  fluid?: boolean;
  /**
   * Uses the short-name artwork, which carries its own tagline — so no
   * tagline is printed beneath it. For the divisions board around the orb.
   */
  board?: boolean;
  /**
   * Uses the NAME artwork — the board mark with its tagline cropped away — and
   * prints the tagline as live text underneath. For the divisions board, where
   * Genesis wants the subtitle to appear only on hover: text can be revealed,
   * a picture cannot.
   *
   * Wins over `board` if both are passed, because it is the more specific
   * request; a caller asking for the name alone has already said it does not
   * want the tagline in the picture.
   */
  nameOnly?: boolean;
  /**
   * Extra classes on the tagline, so the caller can decide how it appears —
   * the divisions board hides it until the block is hovered or focused.
   * Ignored when the artwork is carrying the tagline itself.
   */
  taglineClassName?: string;
  /**
   * Preloads both variants at high priority. OFF by default, and that is a
   * fix rather than a preference.
   *
   * Every lockup renders TWO images — the pair is cross-faded so the mark
   * follows the theme — and this was unconditionally `priority`. The homepage
   * carries eight lockups, so it was emitting SIXTEEN high-priority preloads,
   * fifteen of them for marks thousands of pixels below the fold, all
   * competing with the hero and with each other on first paint. Measured in
   * the network log: the w=750 candidates for two of them were fetched and
   * aborted before the right size was even chosen.
   *
   * Only a lockup actually above the fold should ask for this. Everything
   * else lazy-loads, which is what next/image does correctly when left alone.
   */
  priority?: boolean;
  className?: string;
}) {
  const art = nameOnly ? NAME : board ? BOARD : MARK;
  const lockup = art[name];
  /* Only the board set burns its tagline into the picture. */
  const taglineInArt = board && !nameOnly;
  /*
    Only the board set is a light/dark PAIR. The name set and the mark set are
    one file each, drawn in inks that read on both grounds, so there is no
    second image to cross-fade and none is rendered.
  */
  const singleFile = !board || nameOnly;

  /*
    A division with no artwork falls back to the type it used to be rather
    than to a broken image. Nothing hits this today; a fifth division would,
    and it should look deliberate on the day it does rather than on the day
    someone remembers to draw it.
  */
  if (!lockup) {
    return (
      <div className={className}>
        <Tag className="flex flex-wrap items-baseline gap-x-1 text-h2 font-normal leading-[1.05] tracking-tight sm:text-h1">
          <span className="text-bone">GENESIS</span>
          <span className="text-brand-ink">.</span>
          <span className="ramp-text" style={{ "--ramp": ramp } as React.CSSProperties}>
            {name}
          </span>
        </Tag>
        <p className="mt-3 text-lead leading-relaxed text-ash">{tagline}</p>
      </div>
    );
  }

  const ratio = lockup.width / lockup.height;
  /*
    THE PATH CARRIES `wordmark`, AND THAT IS A CACHE FIX, NOT TIDINESS.

    These files were re-cropped in place — same names, same paths, different
    picture — and every layer that caches an image by URL went on serving the
    old one: the browser, Next's optimiser, and a CDN would too. The old crop
    had the tagline baked in and the new markup prints the tagline as text, so
    a stale copy does not look stale, it looks like a bug — the line appears
    twice, once burned into the picture and once underneath it. Genesis saw
    that three times and I kept calling it a refresh problem, which it was,
    but "tell everyone to hard-refresh" is not a fix.

    A changed asset gets a changed URL. The segment says what these are — the
    wordmark alone, no tagline — so the next person to re-crop them knows to
    move the segment rather than overwrite the file.
  */
  const src = (variant: "light" | "dark") =>
    nameOnly
      ? `/brand/divisions/name/${lockup.slug}.png`
      : board
        ? `/brand/divisions/board/${lockup.slug}-${variant}.png`
        : `/brand/divisions/mark/${lockup.slug}.png`;

  /*
    FLUID MODE EXISTS SO FOUR LOCKUPS CAN SHARE A HEIGHT.

    A fixed max-width gives each mark the same height only while there is room
    for all of them; in a narrow column the widest is clamped and the set ends
    up ragged — 53px for Brand & Design against 79 for Studios, which in a
    composition where all four are seen at once reads as a mistake rather than
    as four logos.

    So instead of capping width in pixels, each is given a PERCENTAGE of its
    column in proportion to how wide it is relative to the widest of the four.
    Brand & Design takes the full column, Influence 75% of it, Studios 68% —
    and the arithmetic falls out such that every one of them is exactly
    column / 7.36 tall, at every breakpoint, with nothing to keep in sync.
  */
  const maxRatio = nameOnly
    ? NAME_MAX_RATIO
    : board
      ? BOARD_MAX_RATIO
      : MAX_RATIO;
  /*
    THE HEIGHT IS A CSS VARIABLE, NOT A NUMBER, unless a caller names one.
    Genesis's one-screen test failed first on a 13-inch laptop, and a lockup
    is the first thing in eight sections — so it steps down with the window's
    height along with the type and the padding (see --lockup-h in globals).
    The width follows from it, which is why both bounds are expressed against
    the same variable rather than computed here in pixels.
  */
  const lockupH = height === TARGET_HEIGHT ? "var(--lockup-h)" : `${height}px`;
  /*
    THE SHARE OF THE COLUMN, lifted for the lighter marks — see NAME_INK.
    Only the name set is compensated: the board and mark sets carry the
    GENESIS prefix, which is the same width in all four, so they do not have
    the imbalance this corrects.
  */
  const sizing = fluid
    ? {
        width: `${(
          (ratio / maxRatio) * 100 * (nameOnly ? inkScale(name) : 1)
        ).toFixed(3)}%`,
      }
    : {
        maxWidth: `calc(${ratio.toFixed(3)} * ${lockupH})`,
        /*
          A FLOOR AS WELL AS A CEILING, for centred headings. A centred header
          shrinks to fit its widest child, and this box is a percentage width,
          so it contributes nothing to that: the heading ended up exactly as
          wide as the TAGLINE and the mark was squeezed to match. On a phone
          that stood Brand & Design at 39px when the screen had room for 49.
          The floor asks for the mark's full width, capped at the page's own
          column (the viewport less its 1.5rem gutters), so a wide mark takes
          the width available and a narrow one is unaffected.
        */
        minWidth: `min(calc(${ratio.toFixed(3)} * ${lockupH}), calc(100vw - 3rem))`,
      };
  const maxWidth = Math.round(height * ratio);

  return (
    <Tag className={className}>
      {/*
        The heading's actual text. Both halves of it are burned into the
        picture below, so printing them again would say everything twice — the
        same fault the poster cards had with their baked-in captions. This is
        the copy that is read, searched and translated.
      */}
      {/*
        The name, for anything that cannot see the picture. The tagline is NOT
        here any more — it is real text below, so repeating it would say it
        twice to a screen reader.
      */}
      {/*
        The full name for anything that cannot see the picture. The board's
        artwork drops the GENESIS prefix for composition reasons; the
        accessible name should not, and the tagline joins it there when the
        picture is carrying it instead of the text below.
      */}
      <span className="sr-only">
        Genesis.{name}
        {taglineInArt ? `, ${tagline}` : ""}
      </span>

      {/*
        The light variant sits in the flow and sets the box; the dark one is
        laid over it. Both are always rendered and cross-faded by
        --logo-invert, exactly as the master wordmark is, so the lockup
        follows the theme AND follows `.scene-dark` without either of them
        having to know there is a logo in here.
      */}
      {/*
        INLINE-BLOCK, NOT BLOCK, so the artwork follows its container's text
        alignment.

        THE BUG THIS FIXES, because "display" is an odd place to find an
        alignment fault. On the divisions board the two left-hand verticals
        are set `text-right` so they read in toward the orb, and the two on
        the right are set `text-left`. The tagline obeyed that; the picture
        did not. A block-level box ignores `text-align` entirely — it sits
        flush against the start edge of its container whatever the text under
        it is doing — and because `fluid` gives each mark a width proportional
        to its own aspect ratio, the four are all different widths. So the
        widest mark happened to fill its column and looked aligned, while a
        narrow one sat flush left inside a right-aligned column and hung out
        past its neighbour. Measured at 1440: Influence filled all 360px of
        the column, Brand & Design was 259px and started at the same left
        edge, leaving its right edge 101px short of Influence's.

        An inline-level box is positioned BY `text-align`, which is what makes
        this one line rather than a set of alignment props threaded down from
        every call site: the left column right-aligns its mark, the right
        column left-aligns its own, and a centred section centres it, all
        from the alignment those callers already declare for their text.

        `align-bottom` goes with it. An inline-block sits on the text baseline
        by default, which reserves room for descenders underneath and would
        add a few stray pixels below every lockup on the page.
      */}
      <span
        aria-hidden
        className="relative inline-block w-full align-bottom"
        style={sizing}
      >
        <Image
          src={src("light")}
          alt=""
          width={lockup.width}
          height={lockup.height}
          /*
            `preload`, not `priority`: Next 16 deprecated the latter for the
            former, with the same behaviour — eager, plus a preload hint in
            the head. High fetch priority because the only caller that asks
            is the hero, whose names are the homepage's LCP element.
          */
          preload={priority}
          fetchPriority={priority ? "high" : undefined}
          sizes={fluid ? FLUID_SIZES : `(min-width: 640px) ${maxWidth}px, 100vw`}
          className="h-auto w-full"
          /*
            The name set is one file for both themes — see the note on NAME —
            so it must NOT be faded by --logo-invert, or it would vanish
            entirely on whichever theme sets that token to 1.
          */
          style={singleFile ? undefined : { opacity: "calc(1 - var(--logo-invert, 0))" }}
        />
        {!singleFile && (
          <Image
            src={src("dark")}
            alt=""
            width={lockup.width}
            height={lockup.height}
            preload={priority}
            fetchPriority={priority ? "high" : undefined}
            sizes={fluid ? FLUID_SIZES : `(min-width: 640px) ${maxWidth}px, 100vw`}
            className={cn("absolute inset-0 h-auto w-full")}
            style={{ opacity: "var(--logo-invert, 0)" }}
          />
        )}
      </span>

      {/*
        THE TAGLINE, AS TYPE — but only where the picture does not already
        carry it. The wordmark set was cropped to the name alone precisely so
        this line could wrap; the board set keeps its tagline burned in, and
        printing it again there is the doubled line Genesis reported. One
        condition, decided by which artwork is in use, so it cannot be got
        wrong at a call site.
      */}
      {!taglineInArt && (
        <span
          className={cn(
            /*
              ONE LINE ON A PHONE. Genesis flagged Influence's and AI Lab's
              taglines wrapping onto a second line on mobile ("this shd be in
              one line", "one line please"). The size tracks the viewport
              between 11 and 14px so the longest, "Influencer Marketing |
              Celeb Partnerships & UGC", still fits a 375px screen; from `sm`
              up it wraps and sizes exactly as it did.
            */
            "mt-2 block whitespace-nowrap text-[clamp(0.6875rem,3.3vw,0.875rem)] leading-relaxed text-ash sm:whitespace-normal sm:text-pretty sm:text-lead",
            /*
              LAST, so a caller can actually override the defaults above.
              `cn` runs tailwind-merge, which resolves conflicts by source
              order within one property group — the divisions board passes a
              smaller size and a tighter leading and needs them to win over
              `sm:text-lead` and `leading-relaxed`.
            */
            taglineClassName,
          )}
        >
          <Tagline text={tagline} />
        </span>
      )}
    </Tag>
  );
}

/**
 * A division tagline, with its dividers DRAWN rather than typed.
 *
 * Genesis asked for the parts of these lines to be separated by a pipe rather
 * than a comma. Typing "|" is the obvious way to do that and it renders as a
 * missing-glyph box here: the display face, mont, has no vertical bar, so the
 * browser falls through to whatever the platform offers and the divider comes
 * out as a small rectangle with hex digits in it — visible on the AI Lab and
 * Brand & Design lockups as a mark that reads like tiny stray lettering.
 *
 * A one-pixel rule sidesteps the glyph entirely: it cannot be missing from a
 * font, it takes the surrounding colour, and it can be set to the height the
 * line actually wants instead of the full ascender the character would have
 * occupied. It is aria-hidden, so the line is announced as its parts rather
 * than as "Avatars vertical line Multilingual Content".
 */
function Tagline({ text }: { text: string }) {
  const parts = text.split("|").map((part) => part.trim());
  return (
    <>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 && (
            <span
              aria-hidden
              className="mx-[0.5em] inline-block h-[0.85em] w-px translate-y-[0.1em] bg-current opacity-40"
            />
          )}
          {part}
        </span>
      ))}
    </>
  );
}
