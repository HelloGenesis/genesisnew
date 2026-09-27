import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import { servicePage } from "@/lib/services";
import { InfluencePageView } from "../components/verticals/influence-page";

/**
 * /influencer-marketing — Genesis Influence, as the vertical-pages brief
 * lays it out. Metadata and schema still come from lib/services, which is
 * what this URL ranks on; the page itself is InfluencePageView.
 */
const page = servicePage("influencer-marketing");

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/influencer-marketing",
});

export default function InfluencerMarketingPage() {
  return <InfluencePageView />;
}
