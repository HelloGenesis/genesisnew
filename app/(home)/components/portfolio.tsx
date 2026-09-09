import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { WorkGrid } from "@/components/genesis/work-grid";
import { work, type WorkItem } from "@/lib/work";

/**
 * The portfolio grid, after the four verticals.
 *
 * IT WAS MERGED INTO THE CLIENT WALL AND IS SEPARATE AGAIN. Genesis asked for
 * the logos and the grid combined; they have since given the page's running
 * order, and in it the client wall sits second — up under the orb, as the
 * credential — while the portfolio sits ninth, after every division has had
 * its say. Those are two different jobs at two different depths, so they are
 * two sections again.
 *
 * WHY THE ORDER MAKES SENSE. The wall answers "should I keep reading" and
 * belongs early. The grid answers "show me everything" and only lands once a
 * visitor knows what the four divisions are; put it second and it is a
 * catalogue with no vocabulary behind it.
 *
 * It is the same grid and the same catalogue as /our-work, so a piece cannot
 * appear in one and be missing from the other, and every tile leads to the
 * same /work/<slug>.
 */

/**
 * What the homepage browse shows, and why it is not simply the first eight.
 *
 * IT WAS `featured, then catalogue order, sliced to 8`, and after the
 * portfolio Drive landed that produced eight tiles that were all Influence
 * and Studios — every AI Labs piece, every film, every explainer and every
 * event cut fell past the cut. The filter row is built from what is SHOWN, so
 * the homepage offered eight filters where the portfolio has thirteen, and a
 * visitor who came for the AI work saw none of it.
 *
 * SO IT ROUND-ROBINS THE DIVISIONS. One piece from each vertical in turn,
 * then the next from each, until the cap. Every division that has work is
 * represented in the first row, the mix reads as an agency with four arms
 * rather than a reel shop, and the filter row can actually answer for what
 * it offers.
 *
 * FEATURED STILL WINS INSIDE A DIVISION, so the pieces Genesis leads with are
 * the ones that represent it. `featured` means the piece has footage you can
 * watch.
 *
 * TWELVE, NOT EIGHT. Four divisions do not divide into eight evenly enough
 * to give the smaller ones a showing. Twelve fills the rail's two rows with
 * six columns, so there is real travel behind the arrows without the section
 * turning into a catalogue. The whole of it is one click away at /our-work.
 */
const ON_HOMEPAGE = 12;

function forHomepage() {
  const byVertical = new Map<string, WorkItem[]>();
  for (const item of work) {
    const bucket = byVertical.get(item.vertical) ?? [];
    bucket.push(item);
    byVertical.set(item.vertical, bucket);
  }

  /* Featured first within each division, catalogue order after. */
  const queues = [...byVertical.values()].map((items) => [
    ...items.filter((i) => i.featured),
    ...items.filter((i) => !i.featured),
  ]);

  const picked: WorkItem[] = [];
  for (let round = 0; picked.length < ON_HOMEPAGE; round += 1) {
    /* Every queue exhausted — the catalogue is smaller than the cap. */
    if (queues.every((q) => round >= q.length)) break;
    for (const queue of queues) {
      if (round < queue.length && picked.length < ON_HOMEPAGE) {
        picked.push(queue[round]);
      }
    }
  }
  return picked;
}

export function Portfolio() {
  return (
    <section
      id="library"
      className="relative isolate overflow-hidden py-12 sm:py-14 lg:py-16"
    >
      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <SectionLabel dot tone="brand">
            Everything we&rsquo;ve made
          </SectionLabel>
          {/*
            GENESIS'S OWN NAME FOR THIS SECTION, from the deck, which calls
            the board Portfolio | Case Studies. The separator is its own muted
            span rather than typed into either half, so at this size it reads
            as a divider between two names instead of hyphenating one long one.

            ON ONE LINE, which Genesis asked for and which the balancer was
            actively working against. `text-balance` splits a heading across
            roughly equal lines as soon as it can, so at the h1 size this one
            broke after "Portfolio -" and dropped "Case Studies" underneath —
            two lines for a title that fits in one. `whitespace-nowrap` holds
            it together and the size steps down until the viewport is wide
            enough to carry it, so it never runs off a phone.
          */}
          <h2 className="mt-4 whitespace-nowrap text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2 lg:text-h1">
            Portfolio{" "}
            <span aria-hidden className="text-faint">
              -
            </span>{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              Case Studies
            </span>
          </h2>
        </Reveal>

        <Reveal variant="scene" className="mt-8">
          <WorkGrid items={forHomepage()} rail />
        </Reveal>
      </div>
    </section>
  );
}
