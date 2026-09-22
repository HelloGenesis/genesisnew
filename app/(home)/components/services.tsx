import { Spectrum } from "@/components/genesis/atmosphere";
import { DivisionBoard } from "@/components/genesis/division-board";
import { services } from "@/lib/home-content";

/**
 * Section 1 — the Brain: what Genesis is, and the four divisions around it.
 *
 * THE COMPOSITION IS GENESIS'S OWN. The company's films put a single dotted
 * sphere in the middle of the frame with the wordmark across its core and the
 * four division names at the four corners around it, each in its own
 * warm-to-cool ramp. That picture is an argument: one body, four things in
 * orbit, and it says "four divisions, one creative system" better than a list
 * can.
 *
 * THE WORDS ARE BACK OVER IT, AND THAT IS THE POINT OF THIS PASS. The board
 * ran headerless for a round — no label, no heading, no standfirst — on the
 * reasoning that the picture said everything. Genesis's read after living
 * with it is that a visitor arriving cold cannot tell what the company IS
 * from a diagram of four gradient words, and that "a user should understand
 * Genesis within the first few seconds without having to scroll further".
 *
 * So two lines sit above the orb and nothing else does: the claim the picture
 * makes, and the plain-English version of it. No eyebrow label — three
 * stacked pieces of type over the composition is the crowding the header was
 * removed for in the first place, and "What we do" is not information.
 *
 * EVERYTHING INTERACTIVE MOVED OUT, to DivisionBoard. The hover, the orb's
 * reaction, the entrance sequence and the cursor parallax are one behaviour
 * across five elements and they belong in one client component; this file
 * stays a server component that renders a heading and a stage.
 */
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
          ONE LINE OVER THE ORB, NOT TWO. Genesis has taken "Four divisions.
          One creative system." off at their own request — the four names
          around the sphere already say it, in pictures, and a heading
          restating the diagram directly above the diagram is the stutter this
          page keeps having to remove.

          WHAT STAYS IS THE ONE A CRAWLER AND A STRANGER BOTH NEED. "We help
          brands grow through creators, content, AI, technology and design" is
          the plain-English positioning, and it is what a brand actually types
          into a search box — where "one creative system" is the design's own
          idea and nobody's query.

          SO THIS LINE IS THE H1 NOW. The page needs exactly one top-level
          heading; deleting the visible one and leaving nothing would put the
          homepage back to having none, which is a bug this file has already
          fixed twice. Promoting the survivor costs no layout and keeps the
          document structure honest.

          IT IS SET AT BODY SIZE ON PURPOSE. An h1 is a role, not a type
          scale, and this one sits above the composition that is meant to be
          the hero — at heading size it would take the orb's job. Slightly up
          from the old sub-line, which was sized to sit under something.
        */}
        <DivisionBoard />

        {/*
          THE LINE SITS UNDER THE COMPOSITION, NOT OVER IT — "sabse pehle orb
          aur four verticals".

          It was above, which meant the first thing on the page was a sentence
          and the picture the page is built around came second. Genesis's
          order puts the diagram first and the words under it as the caption:
          you see one body with four things in orbit, and then you read what
          that is. A visitor who understands the picture never has to read the
          line at all, which is the whole argument for having the picture.

          IT IS STILL THE H1. A heading below its content is unusual to write
          and perfectly ordinary to read — the document needs exactly one
          top-level heading and this is the only text in the section, so
          demoting it would leave the homepage with none. Heading order in the
          DOM is about structure, not about vertical position.
        */}
        <h1 className="mx-auto mt-10 max-w-2xl text-balance text-center text-body font-normal leading-relaxed text-bone/85 sm:mt-12 sm:text-lead">
          {services.body}
        </h1>
      </div>
    </section>
  );
}
