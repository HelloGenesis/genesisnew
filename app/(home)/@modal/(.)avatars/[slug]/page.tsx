import { notFound } from "next/navigation";

import { AvatarDetail } from "@/components/genesis/avatar-detail";
import { RouteModal } from "@/components/genesis/route-modal";
import { findAvatar } from "@/lib/avatars";

/**
 * The same avatar, intercepted into a dialog when reached from inside the
 * app. A cold load or a refresh bypasses the interception and renders the
 * real page — a window while browsing, a page when shared.
 */
export default async function AvatarModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const avatar = findAvatar(slug);
  if (!avatar) notFound();

  return (
    <RouteModal label={`${avatar.name}, AI avatar`}>
      {/*
        `paged` is the dialog's to pass. The slider steps by navigating, and a
        navigation to a sibling avatar is intercepted back into this same
        slot — so inside the window it swaps the contents, and from the
        standalone page it would stack a second window on top. See the note on
        the prop.
      */}
      <AvatarDetail avatar={avatar} paged />
    </RouteModal>
  );
}
