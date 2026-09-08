import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { WorkGrid } from "@/components/genesis/work-grid";
import { work } from "@/lib/work";

/**
 * How many pieces the homepage browse shows.
 *
 * The full catalogue ran to 2.76 screens here, against a brief that asks for
 * one section to a screen. The rest is one click away at /our-work, which is
 * the page built for browsing all of it.
 *
 * EIGHT NOW THAT THE GRID IS FOUR COLUMNS WIDE. Six was two full rows of
 * three; in four columns it is one row and a gap-toothed second, which reads
 * as a grid that ran out of work rather than one that stops. Eight fills two
 * rows exactly, and at the smaller tile size those two rows are shorter than
 * the old two were.
 */
const ON_HOMEPAGE = 8;

/**
 * What the homepage shows, and in what order.
 *
 * IT WAS `work.slice(0, 8)` — the first eight entries in the array, which is
 * an ordering nobody chose. It happened to be the ten mockup cards first, so
 * the homepage library was eight placeholder stills and none of the real
 * footage, and adding a client at the wrong line of the catalogue would have
 * silently changed what the homepage led with.
 *
 * Featured first now, and `featured` means the piece has work you can watch.
 * The rest follow in catalogue order to fill the row out.
 */
function forHomepage() {
  const featured = work.filter((item) => item.featured);
  const rest = work.filter((item) => !item.featured);
  return [...featured, ...rest].slice(0, ON_HOMEPAGE);
}

/**
 * The full work library, on the homepage, after the four verticals.
 *
 * THE ONE BROWSE ON THE PAGE, after all four verticals. There used to be a
 * poster rail above it under "Selected work" doing the same job from the same
 * catalogue, four cards shorter — Genesis counted the work three times over
 * and this was the third. The rail is gone; Studios keeps its own reel wall,
 * which is that division showing its footage rather than a second catalogue,
 * and its button scrolls down here.
 *
 * It is the same grid and the same catalogue as /our-work, so a piece cannot
 * appear in one and be missing from the other, and every tile leads to the
 * same /work/<slug>.
 */
export function WorkLibrary() {
  return (
    <section
      id="library"
      className="relative isolate overflow-hidden py-12 sm:py-14 lg:py-16"
    >
      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
          <Reveal className="max-w-xl">
            <SectionLabel dot tone="brand">
              Everything we&rsquo;ve made
            </SectionLabel>
            {/*
              GENESIS'S OWN NAME FOR THIS SECTION. It read "The full library",
              which was a description rather than a title — and the deck calls
              this board Portfolio | Case Studies. The separator is set as its
              own muted span rather than typed into either half, so at 56px it
              reads as a divider between two names instead of hyphenating one
              long one.
            */}
            <h2 className="mt-4 text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
              Portfolio{" "}
              <span aria-hidden className="text-faint">
                -
              </span>{" "}
              <span className="font-serif font-normal italic text-brand-ink">
                Case Studies
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <GlassButton href="/our-work" variant="glass" arrow>
              Open the portfolio
            </GlassButton>
          </Reveal>
        </div>

        <Reveal variant="scene" className="mt-8">
          <WorkGrid items={forHomepage()} />
        </Reveal>
      </div>
    </section>
  );
}
