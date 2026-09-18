import type { Metadata } from "next";

import { footerCta } from "./home-content";
import { siteConfig } from "./site-config";

/**
 * SEARCH AND SHARING — the one place that decides what URL a page claims to
 * be, what it looks like pasted into WhatsApp or LinkedIn, and what it tells
 * a search engine about Genesis.
 *
 * WHY IT EXISTS. Every page used to export a bare title and description and
 * nothing else: no canonical, no Open Graph, no Twitter card, no structured
 * data, and a metadataBase read from APP_BASE_URL — which is the Auth0 SDK's
 * variable, left UNSET on Vercel (see .env.example), so Next fell back to the
 * deployment's own *.vercel.app host. A share of any page carried no image
 * and the sitemap advertised whichever host happened to build it.
 *
 * ONE ORIGIN. `SITE_URL` is the production origin whatever host is serving
 * the request. A preview deployment still claims the production URL as
 * canonical, which is exactly right: the preview is a copy, not the page.
 */

/** The canonical origin, with no trailing slash. See siteConfig.url. */
export const SITE_URL = (process.env.SITE_URL || siteConfig.url).replace(
  /\/+$/,
  "",
);

/** The only host that should be crawled. robots.ts blocks every other one. */
export const SITE_HOST = new URL(SITE_URL).host;

/**
 * Whether this BUILD may be indexed.
 *
 * Vercel sets VERCEL_ENV to "production", "preview" or "development". Only
 * production is indexable; a preview build is noindexed in its own markup as
 * well as blocked in robots.txt, so it stays out of search even when a link
 * to it leaks somewhere Google follows. Off Vercel (local `next dev` or
 * `next start`) there is no VERCEL_ENV and the markup is left indexable —
 * robots.txt still refuses every host but the real one.
 */
export const INDEXABLE =
  !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

/** A path on the production site, as an absolute URL. Absolute input passes through. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

/**
 * The share card for a route — served by app/og/[[...path]], which draws one
 * card per page at build time. The path mirrors the page's own, so no page
 * has to be told where its image lives.
 */
export function ogImagePath(path: string): string {
  return path === "/" ? "/og" : `/og${path}`;
}

/** Open Graph card size — the 1.91:1 frame every platform crops to. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export type PageSeo = {
  /** Without the brand — the root layout's template appends " | Genesis Media". */
  title: string;
  /** 140–160 characters: long enough to use the snippet, short enough to survive it. */
  description: string;
  /** The route, e.g. "/careers". Becomes the canonical and og:url. */
  path: string;
  /** Set when the title already carries the brand. The homepage's does. */
  absoluteTitle?: boolean;
  /** og:type. Case studies are articles; everything else is a website. */
  type?: "website" | "article";
  /** Alt text for the share card. Defaults to the full title. */
  imageAlt?: string;
};

/**
 * The complete metadata for a page, built the same way everywhere.
 *
 * THE WHOLE OBJECT, NOT A PATCH, because Next merges metadata SHALLOWLY: a
 * page that sets `openGraph: { title }` replaces the layout's `openGraph`
 * entirely, image included — so a page that set only its own title would
 * share with no picture. Building the full object here means no page can
 * forget half of it. Twitter inherits title, description and image from
 * Open Graph (Next copies them across), so it needs only the card type.
 */
