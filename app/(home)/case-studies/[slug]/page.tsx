import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GlassButton } from "@/components/genesis/glass-button";
import { caseStudyList, findCaseStudy, isPublished } from "@/lib/case-studies";
import { isPending } from "@/lib/home-content";
import { findWork } from "@/lib/work";
import { siteConfig } from "@/lib/site-config";

/**
 * /case-studies/<slug> — the long form.
 *
 * Deliberately more detailed than the project popup in the work grid. The
 * popup answers "what is this?"; this answers "would it work for us?", which
 * is a different and slower read: the problem stated plainly, the decision
 * taken, what was actually made, and what changed as a result.
 *
 * Only published studies are generated. An unwritten one 404s rather than
 * rendering a client's name over four empty headings.
 */

export function generateStaticParams() {
  return caseStudyList.filter(isPublished).map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = findCaseStudy(slug);
  if (!study) return {};
  const title = `${study.client} case study`;
  return {
    title,
    description:
      study.headline ??
      `${study.discipline} for ${study.client}, by ${siteConfig.name}.`,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = findCaseStudy(slug);
  if (!study || !isPublished(study)) notFound();

  const related = (study.work ?? [])
    .map(findWork)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <main className="relative min-h-dvh pb-32 pt-32 sm:pt-40">
      <article className="mx-auto w-full max-w-3xl px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="micro-label text-brand-ink">{study.vertical}</span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span className="micro-label !text-faint">{study.discipline}</span>
        </div>

        <h1 className="mt-6 text-balance text-h2 font-normal leading-[1.02] tracking-tight text-bone sm:text-h1">
          {study.client}
        </h1>
        {study.campaign && (
          <p className="mt-3 text-lead text-ash">{study.campaign}</p>
        )}
        {study.headline && (
          <p className="mt-6 text-lead leading-relaxed text-bone">
            {study.headline}
          </p>
        )}

        {/*
          Problem, strategy, execution, result — the brief's own structure,
          and the reason this page exists rather than a second gallery.
        */}
        <div className="mt-12 flex flex-col gap-10 border-t border-[var(--glass-border)] pt-10">
          <Block heading="The problem" body={study.problem} />
          <Block heading="The strategy" body={study.strategy} />
          <Block heading="The execution" body={study.execution} />

          {study.results && study.results.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="micro-label">The result</h2>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-[var(--glass-border)] sm:grid-cols-3">
                {study.results.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-1 bg-ink p-5">
                    <dt className="micro-label !text-faint">{metric.label}</dt>
                    <dd className="text-h3 font-normal tracking-tight text-bone">
                      {metric.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t border-[var(--glass-border)] pt-10">
            <h2 className="micro-label">The work</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {related.map((item) => (
                <li key={item!.slug}>
                  <Link
                    href={`/work/${item!.slug}`}
                    className="glass-chip inline-flex rounded-full px-4 py-2 text-small text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {item!.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-12 flex flex-wrap items-center gap-3 border-t border-[var(--glass-border)] pt-10">
          <GlassButton
            href="/#contact"
            quickContact={`case-study:${study.slug}`}
            variant="brand"
            arrow
          >
            Start a project
          </GlassButton>
          <Link
            href="/case-studies"
            className="rounded-full px-3 py-2 text-small text-ash underline-offset-4 transition-colors hover:text-bone hover:underline"
          >
            All case studies
          </Link>
        </footer>
      </article>
    </main>
  );
}

function Block({ heading, body }: { heading: string; body?: string }) {
  if (isPending(body)) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="micro-label">{heading}</h2>
      <p className="text-body leading-relaxed text-ash">{body}</p>
    </section>
  );
}
