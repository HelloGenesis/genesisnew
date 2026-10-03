"use client";

import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { pagerFor } from "@/components/genesis/overlay";
import { VideoDialog } from "@/components/genesis/video-dialog";
import { caseStudyForClip, caseStudyForPageSlug } from "@/lib/case-study-pages";
import { mediaUrl } from "@/lib/media-url";
import { posterSrc } from "@/lib/poster";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { reelClip, reelPoster, type ReelId } from "@/lib/work";
import { cn } from "@/lib/utils";

export type RailVideo = { id: ReelId; eyebrow: string; title: string; study?: string };

/** How long one slide takes, and how long a card holds before the next. */
const SLIDE_MS = 1100;
const HOLD_MS = 5500;

/**
 * THE AI LABS HERO'S RIGHT SIDE — portrait video cards in a row, after the
 * travel-site reference Genesis sent: a label and title on each, arrows and
 * a large counter under the row.
 *
 * IT MOVES SLOWLY, ON ITS OWN. Genesis: "make sure the slider slides
 * slowly". Each step is an eased 1.1s glide rather than the browser's quick
 * smooth-scroll, and the row advances by itself every few seconds — pausing
 * while the pointer is over it, while a window is open, and never under
 * Reduce Motion.
 *
 * ONE CLIP PLAYS AT A TIME — the current card, muted and looping; the rest
 * hold their poster.
 *
 * A CARD OPENS ITS STUDY. Clicking one opens the written case study where
 * there is one (the site's rule: "jiska case study hai woh dikhe, jiska
 * nahi hai uski sirf video play ho"), the film alone where there is not.
 * The window's arrows walk the same five cards in the rail's own order.
 */
export function VideoRail({ videos, label = "AI Labs work" }: { videos: readonly RailVideo[]; label?: string }) {
  const [active, setActive] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const reduce = useReducedMotion();
  const track = useRef<HTMLUListElement>(null);
  const animation = useRef(0);

  const entries = useMemo(
    () =>
      videos.map((video) => ({
        ...video,
        caseStudy: caseStudyForClip(video.id) ?? (video.study ? caseStudyForPageSlug(video.study) : undefined),
      })),
    [videos],
  );

  /* The slow glide: scrollLeft eased over SLIDE_MS with an ease-in-out curve. */
  const glideTo = useCallback(
    (index: number) => {
      const node = track.current;
      const card = node?.children[index] as HTMLElement | undefined;
      if (!node || !card) return;
      const from = node.scrollLeft;
      const to = Math.min(card.offsetLeft - node.offsetLeft, node.scrollWidth - node.clientWidth);
      cancelAnimationFrame(animation.current);
      if (reduce) {
        node.scrollLeft = to;
        return;
      }
      const start = performance.now();
      const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / SLIDE_MS);
        node.scrollLeft = from + (to - from) * ease(t);
        if (t < 1) animation.current = requestAnimationFrame(frame);
      };
      animation.current = requestAnimationFrame(frame);
    },
    [reduce],
  );

  useEffect(() => {
    glideTo(active);
  }, [active, glideTo]);

  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  /* Advance on its own, gently — paused on hover, while a window is open, and under Reduce Motion. */
  useEffect(() => {
    if (reduce || hovering || openIndex !== null) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % videos.length), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [active, hovering, openIndex, reduce, videos.length]);

  const step = (direction: 1 | -1) => setActive((index) => (index + direction + videos.length) % videos.length);
  const openCard = (index: number) => {
    setActive(index);
    setOpenIndex(index);
  };

  const opened = openIndex === null ? null : entries[openIndex];
  const pager = pagerFor(
    entries,
    openIndex ?? -1,
    (entry) => openCard(entries.indexOf(entry)),
    (entry) => `${entry.eyebrow} · ${entry.title}`,
  );

  return (
    <div onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
      <ul
        ref={track}
        data-lenis-prevent
        aria-label={label}
        className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {entries.map((video, index) => {
          const selected = index === active;
          return (
            <li key={String(video.id)} className="w-[46%] shrink-0 sm:w-[38%]">
              <button
                type="button"
                onClick={() => openCard(index)}
                onFocus={() => setActive(index)}
                aria-label={`${video.eyebrow}: ${video.title}: ${video.caseStudy ? "open the case study" : "play the film"}`}
                data-track={`ai-hero-card:${video.title}`}
                className={cn(
                  "group relative block aspect-[9/14] w-full overflow-hidden rounded-panel border bg-ink text-left transition-[border-color,box-shadow,opacity] duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
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
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
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
        {/*
          THE ONE PROGRESS LINE, between the arrows and the number (Genesis,
          2 Oct 2026: "keep the gradient line between arrows and 05, remove
          the other"): it fills in the site's gradient as the clips go by.
        */}
        <span aria-hidden className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-white/15">
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${((active + 1) / videos.length) * 100}%`,
              background: "linear-gradient(115deg, #8b5cf6 0%, #c066d9 30%, #f2607e 65%, #f5923e 100%)",
            }}
          />
        </span>
        <p className="font-display text-h2 font-normal leading-none text-bone" aria-live="polite">
          {String(active + 1).padStart(2, "0")}
          <span className="sr-only"> of {videos.length}</span>
        </p>
      </div>

      <CaseStudyDialog
        study={opened?.caseStudy ?? null}
        startClip={opened ? String(opened.id) : undefined}
        onClose={() => setOpenIndex(null)}
        pager={pager}
      />
      <VideoDialog
        video={opened && !opened.caseStudy ? { id: opened.id, label: `${opened.eyebrow} · ${opened.title}` } : null}
        onClose={() => setOpenIndex(null)}
        pager={pager}
      />
    </div>
  );
}
