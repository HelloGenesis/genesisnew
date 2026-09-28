import type { Metadata } from "next";

import { LegalPage } from "@/components/genesis/legal-page";
import { refunds } from "@/lib/legal-commerce";
import { pageMetadata } from "@/lib/seo";

/* Cancellations and refunds — see lib/legal-commerce. */
export const metadata: Metadata = pageMetadata({
  title: refunds.title,
  description: refunds.standfirst,
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return <LegalPage doc={refunds} />;
}
