import Link from "next/link";

import { LogoMarquee } from "@/components/genesis/logo-marquee";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { WorkGrid } from "@/components/genesis/work-grid";
import { findCaseStudyPage, type CaseStudyPage } from "@/lib/case-study-pages";
import { clients } from "@/lib/home-content";
import { verticalCards } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { expandToClips, matchesFilter, work } from "@/lib/work";
import { cn } from "@/lib/utils";
import { LogoMark } from "../client-logos";
import { Breadcrumbs, StudyCard } from "../service-page";
import { GlassButton } from "@/components/genesis/glass-button";

/**
 * What sits around every vertical page's own content: the way between the
 * four, the client row, and the work.
 */

/**
 * Breadcrumb and the four verticals as tabs, centred — "MAKE THIS CENTERED
 * ALIGNED". Each tab is the vertical's page, so moving between them is a
 * link, not a state: the address bar, back button and a shared URL all agree.
 */
export function VerticalNav({ current }: { current: VerticalKey }) {
  const card = verticalCards.find((item) => item.key === current)!;
  return (
    <div className="relative z-[2] mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-28 text-center sm:pt-32">
      <Breadcrumbs trail={[{ name: card.name, path: card.href }]} />
      <nav aria-label="Genesis verticals" className="mt-5 w-full">
        <ul className="flex flex-nowrap justify-start gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center">
          {verticalCards.map((item) => {
            const active = item.key === current;
            return (
              <li key={item.key} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full px-5 text-small transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    active
                      ? "bg-brand text-on-brand"
                      : "glass-chip text-ash hover:text-bone",
                  )}
                >
                  {item.key === "ai-labs" ? "AI Labs" : item.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/**
 * The client marks in ONE line — "ADD LOGOS (just one line)" — under the
 * homepage wall's own heading, which is the brief's "Trusted by brands across
 * industries." Same marks, same treatment, one rail instead of two.
 */
export function LogoStrip({ heading = true, className }: { heading?: boolean; className?: string }) {
  return (
    <section aria-label="Clients" className={cn("py-[calc(var(--section-pad)*0.6)]", className)}>
      {heading && (
        <Reveal className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone">
            {clients.heading}{" "}
            <span className="font-serif italic text-brand-ink">{clients.headingAccent}</span>
          </h2>
        </Reveal>
      )}
      <div className={cn("relative", heading && "mt-8")}>
        <LogoMarquee
          speedSeconds={70}
          items={clients.logos.map((logo) => (
            <LogoMark key={logo.file} logo={logo} />
          ))}
        />
      </div>
    </section>
  );
}

/**
 * The work, filtered to the page's vertical — the homepage's "Everything
 * we've made" rail, reused so a tile opens the same window it opens there.
 * `verticals` takes more than one: Studios' shoot work is Studios and Events.
 */
export function WorkSection({
  id = "library",
  verticals,
  label = "Case Studies",
  heading = "Everything",
  accent = "we've made.",
  rail = true,
  showFilters = false,
  filters,
  cta = true,
}: {
  id?: string;
  verticals: string[];
  label?: string;
  heading?: string;
  accent?: string;
  rail?: boolean;
  showFilters?: boolean;
  /** Fixed chips for the rail — see WorkGrid. */
  filters?: string[];
  cta?: boolean;
}) {
  const items = expandToClips(work.filter((item) => verticals.some((v) => matchesFilter(item, v))));
  if (items.length === 0) return null;
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="relative isolate scroll-mt-24 py-[var(--section-pad)]">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <SectionLabel dot tone="brand">
            {label}
          </SectionLabel>
          {heading ? (
            <h2
              id={`${id}-heading`}
              className="mt-4 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2"
            >
              {heading} <span className="font-serif italic text-brand-ink">{accent}</span>
            </h2>
          ) : (
            <h2 id={`${id}-heading`} className="sr-only">
              {label}
            </h2>
          )}
        </Reveal>
        <Reveal variant="scene" className={cn("fit-window", heading ? "mt-[var(--block-gap)]" : "mt-6")}>
          <WorkGrid items={items} rail={rail} showFilters={showFilters} filters={filters} />
        </Reveal>
        {cta && (
          <Reveal delay={0.1} className="mt-8">
            <GlassButton href="/case-studies" variant="glass" arrow>
              View all case studies
            </GlassButton>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/** The vertical's written case studies, as the division pages already list them. */
export function CaseStudiesRow({
  slugs,
  heading,
  id = "case-studies",
}: {
  slugs: string[];
  heading: string;
  id?: string;
}) {
  const studies = slugs
    .map(findCaseStudyPage)
    .filter((study): study is CaseStudyPage => study !== undefined);
  if (studies.length === 0) return null;
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]">
      <Reveal>
        <SectionLabel dot tone="brand">
          Case studies
        </SectionLabel>
        <h2
          id={`${id}-heading`}
          className="mt-4 text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2"
        >
          {heading}
        </h2>
      </Reveal>
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {studies.slice(0, 6).map((study) => (
          <li key={study.slug}>
            <StudyCard study={study} />
          </li>
        ))}
      </ul>
    </section>
  );
}
