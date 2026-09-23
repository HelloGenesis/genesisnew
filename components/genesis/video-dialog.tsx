"use client";

import { clipRatio } from "@/lib/clip-shape";
import { filmUrl } from "@/lib/films";
import { mediaUrl } from "@/lib/media-url";
import { posterSrc } from "@/lib/poster";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { reelClip, reelPoster, type ReelId } from "@/lib/work";
import { cn } from "@/lib/utils";
import { Overlay, type OverlayPager } from "./overlay";

/** One clip to play in the window: which file, and what to call it. */
export type OpenVideo = { id: ReelId; label: string };

/**
 * A clip with no case study, played in a window of its own.
 *
 * Genesis's rule for every video on the page: "jiska case study hai woh
 * dikhe, jiska nahi hai uski sirf video play ho". A clip with a written
 * study opens the study. A clip without one used to open the portfolio's
 * window on the whole engagement — which led with the engagement's first
 * film, so the video that was clicked was often not the one that played.
 * This plays exactly that clip and nothing else.
 *
 * THE FULL FILM WHERE THERE IS ONE, the four-second preview otherwise —
 * `filmUrl` is undefined while Drive is switched off, and a window that
 * opened on nothing would be worse than one playing the preview.
 */
export function VideoDialog({
  video,
  onClose,
  pager,
}: {
  video: OpenVideo | null;
  onClose: () => void;
  pager?: OverlayPager;
}) {
  const ratio = video ? clipRatio(video.id) : 9 / 16;
  const landscape = ratio > 1;

  return (
    <Overlay
      open={video !== null}
      label={video?.label ?? "Video"}
      onClose={onClose}
      className={landscape ? "max-w-5xl" : "max-w-xl"}
      pager={pager}
    >
      {video && (
        <div className="flex flex-col items-center gap-4">
          <video
            // Keyed on the clip, so paging swaps the file rather than leaving
            // the previous film's frame up while the next one loads.
            key={String(video.id)}
            src={filmUrl(video.id) ?? mediaUrl(reelClip(video.id))}
            // Held back for a film that fails twice — see recoverFilm.
            data-preview={filmUrl(video.id) ? mediaUrl(reelClip(video.id)) : undefined}
            poster={posterSrc(mediaUrl(reelPoster(video.id)), 828)}
            controls
            autoPlay
            playsInline
            preload="metadata"
            {...VIDEO_GUARD_CLIENT}
            style={{ aspectRatio: ratio }}
            className={cn(
              "w-auto max-w-full rounded-2xl border border-[var(--glass-border)] bg-ink object-contain",
              landscape ? "h-[min(62vh,34rem)]" : "h-[min(74vh,40rem)]",
            )}
          />
          <p className="text-small text-ash">{video.label}</p>
        </div>
      )}
    </Overlay>
  );
}
