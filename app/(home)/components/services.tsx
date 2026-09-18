import Link from "next/link";

import { Spectrum } from "@/components/genesis/atmosphere";
import { GenesisMark } from "@/components/genesis/genesis-mark";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { NeuralOrb } from "@/components/genesis/neural-orb";
import { RevealGroup, RevealItem } from "@/components/genesis/reveal";
import { services } from "@/lib/home-content";

/**
 * Section 2 — the four divisions, set around the orb.
 *
 * THE COMPOSITION IS GENESIS'S OWN. The company's films put a single dotted
 * sphere in the middle of the frame with the wordmark across its core and the
 * four division names at the four corners around it, each in its own
 * warm-to-cool ramp. That picture is an argument: the heading says "four
 * divisions, one system", and a diagram of one body with four things in orbit
 * says it better than a list can.
 *
 * WHAT THIS REPLACED, TWICE OVER. First, five pinned paper cards dropped
 * across an arc under a raking spotlight — the exact "normal agency template"
 * the guidelines tell you to reject. Then a plain four-row list, built to the
 * deck's division pages, which was right about the typography and silent
 * about the relationship between the four.
 *
 * WHY THE NAMES LOSE THE PREFIX. On the deck's division pages each name is
 * set in full — Genesis.Influence — because it is alone on a black page and
 * nothing else identifies it. Here the wordmark is at the centre of the
 * picture, so the prefix is already said; repeating it four times around a
 * Genesis logo is a stutter. The short names are in the content file beside
 * the full ones rather than sliced off the end of a string.
 *
 * WHY THE COLUMNS RAG INWARD. The left pair is right-aligned and the right
 * pair left-aligned, so all four names run toward the sphere instead of
 * toward the page edges. It is the only thing holding the corners to the
 * middle once the type is this large.
 *
 * THERE IS NO HOVER GLOW ANY MORE. This went through two versions — a rule
 * growing out from under each name, then a coloured drop-shadow halo in the
 * division's own ramp — and Genesis has asked for both gone. What is left is
 * the lift, which is enough to say a name is a target without lighting the
 * charcoal up around it.
 *
 * THE SUBTITLE IS THE HOVER STATE INSTEAD. Genesis asked for each division's
 * tagline to appear only while the reader is pointing at its name. That is
 * why the board can no longer use the `board` artwork: those files carry the
 * tagline burned in, and a picture cannot be revealed a band at a time. The
 * marks are re-cropped to the name alone (`nameOnly`) and the tagline is live
 * text again, which is also what makes it selectable and translatable.
 *
 * IT RESERVES ITS SPACE. The tagline fades rather than mounting, so pointing
 * at a name does not push the other three around — and on a touch screen,
 * where there is no hover at all, it is simply always visible.
 */

/**
 * Where each division sits, in order. Written as whole class strings because
 * Tailwind reads the source for literals; `lg:col-start-${n}` compiles to
 * nothing at all.
 */
/*
  THE SAME FOUR CORNERS ON A PHONE. Below `lg` this used to fall back to one
  column: the orb, then the four names stacked under it with their taglines
  showing, a screen and a half of scrolling for what is one diagram on desktop.
  Genesis asked for it smaller and "desktop jaisa". So a phone gets the same
  arrangement turned on its side: two names above the orb, two below, each in
  the quadrant it holds on desktop.

  CENTRED IN THEIR QUADRANTS ON A PHONE, not hugging the middle. The first
  pass aligned each name in toward the sphere the way the desktop columns
  are, and Genesis reported the phone as still misaligned — rightly. Pushed
  to the centre line, a pair is only balanced if its two names are the same
  width, and Brand & Design is more than twice Studios, so the bottom pair
  sat visibly off-centre under the orb. Centred in its own half, every name
  lands the same distance either side of the sphere's axis whatever its
  length. Desktop keeps its inward alignment from `lg`, where the names sit
  beside the orb rather than above and below it.
*/
const PLACEMENT = [
  "col-start-1 row-start-1 items-center text-center lg:col-start-1 lg:row-start-1 lg:items-end lg:text-right",
  "col-start-1 row-start-3 items-center text-center lg:col-start-1 lg:row-start-2 lg:items-end lg:text-right",
  "col-start-2 row-start-3 items-center text-center lg:col-start-3 lg:row-start-2 lg:items-start lg:text-left",
  "col-start-2 row-start-1 items-center text-center lg:col-start-3 lg:row-start-1 lg:items-start lg:text-left",
];

