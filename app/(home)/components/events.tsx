import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/genesis/reveal";
import { WorkGrid } from "@/components/genesis/work-grid";
import { events } from "@/lib/home-content";
import { expandToClips, work } from "@/lib/work";
import { SectionShell } from "./section-shell";

/**
 * Events & Experiences — the capability that was invisible.
 *
 * WHY IT IS HERE AND WHAT IT IS NOT. Genesis has run fifteen hundred events
 * and the site said so nowhere: the two event films in the catalogue were
 * filed under Studios, because that is who shot them, and a school or a brand
 * arriving to ask whether Genesis does on-ground work had no way to find out.
 *
 * IT IS NOT A FIFTH DIVISION, at Genesis's instruction — "for now, this does
 * not need to become a fifth main vertical at the same level as the core
 * four". So this section deliberately does not look like the four that come
 * before it: no lockup, no ramp of its own, no orbit position. It announces
 * itself with a label and a heading, the way the client wall and the
 * portfolio do, which is the level the instruction asks for.
 *
 * WHERE IT SITS. Between Brand & Design and the portfolio, which is where
 * Genesis put it in the page's running order: after the four divisions have
 * explained what Genesis makes on a screen, and immediately before the grid
 * of everything. "How do we create real-world experiences?" is the last
 * question the story answers before it hands over to the work.
 *
 * TODO(content): THE EVENT CASE STUDIES. Genesis asked for NHPS and the
 * school, corporate and brand events "from the corporate events deck", and
 * for enough of them "to make the capability feel established". That deck has
 * not been shared. The grid below shows the event work the catalogue actually
 * holds — two films — and grows on its own as entries are added to lib/work
 * under the Events vertical. Nothing here is invented to fill it: a wall of
 * made-up event names under real school and client names is the one failure
 * this section cannot survive.
 */
export function Events() {
  const eventWork = expandToClips(work.filter((item) => item.vertical === "Events"));

  return (
    <SectionShell
      id="events"
      label={events.label}
      heading={events.heading}
      headingAccent={events.headingAccent}
      body={events.body}
      align="center"
      tone="brand"
      origin="center"
      intensity={0.14}
    >
      {/*
        THE SEVEN SERVICES, AS CHIPS. Genesis's own labels, in their order,
        and the reason they are set as objects rather than as one middot line
        is the same reason the Influence niches are: a school scanning for
        "School Events" finds it in one pass, where a hundred-character
        sentence has to be read.
      */}
      <RevealGroup className="flex flex-wrap justify-center gap-2">
        {events.services.map((service) => (
          <RevealItem key={service}>
            <span className="block rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] px-3.5 py-1.5 text-micro font-medium uppercase tracking-[0.1em] text-ash">
              {service}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>

      {/*
        THE ONE FIGURE, and it is the company's own. Genesis's journey board
        records 1,500+ successful events; nothing on the site had ever printed
        it, which for a capability being introduced is the single most useful
        sentence available. See lib/proof.
      */}
      <Reveal delay={0.08} className="mt-10 text-center">
        <p className="font-display text-h2 leading-none text-brand-ink sm:text-h1">
          {events.stat.value}
        </p>
        <p className="mt-2 text-small text-ash">{events.stat.label}</p>
      </Reveal>

      {/*
        THE WORK ITSELF, where there is any. The rail renders nothing at all
        rather than an empty shelf with a filter row over it — an events
        section whose evidence is a blank grid argues against itself, and the
        chips and the figure above already make the capability legible while
        the catalogue fills.
      */}
      {eventWork.length > 0 && (
        <Reveal variant="scene" delay={0.1} className="mt-[var(--block-gap)]">
          <WorkGrid items={eventWork} showFilters={false} />
        </Reveal>
      )}

      <Reveal delay={0.14} className="mt-10 flex justify-center">
        {/*
          A BARE HASH AND A FILTER, the same pair AI Lab's and Influence's
          second buttons use: it scrolls to the portfolio in place rather than
          re-rendering the page, and asks the grid for the Events chip so the
          reader lands on event work instead of on everything.
        */}
        <GlassButton
          href={events.primaryCta.href}
          selectsFilter="Events"
          variant="glass"
          size="lg"
          arrow
        >
          {events.primaryCta.label}
        </GlassButton>
      </Reveal>
    </SectionShell>
  );
}
