import type { Metadata } from "next";

import { LegalPage } from "@/components/genesis/legal-page";
import { privacy } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

/*
  Interim copy. Indexed, because a policy nobody can find is not a policy,
  but not something to rank for. No explicit `robots` any more: indexing is
  the default, and an explicit value here would override the preview build's
  noindex (see INDEXABLE in lib/seo).
*/
export const metadata: Metadata = pageMetadata({
  title: privacy.title,
  description:
    "How Genesis Media collects and uses information submitted through genesismedia.co, which services process it, and how to see, correct or delete your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage doc={privacy} />;
}
