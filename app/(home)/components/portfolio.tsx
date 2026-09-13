import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { WorkGrid } from "@/components/genesis/work-grid";
import { expandToClips, work, type WorkItem } from "@/lib/work";

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
 * What the portfolio shows: every clip, ordered so the divisions interleave.
 *
 * IT SHOWED ONE TILE PER ENGAGEMENT AND THAT WAS THE BUG. The catalogue is a
 * list of twenty engagements; most carry several cuts, so "All" drew twenty
 * tiles while seventy-one videos sat in /public. `expandToClips` turns each
 * engagement into one tile per clip, which is what Genesis means by all the
 * videos.
 *
 * THE ORDER ROUND-ROBINS THE DIVISIONS at the engagement level, before the
 * clips are expanded. Straight catalogue order would open the rail with
 * fifteen consecutive Aditya Birla cuts and bury AI Labs at the far end;
 * taking one engagement from each vertical in turn means the first screenful
 * shows what the agency actually does, and a client's cuts still arrive
 * together rather than being shuffled apart.
 *
 * FEATURED WINS INSIDE A DIVISION, so the pieces Genesis leads with represent
 * it. `featured` means the piece has footage you can watch.
 *
 * NO CAP. There was one — twelve — from when this was a grid that could only
 * grow downward. It is two rows that slide now, so length costs the page
 * nothing and the whole body of work is reachable without leaving the
 * landing page, which is where Genesis wants it.
 */
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

  const ordered: WorkItem[] = [];
  const longest = Math.max(...queues.map((q) => q.length));
  for (let round = 0; round < longest; round += 1) {
    for (const queue of queues) {
      if (round < queue.length) ordered.push(queue[round]);
    }
  }
  return expandToClips(ordered);
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
            {/* Circled in grease pencil, the way a pick is marked on a proof. */}
            <span className="relative inline-block">
              <span className="gm-ramp-text font-serif font-normal italic">Case Studies</span>
              <svg
                aria-hidden
                viewBox="0 0 300 90"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-x-[8%] -inset-y-[22%] h-[144%] w-[116%] overflow-visible"
              >
                <path
                  d="M40 14C120 -2 262 4 288 34c20 24-40 48-146 50C58 86 6 70 10 44 14 22 70 8 156 8"
                  fill="none"
                  stroke="#ffc516"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </svg>
            </span>
          </h2>
        </Reveal>

        {/*
          THE DEVICE: A CONTACT SHEET. Brand & Design is a set of folders; the
          library is the sheet a photographer proofs a roll on — edge print
          along the top and bottom, frame numbers, and the pick circled in
          grease pencil in the heading above.
        */}
        <Reveal variant="scene" className="fit-window mt-[var(--block-gap)]">
          <div className="gm-rim relative overflow-hidden rounded-panel shadow-[0_30px_80px_-34px_rgb(243_154_60/0.45)]">
            <FilmEdge />
            <div className="px-6 py-4">
              <WorkGrid items={forHomepage()} rail />
            </div>
            <FilmEdge bottom />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* The edge print on a roll of film, frame numbers running along it. */
function FilmEdge({ bottom = false }: { bottom?: boolean }) {
  return (
    <div
      aria-hidden
      className={
        "flex items-center gap-6 overflow-hidden whitespace-nowrap bg-[rgb(0_0_0/0.22)] px-6 py-1.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.2em] " +
        (bottom ? "border-t border-white/10" : "border-b border-white/10")
      }
    >
      <span className="gm-ramp-text gm-ramp-text--full shrink-0">
        {bottom ? "Genesis Safety Film" : "Genesis 400 · Proof Sheet"}
      </span>
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i} className="shrink-0 text-[#f39a3c]/70">
          ▸ {bottom ? `${i + 1}A` : i + 1}
        </span>
      ))}
    </div>
  );
}
