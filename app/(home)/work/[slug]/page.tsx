import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkDetail } from "@/components/genesis/work-detail";
import { findWork, work } from "@/lib/work";
import { siteConfig } from "@/lib/site-config";

/**
 * /work/<slug> — a project's permanent home.
 *
 * This page is the real destination; the modal over the grid is an
 * interception of this route. That ordering matters and it is the whole point
 * of the brief's "give every project a shareable URL": the page works with
 * JavaScript disabled, on a cold load, in a crawler, and when pasted into a
 * WhatsApp thread or a proposal. The gallery experience is a nicety layered
 * on top of it, not the thing itself.
 */

export function generateStaticParams() {
  return work.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = findWork(slug);
  if (!item) return {};

  const title = `${item.client} · ${item.title}`;
  return {
    title,
    description: `${item.vertical} · ${item.format} for ${item.client}, by ${siteConfig.name}.`,
    // The point of a shareable URL is that it looks like something when
    // shared, so the still is the card image where one exists.
    openGraph: {
      title,
      type: "article",
      images: item.art ? [{ url: item.art }] : undefined,
    },
  };
}

export default async function WorkProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findWork(slug);
  if (!item) notFound();

  return (
    <main className="relative min-h-dvh pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="mx-auto w-full max-w-4xl px-6">
        <WorkDetail item={item} />
      </div>
    </main>
  );
}
