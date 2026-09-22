import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { GlassButton } from "@/components/genesis/glass-button";
import { WorkGrid } from "@/components/genesis/work-grid";
import { footerCta } from "@/lib/home-content";
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
          {/*
            ONE NAME PER THING, WHICH IS THE WHOLE OF GENESIS'S NOTE HERE.

            This heading read "Portfolio - Case Studies", the deck's own name
            for the board — and on a site that ALSO has a case-studies section
            four blocks up and a /case-studies page in the nav, using the two
            words interchangeably is the confusion Genesis asked to end.
            Portfolio and Case Studies are different things: one is everything
            made, the other is the written argument with a number at the end.

            So this section says what it is and nothing else. "Explore our
            work" invites, "Everything we've made" describes, and the case
            studies keep their own name for their own section. The button
            below still leads to them.
          */}
          <SectionLabel dot tone="brand">
            Explore our work
          </SectionLabel>
          <h2 className="mt-4 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2 lg:text-h1">
            Everything{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              we&rsquo;ve made.
            </span>
          </h2>
        </Reveal>

        <Reveal variant="scene" className="fit-window mt-[var(--block-gap)]">
          <WorkGrid items={forHomepage()} rail />
        </Reveal>

        {/*
          TWO WAYS ON FROM THE WORK. Out to the full case-studies page, or
          down to the brief. "Contact us" is the footer pitch's own button, moved
          here rather than copied — see FooterCta. Bare hashes, so both
          scroll in place instead of re-rendering the page.
        */}
        <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-3">
          <GlassButton href="/case-studies" variant="glass" arrow>
            View all case studies
          </GlassButton>
          <GlassButton
            href={footerCta.primaryCta.href.replace(/^\//, "")}
            variant="brand"
           
            arrow
            magnetic
          >
            {footerCta.primaryCta.label}
          </GlassButton>
        </Reveal>
      </div>
    </section>
  );
}
