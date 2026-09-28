import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import { servicePage } from "@/lib/services";
import { AiLabsPageView } from "../components/verticals/ai-labs-page";

/**
 * /ai-content-automation — Genesis AI Labs, as the vertical-pages brief lays it out. Metadata and
 * schema still come from lib/services, which is what this URL ranks on.
 */
const page = servicePage("ai-content-automation");

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/ai-content-automation",
});

export default function AiContentAutomationPage() {
  return <AiLabsPageView />;
}
