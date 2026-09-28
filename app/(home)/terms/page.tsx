import type { Metadata } from "next";

import { LegalPage } from "@/components/genesis/legal-page";
import { terms } from "@/lib/legal-commerce";
import { pageMetadata } from "@/lib/seo";

/* The terms of sale — back now the site takes payment. See lib/legal-commerce. */
export const metadata: Metadata = pageMetadata({
  title: terms.title,
  description: terms.standfirst,
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage doc={terms} />;
}
