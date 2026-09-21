import type { MetadataRoute } from "next";

import { caseStudyPages } from "@/lib/case-study-pages";
import { absoluteUrl, FILMS_PUBLISHED } from "@/lib/seo";
import { servicePages } from "@/lib/services";

/**
 * Every indexable page, generated from the same data the pages are — so a
 * page cannot exist without being listed, or be listed without existing.
 *
 * WHAT IS IN IT: the landing page, the four division pages, the case-study
 * index and every written study, the two forms and the two legal pages. The
 * landing page's own sections are anchors and are not listed; the division
 * pages are the URLs that stand for them.
 *
 * VIDEO AND IMAGE ENTRIES on each study: the film (the file its player loads
 * first) and its poster, so Google can find the video without rendering the
 * page. The same data feeds the page's VideoObject.
 *
 * `lastModified` IS ONLY GIVEN WHERE IT IS TRUE. The old file stamped every
 * URL with the build time, which told Google the privacy policy changed on
 * every deploy — and a lastmod that is always "now" is one Google learns to
 * ignore for the whole site. The legal pages carry the date their copy was
 * written; the rest carry the build time, because they are generated from
 * data that changes with the deploys that ship it.
 *
 * `changeFrequency` and `priority` are set as a hint for Bing. Google ignores
 * both.
 */

const LEGAL_UPDATED = new Date("2026-09-18");

export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: built, changeFrequency: "weekly", priority: 1 },
    ...servicePages.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: built,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: absoluteUrl("/case-studies"), lastModified: built, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/careers"), lastModified: built, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/creator"), lastModified: built, changeFrequency: "monthly", priority: 0.6 },
    /*
      GENESISDRIP. A real page with its own title and description, so it is
      listed — and at a low priority on purpose: it is an introduction that
      hands over to Instagram rather than a page anyone should land on from a
      search for Genesis Media. See app/(home)/genesisdrip.
    */
    { url: absoluteUrl("/genesisdrip"), lastModified: built, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.2 },
  ];

  const studies: MetadataRoute.Sitemap = caseStudyPages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: built,
    changeFrequency: "monthly",
    priority: 0.7,
    images: [absoluteUrl(page.poster)],
    videos: [
      {
        title: `${page.copy.campaign} | ${page.copy.brand}`,
        description: page.seo.description,
        thumbnail_loc: absoluteUrl(page.poster),
        content_loc: absoluteUrl(page.film ?? page.preview),
        publication_date: FILMS_PUBLISHED,
        family_friendly: "yes",
      },
    ],
  }));

  return [...pages, ...studies];
}
