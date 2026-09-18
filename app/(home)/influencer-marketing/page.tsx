import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import { servicePage } from "@/lib/services";
import { InfluencerMarketing } from "../components/influencer-marketing";
import { ServicePageView } from "../components/service-page";

/**
 * /influencer-marketing — Genesis.Influence, as a page of its own.
 *
 * The homepage section is the showcase; the copy, schema and links around it
 * are what let this URL rank. See lib/services and ServicePageView.
 */
const page = servicePage("influencer-marketing");

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/influencer-marketing",
});

export default function InfluencerMarketingPage() {
  return <ServicePageView page={page} showcase={<InfluencerMarketing />} />;
}
