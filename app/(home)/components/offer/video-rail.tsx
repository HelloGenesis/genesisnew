"use client";

import { ArrowLeft, ArrowRight, Maximize2, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { VideoDialog, type OpenVideo } from "@/components/genesis/video-dialog";
import { mediaUrl } from "@/lib/media-url";
import { posterSrc } from "@/lib/poster";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { reelClip, reelPoster, type ReelId } from "@/lib/work";
import { cn } from "@/lib/utils";

export type RailVideo = { id: ReelId; eyebrow: string; title: string };

/**
 * THE AI LABS HERO'S RIGHT SIDE — a row of portrait video cards after the
 * travel-site reference Genesis sent: a label and title on each, arrows and
 * a large counter under the row, and an expand button in the corner.
 *
 * ONE CLIP PLAYS AT A TIME. The chosen card runs muted and looping; the
 * others hold their poster. Six videos decoding at once is what makes a
 * phone stutter, and the one playing is the one the reader chose.
 *
 * The expand button opens the site's own video window on that clip — the
 * full film where there is one, the preview otherwise.
 */
export function VideoRail({ videos }: { videos: readonly RailVideo[] }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<OpenVideo | null>(null);
  const track = useRef<HTMLUListElement>(null);

  // Keep the chosen card in view as the arrows move through the row.
  useEffect(() => {
    const node = track.current;
    const card = node?.children[active] as HTMLElement | undefined;
    if (!node || !card) return;
    node.scrollTo({ left: card.offsetLeft - node.offsetLeft, behavior: "smooth" });
  }, [active]);

  const step = (direction: 1 | -1) => setActive((index) => (index + direction + videos.length) % videos.length);
  const current = videos[active];

  return (
    <div className="relative">
      <ul
        ref={track}
        data-lenis-prevent
        aria-label="AI Labs work"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((video, index) => {
          const selected = index === active;
          return (
            <li key={String(video.id)} className="w-[46%] shrink-0 snap-start sm:w-[38%]">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${video.eyebrow}: ${video.title}`}
                aria-pressed={selected}
                className={cn(
                  "group relative block aspect-[9/14] w-full overflow-hidden rounded-panel border bg-ink text-left transition-[transform,border-color,box-shadow] duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  selected
                    ? "border-brand/60 shadow-[0_24px_64px_-24px_rgb(255_197_22/0.45)]"
                    : "border-white/15 opacity-80 hover:opacity-100",
                )}
              >
                {selected ? (
                  <video
                    key={String(video.id)}
                    src={mediaUrl(reelClip(video.id))}
                    poster={posterSrc(mediaUrl(reelPoster(video.id)), 828)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    {...VIDEO_GUARD_CLIENT}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a poster at card size; next/image adds nothing a lazy <img> does not */}
                    <img
                      src={posterSrc(mediaUrl(reelPoster(video.id)), 828)}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md">
                      <Play className="size-4 translate-x-px" fill="currentColor" aria-hidden />
                    </span>
                  </>
                )}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <span aria-hidden className="block h-px w-4 bg-brand" />
                  <span className="mt-2 block text-[0.6875rem] uppercase tracking-[0.14em] text-white/70">
                    {video.eyebrow}
                  </span>
                  <span className="mt-1 block font-sans text-body leading-tight text-white">{video.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          aria-label="Previous video"
          onClick={() => step(-1)}
          className="grid size-11 place-items-center rounded-full border border-white/20 text-bone transition-colors hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next video"
          onClick={() => step(1)}
          className="grid size-11 place-items-center rounded-full border border-white/20 text-bone transition-colors hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
        <span aria-hidden className="mx-2 h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
        <p className="font-display text-h2 font-normal leading-none text-bone" aria-live="polite">
          {String(active + 1).padStart(2, "0")}
          <span className="sr-only"> of {videos.length}</span>
        </p>
        <button
          type="button"
          aria-label={`Watch ${current.title} full screen`}
          onClick={() => setOpen({ id: current.id, label: `${current.eyebrow} · ${current.title}` })}
          className="grid size-11 place-items-center rounded-card border border-white/20 bg-white/5 text-bone transition-colors hover:border-brand/60 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Maximize2 className="size-4" aria-hidden />
        </button>
      </div>

      <VideoDialog video={open} onClose={() => setOpen(null)} />
    </div>
  );
}