export function pageMetadata(page: PageSeo): Metadata {
  const fullTitle = page.absoluteTitle
    ? page.title
    : `${page.title} | ${siteConfig.name}`;

  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: page.type ?? "website",
      url: page.path,
      siteName: siteConfig.name,
      locale: "en_IN",
      title: fullTitle,
      description: page.description,
      images: [
        {
          url: ogImagePath(page.path),
          ...OG_SIZE,
          alt: page.imageAlt ?? fullTitle,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
    ...(INDEXABLE ? {} : { robots: { index: false, follow: false } }),
  };
}

// --- Structured data ---------------------------------------------------------

/**
 * A JSON-LD node. Loosely typed on purpose: schema.org is open-ended, and a
 * typing package for it would be a dependency to describe four node types.
 * Validate with the Rich Results Test rather than with the compiler.
 */
export type JsonLdNode = Record<string, unknown>;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Genesis Media, the organisation. Rendered on every marketing page by the
 * (home) layout; every other node on the site points at it by `@id` instead
 * of repeating it.
 *
 * ORGANIZATION UNTIL THERE IS A STREET ADDRESS. A LocalBusiness without one is
 * invalid for Google's local features, and inventing an office is not an
 * option. The moment siteConfig.address carries a street and a PIN code the
 * node is also typed ProfessionalService (a LocalBusiness), which is what
 * "influencer marketing agency in Mumbai" searches are matched against — the
 * Google Business Profile at the same address does the rest.
 */
export function organizationJsonLd(): JsonLdNode {
  const { address } = siteConfig;
  const hasStreetAddress = Boolean(address.streetAddress && address.postalCode);

  return {
    "@type": hasStreetAddress
      ? ["Organization", "ProfessionalService"]
      : "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    // The old site titled itself "The Genesis Media"; people search both.
    alternateName: ["Genesis", "The Genesis Media"],
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/brand/genesis-n.png"),
      width: 306,
      height: 500,
    },
    image: absoluteUrl("/brand/genesis-wordmark-dark.png"),
    description: siteConfig.description,
    email: footerCta.email,
    telephone: siteConfig.whatsapp,
    sameAs: [siteConfig.social.instagram, siteConfig.social.linkedin],
    address: {
      "@type": "PostalAddress",
      ...(address.streetAddress ? { streetAddress: address.streetAddress } : {}),
      ...(address.postalCode ? { postalCode: address.postalCode } : {}),
      addressLocality: address.locality,
      addressRegion: address.region,
      addressCountry: address.country,
    },
    areaServed: { "@type": "Country", name: "India" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: siteConfig.whatsapp,
      email: footerCta.email,
      areaServed: "IN",
    },
    knowsAbout: [
      "Influencer marketing",
      "Celebrity partnerships",
      "User-generated content",
      "Video production",
      "Content production",
      "AI avatars",
      "AI content",
      "Business automation",
      "Brand identity",
      "Brand design",
    ],
  };
}

/** The site itself. Its `name` is what Google shows as the site name in results. */
export function websiteJsonLd(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: siteConfig.name,
    alternateName: ["Genesis", "The Genesis Media"],
    inLanguage: "en-IN",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type Crumb = { name: string; path: string };

/** The trail Google prints in place of the URL. Always starts at Home. */
export function breadcrumbJsonLd(trail: Crumb[]): JsonLdNode {
  const crumbs = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** One of the four divisions, as a Service Genesis provides. */
export function serviceJsonLd(service: {
  name: string;
  serviceType: string;
  description: string;
  path: string;
  /** The division's own service lines, verbatim from the credentials deck. */
  offers: readonly string[];
}): JsonLdNode {
  const url = absoluteUrl(service.path);
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.name,
    serviceType: service.serviceType,
    description: service.description,
    url,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: { "@type": "Country", name: "India" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: service.name,
      itemListElement: service.offers.map((offer) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: offer },
      })),
    },
  };
}

/**
 * WHEN THE FILMS WERE FIRST PUBLISHED on this site, for VideoObject's
 * required `uploadDate`.
 *
 * One date, not one per clip, and taken from the repository rather than
 * invented: the case-study films entered the site between 3 and 17 September
 * 2026, and this is the day the portfolio Drive — most of them — landed.
 * A week either way changes nothing Google does with it. A film added later
 * that deserves its own date can pass one to `videoJsonLd`.
 */
export const FILMS_PUBLISHED = "2026-09-10T00:00:00+05:30";

/** A film, described for Google's video results. */
export function videoJsonLd(video: {
  name: string;
  description: string;
  /** The poster frame. */
  thumbnail: string;
  /** The file the page's player loads first. */
  content: string;
  /** The page the film is the subject of. */
  path: string;
  uploadDate?: string;
  width?: number;
  height?: number;
}): JsonLdNode {
  return {
    "@type": "VideoObject",
    "@id": `${absoluteUrl(video.path)}#video`,
    name: video.name,
    description: video.description,
    thumbnailUrl: [absoluteUrl(video.thumbnail)],
    contentUrl: absoluteUrl(video.content),
    uploadDate: video.uploadDate ?? FILMS_PUBLISHED,
    ...(video.width && video.height
      ? { width: video.width, height: video.height }
      : {}),
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en-IN",
    isFamilyFriendly: true,
  };
}
