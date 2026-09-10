"use client";

import { findAvatar } from "@/lib/avatars";
import { AvatarDetail } from "./avatar-detail";
import { Overlay } from "./overlay";

/**
 * An AI avatar, opened over the landing page.
 *
 * These were routes — /avatars/<name>, intercepted into a modal when reached
 * from the page — and the pager stepped between them by rewriting the URL.
 * With the separate pages gone, stepping is state: `onNavigate` swaps which
 * avatar is showing and the panel stays open, which is also why the shell
 * keeps its lock steady across re-renders.
 */
export function AvatarDialog({
  id,
  onClose,
  onNavigate,
}: {
  id: string | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const avatar = id ? findAvatar(id) : undefined;
  return (
    <Overlay
      open={Boolean(avatar)}
      label={avatar ? `${avatar.name}, AI avatar` : "AI avatar"}
      onClose={onClose}
      className="max-w-5xl"
    >
      {avatar && <AvatarDetail avatar={avatar} onNavigate={onNavigate} />}
    </Overlay>
  );
}
