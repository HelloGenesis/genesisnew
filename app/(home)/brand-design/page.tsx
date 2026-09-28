import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import { servicePage } from "@/lib/services";
import { BrandDesignPageView } from "../components/verticals/brand-design-page";

/**
 * /brand-design — Genesis Brand & Design, as the vertical-pages brief lays it out. Metadata and
 * schema still come from lib/services, which is what this URL ranks on.
 */
const page = servicePage("brand-design");

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/brand-design",
});

export default function BrandDesignPage() {
  return <BrandDesignPageView />;
}
