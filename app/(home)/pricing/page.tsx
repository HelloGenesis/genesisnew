import type { Metadata } from "next";

import { pricingHub } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { PricingHubView } from "../components/pricing-hub";

/** /pricing — the four verticals' plans and the one-time projects. See lib/pricing. */
export const metadata: Metadata = pageMetadata({
  title: "Pricing & Subscriptions",
  description: pricingHub.body,
  path: "/pricing",
});

export default function PricingPage() {
  return <PricingHubView />;
}
