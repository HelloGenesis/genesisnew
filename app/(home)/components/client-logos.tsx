import Image from "next/image";

import { LogoMarquee } from "@/components/genesis/logo-marquee";
import { BoardClock, SplitFlap } from "@/components/genesis/split-flap";
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

/*
  THE DEVICE: A DEPARTURES BOARD.

  Brand & Design is a set of folders; this section is the board at the gate.
  Every brand on it has already flown with Genesis, so the status column
  reads BOARDED, the destination flaps through the sectors the brands come
  from, and the marks themselves run past on the board's two rows. It says
  "a lot of people have travelled this way" without a single adjective.
*/
export function ClientLogos() {
  const half = Math.ceil(clients.logos.length / 2);
  const rows = [clients.logos.slice(0, half), clients.logos.slice(half)];
  const sectorWords = clients.sectors.map((s) => s.label);

  return (
    <SectionShell
      id="clients"
      label={clients.label}
      heading={clients.heading}
      headingAccent={clients.headingAccent}
      body={clients.body}
      /*
        Off on phones, at Genesis's request ("remove highlighted text on
        mobile"). On a narrow screen the line is three rows of caption between
        the heading and the wall it describes; the marks make the point faster.
      */
      bodyClassName="hidden sm:block"
      tone="brand"
      origin="center"
      intensity={0.14}
    >
      <Reveal variant="scene">
        <div className="gm-rim relative overflow-hidden rounded-panel shadow-[0_30px_80px_-30px_rgb(164_92_255/0.35)]">
          {/* The board's header strip. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(90deg,rgb(255_197_22/0.14),rgb(232_102_58/0.08)_45%,rgb(164_139_224/0.12))] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md bg-brand text-on-brand">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
                </svg>
              </span>
              <span className="font-mono text-small font-semibold uppercase tracking-[0.28em] text-bone">
                Departures
              </span>
              <span className="hidden font-mono text-micro uppercase tracking-[0.2em] text-faint sm:inline">
                / Genesis Terminal
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-micro uppercase tracking-[0.2em] text-ash">
              <span className="flex items-center gap-2">
                <span className="gm-pulse size-2 rounded-full bg-[#7ee08a]" aria-hidden />
                Live
              </span>
              <BoardClock className="text-bone" />
            </div>
          </div>

          {/* Column heads, and the one row that flaps. */}
          <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2 px-4 pt-4 font-mono sm:grid-cols-[auto_1fr_auto] text-micro uppercase tracking-[0.22em] text-faint sm:gap-x-8 sm:px-6">
            <span>Flight</span>
            <span className="hidden sm:block">Sector</span>
            <span className="text-right">Status</span>

            <span className="gm-ramp-text gm-ramp-text--full text-small font-semibold tracking-[0.12em]">
              GNS {String(clients.logos.length).padStart(3, "0")}
            </span>
            <SplitFlap words={sectorWords} className="order-last col-span-2 min-w-0 overflow-hidden text-[0.75rem] sm:order-none sm:col-span-1 sm:text-small" />
            <span className="justify-self-end rounded-md bg-brand px-2.5 py-1 text-right text-[0.7rem] font-semibold tracking-[0.18em] text-on-brand">
              Boarded
            </span>
          </div>

          {/* The marks, running past on the board's two rows. */}
          <div className="mt-4 space-y-2 border-y border-white/10 bg-[rgb(0_0_0/0.18)] py-3">
            {rows.map((row, index) => (
              <LogoMarquee
                key={index}
                speedSeconds={index === 0 ? 52 : 60}
                reverse={index === 1}
                items={row.map((logo) => (
                  <LogoMark key={logo.file} logo={logo} />
                ))}
              />
            ))}
          </div>

          {/* The sectors as gates. */}
          <ul className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-3 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-6">
            {clients.sectors.map((sector, index) => (
              <li
                key={sector.label}
                className="flex shrink-0 items-center gap-2 rounded-md border border-white/10 bg-[var(--hover-wash)] px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em]"
              >
                <span className="text-brand-ink">G{String(index + 1).padStart(2, "0")}</span>
                {sector.expands ? (
                  <abbr title={sector.expands} className="text-ash no-underline">
                    {sector.label}
                  </abbr>
                ) : (
                  <span className="text-ash">{sector.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </SectionShell>
  );
}
