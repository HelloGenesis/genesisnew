import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import { servicePage } from "@/lib/services";
import { Studios } from "../components/studios";
import { ServicePageView } from "../components/service-page";

/**
 * /content-production — Genesis.Studios, as a page of its own.
 *
 * The homepage section is the showcase; the copy, schema and links around it
 * are what let this URL rank. See lib/services and ServicePageView.
 */
const page = servicePage("content-production");

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/content-production",
});

export default function ContentProductionPage() {
  return <ServicePageView page={page} showcase={<Studios />} />;
}
