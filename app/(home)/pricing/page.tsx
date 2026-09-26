import type { Metadata } from "next";

import { pricingHub } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { PricingHubView } from "../components/pricing-hub";

/** /pricing — every Genesis membership and one-time product. See lib/pricing. */
export const metadata: Metadata = pageMetadata({
  title: "Pricing & Memberships",
  description: `${pricingHub.body[0]} ${pricingHub.body[1]}`,
  path: "/pricing",
});

export default function PricingPage() {
  return <PricingHubView />;
}
