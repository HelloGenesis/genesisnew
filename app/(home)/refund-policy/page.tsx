import type { Metadata } from "next";

import { LegalPage } from "@/components/genesis/legal-page";
import { refunds } from "@/lib/legal-commerce";
import { pageMetadata } from "@/lib/seo";

/* Cancellations and refunds — see lib/legal-commerce. */
export const metadata: Metadata = pageMetadata({
  title: refunds.title,
  /* 140-160 characters (the standfirst alone was 93). */
  description: "When Genesis Media subscriptions, pay-per-project products and content shoots can be cancelled, what is refunded, how refunds are paid and how long they take.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return <LegalPage doc={refunds} />;
}
