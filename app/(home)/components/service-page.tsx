import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { findCaseStudyPage, type CaseStudyPage } from "@/lib/case-study-pages";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";
import { serviceOffers, type ServiceBlock, type ServicePage } from "@/lib/services";
import { divisionPages } from "@/lib/site-config";
import { FooterCta } from "./footer-cta";

/**
 * A division's own page: /influencer-marketing and the other three.
 *
 * THE SAME DIVISION, AT READING LENGTH. The homepage section is passed in as
 * `showcase` and rendered unchanged, so the page looks like the site and the
 * division looks like itself. What the page adds is what the section cannot
 * carry: a visible h1 in the words people search, the services and process in
 * text, the proof as links to the studies, and the questions a buyer asks
 * before they write in. All of it is server-rendered — nothing here waits on
 * JavaScript to exist.
 *
 * The copy is in lib/services; this file only lays it out.
 */
export function ServicePageView({
  page,
  showcase,
}: {
  page: ServicePage;
  /** The division's homepage section, shown as it is on the landing page. */
  showcase: ReactNode;
}) {
  const path = `/${page.slug}`;
  const label =
    divisionPages.find((division) => division.href === path)?.label ?? page.schema.name;
  const studies = page.proof
    .map(findCaseStudyPage)
    .filter((study): study is CaseStudyPage => study !== undefined);

  return (
    <main>
      <JsonLd
        data={[
          serviceJsonLd({
            name: page.schema.name,
            serviceType: page.schema.serviceType,
            description: page.seo.description,
            path,
            offers: serviceOffers(page),
          }),
          breadcrumbJsonLd([{ name: label, path }]),
        ]}
      />

      {/*
        No ground of its own: these pages run many screens, so the
        document-wide field shows through, as it does behind every homepage
        section. The compact ground is for pages a screen or two tall, and on
        a long one it paints a seam where the next section begins.
      */}
      <Atmosphere tone="brand" origin="top" intensity={0.2}>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 pb-12 pt-32 sm:pt-40">
          <Reveal>
            <Breadcrumbs trail={[{ name: label, path }]} />
            <SectionLabel dot tone="brand" className="mt-8">
              {`Genesis.${page.division}`}
            </SectionLabel>
            <h1 className="mt-6 max-w-4xl text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
              {page.heading.lead}{" "}
              <span className="font-serif font-normal italic text-brand-ink">
                {page.heading.accent}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-body leading-relaxed text-ash sm:text-lead">
              {page.intro}
            </p>
          </Reveal>
          <Reveal delay={0.08} className="mt-8 flex flex-wrap gap-3">
            <GlassButton
              href="/#contact"
              quickContact={`${page.slug}:page-hero`}
              variant="brand"
              size="lg"
              arrow
            >
              Start a project
            </GlassButton>
            {studies.length > 0 && (
              <GlassButton href="#work" variant="glass" size="lg" arrow>
                See the work
              </GlassButton>
            )}
          </Reveal>
        </div>
      </Atmosphere>

      {showcase}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-[var(--section-pad)] sm:gap-20">
        {page.blocks.map((block) => (
          <Block key={block.heading} block={block} />
        ))}
      </div>

      {studies.length > 0 && (
        <section
          id="work"
          aria-labelledby="work-heading"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]"
        >
          <Reveal>
            <SectionLabel dot tone="brand">
              Case studies
            </SectionLabel>
            <h2
              id="work-heading"
              className="mt-6 text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2"
            >
              {label} work
            </h2>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:gap-x-6">
            {studies.map((study) => (
              <li key={study.slug}>
                <StudyCard study={study} />
              </li>
            ))}
          </ul>
          <Reveal className="mt-12">
            <GlassButton href="/case-studies" variant="glass" arrow>
              All case studies
            </GlassButton>
          </Reveal>
        </section>
      )}

      <section
        aria-labelledby="faq-heading"
        className="mx-auto w-full max-w-6xl px-6 py-[var(--section-pad)]"
      >
        <Reveal>
          <h2
            id="faq-heading"
            className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2"
          >
            Questions we get asked
          </h2>
        </Reveal>
        <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {page.faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="text-body font-semibold leading-snug text-bone">
                {faq.question}
              </dt>
              <dd className="mt-2 text-pretty text-body leading-relaxed text-ash">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <FooterCta />
    </main>
  );
}

function Block({ block }: { block: ServiceBlock }) {
  return (
    <section>
      <Reveal>
        <h2 className="max-w-3xl text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
          {block.heading}
        </h2>
        {block.paragraphs?.map((paragraph) => (
          <p
            key={paragraph.slice(0, 48)}
            className="mt-5 max-w-3xl text-pretty text-body leading-relaxed text-ash sm:text-lead"
          >
            {paragraph}
          </p>
        ))}
      </Reveal>
      {block.items && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {block.items.map((item) => (
            <li key={item.title} className="glass glass-lit rounded-card p-6">
              <h3 className="text-body font-semibold leading-snug text-bone">
                {item.title}
              </h3>
              <p className="mt-2 text-pretty text-small leading-relaxed text-ash sm:text-body">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * A study as a plain link to its page. No dialog here: on a division page the
 * reader has already chosen to read, so the study opens as the page it is.
 * Also used for the "more studies" row at the foot of a study.
 */
export function StudyCard({ study }: { study: CaseStudyPage }) {
  const landscape = study.ratio > 1;
  return (
    <Link
      href={study.path}
      className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-[var(--glass-border)] bg-ink transition-transform duration-300 group-hover:-translate-y-1">
        {/*
          NOT EVERY STUDY HAS A PICTURE. The Brand & Design studies have no
          film, and Tripgate's identity has no artwork on disk either — its
          palette lives as hex values — so `poster` is the empty string. An
          <Image src=""> is a React error and a request for the whole page
          again, which is what the console was reporting; the card falls back
          to the typographic treatment the portfolio already uses.
        */}
        {study.copy.art ? (
          /*
            A DESIGN STUDY'S ARTWORK IS A LOGO, so it is contained on a white
            plate rather than cropped to fill a 4:5 card — the same treatment
            the index tile and the study's own page give it. Both files are
            ink drawn for paper and neither survives `object-cover`.
          */
          <div className="absolute inset-0 grid place-items-center bg-white p-5">
            <Image
              src={study.copy.art}
              alt={`${study.copy.brand}, ${study.copy.campaign}`}
              width={480}
              height={480}
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 33vw, 50vw"
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>
        ) : study.poster ? (
          <Image
            src={study.poster}
            alt={`${study.copy.brand}, ${study.copy.campaign}`}
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 33vw, 50vw"
            className={landscape ? "object-contain" : "object-cover"}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-5">
            <p className="text-balance text-center text-h3 font-semibold leading-[1.1] tracking-tight text-bone/90">
              {study.copy.brand}
            </p>
          </div>
        )}
      </div>
      <h3 className="mt-3 text-body font-semibold leading-snug text-bone">
        {study.copy.brand}
      </h3>
      <p className="mt-1 line-clamp-3 text-small leading-snug text-ash">
        {study.copy.headline}
      </p>
    </Link>
  );
}

/**
 * The trail the BreadcrumbList schema describes, printed where a reader can
 * use it. Home, then the page.
 */
export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  const crumbs = [{ name: "Home", path: "/" }, ...trail];
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-faint">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden>/</span>}
              {last ? (
                <span aria-current="page" className="text-ash">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.path} className="transition-colors hover:text-bone">
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
