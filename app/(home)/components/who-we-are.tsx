import { Spectrum } from "@/components/genesis/atmosphere";
import { Reveal, RevealGroup, RevealItem } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { whoWeAre } from "@/lib/home-content";

/**
 * Positioning and philosophy — both from the brand guidelines, neither of
 * which was anywhere on the site.
 *
 * The deck spends two pages on this. One sets Genesis against the four kinds
 * of agency the market already has and lands on "An AI-Native Creative
 * Company". The other gives three ideas, each with a line: Culture First, AI
 * First, Execution Wins. Between them they are the clearest statement of what
 * this company claims to be, and the homepage went from the hero straight
 * into a list of services without making that claim at all.
 *
 * It sits directly under the hero for that reason: it answers "who is this"
 * before the page starts describing what they sell.
 *
 * The market list is struck through rather than merely listed. The deck's
 * page is a contrast — these four exist, Genesis is not one of them — and a
 * plain list would read as a menu of things Genesis offers, which is the
 * opposite of the point.
 */
export function WhoWeAre() {
  return (
    <section
      id="about"
      className="relative isolate overflow-hidden py-12 sm:py-14 lg:py-16"
    >
      <Spectrum />

      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <SectionLabel dot tone="brand">
              {whoWeAre.label}
            </SectionLabel>
            <h2 className="mt-6 text-balance text-h2 font-normal leading-[1.02] tracking-tight text-bone sm:text-h1">
              {whoWeAre.heading}{" "}
              <span className="font-serif font-normal italic text-brand-ink">
                {whoWeAre.headingAccent}
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="lg:pt-4">
            <p className="max-w-md text-lead leading-relaxed text-ash">
              {whoWeAre.body}
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {whoWeAre.market.map((kind) => (
                <li
                  key={kind}
                  className="text-small text-faint line-through decoration-brand/60 decoration-2"
                >
                  {kind}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <RevealGroup className="mt-10 grid gap-px bg-[var(--glass-border)] sm:mt-12 sm:grid-cols-3">
          {whoWeAre.ideas.map((idea) => (
            <RevealItem key={idea.title}>
              <article className="flex h-full flex-col gap-4 bg-ink p-7 sm:p-8">
                <h3 className="micro-label text-brand-ink">{idea.title}</h3>
                <p className="text-balance text-h3 font-semibold leading-tight tracking-tight text-bone">
                  {idea.line}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        {/*
          The sectors, kept deliberately quiet. The deck lists twelve of them
          beside its client work, and twelve is enough that setting them at
          any size would turn a credential into a wall.
        */}
        <Reveal delay={0.15} className="mt-12">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {whoWeAre.sectors.map((sector, index) => (
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
                {index < whoWeAre.sectors.length - 1 && (
                  <span aria-hidden className="text-brand">
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
