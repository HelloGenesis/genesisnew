import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import { servicePage } from "@/lib/services";
import { BrandingDesign } from "../components/branding-design";
import { ServicePageView } from "../components/service-page";

/**
 * /brand-design — Genesis.Brand & Design, as a page of its own.
 *
 * The homepage section is the showcase; the copy, schema and links around it
 * are what let this URL rank. See lib/services and ServicePageView.
 */
const page = servicePage("brand-design");

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/brand-design",
});

export default function BrandDesignPage() {
  return <ServicePageView page={page} showcase={<BrandingDesign />} />;
}
