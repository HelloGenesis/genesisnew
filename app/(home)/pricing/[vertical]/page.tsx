import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findVertical, pricingPath, verticals } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { PricingPageView } from "../../components/pricing-page";

/**
 * /pricing/influence, /pricing/ai-labs, /pricing/studios, /pricing/brand-design
 * — one page per vertical, each with its own membership, one-time products,
 * join link and 15-minute call. See lib/pricing for the copy.
 */
type Props = { params: Promise<{ vertical: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return verticals.map((vertical) => ({ vertical: vertical.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vertical = findVertical((await params).vertical);
  if (!vertical) return {};
  const { membership } = vertical;
  return pageMetadata({
    title: `${membership.name} — ${vertical.division} Pricing`,
    description: `${membership.tagline} ${membership.price} ${membership.period}.`,
    path: pricingPath(vertical.slug),
  });
}

export default async function VerticalPricingPage({ params }: Props) {
  const vertical = findVertical((await params).vertical);
  if (!vertical) notFound();
  return <PricingPageView vertical={vertical} />;
}
