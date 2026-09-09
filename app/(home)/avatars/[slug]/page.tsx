import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AvatarDetail } from "@/components/genesis/avatar-detail";
import { avatars, findAvatar } from "@/lib/avatars";
import { siteConfig } from "@/lib/site-config";

/**
 * /avatars/<slug> — an AI avatar's permanent page.
 *
 * Same shape as /work/<slug>, and for the same reason: the roster opens as a
 * window while browsing, but each avatar is a real URL that can be sent to a
 * brand considering one. The modal is an interception of this route, not a
 * lightbox.
 */
export function generateStaticParams() {
  return avatars.map((a) => ({ slug: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const avatar = findAvatar(slug);
  if (!avatar) return {};
  return {
    title: `${avatar.name}, AI avatar`,
    description:
      avatar.bio ??
      `${avatar.name}, an AI avatar from ${siteConfig.name}'s AI Lab.`,
  };
}

export default async function AvatarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const avatar = findAvatar(slug);
  if (!avatar) notFound();

  return (
    <main className="relative min-h-dvh pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="mx-auto w-full max-w-4xl px-6">
        <AvatarDetail avatar={avatar} />
      </div>
    </main>
  );
}
