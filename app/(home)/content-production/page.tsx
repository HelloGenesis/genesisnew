import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import { servicePage } from "@/lib/services";
import { StudiosPageView } from "../components/verticals/studios-page";

/**
 * /content-production — Genesis Studios, as the vertical-pages brief lays it out. Metadata and
 * schema still come from lib/services, which is what this URL ranks on.
 */
const page = servicePage("content-production");

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/content-production",
});

export default function ContentProductionPage() {
  return <StudiosPageView />;
}
