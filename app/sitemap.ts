import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

/**
 * Every page the site still has.
 *
 * Genesis moved everything except the two forms onto the landing page, so
 * this is the landing page, the case-studies page, the creator and careers
 * forms, and the two legal pages. The landing page's sections are anchors on one document, not separate
 * URLs, so they are not listed. The old routes redirect to the section that
 * replaced them; see `redirects` in next.config.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL ?? siteConfig.url;
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/case-studies`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/creator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
