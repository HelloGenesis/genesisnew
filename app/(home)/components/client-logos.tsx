import Image from "next/image";

import { LogoMarquee } from "@/components/genesis/logo-marquee";
import { Reveal } from "@/components/genesis/reveal";
import { clients } from "@/lib/home-content";
import { cn } from "@/lib/utils";
import { SectionShell } from "./section-shell";

/**
 * Section 5 — Clients we've worked with.
 *
 * IT MOVES, AND IT IS BLACK AND WHITE. Both are Genesis's instruction, and
 * between them they replace the static seven-column wall that stood here.
 *
 * WHY MOVING IS MORE THAN A FLOURISH. Thirty marks in a fixed grid is a
 * DIRECTORY: the eye is asked to read it, so it starts at the top left and
 * gives up somewhere in the third row. A rail that drifts is a credential —
 * you take in that there are a lot of them and recognise the three or four
 * you know as they pass. It is also a third of the height, which is what the
 * grid was really costing: five rows of chips between the Brain and the first
 * vertical.
 *
 * TWO ROWS, OPPOSITE DIRECTIONS. One row of thirty is a track four screens
 * wide, so any given mark comes round about once a minute. Split in two and
 * run against each other, the same thirty pass in half the time and the
 * counter-motion is what stops a drifting rail reading as a page that has not
 * finished loading.
 *
 * BLACK AND WHITE, AND NO CHIPS. Both are Genesis's instruction. The wall was
 * thirty white lozenges with a mark inside each; they asked for the white
 * blocks gone and only the PNGs shown.
 *
 * REMOVING THE CHIP IS NOT JUST DELETING A BACKGROUND, which is worth writing
 * down because it looks like it should be. The chip was load-bearing:
 * twenty-three of the thirty files are dark ink drawn for white paper, and on
 * a near-black page they are invisible. What replaces it is a per-theme
 * correction chosen per mark by SIMULATION — each file was composited over
 * the dark page under all three candidate filters and scored on visibility
 * and on blockiness, the share of the frame that ends up opaque and far from
 * the ground. See `treat` in lib/home-content for the numbers and
 * `.client-mark` in globals.css for the two sets of rules. The headline is
 * that inversion is NOT the default: flipping a logo drawn as a solid dark
 * plaque produces a white rectangle, which is the very thing being removed.
 *
 * WHAT SURVIVED THE REWRITE, BECAUSE IT WAS NEVER ABOUT DECORATION. The marks
 * run from 0.89:1 to 12.63:1 — fourteen times the spread — so `object-contain`
 * in a uniform box fits each to whichever edge it hits first, and a square
 * mark stands full height while Mahindra Finance stands at a twelfth of it.
 * That is geometry, not padding, and it does not go away because the chip
 * did. Each mark still takes its WIDTH from the measured `ratio`, so every
 * logo ends up covering a comparable area — which is what the eye reads as
 * "the same size". The box is simply invisible now.
 */

/**
 * How tall a mark's ink stands, and how wide its box is allowed to get.
 *
 * A ROW SIZES BY HEIGHT, WHICH IS THE OPPOSITE OF A GRID. In a grid every
 * cell is the same width and the mark's ratio decides how much of it gets
 * used; in a rail every box is the same HEIGHT and the ratio decides how wide
 * the box is. A long wordmark gets a long box and a square mark a square one,
 * and both stand the same height.
 */
const RAIL_HEIGHT = 38;

/** Nothing may run wider than this, whatever its ratio. */
const MAX_MARK = 176;
/** …or narrower than this, so a near-square mark still holds its ground. */
const MIN_MARK = 88;

function markWidth(ratio: number): number {
  return Math.round(
    Math.min(MAX_MARK, Math.max(MIN_MARK, RAIL_HEIGHT * ratio + 44)),
  );
}

/**
 * Which correction each mark gets. `lift` is the base class's own default —
 * twenty-three of the thirty take it — so it maps to no modifier at all.
 */
const TREAT_CLASS: Record<string, string> = {
  lift: "",
  invert: "client-mark--invert",
  asis: "client-mark--asis",
};

function LogoMark({ logo }: { logo: (typeof clients.logos)[number] }) {
  return (
    /*
      A box with nothing painted in it. It still exists — it is what holds
      every mark to the same height and gives the rail its rhythm — but it
      has no fill and no border, so what a visitor sees is the PNG and the
      page behind it.
    */
    <span
      className="flex items-center justify-center"
      style={{ width: markWidth(logo.ratio), height: "3.25rem" }}
    >
      <span
        className="relative block w-full"
        style={{ height: RAIL_HEIGHT }}
      >
        <Image
          src={`/clients/${logo.file}.png`}
          alt={logo.name}
          fill
          // The widest box is MAX_MARK; 2x covers a retina display.
          sizes={`${MAX_MARK * 2}px`}
          className={cn("object-contain client-mark", TREAT_CLASS[logo.treat])}
        />
      </span>
    </span>
  );
}

export function ClientLogos() {
  const half = Math.ceil(clients.logos.length / 2);
  const rows = [clients.logos.slice(0, half), clients.logos.slice(half)];

  return (
    <SectionShell
      id="clients"
      label={clients.label}
      heading={clients.heading}
      headingAccent={clients.headingAccent}
      body={clients.body}
      tone="brand"
      origin="center"
      intensity={0.14}
    >

      {/*
        FULL-BLEED. A marquee that stops at the container's edge has 144px of
        empty page beyond its own fade on a large display, which reads as a
        rail that failed rather than as one running off the screen. It runs to
        both edges and the mask dissolves it into the page.
      */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 space-y-4">
        {rows.map((row, index) => (
          <LogoMarquee
            key={index}
            /*
              Different speeds as well as different directions. Two rails at
              the same rate moving opposite ways beat against each other and
              the pair reads as one mechanism; a few seconds apart and they
              read as two.
            */
            speedSeconds={index === 0 ? 52 : 60}
            reverse={index === 1}
            items={row.map((logo) => (
              <LogoMark key={logo.file} logo={logo} />
            ))}
          />
        ))}
      </div>

      {/*
        THE SECTORS, UNDER THE MARKS. Genesis removed the positioning section
        this line used to live in and asked for it kept with the client wall.
        It sat above the rail for one round and they have asked for it back
        underneath: logos first, copy after. The marks are the evidence and
        this is the caption on them, and a caption goes below the picture.

        Set at the wall's own weight, not louder. It is the same micro-label
        it always was; what changed is what it is a caption FOR.
      */}
      <Reveal delay={0.1} className="mt-10">
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {clients.sectors.map((sector, index) => (
            <li key={sector.label} className="flex items-center gap-3">
              {/*
                An <abbr> only where there is something to expand. Wrapping
                every sector in one would announce "abbreviation" before
                "Fashion" to a screen reader, which is a worse line than the
                plain word.
              */}
              {sector.expands ? (
                <abbr
                  title={sector.expands}
                  className="micro-label !text-faint no-underline"
                >
                  {sector.label}
                </abbr>
              ) : (
                <span className="micro-label !text-faint">{sector.label}</span>
              )}
              {index < clients.sectors.length - 1 && (
                <span aria-hidden className="text-brand">
                  ·
                </span>
              )}
            </li>
          ))}
        </ul>
      </Reveal>
    </SectionShell>
  );
}