export function Services() {
  return (
    <section
      id="services"
      /*
        THE FIRST THING ON THE PAGE, so it carries hero spacing: enough top
        padding to clear the fixed nav pill, and a min-height that gives the
        orb a full screen to sit in rather than the 24 units of section
        padding it had when it was section two.
      */
      /*
        CHARCOAL, ON THE DARK THEME. Genesis named the colour: #242426, the
        guidelines' own cover ground. `.scene-charcoal` paints it, and on the
        light theme it deliberately paints nothing — see the note on that
        class. Genesis's feedback was that light mode was right as it was, and
        forcing a near-black slab under a light nav was not what the charcoal
        instruction meant.

        It replaces `.scene-open`, which was a rule about when a dark chapter
        should NOT paint. This one is about when it should.
      */
      /*
        ONE SCREEN, ON EVERY DEVICE ("this should appear in one single
        section"). min-h-dvh was `lg:` only, so on a phone the hero stopped
        546px down and the client wall's first logos pushed into the same
        screen under a band of dead padding — the orb read as half a section
        with somebody else's section under it. Full height and centred, the
        orb and its four names own the screen and the wall starts below it.
      */
      className="scene-charcoal grain relative isolate flex min-h-dvh flex-col justify-center overflow-hidden pb-[calc(var(--section-pad)*2)] pt-[calc(var(--section-pad)*3.4)]"
    >
      {/*
        Transitions into and out of the dark chapter, for the LIGHT theme
        only. --chapter-blend is the PAGE's ground — white on light, nothing
        on dark — so on dark these evaluate to transparent and paint nothing,
        which is right: there is no join to hide, and a band of flat colour
        over the page's own light field would be the very cut this pass
        removed. 64px, which is the section's own minimum padding, so the
        fade never reaches anything that has to stay readable.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-16"
        style={{
          background:
            "linear-gradient(180deg, var(--chapter-blend) 0%, color-mix(in srgb, var(--chapter-blend) 40%, transparent) 55%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16"
        style={{
          background:
            "linear-gradient(0deg, var(--chapter-blend) 0%, color-mix(in srgb, var(--chapter-blend) 40%, transparent) 55%, transparent 100%)",
        }}
      />

      <Spectrum />

      <div className="relative z-[2] mx-auto w-full max-w-7xl px-6">
        {/*
          NO HEADER AT ALL. The label, the heading and the standfirst have all
          gone at Genesis's request: the hero is the orb and the four names,
          exactly as the reference film is. Removing the heading on its own
          left a label and a floating paragraph either side of empty space,
          which read as something that had failed to load.

          The h1 stays, screen-reader only. A page needs exactly one top-level
          heading, and deleting the visible one and leaving nothing would put
          the homepage back to having none — the bug fixed three commits ago.
        */}
        <h1 className="sr-only">
          Genesis Media — four divisions, one creative system
        </h1>

        {/*
          Three columns on desktop: names, orb, names. The orb is a real grid
          item spanning both rows rather than an absolutely-placed backdrop,
          which is what guarantees the type can never land on top of it at any
          width. Below lg the whole thing folds to one column with the orb
          first, because on a phone a sphere behind live text is a legibility
          problem dressed as atmosphere.
        */}
        {/*
          ONE LINE EACH, WHICH IS A MEASUREMENT NOT A PREFERENCE. At the old
          sizes the side columns were 272px and "Brand & Design" needed 406px
          at 56px type, so it broke over two lines; three of the four captions
          needed just over 300px and broke too. Three changes buy the width
          back: the container goes to max-w-7xl, the orb's own track narrows
          between lg and xl where the squeeze is worst, and the gaps come in.
          The side columns are 296px at lg and 360px from xl up, which is what
          the type below is sized against.
        */}
        <RevealGroup className="mt-10 grid grid-cols-2 items-center gap-x-5 gap-y-6 sm:mt-12 lg:grid-cols-[1fr_minmax(0,20rem)_1fr] lg:grid-rows-2 lg:gap-x-8 lg:gap-y-12 xl:grid-cols-[1fr_minmax(0,26rem)_1fr] xl:gap-x-12">
          <RevealItem className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {/*
              The orb overruns its own column by 11% each side, into the grid
              gap — which is why that gap is 14. It buys the sphere the
              presence it has on the board, roughly a third of the frame,
              without taking width off the names.

              The track and the overrun both grew when the surface started
              displacing: the radius had to come down from 0.42 of the box to
              0.375 to leave room for a crest, so the box grew to keep the
              sphere the same size on the page.
            */}
            {/* The orb is bound by the window's HEIGHT as well as its width: it is
              the one thing in the hero that can push the four names off a
              short screen. */}
            {/*
              CENTRED BY TRANSLATE, NOT BY MARGINS. The overrun used to be
              negative margins of 11% a side, which only centres while the
              width fills the space they open. On a laptop the height bound
              (52vh) wins and the box is narrower than that — so it sat
              pinned to the left edge of the opened space, 20px off centre,
              which is what Genesis saw. Half the column plus a translate of
              half the box centres it at any width. Grown a little with it.
            */}
            <div className="relative mx-auto w-[min(62vw,17rem,36vh)] lg:left-1/2 lg:mx-0 lg:w-[min(130%,58vh)] lg:-translate-x-1/2">
              <NeuralOrb />

              {/*
                The wordmark at the core. aria-hidden because the header
                already carries the real one — a second "Genesis Media" in the
                accessibility tree is noise, and this one is a picture.
              */}
              {/*
                FOLLOWS THE THEME AGAIN. This was pinned `.on-dark` while the
                orb sat on a black stage in both themes. The stage is gone and
                the sphere now renders dark-on-paper in the light theme, so the
                mark wants the dark lockup there and the white one on black —
                which is exactly what --logo-invert already does unaided.
              */}
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
              >
                {/*
                  SIZED AGAINST THE SPHERE, AS A SHARE OF IT.

                  It was h-20/w-180px — fixed pixels that had no relationship
                  to the orb they sit inside, so the mark stayed one size while
                  the sphere grew from 390px at lg to 507 at xl and shrank to
                  the viewport below it. Measured: the sphere's visible extent
                  is 0.858 of its box (the glow reaches past the geometric
                  radius, which is 0.375), so at lg the mark was 180px inside a
                  335px sphere — 54% of it, a small lockup floating in a large
                  circle, which is what Genesis was looking at.

                  64% of the box is 75% of the sphere: a chord across the
                  middle leaving an eighth of the diameter clear at each end,
                  about 42px at lg. Wide enough to read as the sphere's core
                  rather than a label on it, short of the rim by enough that it
                  is obviously deliberate. As a percentage it now tracks the
                  orb at every breakpoint instead of being re-guessed at each.

                  `sizes` is passed because the default 120px is a nav-bar
                  figure — at 250-325px here it would pick the 256 candidate
                  and render 1x on a retina screen.
                */}
                {/*
                  `animated`, so the mark at the orb's core catches the same
                  light as the one in the header. Genesis asked for the two to
                  match. It is the same sheen — a gradient masked to the
                  wordmark's own alpha — so it travels through the letterforms
                  here exactly as it does in the pill, and both sit still for
                  most of their six-second cycle rather than shimmering
                  continuously in the corner of the eye.
                */}
                <GenesisMark
                  animated
                  className="h-auto w-[64%] aspect-[8.8/1]"
                  sizes="(min-width: 1280px) 330px, (min-width: 1024px) 255px, 40vw"
                />
              </div>
            </div>
          </RevealItem>

          {services.items.map((service, index) => (
            <RevealItem
              key={service.title}
              className={`flex flex-col ${PLACEMENT[index] ?? ""}`}
            >
              {/*
                THE WHOLE VERTICAL IS THE TARGET, name and caption together —
                a two-line block where only the first line is clickable is a
                small target and an arbitrary one. `group` drives the hover
                from the wrapper so pointing anywhere in the block lights all
                of it.
              */}
              <Link
                href={service.href}
                className="group flex w-full flex-col rounded-sm outline-none transition-transform duration-300 ease-out focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-transparent motion-safe:hover:-translate-y-0.5"
              >
                {/*
                  THE FULL LOCKUP, at Genesis's instruction — artwork, not the
                  short name set in type. This was "Influence" at 48px with
                  its caption underneath; it is now GENESIS.Influence and its
                  tagline as one supplied mark.

                  WHAT IT COSTS, measured, because it is the whole reason the
                  short name was here: the board gives each division a side
                  column, and the widest mark is 7.36:1, so the set can only
                  stand column-width / 7.36 tall. The name inside the mark
                  ends up around 32px where the type it replaces was 48. It
                  is the composition that is the constraint, not the CSS —
                  four full lockups and a sphere do not all fit across 1232px
                  at the size four short words did.

                  `fluid` is what keeps the four the same height as the column
                  changes; see the note on it in DivisionLockup. The glow moves
                  here from the old <h3>: still a drop-shadow, because a PNG
                  with transparency needs the halo to follow its alpha rather
                  than its box.
                */}
                <DivisionLockup
                  name={service.short}
                  tagline={service.caption}
                  ramp={service.ramp}
                  as="h3"
                  fluid
                  /*
                    THE NAME SET: the short name, no GENESIS prefix, and the
                    tagline cropped out of the artwork so it can be live text
                    below. The wordmark is already at the orb's core, so the
                    full lockup in all four corners made the composition say
                    GENESIS five times — which is why this is not the wordmark
                    set — and the tagline has to be text, which is why it is no
                    longer the board set either.
                  */
                  nameOnly
                  /*
                    HIDDEN UNTIL POINTED AT. Opacity rather than mounting, so
                    the four names never shift as the reader moves between
                    them; the line keeps its space whether or not it is shown.

                    `(hover: none)` covers every touch screen, where there is
                    no hover to give and a permanently invisible subtitle would
                    simply be a missing one.

                    AND IT IS SET AS A CAPTION, NOT AS BODY COPY. The default
                    tagline size is text-lead — 19px on 31px of leading —
                    because on a division's own SECTION it is the standfirst
                    under the mark and that is the right size for it. On the
                    board it is a label under a 32px logo, and at 19px it
                    wrapped to two airy lines that read as a paragraph
                    somebody had left there. Measured: 61px of text under a
                    43px mark, which is a caption outweighing its subject.

                    14px on 1.35 leading puts two lines at 38px. The explicit
                    min-height is what keeps the four aligned once the size
                    drops: at 360px some taglines now fit on ONE line and
                    others still take two, and without a floor the marks would
                    sit at four different heights on hover.
                  */
                  taglineClassName="hidden lg:block mt-3 min-h-[2.7em] text-small leading-[1.35] text-balance sm:text-small opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none lg:[@media(hover:none)]:opacity-100"
                />
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
