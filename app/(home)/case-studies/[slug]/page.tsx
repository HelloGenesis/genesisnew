import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { CaseStudyView } from "@/components/genesis/case-study-view";
import { GlassButton } from "@/components/genesis/glass-button";
import { JsonLd } from "@/components/genesis/json-ld";
import {
  caseStudyPages,
  currentSlugFor,
  findCaseStudyPage,
  relatedStudies,
} from "@/lib/case-study-pages";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  ORGANIZATION_ID,
  pageMetadata,
  videoJsonLd,
} from "@/lib/seo";
import { servicePageForVertical } from "@/lib/services";
import { divisionPages } from "@/lib/site-config";
import { Breadcrumbs, StudyCard } from "../../components/service-page";
import { campaignFilmsForSlug } from "@/lib/case-study-pages";

type Props = { params: Promise<{ slug: string }> };

/**
 * /case-studies/<slug> — one study, as a page.
 *
 * The same view the windows use (CaseStudyView), so the page and the dialog
 * cannot tell two versions of a study. What the page adds is what a window
 * has no use for: an h1, a breadcrumb, the division it belongs to, the next
 * studies to read, and structured data describing the film.
 *
 * Every written study is generated at build time. An unknown slug is either
 * an old one — redirected permanently to its new name — or a 404.
 */
export function generateStaticParams() {
  return caseStudyPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = findCaseStudyPage(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
    type: "article",
    imageAlt: `${page.copy.brand}: ${page.copy.headline}`,
  });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const page = findCaseStudyPage(slug);
  if (!page) {
    const current = currentSlugFor(slug);
    if (current) permanentRedirect(`/case-studies/${current}`);
    notFound();
  }

  const { copy } = page;
  const service = servicePageForVertical(copy.division);
  const serviceLabel = service
    ? divisionPages.find((division) => division.href === `/${service.slug}`)?.label
    : undefined;
  const related = relatedStudies(page);

  /*
    THE FILM IS THE VIDEO. `contentUrl` is whichever file the page's player
    loads first — the full-length master from Drive where that is switched on,
    else the preview — so the schema never describes a video the page does not
    play. Every master was checked reachable when this was written.
  */
  const film = page.film ?? page.preview;
  /*
    UNDEFINED FOR A STUDY WITH NO FILM — the two Brand & Design pieces. A
    VideoObject with no contentUrl is an invalid node, and the CreativeWork
    below drops its `video` reference with it.
  */
  const video = film
    ? videoJsonLd({
        name: `${copy.campaign} | ${copy.brand}`,
        description: page.seo.description,
        thumbnail: page.poster,
        content: film,
        path: page.path,
      })
    : undefined;

  return (
    <Atmosphere
      tone="brand"
      origin="top"
      intensity={0.2}
      className="relative isolate min-h-dvh overflow-hidden"
      style={{ background: "var(--page-ground-compact)" }}
    >
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Case Studies", path: "/case-studies" },
            { name: copy.campaign, path: page.path },
          ]),
          {
            "@type": "CreativeWork",
            "@id": `${absoluteUrl(page.path)}#work`,
            name: copy.campaign,
            headline: copy.headline,
            description: page.seo.description,
            url: absoluteUrl(page.path),
            image: absoluteUrl(page.poster),
            genre: copy.industry,
            keywords: copy.keyword,
            inLanguage: "en-IN",
            creator: { "@id": ORGANIZATION_ID },
            ...(video ? { video: { "@id": video["@id"] } } : {}),
          },
          ...(video ? [video] : []),
        ]}
      />

      <main className="relative z-[2] mx-auto w-full max-w-6xl px-6 pb-24 pt-32 sm:pt-40">
        <Breadcrumbs
          trail={[
            { name: "Case Studies", path: "/case-studies" },
            { name: copy.campaign, path: page.path },
          ]}
        />

        <div className="mt-8">
          <CaseStudyView
            headingAs="h1"
            autoPlay={false}
            labels={page.labels}
            headline={copy.headline}
            // Once where the campaign is named after the brand ("The WorldGrad").
            subheadline={
              copy.campaign === copy.brand ? copy.brand : `${copy.brand} · ${copy.campaign}`
            }
            poster={page.poster}
            film={page.film}
            preview={page.preview}
            /* The still a design study shows where a film would play. */
            art={copy.art}
            copy={copy}
            ratio={page.ratio}
            /*
              EVERY FILM THE CAMPAIGN CAN CLAIM. Genesis asked for a study to
              show all of its videos rather than the one it leads with; see
              `campaignClips` for which those are and why it is not simply
              every reel of the engagement.
            */
            clips={campaignFilmsForSlug(page.slug)}
          />
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-[var(--glass-border)] pt-10">
          <GlassButton
            href="/#contact"
            quickContact={`case-study:${page.slug}`}
            variant="brand"
            arrow
          >
            Start a project
          </GlassButton>
          {service && serviceLabel && (
            <GlassButton href={`/${service.slug}`} variant="glass" arrow>
              {serviceLabel}
            </GlassButton>
          )}
          <GlassButton href="/case-studies" variant="ghost" arrow>
            All case studies
          </GlassButton>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-20">
            <h2
              id="related-heading"
              className="text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone"
            >
              {serviceLabel ? `More ${serviceLabel} case studies` : "More case studies"}
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:gap-x-6">
              {related.map((study) => (
                <li key={study.slug}>
                  <StudyCard study={study} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </Atmosphere>
  );
}
