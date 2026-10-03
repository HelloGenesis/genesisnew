import type { Metadata } from "next";

import { CartPageView } from "@/components/genesis/cart-page";
import { pageMetadata } from "@/lib/seo";

/** /cart — the basket, the buyer's details, and the way on to Razorpay. See lib/cart. */
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Your Cart",
    description: "Review your Genesis subscriptions and pay-per-project work, then pay securely with Razorpay.",
    path: "/cart",
  }),
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageView />;
}
